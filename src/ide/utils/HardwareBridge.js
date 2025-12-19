// src/ide/utils/HardwareBridge.js
'use strict';

export class HardwareBridge {
    constructor(simulatorManager) {
        this.simulatorManager = simulatorManager;
    }

    // --- HELPER METHODS (Moved to Class Level) ---

    findComponentByPin(pinId, componentType) {
        const wires = this.simulatorManager.wires;
        // Helper to handle pin IDs that might be strings "D2" or numbers 2
        const pId = parseInt(String(pinId).replace(/\D/g, ''), 10);

        for (const wire of wires) {
            let componentId = null;
            const sId = wire.startPin?.pinId;
            const eId = wire.endPin?.pinId;
            
            // Wire direction: Board -> Component
            if (!wire.startPin?.componentId && wire.endPin?.componentId) {
                if (parseInt(String(sId).replace(/\D/g, ''), 10) === pId) {
                    componentId = wire.endPin.componentId;
                }
            } 
            // Wire direction: Component -> Board
            else if (wire.startPin?.componentId && !wire.endPin?.componentId) {
                if (parseInt(String(eId).replace(/\D/g, ''), 10) === pId) {
                    componentId = wire.startPin.componentId;
                }
            }
            
            if (componentId) {
                const component = this.simulatorManager.components.get(componentId);
                if (component && component.type === componentType) {
                    return component;
                }
            }
        }
        return null;
    }

    findNeoPixel(pinId) {
        const wires = this.simulatorManager.wires;
        const pId = parseInt(String(pinId).replace(/\D/g, ''), 10);
        
        for (const wire of wires) {
            let componentId = null;
            let componentPinId = null;
            const sId = wire.startPin?.pinId;
            const eId = wire.endPin?.pinId;

            if (!wire.startPin?.componentId && wire.endPin?.componentId) {
                if (parseInt(String(sId).replace(/\D/g, ''), 10) === pId) { 
                    componentId = wire.endPin.componentId; 
                    componentPinId = wire.endPin.pinId; 
                }
            } else if (wire.startPin?.componentId && !wire.endPin?.componentId) {
                if (parseInt(String(eId).replace(/\D/g, ''), 10) === pId) { 
                    componentId = wire.startPin.componentId; 
                    componentPinId = wire.startPin.pinId; 
                }
            }

            if (componentId) {
                const component = this.simulatorManager.components.get(componentId);
                if (component && (component.type === 'neopixel_strip' || component.type === 'neopixel_ring')) {
                    // Only return if connected to the Data In pin
                    if (componentPinId === 'DIN') return component;
                }
            }
        }
        return null;
    }

    findOLEDByPins(sdaPinId, sclPinId) {
        const oleds = Array.from(this.simulatorManager.components.values()).filter(c => c.type === 'oled_i2c');
        
        const normalize = (id) => { 
            const s = String(id); 
            if (!isNaN(s)) return parseInt(s, 10); 
            return parseInt(s.replace(/\D/g, ''), 10); 
        };
        
        const targetSDA = normalize(sdaPinId);
        const targetSCL = normalize(sclPinId);

        for (const oled of oleds) {
            const conns = this.simulatorManager.getConnectionsForComponent(oled.id);
            if (conns['SDA'] !== undefined && conns['SCL'] !== undefined) {
                if (normalize(conns['SDA']) === targetSDA && normalize(conns['SCL']) === targetSCL) {
                    return oled; 
                }
            }
        }
        return null;
    }

