// src/ide/utils/webrepl.js

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export class WebREPLCommunication {
    constructor() {
        this.ws = null;
        this.url = null;
        this.isConnected = false;
        this.isAuthenticated = false; // New flag
        this.onDataCallback = null;
        this.onDisconnectCallback = null;
        
        // Internal buffering for readUntil
        this._readResolver = null;
        this._readRejecter = null;
        this._readBuffer = '';
        this._readTerminator = null;
        this._readTimeoutId = null;
    }

    async connect(host, port = 8266, password = '') {
        // Sanitize host
        host = host.replace(/^https?:\/\//, '').replace(/^ws:\/\//, '').split(':')[0].split('/')[0];
        this.url = `ws://${host}:${port}/`;

        return new Promise((resolve, reject) => {
            console.log(`[DEBUG] Connecting to WebREPL: ${this.url}`);

            if (this.ws) {
                try {
                    this.ws.onclose = null;
                    this.ws.onerror = null;
                    this.ws.close();
                } catch(e) {}
            }

            let connectTimeout;
            try {
                this.ws = new WebSocket(this.url);
                this.ws.binaryType = 'arraybuffer'; 
            } catch (e) {
                return reject(e);
            }

            const cleanupListeners = () => {
                clearTimeout(connectTimeout);
            };

            connectTimeout = setTimeout(() => {
                cleanupListeners();
                if(this.ws) this.ws.close();
                reject(new Error('Connection timeout (10s). Device unreachable.'));
            }, 10000);

            this.ws.onopen = () => {
                console.log("[DEBUG] WebSocket Open");
            };

            this.ws.onmessage = (event) => {
                let data = event.data;
                if (data instanceof ArrayBuffer) {
                    data = new TextDecoder("utf-8").decode(data);
                }

                // --- AUTHENTICATION LOGIC ---
                if (!this.isAuthenticated) {
                    if (data.includes('Password:')) {
                        console.log("[DEBUG] Sending WebREPL Password...");
                        this.ws.send(password + '\n');
                        return;
                    }
                    if (data.includes('Access denied')) {
                        cleanupListeners();
                        this.ws.close();
                        reject(new Error('WebREPL Access Denied (Wrong Password)'));
                        return;
                    }
                    if (data.includes('WebREPL connected')) {
                        cleanupListeners();
                        this.isConnected = true;
                        this.isAuthenticated = true;
                        console.log("[DEBUG] WebREPL Authenticated!");
                        resolve({ success: true, message: 'Connected via WebREPL.' });
                        return;
                    }
                }

                // --- NORMAL OPERATION ---

                // Active Read
                if (this._readResolver) {
                    this._readBuffer += data;
                    if (this._readBuffer.includes(this._readTerminator)) {
                        clearTimeout(this._readTimeoutId);
                        this._readResolver(this._readBuffer);
                        this._resetReader();
                        return; 
                    }
                } 
                
                // Passive Monitoring
                if (this.onDataCallback) {
                    this.onDataCallback(data);
                }
            };

            this.ws.onerror = (error) => {
                console.error("[DEBUG] WebSocket Error", error);
                if (!this.isConnected) {
                    cleanupListeners();
                    reject(new Error('WebSocket connection failed.'));
                }
            };

            this.ws.onclose = () => {
                console.log("[DEBUG] WebSocket Closed");
                cleanupListeners();
                this.isConnected = false;
                this.isAuthenticated = false;
                if (this._readRejecter) {
                    this._readRejecter(new Error("WebSocket closed during read."));
                    this._resetReader();
                }
                if (this.onDisconnectCallback) {
                    this.onDisconnectCallback();
                }
            };
        });
    }

    // ... (rest of methods like _resetReader, readUntil, sendData etc. remain same as previous version) ...
    // NOTE: Keep the rest of the file exactly as I provided in the previous step.
    
    _resetReader() {
        this._readResolver = null;
        this._readRejecter = null;
        this._readTerminator = null;
        this._readBuffer = ''; 
        if (this._readTimeoutId) clearTimeout(this._readTimeoutId);
    }

    startReadLoop() { }
    stopReadLoop() { }

    async readUntil(terminator, timeout = 5000) {
        if (!this.isConnected) throw new Error("Not connected.");
        if (this._readResolver) throw new Error("Read already in progress.");

        return new Promise((resolve, reject) => {
            this._readBuffer = ''; 
            this._readTerminator = terminator;
            this._readResolver = resolve;
            this._readRejecter = reject;

            this._readTimeoutId = setTimeout(() => {
                const capturedBuffer = this._readBuffer;
                this._resetReader(); // Reset first
                reject(new Error(`Read timed out after ${timeout}ms waiting for "${terminator}". Buffer: ${capturedBuffer.slice(-100)}`));
            }, timeout);
        });
    }

    disconnect() {
        if (this.ws) this.ws.close();
        this.isConnected = false;
        this.isAuthenticated = false;
    }

    async sendData(data) {
        if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
             throw new Error('Not connected to WebREPL');
        }
        this.ws.send(data);
        return Promise.resolve();
    }

    onData(callback) { this.onDataCallback = callback; }
    onDisconnect(callback) { this.onDisconnectCallback = callback; }

    async enterRawREPL() {
        if (!this.isConnected) throw new Error("Not connected to WebREPL");

        console.log("[DEBUG] Entering Raw REPL...");

        await this.sendData('\x03'); 
        await sleep(300); 
        await this.sendData('\x03');
        await sleep(300);

        this._readBuffer = ''; 
        await this.sendData('\r'); 
        
        try {
            await this.readUntil('>>>', 1500);
        } catch (e) {
            console.log("[DEBUG] Prompt not found immediately, forcing Raw mode anyway...");
        }

        await this.sendData('\x01'); 
        
        try {
            await this.readUntil('raw REPL; CTRL-B to exit\r\n>', 4000);
            console.log("[DEBUG] Raw REPL entered.");
        } catch (e) {
            console.warn("First Raw REPL attempt timed out. Retrying...");
            if (!this.isConnected) throw new Error("Connection lost during Raw REPL entry");
            
            await this.sendData('\x03'); 
            await sleep(500);
            await this.sendData('\x01');
            await this.readUntil('raw REPL; CTRL-B to exit\r\n>', 5000);
            console.log("[DEBUG] Raw REPL entered on retry.");
        }
    }

    async exitRawREPL() {
        if (!this.isConnected) return;
        try {
            await this.sendData('\x02'); 
            await sleep(200); 
        } catch(e) {
            console.warn("Error exiting Raw REPL", e);
        }
    }

    async rawREPL_execute(command, timeout = 20000) {
        if (!this.isConnected) throw new Error("Not connected");
        
        await this.sendData(command);
        await sleep(50);
        await this.sendData('\x04');
        
        let response = await this.readUntil('\x04', timeout);
        
        if (response.startsWith('OK')) {
            let payload = response.substring(2, response.length - 1);
            let errorPart = await this.readUntil('\x04', timeout);
            let errorMsg = errorPart.substring(0, errorPart.length - 1);
            
            if (errorMsg.length > 0) {
                throw new Error(`Device Error: ${errorMsg}`);
            }
            
            return payload;
        } else {
            try { await this.readUntil('>', 500); } catch(e) {}
            throw new Error(`Raw REPL Protocol Violation. Expected 'OK', got: ${response.slice(0, 50)}`);
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