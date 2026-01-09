// src/ide/managers/VoltageRailManager.js
'use strict';

export class VoltageRailManager {
    constructor(simulatorManager) {
        this.sim = simulatorManager;
        this.calculationStack = new Set();
    }

    getPinLevel(targetComponentId, targetPinId) {
        const normalizedTargetPin = this.normalizePinId(targetPinId);
        
        const stackKey = `${targetComponentId}:${normalizedTargetPin}`;
        if (this.calculationStack.has(stackKey)) return -1; 
        this.calculationStack.add(stackKey);

        try {
            const isBoardPowered = this.checkBoardPower();
            const net = this.traceNet(targetComponentId, normalizedTargetPin);

            let drivenValue = -1; 
            let hasGround = false;

            for (const node of net) {
                const { componentId, pinId } = node;

                // --- A. BOARD SOURCES ---
                if (componentId === 'sim-board') {
                    // Ground Logic
                    if (this.isGroundPin(pinId)) {
                         // If board is powered, its GND pins are valid Ground references
                         if (isBoardPowered) hasGround = true;
                    }

                    if (isBoardPowered) {
                        // Power Rails (Sources)
                        if (['3V3', '3V3_OUT', '5V', 'VCC', 'AVDD', 'VBUS', 'VIN', 'VSYS'].includes(this.normalizePinId(pinId))) {
                            drivenValue = Math.max(drivenValue, 1);
                        }
                        
                        // GPIO Outputs
                        if (this.sim.boardPinStates) {
                            const normPinId = this.normalizePinId(pinId);
                            for (const [key, val] of Object.entries(this.sim.boardPinStates)) {
                                if (this.normalizePinId(key) === normPinId) {
                                    if (val !== undefined && val !== -1) {
                                        drivenValue = Math.max(drivenValue, val);
                                    }
                                }
                            }
                        }
                    }
                }

                // --- B. COMPONENT SOURCES ---
                else {
                    const comp = this.sim.components.get(componentId);
                    
                    // Direct Battery Connection
                    if (comp && comp.type === 'battery_module') {
                        if (pinId === 'POS') drivenValue = Math.max(drivenValue, 1);
                        if (pinId === 'NEG') hasGround = true;
                    }
                    
                    // Other Components
                    else if (comp && typeof comp.getPinOutput === 'function') {
                        const output = comp.getPinOutput(pinId);
                        if (output !== -1) {
                            drivenValue = Math.max(drivenValue, output);
                        }
                    }
                }
            }

            if (drivenValue > -1 && hasGround) {
                if (drivenValue > 0.1) return 0; // Short logic (simplified)
            }

            if (drivenValue > -1) return drivenValue;
            if (hasGround) return 0;
            
            return -1; 

        } finally {
            this.calculationStack.delete(stackKey);
        }
    }

    checkBoardPower() {
        // FIX: Removed "Magic USB Power" logic. 
        // The board now ALWAYS requires a physical battery connection to VIN/5V/VSYS/3V3 and GND to function.
        
        const powerInputPins = ['VIN', 'VSYS', 'VBUS', '5V', '3V3'];
        
        // Strict Check: Look for Battery connected to valid power pins
        let batteryId = null;
        for (const pinName of powerInputPins) {
            const net = this.traceNet('sim-board', pinName);
            for (const node of net) {
                if (node.componentId !== 'sim-board') {
                    const comp = this.sim.components.get(node.componentId);
                    // Check if connected to Positive terminal of a battery
                    if (comp && comp.type === 'battery_module' && node.pinId === 'POS') {
                        if (comp.voltage >= 2.5) { // Minimum operating voltage check
                            batteryId = node.componentId;
                            break;
                        }
                    }
                }
            }
            if (batteryId) break;
        }

        // If no positive connection to battery, board is off
        if (!batteryId) return false; 

        // Check Ground Return Path
        // We trace from generic 'GND' which normalizes to match GND1, GND2, etc.
        const gndNet = this.traceNet('sim-board', 'GND'); 
        for (const node of gndNet) {
            // Check if connected to Negative terminal of the SAME battery
            if (node.componentId === batteryId && node.pinId === 'NEG') {
                return true; 
            }
        }

        return false;
    }

    traceNet(startCompId, startPinId) {
        const visited = new Set();
        const queue = [{ componentId: startCompId, pinId: startPinId }];
        const netPins = [];
        const key = (c, p) => `${c}:${p}`;
        visited.add(key(startCompId, startPinId));

        while (queue.length > 0) {
            const current = queue.shift();
            netPins.push(current);

            const connectedViaWire = this.getWiredNeighbors(current.componentId, current.pinId);
            for (const neighbor of connectedViaWire) {
                const k = key(neighbor.componentId, neighbor.pinId);
                if (!visited.has(k)) {
                    visited.add(k);
                    queue.push(neighbor);
                }
            }

            if (current.componentId === 'sim-board') {
                if (this.isGroundPin(current.pinId)) {
                    const allGnds = this.getAllBoardGndPins();
                    for (const gndPin of allGnds) {
                        const k = key('sim-board', gndPin);
                        if (!visited.has(k)) {
                            visited.add(k);
                            queue.push({ componentId: 'sim-board', pinId: gndPin });
                        }
                    }
                }
            } else {
                const comp = this.sim.components.get(current.componentId);
                if (comp && typeof comp.getInternalConnections === 'function') {
                    const internalNeighbors = comp.getInternalConnections(current.pinId);
                    if (Array.isArray(internalNeighbors)) {
                        for (const pinName of internalNeighbors) {
                            const k = key(current.componentId, pinName);
                            if (!visited.has(k)) {
                                visited.add(k);
                                queue.push({ componentId: current.componentId, pinId: pinName });
                            }
                        }
                    }
                }
            }
        }
        return netPins;
    }

    getWiredNeighbors(compId, pinId) {
        const neighbors = [];
        const normSearchPin = this.normalizePinId(pinId);

        for (const wire of this.sim.wires) {
            const sComp = wire.startPin.componentId || 'sim-board';
            const sPin = wire.startPin.pinId;
            const eComp = wire.endPin.componentId || 'sim-board';
            const ePin = wire.endPin.pinId;

            const normSPin = (sComp === 'sim-board') ? this.normalizePinId(sPin) : sPin;
            const normEPin = (eComp === 'sim-board') ? this.normalizePinId(ePin) : ePin;
            
            const matchStart = (sComp === compId) && (compId === 'sim-board' ? normSPin === normSearchPin : sPin === pinId);
            const matchEnd = (eComp === compId) && (compId === 'sim-board' ? normEPin === normSearchPin : ePin === pinId);

            if (matchStart) neighbors.push({ componentId: eComp, pinId: ePin });
            else if (matchEnd) neighbors.push({ componentId: sComp, pinId: sPin });
        }
        return neighbors;
    }

    normalizePinId(id) {
        const s = String(id).toUpperCase();
        
        // Collapse all Grounds to a single ID for logic matching
        if (s.startsWith('GND') || s === 'AGND') return 'GND';
        
        if (['VIN','VCC','3V3','5V','VSYS','VBUS'].some(k => s.startsWith(k))) return s;
        if (/^(D|GP)\d+$/.test(s)) return s.replace(/\D/g, '');
        return s;
    }

    isGroundPin(pinId) {
        const s = String(pinId).toUpperCase();
        return s.startsWith('GND') || s === 'AGND';
    }

    getAllBoardGndPins() {
        if (!this.sim.board || !this.sim.board.pins) return [];
        return this.sim.board.pins.filter(p => this.isGroundPin(p.id)).map(p => p.id);
    }
}