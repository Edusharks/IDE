// src/renderer/utils/serial-comm.js (WEB SERIAL API VERSION - RE-ARCHITECTED)

class SerialCommunication {
    constructor() {
        this.port = null;
        this.reader = null;
        this.writer = null;
        this.isConnected = false;
        this.onDataCallback = null;
        this.onDisconnectCallback = null;
        this.isListenerAttached = true;
        this.readLoopPromise = null;

        // DEFINITIVE FIX: Use simple encoder/decoder instead of streams
        this.decoder = new TextDecoder();
        this.encoder = new TextEncoder();
    }

    isSupported() {
        return 'serial' in navigator;
    }

    async connect(options = { baudRate: 115200 }) {
        if (!this.isSupported()) {
            alert('Web Serial API is not supported by your browser. Please use Google Chrome or Microsoft Edge.');
            throw new Error('Web Serial API not supported.');
        }

        try {
            this.port = await navigator.serial.requestPort();
            await this.port.open(options);
            this.isConnected = true;
            this.isListenerAttached = true;

            // DEFINITIVE FIX: Get reader and writer directly from the port
            this.reader = this.port.readable.getReader();
            this.writer = this.port.writable.getWriter();

            this.readLoopPromise = this.readLoop();

            this.port.addEventListener('disconnect', () => {
                this.handleDisconnect();
            });

            return { success: true, message: 'Connected successfully.' };

        } catch (error) {
            if (error.name === 'NotFoundError') {
                return { success: false, message: 'No port selected.' };
            }
            console.error('Connection error:', error);
            this.port = null;
            throw error;
        }
    }

    async disconnect() {
        if (!this.port) return;

        this.isListenerAttached = false;
        
        // Signal the writer to finish what it's doing
        if (this.writer) {
            try {
                await this.writer.close();
            } catch (e) {
                console.warn("Writer failed to close:", e);
            }
        }

        // Signal the reader to cancel and release its lock
        if (this.reader) {
            try {
                await this.reader.cancel();
            } catch (e) {
                console.warn("Reader failed to cancel:", e);
            }
        }
        
        // Wait for the read loop to fully exit
        if (this.readLoopPromise) {
            await this.readLoopPromise;
        }

        // Now, it is safe to close the port
        try {
            await this.port.close();
        } catch (error) {
            // This error should no longer happen, but we'll log it if it does.
            console.error("Error closing port:", error);
        } finally {
            this.handleDisconnect();
        }
    }
    
    handleDisconnect() {
        this.port = null;
        this.reader = null;
        this.writer = null;
        this.isConnected = false;
        this.readLoopPromise = null;
        if (this.onDisconnectCallback) {
            this.onDisconnectCallback();
        }
    }

    // DEFINITIVE FIX: Manually decode raw data chunks
    async readLoop() {
        while (this.port && this.port.readable) {
            try {
                const { value, done } = await this.reader.read();
                if (done) {
                    this.reader.releaseLock();
                    break;
                }
                if (value && this.onDataCallback && this.isListenerAttached) {
                    const text = this.decoder.decode(value, { stream: true });
                    this.onDataCallback(text);
                }
            } catch (error) {
                console.log('Read loop error (device likely unplugged):', error);
                break;
            }
        }
        console.log("Serial read loop has terminated.");
    }

    // DEFINITIVE FIX: Manually encode data before sending
    async sendData(data) {
        if (!this.writer) throw new Error('Writer is not available. Not connected?');
        try {
            const encodedData = this.encoder.encode(data);
            await this.writer.write(encodedData);
        } catch (error) {
            console.error('Send data error:', error);
            throw error;
        }
    }

    onData(callback) { this.onDataCallback = callback; }
    onDisconnect(callback) { this.onDisconnectCallback = callback; }
    
    detachListener() { this.isListenerAttached = false; }
    attachListener() { this.isListenerAttached = true; }
}