// src/ide/utils/ble-comm.js

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const NUS_SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const NUS_RX_CHAR_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e'; 
const NUS_TX_CHAR_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e'; 

export class BLECommunication {
    constructor() {
        this.device = null;
        this.server = null;
        this.rxCharacteristic = null;
        this.txCharacteristic = null;
        this.isConnected = false;
        this.useWriteWithResponse = false;
        
        this.onDataCallback = null;
        this.onDisconnectCallback = null;
        
        this.encoder = new TextEncoder();
        this.decoder = new TextDecoder('utf-8');
        
        this._readBuffer = '';
        this._readResolver = null;
        this._readRejecter = null;
        this._readTerminator = null;
        this._readTimeoutId = null;
    }

    async scan() {
        console.log("[BLE] Checking support...");
        if (!navigator.bluetooth) throw new Error('Web Bluetooth API missing.');

        try {
            this.device = await navigator.bluetooth.requestDevice({
                filters: [{ services: [NUS_SERVICE_UUID] }],
                optionalServices: [NUS_SERVICE_UUID]
            });
            console.log(`[BLE] Selected: ${this.device.name}`);
        } catch (e) {
            console.warn("[BLE] Scan cancelled:", e);
            throw e;
        }

        this.device.addEventListener('gattserverdisconnected', this.handleDisconnect.bind(this));
        return this.device;
    }

    async connect(device) {
        if (!device) throw new Error("Device not provided.");
        const targetDevice = device;
        
        const MAX_RETRIES = 3;
        let attempt = 0;

        while (attempt < MAX_RETRIES) {
            attempt++;
            if (attempt > 1) console.log(`[BLE] Retry Attempt ${attempt}...`);
            
            try {
                // 1. Cleanup previous state
                if (targetDevice.gatt.connected) {
                    targetDevice.gatt.disconnect();
                }
                // Allow browser Bluetooth stack to clear
                await sleep(500);

                this.device = targetDevice;

                // 2. Connect
                console.log('[BLE] Connecting GATT...');
                this.server = await this.device.gatt.connect();
                console.log(`[BLE] Connected. Stabilizing...`);

                // 3. Stabilization Delay (Critical for ESP32)
                await sleep(1000); 

                console.log('[BLE] Getting Service...');
                const service = await this.server.getPrimaryService(NUS_SERVICE_UUID);
                
                this.rxCharacteristic = await service.getCharacteristic(NUS_RX_CHAR_UUID);
                this.txCharacteristic = await service.getCharacteristic(NUS_TX_CHAR_UUID);

                const props = this.rxCharacteristic.properties;
                this.useWriteWithResponse = !!props.write; // Default to Response if available, else NoResponse
                if (props.writeWithoutResponse) this.useWriteWithResponse = false;

                await this.txCharacteristic.startNotifications();
                this.txCharacteristic.addEventListener('characteristicvaluechanged', this.handleNotifications.bind(this));
                
                this.isConnected = true;
                console.log('[BLE] Ready.');
                return; // Success

            } catch (error) {
                console.warn(`[BLE] Attempt ${attempt} failed:`, error.message);
                
                // Special handling for "Disconnected" error (Device not ready)
                if (error.message.includes("disconnected") || error.message.includes("connection attempt failed")) {
                    console.log("[BLE] Device likely rebooting. Waiting longer...");
                    await sleep(2000); // Wait longer for this specific error
                } else {
                    await sleep(1000);
                }

                if (attempt >= MAX_RETRIES) {
                    this.handleDisconnect();
                    throw error;
                }
            }
        }
    }

    handleNotifications(event) {
        const value = event.target.value;
        const data = this.decoder.decode(value, { stream: true });
        
        if (this._readResolver) {
            this._readBuffer += data;
            if (this._readBuffer.includes(this._readTerminator)) {
                const index = this._readBuffer.indexOf(this._readTerminator);
                const cutOff = index + this._readTerminator.length;
                const result = this._readBuffer.substring(0, cutOff);
                this._readBuffer = this._readBuffer.substring(cutOff);
                
                if (this._readTimeoutId) clearTimeout(this._readTimeoutId);
                const resolve = this._readResolver;
                this._readResolver = null;
                this._readRejecter = null;
                this._readTerminator = null;
                resolve(result);
                return; 
            }
        } 
        
        if (this.onDataCallback && !this._readResolver) {
            this.onDataCallback(data);
        }
    }

