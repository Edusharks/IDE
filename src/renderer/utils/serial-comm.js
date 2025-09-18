// src/renderer/utils/serial-comm.js (WEB SERIAL API VERSION)

class SerialCommunication {
    constructor() {
        this.port = null;
        this.reader = null;
        this.writer = null;
        this.isConnected = false;
        this.onDataCallback = null;
        this.onDisconnectCallback = null;
    }

    /**
     * Checks if the Web Serial API is supported by the browser.
     */
    isSupported() {
        return 'serial' in navigator;
    }

    /**
     * Prompts the user to select a serial port and connects to it.
     * @param {Object} options - Options for the serial port connection.
     * @param {number} [options.baudRate=115200] - The baud rate for the connection.
     */
    async connect(options = { baudRate: 115200 }) {
        if (!this.isSupported()) {
            alert('Web Serial API is not supported by your browser. Please use Google Chrome or Microsoft Edge.');
            throw new Error('Web Serial API not supported.');
        }

        try {
            // Request a port from the user.
            this.port = await navigator.serial.requestPort();
            
            // Open the port.
            await this.port.open(options);
            
            this.isConnected = true;

            // Set up the reader to listen for incoming data.
            const textDecoder = new TextDecoderStream();
            const readableStreamClosed = this.port.readable.pipeTo(textDecoder.writable);
            this.reader = textDecoder.readable.getReader();

            // Set up the writer for sending data.
            const textEncoder = new TextEncoderStream();
            const writableStreamClosed = textEncoder.readable.pipeTo(this.port.writable);
            this.writer = textEncoder.writable.getWriter();

            // Start the read loop.
            this.readLoop();

            // Listen for the port to be disconnected (e.g., unplugged).
            this.port.addEventListener('disconnect', () => {
                this.handleDisconnect();
            });

            return { success: true, message: 'Connected successfully.' };

        } catch (error) {
            // The user canceled the port selection dialog.
            if (error.name === 'NotFoundError') {
                return { success: false, message: 'No port selected.' };
            }
            console.error('Connection error:', error);
            throw error;
        }
    }

    /**
     * Disconnects from the currently connected serial port.
     */
    async disconnect() {
        if (!this.port || !this.isConnected) return;

        // Cancel the reader and writer to release the port.
        if (this.reader) {
            try {
                await this.reader.cancel();
            } catch (error) {
                console.warn("Error canceling reader:", error);
            }
        }
        if (this.writer) {
            try {
                await this.writer.close();
            } catch (error) {
                console.warn("Error closing writer:", error);
            }
        }
        
        // Close the port itself.
        try {
            await this.port.close();
        } catch (error) {
            console.error("Error closing port:", error);
        } finally {
            this.handleDisconnect();
        }
    }

    /**
     * Internal handler to clean up state on disconnection.
     */
    handleDisconnect() {
        this.port = null;
        this.reader = null;
        this.writer = null;
        this.isConnected = false;
        if (this.onDisconnectCallback) {
            this.onDisconnectCallback();
        }
    }

    /**
     * Continuously reads data from the serial port and sends it to the callback.
     */
    async readLoop() {
        while (this.port && this.isConnected) {
            try {
                const { value, done } = await this.reader.read();
                if (done) {
                    // The reader has been canceled.
                    break;
                }
                if (value && this.onDataCallback) {
                    this.onDataCallback(value);
                }
            } catch (error) {
                console.error('Read loop error:', error);
                this.handleDisconnect();
                break;
            }
        }
    }

    /**
     * Sends a string of data to the connected device.
     * @param {string} data - The data to send.
     */
    async sendData(data) {
        if (!this.writer) {
            throw new Error('Writer is not available. Not connected?');
        }
        try {
            await this.writer.write(data);
        } catch (error) {
            console.error('Send data error:', error);
            throw error;
        }
    }

    /**
     * Registers a callback function for when data is received.
     * @param {function(string): void} callback
     */
    onData(callback) {
        this.onDataCallback = callback;
    }

    /**
     * Registers a callback function for when the device is disconnected.
     * @param {function(): void} callback
     */
    onDisconnect(callback) {
        this.onDisconnectCallback = callback;
    }
}