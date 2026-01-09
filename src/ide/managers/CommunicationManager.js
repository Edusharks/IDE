// src/ide/managers/CommunicationManager.js
'use strict';

import { SerialCommunication } from '../utils/serial-comm.js';
import { WebREPLCommunication } from '../utils/webrepl.js';
import { BLECommunication } from '../utils/ble-comm.js';

class EventEmitter {
    constructor() { this.events = {}; }
    on(eventName, listener) { if (!this.events[eventName]) { this.events[eventName] = []; } this.events[eventName].push(listener); }
    emit(eventName, ...args) { const listeners = this.events[eventName]; if (listeners) { listeners.forEach(listener => listener(...args)); } }
}

export class CommunicationManager extends EventEmitter {
    constructor() {
        super();
        this.comm = null;
        this.connectionType = null;
        this.lastBleDevice = null; // NEW: Store device for reconnection

        this.serialComm = new SerialCommunication();
        this.webReplComm = new WebREPLCommunication();
        this.bleComm = new BLECommunication();

        this.setupAllCommCallbacks();
    }

    isConnected() { return this.comm?.isConnected || false; }
    getConnectionType() { return this.connectionType; }
    getActiveComm() { return this.comm; }

    setupAllCommCallbacks() {
        const setup = (comm, type) => {
            comm.onData(data => { if (this.comm === comm) this.emit('data', data); });
            comm.onDisconnect(() => {
                if (this.comm === comm) {
                    this.comm = null;
                    this.connectionType = null;
                    this.emit('disconnected', { message: `Device disconnected.` });
                }
            });
            if (comm instanceof SerialCommunication) {
                comm.onReconnect(() => {
                    this.comm = comm;
                    this.connectionType = type;
                    this.emit('connected', { type: type, message: 'Device reconnected automatically.' });
                });
            }
        };
        setup(this.serialComm, 'usb');
        setup(this.webReplComm, 'wifi');
        setup(this.bleComm, 'ble');
    }

    async connectUSB() {
        if (this.isConnected()) await this.disconnect();
        this.emit('status', 'Connecting');
        try {
            await this.serialComm.connect();
            this.comm = this.serialComm;
            this.connectionType = 'usb';
            await this.comm.sendData('\x03');
            this.emit('connected', { type: 'usb', message: 'Device connected via USB.' });
        } catch (error) {
            this.emit('error', `USB Connection error: ${error.message}`);
            this.emit('disconnected', {});
        }
    }

    async connectWebREPL(ip, password) {
        if (this.isConnected()) await this.disconnect();
        this.emit('status', 'Connecting');
        try {
            await this.webReplComm.connect(ip, 8266, password);
            this.comm = this.webReplComm;
            this.connectionType = 'wifi';
            this.emit('connected', { type: 'wifi', message: `Device connected via Wi-Fi at ${ip}.` });
        } catch (error) {
            this.emit('error', `WebREPL Connection failed: ${error.message}`);
            this.emit('disconnected', {});
        }
    }

    async scanAndConnectBLE() {
        if (this.isConnected()) await this.disconnect();
        try {
            const device = await this.bleComm.scan();
            this.emit('status', 'Connecting');
            await this.bleComm.connect(device);
            
            this.comm = this.bleComm;
            this.connectionType = 'ble';
            this.lastBleDevice = device; 
            
            this.emit('connected', { type: 'ble', message: 'Device connected via Bluetooth.' });
            return device;
        } catch (error) {
            this.emit('error', `Bluetooth Connection failed: ${error.message}`);
            this.emit('disconnected', {});
            throw error;
        }
    }

    // Connects to a specific device object (returned from scan)
    async connectBLE(device) {
        if (this.isConnected()) await this.disconnect();
        
        this.emit('status', `Connecting to ${device.name}...`);
        
        try {
            await this.bleComm.connect(device);
            
            this.comm = this.bleComm;
            this.connectionType = 'ble';
            this.lastBleDevice = device;
            
            this.emit('connected', { type: 'ble', message: `Connected to ${device.name} via Bluetooth.` });
        } catch (error) {
            this.emit('error', `Bluetooth Connection failed: ${error.message}`);
            this.emit('disconnected', {});
            throw error;
        }
    }

    async reconnectBLE() {
        if (this.isConnected()) await this.disconnect();
        if (!this.lastBleDevice) throw new Error("No previous BLE device to reconnect to.");

        this.emit('status', 'Reconnecting BLE...');
        try {
            await this.bleComm.connect(this.lastBleDevice);
            this.comm = this.bleComm;
            this.connectionType = 'ble';
            this.emit('connected', { type: 'ble', message: 'Device reconnected via Bluetooth.' });
        } catch (error) {
            this.emit('error', `BLE Reconnect failed: ${error.message}`);
            this.emit('disconnected', {});
            throw error;
        }
    }

    async disconnect() {
        if (this.comm) {
            await this.comm.disconnect();
        }
    }

    // --- PASSTHROUGH METHODS ---
    sendData(data) {
        if (!this.isConnected() || !this.comm) {
            return Promise.reject("Not Connected");
        }
        return this.comm.sendData(data);
    }

    async stopReadLoop() {
        if (this.comm && typeof this.comm.stopReadLoop === 'function') {
            await this.comm.stopReadLoop();
        }
    }

    async startReadLoop() {
        if (this.comm && typeof this.comm.startReadLoop === 'function') {
            await this.comm.startReadLoop();
        }
    }
    
    async enterRawREPL() {
        if (!this.isConnected() || !this.comm) throw new Error("Not Connected");
        if (typeof this.comm.enterRawREPL !== 'function') throw new Error("Not supported");
        return this.comm.enterRawREPL();
    }
    
    async exitRawREPL() {
        if (!this.isConnected() || !this.comm) throw new Error("Not Connected");
        if (typeof this.comm.exitRawREPL !== 'function') throw new Error("Not supported");
        return this.comm.exitRawREPL();
    }
    
    async rawREPL_execute(command, timeout = 5000) {
        if (!this.isConnected() || !this.comm) throw new Error("Not Connected");
        if (typeof this.comm.rawREPL_execute !== 'function') throw new Error("Not supported");
        return this.comm.rawREPL_execute(command, timeout);
    }
    
    async sendCommandAndGetResponse(command, timeout = 5000) {
        if (!this.isConnected() || !this.comm) throw new Error("Not Connected");
        if (typeof this.comm.sendCommandAndGetResponse !== 'function') throw new Error("Not supported");
        return this.comm.sendCommandAndGetResponse(command, timeout);
    }
}