    getVirtualHardware() {
        const bridge = this; // Capture 'this' for the classes below

        const isSimActive = () => {
            return bridge.simulatorManager.ide && bridge.simulatorManager.ide.isSimulationRunning;
        };

        // --- VIRTUAL CLASSES (Instantiated by Pyodide) ---

        class VirtualPin {
            constructor(pinId, mode = -1, pull = -1) {
                if (pinId === "LED") {
                    const boardId = bridge.simulatorManager.ide ? bridge.simulatorManager.ide.boardId : null;
                    if (boardId === 'pico') {
                        this.id = "25"; 
                    } else if (boardId === 'esp32') {
                        this.id = "2";
                    } else {
                        this.id = String(pinId);
                    }
                } else {
                    this.id = String(pinId);
                }
                this.mode = mode; 
                this.pull = pull;
            }
            
            value(val) {
                if (val === undefined) {
                    return bridge.simulatorManager.getPinValue(this.id, this.pull);
                } else {
                    if (isSimActive()) {
                        bridge.simulatorManager.setPinValue(this.id, val);
                    }
                }
            }
            
            on() { this.value(1); }
            off() { this.value(0); }
            irq(trigger, handler) { console.log(`[Sim] IRQ registered on Pin ${this.id}`); }
        }
        
        VirtualPin.OUT = 1; VirtualPin.IN = 0; VirtualPin.PULL_UP = 2; VirtualPin.PULL_DOWN = 1; 
        VirtualPin.IRQ_RISING = 1; VirtualPin.IRQ_FALLING = 2;

        class VirtualADC {
            constructor(pin) { this.pinId = String(pin.id); }
            read() { return bridge.simulatorManager.getPinValue(this.pinId); }
            read_u16() { const raw = bridge.simulatorManager.getPinValue(this.pinId); return Math.min(65535, raw * 64); }
            atten(a) {}
            width(w) {}
        }
        VirtualADC.ATTN_11DB = 3;

        class VirtualPWM {
            constructor(pin) { this.pin = pin; this.dutyValue = 0; this.freqValue = 5000; }
            
            _findConnectedComponentAndPin() {
                const boardPinId = this.pin.id;
                const normalize = (id) => String(id).replace(/\D/g, ''); 
                const target = normalize(boardPinId);

                for (const wire of bridge.simulatorManager.wires) {
                    const sId = wire.startPin?.pinId;
                    const eId = wire.endPin?.pinId;

                    if (!wire.startPin.componentId && wire.endPin.componentId) {
                        if (normalize(sId) === target) {
                            return { component: bridge.simulatorManager.components.get(wire.endPin.componentId), componentPinId: wire.endPin.pinId };
                        }
                    } 
                    else if (wire.startPin.componentId && !wire.endPin.componentId) {
                        if (normalize(eId) === target) {
                            return { component: bridge.simulatorManager.components.get(wire.startPin.componentId), componentPinId: wire.startPin.pinId };
                        }
                    }
                }
                return { component: null, componentPinId: null };
            }

            _updateComponent(rawDuty, maxDuty) {
                 if (!isSimActive()) return;
                 this.dutyValue = rawDuty;
                 const normalizedValue = rawDuty / maxDuty;
                 bridge.simulatorManager.setPinValue(this.pin.id, normalizedValue); 
                 const { component, componentPinId } = this._findConnectedComponentAndPin();
                 
                 if (component && typeof component.update === 'function') {
                     if (component.type === 'servo_motor' || component.type === 'servo_continuous') {
                         let angle = (normalizedValue - 0.025) * (180 / 0.10);
                         angle = Math.max(0, Math.min(180, angle));
                         component.update(angle);
                     } else {
                         component.update(normalizedValue, componentPinId);
                     }
                 }
            }
            duty(val) { if (val !== undefined) { this._updateComponent(val, 1023.0); } return this.dutyValue; }
            duty_u16(val) { if (val !== undefined) { this._updateComponent(val, 65535.0); } return this.dutyValue; }
            freq(val) { if (val !== undefined && isSimActive()) { this.freqValue = val; const { component } = this._findConnectedComponentAndPin(); if (component && component.type === 'buzzer') component.updateFrequency(val); } return this.freqValue; }
            deinit() { this.duty(0); }
        }

        class VirtualHCSR04 {
            constructor(trigger_pin, echo_pin) {
                this.component = null;
                const sensors = Array.from(bridge.simulatorManager.components.values()).filter(c => c.type === 'ultrasonic');
                for (const comp of sensors) {
                    const conns = bridge.simulatorManager.getConnectionsForComponent(comp.id);
                    if (String(conns.Trig) === String(trigger_pin.id) && String(conns.Echo) === String(echo_pin.id)) { this.component = comp; break; }
                }
            }
            distance_cm() { if (this.component) return this.component.getValue('Echo'); return -1; }
            distance_mm() { return this.distance_cm() * 10; }
        }

        class VirtualDHT { 
            constructor(pin) { 
                this.pin = pin;
                this.component = null;
                // Now calling the method on the class instance, which exists!
                this.component = bridge.findComponentByPin(this.pin.id, 'dht11');
            } 
            
            measure() {
                if (!this.component) {
                    this.component = bridge.findComponentByPin(this.pin.id, 'dht11');
                }
            } 
            
            temperature() { 
                return this.component ? this.component.getTemperature() : 0; 
            } 
            
            humidity() { 
                return this.component ? this.component.getHumidity() : 0; 
            } 
        }

        class VirtualI2C { constructor(id, args) {} writeto() {} readfrom() {} }

        return {
            Pin: VirtualPin, ADC: VirtualADC, PWM: VirtualPWM,
            I2C: VirtualI2C, SoftI2C: VirtualI2C, HCSR04: VirtualHCSR04, DHT: VirtualDHT,
            
            // Expose the class methods to Python (via binding)
            findComponentByPin: bridge.findComponentByPin.bind(bridge),
            findNeoPixel: bridge.findNeoPixel.bind(bridge),
            findOLEDByPins: bridge.findOLEDByPins.bind(bridge)
        };
    }
}