    async sendData(data) {
        if (!this.rxCharacteristic) throw new Error('Not connected.');
        
        const chunkSize = 20; 
        
        for (let i = 0; i < data.length; i += chunkSize) {
            const chunk = data.substring(i, i + chunkSize);
            const encoded = this.encoder.encode(chunk);
            
            try {
                if (this.useWriteWithResponse) {
                    await this.rxCharacteristic.writeValue(encoded);
                } else {
                    await this.rxCharacteristic.writeValueWithoutResponse(encoded);
                }
                await sleep(30); 
            } catch (e) {
                console.error("[BLE] Write Error:", e);
                // If congestion occurs, wait longer and retry once
                if (e.message.includes("in progress")) {
                    await sleep(100);
                    try {
                        if (this.useWriteWithResponse) await this.rxCharacteristic.writeValue(encoded);
                        else await this.rxCharacteristic.writeValueWithoutResponse(encoded);
                    } catch (retryErr) { throw retryErr; }
                } else {
                    throw e;
                }
            }
        }
    }

    disconnect() {
        if (this.server && this.server.connected) {
            this.server.disconnect();
        } else {
            this.handleDisconnect();
        }
    }

    handleDisconnect() {
        console.log('[BLE] Disconnected.');
        this.isConnected = false;
        this.device = null;
        this.server = null;
        
        if (this._readRejecter) {
            this._readRejecter(new Error("BLE Disconnected"));
            this._readResolver = null;
        }

        if (this.onDisconnectCallback) {
            this.onDisconnectCallback();
        }
    }

    onData(callback) { this.onDataCallback = callback; }
    onDisconnect(callback) { this.onDisconnectCallback = callback; }
    startReadLoop() {}
    stopReadLoop() {}

    // --- RAW REPL ---

    async readUntil(terminator, timeout = 5000) {
        if (!this.isConnected) throw new Error("Not connected.");
        if (this._readResolver) throw new Error("Read in progress.");

        if (this._readBuffer.includes(terminator)) {
            const index = this._readBuffer.indexOf(terminator);
            const cutOff = index + terminator.length;
            const result = this._readBuffer.substring(0, cutOff);
            this._readBuffer = this._readBuffer.substring(cutOff);
            return result;
        }

        return new Promise((resolve, reject) => {
            this._readTerminator = terminator;
            this._readResolver = resolve;
            this._readRejecter = reject;

            this._readTimeoutId = setTimeout(() => {
                const cap = this._readBuffer;
                this._readResolver = null;
                this._readRejecter = null;
                this._readTerminator = null;
                // Reject to trigger retry
                reject(new Error(`BLE Read Timeout. Waiting for '${terminator}'`));
            }, timeout);
        });
    }

    async enterRawREPL() {
        console.log("[BLE] Entering Raw REPL...");
        
        await this.sendData('\r');
        await sleep(100);
        this._readBuffer = '';

        await this.sendData('\x03'); 
        await sleep(250);
        await this.sendData('\x03'); 
        await sleep(250);

        await this.sendData('\x01'); 
        
        try {
            await this.readUntil('raw REPL', 4000);
            try { await this.readUntil('>', 1000); } catch(e){}
            console.log("[BLE] Raw REPL entered.");
        } catch (e) {
            console.warn("[BLE] Retrying entry...", e);
            await this.sendData('\x02'); 
            await sleep(500);
            await this.sendData('\x03'); 
            await sleep(500);
            await this.sendData('\x01'); 
            await this.readUntil('raw REPL', 5000);
            try { await this.readUntil('>', 1000); } catch(e){}
        }
    }

    async exitRawREPL() {
        try { await this.sendData('\x02'); await sleep(200); } catch(e) {}
    }

    async rawREPL_execute(command, timeout = 20000) {
        this._readBuffer = '';
        await this.sendData(command);
        await sleep(50);
        await this.sendData('\x04'); 
        
        let response = await this.readUntil('\x04', timeout);
        if (response.startsWith('OK')) {
            let payload = response.substring(2, response.length - 1);
            let errorPart = await this.readUntil('\x04', timeout);
            let errorMsg = errorPart.substring(0, errorPart.length - 1);
            if (errorMsg.length > 0) throw new Error(`Device Error: ${errorMsg}`);
            return payload;
        } else {
            throw new Error(`Protocol Error`);
        }
    }

    async sendCommandAndGetResponse(command, timeout = 5000) {
        try {
            await this.enterRawREPL();
            const res = await this.rawREPL_execute(command, timeout);
            await this.exitRawREPL();
            return res;
        } catch (e) {
            try { await this.exitRawREPL(); } catch {}
            throw e;
        }
    }
}