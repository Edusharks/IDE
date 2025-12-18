// src/ide/utils/serial-comm.js
'use strict';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export class SerialCommunication {
    constructor() {
        this.port = null;
        this.reader = null;
        this.writer = null;
        this.isConnected = false;
        this.isReadLoopActive = false;
        this.onDataCallback = null;
        this.onDisconnectCallback = null;
        this.onReconnectCallback = null;
        this.deviceInfo = null;
        this._isManualDisconnect = false;
        this._reconnectInterval = null;
        this.decoder = new TextDecoder();
        this.encoder = new TextEncoder();
    }

    isSupported() { return 'serial' in navigator; }

    async connect(options = { baudRate: 115200 }) {
        if (!this.isSupported()) throw new Error('Web Serial API is not supported.');
        this._isManualDisconnect = false;
        this.stopAutoReconnect();
        try {
            this.port = await navigator.serial.requestPort();
            this.deviceInfo = this.port.getInfo();
            await this.port.open(options);
            this.isConnected = true;
            this.writer = this.port.writable.getWriter();
            this.port.addEventListener('disconnect', this.handleDisconnect.bind(this));
            this.startReadLoop();
            return { success: true, message: 'Connected successfully.' };
        } catch (error) {
            this.handleDisconnect();
            if (error.name === 'NotFoundError') return { success: false, message: 'No port selected.' };
            throw error;
        }
    }

    async disconnect() {
        if (!this.port) return;
        this._isManualDisconnect = true;
        this.stopAutoReconnect();
        this.stopReadLoop();
        
        try {
            if (this.port.writable) {
                await this.port.setSignals({ dataTerminalReady: false, requestToSend: false });
            }
            if (this.writer) await this.writer.close().catch(() => {});
            if (this.port) await this.port.close().catch(() => {});
        } finally {
            this.handleDisconnect();
        }
    }

    handleDisconnect() {
        const wasConnected = this.isConnected;
        const wasManual = this._isManualDisconnect;
        this.isConnected = false;
        this.port = null;
        this.reader = null;
        this.writer = null;
        this.stopReadLoop();
        this.stopAutoReconnect();
        this._isManualDisconnect = false;
        if (wasConnected && this.onDisconnectCallback) this.onDisconnectCallback();
        if (!wasManual && this.deviceInfo) this.startAutoReconnect();
    }

    startReadLoop() {
        if (this.isReadLoopActive || !this.port?.readable) return;
        this.isReadLoopActive = true;
        this.reader = this.port.readable.getReader();
        (async () => {
            while (this.isReadLoopActive) {
                try {
                    const { value, done } = await this.reader.read();
                    if (done) break;
                    if (this.onDataCallback) this.onDataCallback(this.decoder.decode(value));
                } catch (error) {
                    break;
                }
            }
            this.isReadLoopActive = false;
        })();
    }

    async stopReadLoop() {
        if (!this.reader) {
            this.isReadLoopActive = false;
            return;
        }
        
        this.isReadLoopActive = false; 
        try {
            await this.reader.cancel(); 
        } catch (error) {
        } finally {
            try { 
                this.reader.releaseLock(); 
            } catch(e) {
                console.warn("Release lock error:", e);
            }
            this.reader = null;
        }
    }


    async sendData(data) {
        if (!this.writer) throw new Error('Writer is not available.');
        await this.writer.write(this.encoder.encode(data));
    }

    onData(callback) { this.onDataCallback = callback; }
    onDisconnect(callback) { this.onDisconnectCallback = callback; }
    onReconnect(callback) { this.onReconnectCallback = callback; }


    startAutoReconnect() {
        if (!this.deviceInfo || this._reconnectInterval) return;
        this._reconnectInterval = setInterval(async () => {
            try {
                const availablePorts = await navigator.serial.getPorts();
                const matchingPort = availablePorts.find(p => {
                    const info = p.getInfo();
                    return info.usbVendorId === this.deviceInfo.usbVendorId &&
                           info.usbProductId === this.deviceInfo.usbProductId;
                });

                if (matchingPort) {
                    this.stopAutoReconnect();
                    this.port = matchingPort;
                    await this.port.open({ baudRate: 115200 });
                    this.isConnected = true;
                    this.writer = this.port.writable.getWriter();
                    this.port.addEventListener('disconnect', this.handleDisconnect.bind(this));
                    
                    if (this.onReconnectCallback) {
                        this.onReconnectCallback();
                    }
                    this.startReadLoop();
                }
            } catch (error) {
                // Ignore, interval will try again
            }
        }, 2000);
    }

    stopAutoReconnect() {
        if (this._reconnectInterval) {
            clearInterval(this._reconnectInterval);
            this._reconnectInterval = null;
        }
    }

    async readUntil(terminator, timeout) {
        if (!this.port?.readable) throw new Error("Port not connected or not readable.");
        
        const tempReader = this.port.readable.getReader();
        let buffer = '';
        let timedOut = false;

        try {
            const startTime = Date.now();
            
            while (true) {
                const elapsedTime = Date.now() - startTime;
                const timeLeft = timeout - elapsedTime;
                
                if (timeLeft <= 0) {
                    timedOut = true;
                    break;
                }

                const { value, done } = await Promise.race([
                    tempReader.read(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), timeLeft))
                ]);

                if (done) break;
                
                buffer += this.decoder.decode(value, { stream: true });
                if (buffer.includes(terminator)) {
                    return buffer;
                }
            }
        } catch (e) {
            if (e.message === 'TIMEOUT') {
                timedOut = true;
            } else {
                throw e;
            }
        } finally {
            if (timedOut) {
                try {
                    await tempReader.cancel();
                } catch (e) { console.warn("Cancel failed", e); }
            }
            tempReader.releaseLock();
        }
        
        throw new Error(`Read timed out after ${timeout}ms. Buffer: "${buffer.slice(-100)}..."`);
    }

    // --- RAW REPL METHODS (Now Public) ---

    async enterRawREPL() {
        // 1. Send CTRL-C twice to interrupt any running program
        await this.sendData('\x03'); await sleep(100);
        await this.sendData('\x03'); await sleep(100);
        
        // 2. Flush buffer (best effort)
        try {
            if(this.port.readable) {
                const tempReader = this.port.readable.getReader();
                // Read once quickly to clear any pending bytes
                await Promise.race([tempReader.read(), new Promise(r => setTimeout(r, 50))]).catch(()=>{});
                // If read is pending, we must cancel
                await tempReader.cancel().catch(()=>{});
                tempReader.releaseLock();
            }
        } catch(e) {}

        // 3. Send CTRL-A to enter Raw REPL mode
        await this.sendData('\x01'); await sleep(50);
        
        try {
            // Wait for the specific Raw REPL prompt
            await this.readUntil('raw REPL; CTRL-B to exit\r\n>', 2000);
        } catch (e) {
            console.warn("Raw REPL prompt missed or delayed. Retrying entry...", e);
            // Retry sequence once
            await this.sendData('\x03'); await sleep(100);
            await this.sendData('\x01'); 
            await this.readUntil('raw REPL; CTRL-B to exit\r\n>', 3000);
        }
    }

    async exitRawREPL() {
        // Send CTRL-B to exit Raw REPL
        await this.sendData('\x02');
        await sleep(50);
    }
    
    async rawREPL_execute(command, timeout = 5000) {
        // Send command followed by CTRL-D (execute)
        await this.sendData(command + '\x04');
        
        // Wait for the result (ended by CTRL-D)
        const response = await this.readUntil('\x04', timeout);

        if (response.includes('Traceback')) {
            const errorLine = response.split('\r\n').find(line => line.includes('Error:')) || 'MicroPython Error on Device';
            throw new Error(errorLine.trim());
        }
        
        // Parse valid OK response
        const okIndex = response.indexOf('OK');
        const ctrlDIndex = response.indexOf('\x04');

        if (okIndex !== -1 && ctrlDIndex > okIndex) {
            return response.substring(okIndex + 2, ctrlDIndex);
        }
        
        // Fallback for weird responses
        return '';
    }

    // Legacy wrapper to ensure backward compatibility if called directly
    async sendCommandAndGetResponse(command, timeout = 5000) {
        if (!this.isConnected) throw new Error("Not Connected");
        try {
            await this.enterRawREPL();
            const result = await this.rawREPL_execute(command, timeout);
            return result;
        } catch (error) {
            console.error(`sendCommandAndGetResponse failed for command: "${command.slice(0, 50)}..."`, error);
            throw error;
        } finally {
            await this.exitRawREPL().catch(e => console.warn("Could not cleanly exit raw REPL.", e));
        }
    }
}