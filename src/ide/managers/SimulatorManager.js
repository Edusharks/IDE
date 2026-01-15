// src/ide/managers/SimulatorManager.js

'use strict';
import boardsData from '../data/boards.json';
import componentsData from '../data/components.json';
import { VoltageRailManager } from './VoltageRailManager.js';

class VirtualComponent {
    constructor(id, type, simulatorManager, position, name, componentData) {
        this.id = id;
        this.type = type;
        this.simulatorManager = simulatorManager;
        this.position = position;
        this.name = name;
        this.componentData = componentData;
        if (!this.componentData) {
            console.error(`Data for component type "${type}" was not provided!`);
        }
        this.element = null;
        this.pins = {};
        this.rotation = 0;
        this.scaleX = 1;
    }

    render(container) {
        if (!this.componentData) return;

        this.element = document.createElement('div');
        this.element.className = 'sim-component';
        this.element.id = this.id;
        this.element.style.left = `${this.position.x}px`;
        this.element.style.top = `${this.position.y}px`;

        const body = document.createElement('div');
        body.className = 'sim-component-body';
        
        const imageElement = document.createElement('img');
        imageElement.alt = this.componentData.name;
        imageElement.draggable = false;
        imageElement.onload = () => {
            const naturalWidth = imageElement.naturalWidth;
            const naturalHeight = imageElement.naturalHeight;
            body.style.width = `${naturalWidth}px`;
            body.style.height = `${naturalHeight}px`;
            this.renderPins(body);
            this.postRender(body);
        };
        
        this.simulatorManager.makeDraggable(imageElement, this);
        
        body.appendChild(imageElement);
        this.element.appendChild(body);
        container.appendChild(this.element);

        imageElement.src = this.componentData.image;

        return this.element;
    }

    postRender(body) {
        this.updateTransform(); 
    }

    renderPins(container) { 
        if (!this.componentData.pins) return;
        this.componentData.pins.forEach(pinData => {
            const pinElement = document.createElement('div');
            pinElement.className = 'sim-pin-hotspot component-pin';
            pinElement.dataset.componentId = this.id;
            pinElement.dataset.pinId = pinData.id;
            pinElement.title = `${this.componentData.name} - ${pinData.name}`;
            pinElement.style.left = `${pinData.pos.x}%`;
            pinElement.style.top = `${pinData.pos.y}%`;
            container.appendChild(pinElement);
            this.pins[pinData.id] = pinElement;
            pinElement.addEventListener('click', (e) => {
                e.stopPropagation();
                this.simulatorManager.handlePinClick(pinElement, e);
            });
        });
    }

    updateTransform() {
        const body = this.element.querySelector('.sim-component-body');
        if (body) {
            body.style.transform = `rotate(${this.rotation}deg) scaleX(${this.scaleX})`;
        }
    }
    
    step(deltaTime) {
        // Base components do nothing on an animation step.
        // Child classes (like ServoModel) will override this.
    }


    remove() {
        if (this.element) this.element.remove();
    }
}


// Components design and Styling 

// Inputs & Sensors

function adjustColorBrightness(hex, percent) {
    // Strip the hash if it exists
    hex = hex.replace(/^\s*#|\s*$/g, '');
    // Convert 3-char hex to 6-char
    if (hex.length === 3) {
        hex = hex.replace(/(.)/g, '$1$1');
    }
    var r = parseInt(hex.substr(0, 2), 16);
    var g = parseInt(hex.substr(2, 2), 16);
    var b = parseInt(hex.substr(4, 2), 16);

    return '#' +
       ((0|(1<<8) + r + (256 - r) * percent / 100).toString(16)).substr(1) +
       ((0|(1<<8) + g + (256 - g) * percent / 100).toString(16)).substr(1) +
       ((0|(1<<8) + b + (256 - b) * percent / 100).toString(16)).substr(1);
}

class BatteryModel extends VirtualComponent {
    constructor(id, simulatorManager, position, name, componentData) {
        super(id, 'battery_module', simulatorManager, position, name, componentData);
        
        // Properties
        this.voltage = componentData.voltage || 5.0;
        this.currentLimit = componentData.current || 1.0; // Amps
        
        BatteryModel.injectStyles();
    }

    render(container) {
        this.element = document.createElement('div');
        this.element.className = 'sim-component';
        this.element.id = this.id;
        this.element.style.left = `${this.position.x}px`;
        this.element.style.top = `${this.position.y}px`;

        const body = document.createElement('div');
        body.className = 'sim-component-body';
        body.dataset.type = this.type;

        const gid = this.id;

        body.innerHTML = `
            <svg viewBox="0 0 100 120" class="sim-batt-svg">
                <defs>
                    <linearGradient id="battBody_${gid}" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style="stop-color:#333;stop-opacity:1" />
                        <stop offset="50%" style="stop-color:#555;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#333;stop-opacity:1" />
                    </linearGradient>
                </defs>
                
                <!-- Terminals -->
                <rect x="25" y="5" width="10" height="15" fill="#d63031" /> <!-- Red + -->
                <rect x="65" y="5" width="10" height="15" fill="#2d3436" /> <!-- Black - -->

                <!-- Body -->
                <rect x="10" y="20" width="80" height="90" rx="5" style="fill:url(#battBody_${gid}); stroke:#000; stroke-width:2;" />
                
                <!-- Label Display -->
                <rect x="20" y="35" width="60" height="40" rx="2" fill="#222" />
                <text x="50" y="62" text-anchor="middle" fill="#00ff00" font-family="monospace" font-size="14" font-weight="bold" class="batt-volts">
                    ${this.voltage}V
                </text>
                
                <!-- Symbols -->
                <text x="30" y="100" fill="#d63031" font-weight="bold" font-size="16">+</text>
                <text x="70" y="100" fill="#aaa" font-weight="bold" font-size="16">-</text>
            </svg>
        `;

        this.element.appendChild(body);
        container.appendChild(this.element);

        // Custom Pin Placement
        this.renderPins(body, [
            { id: 'POS', x: '30px', y: '12px' },
            { id: 'NEG', x: '70px', y: '12px' }
        ]);

        this.simulatorManager.makeDraggable(body, this);
        return this.element;
    }

    renderPins(container, pinConfigs) {
        pinConfigs.forEach(config => {
            const pinElement = document.createElement('div');
            pinElement.className = 'sim-pin-hotspot component-pin';
            pinElement.dataset.componentId = this.id;
            pinElement.dataset.pinId = config.id;
            pinElement.title = config.id;
            pinElement.style.left = config.x;
            pinElement.style.top = config.y;
            pinElement.style.width = '12px';
            pinElement.style.height = '12px';
            container.appendChild(pinElement);
            pinElement.addEventListener('click', (e) => {
                e.stopPropagation();
                this.simulatorManager.handlePinClick(pinElement, e);
            });
        });
    }

    // --- Logic for VoltageRailManager ---
    
    // 1. Internal Connections: None (It's a source, not a wire)
    getInternalConnections(pinId) {
        return []; 
    }

    // 2. Active Output: This IS the source of truth
    getPinOutput(pinId) {
        if (pinId === 'POS') return 1; // Source of "High" (Voltage)
        if (pinId === 'NEG') return 0; // Source of "Low" (Ground)
        return -1;
    }

    setVoltage(v) {
        this.voltage = parseFloat(v).toFixed(1);
        const textEl = this.element.querySelector('.batt-volts');
        if(textEl) textEl.textContent = `${this.voltage}V`;
    }

    static styleInjected = false;
    static injectStyles() {
        if (BatteryModel.styleInjected) return;
        const css = `
            .sim-component-body[data-type="battery_module"] {
                width: 100px; height: 120px; position: relative; cursor: grab;
            }
            .sim-batt-svg { filter: drop-shadow(0 5px 10px rgba(0,0,0,0.3)); }
        `;
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
        BatteryModel.styleInjected = true;
    }
}


class PushButtonModel extends VirtualComponent {
    constructor(id, simulatorManager, position, name, componentData) {
        super(id, 'pushbutton', simulatorManager, position, name, componentData);
        this.isPressed = false;
        this.capColor = componentData.capColor || '#333333'; 
        
        this.buttonCap = null;
        this.clickZone = null;
        this.onboardLed = null;
        this.gradientStopMain = null;
        this.gradientStopEdge = null;
        
        PushButtonModel.injectStyles();
    }

    render(container) {
        this.element = document.createElement('div');
        this.element.className = 'sim-component';
        this.element.id = this.id;
        this.element.style.left = `${this.position.x}px`;
        this.element.style.top = `${this.position.y}px`;

        const body = document.createElement('div');
        body.className = 'sim-component-body';
        body.dataset.type = this.type;

        const gid = this.id; 
        const colorMain = this.capColor;
        const colorEdge = adjustColorBrightness(this.capColor, -60); 

        body.innerHTML = `
        <svg viewBox="0 0 200 240" class="sim-pushbutton-module-svg">
            <defs>
                <linearGradient id="metalGrad_${gid}" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#ecf0f1;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#bdc3c7;stop-opacity:1" />
                </linearGradient>
                <radialGradient id="btnGrad_${gid}" cx="50%" cy="50%" r="50%">
                    <stop id="btnStopMain_${gid}" offset="70%" style="stop-color:${colorMain};stop-opacity:1" />
                    <stop id="btnStopEdge_${gid}" offset="100%" style="stop-color:${colorEdge};stop-opacity:1" />
                </radialGradient>
                <radialGradient id="goldGrad_${gid}" cx="50%" cy="50%" r="50%">
                    <stop offset="40%" style="stop-color:#f1c40f;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#b7950b;stop-opacity:1" />
                </radialGradient>
            </defs>

            <rect x="10" y="10" width="180" height="180" rx="12" class="pb-pcb" />
            <circle cx="25" cy="25" r="7" class="pb-mount-hole" /><circle cx="175" cy="25" r="7" class="pb-mount-hole" />
            <circle cx="25" cy="175" r="7" class="pb-mount-hole" /><circle cx="175" cy="175" r="7" class="pb-mount-hole" />

            <g transform="translate(65, 30)">
                <rect x="-2" y="0" width="4" height="10" class="pb-smd-pad" /><rect x="18" y="0" width="4" height="10" class="pb-smd-pad" />
                <rect x="0" y="0" width="20" height="10" class="pb-smd-body" /><text x="10" y="7" text-anchor="middle" class="pb-smd-text">103</text>
            </g>
            <g transform="translate(120, 30)">
                <rect x="-2" y="0" width="4" height="10" class="pb-smd-pad" /><rect x="8" y="0" width="4" height="10" class="pb-smd-pad" />
                <rect class="pb-onboard-led" x="0" y="0" width="10" height="10" /><rect x="7" y="0" width="3" height="10" fill="rgba(255,255,255,0.2)" />
            </g>

            <g class="pb-legs">
                <path d="M 50,70 L 40,70 L 40,85 L 50,85" /><path d="M 50,115 L 40,115 L 40,130 L 50,130" />
                <path d="M 150,70 L 160,70 L 160,85 L 150,85" /><path d="M 150,115 L 160,115 L 160,130 L 150,130" />
            </g>

            <rect x="50" y="50" width="100" height="100" rx="2" class="pb-switch-base" style="fill: url(#metalGrad_${gid});" />
            <circle cx="100" cy="100" r="40" fill="none" stroke="#aaa" stroke-width="1" opacity="0.5" />

            <!-- Visual Cap -->
            <circle class="pb-btn-cap" cx="100" cy="100" r="34" style="fill: url(#btnGrad_${gid});" />
            
            <!-- HIT BOX: Transparent circle, larger than visual cap for easy clicking -->
            <circle class="pb-click-zone" cx="100" cy="100" r="45" fill="transparent" style="cursor: pointer; pointer-events: auto;" />

            <g transform="translate(100, 180)">
                <circle cx="-30" cy="0" r="8" class="pb-gold-pad" style="fill: url(#goldGrad_${gid});" /><text x="-30" y="-12" class="pb-pin-label">GND</text>
                <circle cx="0" cy="0" r="8" class="pb-gold-pad" style="fill: url(#goldGrad_${gid});" /><text x="0" y="-12" class="pb-pin-label">VCC</text>
                <circle cx="30" cy="0" r="8" class="pb-gold-pad" style="fill: url(#goldGrad_${gid});" /><text x="30" y="-12" class="pb-pin-label">SIG</text>
            </g>
        </svg>
        `;
        
        this.buttonCap = body.querySelector('.pb-btn-cap');
        this.clickZone = body.querySelector('.pb-click-zone');
        this.onboardLed = body.querySelector('.pb-onboard-led');
        this.gradientStopMain = body.querySelector(`#btnStopMain_${gid}`);
        this.gradientStopEdge = body.querySelector(`#btnStopEdge_${gid}`);

        this.element.appendChild(body);
        container.appendChild(this.element);
        this.renderPins(body);
        
        // Dragging on the main body works
        this.simulatorManager.makeDraggable(body, this);
        
        // Click zone handles press, stopping drag
        this.addInteractivity();
        this.updateTransform();

        return this.element;
    }

    setCapColor(newColor) {
        this.capColor = newColor;
        if (this.gradientStopMain && this.gradientStopEdge) {
            const colorEdge = adjustColorBrightness(newColor, -60); 
            this.gradientStopMain.style.stopColor = newColor;
            this.gradientStopEdge.style.stopColor = colorEdge;
        }
    }

    addInteractivity() {
        const press = (e) => {
            if (e.type === 'mousedown' && e.button !== 0) return;
            e.preventDefault(); 
            e.stopPropagation(); // Stops dragging
            this.simulatorManager.selectComponent(this.id);
            this.isPressed = true;
            this.updateVisualState();
            this.simulatorManager._requestSaveState(); 
        };
        const release = () => {
            if (this.isPressed) {
                this.isPressed = false;
                this.updateVisualState();
                this.simulatorManager._requestSaveState();
            }
        };
        
        this.clickZone.addEventListener('mousedown', press);
        this.clickZone.addEventListener('touchstart', press);
        
        window.addEventListener('mouseup', release);
        window.addEventListener('touchend', release);
    }

    updateVisualState() {
        if (!this.buttonCap || !this.onboardLed) return;
        
        if (this.isPressed) this.buttonCap.classList.add('pressed');
        else this.buttonCap.classList.remove('pressed');

        // Check Rails for LED
        const vccLevel = this.simulatorManager.railManager.getPinLevel(this.id, 'VCC');
        const gndLevel = this.simulatorManager.railManager.getPinLevel(this.id, 'GND');
        
        if (this.isPressed && vccLevel === 1 && gndLevel === 0) {
            this.onboardLed.classList.add('on');
        } else {
            this.onboardLed.classList.remove('on');
        }
    }

    getInternalConnections(pinId) {
        if (this.isPressed) {
            if (pinId === 'SIG') return ['VCC'];
            if (pinId === 'VCC') return ['SIG'];
        }
        return [];
    }

    getPinOutput(pinId) { return -1; }

    static styleInjected = false;
    static injectStyles() {
        if (PushButtonModel.styleInjected) return;
        const css = `
            .sim-component-body[data-type="pushbutton"] { width: 130px; height: 156px; position: relative; cursor: grab; }
            .sim-pushbutton-module-svg { width: 100%; height: 100%; filter: drop-shadow(0 8px 12px rgba(0,0,0,0.3)); overflow: visible; }
            .pb-pcb { fill: #2c3e50; stroke: #1a252f; stroke-width: 2; }
            .pb-mount-hole { fill: #ecf0f1; stroke: #95a5a6; stroke-width: 2; }
            .pb-smd-pad { fill: #bdc3c7; } .pb-smd-body { fill: #333; stroke: #111; stroke-width: 0.5; }
            .pb-smd-text { fill: #fff; font-family: monospace; font-size: 6px; font-weight: bold; }
            .pb-onboard-led { fill: #4a0d0d; stroke: #333; stroke-width: 0.5; transition: fill 0.05s; }
            .pb-onboard-led.on { fill: #ff1a1a; filter: drop-shadow(0 0 4px rgba(255, 50, 50, 0.9)); }
            .pb-legs path { fill: #bdc3c7; stroke: #7f8c8d; stroke-width: 1; }
            .pb-switch-base { stroke: #bdc3c7; stroke-width: 1; filter: drop-shadow(0 2px 3px rgba(0,0,0,0.3)); }
            .pb-btn-cap { stroke: #111; stroke-width: 0.5; filter: drop-shadow(0 4px 3px rgba(0,0,0,0.6)); transition: transform 0.05s ease-out; transform-origin: 100px 100px; }
            .pb-btn-cap.pressed { transform: scale(0.96) translateY(1px); filter: drop-shadow(0 1px 1px rgba(0,0,0,0.7)); }
            .pb-gold-pad { stroke: #b7950b; stroke-width: 1; }
            .pb-pin-label { fill: #fff; font-family: Arial, sans-serif; font-size: 11px; font-weight: bold; text-anchor: middle; pointer-events: none; }
        `;
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
        PushButtonModel.styleInjected = true;
    }
}

class SlideSwitchModel extends VirtualComponent {
    constructor(id, simulatorManager, position, name, componentData) {
        super(id, 'slide_switch', simulatorManager, position, name, componentData);
        this.isOn = false; // false = Left (Pos 1), true = Right (Pos 2)
        this.handleColor = componentData.handleColor || '#151515';
        
        // Element references
        this.sliderHandle = null;
        this.switchClickZone = null; // Specific zone for toggling
        
        SlideSwitchModel.injectStyles();
    }

    render(container) {
        this.element = document.createElement('div');
        this.element.className = 'sim-component';
        this.element.id = this.id;
        this.element.style.left = `${this.position.x}px`;
        this.element.style.top = `${this.position.y}px`;

        const body = document.createElement('div');
        body.className = 'sim-component-body';
        body.dataset.type = this.type;

        const gid = this.id;

        body.innerHTML = `
        <svg viewBox="0 0 160 200" class="sim-slide-switch-svg">
            <defs>
                <linearGradient id="ssMetalGrad_${gid}" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#bdc3c7;stop-opacity:1" />
                    <stop offset="20%" style="stop-color:#f5f6fa;stop-opacity:1" />
                    <stop offset="50%" style="stop-color:#bdc3c7;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#7f8c8d;stop-opacity:1" />
                </linearGradient>
                <radialGradient id="ssGoldGrad_${gid}" cx="50%" cy="50%" r="50%">
                    <stop offset="40%" style="stop-color:#f1c40f;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#b7950b;stop-opacity:1" />
                </radialGradient>
            </defs>

            <!-- 1. PCB Board (Draggable Area) -->
            <rect x="10" y="20" width="140" height="120" rx="6" class="ss-pcb" />
            
            <!-- Mounting Holes -->
            <circle cx="25" cy="35" r="5" class="ss-mount-hole" /><circle cx="135" cy="35" r="5" class="ss-mount-hole" />
            <circle cx="25" cy="125" r="5" class="ss-mount-hole" /><circle cx="135" cy="125" r="5" class="ss-mount-hole" />

            <!-- 2. Pins (Bottom Edge) -->
            <g transform="translate(80, 128)">
                <g transform="translate(-30, 0)"><circle r="6.5" class="ss-gold-pad" style="fill: url(#ssGoldGrad_${gid});" /><text y="-10" class="ss-pin-label">1</text></g>
                <g transform="translate(0, 0)"><circle r="6.5" class="ss-gold-pad" style="fill: url(#ssGoldGrad_${gid});" /><text y="-10" class="ss-pin-label">COM</text></g>
                <g transform="translate(30, 0)"><circle r="6.5" class="ss-gold-pad" style="fill: url(#ssGoldGrad_${gid});" /><text y="-10" class="ss-pin-label">2</text></g>
            </g>

            <!-- 3. Switch Assembly (Clickable Area) -->
            <g class="ss-click-target" transform="translate(30, 50)">
                <!-- Metal Housing -->
                <rect x="0" y="0" width="100" height="55" rx="2" class="ss-casing" style="fill: url(#ssMetalGrad_${gid});" />
                <!-- Inner Slot -->
                <rect x="10" y="15" width="80" height="25" rx="12" class="ss-casing-inner" />
                
                <!-- Slider Handle -->
                <g class="ss-handle-group" transform="translate(10, 11)">
                    <rect class="ss-handle-rect" x="0" y="0" width="28" height="33" rx="3" style="fill: ${this.handleColor};" />
                    <line x1="7" y1="6" x2="7" y2="27" class="ss-handle-grip" />
                    <line x1="14" y1="6" x2="14" y2="27" class="ss-handle-grip" />
                    <line x1="21" y1="6" x2="21" y2="27" class="ss-handle-grip" />
                </g>
            </g>
        </svg>
        `;

        this.sliderHandle = body.querySelector('.ss-handle-group');
        this.switchClickZone = body.querySelector('.ss-click-target');

        this.element.appendChild(body);
        container.appendChild(this.element);

        this.renderPins(body);
        
        // 1. Make the whole component draggable (PCBs will trigger this)
        this.simulatorManager.makeDraggable(body, this);
        
        // 2. Setup Toggle Logic (Switch Housing triggers this and stops drag)
        this.addInteractivity();
        
        this.updateVisualState(); 
        this.updateTransform();

        return this.element;
    }

    setHandleColor(color) {
        this.handleColor = color;
        const rect = this.element.querySelector('.ss-handle-rect');
        if (rect) rect.style.fill = color;
    }

    addInteractivity() {
        const toggle = (e) => {
            if (e.type === 'mousedown' && e.button !== 0) return;
            e.preventDefault(); 
            e.stopPropagation(); // Stops the drag event from starting
            
            this.simulatorManager.selectComponent(this.id);
            this.isOn = !this.isOn;
            
            this.updateVisualState();
            this.simulatorManager._requestSaveState();
        };

        // Attach listener specifically to the switch assembly group
        this.switchClickZone.addEventListener('mousedown', toggle);
        this.switchClickZone.addEventListener('touchstart', toggle);
    }

    updateVisualState() {
        if (!this.sliderHandle) return;
        // Left Position: translate(10, 11) -> Pin 1
        // Right Position: translate(62, 11) -> Pin 2
        const xPos = this.isOn ? 62 : 10;
        this.sliderHandle.setAttribute('transform', `translate(${xPos}, 11)`);
    }

    // --- VOLTAGE RAIL LOGIC ---
    
    // Defines physical connections based on switch state
    getInternalConnections(pinId) {
        if (!this.isOn) {
            // Left Position: Connects COM <-> Pin 1
            if (pinId === 'com') return ['p1'];
            if (pinId === 'p1') return ['com'];
        } else {
            // Right Position: Connects COM <-> Pin 2
            if (pinId === 'com') return ['p2'];
            if (pinId === 'p2') return ['com'];
        }
        return [];
    }

    // It is a passive component, it outputs nothing itself
    getPinOutput(pinId) {
        return -1; 
    }

    static styleInjected = false;
    static injectStyles() {
        if (SlideSwitchModel.styleInjected) return;
        
        const css = `
            .sim-component-body[data-type="slide_switch"] {
                width: 120px; 
                height: 150px;
                position: relative;
                cursor: grab;
            }
            .sim-slide-switch-svg {
                width: 100%; height: 100%;
                filter: drop-shadow(0 6px 10px rgba(0,0,0,0.2));
                overflow: visible;
            }
            .ss-pcb { fill: #2c3e50; stroke: #1a252f; stroke-width: 2; }
            .ss-mount-hole { fill: #ecf0f1; stroke: #95a5a6; stroke-width: 2; }
            
            /* The Toggle Mechanism */
            .ss-click-target { cursor: pointer; pointer-events: auto; }
            
            .ss-casing { stroke: #7f8c8d; stroke-width: 1; }
            .ss-casing-inner { fill: #000; opacity: 0.85; }
            
            .ss-handle-group {
                transition: transform 0.1s cubic-bezier(0.4, 0.0, 0.2, 1);
                filter: drop-shadow(0 2px 3px rgba(0,0,0,0.5));
            }
            .ss-handle-rect { stroke: #000; stroke-width: 1; }
            .ss-handle-grip { stroke: #333; stroke-width: 2; }

            .ss-gold-pad { stroke: #b7950b; stroke-width: 1; }
            .ss-solder { fill: #95a5a6; opacity: 0.7; }
            .ss-pin-label { 
                font-family: Arial, sans-serif; font-size: 10px; 
                fill: #fff; text-anchor: middle; font-weight: bold; pointer-events: none; 
            }
        `;
        
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
        SlideSwitchModel.styleInjected = true;
    }
}

class PotentiometerModel extends VirtualComponent {
    constructor(id, simulatorManager, position, name, componentData) {
        super(id, 'potentiometer', simulatorManager, position, name, componentData);
        this.angle = -135; 
        this.value = 0;    // 0.0 to 1.0
        
        // Electrical Properties
        this.resistance = componentData.resistance || 10;
        this.unit = componentData.unit || 'kΩ';
        this.knobColor = componentData.knobColor || '#2c3e50';

        // Element references
        this.knobGroup = null;
        this.knobOuter = null;
        
        PotentiometerModel.injectStyles();
    }

    render(container) {
        this.element = document.createElement('div');
        this.element.className = 'sim-component';
        this.element.id = this.id;
        this.element.style.left = `${this.position.x}px`;
        this.element.style.top = `${this.position.y}px`;

        const body = document.createElement('div');
        body.className = 'sim-component-body';
        body.dataset.type = this.type;

        const gid = this.id;

        body.innerHTML = `
        <svg viewBox="0 0 240 280" class="sim-potentiometer-svg">
            <defs>
                <linearGradient id="potBaseGrad_${gid}" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#ecf0f1;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#bdc3c7;stop-opacity:1" />
                </linearGradient>
                <radialGradient id="potGoldGrad_${gid}" cx="50%" cy="50%" r="50%">
                    <stop offset="40%" style="stop-color:#f1c40f;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#b7950b;stop-opacity:1" />
                </radialGradient>
            </defs>

            <rect x="20" y="20" width="200" height="200" rx="12" class="pot-pcb" />
            <circle cx="35" cy="35" r="8" class="pot-mount-hole" /><circle cx="205" cy="35" r="8" class="pot-mount-hole" />
            <circle cx="35" cy="205" r="8" class="pot-mount-hole" /><circle cx="205" cy="205" r="8" class="pot-mount-hole" />

            <rect x="45" y="40" width="150" height="150" rx="15" class="pot-body" style="fill: url(#potBaseGrad_${gid});" />
            <rect x="22" y="100" width="23" height="25" fill="#95a5a6" /><rect x="195" y="100" width="23" height="25" fill="#95a5a6" />

            <!-- KNOB GROUP (Target for rotation) -->
            <g class="pot-knob-group" transform="translate(120, 120) rotate(${this.angle})">
                <!-- Hit area -->
                <circle cx="0" cy="0" r="70" fill="transparent" style="cursor: pointer;" />
                <circle cx="3" cy="3" r="60" class="pot-knob-shadow" />
                <circle class="pot-knob-outer" cx="0" cy="0" r="60" style="fill: ${this.knobColor};" />
                <circle cx="0" cy="0" r="48" class="pot-knob-inner" />
                <line x1="0" y1="0" x2="0" y2="-35" class="pot-indicator" />
                <circle cx="0" cy="0" r="5" fill="#7f8c8d" />
            </g>

            <g transform="translate(88, 220)">
                <circle cx="5" cy="-10" r="8" class="pot-gold-pad" style="fill: url(#potGoldGrad_${gid});" />
                <circle cx="32" cy="-10" r="8" class="pot-gold-pad" style="fill: url(#potGoldGrad_${gid});" />
                <circle cx="59" cy="-10" r="8" class="pot-gold-pad" style="fill: url(#potGoldGrad_${gid});" />
                <text x="5" y="-20.5" class="pot-pin-label">GND</text>
                <text x="32" y="-20.5" class="pot-pin-label">SIG</text>
                <text x="59" y="-20.5" class="pot-pin-label">VCC</text>
            </g>
        </svg>
        `;

        this.knobGroup = body.querySelector('.pot-knob-group');
        this.knobOuter = body.querySelector('.pot-knob-outer');

        this.element.appendChild(body);
        container.appendChild(this.element);
        this.renderPins(body);
        
        // 1. Draggable Body
        this.simulatorManager.makeDraggable(body, this);
        
        // 2. Rotatable Knob
        this.addInteractivity(body);
        
        this.updateTransform();
        return this.element;
    }

    setKnobColor(color) {
        this.knobColor = color;
        if (this.knobOuter) this.knobOuter.style.fill = color;
    }

    addInteractivity(body) {
        let startMouseAngle = 0;
        
        const getRawAngle = (e) => {
            const rect = body.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + (rect.height * (120/280)); 
            let rad = Math.atan2(e.clientY - centerY, e.clientX - centerX);
            let deg = rad * (180 / Math.PI);
            deg += 90; 
            return deg;
        };

        const onMouseMove = (e) => {
            e.preventDefault();
            const currentMouseAngle = getRawAngle(e);
            let delta = currentMouseAngle - startMouseAngle;
            if (delta > 180) delta -= 360;
            if (delta < -180) delta += 360;

            let newAngle = this.angle + delta;
            const MIN_ANGLE = -135;
            const MAX_ANGLE = 135;

            if (newAngle < MIN_ANGLE) newAngle = MIN_ANGLE;
            if (newAngle > MAX_ANGLE) newAngle = MAX_ANGLE;

            this.angle = newAngle;
            this.value = (this.angle - MIN_ANGLE) / (MAX_ANGLE - MIN_ANGLE);
            startMouseAngle = currentMouseAngle;
            this.updateVisualState();
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            this.simulatorManager._requestSaveState();
        };

        if (this.knobGroup) {
            this.knobGroup.addEventListener('mousedown', (e) => {
                if (e.button !== 0) return;
                e.preventDefault();
                e.stopPropagation(); // Stop dragging
                
                this.simulatorManager.selectComponent(this.id);
                startMouseAngle = getRawAngle(e);
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });
        }
    }

    updateVisualState() {
        if (this.knobGroup) {
            this.knobGroup.setAttribute('transform', `translate(120, 120) rotate(${this.angle})`);
        }
    }

    // --- Voltage Rail Logic ---
    
    // Pot doesn't short VCC to GND, so no internal connections for logic trace
    getInternalConnections(pinId) { return []; }

    // Output Logic
    getPinOutput(pinId) {
        if (pinId === 'SIG') {
            // 1. Check VCC connection
            const vcc = this.simulatorManager.railManager.getPinLevel(this.id, 'VCC');
            // 2. Check GND connection
            const gnd = this.simulatorManager.railManager.getPinLevel(this.id, 'GND');

            // Needs both to work as a voltage divider
            if (vcc === 1 && gnd === 0) {
                // Return 10-bit value (0-1023)
                return Math.round(this.value * 1023);
            }
        }
        return -1; // Floating if unpowered
    }

    // Legacy fallback not needed but kept for safety (returns 0 if called directly)
    getValue(pinId) { return 0; }

    static styleInjected = false;
    static injectStyles() {
        if (PotentiometerModel.styleInjected) return;
        const css = `
            .sim-component-body[data-type="potentiometer"] { width: 140px; height: 163px; position: relative; cursor: grab; }
            .sim-potentiometer-svg { width: 100%; height: 100%; filter: drop-shadow(0 8px 10px rgba(0,0,0,0.2)); overflow: visible; }
            .pot-pcb { fill: #2c3e50; stroke: #1a252f; stroke-width: 2; }
            .pot-mount-hole { fill: #ecf0f1; stroke: #bdc3c7; stroke-width: 2; }
            .pot-body { stroke: #7f8c8d; stroke-width: 1; }
            .pot-knob-group { cursor: pointer; } 
            .pot-knob-group:hover circle.pot-knob-outer { filter: brightness(1.1); }
            .pot-knob-outer { stroke: #1a252f; stroke-width: 1; transition: fill 0.1s; }
            .pot-knob-inner { fill: #34495e; }
            .pot-indicator { stroke: #ecf0f1; stroke-width: 4; stroke-linecap: round; }
            .pot-knob-shadow { fill: rgba(0,0,0,0.3); filter: blur(3px); }
            .pot-gold-pad { stroke: #b7950b; stroke-width: 1; }
            .pot-pin-label { font-family: Arial, sans-serif; font-size: 11px; fill: #fff; text-anchor: middle; font-weight: bold; text-shadow: 0 1px 2px rgba(0,0,0,0.5); pointer-events: none; }
        `;
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
        PotentiometerModel.styleInjected = true;
    }
}

class UltrasonicModel extends VirtualComponent {
    constructor(id, simulatorManager, position, name, componentData) {
        super(id, 'ultrasonic', simulatorManager, position, name, componentData);
        
        // Simulation State
        this.distanceCm = 0;
        this.maxRangeCm = 400;
        this.virtualObject = { x: 0, y: -200 }; // Starts centered above sensor
        
        // References
        this.coneLayer = null;
        this.conePath = null;
        this.objectElement = null;
        this.textDist = null;
        this.waves = [];
        
        UltrasonicModel.injectStyles();
    }

    render(container) {
        this.element = document.createElement('div');
        this.element.className = 'sim-component';
        this.element.id = this.id;
        this.element.style.left = `${this.position.x}px`;
        this.element.style.top = `${this.position.y}px`;

        const body = document.createElement('div');
        body.className = 'sim-component-body';
        body.dataset.type = this.type;

        const gid = this.id;

        body.innerHTML = `
            <!-- Cone Layer: Initially hidden -->
            <div class="us-cone-layer" style="display:none;">
                <svg viewBox="0 0 400 400" class="us-cone-svg">
                    <defs>
                        <linearGradient id="coneGrad_${gid}" x1="0%" y1="100%" x2="0%" y2="0%">
                            <stop offset="0%" style="stop-color:rgba(52, 152, 219, 0.4)" />
                            <stop offset="100%" style="stop-color:rgba(52, 152, 219, 0.05)" />
                        </linearGradient>
                    </defs>
                    <path class="us-detection-zone" d="" style="fill: url(#coneGrad_${gid});" />
                </svg>
                <div class="us-sim-object"></div>
            </div>

            <!-- Sensor Body -->
            <svg viewBox="0 0 260 130" class="sim-ultrasonic-svg">
                <defs>
                    <linearGradient id="silverGrad_${gid}" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#f9f9f9;stop-opacity:1" />
                        <stop offset="50%" style="stop-color:#dcdcdc;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#bfbfbf;stop-opacity:1" />
                    </linearGradient>
                    <radialGradient id="goldGrad_${gid}" cx="50%" cy="50%" r="50%">
                        <stop offset="40%" style="stop-color:#f1c40f;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#b7950b;stop-opacity:1" />
                    </radialGradient>
                    <pattern id="meshPattern_${gid}" x="0" y="0" width="3" height="3" patternUnits="userSpaceOnUse">
                        <circle cx="1.5" cy="1.5" r="1" fill="#111" />
                    </pattern>
                </defs>
                
                <rect x="0" y="0" width="260" height="130" rx="10" class="us-pcb" />
                
                <circle cx="15" cy="15" r="7" class="us-mount-hole" /><circle cx="245" cy="15" r="7" class="us-mount-hole" />
                <circle cx="15" cy="115" r="7" class="us-mount-hole" /><circle cx="245" cy="115" r="7" class="us-mount-hole" />

                <rect x="105" y="10" width="50" height="14" class="us-crystal" />
                
                <text x="130" y="40" class="us-text-title">HC-SR04</text>
                <text x="130" y="60" class="us-text-val">---</text>

                <g transform="translate(60, 65)">
                    <circle cx="0" cy="0" r="42" class="us-eye-case" style="fill: url(#silverGrad_${gid});" />
                    <circle cx="0" cy="0" r="36" class="us-eye-inner" />
                    <circle cx="0" cy="0" r="36" class="us-eye-mesh" style="fill: url(#meshPattern_${gid});" />
                    <circle cx="0" cy="0" r="30" class="us-eye-ring" />
                    <circle cx="0" cy="0" r="10" class="us-wave wave1" />
                    <circle cx="0" cy="0" r="10" class="us-wave wave2" />
                </g>

                <g transform="translate(200, 65)">
                    <circle cx="0" cy="0" r="42" class="us-eye-case" style="fill: url(#silverGrad_${gid});" />
                    <circle cx="0" cy="0" r="36" class="us-eye-inner" />
                    <circle cx="0" cy="0" r="36" class="us-eye-mesh" style="fill: url(#meshPattern_${gid});" />
                    <circle cx="0" cy="0" r="30" class="us-eye-ring" />
                </g>

                <g transform="translate(130, 118)">
                    <g transform="translate(-24, 0)"><text x="5" y="-10" transform="rotate(-90 0,-12)" class="us-text-label">Vcc</text><circle cy="0" r="6" class="us-gold-pad" style="fill: url(#goldGrad_${gid});" /></g>
                    <g transform="translate(-8, 0)"><text x="7" y="-10" transform="rotate(-90 0,-12)" class="us-text-label">Trig</text><circle cy="0" r="6" class="us-gold-pad" style="fill: url(#goldGrad_${gid});" /></g>
                    <g transform="translate(8, 0)"><text x="7" y="-10" transform="rotate(-90 0,-12)" class="us-text-label">Echo</text><circle cy="0" r="6" class="us-gold-pad" style="fill: url(#goldGrad_${gid});" /></g>
                    <g transform="translate(24, 0)"><text x="5" y="-10" transform="rotate(-90 0,-12)" class="us-text-label">Gnd</text><circle cy="0" r="6" class="us-gold-pad" style="fill: url(#goldGrad_${gid});" /></g>
                </g>
            </svg>
        `;

        this.coneLayer = body.querySelector('.us-cone-layer');
        this.conePath = body.querySelector('.us-detection-zone');
        this.objectElement = body.querySelector('.us-sim-object');
        this.textDist = body.querySelector('.us-text-val');
        this.waves = Array.from(body.querySelectorAll('.us-wave'));
        
        this.element.appendChild(body);
        container.appendChild(this.element);

        this.renderPins(body);
        this.simulatorManager.makeDraggable(body, this);
        
        this.setupInteractivity();
        this.updateVisualState();

        return this.element;
    }

    renderPins(container) {
        const pins = [
            { id: 'VCC', x: '40.8%', y: '90.8%' },
            { id: 'Trig', x: '46.9%', y: '90.8%' },
            { id: 'Echo', x: '53.1%', y: '90.8%' },
            { id: 'GND', x: '59.2%', y: '90.8%' }
        ];

        pins.forEach(p => {
            const pin = document.createElement('div');
            pin.className = 'sim-pin-hotspot component-pin';
            pin.dataset.componentId = this.id;
            pin.dataset.pinId = p.id;
            pin.title = p.id;
            pin.style.left = p.x; 
            pin.style.top = p.y;
            container.appendChild(pin);
            pin.addEventListener('click', (e) => {
                e.stopPropagation();
                this.simulatorManager.handlePinClick(pin, e);
            });
        });
    }

    setupInteractivity() {
        let startX, startY, initialObjX, initialObjY;

        const onMouseMove = (e) => {
            e.preventDefault(); e.stopPropagation();
            const zoom = this.simulatorManager.zoom;
            this.virtualObject.x = initialObjX + (e.clientX - startX) / zoom;
            this.virtualObject.y = initialObjY + (e.clientY - startY) / zoom;
            this.updateVisualState();
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        if (this.objectElement) {
            this.objectElement.addEventListener('mousedown', (e) => {
                // Only interactive if simulation running
                if (!this.simulatorManager.ide.isSimulationRunning) return;
                
                e.preventDefault(); e.stopPropagation();
                this.simulatorManager.selectComponent(this.id);
                startX = e.clientX; startY = e.clientY;
                initialObjX = this.virtualObject.x; initialObjY = this.virtualObject.y;
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });
        }
    }

    step(deltaTime) {
        this.updateVisualState();
    }

    updateVisualState() {
        // Check Sim State & Power Rails
        const isSimRunning = this.simulatorManager.ide.isSimulationRunning;
        const vcc = this.simulatorManager.railManager.getPinLevel(this.id, 'VCC');
        const gnd = this.simulatorManager.railManager.getPinLevel(this.id, 'GND');
        const isPowered = (vcc === 1 && gnd === 0);

        // Hide if stopped or unpowered
        if (!isSimRunning || !isPowered) {
            if (this.coneLayer) this.coneLayer.style.display = 'none';
            this.textDist.textContent = '---';
            this.distanceCm = 0;
            this.waves.forEach(w => w.style.opacity = 0);
            return;
        }

        // Show if running
        if (this.coneLayer) this.coneLayer.style.display = 'block';

        // Position Object
        const ORIGIN_X = 200; 
        const ORIGIN_Y = 380;
        const svgObjX = ORIGIN_X + this.virtualObject.x;
        const svgObjY = ORIGIN_Y + this.virtualObject.y;
        this.objectElement.style.transform = `translate(${svgObjX}px, ${svgObjY}px) translate(-50%, -50%)`;

        // Calc Distance
        const dx = this.virtualObject.x; 
        const dy = this.virtualObject.y;
        const distPx = Math.sqrt(dx*dx + dy*dy);
        const angle = Math.atan2(dy, dx); 
        const angleDiff = Math.abs(angle - (-Math.PI/2));
        
        const MAX_RANGE_PX = 380; 
        const FOV_ANGLE = 30 * (Math.PI / 180); 

        const inRange = distPx <= MAX_RANGE_PX && distPx > 20 && dy < 0;
        const inCone = angleDiff <= (FOV_ANGLE / 2);
        const isDetected = inRange && inCone;

        // Draw Cone
        const halfA = FOV_ANGLE / 2;
        const x1 = ORIGIN_X + MAX_RANGE_PX * Math.sin(-halfA);
        const y1 = ORIGIN_Y - MAX_RANGE_PX * Math.cos(-halfA);
        const x2 = ORIGIN_X + MAX_RANGE_PX * Math.sin(halfA);
        const y2 = ORIGIN_Y - MAX_RANGE_PX * Math.cos(halfA);
        const pathD = `M ${ORIGIN_X},${ORIGIN_Y} L ${x1},${y1} A ${MAX_RANGE_PX},${MAX_RANGE_PX} 0 0 1 ${x2},${y2} Z`;
        this.conePath.setAttribute('d', pathD);

        if (isDetected) {
            this.conePath.classList.add('active');
            this.waves.forEach(w => w.style.opacity = 1);
            this.distanceCm = Math.round(distPx);
            this.textDist.textContent = `${this.distanceCm} cm`;
            this.textDist.style.fill = '#4cd137';
        } else {
            this.conePath.classList.remove('active');
            this.waves.forEach(w => w.style.opacity = 0);
            this.distanceCm = this.maxRangeCm; 
            this.textDist.textContent = `> 400`;
            this.textDist.style.fill = '#e74c3c';
        }
    }

    getValue(pinId) {
        // Only return if powered
        const vcc = this.simulatorManager.railManager.getPinLevel(this.id, 'VCC');
        const gnd = this.simulatorManager.railManager.getPinLevel(this.id, 'GND');
        if (vcc !== 1 || gnd !== 0) return -1;

        if (pinId === 'Echo') return this.distanceCm;
        return 0;
    }

    getInternalConnections(pinId) { return []; }
    getPinOutput(pinId) { return -1; }

    static styleInjected = false;
    static injectStyles() {
        if (UltrasonicModel.styleInjected) return;
        const css = `
            .sim-component-body[data-type="ultrasonic"] {
                width: 260px; height: 130px;
                position: relative;
                cursor: grab;
                overflow: visible !important; 
            }
            
            .us-cone-layer {
                position: absolute;
                bottom: 50%; left: 50%;
                width: 400px; height: 400px;
                transform: translate(-50%, 0);
                pointer-events: none; /* IMPORTANT: Pass clicks through empty space */
                z-index: 0;
            }
            
            .sim-ultrasonic-svg {
                width: 100%; height: 100%;
                position: relative; z-index: 2;
                filter: drop-shadow(0 5px 10px rgba(0,0,0,0.2));
            }
            
            /* SVG Styles */
            .us-pcb { fill: #204060; stroke: #152a40; stroke-width: 2; }
            .us-mount-hole { fill: #fff; stroke: #bdc3c7; stroke-width: 2; }
            .us-crystal { fill: #bdc3c7; stroke: #999; stroke-width: 1; rx: 4; }
            .us-text-title { font-family: serif; font-weight: 900; font-size: 16px; fill: #fff; text-anchor: middle; letter-spacing: 1px; }
            .us-text-val { font-family: monospace; font-size: 12px; fill: #e74c3c; text-anchor: middle; font-weight: bold; }
            .us-text-label { font-family: monospace; font-size: 10px; fill: #fff; font-weight: bold; }
            .us-eye-case { stroke: #999; stroke-width: 1; }
            .us-eye-inner { fill: #333; }
            .us-eye-ring { fill: none; stroke: #a8a228; stroke-width: 3; opacity: 0.8; }
            .us-eye-mesh { opacity: 0.6; }
            .us-gold-pad { stroke: #b7950b; stroke-width: 1; }

            /* Cone */
            .us-detection-zone {
                fill: rgba(52, 152, 219, 0.1);
                stroke: rgba(52, 152, 219, 0.3);
                stroke-width: 2;
                stroke-dasharray: 8,4;
                transition: stroke 0.2s, fill 0.2s;
                pointer-events: none;
            }
            .us-detection-zone.active {
                fill: rgba(46, 204, 113, 0.2);
                stroke: #2ecc71;
            }
            
            /* Object */
            .us-sim-object {
                width: 24px; height: 24px;
                background: #e74c3c;
                border: 2px solid white;
                border-radius: 50%;
                position: absolute;
                top: 0; left: 0;
                box-shadow: 0 0 12px rgba(231, 76, 60, 0.8);
                cursor: move;
                pointer-events: auto; /* Enable dragging ONLY on object */
                z-index: 10;
            }
            .us-sim-object:active { cursor: grabbing; transform: scale(1.2); }

            /* Waves */
            .us-wave {
                fill: none; stroke: rgba(255,255,255,0.8); stroke-width: 2;
                opacity: 0; pointer-events: none;
                animation: us-ripple 1s linear infinite;
                transition: opacity 0.1s ease-out;
            }
            .us-wave.wave2 { animation-delay: 0.3s; }

            @keyframes us-ripple {
                0% { r: 10; stroke-width: 4; }
                100% { r: 60; stroke-width: 0; }
            }
        `;
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
        UltrasonicModel.styleInjected = true;
    }
}

class IRSensorModel extends VirtualComponent {
    constructor(id, simulatorManager, position, name, componentData) {
        super(id, 'ir_sensor', simulatorManager, position, name, componentData);

        // --- State ---
        this.sensitivityRange = 150; 
        this.potRotation = 135; 
        this.outputMode = componentData.outputMode || 'digital'; 
        this.isDetecting = false;
        this.analogValue = 1023; // Default High (No obstruction)

        // --- Interactive Elements ---
        // x=0 is center, y=-120 is 120px ABOVE the sensor tips
        this.virtualObject = { x: 0, y: -120 }; 
        
        // Element References
        this.coneLayer = null;
        this.conePath = null;
        this.sigLed = null;
        this.potScrew = null;
        this.objectElement = null;

        IRSensorModel.injectStyles();
    }

    render(container) {
        this.element = document.createElement('div');
        this.element.className = 'sim-component';
        this.element.id = this.id;
        this.element.style.left = `${this.position.x}px`;
        this.element.style.top = `${this.position.y}px`;

        const body = document.createElement('div');
        body.className = 'sim-component-body';
        body.dataset.type = this.type;

        const gid = this.id;

        body.innerHTML = `
            <!-- 1. Cone Layer (Overlays the whole component) -->
            <!-- Initially hidden via inline style -->
            <div class="ir-cone-layer" style="display:none;">
                <svg class="ir-cone-svg">
                    <path class="ir-detection-zone" d="" />
                </svg>
                <!-- Object (Red Ball - Interactive) -->
                <div class="ir-sim-object"></div>
            </div>

            <!-- 2. Main Sensor Body -->
            <svg viewBox="0 0 90 230" class="sim-ir-svg">
                <defs>
                    <linearGradient id="clearGrad_${gid}" x1="30%" y1="30%" x2="80%" y2="80%">
                        <stop offset="0%" style="stop-color:#fff;stop-opacity:0.95" />
                        <stop offset="100%" style="stop-color:#ddd;stop-opacity:0.9" />
                    </linearGradient>
                    <radialGradient id="blackGrad_${gid}" cx="30%" cy="30%" r="70%">
                        <stop offset="0%" style="stop-color:#555;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#000;stop-opacity:1" />
                    </radialGradient>
                    <radialGradient id="goldGrad_${gid}" cx="50%" cy="50%" r="50%">
                        <stop offset="40%" style="stop-color:#f1c40f;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#b7950b;stop-opacity:1" />
                    </radialGradient>
                </defs>

                <!-- Center X=45. Shift Y=60 so LEDs are visible -->
                <g transform="translate(45, 60)">
                    <!-- LED LEGS -->
                    <line x1="-23" y1="0" x2="-23" y2="-11" class="ir-led-leg" /><line x1="-12" y1="0" x2="-12" y2="-11" class="ir-led-leg" />
                    <line x1="12" y1="0" x2="12" y2="-11" class="ir-led-leg" /><line x1="23" y1="0" x2="23" y2="-11" class="ir-led-leg" />

                    <!-- PCB BOARD -->
                    <rect x="-45" y="0" width="90" height="165" rx="4" class="ir-pcb-board" />
                    
                    <!-- HOLES -->
                    <circle cx="-23" cy="4" r="3" class="ir-led-hole" style="fill:url(#goldGrad_${gid})" /><circle cx="-12" cy="4" r="3" class="ir-led-hole" style="fill:url(#goldGrad_${gid})" />
                    <circle cx="12" cy="4" r="3" class="ir-led-hole" style="fill:url(#goldGrad_${gid})" /><circle cx="23" cy="4" r="3" class="ir-led-hole" style="fill:url(#goldGrad_${gid})" />

                    <!-- IR LED HEADS -->
                    <g transform="translate(-17.5, -11)">
                        <path d="M -14,0 L -14,-28 A 14,14 0 0 1 14,-28 L 14,0 Z" style="fill:url(#clearGrad_${gid})" class="ir-body-clear" />
                        <rect x="-5" y="-20" width="4" height="18" class="ir-internal" /><path d="M 1,-18 L 1,-8 L 6,-10 Z" class="ir-internal" />
                    </g>
                    <g transform="translate(17.5, -11)">
                        <path d="M -14,0 L -14,-28 A 14,14 0 0 1 14,-28 L 14,0 Z" style="fill:url(#blackGrad_${gid})" class="ir-body-black" />
                    </g>

                    <!-- COMPONENTS -->
                    <text x="0" y="24" class="ir-silk-text ir-silk-title">IR Sensor</text>

                    <g transform="translate(-30, 35)">
                        <rect x="-4" y="0" width="10" height="6" class="ir-smd-resistor" /><rect x="-6" y="0" width="2" height="6" class="ir-smd-pad" /><rect x="6" y="0" width="2" height="6" class="ir-smd-pad" />
                        <rect x="13" y="0" width="10" height="6" class="ir-smd-resistor" /><rect x="11" y="0" width="2" height="6" class="ir-smd-pad" /><rect x="23" y="0" width="2" height="6" class="ir-smd-pad" />
                        <rect x="31" y="0" width="10" height="6" class="ir-smd-resistor" /><rect x="29" y="0" width="2" height="6" class="ir-smd-pad" /><rect x="41" y="0" width="2" height="6" class="ir-smd-pad" />
                        <rect x="49" y="0" width="10" height="6" class="ir-smd-cap" /><rect x="47" y="0" width="2" height="6" class="ir-smd-pad" /><rect x="59" y="0" width="2" height="6" class="ir-smd-pad" />
                    </g>

                    <g transform="translate(-38, 55)">
                        <rect x="0" y="0" width="35" height="35" class="ir-chip-ic" rx="1" />
                        <rect x="-3" y="4" width="3" height="4" class="ir-chip-leg" /><rect x="-3" y="12" width="3" height="4" class="ir-chip-leg" /><rect x="-3" y="20" width="3" height="4" class="ir-chip-leg" /><rect x="-3" y="28" width="3" height="4" class="ir-chip-leg" />
                        <rect x="35" y="4" width="3" height="4" class="ir-chip-leg" /><rect x="35" y="12" width="3" height="4" class="ir-chip-leg" /><rect x="35" y="20" width="3" height="4" class="ir-chip-leg" /><rect x="35" y="28" width="3" height="4" class="ir-chip-leg" />
                        <text x="17.5" y="20" fill="#666" font-size="6" text-anchor="middle" font-family="monospace">393</text>
                    </g>
                    
                    <!-- Trimpot -->
                    <g transform="translate(5, 55)" class="ir-pot-group">
                        <rect x="0" y="0" width="32" height="32" class="ir-trim-box" rx="1" />
                        <circle cx="16" cy="16" r="12" class="ir-trim-knob" />
                        <g class="ir-pot-screw" transform="rotate(${this.potRotation}, 16, 16)">
                            <line x1="10" y1="16" x2="22" y2="16" class="ir-trim-cross" />
                            <line x1="16" y1="10" x2="16" y2="22" class="ir-trim-cross" />
                        </g>
                    </g>

                    <g transform="translate(-30, 100)">
                        <rect x="5" y="0" width="10" height="6" class="ir-smd-resistor" /><rect x="3" y="0" width="2" height="6" class="ir-smd-pad" /><rect x="15" y="0" width="2" height="6" class="ir-smd-pad" />
                        <rect x="45" y="0" width="10" height="6" class="ir-smd-resistor" /><rect x="43" y="0" width="2" height="6" class="ir-smd-pad" /><rect x="55" y="0" width="2" height="6" class="ir-smd-pad" />
                    </g>

                    <!-- Status LEDs -->
                    <g transform="translate(-20, 115)">
                        <rect x="0" y="0" width="8" height="12" class="ir-smd-led-off" style="fill:#ff3333; filter:drop-shadow(0 0 3px red);" />
                        <text x="4" y="20" class="ir-silk-text" style="font-size:6px">PWR</text>
                    </g>
                    <g transform="translate(15, 115)">
                        <rect class="ir-sig-led ir-smd-led-off" x="0" y="0" width="8" height="12" />
                        <text x="4" y="20" class="ir-silk-text" style="font-size:6px">DAT</text>
                    </g>

                    <text x="-22" y="148" class="ir-silk-text" style="fill:#88aaff">OUT</text>
                    <text x="0" y="148" class="ir-silk-text" style="fill:#aaa">GND</text>
                    <text x="22" y="148" class="ir-silk-text" style="fill:#aaa">VCC</text>

                    <!-- PINS -->
                    <g transform="translate(0, 165)">
                        <circle cx="-22" cy="-10" r="5" class="ir-gold-pad" style="fill:url(#goldGrad_${gid})" />
                        <circle cx="0" cy="-10" r="5" class="ir-gold-pad" style="fill:url(#goldGrad_${gid})" />
                        <circle cx="22" cy="-10" r="5" class="ir-gold-pad" style="fill:url(#goldGrad_${gid})" />
                    </g>
                </g>
            </svg>
        `;

        this.coneLayer = body.querySelector('.ir-cone-layer');
        this.conePath = body.querySelector('.ir-detection-zone');
        this.objectElement = body.querySelector('.ir-sim-object');
        this.sigLed = body.querySelector('.ir-sig-led');
        this.potScrew = body.querySelector('.ir-pot-screw');
        
        const potGroup = body.querySelector('.ir-pot-group');

        this.element.appendChild(body);
        container.appendChild(this.element);

        this.renderPins(body);
        this.simulatorManager.makeDraggable(body, this);
        
        this.setupObjectDrag();
        this.setupPotRotation(potGroup);
        
        // Initial state check
        this.updateVisualState();

        return this.element;
    }

    renderPins(container) {
        // Correct pin positions based on SVG geometry
        const pinConfigs = [
            { id: 'OUT', x: '26%', y: '93.5%' },
            { id: 'GND', x: '50%', y: '93.5%' },
            { id: 'VCC', x: '74%', y: '93.5%' }
        ];

        pinConfigs.forEach(config => {
            const pinElement = document.createElement('div');
            pinElement.className = 'sim-pin-hotspot component-pin';
            pinElement.dataset.componentId = this.id;
            pinElement.dataset.pinId = config.id;
            pinElement.title = config.id;
            pinElement.style.left = config.x;
            pinElement.style.top = config.y;
            pinElement.style.zIndex = '20'; 

            container.appendChild(pinElement);
            pinElement.addEventListener('click', (e) => {
                e.stopPropagation();
                this.simulatorManager.handlePinClick(pinElement, e);
            });
        });
    }

    setupObjectDrag() {
        let startX, startY, initialObjX, initialObjY;
        
        const onMouseMove = (e) => {
            e.preventDefault(); e.stopPropagation();
            const zoom = this.simulatorManager.zoom;
            this.virtualObject.x = initialObjX + (e.clientX - startX) / zoom;
            this.virtualObject.y = initialObjY + (e.clientY - startY) / zoom;
            this.updateVisualState();
        };
        
        const onMouseUp = () => { 
            document.removeEventListener('mousemove', onMouseMove); 
            document.removeEventListener('mouseup', onMouseUp); 
        };
        
        this.objectElement.addEventListener('mousedown', (e) => {
            // PREVENT INTERACTION IF NOT RUNNING
            if (!this.simulatorManager.ide.isSimulationRunning) return;

            e.preventDefault(); e.stopPropagation();
            this.simulatorManager.selectComponent(this.id);
            startX = e.clientX; 
            startY = e.clientY;
            initialObjX = this.virtualObject.x; 
            initialObjY = this.virtualObject.y;
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    }

    setupPotRotation(potGroup) {
        let startY;
        const onMouseMove = (e) => {
            e.preventDefault(); e.stopPropagation();
            let movement = (e.clientY - startY) * 2; 
            let newRot = this.potRotation - movement;
            if(newRot < 0) newRot = 0;
            if(newRot > 270) newRot = 270;
            this.potRotation = newRot;
            startY = e.clientY;
            this.updateVisualState();
        };
        
        const onMouseUp = () => { 
            document.removeEventListener('mousemove', onMouseMove); 
            document.removeEventListener('mouseup', onMouseUp); 
            this.simulatorManager._requestSaveState();
        };

        potGroup.addEventListener('mousedown', (e) => {
            e.preventDefault(); e.stopPropagation();
            this.simulatorManager.selectComponent(this.id);
            startY = e.clientY;
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    }

    step(deltaTime) {
        this.updateVisualState();
    }

    updateVisualState() {
        // 1. Check Power & Simulation Status
        const isSimRunning = this.simulatorManager.ide.isSimulationRunning;
        const vcc = this.simulatorManager.railManager.getPinLevel(this.id, 'VCC');
        const gnd = this.simulatorManager.railManager.getPinLevel(this.id, 'GND');
        const isPowered = (vcc === 1 && gnd === 0);

        // Update Pot Visual (Always works physically)
        if (this.potScrew) {
            this.potScrew.setAttribute('transform', `rotate(${this.potRotation}, 16, 16)`);
        }

        // If dead or stopped, hide cone/object and reset outputs
        if (!isSimRunning || !isPowered) {
            if (this.coneLayer) this.coneLayer.style.display = 'none';
            if (this.sigLed) {
                this.sigLed.style.fill = "#341a1a";
                this.sigLed.style.filter = "none";
                this.sigLed.style.opacity = 1;
            }
            this.analogValue = 1023; // Default state (High Impedance / Pullup behavior)
            this.isDetecting = false;
            return;
        }

        // Powered & Running: Show Cone
        if (this.coneLayer) this.coneLayer.style.display = 'block';

        // 2. Calculate Sensitivity
        let potFactor = this.potRotation / 270;
        this.sensitivityRange = 50 + (potFactor * 300);

        // 3. Draw Cone Geometry
        const ORIGIN_X = 45; 
        const ORIGIN_Y = 21; 
        const FOV_ANGLE = 40 * (Math.PI / 180);
        const halfA = FOV_ANGLE / 2;

        // Arc points (Projecting Up = Negative Y)
        const x1 = ORIGIN_X + this.sensitivityRange * Math.sin(-halfA);
        const y1 = ORIGIN_Y - this.sensitivityRange * Math.cos(-halfA);
        const x2 = ORIGIN_X + this.sensitivityRange * Math.sin(halfA);
        const y2 = ORIGIN_Y - this.sensitivityRange * Math.cos(halfA);

        if (this.conePath) {
            const d = `M ${ORIGIN_X},${ORIGIN_Y} L ${x1},${y1} A ${this.sensitivityRange},${this.sensitivityRange} 0 0 1 ${x2},${y2} Z`;
            this.conePath.setAttribute('d', d);
        }

        // 4. Update Object Position
        if (this.objectElement) {
            this.objectElement.style.left = `${45 + this.virtualObject.x}px`; 
            this.objectElement.style.top = `${21 + this.virtualObject.y}px`; 
        }

        // 5. Physics Calculation
        const dx = this.virtualObject.x; 
        const dy = this.virtualObject.y; 
        const dist = Math.sqrt(dx*dx + dy*dy);
        const angle = Math.atan2(dy, dx);
        const angleDiff = Math.abs(angle - (-Math.PI/2)); // Angle relative to Up

        const inRange = dist <= this.sensitivityRange;
        const inCone = angleDiff <= halfA;
        const detected = inRange && inCone && (dy < 0); 
        this.isDetecting = detected;

        // 6. Output Logic
        if (this.outputMode === 'analog') {
            if (detected) {
                let intensity = 1 - (dist / this.sensitivityRange);
                this.analogValue = Math.round(intensity * 1023);
                this.conePath.classList.add('active');
                this.sigLed.style.fill = "#33ff33";
                this.sigLed.style.filter = "drop-shadow(0 0 5px #00ff00)";
                this.sigLed.style.opacity = intensity + 0.2;
            } else {
                this.analogValue = 0;
                this.conePath.classList.remove('active');
                this.sigLed.style.fill = "#341a1a";
                this.sigLed.style.filter = "none";
                this.sigLed.style.opacity = 1;
            }
        } else {
            if (detected) {
                this.analogValue = 0; // Active Low
                this.conePath.classList.add('active');
                this.sigLed.style.fill = "#33ff33";
                this.sigLed.style.filter = "drop-shadow(0 0 5px #00ff00)";
            } else {
                this.analogValue = 1; 
                this.conePath.classList.remove('active');
                this.sigLed.style.fill = "#341a1a";
                this.sigLed.style.filter = "none";
            }
            this.sigLed.style.opacity = 1;
        }
    }

    getInternalConnections(pinId) { return []; }

    getPinOutput(pinId) {
        // Rail Manager Logic: Check power first
        const vcc = this.simulatorManager.railManager.getPinLevel(this.id, 'VCC');
        const gnd = this.simulatorManager.railManager.getPinLevel(this.id, 'GND');
        
        if (vcc !== 1 || gnd !== 0) return -1;

        if (pinId === 'OUT') {
            if (this.outputMode === 'analog') return this.analogValue;
            return this.isDetecting ? 0 : 1; // Digital Active Low
        }
        return -1;
    }

    getValue(pinId) {
        if (pinId === 'OUT') return this.analogValue;
        return 0;
    }

    static styleInjected = false;
    static injectStyles() {
        if (IRSensorModel.styleInjected) return;
        const styleId = 'sim-ir-styles';
        const css = `
            .sim-component-body[data-type="ir_sensor"] {
                width: 90px; 
                height: 230px;
                position: relative; cursor: grab;
                overflow: visible !important; 
            }

            .ir-cone-layer {
                position: absolute; 
                top: 0; left: 0; width: 100%; height: 100%;
                overflow: visible; 
                pointer-events: none; /* Important: Pass clicks through */
                z-index: 0;
            }
            .ir-cone-svg {
                width: 100%; height: 100%;
                overflow: visible;
            }
            .ir-detection-zone {
                fill: rgba(46, 204, 113, 0.2);
                stroke: rgba(39, 174, 96, 0.6);
                stroke-width: 1;
                stroke-dasharray: 5,5;
                transition: fill 0.1s;
                pointer-events: none;
                mix-blend-mode: multiply;
            }
            .ir-detection-zone.active {
                fill: rgba(46, 204, 113, 0.4);
                stroke-width: 2;
                stroke-dasharray: 0;
            }

            .ir-sim-object {
                width: 24px; height: 24px;
                background: #e74c3c;
                border: 2px solid #fff;
                border-radius: 50%;
                position: absolute;
                /* Center anchor */
                transform: translate(-50%, -50%);
                box-shadow: 0 0 10px rgba(0,0,0,0.2);
                cursor: move; 
                pointer-events: auto; /* Enable drag on object */
                z-index: 10;
            }
            .ir-sim-object:active { cursor: grabbing; background: #c0392b; }

            .sim-ir-svg {
                width: 100%; height: 100%; 
                position: relative; z-index: 2;
                filter: drop-shadow(0 10px 20px rgba(0,0,0,0.2));
            }

            .ir-pcb-board { fill: #1e3a5e; stroke: #0f1e30; stroke-width: 2; }
            .ir-led-hole { stroke: #b7950b; stroke-width: 1; }
            .ir-led-leg { stroke: #bdc3c7; stroke-width: 4.2; stroke-linecap: round; }
            
            .ir-body-clear { stroke: #aaa; stroke-width: 0.5; }
            .ir-body-black { stroke: #000; stroke-width: 0.5; }
            
            .ir-internal { fill: #999; }

            .ir-trim-box { fill: #0055cc; stroke: #003399; stroke-width: 1; cursor: ns-resize; }
            .ir-trim-knob { fill: #ccc; stroke: #888; stroke-width: 1; }
            .ir-trim-cross { stroke: #333; stroke-width: 2.5; stroke-linecap: round; }
            .ir-pot-group:hover .ir-trim-knob { fill: #fff; }
            
            .ir-chip-ic { fill: #1a1a1a; stroke: #000; stroke-width: 1; }
            .ir-chip-leg { fill: #ccc; }
            
            .ir-smd-resistor { fill: #111; stroke: #000; stroke-width: 0.5; }
            .ir-smd-cap { fill: #c2a87c; stroke: #8a704d; stroke-width: 0.5; }
            .ir-smd-pad { fill: #bdc3c7; }
            
            .ir-smd-led-off { fill: #341a1a; stroke: #333; stroke-width: 0.5; transition: fill 0.1s; }
            
            .ir-gold-pad { stroke: #b7950b; stroke-width: 1; }
            .ir-silk-text { fill: #aab; font-family: Arial, sans-serif; font-size: 8px; font-weight: bold; text-anchor: middle; pointer-events: none;}
            .ir-silk-title { font-size: 12px; fill: #fff; opacity: 0.95; letter-spacing: 0.5px; }
        `;
        
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = css;
        document.head.appendChild(style);
        IRSensorModel.styleInjected = true;
    }
}

class LDRModel extends VirtualComponent {
    constructor(id, simulatorManager, position, name, componentData) {
        super(id, 'ldr', simulatorManager, position, name, componentData);

        this.lightLevel = 50; 
        this.threshold = 50;
        this.potRotation = 135;
        this.outputMode = componentData.outputMode || 'digital'; 
        this.isDetecting = false;
        this.analogValue = 512; 

        this.sigLed = null;
        this.potScrew = null;
        this.lightCone = null;
        this.sunIcon = null;
        this.controlPanel = null;

        LDRModel.injectStyles();
    }

    render(container) {
        this.element = document.createElement('div');
        this.element.className = 'sim-component';
        this.element.id = this.id;
        this.element.style.left = `${this.position.x}px`;
        this.element.style.top = `${this.position.y}px`;

        const body = document.createElement('div');
        body.className = 'sim-component-body';
        body.dataset.type = this.type;

        const gid = this.id;

        body.innerHTML = `
            <!-- 1. Controls -->
            <div class="ldr-controls-wrapper" style="display:none;">
                <div class="ldr-slider-container">
                    <input type="range" class="ldr-vertical-slider" min="0" max="100" value="50">
                </div>
                <div class="ldr-sun-icon"></div>
            </div>

            <!-- 2. Light Cone -->
            <svg class="ldr-cone-svg" viewBox="0 0 90 420" preserveAspectRatio="none" style="opacity:0;">
                <defs>
                    <linearGradient id="rayGrad_${gid}" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#fff176;stop-opacity:0.6" />
                        <stop offset="100%" style="stop-color:#fff176;stop-opacity:0.0" />
                    </linearGradient>
                </defs>
                <path class="ldr-light-ray" d="M 45,40 L 25,230 L 65,230 Z" style="fill: url(#rayGrad_${gid});" />
            </svg>

            <!-- 3. PCB Container -->
            <div class="ldr-pcb-container">
                <svg viewBox="0 0 90 200" class="sim-ldr-svg">
                    <defs>
                        <radialGradient id="goldGrad_${gid}" cx="50%" cy="50%" r="50%">
                            <stop offset="40%" style="stop-color:#f1c40f;stop-opacity:1" />
                            <stop offset="100%" style="stop-color:#b7950b;stop-opacity:1" />
                        </radialGradient>
                        <linearGradient id="ldrFace_${gid}" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style="stop-color:#fff" />
                            <stop offset="100%" style="stop-color:#ddd" />
                        </linearGradient>
                    </defs>

                    <g transform="translate(45, 40)">
                        <line x1="-8" y1="0" x2="-8" y2="-22" class="ldr-legs" />
                        <line x1="8" y1="0" x2="8" y2="-22" class="ldr-legs" />
                        <rect x="-45" y="0" width="90" height="160" rx="4" class="ldr-pcb-board" />
                        
                        <circle cx="-8" cy="4" r="3" class="ldr-led-hole" style="fill:url(#goldGrad_${gid})" />
                        <circle cx="8" cy="4" r="3" class="ldr-led-hole" style="fill:url(#goldGrad_${gid})" />

                        <g transform="translate(0, -25)">
                            <circle cx="0" cy="0" r="18" class="ldr-head-body" style="fill:url(#ldrFace_${gid})" />
                            <path d="M -9,-5 Q -4.5,-9 0,-5 Q 4.5,-1 9,-5" class="ldr-track" />
                            <path d="M -9,0 Q -4.5,-4 0,0 Q 4.5,4 9,0" class="ldr-track" />
                            <path d="M -9,5 Q -4.5,1 0,5 Q 4.5,9 9,5" class="ldr-track" />
                        </g>

                        <text x="0" y="24" class="ldr-silk-text ldr-silk-title">LDR Sensor</text>

                        <g transform="translate(-30, 35)">
                            <rect x="-4" y="0" width="10" height="6" class="ldr-smd-resistor" /><rect x="-6" y="0" width="2" height="6" class="ldr-smd-pad" /><rect x="6" y="0" width="2" height="6" class="ldr-smd-pad" />
                            <rect x="13" y="0" width="10" height="6" class="ldr-smd-resistor" /><rect x="11" y="0" width="2" height="6" class="ldr-smd-pad" /><rect x="23" y="0" width="2" height="6" class="ldr-smd-pad" />
                            <rect x="31" y="0" width="10" height="6" class="ldr-smd-resistor" /><rect x="29" y="0" width="2" height="6" class="ldr-smd-pad" /><rect x="41" y="0" width="2" height="6" class="ldr-smd-pad" />
                            <rect x="49" y="0" width="10" height="6" class="ldr-smd-cap" /><rect x="47" y="0" width="2" height="6" class="ldr-smd-pad" /><rect x="59" y="0" width="2" height="6" class="ldr-smd-pad" />
                        </g>

                        <g transform="translate(-38, 60)">
                            <rect x="0" y="0" width="35" height="35" class="ldr-chip-ic" rx="1" />
                            <rect x="-3" y="4" width="3" height="4" class="ldr-chip-leg" /><rect x="-3" y="12" width="3" height="4" class="ldr-chip-leg" /><rect x="-3" y="20" width="3" height="4" class="ldr-chip-leg" /><rect x="-3" y="28" width="3" height="4" class="ldr-chip-leg" />
                            <rect x="35" y="4" width="3" height="4" class="ldr-chip-leg" /><rect x="35" y="12" width="3" height="4" class="ldr-chip-leg" /><rect x="35" y="20" width="3" height="4" class="ldr-chip-leg" /><rect x="35" y="28" width="3" height="4" class="ldr-chip-leg" />
                            <text x="17.5" y="20" fill="#666" font-size="6" text-anchor="middle" font-family="monospace">393</text>
                        </g>
                        
                        <g transform="translate(5, 60)" class="ldr-pot-group">
                            <rect x="0" y="0" width="32" height="32" class="ldr-trim-box" rx="1" />
                            <circle cx="16" cy="16" r="12" class="ldr-trim-knob" />
                            <g class="ldr-pot-screw" transform="rotate(${this.potRotation}, 16, 16)">
                                <line x1="10" y1="16" x2="22" y2="16" class="ldr-trim-cross" />
                                <line x1="16" y1="10" x2="16" y2="22" class="ldr-trim-cross" />
                            </g>
                        </g>

                        <g transform="translate(-30, 100)">
                            <rect x="5" y="0" width="10" height="6" class="ldr-smd-resistor" /><rect x="3" y="0" width="2" height="6" class="ldr-smd-pad" /><rect x="15" y="0" width="2" height="6" class="ldr-smd-pad" />
                            <rect x="45" y="0" width="10" height="6" class="ldr-smd-resistor" /><rect x="43" y="0" width="2" height="6" class="ldr-smd-pad" /><rect x="55" y="0" width="2" height="6" class="ldr-smd-pad" />
                        </g>

                        <g transform="translate(-20, 112)">
                            <rect x="0" y="0" width="8" height="12" class="ldr-smd-led-off" style="fill:#ff3333; filter:drop-shadow(0 0 3px red);" />
                            <text x="4" y="20" class="ldr-silk-text" style="font-size:6px">PWR</text>
                        </g>
                        <g transform="translate(15, 112)">
                            <rect class="ldr-sig-led ldr-smd-led-off" x="0" y="0" width="8" height="12" />
                            <text x="4" y="20" class="ldr-silk-text" style="font-size:6px">DAT</text>
                        </g>

                        <text x="-22" y="145" class="ldr-silk-text" style="fill:#aaa">OUT</text>
                        <text x="0" y="145" class="ldr-silk-text" style="fill:#aaa">GND</text>
                        <text x="22" y="145" class="ldr-silk-text" style="fill:#aaa">VCC</text>

                        <g transform="translate(0, 165)">
                            <circle cx="-22" cy="-13" r="5" class="ldr-gold-pad" style="fill:url(#goldGrad_${gid})" />
                            <circle cx="0" cy="-13" r="5" class="ldr-gold-pad" style="fill:url(#goldGrad_${gid})" />
                            <circle cx="22" cy="-13" r="5" class="ldr-gold-pad" style="fill:url(#goldGrad_${gid})" />
                        </g>
                    </g>
                </svg>
            </div>
        `;

        this.sigLed = body.querySelector('.ldr-sig-led');
        this.potScrew = body.querySelector('.ldr-pot-screw');
        this.lightCone = body.querySelector('.ldr-light-ray');
        this.controlPanel = body.querySelector('.ldr-controls-wrapper');
        this.sunIcon = body.querySelector('.ldr-sun-icon');
        
        const slider = body.querySelector('.ldr-vertical-slider');
        const potGroup = body.querySelector('.ldr-pot-group');

        this.element.appendChild(body);
        container.appendChild(this.element);

        this.renderPins(body);
        this.simulatorManager.makeDraggable(body, this);
        
        this.setupSlider(slider);
        this.setupPotRotation(potGroup);
        
        this.updateVisualState();

        return this.element;
    }

    renderPins(container) {
        const pinConfigs = [
            { id: 'OUT', x: '25.55%', y: '98%' },
            { id: 'GND', x: '50%',    y: '98%' },
            { id: 'VCC', x: '74.44%', y: '98%' }
        ];

        pinConfigs.forEach(config => {
            const pinElement = document.createElement('div');
            pinElement.className = 'sim-pin-hotspot component-pin';
            pinElement.dataset.componentId = this.id;
            pinElement.dataset.pinId = config.id;
            pinElement.title = config.id;
            pinElement.style.left = config.x;
            pinElement.style.top = config.y;
            pinElement.style.zIndex = '20';

            container.appendChild(pinElement);
            pinElement.addEventListener('click', (e) => {
                e.stopPropagation();
                this.simulatorManager.handlePinClick(pinElement, e);
            });
        });
    }

    setupSlider(slider) {
        slider.addEventListener('input', (e) => {
            if (!this.simulatorManager.ide.isSimulationRunning) return; 
            e.stopPropagation(); 
            this.lightLevel = parseInt(e.target.value);
            this.updateVisualState();
            this.simulatorManager._requestSaveState();
        });
        slider.addEventListener('mousedown', (e) => e.stopPropagation());
    }

    setupPotRotation(potGroup) {
        let startY;
        const onMouseMove = (e) => {
            e.preventDefault(); e.stopPropagation();
            let movement = (e.clientY - startY) * 2; 
            let newRot = this.potRotation - movement;
            if(newRot < 0) newRot = 0;
            if(newRot > 270) newRot = 270;
            this.potRotation = newRot;
            startY = e.clientY;
            this.updateVisualState();
        };
        const onMouseUp = () => { 
            document.removeEventListener('mousemove', onMouseMove); 
            document.removeEventListener('mouseup', onMouseUp); 
            this.simulatorManager._requestSaveState();
        };
        potGroup.addEventListener('mousedown', (e) => {
            e.preventDefault(); e.stopPropagation();
            this.simulatorManager.selectComponent(this.id);
            startY = e.clientY;
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    }

    update(val) {
        this.updateVisualState();
    }

    updateVisualState() {
        // 1. Check Global State
        const isSimRunning = this.simulatorManager.ide.isSimulationRunning;
        
        // 2. Check Power
        const vcc = this.simulatorManager.railManager.getPinLevel(this.id, 'VCC');
        const gnd = this.simulatorManager.railManager.getPinLevel(this.id, 'GND');
        const isPowered = (vcc === 1 && gnd === 0);
        
        // 3. Update Trimpot Visual (Always visible)
        if (this.potScrew) {
            this.potScrew.setAttribute('transform', `rotate(${this.potRotation}, 16, 16)`);
        }

        // 4. STOPPED or UNPOWERED Logic -> Hide Controls
        if (!isSimRunning || !isPowered) {
            if (this.controlPanel) this.controlPanel.style.display = 'none';
            if (this.lightCone) this.lightCone.style.opacity = 0;
            if (this.sigLed) {
                this.sigLed.style.fill = '#341a1a';
                this.sigLed.style.filter = 'none';
                this.sigLed.style.opacity = 1;
            }
            this.analogValue = 0;
            this.isDetecting = false;
            return;
        }

        // 5. RUNNING & POWERED Logic -> Show Controls
        // REMOVED "isSelected" check here. If it's running and powered, controls show.
        if (this.controlPanel) {
            this.controlPanel.style.display = 'flex';
        }

        // Visuals
        this.threshold = (this.potRotation / 270) * 100;

        if(this.sunIcon) {
            let opacity = 0.2 + (this.lightLevel / 100) * 0.8;
            this.sunIcon.style.opacity = opacity;
            this.sunIcon.style.boxShadow = this.lightLevel > 0 ? `0 0 ${20 + this.lightLevel/3}px #f1c40f` : 'none';
        }

        if(this.lightCone) {
            this.lightCone.style.opacity = (this.lightLevel / 100) * 0.8;
        }

        // Output Logic
        if (this.outputMode === 'analog') {
            this.analogValue = Math.round((this.lightLevel / 100) * 1023);
            
            if(this.sigLed) {
                this.sigLed.style.fill = '#33ff33';
                this.sigLed.style.filter = "drop-shadow(0 0 5px #00ff00)";
                this.sigLed.style.opacity = (this.analogValue / 1023) + 0.2; 
            }
        } else {
            const detected = this.lightLevel > this.threshold;
            this.isDetecting = detected;
            if(this.sigLed) {
                if (detected) {
                    this.sigLed.style.fill = '#33ff33'; 
                    this.sigLed.style.filter = "drop-shadow(0 0 5px #00ff00)";
                    this.sigLed.style.opacity = 1;
                } else {
                    this.sigLed.style.fill = '#341a1a'; 
                    this.sigLed.style.filter = "none";
                    this.sigLed.style.opacity = 1;
                }
            }
        }
    }
    
    getInternalConnections(pinId) { return []; }

    getPinOutput(pinId) {
        const vcc = this.simulatorManager.railManager.getPinLevel(this.id, 'VCC');
        const gnd = this.simulatorManager.railManager.getPinLevel(this.id, 'GND');
        if (vcc !== 1 || gnd !== 0) return -1;

        if (pinId === 'OUT') {
            if (this.outputMode === 'analog') return this.analogValue;
            return this.isDetecting ? 1 : 0;
        }
        return -1;
    }

    getValue(pinId) { return 0; }

    static styleInjected = false;
    static injectStyles() {
        if (LDRModel.styleInjected) return;
        const css = `
            .sim-component-body[data-type="ldr"] { width: 90px; height: 420px; position: relative; cursor: grab; overflow: visible !important; }
            .ldr-controls-wrapper { position: absolute; top: 0; left: 0; width: 100%; height: 80px; align-items: center; justify-content: center; z-index: 10; }
            .ldr-sun-icon { width: 50px; height: 50px; background: radial-gradient(circle, #fff176 20%, #fbc02d 100%); border-radius: 50%; box-shadow: 0 0 20px #f1c40f; transition: opacity 0.1s, box-shadow 0.1s; }
            .ldr-slider-container { position: absolute; left: -60px; top: 10px; height: 100px; display: flex; align-items: center; pointer-events: auto; }
            .ldr-vertical-slider { -webkit-appearance: none; width: 80px; height: 8px; background: #e0e0e0; border-radius: 4px; outline: none; transform: rotate(-90deg); cursor: pointer; border: 1px solid #999; box-shadow: 0 2px 5px rgba(0,0,0,0.2); }
            .ldr-vertical-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; background: #fff; border: 2px solid #fbc02d; border-radius: 50%; cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,0.3); }
            .ldr-cone-svg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 5; overflow: visible; }
            .ldr-light-ray { mix-blend-mode: normal; transition: opacity 0.1s; }
            .ldr-pcb-container { position: absolute; bottom: 0; left: 0; width: 90px; height: 200px; z-index: 8; }
            .sim-ldr-svg { width: 100%; height: 100%; filter: drop-shadow(0 6px 10px rgba(0,0,0,0.2)); }
            .ldr-pcb-board { fill: #1e3a5e; stroke: #0f1e30; stroke-width: 2; } .ldr-legs { stroke: #bdc3c7; stroke-width: 4.5; stroke-linecap: round; } .ldr-led-hole { stroke: #b7950b; stroke-width: 1; }
            .ldr-head-body { stroke: #bdc3c7; stroke-width: 1; } .ldr-track { fill: none; stroke: #e65100; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
            .ldr-trim-box { fill: #0055cc; stroke: #003399; stroke-width: 1; cursor: ns-resize; } .ldr-trim-knob { fill: #ccc; stroke: #888; stroke-width: 1; } .ldr-trim-cross { stroke: #333; stroke-width: 2.5; stroke-linecap: round; } .ldr-pot-group:hover .ldr-trim-knob { fill: #fff; }
            .ldr-chip-ic { fill: #1a1a1a; stroke: #000; stroke-width: 1; } .ldr-chip-leg { fill: #ccc; }
            .ldr-smd-resistor { fill: #111; stroke: #000; stroke-width: 0.5; } .ldr-smd-cap { fill: #c2a87c; stroke: #8a704d; stroke-width: 0.5; } .ldr-smd-pad { fill: #bdc3c7; }
            .ldr-smd-led-off { fill: #341a1a; stroke: #333; stroke-width: 0.5; transition: fill 0.1s; }
            .ldr-gold-pad { stroke: #b7950b; stroke-width: 1; } .ldr-silk-text { fill: #aab; font-family: Arial, sans-serif; font-size: 8px; font-weight: bold; text-anchor: middle; pointer-events: none;} .ldr-silk-title { font-size: 12px; fill: #fff; opacity: 0.95; letter-spacing: 0.5px; }
        `;
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
        LDRModel.styleInjected = true;
    }
}

class PIRSensorModel extends VirtualComponent {
    constructor(id, simulatorManager, position, name, componentData) {
        super(id, 'pir_sensor', simulatorManager, position, name, componentData);

        // --- Configuration ---
        this.sensitivity = 0.8; // 0.2 to 1.0
        this.timeDelay = 2000;  
        this.triggerMode = 'H'; 

        // --- Simulation State ---
        this.isDetecting = false;
        this.outputHigh = false;
        this.turnOffTime = 0;
        
        // --- Interactive Elements ---
        // Object starts in front of sensor.
        // Y is negative (upwards relative to dome center)
        this.virtualObject = { x: 0, y: -200 }; 
        this.lastObjectPos = { x: 0, y: -200 };

        // Element References
        this.coneAnchor = null;
        this.detectionCone = null;
        this.objectElement = null;
        
        PIRSensorModel.injectStyles();
    }

    render(container) {
        this.element = document.createElement('div');
        this.element.className = 'sim-component';
        this.element.id = this.id;
        this.element.style.left = `${this.position.x}px`;
        this.element.style.top = `${this.position.y}px`;

        const body = document.createElement('div');
        body.className = 'sim-component-body';
        body.dataset.type = this.type;

        const gid = this.id;

        body.innerHTML = `
            <!-- 1. Cone Layer (Hidden by default) -->
            <!-- Positioned absolutely at the Dome Center -->
            <div class="pir-cone-anchor" style="display:none;">
                <svg viewBox="-400 -400 800 800" class="pir-cone-svg">
                    <path class="pir-detection-zone" d="" />
                </svg>
                <!-- Heat Ball -->
                <div class="pir-sim-object"></div>
            </div>

            <!-- 2. Sensor Body -->
            <svg viewBox="0 0 400 500" class="sim-pir-svg">
                <defs>
                    <radialGradient id="goldGrad_${gid}" cx="50%" cy="50%" r="50%">
                        <stop offset="40%" style="stop-color:#f1c40f;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#b7950b;stop-opacity:1" />
                    </radialGradient>
                    <clipPath id="domeClip_${gid}">
                        <circle cx="200" cy="320" r="75" />
                    </clipPath>
                </defs>

                <!-- PCB BOARD -->
                <rect x="50" y="170" width="300" height="300" rx="20" class="pir-pcb-body" />
                
                <circle cx="80" cy="200" r="12" class="pir-hole" /><circle cx="320" cy="200" r="12" class="pir-hole" />
                <circle cx="80" cy="440" r="12" class="pir-hole" /><circle cx="320" cy="440" r="12" class="pir-hole" />

                <!-- HOUSING -->
                <rect x="90" y="210" width="220" height="220" rx="15" class="pir-housing" />
                <circle cx="110" cy="230" r="5" class="pir-housing-hole" /><circle cx="290" cy="230" r="5" class="pir-housing-hole" />
                <circle cx="110" cy="410" r="5" class="pir-housing-hole" /><circle cx="290" cy="410" r="5" class="pir-housing-hole" />
                
                <rect x="190" y="205" width="20" height="10" fill="#ccc" /><rect x="190" y="425" width="20" height="10" fill="#ccc" />
                <rect x="85" y="310" width="10" height="20" fill="#ccc" /><rect x="305" y="310" width="10" height="20" fill="#ccc" />

                <!-- FRESNEL DOME -->
                <g clip-path="url(#domeClip_${gid})">
                    <circle cx="200" cy="320" r="75" class="pir-dome-base" />
                    <g transform="translate(200,320)" opacity="0.7">
                        <path d="M 0,0 L 0,-80 A 80,80 0 0 1 69,-40 Z" class="pir-sector" />
                        <path d="M 0,0 L 69,-40 A 80,80 0 0 1 69,40 Z" class="pir-sector" />
                        <path d="M 0,0 L 69,40 A 80,80 0 0 1 0,80 Z" class="pir-sector" />
                        <path d="M 0,0 L 0,80 A 80,80 0 0 1 -69,40 Z" class="pir-sector" />
                        <path d="M 0,0 L -69,40 A 80,80 0 0 1 -69,-40 Z" class="pir-sector" />
                        <path d="M 0,0 L -69,-40 A 80,80 0 0 1 0,-80 Z" class="pir-sector" />
                        <circle cx="0" cy="0" r="25" fill="#fff" stroke="#eee" />
                    </g>
                </g>

                <!-- PINS -->
                <g transform="translate(200, 455)">
                    <circle cx="-40" cy="0" r="9" class="pir-gold-pad" style="fill: url(#goldGrad_${gid});" /><circle cx="0" cy="0" r="9" class="pir-gold-pad" style="fill: url(#goldGrad_${gid});" /><circle cx="40" cy="0" r="9" class="pir-gold-pad" style="fill: url(#goldGrad_${gid});" />
                    <text x="-40" y="-10" class="pir-pin-label">GND</text><text x="0" y="-10" class="pir-pin-label">OUT</text><text x="40" y="-10" class="pir-pin-label">VCC</text>
                </g>
            </svg>
        `;

        this.coneAnchor = body.querySelector('.pir-cone-anchor');
        this.detectionCone = body.querySelector('.pir-detection-zone');
        this.objectElement = body.querySelector('.pir-sim-object');

        this.element.appendChild(body);
        container.appendChild(this.element);

        this.renderPins(body);
        this.simulatorManager.makeDraggable(body, this);
        this.setupInteractivity();
        
        this.updateVisualState();

        return this.element;
    }

    renderPins(container) {
        const pinConfigs = [
            { id: 'GND', x: '40%', y: '91%' },
            { id: 'OUT', x: '50%', y: '91%' },
            { id: 'VCC', x: '60%', y: '91%' }
        ];

        pinConfigs.forEach(config => {
            const pinElement = document.createElement('div');
            pinElement.className = 'sim-pin-hotspot component-pin';
            pinElement.dataset.componentId = this.id;
            pinElement.dataset.pinId = config.id;
            pinElement.title = config.id;
            pinElement.style.left = config.x;
            pinElement.style.top = config.y;
            pinElement.style.zIndex = '20';
            container.appendChild(pinElement);
            
            pinElement.addEventListener('click', (e) => {
                e.stopPropagation();
                this.simulatorManager.handlePinClick(pinElement, e);
            });
        });
    }

    setupInteractivity() {
        let startX, startY, initialObjX, initialObjY;

        const onMouseMove = (e) => {
            e.preventDefault(); e.stopPropagation();
            const zoom = this.simulatorManager.zoom;
            this.virtualObject.x = initialObjX + (e.clientX - startX) / zoom;
            this.virtualObject.y = initialObjY + (e.clientY - startY) / zoom;
            this.updateVisualState();
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        this.objectElement.addEventListener('mousedown', (e) => {
            // Only draggable if Sim is Running
            if (!this.simulatorManager.ide.isSimulationRunning) return;

            e.preventDefault(); e.stopPropagation();
            this.simulatorManager.selectComponent(this.id);
            startX = e.clientX; startY = e.clientY;
            initialObjX = this.virtualObject.x; initialObjY = this.virtualObject.y;
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    }

    // --- Lifecycle Hooks ---
    
    update(val) {
        // Trigger visual update when simulator state changes (Start/Stop)
        this.updateVisualState();
    }

    step(deltaTime) {
        this.updateVisualState();
    }

    updateVisualState() {
        // 1. Check Simulation & Power State
        const isSimRunning = this.simulatorManager.ide.isSimulationRunning;
        const vcc = this.simulatorManager.railManager.getPinLevel(this.id, 'VCC');
        const gnd = this.simulatorManager.railManager.getPinLevel(this.id, 'GND');
        const isPowered = (vcc === 1 && gnd === 0);

        // 2. Hide everything if Stopped or Unpowered
        if (!isSimRunning || !isPowered) {
            if (this.coneAnchor) this.coneAnchor.style.display = 'none';
            if (this.detectionCone) this.detectionCone.classList.remove('triggered');
            this.outputHigh = false;
            return;
        }

        // 3. Show Cone if Running & Powered
        if (this.coneAnchor) this.coneAnchor.style.display = 'block';
        if (!this.detectionCone) return;

        // 4. Geometry Calculation
        const radius = 200 + (this.sensitivity / 1.0) * 300; 
        const angle = 110 * (Math.PI / 180); 
        const CENTER_X = 0;
        const CENTER_Y = 0;

        const startA = -Math.PI/2 - (angle/2);
        const endA   = -Math.PI/2 + (angle/2);
        
        const x1 = CENTER_X + radius * Math.cos(startA);
        const y1 = CENTER_Y + radius * Math.sin(startA);
        const x2 = CENTER_X + radius * Math.cos(endA);
        const y2 = CENTER_Y + radius * Math.sin(endA);
        
        const path = `M ${CENTER_X},${CENTER_Y} L ${x1},${y1} A ${radius},${radius} 0 0 1 ${x2},${y2} Z`;
        this.detectionCone.setAttribute('d', path);

        // 5. Update Object Position
        this.objectElement.style.left = `${this.virtualObject.x}px`;
        this.objectElement.style.top = `${this.virtualObject.y}px`;

        // 6. Physics Detection
        const dx = this.virtualObject.x;
        const dy = this.virtualObject.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const ballAngle = Math.atan2(dy, dx);
        const diff = Math.abs(ballAngle - (-Math.PI/2));
        
        const moveDist = Math.sqrt(
            Math.pow(this.virtualObject.x - this.lastObjectPos.x, 2) + 
            Math.pow(this.virtualObject.y - this.lastObjectPos.y, 2)
        );

        if (dist < radius && diff < (angle/2)) {
            if (moveDist > 2) {
                this.triggerSensor();
            }
        }
        
        this.lastObjectPos = { x: this.virtualObject.x, y: this.virtualObject.y };

        // 7. Output Timing
        const now = Date.now();
        if (this.outputHigh) {
            if (now > this.turnOffTime) {
                this.outputHigh = false;
                this.detectionCone.classList.remove('triggered');
            }
        }
    }

    triggerSensor() {
        const now = Date.now();
        if (!this.outputHigh) {
            this.outputHigh = true;
            this.turnOffTime = now + this.timeDelay;
            this.detectionCone.classList.add('triggered');
        } else {
            if (this.triggerMode === 'H') { 
                this.turnOffTime = now + this.timeDelay;
            }
        }
    }

    // --- Rail Logic ---

    getInternalConnections(pinId) { return []; }

    getPinOutput(pinId) {
        const vcc = this.simulatorManager.railManager.getPinLevel(this.id, 'VCC');
        const gnd = this.simulatorManager.railManager.getPinLevel(this.id, 'GND');
        
        // Must be powered
        if (vcc !== 1 || gnd !== 0) return -1;

        if (pinId === 'OUT') {
            return this.outputHigh ? 1 : 0;
        }
        return -1;
    }

    getValue(pinId) { return this.getPinOutput(pinId); } // Legacy

    static styleInjected = false;
    static injectStyles() {
        if (PIRSensorModel.styleInjected) return;
        const styleId = 'sim-pir-styles';
        const css = `
            .sim-component-body[data-type="pir_sensor"] {
                width: 200px; height: 250px;
                position: relative; cursor: grab;
                overflow: visible !important;
            }
            
            /* Anchor for Cone and Object: Centered on the Dome */
            .pir-cone-anchor {
                position: absolute;
                left: 50%; top: 64%; 
                width: 0; height: 0;
                overflow: visible; pointer-events: none; z-index: 5;
            }

            .pir-cone-svg {
                width: 800px; height: 800px;
                transform: translate(-50%, -50%);
                overflow: visible;
            }

            .sim-pir-svg {
                width: 100%; height: 100%;
                position: absolute; top: 0; left: 0; z-index: 2;
            }

            .pir-detection-zone {
                fill: rgba(46, 204, 113, 0.4);
                stroke: rgba(46, 204, 113, 0.8);
                stroke-width: 2;
                stroke-dasharray: 8,4;
                transition: fill 0.2s, stroke 0.2s;
                mix-blend-mode: multiply;
            }
            .pir-detection-zone.triggered { 
                fill: rgba(231, 76, 60, 0.4);
                stroke: #e74c3c;
            }

            .pir-sim-object {
                width: 24px; height: 24px;
                background: #e74c3c;
                border: 3px solid #fff;
                border-radius: 50%;
                position: absolute;
                transform: translate(-50%, -50%);
                box-shadow: 0 0 15px rgba(231, 76, 60, 0.8);
                cursor: move; pointer-events: auto; z-index: 10;
            }
            .pir-sim-object:active { cursor: grabbing; background: #c0392b; }

            /* Graphics */
            .pir-pcb-body { fill: #1a3b5c; stroke: #10253a; stroke-width: 2; }
            .pir-hole { fill: #fff; stroke: #bdc3c7; stroke-width: 1.5; }
            .pir-housing { fill: #e0e0e0; stroke: #bdc3c7; stroke-width: 1; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2)); }
            .pir-housing-hole { fill: #1a3b5c; opacity: 0.8; }
            .pir-dome-base { fill: #fdfdfd; stroke: #dcdcdc; stroke-width: 1; }
            .pir-sector { fill: #f4f4f4; stroke: #fff; stroke-width: 0.5; }
            .pir-sector:nth-child(even) { fill: #ececec; }
            .pir-gold-pad { stroke: #b7950b; stroke-width: 1; }
            .pir-pin-label { fill: #fff; font-family: monospace; font-size: 10px; font-weight: bold; text-anchor: middle; }
        `;
        const style = document.createElement('style');
        style.id = styleId; style.textContent = css;
        document.head.appendChild(style);
        PIRSensorModel.styleInjected = true;
    }
}

class DHT11Model extends VirtualComponent {
    constructor(id, simulatorManager, position, name, componentData) {
        super(id, 'dht11', simulatorManager, position, name, componentData);
        this.temp = 25; // Celsius
        this.humidity = 50; // Percent
        
        // Elements
        this.textTemp = null;
        this.textHum = null;
        this.controlPanel = null;
        this.powerLed = null;
        
        DHT11Model.injectStyles();
    }

    render(container) {
        this.element = document.createElement('div');
        this.element.className = 'sim-component';
        this.element.id = this.id;
        this.element.style.left = `${this.position.x}px`;
        this.element.style.top = `${this.position.y}px`;

        const body = document.createElement('div');
        body.className = 'sim-component-body';
        body.dataset.type = this.type;

        const gid = this.id;

        body.innerHTML = `
            <!-- 1. Controls (Floating on Left, Hidden by default) -->
            <div class="dht-controls-wrapper" style="display:none;">
                <!-- Temperature Slider -->
                <div class="dht-slider-group">
                    <span class="dht-icon">🌡️</span>
                    <div class="dht-track">
                        <input type="range" class="dht-vertical-slider temp" min="0" max="50" value="25">
                    </div>
                    <span class="dht-val-text val-temp">25°C</span>
                </div>

                <!-- Humidity Slider -->
                <div class="dht-slider-group">
                    <span class="dht-icon">💧</span>
                    <div class="dht-track">
                        <input type="range" class="dht-vertical-slider hum" min="20" max="90" value="50">
                    </div>
                    <span class="dht-val-text val-hum">50%</span>
                </div>
            </div>

            <!-- 2. Sensor Body -->
            <svg viewBox="0 0 160 300" class="sim-dht-svg">
                <defs>
                    <radialGradient id="goldGrad_${gid}" cx="50%" cy="50%" r="50%">
                        <stop offset="70%" style="stop-color:#f1c40f;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#b7950b;stop-opacity:1" />
                    </radialGradient>
                    <linearGradient id="legGrad_${gid}" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style="stop-color:#95a5a6;stop-opacity:1" />
                        <stop offset="50%" style="stop-color:#ecf0f1;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#95a5a6;stop-opacity:1" />
                    </linearGradient>
                </defs>

                <rect x="15" y="35" width="130" height="260" rx="8" class="dht-pcb-board" />
                
                <path d="M 35,217 L 35,250 L 50,265 L 50,275" class="dht-pcb-trace" />
                <path d="M 65,217 L 65,250 L 80,265 L 80,275" class="dht-pcb-trace" />
                <path d="M 95,217 L 95,250 L 110,265 L 110,275" class="dht-pcb-trace" />
                <path d="M 125,217 L 125,230" class="dht-pcb-trace" />

                <rect x="20" y="15" width="120" height="180" rx="3" class="dht-sensor-body" />
                <g transform="translate(32, 30)" class="dht-sensor-hole">
                    <rect x="0" y="0" width="15" height="15" /><rect x="0" y="30" width="15" height="15" /><rect x="0" y="60" width="15" height="15" /><rect x="0" y="90" width="15" height="15" /><rect x="0" y="120" width="15" height="10" />
                    <rect x="26" y="0" width="15" height="15" /><rect x="26" y="30" width="15" height="15" /><rect x="26" y="60" width="15" height="15" /><rect x="26" y="90" width="15" height="15" /><rect x="26" y="120" width="15" height="10" />
                    <rect x="52" y="0" width="15" height="15" /><rect x="52" y="30" width="15" height="15" /><rect x="52" y="60" width="15" height="15" /><rect x="52" y="90" width="15" height="15" /><rect x="52" y="120" width="15" height="10" />
                    <rect x="78" y="0" width="15" height="15" /><rect x="78" y="30" width="15" height="15" /><rect x="78" y="60" width="15" height="15" /><rect x="78" y="90" width="15" height="15" /><rect x="78" y="120" width="15" height="10" />
                </g>

                <g transform="translate(0, 217)">
                    <circle cx="35" cy="0" r="7" class="dht-gold-ring" style="fill:url(#goldGrad_${gid})" /><circle cx="35" cy="0" r="3.5" class="dht-gold-hole" /><rect x="32" y="-22" width="6" height="22" fill="#95a5a6" />
                    <circle cx="65" cy="0" r="7" class="dht-gold-ring" style="fill:url(#goldGrad_${gid})" /><circle cx="65" cy="0" r="3.5" class="dht-gold-hole" /><rect x="62" y="-22" width="6" height="22" fill="#95a5a6" />
                    <circle cx="95" cy="0" r="7" class="dht-gold-ring" style="fill:url(#goldGrad_${gid})" /><circle cx="95" cy="0" r="3.5" class="dht-gold-hole" /><rect x="92" y="-22" width="6" height="22" fill="#95a5a6" />
                    <circle cx="125" cy="0" r="7" class="dht-gold-ring" style="fill:url(#goldGrad_${gid})" /><circle cx="125" cy="0" r="3.5" class="dht-gold-hole" /><rect x="122" y="-22" width="6" height="22" fill="#95a5a6" />
                </g>

                <!-- Power LED -->
                <circle cx="35" cy="245" r="9" class="dht-led-on" />
                <circle cx="32" cy="242" r="3" fill="#fff" opacity="0.4" />

                <g transform="translate(128, 222) scale(1.1)">
                     <g transform="translate(-18, 20) rotate(90)">
                        <rect x="-10" y="-6" width="20" height="12" class="dht-smd-body" /><rect x="-10" y="-6" width="4" height="12" class="dht-smd-term" /><rect x="6" y="-6" width="4" height="12" class="dht-smd-term" /><text x="0" y="3" text-anchor="middle" class="dht-smd-text">102</text>
                    </g>
                    <g transform="translate(0, 20) rotate(90)">
                        <rect x="-10" y="-6" width="20" height="12" class="dht-smd-body" /><rect x="-10" y="-6" width="4" height="12" class="dht-smd-term" /><rect x="6" y="-6" width="4" height="12" class="dht-smd-term" /><text x="0" y="3" text-anchor="middle" class="dht-smd-text">102</text>
                    </g>
                </g>

                <text x="30" y="280" text-anchor="middle" class="dht-silk-text">GND</text>
                <text x="80" y="265" text-anchor="middle" class="dht-silk-text">DAT</text>
                <text x="130" y="280" text-anchor="middle" class="dht-silk-text">VCC</text>

                <g transform="translate(0, 275)">
                    <circle cx="50" cy="0" r="7" class="dht-gold-ring" style="fill:url(#goldGrad_${gid})" /><circle cx="50" cy="0" r="3.5" class="dht-gold-hole" />
                    <circle cx="80" cy="0" r="7" class="dht-gold-ring" style="fill:url(#goldGrad_${gid})" /><circle cx="80" cy="0" r="3.5" class="dht-gold-hole" />
                    <circle cx="110" cy="0" r="7" class="dht-gold-ring" style="fill:url(#goldGrad_${gid})" /><circle cx="110" cy="0" r="3.5" class="dht-gold-hole" />
                </g>
                
                <g transform="translate(0, 275)">
                    <path d="M 50,5 L 50,25" stroke="url(#legGrad_${gid})" stroke-width="6" stroke-linecap="round" />
                    <path d="M 80,5 L 80,25" stroke="url(#legGrad_${gid})" stroke-width="6" stroke-linecap="round" />
                    <path d="M 110,5 L 110,25" stroke="url(#legGrad_${gid})" stroke-width="6" stroke-linecap="round" />
                </g>
            </svg>
        `;

        this.textTemp = body.querySelector('.val-temp');
        this.textHum = body.querySelector('.val-hum');
        this.controlPanel = body.querySelector('.dht-controls-wrapper');
        this.powerLed = body.querySelector('.dht-led-on');
        
        const tempSlider = body.querySelector('.temp');
        const humSlider = body.querySelector('.hum');

        this.element.appendChild(body);
        container.appendChild(this.element);

        this.renderPins(body);
        this.simulatorManager.makeDraggable(body, this);
        
        this.setupSliders(tempSlider, humSlider);
        this.updateVisualState();

        return this.element;
    }

    renderPins(container) {
        const pinConfigs = [
            { id: 'GND',  x: '31.25%', y: '91.7%' },
            { id: 'DATA', x: '50.0%',  y: '91.7%' },
            { id: 'VCC',  x: '68.75%', y: '91.7%' }
        ];

        pinConfigs.forEach(config => {
            const pinElement = document.createElement('div');
            pinElement.className = 'sim-pin-hotspot component-pin';
            pinElement.dataset.componentId = this.id;
            pinElement.dataset.pinId = config.id;
            pinElement.title = config.id;
            
            pinElement.style.left = config.x;
            pinElement.style.top = config.y;
            pinElement.style.zIndex = '20'; 

            container.appendChild(pinElement);
            pinElement.addEventListener('click', (e) => {
                e.stopPropagation();
                this.simulatorManager.handlePinClick(pinElement, e);
            });
        });
    }

    setupSliders(tempSlider, humSlider) {
        const update = () => {
            if (!this.simulatorManager.ide.isSimulationRunning) return;
            this.updateVisualState();
            this.simulatorManager._requestSaveState();
        };

        tempSlider.addEventListener('input', (e) => {
            e.stopPropagation();
            this.temp = parseInt(e.target.value);
            this.textTemp.innerText = this.temp + "°C";
            update();
        });
        tempSlider.addEventListener('mousedown', (e) => e.stopPropagation());

        humSlider.addEventListener('input', (e) => {
            e.stopPropagation();
            this.humidity = parseInt(e.target.value);
            this.textHum.innerText = this.humidity + "%";
            update();
        });
        humSlider.addEventListener('mousedown', (e) => e.stopPropagation());
    }

    // Lifecycle hook
    update(val) {
        this.updateVisualState();
    }

    updateVisualState() {
        // 1. Check Global Sim State
        const isSimRunning = this.simulatorManager.ide.isSimulationRunning;
        
        // 2. Check Power via Rail Manager
        const vcc = this.simulatorManager.railManager.getPinLevel(this.id, 'VCC');
        const gnd = this.simulatorManager.railManager.getPinLevel(this.id, 'GND');
        const isPowered = (vcc === 1 && gnd === 0);

        // 3. Apply Visibility Logic
        if (isSimRunning && isPowered) {
            // Show controls
            if (this.controlPanel) this.controlPanel.style.display = 'flex';
            // Light up LED
            if (this.powerLed) this.powerLed.style.opacity = 1;
        } else {
            // Hide controls
            if (this.controlPanel) this.controlPanel.style.display = 'none';
            // Turn off LED
            if (this.powerLed) this.powerLed.style.opacity = 0.2;
        }
    }

    getInternalConnections(pinId) { return []; }
    getPinOutput(pinId) { return -1; } // Data is read via HardwareBridge methods

    // Methods called by HardwareBridge
    getTemperature() { return this.temp; }
    getHumidity() { return this.humidity; }

    static styleInjected = false;
    static injectStyles() {
        if (DHT11Model.styleInjected) return;
        const css = `
            .sim-component-body[data-type="dht11"] { width: 100px; height: 187.5px; position: relative; cursor: grab; overflow: visible !important; }
            
            .dht-controls-wrapper { 
                position: absolute; top: 20px; left: -70px; 
                width: 60px; height: 140px; 
                display: none; /* Toggled by JS */
                flex-direction: row; justify-content: space-between; z-index: 10; 
            }

            .dht-slider-group { display: flex; flex-direction: column; align-items: center; width: 25px; height: 100%; gap: 5px; }
            .dht-icon { font-size: 16px; text-shadow: 0 1px 2px rgba(0,0,0,0.2); }
            .dht-track { flex-grow: 1; width: 100%; display: flex; justify-content: center; align-items: center; }

            .dht-vertical-slider {
                -webkit-appearance: none; width: 90px; height: 8px;
                border-radius: 4px; outline: none; cursor: pointer;
                transform: rotate(-90deg); box-shadow: inset 0 1px 3px rgba(0,0,0,0.3);
            }
            .dht-vertical-slider.temp { background: linear-gradient(to right, #ffe6e6, #ff0000); }
            .dht-vertical-slider.hum { background: linear-gradient(to right, #e6f2ff, #0066ff); }
            
            .dht-vertical-slider::-webkit-slider-thumb {
                -webkit-appearance: none; width: 16px; height: 16px;
                background: #fff; border: 2px solid #666;
                border-radius: 50%; cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,0.3);
            }
            
            .dht-val-text { font-size: 10px; font-weight: bold; color: #333; text-shadow: 0 0 2px white; background:rgba(255,255,255,0.7); padding:1px 2px; border-radius:3px;}
            .val-temp { color: #cc0000; }
            .val-hum { color: #0055cc; }

            .sim-dht-svg { width: 100%; height: 100%; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.2)); position: relative; z-index: 2; }
            .dht-pcb-board { fill: #0e3c61; stroke: #082a45; stroke-width: 1; }
            .dht-sensor-body { fill: #00c0ef; } .dht-sensor-hole { fill: #0097bc; } .dht-pcb-trace { fill: none; stroke: #082a45; stroke-width: 2; opacity: 0.5; }
            .dht-gold-ring { stroke: #d4ac0d; stroke-width: 0.5; } .dht-gold-hole { fill: #7f8c8d; opacity: 0.9; }
            .dht-led-on { fill: #ff3030; stroke: #c0392b; filter: drop-shadow(0 0 4px rgba(255, 48, 48, 0.6)); transition: opacity 0.2s; }
            .dht-smd-body { fill: #2d3436; } .dht-smd-term { fill: #bdc3c7; } .dht-smd-text { fill: #fff; font-family: Arial, sans-serif; font-size: 10px; font-weight: bold; }
            .dht-silk-text { fill: #fff; font-family: Arial, sans-serif; font-weight: bold; font-size: 11px; }
        `;
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
        DHT11Model.styleInjected = true;
    }
}

class SoilMoistureModel extends VirtualComponent {
    constructor(id, simulatorManager, position, name, componentData) {
        super(id, 'soil_moisture', simulatorManager, position, name, componentData);

        // --- State ---
        this.moistureLevel = componentData.moistureLevel || 0.0; // 0.0 to 1.0
        this.threshold = 512; 
        this.potRotation = 135;
        this.digitalValue = 1; 
        this.analogValue = 1023;

        // --- Elements ---
        this.waterRect = null;
        this.sigLed = null;
        this.potScrew = null;
        this.controlPanel = null;
        this.textVal = null;

        SoilMoistureModel.injectStyles();
    }

    render(container) {
        this.element = document.createElement('div');
        this.element.className = 'sim-component';
        this.element.id = this.id;
        this.element.style.left = `${this.position.x}px`;
        this.element.style.top = `${this.position.y}px`;

        const body = document.createElement('div');
        body.className = 'sim-component-body';
        body.dataset.type = this.type;

        const gid = this.id;

        body.innerHTML = `
            <!-- 1. Controls (Floating Left, Hidden by default) -->
            <div class="soil-controls-wrapper" style="display:none;">
                <span class="soil-icon">💧</span>
                <div class="soil-slider-track">
                    <input type="range" class="soil-vertical-slider" min="0" max="100" value="${this.moistureLevel * 100}">
                </div>
                <span class="soil-val-text">0%</span>
            </div>

            <!-- 2. Main SVG Body -->
            <svg viewBox="0 0 420 500" class="sim-soil-svg">
                <defs>
                    <radialGradient id="goldGrad_${gid}" cx="50%" cy="50%" r="50%">
                        <stop offset="40%" style="stop-color:#f1c40f;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#b7950b;stop-opacity:1" />
                    </radialGradient>
                    <linearGradient id="waterGrad_${gid}" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#63b3ed;stop-opacity:0.8" />
                        <stop offset="100%" style="stop-color:#4299e1;stop-opacity:0.9" />
                    </linearGradient>
                </defs>

                <!-- A. WATER TANK & PROBE -->
                <g transform="translate(250, 120)">
                    <path d="M -10,0 L -10,320 L 130,320 L 130,0" class="soil-beaker-outline" />
                    <rect id="water_${gid}" x="-8" y="320" width="136" height="0" class="soil-water-rect" style="fill: url(#waterGrad_${gid});" />
                    <g transform="translate(20, 40)">
                        <path d="M 0,50 L 0,240 L 12.5,260 L 25,240 L 25,50 Z" class="soil-probe-prong" />
                        <path d="M 55,50 L 55,240 L 67.5,260 L 80,240 L 80,50 Z" class="soil-probe-prong" />
                        <path d="M 0,0 L 80,0 L 80,70 L 55,70 Q 40,30 25,70 L 0,70 Z" class="soil-probe-pcb" />
                        <circle cx="12" cy="20" r="6" class="soil-probe-hole" /><circle cx="68" cy="20" r="6" class="soil-probe-hole" />
                        <rect x="25" y="0" width="30" height="12" fill="#fff" stroke="#999" rx="1" />
                        <rect x="32" y="3" width="6" height="6" fill="#333" rx="2" /><rect x="44" y="3" width="6" height="6" fill="#333" rx="2" />
                    </g>
                </g>

                <!-- B. JUMPER WIRES -->
                <path d="M 118,185 C 120,20 315,20 317,166" class="soil-wire black" />
                <path d="M 132,185 C 132,40 300,40 305,166" class="soil-wire red" />

                <!-- C. CONTROL BOARD -->
                <g transform="translate(80, 180)">
                    <rect x="0" y="0" width="90" height="175" rx="4" class="soil-pcb-board" />
                    <g transform="translate(30, 3)">
                        <rect x="0" y="0" width="30" height="12" class="soil-pcb-connector" rx="2" />
                        <rect x="5" y="3" width="6" height="6" fill="#333" rx="2"/><rect x="18" y="3" width="6" height="6" fill="#333"rx="2" />
                    </g>
                    <text x="45" y="30" class="soil-silk-text soil-silk-title">Moisture</text>

                    <g transform="translate(15, 42)">
                        <rect x="-4" y="0" width="10" height="6" class="soil-smd-resistor" /><rect x="-6" y="0" width="2" height="6" class="soil-smd-pad" /><rect x="6" y="0" width="2" height="6" class="soil-smd-pad" />
                        <rect x="13" y="0" width="10" height="6" class="soil-smd-resistor" /><rect x="11" y="0" width="2" height="6" class="soil-smd-pad" /><rect x="23" y="0" width="2" height="6" class="soil-smd-pad" />
                        <rect x="31" y="0" width="10" height="6" class="soil-smd-resistor" /><rect x="29" y="0" width="2" height="6" class="soil-smd-pad" /><rect x="41" y="0" width="2" height="6" class="soil-smd-pad" />
                        <rect x="49" y="0" width="10" height="6" class="soil-smd-cap" /><rect x="47" y="0" width="2" height="6" class="soil-smd-pad" /><rect x="59" y="0" width="2" height="6" class="soil-smd-pad" />
                    </g>

                    <g transform="translate(8, 60)">
                        <rect x="0" y="0" width="35" height="35" class="soil-chip-ic" rx="1" />
                        <rect x="-3" y="4" width="3" height="4" class="soil-chip-leg" /><rect x="35" y="4" width="3" height="4" class="soil-chip-leg" />
                        <rect x="-3" y="12" width="3" height="4" class="soil-chip-leg" /><rect x="35" y="12" width="3" height="4" class="soil-chip-leg" />
                        <rect x="-3" y="20" width="3" height="4" class="soil-chip-leg" /><rect x="35" y="20" width="3" height="4" class="soil-chip-leg" />
                        <rect x="-3" y="28" width="3" height="4" class="soil-chip-leg" /><rect x="35" y="28" width="3" height="4" class="soil-chip-leg" />
                        <text x="17.5" y="20" fill="#666" font-size="6" text-anchor="middle" font-family="monospace">LM393</text>
                    </g>
                    
                    <g transform="translate(50, 60)" class="soil-pot-group">
                        <rect x="0" y="0" width="32" height="32" class="soil-trim-box" rx="1" />
                        <circle cx="16" cy="16" r="12" class="soil-trim-knob" />
                        <g class="soil-pot-screw" transform="rotate(${this.potRotation}, 16, 16)">
                            <line x1="10" y1="16" x2="22" y2="16" class="soil-trim-cross" />
                            <line x1="16" y1="10" x2="16" y2="22" class="soil-trim-cross" />
                        </g>
                    </g>

                    <g transform="translate(15, 100)">
                        <rect x="5" y="0" width="10" height="6" class="soil-smd-resistor" /><rect x="3" y="0" width="2" height="6" class="soil-smd-pad" /><rect x="15" y="0" width="2" height="6" class="soil-smd-pad" />
                        <rect x="45" y="0" width="10" height="6" class="soil-smd-resistor" /><rect x="43" y="0" width="2" height="6" class="soil-smd-pad" /><rect x="55" y="0" width="2" height="6" class="soil-smd-pad" />
                    </g>

                    <g transform="translate(15, 120)">
                        <rect x="0" y="0" width="8" height="12" class="soil-smd-led-off" style="fill:#ff3333; filter:drop-shadow(0 0 3px red);" />
                        <text x="4" y="20" class="soil-silk-text" style="font-size:6px">PWR</text>
                    </g>
                    <g transform="translate(67, 120)">
                        <rect class="soil-sig-led soil-smd-led-off" x="0" y="0" width="8" height="12" />
                        <text x="4" y="20" class="soil-silk-text" style="font-size:6px">DO</text>
                    </g>

                    <circle cx="45" cy="128" r="10" fill="#fff" stroke="#bdc3c7" stroke-width="2" />

                    <text x="13" y="155" class="soil-silk-text">AO</text><text x="34" y="155" class="soil-silk-text">DO</text>
                    <text x="55" y="155" class="soil-silk-text">GND</text><text x="76" y="155" class="soil-silk-text">VCC</text>

                    <g transform="translate(13, 175)">
                        <circle cx="0" cy="-12" r="5" class="soil-gold-pad" style="fill:url(#goldGrad_${gid})" />
                        <circle cx="21" cy="-12" r="5" class="soil-gold-pad" style="fill:url(#goldGrad_${gid})" />
                        <circle cx="42" cy="-12" r="5" class="soil-gold-pad" style="fill:url(#goldGrad_${gid})" />
                        <circle cx="63" cy="-12" r="5" class="soil-gold-pad" style="fill:url(#goldGrad_${gid})" />
                    </g>
                </g>
            </svg>
        `;

        this.waterRect = body.querySelector(`#water_${gid}`);
        this.sigLed = body.querySelector('.soil-sig-led');
        this.potScrew = body.querySelector('.soil-pot-screw');
        this.controlPanel = body.querySelector('.soil-controls-wrapper');
        this.textVal = body.querySelector('.soil-val-text');
        
        const slider = body.querySelector('.soil-vertical-slider');
        const potGroup = body.querySelector('.soil-pot-group');

        this.element.appendChild(body);
        container.appendChild(this.element);

        this.renderPins(body);
        this.simulatorManager.makeDraggable(body, this);
        
        this.setupSlider(slider);
        this.setupPotRotation(potGroup);
        this.updateVisualState();

        return this.element;
    }

    renderPins(container) {
        const pinConfigs = [
            { id: 'AO',  x: '22.14%', y: '68.6%' },
            { id: 'DO',  x: '27.14%', y: '68.6%' },
            { id: 'GND', x: '32.14%', y: '68.6%' },
            { id: 'VCC', x: '37.14%', y: '68.6%' }
        ];

        pinConfigs.forEach(config => {
            const pinElement = document.createElement('div');
            pinElement.className = 'sim-pin-hotspot component-pin';
            pinElement.dataset.componentId = this.id;
            pinElement.dataset.pinId = config.id;
            pinElement.title = config.id;
            pinElement.style.left = config.x;
            pinElement.style.top = config.y;
            pinElement.style.zIndex = '20'; 
            container.appendChild(pinElement);
            this.pins[config.id] = pinElement; 
            pinElement.addEventListener('click', (e) => { e.stopPropagation(); this.simulatorManager.handlePinClick(pinElement, e); });
        });
    }

    setupSlider(slider) {
        slider.addEventListener('input', (e) => {
            if (!this.simulatorManager.ide.isSimulationRunning) return;
            e.stopPropagation();
            this.moistureLevel = parseInt(e.target.value) / 100;
            this.textVal.innerText = `${Math.round(this.moistureLevel * 100)}%`;
            this.updateVisualState();
            this.simulatorManager._requestSaveState();
        });
        slider.addEventListener('mousedown', (e) => e.stopPropagation());
    }

    setupPotRotation(potGroup) {
        let startY;
        const onMouseMove = (e) => {
            e.preventDefault(); e.stopPropagation();
            let movement = (startY - e.clientY) * 2; 
            let newRot = this.potRotation + movement;
            if(newRot < 0) newRot = 0; if(newRot > 270) newRot = 270;
            this.potRotation = newRot;
            this.threshold = Math.round((this.potRotation / 270) * 1023);
            startY = e.clientY;
            this.updateVisualState();
        };
        const onMouseUp = () => { 
            document.removeEventListener('mousemove', onMouseMove); 
            document.removeEventListener('mouseup', onMouseUp); 
            this.simulatorManager._requestSaveState();
        };
        potGroup.addEventListener('mousedown', (e) => {
            e.preventDefault(); e.stopPropagation();
            this.simulatorManager.selectComponent(this.id);
            startY = e.clientY;
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    }

    update(val) {
        this.updateVisualState();
    }

    updateVisualState() {
        // 1. Check Simulation & Power
        const isSimRunning = this.simulatorManager.ide.isSimulationRunning;
        const vcc = this.simulatorManager.railManager.getPinLevel(this.id, 'VCC');
        const gnd = this.simulatorManager.railManager.getPinLevel(this.id, 'GND');
        const isPowered = (vcc === 1 && gnd === 0);

        // 2. Pot Visual (Physical)
        if (this.potScrew) {
            this.potScrew.setAttribute('transform', `rotate(${this.potRotation}, 16, 16)`);
        }

        // 3. Visibility Logic
        if (isSimRunning && isPowered) {
            // Show Controls
            if (this.controlPanel) this.controlPanel.style.display = 'flex';
            
            // Calculate Logic
            if (this.waterRect) {
                const h = this.moistureLevel * 260;
                this.waterRect.setAttribute('height', h);
                this.waterRect.setAttribute('y', 320 - h);
            }
            
            // Sensor Logic
            // Moist Soil = Low Resistance = Low Voltage at Sensor Output (Usually)
            // 100% Moisture -> 0 Raw
            // 0% Moisture -> 1023 Raw
            this.analogValue = Math.round((1.0 - this.moistureLevel) * 1023); 
            const detected = this.analogValue < this.threshold;
            this.digitalValue = detected ? 0 : 1; // Active Low

            if (this.sigLed) {
                if (detected) {
                    this.sigLed.style.fill = '#33ff33';
                    this.sigLed.style.filter = 'drop-shadow(0 0 2px #00ff00)';
                } else {
                    this.sigLed.style.fill = '#341a1a';
                    this.sigLed.style.filter = 'none';
                }
            }
        } 
        else {
            // Stopped or Unpowered -> Hide
            if (this.controlPanel) this.controlPanel.style.display = 'none';
            
            // Reset Water Visuals
            if (this.waterRect) {
                this.waterRect.setAttribute('height', 0);
                this.waterRect.setAttribute('y', 320);
            }
            
            if (this.sigLed) {
                this.sigLed.style.fill = '#341a1a';
                this.sigLed.style.filter = 'none';
            }
            this.analogValue = 1023; // Default Dry
            this.digitalValue = 1;   // Default High
        }
    }
    
    getInternalConnections(pinId) { return []; }

    getPinOutput(pinId) {
        const vcc = this.simulatorManager.railManager.getPinLevel(this.id, 'VCC');
        const gnd = this.simulatorManager.railManager.getPinLevel(this.id, 'GND');
        if (vcc !== 1 || gnd !== 0) return -1;

        if (pinId === 'AO') return this.analogValue;
        if (pinId === 'DO') return this.digitalValue;
        return -1;
    }

    getValue(pinId) { return 0; }

    static styleInjected = false;
    static injectStyles() {
        if (SoilMoistureModel.styleInjected) return;
        const css = `
            .sim-component-body[data-type="soil_moisture"] {
                width: 420px; height: 500px; 
                position: relative; cursor: grab;
                overflow: visible !important;
            }
            .sim-soil-svg { width: 100%; height: 100%; position: relative; z-index: 2; }
            .soil-controls-wrapper {
                position: absolute; top: 170px; left: 170px; 
                width: 60px; height: 160px;
                display: none; flex-direction: column; align-items: center;
                z-index: 10; pointer-events: auto;
            }
            .soil-icon { font-size: 24px; margin-bottom: 10px; text-shadow: 0 2px 4px rgba(0,0,0,0.2); }
            .soil-val-text { font-size: 12px; font-weight: bold; color: #3498db; margin-top: 10px; background: rgba(255,255,255,0.9); border-radius: 4px; padding: 2px 5px; }
            .soil-slider-track { flex-grow: 1; display: flex; align-items: center; justify-content: center; }
            .soil-vertical-slider {
                -webkit-appearance: none; width: 100px; height: 10px;
                background: linear-gradient(to right, #e6f2ff, #3498db);
                border-radius: 5px; outline: none; cursor: pointer;
                transform: rotate(-90deg); box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            }
            .soil-vertical-slider::-webkit-slider-thumb {
                -webkit-appearance: none; width: 18px; height: 18px;
                background: #3498db; border: 2px solid #fff;
                border-radius: 50%; cursor: pointer; box-shadow: 0 1px 4px rgba(0,0,0,0.4);
            }
            .soil-beaker-outline { fill: none; stroke: #999; stroke-width: 2; }
            .soil-water-rect { transition: height 0.1s, y 0.1s; }
            .soil-probe-pcb { fill: #1a1a1a; stroke: #000; stroke-width: 1; }
            .soil-probe-prong { fill: #bdc3c7; stroke: #999; stroke-width: 0.5; }
            .soil-probe-hole { fill: #fff; stroke: #555; stroke-width: 2; }
            .soil-wire { fill: none; stroke-width: 3; stroke-linecap: round; }
            .soil-wire.red { stroke: #e74c3c; } .soil-wire.black { stroke: #2d3436; }
            .soil-pcb-board { fill: #1e3a5e; stroke: #0f1e30; stroke-width: 2; }
            .soil-pcb-connector { fill: #eee; stroke: #999; stroke-width: 1; }
            .soil-trim-box { fill: #0055cc; stroke: #003399; stroke-width: 1; cursor: ns-resize; }
            .soil-trim-knob { fill: #ccc; stroke: #888; stroke-width: 1; }
            .soil-trim-cross { stroke: #333; stroke-width: 2.5; stroke-linecap: round; }
            .soil-pot-group:hover .soil-trim-knob { fill: #fff; }
            .soil-chip-ic { fill: #1a1a1a; stroke: #000; stroke-width: 1; } .soil-chip-leg { fill: #ccc; }
            .soil-smd-resistor { fill: #111; stroke: #000; stroke-width: 0.5; }
            .soil-smd-cap { fill: #c2a87c; stroke: #8a704d; stroke-width: 0.5; }
            .soil-smd-pad { fill: #bdc3c7; }
            .soil-smd-led-off { fill: #341a1a; stroke: #333; stroke-width: 0.5; transition: fill 0.1s; }
            .soil-gold-pad { stroke: #b7950b; stroke-width: 1; }
            .soil-silk-text { fill: #aab; font-family: Arial, sans-serif; font-size: 8px; font-weight: bold; text-anchor: middle; pointer-events: none;}
            .soil-silk-title { font-size: 12px; fill: #fff; opacity: 0.95; letter-spacing: 0.5px; }
        `;
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
        SoilMoistureModel.styleInjected = true;
    }
}


// Outputs & Actuators

class LEDModel extends VirtualComponent {
    constructor(id, simulatorManager, position, name, componentData) {
        super(id, 'led_red', simulatorManager, position, name, componentData);
        
        // State
        this.brightness = 0.0; // 0.0 to 1.0
        
        // Configuration
        this.ledColor = componentData.ledColor || '#ff3333';
        
        // Elements
        this.bulbBody = null;
        this.bulbCore = null;
        this.bulbRim = null;
        this.bulbGroup = null;

        LEDModel.injectStyles();
    }

    render(container) {
        this.element = document.createElement('div');
        this.element.className = 'sim-component';
        this.element.id = this.id;
        this.element.style.left = `${this.position.x}px`;
        this.element.style.top = `${this.position.y}px`;

        const body = document.createElement('div');
        body.className = 'sim-component-body';
        body.dataset.type = this.type;

        const gid = this.id;

        body.innerHTML = `
            <svg viewBox="0 0 200 300" class="sim-led-svg" id="svg_${gid}">
                <defs>
                    <!-- Bulb Shine -->
                    <linearGradient id="shine_${gid}" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style="stop-color:#fff;stop-opacity:0.1" />
                        <stop offset="40%" style="stop-color:#fff;stop-opacity:0.4" />
                        <stop offset="100%" style="stop-color:#fff;stop-opacity:0.1" />
                    </linearGradient>

                    <!-- Light Core (Center Hotspot) -->
                    <radialGradient id="lightCore_${gid}" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" style="stop-color:#ffffff; stop-opacity:1" />
                        <stop offset="40%" style="stop-color:#ffffff; stop-opacity:0.8" />
                        <stop offset="100%" style="stop-color:${this.ledColor}; stop-opacity:0" />
                    </radialGradient>

                    <!-- Gold Pad -->
                    <radialGradient id="goldGrad_${gid}" cx="50%" cy="50%" r="20%">
                        <stop offset="40%" style="stop-color:#f1c40f;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#b7950b;stop-opacity:1" />
                    </radialGradient>
                </defs>

                <!-- PCB -->
                <rect x="30" y="90" width="140" height="160" rx="8" class="led-pcb-board" />
                <circle cx="45" cy="105" r="6" class="led-mounting-hole" /><circle cx="155" cy="105" r="6" class="led-mounting-hole" />
                <circle cx="45" cy="235" r="6" class="led-mounting-hole" /><circle cx="155" cy="235" r="6" class="led-mounting-hole" />

                <!-- SMD -->
                <g transform="translate(135, 200)">
                    <rect x="0" y="0" width="20" height="10" class="led-smd-body" />
                    <rect x="-3" y="0" width="3" height="10" class="led-smd-pad" />
                    <rect x="20" y="0" width="3" height="10" class="led-smd-pad" />
                    <text x="10" y="7" class="led-smd-text">102</text>
                </g>
                <text x="50" y="135" class="led-pcb-text">LED</text>

                <!-- LED COMPONENT -->
                <g transform="translate(0, -35)" id="bulb-group_${gid}">
                    <path d="M 90,240 L 90,220" class="led-leg-wire" /> <path d="M 110,240 L 110,230 L 115,220" class="led-leg-wire" />
                    <circle cx="90" cy="240" r="3" class="led-leg-hole" style="fill:url(#goldGrad_${gid})" /><circle cx="110" cy="240" r="3" class="led-leg-hole" style="fill:url(#goldGrad_${gid})" />
                    
                    <rect x="88" y="160" width="4" height="60" class="led-internal-metal" />
                    <path d="M 115,220 L 115,160 L 95,160 Z" class="led-internal-metal" />
                    <path d="M 90,160 L 105,165" class="led-bond-wire" />

                    <!-- CORE LIGHT -->
                    <circle class="led-core-light" cx="100" cy="165" r="25" style="fill:url(#lightCore_${gid})" />

                    <!-- BULB BODY -->
                    <path class="led-bulb-body" d="M 70,220 L 130,220 L 130,160 A 30,30 0 1,0 70,160 Z" />
                    <rect class="led-rim" x="68" y="220" width="64" height="8" rx="1" />

                    <!-- REFLECTION -->
                    <path d="M 75,215 L 125,215 L 125,160 A 25,25 0 1,0 75,160 Z" fill="url(#shine_${gid})" style="pointer-events: none;" />
                </g>

                <!-- PINS -->
                <g transform="translate(68, 235)">
                    <circle cx="12" cy="0" r="6" class="led-gold-pad" style="fill:url(#goldGrad_${gid})" /><text x="12" y="-12" class="led-pcb-text">-</text>
                    <circle cx="32" cy="0" r="6" class="led-gold-pad" style="fill:url(#goldGrad_${gid})" /><text x="32" y="-12" class="led-pcb-text">+</text>
                    <circle cx="52" cy="0" r="6" class="led-gold-pad" style="fill:url(#goldGrad_${gid})" /><text x="52" y="-12" class="led-pcb-text">S</text>
                </g>
            </svg>
        `;

        this.bulbGroup = body.querySelector(`#bulb-group_${gid}`);
        this.bulbBody = body.querySelector('.led-bulb-body');
        this.bulbCore = body.querySelector('.led-core-light');
        this.bulbRim = body.querySelector('.led-rim');

        this.element.appendChild(body);
        container.appendChild(this.element);

        this.renderPins(body);
        this.simulatorManager.makeDraggable(body, this);
        
        this.updateColor(this.ledColor);
        this.updateVisualState();

        return this.element;
    }

    renderPins(container) {
        const pins = [
            { id: 'GND', x: '40%', y: '78.3%' }, // Pad labeled "-"
            { id: 'VCC', x: '50%', y: '78.3%' }, // Pad labeled "+"
            { id: 'SIG', x: '60%', y: '78.3%' }  // Pad labeled "S"
        ];

        pins.forEach(p => {
            const pin = document.createElement('div');
            pin.className = 'sim-pin-hotspot component-pin';
            pin.dataset.componentId = this.id;
            pin.dataset.pinId = p.id;
            pin.title = p.id;
            pin.style.left = p.x; 
            pin.style.top = p.y;
            pin.style.width = '7px'; 
            pin.style.height = '7px';
            pin.style.transform = 'translate(-50%, -50%)';
            
            container.appendChild(pin);
            pin.addEventListener('click', (e) => {
                e.stopPropagation();
                this.simulatorManager.handlePinClick(pin, e);
            });
        });
    }

    updateColor(colorHex) {
        this.ledColor = colorHex;
        const stop = this.element.querySelector(`#lightCore_${this.id} stop[offset="100%"]`);
        if(stop) stop.style.stopColor = colorHex;
        
        if(this.bulbBody) {
            this.bulbBody.style.stroke = colorHex;
            this.bulbBody.style.fill = colorHex;
        }
        if(this.bulbRim) {
            this.bulbRim.style.stroke = colorHex;
            this.bulbRim.style.fill = colorHex;
        }
        this.updateVisualState();
    }

    // Called by Python -> SimulatorManager
    update(value) {
        // We trigger a visual update. The actual value is pulled from rails.
        this.updateVisualState();
    }

    // Called every animation frame
    step(dt) {
        this.updateVisualState();
    }

    updateVisualState() {
        if (!this.bulbBody) return;

        // 1. Check Global Sim State
        const isSimRunning = this.simulatorManager.ide.isSimulationRunning;

        // 2. Determine Brightness from Rails
        let newBrightness = 0;

        if (isSimRunning) {
            // Get Voltage Levels
            const gndLevel = this.simulatorManager.railManager.getPinLevel(this.id, 'GND');
            const sigLevel = this.simulatorManager.railManager.getPinLevel(this.id, 'SIG');

            // Condition: GND must be 0. SIG must be > 0.
            if (gndLevel === 0 && sigLevel > 0) {
                newBrightness = sigLevel; // 0.0 to 1.0
            }
        }

        this.brightness = newBrightness;

        // 3. Apply Visuals
        // Base opacity 0.2 (OFF) -> 0.8 (FULL)
        const bodyOpacity = 0.2 + (this.brightness * 0.6);
        
        this.bulbBody.style.fillOpacity = bodyOpacity;
        this.bulbRim.style.fillOpacity = bodyOpacity + 0.2;
        
        if(this.bulbCore) {
            this.bulbCore.style.opacity = this.brightness;
        }

        if (this.brightness > 0.05) {
            const glowRadius = this.brightness * 35;
            this.bulbGroup.style.filter = `drop-shadow(0 0 ${glowRadius}px ${this.ledColor})`;
        } else {
            this.bulbGroup.style.filter = 'none';
        }
    }

    getInternalConnections(pinId) { return []; }
    getPinOutput(pinId) { return -1; } 

    static styleInjected = false;
    static injectStyles() {
        if (LEDModel.styleInjected) return;
        const css = `
            .sim-component-body[data-type="led_red"] { width: 100px; height: 150px; position: relative; cursor: grab; overflow: visible !important; }
            .sim-led-svg { width: 100%; height: 100%; filter: drop-shadow(0 5px 8px rgba(0,0,0,0.2)); overflow: visible; }
            .led-pcb-board { fill: #2c3e50; stroke: #1a252f; stroke-width: 2; }
            .led-mounting-hole { fill: #ecf0f1; stroke: #95a5a6; stroke-width: 2; }
            .led-pcb-text { fill: #fff; font-family: Arial, sans-serif; font-weight: bold; font-size: 12px; text-anchor: middle; opacity: 0.9; }
            .led-smd-body { fill: #111; } .led-smd-pad { fill: #bdc3c7; }
            .led-smd-text { fill: #fff; font-family: monospace; font-size: 6px; font-weight: bold; text-anchor: middle; }
            .led-internal-metal { fill: #2c3e50; opacity: 0.2; mix-blend-mode: multiply; }
            .led-bond-wire { fill: none; stroke: #2c3e50; stroke-width: 1; opacity: 0.3; }
            .led-leg-wire { stroke: #bdc3c7; stroke-width: 5; stroke-linecap: round; }
            .led-leg-hole { stroke: #b7950b; stroke-width: 1; }
            .led-gold-pad { stroke: #b7950b; stroke-width: 1; }
            .led-bulb-body { transition: all 0.05s linear; stroke-width: 1; }
            .led-core-light { transition: opacity 0.05s linear; }
            .led-rim { stroke-width: 1; }
        `;
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
        LEDModel.styleInjected = true;
    }
}

class RGBLEDModel extends VirtualComponent {
    constructor(id, simulatorManager, position, name, componentData) {
        super(id, 'led_rgb', simulatorManager, position, name, componentData);
        
        // State: [Red, Green, Blue] intensities (0.0 to 1.0)
        this.color = [0, 0, 0]; 
        
        // Elements
        this.bulbBody = null;
        this.bulbCore = null;
        this.bulbRim = null;
        this.bulbGroup = null;

        RGBLEDModel.injectStyles();
    }
    
    // Called by the main simulator stop/restart button.
    reset() {
        this.color = [0, 0, 0];
        this.updateVisualState();
    }

    render(container) {
        this.element = document.createElement('div');
        this.element.className = 'sim-component';
        this.element.id = this.id;
        this.element.style.left = `${this.position.x}px`;
        this.element.style.top = `${this.position.y}px`;

        const body = document.createElement('div');
        body.className = 'sim-component-body';
        body.dataset.type = this.type;

        const gid = this.id;

        body.innerHTML = `
            <svg viewBox="0 0 350 450" class="sim-rgb-svg" id="svg_${gid}">
                <defs>
                    <linearGradient id="shine_${gid}" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style="stop-color:#fff;stop-opacity:0.1" />
                        <stop offset="40%" style="stop-color:#fff;stop-opacity:0.4" />
                        <stop offset="100%" style="stop-color:#fff;stop-opacity:0.1" />
                    </linearGradient>
                    <radialGradient id="lightCore_${gid}" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                        <stop offset="0%" style="stop-color:#ffffff; stop-opacity:1" />
                        <stop offset="30%" style="stop-color:#ffffff; stop-opacity:0.7" />
                        <stop offset="100%" style="stop-color:rgba(0,0,0,0); stop-opacity:0" />
                    </radialGradient>
                    <radialGradient id="goldGrad_${gid}" cx="50%" cy="50%" r="50%">
                        <stop offset="40%" style="stop-color:#f1c40f;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#b7950b;stop-opacity:1" />
                    </radialGradient>
                </defs>

                <rect x="75" y="120" width="200" height="220" rx="10" class="rgb-pcb-board" />
                <circle cx="95" cy="140" r="7" class="rgb-mount-hole" /><circle cx="255" cy="140" r="7" class="rgb-mount-hole" />
                <circle cx="95" cy="320" r="7" class="rgb-mount-hole" /><circle cx="255" cy="320" r="7" class="rgb-mount-hole" />
                <text x="90" y="140" transform="rotate(-90 125 160)" class="rgb-pcb-text" style="font-size:14px">RGB LED</text>

                <g transform="translate(185, 285)">
                    <rect x="0" y="0" width="14" height="8" class="rgb-smd" /><rect x="-2" y="0" width="2" height="8" class="rgb-smd-pad" /><rect x="14" y="0" width="2" height="8" class="rgb-smd-pad" /><text x="7" y="6" class="rgb-smd-text">102</text>
                    <g transform="translate(25, 0)"><rect x="0" y="0" width="14" height="8" class="rgb-smd" /><rect x="-2" y="0" width="2" height="8" class="rgb-smd-pad" /><rect x="14" y="0" width="2" height="8" class="rgb-smd-pad" /><text x="7" y="6" class="rgb-smd-text">102</text></g>
                    <g transform="translate(50, 0)"><rect x="0" y="0" width="14" height="8" class="rgb-smd" /><rect x="-2" y="0" width="2" height="8" class="rgb-smd-pad" /><rect x="14" y="0" width="2" height="8" class="rgb-smd-pad" /><text x="7" y="6" class="rgb-smd-text">102</text></g>
                </g>

                <g transform="translate(25, 35)" id="bulb-group_${gid}">
                    <path d="M 120,240 L 120,210" class="rgb-leg" /> <path d="M 140,240 L 140,210" class="rgb-leg" /> 
                    <path d="M 160,240 L 160,210" class="rgb-leg" /> <path d="M 180,240 L 180,210" class="rgb-leg" /> 
                    <circle cx="120" cy="240" r="3" class="rgb-hole" /><circle cx="140" cy="240" r="3" class="rgb-hole" /><circle cx="160" cy="240" r="3" class="rgb-hole" /><circle cx="180" cy="240" r="3" class="rgb-hole" />

                    <path d="M 135,160 L 165,160 L 160,210 L 140,210 Z" class="rgb-internal" />
                    <rect x="148" y="160" width="4" height="50" class="rgb-internal" />
                    <path d="M 120,210 Q 130,190 145,165" class="rgb-bond" />
                    <path d="M 160,210 Q 155,190 152,165" class="rgb-bond" />
                    <path d="M 180,210 Q 160,190 155,165" class="rgb-bond" />

                    <circle class="rgb-core" cx="150" cy="160" r="35" style="fill:url(#lightCore_${gid})" />
                    <path class="rgb-bulb" d="M 100,210 L 200,210 L 200,140 A 50,50 0 1,0 100,140 Z" />
                    <rect class="rgb-rim" x="98" y="210" width="104" height="10" rx="2" />
                    <path d="M 108,205 L 192,205 L 192,140 A 42,42 0 1,0 108,140 Z" fill="url(#shine_${gid})" style="pointer-events: none;" />
                </g>

                <g transform="translate(105, 325)">
                    <g transform="translate(30, 0)"><circle cy="0" r="7" class="rgb-gold-pad" style="fill:url(#goldGrad_${gid})" /><text y="-12" class="rgb-pcb-text">-</text></g>
                    <g transform="translate(60, 0)"><circle cy="0" r="7" class="rgb-gold-pad" style="fill:url(#goldGrad_${gid})" /><text y="-12" class="rgb-pcb-text">R</text></g>
                    <g transform="translate(90, 0)"><circle cy="0" r="7" class="rgb-gold-pad" style="fill:url(#goldGrad_${gid})" /><text y="-12" class="rgb-pcb-text">G</text></g>
                    <g transform="translate(120, 0)"><circle cy="0" r="7" class="rgb-gold-pad" style="fill:url(#goldGrad_${gid})" /><text y="-12" class="rgb-pcb-text">B</text></g>
                </g>
            </svg>
        `;

        this.bulbGroup = body.querySelector(`#bulb-group_${gid}`);
        this.bulbBody = body.querySelector('.rgb-bulb');
        this.bulbCore = body.querySelector('.rgb-core');
        this.bulbRim = body.querySelector('.rgb-rim');

        this.element.appendChild(body);
        container.appendChild(this.element);
        this.renderPins(body);
        this.simulatorManager.makeDraggable(body, this);
        this.updateVisualState();

        return this.element;
    }

    renderPins(container) {
        const pinData = [
            { id: 'GND', x: '38.6%', y: '72.5%' },
            { id: 'R',   x: '47.1%', y: '72.5%' },
            { id: 'G',   x: '55.7%', y: '72.5%' },
            { id: 'B',   x: '64.3%', y: '72.5%' }
        ];

        pinData.forEach(p => {
            const pin = document.createElement('div');
            pin.className = 'sim-pin-hotspot component-pin';
            pin.dataset.componentId = this.id;
            pin.dataset.pinId = p.id;
            pin.title = p.id;
            pin.style.left = p.x; 
            pin.style.top = p.y;
            pin.style.width = '7px'; 
            pin.style.height = '7px';
            pin.style.transform = 'translate(-50%, -50%)';
            
            container.appendChild(pin);
            pin.addEventListener('click', (e) => {
                e.stopPropagation();
                this.simulatorManager.handlePinClick(pin, e);
            });
        });
    }

    update(value, pinId) {
        if (pinId === 'R') this.color[0] = value; 
        if (pinId === 'G') this.color[1] = value;
        if (pinId === 'B') this.color[2] = value;
        this.updateVisualState();
    }

    step(dt) {
        this.updateVisualState();
    }

    updateVisualState() {
        if (!this.bulbBody) return;

        // --- FIX START: Logic Change for Passive Component ---
        
        // 1. Check Ground Rail ONLY. 
        // RGB LEDs don't have a VCC pin. They are powered by the PWM signals on R, G, B.
        // We just need to ensure the circuit is closed (GND is connected to 0V).
        const gndLevel = this.simulatorManager.railManager.getPinLevel(this.id, 'GND');
        const isGrounded = (gndLevel === 0);

        let r = 0, g = 0, b = 0;

        // 2. Only calculate colors if the device is grounded
        if (isGrounded) {
            // this.color is an array [r, g, b] with values 0.0 to 1.0
            // These are updated by the HardwareBridge when your Python code runs.
            r = Math.round(this.color[0] * 255);
            g = Math.round(this.color[1] * 255);
            b = Math.round(this.color[2] * 255);
        }
        // --- FIX END ---

        // Calculate brightness based on the strongest color component
        const brightness = Math.max(r, g, b) / 255;

        if (brightness > 0.02) {
            const rgbString = `rgb(${r},${g},${b})`;
            
            this.bulbBody.style.fill = rgbString;
            this.bulbBody.style.stroke = rgbString;
            this.bulbBody.style.fillOpacity = 0.4 + (brightness * 0.5); 
            
            this.bulbRim.style.fill = rgbString;
            this.bulbRim.style.stroke = rgbString;
            this.bulbRim.style.fillOpacity = 0.5 + (brightness * 0.4);
            
            // Update the center glow
            if(this.bulbCore) {
                this.bulbCore.style.opacity = Math.max(0, (brightness - 0.2) * 1.2); 
            }
            
            // Update the SVG gradient stop to make the inner light match the color
            const stop = this.element.querySelector(`#lightCore_${this.id} stop[offset="100%"]`);
            if(stop) stop.style.stopColor = rgbString;

            // Apply outer glow filter
            this.bulbGroup.style.filter = `drop-shadow(0 0 ${brightness * 35}px ${rgbString})`;
            
            this.bulbBody.classList.remove('off');
            this.bulbRim.classList.remove('off');
        } else {
            // Turn OFF
            this.bulbBody.style.fill = ''; 
            this.bulbBody.style.stroke = '';
            this.bulbRim.style.fill = ''; 
            this.bulbRim.style.stroke = '';
            
            this.bulbBody.classList.add('off');
            this.bulbRim.classList.add('off');
            if(this.bulbCore) this.bulbCore.style.opacity = 0;
            this.bulbGroup.style.filter = 'none';
        }
    }

    getInternalConnections(pinId) { return []; }
    getPinOutput(pinId) { return -1; }

    static styleInjected = false;
    static injectStyles() {
        if (RGBLEDModel.styleInjected) return;
        const css = `
            .sim-component-body[data-type="led_rgb"] { width: 140px; height: 180px; position: relative; cursor: grab; overflow: visible !important; }
            .sim-rgb-svg { width: 100%; height: 100%; filter: drop-shadow(0 5px 8px rgba(0,0,0,0.2)); }
            .rgb-pcb-board { fill: #2c3e50; stroke: #1a252f; stroke-width: 2; }
            .rgb-mount-hole { fill: #ecf0f1; stroke: #95a5a6; stroke-width: 2; }
            .rgb-pcb-text { fill: #fff; font-family: Arial, sans-serif; font-weight: bold; font-size: 14px; text-anchor: middle; opacity: 0.9; }
            .rgb-smd { fill: #111; } .rgb-smd-pad { fill: #bdc3c7; } .rgb-smd-text { fill: #fff; font-family: monospace; font-size: 5px; font-weight: bold; text-anchor: middle; }
            .rgb-leg { stroke: #bdc3c7; stroke-width: 4; stroke-linecap: round; }
            .rgb-hole { stroke: #b7950b; stroke-width: 1; } .rgb-gold-pad { stroke: #b7950b; stroke-width: 1; }
            .rgb-internal { fill: #2c3e50; opacity: 0.3; mix-blend-mode: multiply; }
            .rgb-bond { fill: none; stroke: #2c3e50; stroke-width: 1; opacity: 0.4; }
            .rgb-bulb, .rgb-rim { transition: all 0.1s ease; }
            .rgb-core { transition: opacity 0.1s ease; }
            .rgb-bulb.off { fill: #f0f0f0 !important; stroke: #ddd !important; fill-opacity: 0.8 !important; }
            .rgb-rim.off { fill: #e0e0e0 !important; stroke: #ccc !important; fill-opacity: 0.9 !important; }
        `;
        const style = document.createElement('style');
        style.id = 'sim-rgb-styles'; style.textContent = css;
        document.head.appendChild(style);
        RGBLEDModel.styleInjected = true;
    }
}

class BuzzerModel extends VirtualComponent {
    constructor(id, simulatorManager, position, name, componentData) {
        super(id, 'buzzer', simulatorManager, position, name, componentData);
        
        // State
        this.duty = 0; // 0.0 to 1.0
        this.frequency = 1000; // Default Hz
        
        // Audio Context
        this.audioCtx = null;
        this.oscillator = null;
        this.gainNode = null;
        
        // Elements
        this.bodyGroup = null;

        BuzzerModel.injectStyles();
    }

    render(container) {
        this.element = document.createElement('div');
        this.element.className = 'sim-component';
        this.element.id = this.id;
        this.element.style.left = `${this.position.x}px`;
        this.element.style.top = `${this.position.y}px`;

        const body = document.createElement('div');
        body.className = 'sim-component-body';
        body.dataset.type = this.type;

        const gid = this.id;

        body.innerHTML = `
            <svg viewBox="0 0 300 320" class="sim-buzzer-svg">
                <defs>
                    <linearGradient id="bodyGloss_${gid}" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#444;stop-opacity:1" />
                        <stop offset="40%" style="stop-color:#111;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#000;stop-opacity:1" />
                    </linearGradient>

                    <radialGradient id="holeGrad_${gid}" cx="50%" cy="50%" r="50%">
                        <stop offset="60%" style="stop-color:#e0e0e0;stop-opacity:1" />
                        <stop offset="95%" style="stop-color:#bdc3c7;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#7f8c8d;stop-opacity:1" />
                    </radialGradient>

                    <radialGradient id="goldGrad_${gid}" cx="50%" cy="50%" r="50%">
                        <stop offset="50%" style="stop-color:#f1c40f;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#b7950b;stop-opacity:1" />
                    </radialGradient>
                </defs>

                <!-- 1. WIRES (Behind) -->
                <g>
                    <path d="M 135,220 L 135,270" class="buzzer-wire black" />
                    <path d="M 165,220 L 165,270" class="buzzer-wire red" />
                </g>

                <!-- 2. BODY (Animated Group) -->
                <g class="buzzer-body-group">
                    <!-- Mounting Ears -->
                    <path d="M 60,140 C 60,120 100,120 100,140 C 100,160 60,160 60,140 Z" fill="#111" />
                    <circle cx="80" cy="140" r="6" fill="#f0f3f5" stroke="#333" stroke-width="1"/>

                    <path d="M 240,140 C 240,120 200,120 200,140 C 200,160 240,160 240,140 Z" fill="#111" />
                    <circle cx="220" cy="140" r="6" fill="#f0f3f5" stroke="#333" stroke-width="1"/>

                    <!-- Main Casing -->
                    <circle cx="150" cy="140" r="85" style="fill:url(#bodyGloss_${gid}); stroke:#000; stroke-width:1;" />

                    <!-- Highlight -->
                    <path d="M 100,100 Q 130,70 180,80" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="4" stroke-linecap="round" />
                    
                    <!-- Center Aperture -->
                    <circle cx="150" cy="140" r="18" style="fill:url(#holeGrad_${gid}); stroke:#555; stroke-width:0.5;" />
                    
                    <!-- Bottom Stub -->
                    <path d="M 125,210 L 175,210 L 170,225 L 130,225 Z" fill="#111" />
                </g>

                <!-- 3. PINS (Foreground) -->
                <g transform="translate(0, 270)">
                    <!-- GND -->
                    <circle cx="135" cy="0" r="9" class="buzzer-gold-pad" style="fill:url(#goldGrad_${gid})" />
                    <circle cx="135" cy="0" r="4" class="buzzer-solder" />
                    <text x="115" y="5" text-anchor="end" class="buzzer-pin-label">GND</text>

                    <!-- SIG -->
                    <circle cx="165" cy="0" r="9" class="buzzer-gold-pad" style="fill:url(#goldGrad_${gid})" />
                    <circle cx="165" cy="0" r="4" class="buzzer-solder" />
                    <text x="185" y="5" text-anchor="start" class="buzzer-pin-label">SIG</text>
                </g>
            </svg>
        `;

        this.bodyGroup = body.querySelector('.buzzer-body-group');

        this.element.appendChild(body);
        container.appendChild(this.element);

        this.renderPins(body);
        this.simulatorManager.makeDraggable(body, this);
        
        this.initAudio();

        return this.element;
    }

    renderPins(container) {
        const pins = [
            { id: 'GND', x: '45%', y: '84.4%' },
            { id: 'SIG', x: '55%', y: '84.4%' }
        ];
        
        pins.forEach(p => {
            const pin = document.createElement('div');
            pin.className = 'sim-pin-hotspot component-pin';
            pin.dataset.componentId = this.id;
            pin.dataset.pinId = p.id;
            pin.title = p.id;
            pin.style.left = p.x; 
            pin.style.top = p.y;
            pin.style.width = '14px'; 
            pin.style.height = '14px';
            pin.style.transform = 'translate(-50%, -50%)';
            container.appendChild(pin);
            pin.addEventListener('click', (e) => {
                e.stopPropagation();
                this.simulatorManager.handlePinClick(pin, e);
            });
        });
    }

    initAudio() {
        if (!window.AudioContext && !window.webkitAudioContext) return;
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.gainNode = this.audioCtx.createGain();
        this.gainNode.connect(this.audioCtx.destination);
        this.gainNode.gain.value = 0;
    }

    _startOscillator() {
        if (!this.audioCtx) this.initAudio();
        if (this.oscillator) return; 

        this.oscillator = this.audioCtx.createOscillator();
        this.oscillator.type = 'square';
        this.oscillator.frequency.value = this.frequency;
        this.oscillator.connect(this.gainNode);
        this.oscillator.start();
    }

    _stopOscillator() {
        if (this.oscillator) {
            this.oscillator.stop();
            this.oscillator.disconnect();
            this.oscillator = null;
        }
    }
    update(dutyValue) {
        this.duty = dutyValue;
        this.updateState();
    }
    
    updateFrequency(freq) {
        this.frequency = freq;
        if (this.oscillator) {
            this.oscillator.frequency.value = freq;
        }
    }

    // Lifecycle Step
    step(dt) {
        this.updateState();
    }

    updateState() {
        if (!this.audioCtx) return;
        const isSimRunning = this.simulatorManager.ide.isSimulationRunning;
        const gndLevel = this.simulatorManager.railManager.getPinLevel(this.id, 'GND');
        const isGrounded = (gndLevel === 0);
        const shouldPlay = isSimRunning && isGrounded && (this.duty > 0.01);

        if (shouldPlay) {
            if (this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }
            
            this._startOscillator();
            let volume = Math.min(this.duty * 0.3, 0.2); 
            this.gainNode.gain.setTargetAtTime(volume, this.audioCtx.currentTime, 0.02);
            this.bodyGroup.classList.add('vibrating');
        } else {
            this.gainNode.gain.setTargetAtTime(0, this.audioCtx.currentTime, 0.02);
            this.bodyGroup.classList.remove('vibrating');
            if (this.oscillator && this.gainNode.gain.value < 0.001) {
                this._stopOscillator();
            }
        }
    }

    getInternalConnections(pinId) { return []; }
    getPinOutput(pinId) { return -1; }

    remove() {
        this._stopOscillator();
        if (this.audioCtx) this.audioCtx.close();
        super.remove();
    }

    static styleInjected = false;
    static injectStyles() {
        if (BuzzerModel.styleInjected) return;
        const css = `
            .sim-component-body[data-type="buzzer"] {
                width: 150px; height: 160px;
                position: relative; cursor: grab;
                overflow: visible !important;
            }
            .sim-buzzer-svg { width: 100%; height: 100%; filter: drop-shadow(0 5px 8px rgba(0,0,0,0.2)); }
            .buzzer-wire { fill: none; stroke-width: 6; stroke-linecap: butt; }
            .buzzer-wire.red { stroke: #d63031; } .buzzer-wire.black { stroke: #2d3436; }
            .buzzer-gold-pad { stroke: #b7950b; stroke-width: 1; }
            .buzzer-solder { fill: #95a5a6; opacity: 0.6; }
            .buzzer-pin-label { font-family: monospace; font-weight: bold; font-size: 14px; fill: #2c3e50; letter-spacing: 1px; }
            .buzzer-body-group { transform-origin: 150px 140px; }
            .buzzer-body-group.vibrating { animation: buzz 0.05s linear infinite; }
            @keyframes buzz {
                0% { transform: translate(0, 0) rotate(0deg); }
                25% { transform: translate(1px, 1px) rotate(0.5deg); }
                50% { transform: translate(-1px, 0) rotate(-0.5deg); }
                75% { transform: translate(0, -1px) rotate(0deg); }
                100% { transform: translate(0, 0) rotate(0deg); }
            }
        `;
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
        BuzzerModel.styleInjected = true;
    }
}

class NeoPixelModel extends VirtualComponent {
    constructor(id, simulatorManager, position, name, componentData) {
        super(id, 'neopixel_strip', simulatorManager, position, name, componentData);
        
        // State
        this.numPixels = componentData.numPixels || 8;
        this.pixelData = []; 
        
        // Initialize default off state
        for(let i=0; i<this.numPixels; i++) this.pixelData.push([0,0,0]);

        NeoPixelModel.injectStyles();
    }

    render(container) {
        this.element = document.createElement('div');
        this.element.className = 'sim-component';
        this.element.id = this.id;
        this.element.style.left = `${this.position.x}px`;
        this.element.style.top = `${this.position.y}px`;

        const body = document.createElement('div');
        body.className = 'sim-component-body';
        body.dataset.type = this.type;

        // Create base SVG element
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.classList.add('sim-neopixel-svg');
        
        // Define filter for glow
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        defs.innerHTML = `
            <filter id="ledGlow_${this.id}" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
        `;
        svg.appendChild(defs);
        
        body.appendChild(svg);
        this.element.appendChild(body);
        container.appendChild(this.element);

        // Initial Draw
        this.renderStrip();
        
        this.simulatorManager.makeDraggable(body, this);
        
        // Initial check
        this.updateVisualState();

        return this.element;
    }

    renderStrip() {
        if (!this.element) return;
        const body = this.element.querySelector('.sim-component-body');
        const svg = this.element.querySelector('.sim-neopixel-svg');
        if (!svg || !body) return;

        // --- SIZE CONFIGURATION (Doubled Size) ---
        const SEGMENT_WIDTH = 120; 
        const PCB_HEIGHT = 80;
        const TOTAL_WIDTH = (this.numPixels * SEGMENT_WIDTH);

        // Update Container Size
        body.style.width = `${TOTAL_WIDTH}px`;
        body.style.height = `${PCB_HEIGHT}px`;
        
        // Update SVG ViewBox
        svg.setAttribute('viewBox', `0 0 ${TOTAL_WIDTH} ${PCB_HEIGHT}`);

        // Clear old content (Keep Defs)
        const oldGroups = svg.querySelectorAll('g');
        oldGroups.forEach(g => g.remove());

        // Generate Segments
        for (let i = 0; i < this.numPixels; i++) {
            const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
            g.setAttribute("transform", `translate(${i * SEGMENT_WIDTH}, 0)`);
            
            // 1. PCB Segment
            const pcb = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            pcb.setAttribute("width", SEGMENT_WIDTH);
            pcb.setAttribute("height", PCB_HEIGHT);
            pcb.setAttribute("class", "neo-pcb");
            g.appendChild(pcb);

            // 2. Pads
            const padY = [16, 40, 64]; 
            const labels = ["GND", "DIN", "5V"];

            padY.forEach((py, idx) => {
                // Input Pad
                const isFirst = (i === 0);
                const padL = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                padL.setAttribute("x", 2); padL.setAttribute("y", py - 5);
                padL.setAttribute("width", 8); padL.setAttribute("height", 10);
                padL.setAttribute("class", isFirst ? "neo-gold-pad-rect" : "neo-copper-pad");
                g.appendChild(padL);

                // Output Pad
                const padR = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                padR.setAttribute("x", SEGMENT_WIDTH - 10); padR.setAttribute("y", py - 5);
                padR.setAttribute("width", 8); padR.setAttribute("height", 10);
                padR.setAttribute("class", "neo-copper-pad");
                g.appendChild(padR);

                // Label
                const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
                txt.setAttribute("x", 14); txt.setAttribute("y", py + 1);
                txt.setAttribute("class", "neo-text");
                txt.textContent = labels[idx];
                g.appendChild(txt);
            });

            // 3. LED Package
            const ledSize = 50;
            const centerX = SEGMENT_WIDTH / 2;
            const centerY = PCB_HEIGHT / 2;
            
            const ledCase = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            ledCase.setAttribute("x", centerX - (ledSize/2));
            ledCase.setAttribute("y", centerY - (ledSize/2));
            ledCase.setAttribute("width", ledSize); ledCase.setAttribute("height", ledSize);
            ledCase.setAttribute("rx", 4); ledCase.setAttribute("class", "neo-case");
            g.appendChild(ledCase);

            // 4. Lens (Initially OFF)
            const lens = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            lens.setAttribute("cx", centerX); lens.setAttribute("cy", centerY);
            lens.setAttribute("r", 20);
            lens.setAttribute("class", "neo-lens");
            lens.id = `neo_px_${this.id}_${i}`;
            lens.style.fill = '#f0f0f0'; // Default Off
            
            g.appendChild(lens);

            // 5. Capacitor
            const cap = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            cap.setAttribute("x", SEGMENT_WIDTH - 20); cap.setAttribute("y", 25);
            cap.setAttribute("width", 6); cap.setAttribute("height", 12);
            cap.setAttribute("class", "neo-cap");
            g.appendChild(cap);

            // 6. Cut Line
            if (i < this.numPixels - 1) {
                const cut = document.createElementNS("http://www.w3.org/2000/svg", "line");
                cut.setAttribute("x1", SEGMENT_WIDTH); cut.setAttribute("y1", 0);
                cut.setAttribute("x2", SEGMENT_WIDTH); cut.setAttribute("y2", PCB_HEIGHT);
                cut.setAttribute("class", "neo-cut-line");
                g.appendChild(cut);
            }

            svg.appendChild(g);
        }
        
        this.updateInputPins(body);
        this.updateVisualState(); // Re-apply colors if array has data
    }

    updateInputPins(container) {
        container.querySelectorAll('.sim-pin-hotspot').forEach(p => p.remove());
        
        const pins = [
            { id: 'GND', y: '16px' },
            { id: 'DIN', y: '40px' },
            { id: '5V',  y: '64px' }
        ];

        pins.forEach(p => {
            const pin = document.createElement('div');
            pin.className = 'sim-pin-hotspot component-pin';
            pin.dataset.componentId = this.id;
            pin.dataset.pinId = p.id;
            pin.title = p.id;
            
            pin.style.left = '6px'; 
            pin.style.top = p.y;
            pin.style.width = '12px'; 
            pin.style.height = '12px';
            
            container.appendChild(pin);
            
            pin.addEventListener('click', (e) => {
                e.stopPropagation();
                this.simulatorManager.handlePinClick(pin, e);
            });
        });
    }

    // Called by Python Bridge (np.write())
    // colors is array of [r, g, b] tuples
    update(colors) {
        if (!Array.isArray(colors)) return;
        
        // Update internal state
        for(let i=0; i<Math.min(colors.length, this.numPixels); i++) {
            this.pixelData[i] = colors[i];
        }
        
        // Update visuals
        this.updateVisualState();
    }
    
    // Lifecycle step
    step(dt) {
        // Check power continuously in case wire is cut during animation
        this.updateVisualState();
    }

    updateVisualState() {
        if (!this.element) return;

        // 1. Check Power Rails
        // NeoPixel needs 5V (High) and GND (Low)
        const pwrLevel = this.simulatorManager.railManager.getPinLevel(this.id, '5V');
        const gndLevel = this.simulatorManager.railManager.getPinLevel(this.id, 'GND');
        const isPowered = (pwrLevel === 1 && gndLevel === 0);

        // 2. Render Pixels
        for(let i=0; i<this.numPixels; i++) {
            const lens = this.element.querySelector(`#neo_px_${this.id}_${i}`);
            if (!lens) continue;
            
            // Default OFF
            let r=0, g=0, b=0;
            
            // If Powered, use data
            if (isPowered && this.pixelData[i]) {
                r = this.pixelData[i][0];
                g = this.pixelData[i][1];
                b = this.pixelData[i][2];
            }

            if (r > 0 || g > 0 || b > 0) {
                lens.style.fill = `rgb(${r},${g},${b})`;
                lens.style.filter = `url(#ledGlow_${this.id})`;
            } else {
                lens.style.fill = '#f0f0f0';
                lens.style.filter = 'none';
            }
        }
    }

    setPixelCount(count) {
        const c = parseInt(count);
        if (isNaN(c) || c < 1 || c > 256) return;
        if (c === this.numPixels) return;
        const SEGMENT_WIDTH = 120; // Matches renderStrip const
        const oldWidth = this.numPixels * SEGMENT_WIDTH;
        this.numPixels = c;
        while(this.pixelData.length < c) this.pixelData.push([0,0,0]);
        if (this.pixelData.length > c) this.pixelData.length = c;
        if (this.element) {
            this.renderStrip();
        }
        const newWidth = this.numPixels * SEGMENT_WIDTH;
        const diff = newWidth - oldWidth;
        const rad = (this.rotation || 0) * (Math.PI / 180);
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        this.position.x -= (diff / 2) * (1 - cos);
        this.position.y += (diff / 2) * sin;

        this.element.style.left = `${this.position.x}px`;
        this.element.style.top = `${this.position.y}px`;
        this.simulatorManager.updateConnectedWires(this.id);
        this.simulatorManager._requestSaveState();
    }

    getInternalConnections(pinId) { return []; }
    getPinOutput(pinId) { return -1; }

    static styleInjected = false;
    static injectStyles() {
        if (NeoPixelModel.styleInjected) return;
        const styleId = 'sim-neopixel-styles';
        const css = `
            .sim-component-body[data-type="neopixel_strip"] {
                position: relative; cursor: grab;
                overflow: visible !important;
            }
            .sim-neopixel-svg {
                height: 100%; 
                filter: drop-shadow(0 3px 5px rgba(0,0,0,0.3));
            }
            .neo-pcb { fill: #0a0a0a; stroke: #333; stroke-width: 1; }
            .neo-gold-pad-rect { fill: #f1c40f; stroke: #b7950b; stroke-width: 0.5; }
            .neo-copper-pad { fill: #cd7f32; stroke: #8e5823; stroke-width: 0.5; }
            .neo-case { fill: #fff; stroke: #ccc; stroke-width: 0.5; }
            .neo-lens { fill: #f0f0f0; stroke: #ddd; stroke-width: 0.5; transition: fill 0.05s; }
            .neo-cap { fill: #a08060; stroke: #5e4030; stroke-width: 0.5; }
            .neo-text { font-family: monospace; font-size: 8px; font-weight: bold; fill: #fff; pointer-events: none; alignment-baseline: middle; }
            .neo-cut-line { stroke: #555; stroke-width: 1; stroke-dasharray: 3,3; }
        `;
        const style = document.createElement('style');
        style.id = styleId; style.textContent = css;
        document.head.appendChild(style);
        NeoPixelModel.styleInjected = true;
    }
}

class NeoPixelRingModel extends VirtualComponent {
    constructor(id, simulatorManager, position, name, componentData) {
        super(id, 'neopixel_ring', simulatorManager, position, name, componentData);
        
        // State
        this.numPixels = componentData.numPixels || 12;
        this.pixelData = []; 
        
        this.resizeDataArray();
        NeoPixelRingModel.injectStyles();
    }

    resizeDataArray() {
        const oldData = [...this.pixelData];
        this.pixelData = [];
        for(let i=0; i<this.numPixels; i++) {
            this.pixelData.push(oldData[i] || [0,0,0]);
        }
    }

    getGeometry() {
        const radiusMap = { 4: 45, 8: 65, 12: 85, 16: 110, 24: 160 };
        const r = radiusMap[this.numPixels] || (this.numPixels * 7);
        const padding = 40; 
        const size = (r * 2) + padding;
        
        return {
            radius: r,
            width: size,
            height: size + 50, // Increased height for wires + connector
            centerX: size / 2,
            centerY: size / 2
        };
    }

    render(container) {
        this.element = document.createElement('div');
        this.element.className = 'sim-component';
        this.element.id = this.id;
        this.element.style.left = `${this.position.x}px`;
        this.element.style.top = `${this.position.y}px`;

        const body = document.createElement('div');
        body.className = 'sim-component-body';
        body.dataset.type = this.type;

        this.element.appendChild(body);
        container.appendChild(this.element);

        // Build the SVG content
        this.rebuildVisuals();
        
        this.simulatorManager.makeDraggable(body, this);
        
        // Initial visual update
        this.updateVisualState();
        
        return this.element;
    }

    rebuildVisuals() {
        if (!this.element) return;
        const body = this.element.querySelector('.sim-component-body');
        if (!body) return;

        body.innerHTML = '';

        const geo = this.getGeometry();
        const gid = this.id;

        // Update container size
        body.style.width = `${geo.width}px`;
        body.style.height = `${geo.height}px`;

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.classList.add('sim-neoring-svg');
        svg.setAttribute('viewBox', `0 0 ${geo.width} ${geo.height}`);

        // Filters & Gradients
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        defs.innerHTML = `
            <filter id="ringGlow_${gid}" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
                <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <radialGradient id="goldGrad_${gid}" cx="50%" cy="50%" r="50%">
                <stop offset="50%" style="stop-color:#f1c40f;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#b7950b;stop-opacity:1" />
            </radialGradient>
        `;
        svg.appendChild(defs);

        // Configuration
        const cx = geo.centerX;
        const cy = geo.centerY;
        const rOuter = geo.radius + 15;
        const rInner = geo.radius - 15;
        
        // Wire & Pin positions
        const wireYStart = cy + rOuter - 5; // Connect to bottom of ring
        const wireYEnd = geo.height - 10;   // Bottom of SVG minus padding
        const padOffsets = [-21, -7, 7, 21]; 
        const wireColors = ['w-blk', 'w-red', 'w-grn', 'w-wht'];
        const padLabels = ['G', 'V', 'I', 'O'];

        // 1. WIRES (Behind everything)
        const wiresGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        padOffsets.forEach((offset, i) => {
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("d", `M ${cx + offset},${wireYStart} L ${cx + offset},${wireYEnd}`);
            path.setAttribute("class", `neo-wire ${wireColors[i]}`);
            wiresGroup.appendChild(path);
        });
        svg.appendChild(wiresGroup);

        // 2. CONNECTOR BLOCK (At bottom)
        const connectorW = 64;
        const connectorH = 18;
        const connectorX = cx - (connectorW / 2);
        const connectorY = wireYEnd - (connectorH / 2);
        
        const connector = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        connector.setAttribute("x", connectorX);
        connector.setAttribute("y", connectorY);
        connector.setAttribute("width", connectorW);
        connector.setAttribute("height", connectorH);
        connector.setAttribute("rx", 4);
        connector.setAttribute("fill", "#2c3e50"); // Dark Blue PCB style
        connector.setAttribute("stroke", "#1a252f");
        connector.setAttribute("stroke-width", "1");
        svg.appendChild(connector);

        // 3. PCB RING
        const ringPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        const d = `
            M ${cx}, ${cy - rOuter}
            A ${rOuter},${rOuter} 0 1,1 ${cx},${cy + rOuter}
            A ${rOuter},${rOuter} 0 1,1 ${cx},${cy - rOuter}
            M ${cx}, ${cy - rInner}
            A ${rInner},${rInner} 0 1,0 ${cx},${cy + rInner}
            A ${rInner},${rInner} 0 1,0 ${cx},${cy - rInner}
            Z
        `;
        ringPath.setAttribute("d", d);
        ringPath.setAttribute("class", "neo-pcb-ring");
        ringPath.setAttribute("fill-rule", "evenodd");
        svg.appendChild(ringPath);

        // 4. SOLDER JOINTS (On Ring)
        const solderGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        padOffsets.forEach((offset) => {
             const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
             c.setAttribute("cx", cx + offset);
             c.setAttribute("cy", wireYStart);
             c.setAttribute("r", 2.5);
             c.setAttribute("fill", "#bdc3c7");
             solderGroup.appendChild(c);
        });
        svg.appendChild(solderGroup);

        // 5. LEDS
        const ledsGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        this.renderRingLeds(ledsGroup, geo);
        svg.appendChild(ledsGroup);

        // 6. PADS & LABELS (On Connector)
        const padsGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        padOffsets.forEach((offset, i) => {
            const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
            // Position on the connector block
            g.setAttribute("transform", `translate(${cx + offset}, ${wireYEnd})`);
            
            // Gold Pad
            g.innerHTML = `<circle r="5" class="neo-gold-pad" style="fill:url(#goldGrad_${gid})"/><circle r="2" class="neo-solder"/>`;
            
            // Label (Above pad, white text on dark connector)
            const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
            txt.textContent = padLabels[i];
            txt.setAttribute("y", -7);
            txt.setAttribute("text-anchor", "middle");
            txt.setAttribute("class", "neo-pad-text");
            // Overriding style for visibility on connector
            txt.style.fill = "#fff"; 
            txt.style.fontSize = "7px";
            
            g.appendChild(txt);
            padsGroup.appendChild(g);
        });
        svg.appendChild(padsGroup);

        body.appendChild(svg);
        
        // 7. Update Pins (Hotspots match pad locations)
        this.updateInputPins(body, geo, padOffsets, wireYEnd);
    }

    renderRingLeds(group, geo) {
        const { centerX, centerY, radius } = geo;
        for (let i = 0; i < this.numPixels; i++) {
            const angleDeg = (i * 360) / this.numPixels;
            const angleRad = (angleDeg - 90) * (Math.PI / 180);
            const x = centerX + radius * Math.cos(angleRad);
            const y = centerY + radius * Math.sin(angleRad);

            const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
            g.setAttribute("transform", `translate(${x}, ${y}) rotate(${angleDeg})`);

            const cap = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            cap.setAttribute("x", -26); cap.setAttribute("y", -3);
            cap.setAttribute("width", 5); cap.setAttribute("height", 6);
            cap.setAttribute("class", "neo-smd-cap");
            g.appendChild(cap);

            const ledCase = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            ledCase.setAttribute("x", -12); ledCase.setAttribute("y", -12);
            ledCase.setAttribute("width", 24); ledCase.setAttribute("height", 24);
            ledCase.setAttribute("rx", 3);
            ledCase.setAttribute("class", "neo-ring-case");
            g.appendChild(ledCase);

            const lens = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            lens.setAttribute("cx", 0); lens.setAttribute("cy", 0);
            lens.setAttribute("r", 12);
            lens.setAttribute("class", "neo-ring-lens");
            lens.id = `neo_ring_${this.id}_${i}`;
            
            // Initial Render logic moved to updateVisualState for centralization
            
            g.appendChild(lens);
            group.appendChild(g);
        }
    }

    updateInputPins(container, geo, offsets, bottomY) {
        container.querySelectorAll('.sim-pin-hotspot').forEach(p => p.remove());
        
        const pinIds = ['GND', 'VCC', 'DIN', 'DOUT'];
        const cx = geo.centerX;

        offsets.forEach((offset, i) => {
            const pin = document.createElement('div');
            pin.className = 'sim-pin-hotspot component-pin';
            pin.dataset.componentId = this.id;
            pin.dataset.pinId = pinIds[i];
            pin.title = pinIds[i];
            
            // Position on the connector pads
            pin.style.left = `${cx + offset}px`;
            pin.style.top = `${bottomY}px`; 
            pin.style.transform = 'translate(-50%, -50%)';
            pin.style.width = '12px'; pin.style.height = '12px';
            
            container.appendChild(pin);
            
            pin.addEventListener('click', (e) => {
                e.stopPropagation();
                this.simulatorManager.handlePinClick(pin, e);
            });
        });
    }

    setPixelCount(count) {
        const c = parseInt(count);
        if (isNaN(c) || c === this.numPixels) return;
        
        this.numPixels = c;
        this.resizeDataArray();
        this.rebuildVisuals();
        this.updateVisualState(); // Re-apply after rebuild
    }

    update(colors) {
        if (!Array.isArray(colors)) return;
        
        for(let i=0; i<Math.min(colors.length, this.numPixels); i++) {
            this.pixelData[i] = colors[i];
        }
        
        this.updateVisualState();
    }
    
    step(dt) {
        this.updateVisualState();
    }

    updateVisualState() {
        if (!this.element) return;
        
        // 1. Check Power Rails
        const pwrLevel = this.simulatorManager.railManager.getPinLevel(this.id, 'VCC');
        const gndLevel = this.simulatorManager.railManager.getPinLevel(this.id, 'GND');
        const isPowered = (pwrLevel === 1 && gndLevel === 0);

        // 2. Render Pixels
        for(let i=0; i<this.numPixels; i++) {
            const lens = this.element.querySelector(`#neo_ring_${this.id}_${i}`);
            if (!lens) continue;
            
            let r=0, g=0, b=0;
            
            // Only show color if powered
            if (isPowered && this.pixelData[i]) {
                r = this.pixelData[i][0];
                g = this.pixelData[i][1];
                b = this.pixelData[i][2];
            }

            if (r > 0 || g > 0 || b > 0) {
                lens.style.fill = `rgb(${r},${g},${b})`;
                lens.style.filter = `url(#ringGlow_${this.id})`;
            } else {
                lens.style.fill = '#f0f0f0';
                lens.style.filter = 'none';
            }
        }
    }

    getInternalConnections(pinId) { return []; }
    getPinOutput(pinId) { return -1; }

    static styleInjected = false;
    static injectStyles() {
        if (NeoPixelRingModel.styleInjected) return;
        const styleId = 'sim-neoring-styles';
        const css = `
            .sim-component-body[data-type="neopixel_ring"] {
                position: relative; cursor: grab;
                overflow: visible !important;
            }
            .sim-neoring-svg {
                filter: drop-shadow(0 8px 15px rgba(0,0,0,0.3));
            }
            .neo-pcb-ring { fill: #121212; stroke: #000; stroke-width: 1; }
            .neo-ring-case { fill: #fff; stroke: #ccc; stroke-width: 0.5; }
            .neo-ring-lens { fill: #f0f0f0; stroke: #ddd; stroke-width: 0.5; transition: fill 0.05s; }
            .neo-smd-cap { fill: #c0a080; stroke: #8b6b4a; stroke-width: 0.5; }
            
            .neo-wire { fill: none; stroke-width: 4; stroke-linecap: round; }
            .w-blk { stroke: #2d3436; }
            .w-red { stroke: #d63031; }
            .w-grn { stroke: #00b894; }
            .w-wht { stroke: #527af1ff; stroke-width: 4; stroke: #bdc3c7; }
            
            .neo-gold-pad { stroke: #b7950b; stroke-width: 1; }
            .neo-solder { fill: #95a5a6; opacity: 0.6; }
            .neo-pad-text { font-family: monospace; font-weight: bold; }
        `;
        const style = document.createElement('style');
        style.id = styleId; style.textContent = css;
        document.head.appendChild(style);
        NeoPixelRingModel.styleInjected = true;
    }
}

class OLEDModel extends VirtualComponent {
    constructor(id, simulatorManager, position, name, componentData) {
        super(id, 'oled_i2c', simulatorManager, position, name, componentData);
        
        this.width = 128;
        this.height = 64;
        this.i2cAddress = componentData.i2cAddress || "0x3C";

        // 1. Logic Buffer (Hidden)
        // We draw here using High Contrast (White on Black)
        this.bufferCanvas = document.createElement('canvas');
        this.bufferCanvas.width = 128;
        this.bufferCanvas.height = 64;
        this.bctx = this.bufferCanvas.getContext('2d', { willReadFrequently: true });
        this.bctx.imageSmoothingEnabled = false;

        // State
        this.isInverted = false;
        
        // Define Theme Colors (Cyan Look)
        this.themeOnColor = { r: 0, g: 255, b: 255 }; // Cyan
        this.themeOffColor = { r: 0, g: 0, b: 0 };    // Black

        OLEDModel.injectStyles();
    }

    render(container) {
        this.element = document.createElement('div');
        this.element.className = 'sim-component';
        this.element.id = this.id;
        this.element.style.left = `${this.position.x}px`;
        this.element.style.top = `${this.position.y}px`;

        const body = document.createElement('div');
        body.className = 'sim-component-body';
        body.dataset.type = this.type;
        body.style.position = 'relative';

        const gid = this.id;

        const svgHTML = `
            <svg viewBox="0 0 280 280" class="sim-oled-svg" style="width:100%; height:100%; position:absolute; top:0; left:0; z-index: 1; pointer-events: none;">
                <defs>
                    <radialGradient id="goldGrad_${gid}" cx="50%" cy="50%" r="50%">
                        <stop offset="50%" style="stop-color:#f1c40f;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#b7950b;stop-opacity:1" />
                    </radialGradient>
                    <linearGradient id="glassReflect_${gid}" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="30%" style="stop-color:#fff;stop-opacity:0" />
                        <stop offset="50%" style="stop-color:#fff;stop-opacity:0.05" />
                        <stop offset="51%" style="stop-color:#fff;stop-opacity:0.1" />
                        <stop offset="70%" style="stop-color:#fff;stop-opacity:0" />
                    </linearGradient>
                </defs>
                <rect x="10" y="10" width="260" height="260" rx="12" class="oled-pcb-board" />
                
                <!-- Mounting Holes -->
                <circle cx="30" cy="30" r="8" class="oled-hole" /><circle cx="30" cy="30" r="8" class="oled-gold-ring" />
                <circle cx="250" cy="30" r="8" class="oled-hole" /><circle cx="250" cy="30" r="8" class="oled-gold-ring" />
                <circle cx="30" cy="250" r="8" class="oled-hole" /><circle cx="30" cy="250" r="8" class="oled-gold-ring" />
                <circle cx="250" cy="250" r="8" class="oled-hole" /><circle cx="250" cy="250" r="8" class="oled-gold-ring" />
                
                <!-- Pins -->
                <g transform="translate(100, 22)">
                    <circle cx="0" cy="0" r="7" class="oled-gold-pad" style="fill:url(#goldGrad_${gid})" /><circle cx="0" cy="0" r="3" class="oled-pin-hole" />
                    <circle cx="25" cy="0" r="7" class="oled-gold-pad" style="fill:url(#goldGrad_${gid})" /><circle cx="25" cy="0" r="3" class="oled-pin-hole" />
                    <circle cx="50" cy="0" r="7" class="oled-gold-pad" style="fill:url(#goldGrad_${gid})" /><circle cx="50" cy="0" r="3" class="oled-pin-hole" />
                    <circle cx="75" cy="0" r="7" class="oled-gold-pad" style="fill:url(#goldGrad_${gid})" /><circle cx="75" cy="0" r="3" class="oled-pin-hole" />
                    <g transform="translate(0, 12)">
                        <text x="0" y="0" class="oled-pin-txt">GND</text><text x="25" y="0" class="oled-pin-txt">VCC</text>
                        <text x="50" y="0" class="oled-pin-txt">SCL</text><text x="75" y="0" class="oled-pin-txt">SDA</text>
                    </g>
                </g>
                
                <!-- Screen Bezel -->
                <g transform="translate(30, 48)">
                    <!-- Outer Bezel -->
                    <rect x="0" y="0" width="220" height="130" fill="#111" stroke="#333" stroke-width="2" rx="2" />
                    <!-- Inner Active Area Frame -->
                    <rect x="5" y="12.5" width="210" height="105" fill="#000" />
                    <!-- Glass Reflection -->
                    <path d="M 0,0 L 140,0 L 0,130 Z" fill="url(#glassReflect_${gid})" style="pointer-events:none;" />
                    <!-- Bottom Flex Area -->
                    <rect x="20" y="130" width="180" height="25" fill="#1a1a1a" opacity="0.9" />
                    <path d="M 40,130 L 180,130 L 170,155 L 50,155 Z" fill="#111" />
                    <g stroke="#555" stroke-width="1" opacity="0.5">
                        <line x1="60" y1="130" x2="65" y2="155" /><line x1="80" y1="130" x2="82" y2="155" />
                        <line x1="100" y1="130" x2="100" y2="155" /><line x1="120" y1="130" x2="118" y2="155" />
                        <line x1="140" y1="130" x2="135" y2="155" /><line x1="160" y1="130" x2="152" y2="155" />
                    </g>
                    <rect x="60" y="152" width="100" height="3" fill="#eee" />
                </g>

                <g transform="translate(80, 203)">
                    <path d="M 10,0 L 110,0 L 100,35 L 20,35 Z" class="oled-ribbon" />
                </g>
            </svg>
        `;
        
        body.innerHTML = svgHTML;

        // 2. Visual Canvas
        this.canvas = document.createElement('canvas');
        this.canvas.width = 128;
        this.canvas.height = 64;
        
        Object.assign(this.canvas.style, {
            position: 'absolute',
            top: '60.5px',
            left: '35px',
            width: '210px',
            height: '105px',
            zIndex: '10',
            imageRendering: 'pixelated',
            backgroundColor: '#000000',
            display: 'block',
            borderRadius: '0px', 
            boxShadow: '0 0 10px rgba(0, 255, 255, 0.05)'
        });

        this.ctx = this.canvas.getContext('2d', { alpha: false });
        this.ctx.imageSmoothingEnabled = false;

        body.appendChild(this.canvas);
        this.element.appendChild(body);
        container.appendChild(this.element);

        this.renderPins(body);
        this.simulatorManager.makeDraggable(body, this);
        
        this.reset(); // Init buffer

        return this.element;
    }

    renderPins(container) {
        const pins = [ { id: 'GND', x: 100 }, { id: 'VCC', x: 125 }, { id: 'SCL', x: 150 }, { id: 'SDA', x: 175 } ];
        pins.forEach(p => {
            const pin = document.createElement('div');
            pin.className = 'sim-pin-hotspot component-pin';
            pin.dataset.componentId = this.id;
            pin.dataset.pinId = p.id;
            pin.title = p.id;
            Object.assign(pin.style, { position: 'absolute', left: `${p.x}px`, top: '22px', width: '14px', height: '14px', transform: 'translate(-50%, -50%)', zIndex: '20' });
            container.appendChild(pin);
            pin.addEventListener('click', (e) => { e.stopPropagation(); this.simulatorManager.handlePinClick(pin, e); });
        });
    }

    // --- Logic Implementation ---

    reset() {
        this.bctx.fillStyle = '#000000';
        this.bctx.fillRect(0, 0, 128, 64);
        this.show();
    }

    fill(col) {
        this.bctx.fillStyle = (col > 0) ? '#FFFFFF' : '#000000';
        this.bctx.fillRect(0, 0, 128, 64);
    }

    pixel(x, y, col) {
        this.bctx.fillStyle = (col > 0) ? '#FFFFFF' : '#000000';
        this.bctx.fillRect(Math.floor(x), Math.floor(y), 1, 1);
    }

    text(str, x, y, col) {
        this.bctx.fillStyle = (col > 0) ? '#FFFFFF' : '#000000';
        this.bctx.font = "12px monospace";
        this.bctx.textBaseline = "top";
        this.bctx.fillText(String(str), Math.floor(x), Math.floor(y));
    }

    line(x1, y1, x2, y2, col) {
        this.bctx.strokeStyle = (col > 0) ? '#FFFFFF' : '#000000';
        this.bctx.lineWidth = 1;
        this.bctx.beginPath();
        this.bctx.moveTo(Math.floor(x1), Math.floor(y1));
        this.bctx.lineTo(Math.floor(x2), Math.floor(y2));
        this.bctx.stroke();
    }

    rect(x, y, w, h, col, fill) {
        const c = (col > 0) ? '#FFFFFF' : '#000000';
        if (fill) { this.bctx.fillStyle = c; this.bctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h)); } 
        else { this.bctx.strokeStyle = c; this.bctx.strokeRect(Math.floor(x)+0.5, Math.floor(y)+0.5, Math.floor(w), Math.floor(h)); }
    }

    show() {
        if (!this.ctx) return;

        // 1. Get Buffer Data
        const w = 128, h = 64;
        const srcData = this.bctx.getImageData(0, 0, w, h).data;
        const destImg = this.ctx.createImageData(w, h);
        const destData = destImg.data;

        // 2. Determine Target Colors
        const fg = this.isInverted ? this.themeOffColor : this.themeOnColor;
        const bg = this.isInverted ? this.themeOnColor : this.themeOffColor;

        // 3. Pixel Mapping Loop
        for (let i = 0; i < srcData.length; i += 4) {
            // In buffer: Red channel > 100 means pixel is ON (White)
            const isLogicalOn = srcData[i] > 100; 

            if (isLogicalOn) {
                destData[i]   = fg.r;
                destData[i+1] = fg.g;
                destData[i+2] = fg.b;
                destData[i+3] = 255;
            } else {
                destData[i]   = bg.r;
                destData[i+1] = bg.g;
                destData[i+2] = bg.b;
                destData[i+3] = 255;
            }
        }

        // 4. Put to screen
        this.ctx.putImageData(destImg, 0, 0);
    }
    
    invert(i) {
        // Toggle state and redraw immediately
        this.isInverted = !!i;
        this.show();
    }
    
    power(s) {}
    contrast(c) {}
    
    getInternalConnections(id) { return []; }
    getPinOutput(id) { return -1; }
    step(dt) {}

    static injectStyles() {
        if (document.getElementById('sim-oled-styles')) return;
        const css = `
            .sim-component-body[data-type="oled_i2c"] { 
                width: 280px; height: 280px; 
                position: relative; cursor: grab; 
                overflow: visible !important; 
            }
            .sim-oled-svg { 
                width: 100%; height: 100%; 
                filter: drop-shadow(0 10px 15px rgba(0,0,0,0.3)); 
            }
            .oled-pcb-board { fill: #005b8c; stroke: #003a59; stroke-width: 1; }
            .oled-hole { fill: #eee; stroke: #bdc3c7; stroke-width: 2; }
            .oled-gold-ring { fill: none; stroke: #f1c40f; stroke-width: 4; }
            .oled-gold-pad { stroke: #b7950b; stroke-width: 1; }
            .oled-pin-hole { fill: #222; opacity: 0.9; }
            .oled-pin-txt { fill: #fff; font-family: sans-serif; font-size: 7px; font-weight: bold; text-anchor: middle; }
            .oled-ribbon { fill: #1a1a1a; stroke: #000; stroke-width: 1; }
        `;
        const style = document.createElement('style');
        style.id = 'sim-oled-styles';
        style.textContent = css;
        document.head.appendChild(style);
    }
}

class DCMotorModel extends VirtualComponent {
    constructor(id, simulatorManager, position, name, componentData) {
        super(id, 'dc_motor', simulatorManager, position, name, componentData);

        // State
        this.currentAngle = 0;
        this.MAX_RPM = 200; // @ 6V
        
        // Store input levels for the two terminals
        this.inputStates = { 'VCC': 0, 'GND': 0 };

        // Elements
        this.rotatingAssembly = null;

        DCMotorModel.injectStyles();
    }

    reset() {
        this.inputStates = { 'VCC': 0, 'GND': 0 };
    }

    render(container) {
        this.element = document.createElement('div');
        this.element.className = 'sim-component';
        this.element.id = this.id;
        this.element.style.left = `${this.position.x}px`;
        this.element.style.top = `${this.position.y}px`;

        const body = document.createElement('div');
        body.className = 'sim-component-body';
        body.dataset.type = this.type;

        const gid = this.id;

        body.innerHTML = `
            <svg viewBox="0 0 450 520" class="sim-dc-svg">
                <defs>
                    <linearGradient id="yellowGrad_${gid}" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style="stop-color:#f1da36;stop-opacity:1" />
                        <stop offset="50%" style="stop-color:#f7e463;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#f1da36;stop-opacity:1" />
                    </linearGradient>

                    <linearGradient id="silverGrad_${gid}" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style="stop-color:#dcdde1;stop-opacity:1" />
                        <stop offset="50%" style="stop-color:#f5f6fa;stop-opacity:1" />
                        <stop offset="90%" style="stop-color:#bdc3c7;stop-opacity:1" />
                    </linearGradient>

                    <radialGradient id="goldGrad_${gid}" cx="50%" cy="50%" r="50%">
                        <stop offset="40%" style="stop-color:#f1c40f;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#b7950b;stop-opacity:1" />
                    </radialGradient>

                    <filter id="compShadow_${gid}" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur in="SourceAlpha" stdDeviation="4"/>
                        <feOffset dx="0" dy="4" result="offsetblur"/>
                        <feComponentTransfer>
                            <feFuncA type="linear" slope="0.15"/>
                        </feComponentTransfer>
                        <feMerge>
                            <feMergeNode/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>

                <g class="dc-rotating-assembly">
                    <circle cx="225" cy="160" r="160" fill="none" stroke="#2d3436" stroke-width="45" />
                    <circle cx="225" cy="160" r="138" fill="none" stroke="#3a3a3a" stroke-width="2" />
                    <circle cx="225" cy="160" r="178" fill="none" stroke="#1e272e" stroke-width="12" stroke-dasharray="20, 12" />
                    <circle cx="225" cy="160" r="70" fill="transparent" stroke="#f3d615" stroke-width="12" />
                    <rect x="88" y="152" width="275" height="25" rx="3" fill="#3a3a3a" stroke="#3a3a3a" stroke-width="1" />
                    <rect x="213" y="22" width="25" height="275" rx="3" fill="#3a3a3a" stroke="#3a3a3a" stroke-width="1" />
                </g>

                <g filter="url(#compShadow_${gid})" transform="translate(55, 0)">
                    <rect x="162" y="40" width="16" height="20" fill="#eccf0e" />
                    <rect x="95" y="60" width="150" height="250" fill="url(#yellowGrad_${gid})" stroke="#e1c312" stroke-width="1" />
                    <rect x="245" y="220" width="10" height="35" rx="2" fill="#e1c312" />
                    <circle cx="250" cy="237" r="3" fill="#fff" fill-opacity="0.6" />
                    <path d="M 95,310 L 245,310 L 245,340 Q 170,360 95,340 Z" fill="url(#yellowGrad_${gid})" stroke="#e1c312" stroke-width="1" />
                    <path d="M 92,340 L 92,480 Q 170,490 248,480 L 248,340" fill="none" stroke="#fff" stroke-width="2" stroke-opacity="0.5" />
                    <rect x="105" y="335" width="130" height="125" fill="url(#silverGrad_${gid})" stroke="#bdc3c7" stroke-width="0.5" />
                    <rect x="125" y="335" width="5" height="125" fill="#fff" fill-opacity="0.4" />
                    <rect x="210" y="335" width="5" height="125" fill="#bdc3c7" fill-opacity="0.3" />
                    <path d="M 105,460 L 235,460 L 235,485 Q 170,495 105,485 Z" fill="#343434" />
                    <rect x="115" y="460" width="8" height="30" fill="#222" />
                    <rect x="217" y="460" width="8" height="30" fill="#222" />
                    <rect x="168" y="490" width="4" height="6" fill="#555" />

                    <g transform="translate(105, 390)">
                        <rect x="-8" y="-30" width="8" height="60" fill="#f5f6fa" stroke="#ccc" opacity="0.8"/>
                        <circle cx="-15" cy="-15" r="3" fill="#e74c3c" />
                        <path d="M -15,-15 C -30,-15 -35,-20 -70,-20" stroke="#c0392b" stroke-width="3" fill="none" />
                        <circle cx="-70" cy="-20" r="6" class="dc-gold-pad" style="fill:url(#goldGrad_${gid})" />
                        <circle cx="-70" cy="-20" r="2.5" class="dc-solder" />
                        <circle cx="-15" cy="25" r="3" fill="#34495e" />
                        <path d="M -15,25 C -30,25 -35,20 -70,20" stroke="#2c3e50" stroke-width="3" fill="none" />
                        <circle cx="-70" cy="20" r="6" class="dc-gold-pad" style="fill:url(#goldGrad_${gid})" />
                        <circle cx="-70" cy="20" r="2.5" class="dc-solder" />
                    </g>
                </g>
            </svg>
        `;

        this.rotatingAssembly = body.querySelector('.dc-rotating-assembly');

        this.element.appendChild(body);
        container.appendChild(this.element);

        this.renderPins(body);
        this.simulatorManager.makeDraggable(body, this);
        
        return this.element;
    }

    renderPins(container) {
        container.querySelectorAll('.sim-pin-hotspot').forEach(p => p.remove());
        
        const pins = [
            { id: 'VCC', x: '72px', y: '296px' },
            { id: 'GND', x: '72px', y: '328px' } 
        ];

        pins.forEach(p => {
            const pin = document.createElement('div');
            pin.className = 'sim-pin-hotspot component-pin';
            pin.dataset.componentId = this.id;
            pin.dataset.pinId = p.id;
            pin.title = p.id === 'VCC' ? 'Terminal A (+)' : 'Terminal B (-)';
            pin.style.left = p.x;
            pin.style.top = p.y;
            pin.style.transform = 'translate(-50%, -50%)';
            pin.style.width = '14px'; 
            pin.style.height = '14px';
            container.appendChild(pin);
            pin.addEventListener('click', (e) => {
                e.stopPropagation();
                this.simulatorManager.handlePinClick(pin, e);
            });
        });
    }

    update(pinValue, pinId) {
        if (pinId && this.inputStates.hasOwnProperty(pinId)) {
            this.inputStates[pinId] = pinValue;
        }
    }

    step(deltaTime) {
        if (!this.simulatorManager.ide.isSimulationRunning) return;

        let lvlTop = this.simulatorManager.railManager.getPinLevel(this.id, 'VCC');
        let lvlBot = this.simulatorManager.railManager.getPinLevel(this.id, 'GND');

        if (lvlTop === -1) lvlTop = this.inputStates['VCC'];
        if (lvlBot === -1) lvlBot = this.inputStates['GND'];

        const netSpeed = lvlTop - lvlBot;

        if (Math.abs(netSpeed) < 0.01) return;

        const degPerSec = netSpeed * this.MAX_RPM * 6;
        
        this.currentAngle += degPerSec * deltaTime;
        this.currentAngle %= 360;
        
        this.updateVisualState();
    }

    updateVisualState() {
        if (this.rotatingAssembly) {
            this.rotatingAssembly.setAttribute('transform', `rotate(${this.currentAngle} 225 160)`);
        }
    }

    static styleInjected = false;
    static injectStyles() {
        if (DCMotorModel.styleInjected) return;
        const styleId = 'sim-dc-styles';
        const css = `
            .sim-component-body[data-type="dc_motor"] {
                width: 360px; height: 416px; 
                position: relative; cursor: grab;
                overflow: visible !important;
            }
            .sim-dc-svg {
                width: 100%; height: 100%;
                filter: drop-shadow(0 5px 10px rgba(0,0,0,0.2));
            }
            .dc-gold-pad { stroke: #b7950b; stroke-width: 1; }
            .dc-solder { fill: #bdc3c7; opacity: 0.8; }
        `;
        const style = document.createElement('style');
        style.id = styleId; style.textContent = css;
        document.head.appendChild(style);
        DCMotorModel.styleInjected = true;
    }
}

class ServoModel extends VirtualComponent {
    constructor(id, simulatorManager, position, name, componentData) {
        super(id, 'servo_motor', simulatorManager, position, name, componentData);
        
        this.currentAngle = 90; // Start centered
        this.targetAngle = 90;
        this.rotationSpeed = 300; // deg/sec
        
        this.hornType = componentData.hornType || 'single';
        this.hornElement = null;
        
        ServoModel.injectStyles();
    }

    getHornPath(type) {
        switch(type) {
            case 'cross': return 'm119.54 50.354h-18.653v-18.653a8.4427 8.4427 0 0 0-8.4427-8.4427h-1.9537a8.4427 8.4427 0 0 0-8.4427 8.4427v18.653h-18.653a8.4427 8.4427 0 0 0-8.4427 8.4427v1.9537a8.4427 8.4427 0 0 0 8.4427 8.4427h18.653v18.653a8.4427 8.4427 0 0 0 8.4427 8.4427h1.9537a8.4427 8.4427 0 0 0 8.4427-8.4427v-18.653h18.653a8.4427 8.4427 0 0 0 8.4426-8.4427v-1.9537a8.4427 8.4427 0 0 0-8.4426-8.4427z';
            case 'double': return 'm101.63 57.808c-0.0768-0.48377-0.16978-0.8838-0.23258-1.1629l-4.112-51.454c0-2.8654-2.6026-5.1912-5.8145-5.1912s-5.8145 2.3258-5.8145 5.1912l-4.1004 51.447c-0.07443 0.28607-0.16746 0.69774-0.24421 1.1629a12.473 12.473 0 0 0 0 3.9306c0.07675 0.48377 0.16978 0.8838 0.24421 1.1629l4.1004 51.461c0 2.8654 2.6026 5.1912 5.8145 5.1912s5.8145-2.3258 5.8145-5.1912l4.1004-51.447c0.0744-0.28607 0.16746-0.69774 0.23258-1.1629a12.473 12.473 0 0 0 0.0116-3.9376zm-4.2376 7.8868a8.3426 8.3426 0 0 1-3.5375 2.1072c-0.25816 0.07443-0.52098 0.13955-0.7838 0.19072a8.7217 8.7217 0 0 1-1.1978 0.1442c-0.26747 0.01163-0.53726 0.01163-0.80473 0a8.7217 8.7217 0 0 1-1.1978-0.1442c-0.26282-0.05117-0.52563-0.11629-0.78379-0.19072a8.3729 8.3729 0 0 1 0-16.048c0.25816-0.07675 0.52098-0.13955 0.78379-0.19072a8.7217 8.7217 0 0 1 1.1978-0.1442c0.26747-0.01163 0.53726-0.01163 0.80473 0a8.7217 8.7217 0 0 1 1.1978 0.1442c0.26282 0.05117 0.52563 0.11396 0.7838 0.19072a8.3729 8.3729 0 0 1 3.5375 13.955zm-5.9215-54.996a2.791 2.791 0 1 1-2.791 2.791 2.791 2.791 0 0 1 2.791-2.791zm0 8.6055a2.791 2.791 0 1 1-2.791 2.791 2.791 2.791 0 0 1 2.791-2.791zm0 8.3729a2.791 2.791 0 1 1-2.791 2.791 2.791 2.791 0 0 1 2.791-2.791zm0 8.6055a2.791 2.791 0 1 1-2.791 2.791 2.791 2.791 0 0 1-2.791 2.791zm0 72.565a2.791 2.791 0 1 1 2.791-2.791 2.791 2.791 0 0 1-2.791 2.791zm0-8.6055a2.791 2.791 0 1 1 2.791-2.791 2.791 2.791 0 0 1-2.791 2.791zm0-8.3729a2.791 2.791 0 1 1 2.791-2.791 2.791 2.791 0 0 1-2.791 2.791zm0-8.6055a2.791 2.791 0 1 1 2.791-2.791 2.791 2.791 0 0 1-2.791 2.791z';
            case 'single': default: return 'm101.6 59.589-4.3167-54.166c0-2.8654-2.6026-5.1912-5.8145-5.1912s-5.8145 2.3258-5.8145 5.1912l-4.3167 54.166a8.3264 8.3264 0 0 0-0.10234 1.2792c0 5.047 4.5818 9.1381 10.234 9.1381s10.234-4.0911 10.234-9.1381a8.3264 8.3264 0 0 0-0.10233-1.2792zm-10.131-48.658a2.791 2.791 0 1 1-2.791 2.791 2.791 2.791 0 0 1 2.791-2.791zm0 8.6055a2.791 2.791 0 1 1-2.791 2.791 2.791 2.791 0 0 1 2.791-2.791zm0 8.3729a2.791 2.791 0 1 1-2.791 2.791 2.791 2.791 0 0 1 2.791-2.791zm0 8.6055a2.791 2.791 0 1 1-2.791 2.791 2.791 2.791 0 0 1 2.791-2.791zm5.9215 29.412a8.3729 8.3729 0 1 1 0-11.843 8.3729 8.3729 0 0 1 0 11.843z';
        }
    }

    render(container) {
        this.element = document.createElement('div');
        this.element.className = 'sim-component';
        this.element.id = this.id;
        this.element.style.left = `${this.position.x}px`;
        this.element.style.top = `${this.position.y}px`;

        const body = document.createElement('div');
        body.className = 'sim-component-body';
        body.dataset.type = 'servo_motor'; // Uses shared CSS class

        body.innerHTML = `
            <svg viewBox="0 0 120 200" class="sim-servo-svg">
                <defs>
                    <style>
                        .servo-case { fill: #1b3765; stroke: #102a4e; stroke-width: 0.5; }
                        .servo-gear-base { fill: #A0AEC0; }
                        .servo-gear-top { fill: #4A5568; }
                        .servo-horn { fill: #eceff1; stroke: #b0bec5; stroke-width: 1; transition: fill 0.2s; }
                        .w-orange { stroke: #ffb74d; }
                        .w-red { stroke: #e53935; }
                        .w-brown { stroke: #5d4037; }
                        .wire-path { fill: none; stroke-width: 4.5; stroke-linecap: butt; }
                    </style>
                </defs>
                
                <!-- 1. ROTATED BODY -->
                <g transform="translate(120, -30) rotate(90)">
                    <path d="m163.92 66.867a7.09 7.09 0 1 1 5.8145-11.136 0.18 0.18 0 0 0 0.33-0.10234v-14.346h-17.664v36.98h17.676v-14.346a0.18 0.18 0 0 0-0.333-0.107 7.08 7.08 0 0 1-5.83 3.06z" style="fill:#2D3748" />
                    <path d="m55.068 66.75a7.09 7.09 0 1 0-5.8261-11.136 0.18 0.18 0 0 1-0.33-0.10234v-14.346h17.676v36.98h-17.676v-14.346a0.18 0.18 0 0 1 0.333-0.107 7.08 7.08 0 0 0 5.83 3.06z" style="fill:#2D3748" />
                    <rect class="servo-case" x="64.255" y="37.911" width="90.241" height="43.725" rx="5.3331" />
                    <path d="m110.07 50.005h-14.42v19.537h14.42a9.7684 9.7684 0 0 0 0-19.537z" style="fill:#A0AEC0" />
                    <circle class="servo-gear-base" cx="91.467" cy="59.773" r="18.606" />
                    <circle cx="91.467" cy="59.773" r="8.3729" style="fill:#A0AEC0" />
                    <circle class="servo-gear-top" cx="91.467" cy="59.773" r="6.2494" />
                    <path d="m94.911 62.543-2.3839-2.4165a0.42562 0.42562 0 0 1 0-0.60471l2.4281-2.3863a0.64657 0.64657 0 0 0 0.06512-0.8652 0.62797 0.62797 0 0 0-0.93032-0.05117l-2.4351 2.4049a0.4326 0.4326 0 0 1-0.60703 0l-2.3863-2.4165a0.6489 0.6489 0 0 0-0.8652-0.06512 0.63262 0.63262 0 0 0 0.93032-0.04186 0.64657 0.64657 0 0 0-0.04419-0.8652z" style="fill:#4A5568" />
                    
                    <!-- Horn -->
                    <path id="servo-horn-path" class="servo-horn" d="${this.getHornPath(this.hornType)}" />
                </g>

                <!-- 2. WIRES -->
                <g id="wires">
                    <path d="M 54,125 L 48,147 L 48,162" class="wire-path w-orange" />
                    <path d="M 60,125 L 60,162" class="wire-path w-red" />
                    <path d="M 66,125 L 72,147 L 72,162" class="wire-path w-brown" />
                </g>

                <!-- 3. CONNECTOR -->
                <g transform="translate(22, 180)">
                    <rect x="18" y="-20" width="40" height="12" rx="2" style="fill:#111" />
                    <!-- Metal Pins -->
                    <rect x="24" y="-17" width="4" height="6" rx="0.5" style="fill:#b0bec5" />
                    <rect x="36" y="-17" width="4" height="6" rx="0.5" style="fill:#b0bec5" />
                    <rect x="48" y="-17" width="4" height="6" rx="0.5" style="fill:#b0bec5" />
                </g>
            </svg>
        `;

        this.hornElement = body.querySelector('#servo-horn-path');
        this.element.appendChild(body);
        container.appendChild(this.element);

        this.renderPins(body);
        this.simulatorManager.makeDraggable(body, this);
        this.updateVisualState();
        
        return this.element;
    }
    
    renderPins(container) {
        container.querySelectorAll('.sim-pin-hotspot').forEach(p => p.remove());
        const pins = this.componentData.pins || [];

        pins.forEach(p => {
            const pin = document.createElement('div');
            pin.className = 'sim-pin-hotspot component-pin';
            pin.dataset.componentId = this.id;
            pin.dataset.pinId = p.id;
            pin.title = p.name || p.id;
            
            pin.style.left = `${p.pos.x}px`;
            pin.style.top = `${p.pos.y}px`;
            pin.style.transform = 'translate(-50%, -50%)';
            pin.style.width = '14px'; 
            pin.style.height = '14px';
            
            container.appendChild(pin);
            
            pin.addEventListener('click', (e) => {
                e.stopPropagation();
                this.simulatorManager.handlePinClick(pin, e);
            });
        });
    }

    // 1. Receive Angle
    // We accept the angle (0-180) passed from HardwareBridge/VirtualPWM
    update(angle) {
        this.targetAngle = angle;
    }

    // 2. Animation Step with RAIL CHECK
    step(deltaTime) {
        // -- VOLTAGE RAIL CHECK --
        // Verify VCC (High) and GND (Low) are connected
        const vcc = this.simulatorManager.railManager.getPinLevel(this.id, 'VCC');
        const gnd = this.simulatorManager.railManager.getPinLevel(this.id, 'GND');
        
        const isPowered = (vcc === 1 && gnd === 0);

        // If not powered, stop animation immediately
        if (!isPowered) return;

        if (Math.abs(this.currentAngle - this.targetAngle) < 0.5) {
            this.currentAngle = this.targetAngle;
            this.updateVisualState();
            return;
        }
        
        const step = this.rotationSpeed * deltaTime;
        if (this.currentAngle < this.targetAngle) {
            this.currentAngle = Math.min(this.targetAngle, this.currentAngle + step);
        } else {
            this.currentAngle = Math.max(this.targetAngle, this.currentAngle - step);
        }
        this.updateVisualState();
    }

    updateVisualState() {
        if (!this.hornElement) return;
        
        // Visual Offset Correction:
        // -90 degrees aligns SVG's right-facing horn to the visual "Up" or "Center"
        // Adjust based on your specific SVG artwork needs.
        const visualRotation = this.currentAngle - 90;

        this.hornElement.setAttribute('transform', 
            `translate(91.467, 59.773) rotate(${visualRotation}) translate(-91.467, -59.773)`
        );
    }

    // Used for exact angle setting from Block properties/Direct manipulation
    setAngle(deg) {
        this.targetAngle = Math.max(0, Math.min(180, deg));
        this.currentAngle = this.targetAngle; // Snap instantly for property updates
        this.updateVisualState();
    }

    static styleInjected = false;
    static injectStyles() {
        if (ServoModel.styleInjected) return;
        const styleId = 'sim-servo-styles';
        const css = `
            .sim-component-body[data-type="servo_motor"] {
                width: 260px; height: 460px;
                position: relative; cursor: grab;
                overflow: visible !important;
            }
            .sim-servo-svg {
                width: 100%; height: 100%;
                filter: drop-shadow(0 15px 25px rgba(0,0,0,0.25));
            }
        `;
        const style = document.createElement('style');
        style.id = styleId; style.textContent = css;
        document.head.appendChild(style);
        ServoModel.styleInjected = true;
    }
}

class ContinuousServoModel extends VirtualComponent {
    constructor(id, simulatorManager, position, name, componentData) {
        super(id, 'servo_continuous', simulatorManager, position, name, componentData);
        
        this.currentAngle = 0;
        this.speed = 0;
        this.MAX_RPM = 60; // Standard FS90R speed (approx 130RPM at 6V, simplified here)

        this.hornType = componentData.hornType || 'single';
        this.hornElement = null;
        
        ServoModel.injectStyles();
    }
    
    reset() {
        this.speed = 0;
        this.updateVisualState(); 
    }

    getHornPath(type) {
        switch(type) {
            case 'cross': return 'm119.54 50.354h-18.653v-18.653a8.4427 8.4427 0 0 0-8.4427-8.4427h-1.9537a8.4427 8.4427 0 0 0-8.4427 8.4427v18.653h-18.653a8.4427 8.4427 0 0 0-8.4427 8.4427v1.9537a8.4427 8.4427 0 0 0 8.4427 8.4427h18.653v18.653a8.4427 8.4427 0 0 0 8.4427 8.4427h1.9537a8.4427 8.4427 0 0 0 8.4427-8.4427v-18.653h18.653a8.4427 8.4427 0 0 0 8.4426-8.4427v-1.9537a8.4427 8.4427 0 0 0-8.4426-8.4427z';
            case 'double': return 'm101.63 57.808c-0.0768-0.48377-0.16978-0.8838-0.23258-1.1629l-4.112-51.454c0-2.8654-2.6026-5.1912-5.8145-5.1912s-5.8145 2.3258-5.8145 5.1912l-4.1004 51.447c-0.07443 0.28607-0.16746 0.69774-0.24421 1.1629a12.473 12.473 0 0 0 0 3.9306c0.07675 0.48377 0.16978 0.8838 0.24421 1.1629l4.1004 51.461c0 2.8654 2.6026 5.1912 5.8145 5.1912s5.8145-2.3258 5.8145-5.1912l4.1004-51.447c0.0744-0.28607 0.16746-0.69774 0.23258-1.1629a12.473 12.473 0 0 0 0.0116-3.9376zm-4.2376 7.8868a8.3426 8.3426 0 0 1-3.5375 2.1072c-0.25816 0.07443-0.52098 0.13955-0.7838 0.19072a8.7217 8.7217 0 0 1-1.1978 0.1442c-0.26747 0.01163-0.53726 0.01163-0.80473 0a8.7217 8.7217 0 0 1-1.1978-0.1442c-0.26282-0.05117-0.52563-0.11629-0.78379-0.19072a8.3729 8.3729 0 0 1 0-16.048c0.25816-0.07675 0.52098-0.13955 0.78379-0.19072a8.7217 8.7217 0 0 1 1.1978-0.1442c0.26747-0.01163 0.53726-0.01163 0.80473 0a8.7217 8.7217 0 0 1 1.1978-0.1442c0.26282 0.05117 0.52563 0.11396 0.7838 0.19072a8.3729 8.3729 0 0 1 3.5375 13.955zm-5.9215-54.996a2.791 2.791 0 1 1-2.791 2.791 2.791 2.791 0 0 1 2.791-2.791zm0 8.6055a2.791 2.791 0 1 1-2.791 2.791 2.791 2.791 0 0 1 2.791-2.791zm0 8.3729a2.791 2.791 0 1 1-2.791 2.791 2.791 2.791 0 0 1 2.791-2.791zm0 8.6055a2.791 2.791 0 1 1-2.791 2.791 2.791 2.791 0 0 1-2.791 2.791zm0 72.565a2.791 2.791 0 1 1 2.791-2.791 2.791 2.791 0 0 1-2.791 2.791zm0-8.6055a2.791 2.791 0 1 1 2.791-2.791 2.791 2.791 0 0 1-2.791 2.791zm0-8.3729a2.791 2.791 0 1 1 2.791-2.791 2.791 2.791 0 0 1-2.791 2.791zm0-8.6055a2.791 2.791 0 1 1 2.791-2.791 2.791 2.791 0 0 1-2.791 2.791z';
            case 'single': default: return 'm101.6 59.589-4.3167-54.166c0-2.8654-2.6026-5.1912-5.8145-5.1912s-5.8145 2.3258-5.8145 5.1912l-4.3167 54.166a8.3264 8.3264 0 0 0-0.10234 1.2792c0 5.047 4.5818 9.1381 10.234 9.1381s10.234-4.0911 10.234-9.1381a8.3264 8.3264 0 0 0-0.10233-1.2792zm-10.131-48.658a2.791 2.791 0 1 1-2.791 2.791 2.791 2.791 0 0 1 2.791-2.791zm0 8.6055a2.791 2.791 0 1 1-2.791 2.791 2.791 2.791 0 0 1 2.791-2.791zm0 8.3729a2.791 2.791 0 1 1-2.791 2.791 2.791 2.791 0 0 1 2.791-2.791zm0 8.6055a2.791 2.791 0 1 1-2.791 2.791 2.791 2.791 0 0 1 2.791-2.791zm5.9215 29.412a8.3729 8.3729 0 1 1 0-11.843 8.3729 8.3729 0 0 1 0 11.843z';
        }
    }

    render(container) {
        this.element = document.createElement('div');
        this.element.className = 'sim-component';
        this.element.id = this.id;
        this.element.style.left = `${this.position.x}px`;
        this.element.style.top = `${this.position.y}px`;
        const body = document.createElement('div');
        body.className = 'sim-component-body';
        body.dataset.type = 'servo_motor';
        body.innerHTML = `
            <svg viewBox="0 0 120 200" class="sim-servo-svg">
                <defs>
                    <style>
                        .servo-case { fill: #1b3765; stroke: #102a4e; stroke-width: 0.5; }
                        .servo-gear-base { fill: #A0AEC0; } .servo-gear-top { fill: #4A5568; }
                        .servo-horn { fill: #eceff1; stroke: #b0bec5; stroke-width: 1; }
                        .w-orange { stroke: #ffb74d; } .w-red { stroke: #e53935; } .w-brown { stroke: #5d4037; }
                        .wire-path { fill: none; stroke-width: 4.5; stroke-linecap: butt; }
                        .servo-text { fill: rgba(255,255,255,0.4); font-family: monospace; font-size: 10px; font-weight: bold; pointer-events: none; }
                    </style>
                </defs>
                <g transform="translate(120, -30) rotate(90)">
                    <path d="m163.92 66.867a7.09 7.09 0 1 1 5.8145-11.136 0.18 0.18 0 0 0 0.33-0.10234v-14.346h-17.664v36.98h17.676v-14.346a0.18 0.18 0 0 0-0.333-0.107 7.08 7.08 0 0 1-5.83 3.06z" style="fill:#2D3748" />
                    <path d="m55.068 66.75a7.09 7.09 0 1 0-5.8261-11.136 0.18 0.18 0 0 1-0.33-0.10234v-14.346h17.676v36.98h-17.676v-14.346a0.18 0.18 0 0 1 0.333-0.107 7.08 7.08 0 0 0 5.83 3.06z" style="fill:#2D3748" />
                    <rect class="servo-case" x="64.255" y="37.911" width="90.241" height="43.725" rx="5.3331" />

                    <text x="117" y="95" text-anchor="middle" class="servo-text" transform="rotate(270 110 65)">360°</text>
                    
                    <path d="m110.07 50.005h-14.42v19.537h14.42a9.7684 9.7684 0 0 0 0-19.537z" style="fill:#A0AEC0" />
                    <circle class="servo-gear-base" cx="91.467" cy="59.773" r="18.606" />
                    <circle cx="91.467" cy="59.773" r="8.3729" style="fill:#A0AEC0" />
                    <circle class="servo-gear-top" cx="91.467" cy="59.773" r="6.2494" />
                    <path d="m94.911 62.543-2.3839-2.4165a0.42562 0.42562 0 0 1 0-0.60471l2.4281-2.3863a0.64657 0.64657 0 0 0 0.06512-0.8652 0.62797 0.62797 0 0 0-0.93032-0.05117l-2.4351 2.4049a0.4326 0.4326 0 0 1-0.60703 0l-2.3863-2.4165a0.6489 0.6489 0 0 0-0.8652-0.06512 0.63262 0.63262 0 0 0 0.93032-0.04186 0.64657 0.64657 0 0 0-0.04419-0.8652z" style="fill:#4A5568" />
                    <path id="servo-horn-path" class="servo-horn" d="${this.getHornPath(this.hornType)}" />
                </g>
                <g id="wires">
                    <path d="M 54,125 L 48,147 L 48,162" class="wire-path w-orange" />
                    <path d="M 60,125 L 60,162" class="wire-path w-red" />
                    <path d="M 66,125 L 72,147 L 72,162" class="wire-path w-brown" />
                </g>
                <g transform="translate(22, 180)">
                    <rect x="18" y="-20" width="40" height="12" rx="2" style="fill:#111" />
                    <rect x="24" y="-17" width="4" height="6" rx="0.5" style="fill:#b0bec5" />
                    <rect x="36" y="-17" width="4" height="6" rx="0.5" style="fill:#b0bec5" />
                    <rect x="48" y="-17" width="4" height="6" rx="0.5" style="fill:#b0bec5" />
                </g>
            </svg>`;
        this.hornElement = body.querySelector('#servo-horn-path');
        this.element.appendChild(body);
        container.appendChild(this.element);
        this.renderPins(body);
        this.simulatorManager.makeDraggable(body, this);
        return this.element;
    }

    renderPins(container) {
        container.querySelectorAll('.sim-pin-hotspot').forEach(p => p.remove());
        const pins = this.componentData.pins || [];
        pins.forEach(p => {
            const pin = document.createElement('div');
            pin.className = 'sim-pin-hotspot component-pin';
            pin.dataset.componentId = this.id;
            pin.dataset.pinId = p.id;
            pin.title = p.name || p.id;
            pin.style.left = `${p.pos.x}px`;
            pin.style.top = `${p.pos.y}px`;
            pin.style.transform = 'translate(-50%, -50%)';
            pin.style.width = '14px'; 
            pin.style.height = '14px';
            container.appendChild(pin);
            pin.addEventListener('click', (e) => {
                e.stopPropagation();
                this.simulatorManager.handlePinClick(pin, e);
            });
        });
    }

    update(angle) {
        // Continuous Servo Logic:
        // Angle < 90 = Rotate one way
        // Angle > 90 = Rotate other way
        // Angle == 90 = Stop
        // We normalize this to a speed factor (-1.0 to 1.0)
        this.speed = (angle - 90) / 90.0;
        
        // Deadband zone to ensure 90 acts as a clean stop
        if (Math.abs(this.speed) < 0.05) {
            this.speed = 0;
        }
    }

    step(deltaTime) {
        // --- POWER CHECK ---
        const vcc = this.simulatorManager.railManager.getPinLevel(this.id, 'VCC');
        const gnd = this.simulatorManager.railManager.getPinLevel(this.id, 'GND');
        const isPowered = (vcc === 1 && gnd === 0);

        if (!isPowered || this.speed === 0) return;

        const degPerSec = this.speed * this.MAX_RPM * 6; // 360 / 60 = 6 deg per RPM/sec
        this.currentAngle = (this.currentAngle + degPerSec * deltaTime) % 360;
        this.updateVisualState();
    }

    updateVisualState() {
        if (!this.hornElement) return;
        this.hornElement.setAttribute('transform', 
            `translate(91.467, 59.773) rotate(${this.currentAngle}) translate(-91.467, -59.773)`
        );
    }
}



export class SimulatorManager {
    constructor(ideInstance) { 
        this.ide = ideInstance;
        this.canvas = document.getElementById('simulator-canvas-container');
        this.isReady = false;
        this.components = new Map();
        this.nextIdCounter = 1;
        this.board = null;
        this.boardElement = null;
        this.allComponentsData = componentsData.components;
        this.selectedComponentId = null;
        this.selectedWireId = null; 
        this.selectedBendPoint = { wireId: null, pointIndex: null }; 
        this.isDraggingBendPoint = false;
        this.toolbar = document.getElementById('sim-component-toolbar');
        this.propsBar = document.getElementById('sim-component-props-bar');

        this.componentCounters = {};

        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.isPanning = false;

        this.targetZoom = 1;
        this.targetPanX = 0;
        this.targetPanY = 0;
        this.animationFrameId = null;
        this.lastTimestamp = 0;

        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.contentWrapper = null; 

        this.nextWireId = 1;
        this.wires = []; 
        this.wiringState = 'idle'; 
        this.currentWire = null; 
        this.wireSvgLayer = null;
        this.ghostWire = null;
        this.activeWireColor = '#2D3748';

        // --- History State ---
        this.historyStack = [];
        this.redoStack = [];
        this.MAX_HISTORY = 50;

        this.boardPinStates = {}; 
        this.railManager = new VoltageRailManager(this);
        this.electronPaths = new Map(); 

    }

    init() {
        if (this.isReady) return;

        this.injectGlobalInteractionStyles(); 
        this.injectBoardLedStyles();

        this.wireSvgLayer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

        this.injectCommonStyles();
        
        this.wireSvgLayer.classList.add('sim-wire-layer');
        this.canvas.appendChild(this.wireSvgLayer);

        this.contentWrapper = document.createElement('div');
        this.contentWrapper.className = 'sim-content-wrapper';
        this.canvas.appendChild(this.contentWrapper);

        this.ghostWire = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this.ghostWire.setAttribute('class', 'sim-ghost-wire');
        this.wireSvgLayer.appendChild(this.ghostWire);

        
        this.canvas.addEventListener('mousemove', this.handleMainMouseMove.bind(this));
        this.canvas.addEventListener('wheel', this.handleZoom.bind(this), { passive: false });
        this.canvas.addEventListener('mousedown', this.handleCanvasClick.bind(this));
        this.canvas.addEventListener('mousedown', this.handlePanStart.bind(this));
        
        this.canvas.addEventListener('mouseup', this.handleDragEnd.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleDragEnd.bind(this));
        
        this.initToolbarListeners();
        this.initWireToolbarListeners();
        this.initKeyboardShortcuts();

        setTimeout(() => {
            this.makeUiElementDraggable("ai-camera-wrapper", "ai-cam-drag-handle");
        }, 100);

        this.animationLoop();
        this.isReady = true;
        //console.log("SimulatorManager is now ready.");
    }
    
    loadBoard(boardId) {
        // 1. Find data
        const boardInfo = boardsData.boards.find(b => b.id === boardId);
        if (!boardInfo) {
            console.error(`Board "${boardId}" not found in JSON.`);
            return;
        }
        this.board = boardInfo;
        this.board.rotation = 0;
        this.board.scaleX = 1;

        // 2. Ensure wrapper exists
        if (!this.contentWrapper) this.init();
        
        // 3. Clear old board
        if (this.boardElement) this.boardElement.remove();

        // 4. Create Container
        this.boardElement = document.createElement('div');
        this.boardElement.className = 'sim-board-container';
        this.boardElement.id = 'sim-board';
        
        // 5. Create Image
        const imageElement = document.createElement('img');
        imageElement.className = 'sim-board-image';
        imageElement.alt = this.board.name;
        imageElement.draggable = false;

        // 6. WAIT for load before rendering pins
        imageElement.onload = () => {
            let targetWidth = 350; // Default size

            // Custom sizes per board
            if (this.board.id === 'esp32') targetWidth = 220; // ESP32 width
            if (this.board.id === 'pico')  targetWidth = 180; // Pico width is usually narrower

            const aspectRatio = imageElement.naturalHeight / imageElement.naturalWidth;
            
            this.boardElement.style.width = `${targetWidth}px`;
            this.boardElement.style.height = `${targetWidth * aspectRatio}px`;
            
            this.renderBoardPins();
            this.renderBoardLeds();
            this.fitToScreen();
        };
        
        // 7. Set Source
        this.boardElement.appendChild(imageElement);
        this.contentWrapper.appendChild(this.boardElement);
        
        // Use the exact path from JSON (ensure it matches your public folder)
        imageElement.src = this.board.image; 
    }

    renderBoardPins() {
        if (!this.board || !this.board.pins) return;
        const boardContainer = this.contentWrapper.querySelector('.sim-board-container');
        if (!boardContainer) return;

        // Clear old pins before rendering new ones
        boardContainer.querySelectorAll('.sim-pin-hotspot').forEach(p => p.remove());
        
        this.board.pins.forEach(pin => {
            const pinElement = document.createElement('div');
            pinElement.className = 'sim-pin-hotspot';
            pinElement.dataset.pinId = pin.id;
            pinElement.title = `${pin.name} (ID: ${pin.id})`;
            pinElement.style.left = `${pin.pos.x}%`;
            pinElement.style.top = `${pin.pos.y}%`;
            boardContainer.appendChild(pinElement);
            pinElement.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handlePinClick(pinElement, e);
            });
        });
    }

    addComponent(componentType, canvasPosition) {
        this.saveToHistory();
        if (!this.componentCounters[componentType]) {
            this.componentCounters[componentType] = 0;
        }
        this.componentCounters[componentType]++;
        
        const componentData = this.allComponentsData.find(c => c.id === componentType);
        if (!componentData) return;
        
        const componentName = `${componentData.name}${this.componentCounters[componentType]}`;
        const id = `${componentType}_${this.componentCounters[componentType]}`;

        if (this.components.has(id)) return;

        const compWidth = 80; // Approx
        const compHeight = 80;
        const worldX = (canvasPosition.x - this.panX) / this.zoom;
        const worldY = (canvasPosition.y - this.panY) / this.zoom;
        const finalPosition = { x: worldX - (compWidth / 2), y: worldY - (compHeight / 2) };
        
        let component;
        switch (componentType) {
        
            case 'battery_module':
                component = new BatteryModel(id, this, finalPosition, componentName, componentData);
                break;
            
            case 'pushbutton':
                component = new PushButtonModel(id, this, finalPosition, componentName, componentData);
                break;
            case 'slide_switch':
                component = new SlideSwitchModel(id, this, finalPosition, componentName, componentData);
                break;
            case 'potentiometer':
                component = new PotentiometerModel(id, this, finalPosition, componentName, componentData);
                break;
            case 'ultrasonic': 
                component = new UltrasonicModel(id, this, finalPosition, componentName, componentData);
                break;
            case 'ir_sensor':
                component = new IRSensorModel(id, this, finalPosition, componentName, componentData);
                break;
            case 'pir_sensor':
                component = new PIRSensorModel(id, this, finalPosition, componentName, componentData);
                break;
            case 'ldr':
                component = new LDRModel(id, this, finalPosition, componentName, componentData);
                break;
            case 'dht11':
                component = new DHT11Model(id, this, finalPosition, componentName, componentData);
                break;
            case 'soil_moisture':
                component = new SoilMoistureModel(id, this, finalPosition, componentName, componentData);
                break;
            case 'buzzer':
                component = new BuzzerModel(id, this, finalPosition, componentName, componentData);
                break;
            case 'led_red':
                component = new LEDModel(id, this, finalPosition, componentName, componentData);
                break;
            case 'led_rgb':
                component = new RGBLEDModel(id, this, finalPosition, componentName, componentData);
                break;
            case 'neopixel_strip':
                component = new NeoPixelModel(id, this, finalPosition, componentName, componentData);
                break;
            case 'neopixel_ring':
                component = new NeoPixelRingModel(id, this, finalPosition, componentName, componentData);
                break;
            
            case 'dc_motor':
                component = new DCMotorModel(id, this, finalPosition, componentName, componentData);
                break;
            case 'oled_i2c':
                component = new OLEDModel(id, this, finalPosition, componentName, componentData);
                break;
            case 'servo_motor':
                component = new ServoModel(id, this, finalPosition, componentName, componentData);
                break;
            case 'servo_continuous':
                component = new ContinuousServoModel(id, this, finalPosition, componentName, componentData);
                break;
            
            default:
                component = new VirtualComponent(id, componentType, this, finalPosition, componentName, componentData);
                break;
        }
        this.components.set(id, component);
        component.render(this.contentWrapper);
        
        component.updateTransform();
        
        this.selectComponent(id);
        this._requestSaveState();
    }

    reset() {
        this.boardPinStates = {}; 

        this.electronPaths.forEach(path => path.remove());
        this.electronPaths.clear();

        
        for (const component of this.components.values()) {
            if (typeof component.reset === 'function') {
                component.reset();
            } 
            else if (typeof component.update === 'function') {
                component.update(0);
            }
        }
        //console.log("All virtual components reset.");
        if (this.ide.isSimulationRunning) {
            this.propsBar.style.display = 'none';
            this.toolbar.style.display = 'none';
        } else {
            if (this.selectedComponentId) {
                this.selectComponent(this.selectedComponentId);
            }
        }
    }

    setPinValue(boardPinId, value) {
        // 1. Update Board State (for Rail Manager lookups)
        this.boardPinStates[boardPinId] = value;

        // 2. Push to Components (Direct Drive for PWM/Animation)
        for (const wire of this.wires) {
            const start = wire.startPin;
            const end = wire.endPin;
            if (!start || !end) continue;

            let componentId = null;
            let componentPinId = null;

            // Case A: Wire goes Board -> Component
            if (!start.componentId && end.componentId) {
                const wireStartId = parseInt(String(start.pinId).replace(/\D/g, ''), 10);
                if (wireStartId === parseInt(boardPinId)) {
                    componentId = end.componentId;
                    componentPinId = end.pinId;
                }
            } 
            // Case B: Wire goes Component -> Board (Unlikely for output, but possible)
            else if (start.componentId && !end.componentId) {
                const wireEndId = parseInt(String(end.pinId).replace(/\D/g, ''), 10);
                if (wireEndId === parseInt(boardPinId)) {
                    componentId = start.componentId;
                    componentPinId = start.pinId;
                }
            }

            // If we found a connected component, update it
            if (componentId) {
                const component = this.components.get(componentId);
                if (component && typeof component.update === 'function') {
                    // CRITICAL CHANGE: Pass componentPinId so RGB LED knows which channel to set
                    component.update(value, componentPinId); 
                }
            }
        }
    }

    getConnectionsForComponent(componentId) {
        const connections = {}; // e.g., { 'Trig': 13, 'Echo': 12 }
        
        for (const wire of this.wires) {
            let componentPin = null;
            let boardPinId = null;

            if (wire.startPin?.componentId === componentId) {
                componentPin = wire.startPin.pinId;
                boardPinId = wire.endPin?.pinId;
            } else if (wire.endPin?.componentId === componentId) {
                componentPin = wire.endPin.pinId;
                boardPinId = wire.startPin?.pinId;
            }

            if (componentPin && boardPinId) {
                // Parse the board pin to a number, handling non-numeric pins gracefully
                const boardPinNum = parseInt(String(boardPinId).replace(/\D/g, ''));
                if (!isNaN(boardPinNum)) {
                    connections[componentPin] = boardPinNum;
                }
            }
        }
        return connections;
    }

    setPinValue(pinId, value) {
        this.boardPinStates[pinId] = value;
        
    }

    getPinValue(boardPinId, pullMode = -1) {
        // 1. Check Board Power
        if (!this.railManager.checkBoardPower()) {
            // UNPOWERED STATE FIX:
            // Return 1 (High) so logic like `if val == 0` (Active Low) fails.
            // This prevents code from thinking a dead board is "Pressing" all buttons.
            return 1; 
        }

        // 2. Trace Logic
        const level = this.railManager.getPinLevel('sim-board', boardPinId);
        
        if (level === -1) {
            // Floating state logic
            if (pullMode === 2) return 1; // PULL_UP
            return 0;
        }
        
        return level;
    }

getComponentConnectedToPin(boardPinId, componentType) {
    for (const wire of this.wires) {
        if (wire.startPin?.componentId && !wire.endPin?.componentId) {
            if (parseInt(String(wire.endPin.pinId).replace(/\D/g, '')) === boardPinId) {
                const component = this.components.get(wire.startPin.componentId);
                if (component && component.type === componentType) return component;
            }
        } else if (!wire.startPin?.componentId && wire.endPin?.componentId) {
            if (parseInt(String(wire.startPin.pinId).replace(/\D/g, '')) === boardPinId) {
                const component = this.components.get(wire.endPin.componentId);
                if (component && component.type === componentType) return component;
            }
        }
    }
    return null;
}

injectGlobalInteractionStyles() {
        // Prevent duplicate injection
        if (document.getElementById('sim-global-interaction-styles')) return;

        const css = `
            /* =========================================
               1. GLOBAL COMPONENT BEHAVIOR
               ========================================= */
            
            /* Make container boxes transparent to mouse events */
            /* This prevents "dragging empty space" */
            .sim-component, 
            .sim-component-body {
                pointer-events: none !important;
            }

            /* =========================================
               2. VISUAL ELEMENTS (The "Solid" Parts)
               ========================================= */

            /* BITMAPS: Re-enable events on images (e.g. Boards) */
            .sim-component-body img {
                pointer-events: auto !important;
                cursor: grab;
            }

            /* SVGS: Root ignores events, Children capture them */
            .sim-component-body svg {
                pointer-events: none !important; 
                overflow: visible;
            }
            
            /* SVG SHAPES: Only capture clicks on drawn pixels (fill/stroke) */
            /* 'visiblePainted' ignores transparent fills and empty space */
            .sim-component-body svg * {
                pointer-events: visiblePainted;
                cursor: grab;
            }

            /* GROUPS: Don't capture events themselves, only their children */
            .sim-component-body svg g {
                pointer-events: none; 
            }

            /* ACTIVE DRAG STATE: Feedback */
            .sim-component-body:active img,
            .sim-component-body:active svg * {
                cursor: grabbing;
            }

            /* =========================================
               3. INTERACTIVE OVERRIDES (Buttons, Knobs)
               ========================================= */
            
            /* --- A. PINS (High Priority) --- */
            .sim-pin-hotspot {
                pointer-events: auto !important;
                cursor: crosshair !important;
            }

            /* --- B. ROTARY KNOBS --- */
            
            /* Main Potentiometer Hitbox */
            /* 'all' ensures it catches clicks even if fill-opacity is 0 */
            .pot-knob-hitbox {
                cursor: alias !important; /* Rotate Cursor */
                pointer-events: all !important; 
            }
            
            /* Sensor Trimpots (IR, Soil, LDR) */
            .ir-pot-group *, 
            .ldr-pot-group *, 
            .soil-pot-group * {
                cursor: alias !important;
                pointer-events: visibleFill !important;
            }

            /* --- C. BUTTONS & SWITCHES --- */
            /* Pushbutton Cap & Zone */
            .pb-click-zone, 
            .pb-btn-cap,
            /* Slide Switch Handle & Housing */
            .ss-click-target,
            .ss-click-target * {
                cursor: pointer !important;
                pointer-events: visiblePainted !important;
            }

            /* --- D. HTML CONTROLS (Sliders on DHT, LDR, Soil) --- */
            .ldr-slider-container input,
            .dht-vertical-slider,
            .soil-vertical-slider,
            .props-toggle-switch, 
            .props-toggle-thumb {
                cursor: pointer !important;
                pointer-events: auto !important;
            }

            /* --- E. MOVABLE SIMULATION OBJECTS (Ultrasonic/IR/PIR Balls) --- */
            .us-sim-object, 
            .ir-sim-object, 
            .pir-sim-object {
                cursor: move !important; /* Distinct cursor for objects */
                pointer-events: auto !important;
            }
            
            /* Active state for objects */
            .us-sim-object:active, 
            .ir-sim-object:active, 
            .pir-sim-object:active {
                cursor: grabbing !important;
            }
        `;

        const style = document.createElement('style');
        style.id = 'sim-global-interaction-styles';
        style.textContent = css;
        document.head.appendChild(style);
    }

    injectBoardLedStyles() {
        if (document.getElementById('sim-board-led-styles')) return;
        const style = document.createElement('style');
        style.id = 'sim-board-led-styles';
        style.textContent = `
            .sim-board-led {
                position: absolute;
                width: 8px;  /* SMD Size */
                height: 10px;  /* SMD Rectangular Shape */
                border-radius: 1px; /* Sharp corners */
                background-color: currentColor; /* Uses the inline color */
                
                /* OFF STATE: Dark and dull */
                opacity: 0.8; 
                filter: brightness(0.3) contrast(1.2);
                box-shadow: inset 0 0 2px rgba(0,0,0,0.5);
                
                pointer-events: none;
                z-index: 20; /* Above wires */
                transform: translate(-50%, -50%);
                transition: all 0.1s ease-out;
            }
            .sim-board-led.on {
                /* ON STATE: Super Bright Bloom */
                opacity: 1.0;
                filter: brightness(2.5);
                box-shadow: 
                    0 0 4px 1px currentColor, 
                    0 0 12px 4px currentColor, 
                    inset 0 0 2px rgba(255,255,255,0.5); /* White-hot center feel */
            }
        `;
        document.head.appendChild(style);
    }

    renderBoardLeds() {
        // Clear existing LEDs
        if (!this.boardElement) return;
        this.boardElement.querySelectorAll('.sim-board-led').forEach(el => el.remove());
        this.boardLeds = []; // Store references for animation loop

        if (!this.board.leds) return;

        this.board.leds.forEach(ledData => {
            const ledEl = document.createElement('div');
            ledEl.className = 'sim-board-led';
            
            // Set Color
            const color = ledData.color || '#ff0000';
            ledEl.style.backgroundColor = color;
            ledEl.style.color = color; // Used by currentColor in CSS box-shadow
            
            // Set Position
            ledEl.style.left = `${ledData.pos.x}%`;
            ledEl.style.top = `${ledData.pos.y}%`;

            // Determine LED Type & Pin
            let type = 'gpio';
            let pin = ledData.pin;

            // Heuristic: If ID is 'power' or 'pwr', treat as Power LED
            if (ledData.id === 'power' || ledData.id === 'pwr') {
                type = 'power';
            } 
            // Fallback: If JSON lacks 'pin' but is 'builtin', assign default based on board
            else if (ledData.id === 'builtin' && !pin) {
                if (this.board.id === 'esp32') pin = '2';
                if (this.board.id === 'pico') pin = '25';
            }

            this.boardElement.appendChild(ledEl);

            this.boardLeds.push({
                element: ledEl,
                type: type,
                pin: pin ? String(pin) : null
            });
        });
    }

    updateBoardLeds() {
        if (!this.boardLeds) return;
        if (!this.ide || !this.ide.isSimulationRunning) {
            this.boardLeds.forEach(led => led.element.classList.remove('on'));
            return;
        }
        
        const isPowered = this.railManager.checkBoardPower(); 

        this.boardLeds.forEach(led => {
            let isOn = false;

            if (isPowered) {
                if (led.type === 'power') {
                    isOn = true;
                } else if (led.type === 'gpio' && led.pin) {
                    const pinKey = String(led.pin);
                    const pinVal = this.boardPinStates[pinKey];
                    
                    if (pinVal !== undefined && pinVal > 0) {
                        isOn = true;
                    }
                }
            }

            if (isOn) {
                led.element.classList.add('on');
            } else {
                led.element.classList.remove('on');
            }
        });
    }


    // --- Viewport and Animation ---
    updateView() {
        if (!this.contentWrapper || !this.wireSvgLayer) return;
        this.contentWrapper.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`;

        const canvasWidth = this.canvas.offsetWidth;
        const canvasHeight = this.canvas.offsetHeight;
        if (canvasWidth === 0 || canvasHeight === 0) return;

        const viewboxX = -this.panX / this.zoom;
        const viewboxY = -this.panY / this.zoom;
        const viewboxWidth = canvasWidth / this.zoom;
        const viewboxHeight = canvasHeight / this.zoom;
    
        this.wireSvgLayer.setAttribute('viewBox', `${viewboxX} ${viewboxY} ${viewboxWidth} ${viewboxHeight}`);
    }

    updateWireVisuals() {
        if (this._wireUpdateFrame && this._wireUpdateFrame % 3 !== 0) {
            this._wireUpdateFrame++;
            return;
        }
        this._wireUpdateFrame = 1;

        const isSimRunning = this.ide.isSimulationRunning;

        this.wires.forEach(wire => {
            let isHigh = false;
            let isGrounded = false; // New flag

            if (isSimRunning) {
                const compId = wire.startPin.componentId || 'sim-board';
                const pinId = wire.startPin.pinId;
                const level = this.railManager.getPinLevel(compId, pinId);
                
                if (level > 0.1) isHigh = true;
                else if (level > -0.1 && level < 0.2) isGrounded = true;
            }

            // --- 1. Handle "High" Flow (Orange Fire) ---
            if (isHigh) {
                if (!this.electronPaths.has(wire.id)) {
                    const elPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    elPath.setAttribute('class', 'sim-electron-flow');
                    wire.pathElement.parentNode.appendChild(elPath);
                    this.electronPaths.set(wire.id, elPath);
                }
                const elPath = this.electronPaths.get(wire.id);
                const currentD = wire.pathElement.getAttribute('d');
                if (elPath.getAttribute('d') !== currentD) elPath.setAttribute('d', currentD);
            } else {
                if (this.electronPaths.has(wire.id)) {
                    this.electronPaths.get(wire.id).remove();
                    this.electronPaths.delete(wire.id);
                }
            }

            // --- 2. Handle "Ground" Color (Static Blue) ---
            if (isGrounded) {
                wire.pathElement.classList.add('is-grounded');
            } else {
                wire.pathElement.classList.remove('is-grounded');
            }
        });
    }

    animationLoop(timestamp) {
        if (!this.lastTimestamp) this.lastTimestamp = timestamp;
        const deltaTime = (timestamp - this.lastTimestamp) / 1000.0; 
        this.lastTimestamp = timestamp;

        const lerpFactor = 0.2;
        this.panX += (this.targetPanX - this.panX) * lerpFactor;
        this.panY += (this.targetPanY - this.panY) * lerpFactor;
        this.zoom += (this.targetZoom - this.zoom) * lerpFactor;
        this.components.forEach(component => {
            if (typeof component.step === 'function') {
                component.step(deltaTime);
            }
        });

        this.updateBoardLeds();

        this.updateWireVisuals();

        this.updateView();
        if (this.selectedWireId) {
            this.updateBendPointHandles();
        }

        this.animationFrameId = requestAnimationFrame(this.animationLoop.bind(this));
    }

    handleZoom(e) {
        e.preventDefault();
        const zoomFactor = 0.1;
        const oldZoom = this.targetZoom;

        if (e.deltaY < 0) {
            this.targetZoom = Math.min(3, this.targetZoom + zoomFactor);
        } else {
            this.targetZoom = Math.max(0.2, this.targetZoom - zoomFactor);
        }
    
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
    
        this.targetPanX = mouseX - (mouseX - this.targetPanX) * (this.targetZoom / oldZoom);
        this.targetPanY = mouseY - (mouseY - this.targetPanY) * (this.targetZoom / oldZoom);
    }

    toggleGrid() {
        const canvasContainer = document.getElementById('simulator-canvas-container');
        if (canvasContainer) {
            return canvasContainer.classList.toggle('show-grid');
        }
        return false;
    }

    // --- History Management ---

    saveToHistory() {
        const state = JSON.stringify(this.getCircuitState());
        if (this.historyStack.length > 0) {
            const lastState = this.historyStack[this.historyStack.length - 1];
            if (lastState === state) return;
        }

        this.historyStack.push(state);
        if (this.historyStack.length > this.MAX_HISTORY) {
            this.historyStack.shift();
        }
        this.redoStack = [];
    }

    undo() {
        if (this.historyStack.length === 0) return;
        const currentState = JSON.stringify(this.getCircuitState());
        this.redoStack.push(currentState);
        const prevStateJSON = this.historyStack.pop();
        try {
            const prevState = JSON.parse(prevStateJSON);
            this.loadCircuitState(prevState);
            this.selectComponent(null); 
        } catch (e) {
            console.error("Undo failed:", e);
        }
    }

    redo() {
        if (this.redoStack.length === 0) return;
        const currentState = JSON.stringify(this.getCircuitState());
        this.historyStack.push(currentState);
        const nextStateJSON = this.redoStack.pop();
        try {
            const nextState = JSON.parse(nextStateJSON);
            this.loadCircuitState(nextState);
            this.selectComponent(null);
        } catch (e) {
            console.error("Redo failed:", e);
        }
    }

    // --- Event Handling ---

    handlePanStart(e) {
        if (e.target.closest('.sim-component-toolbar') ||
            e.target.closest('.sim-component-props-bar') ||
            e.target.closest('.sim-wire-toolbar') ||
            e.target.closest('.sim-bend-point-handle') ||
            e.target.closest('#ai-camera-wrapper') || 
            e.target.tagName === 'INPUT' ||
            e.target.tagName === 'SELECT' ||
            e.target.tagName === 'BUTTON' || 
            e.target.tagName === 'LABEL') {
            return;
        }

        const isInteractiveObject = e.target.closest('.sim-component-body') || 
                                    e.target.closest('.sim-pin-hotspot') || 
                                    e.target.closest('.sim-wire') ||
                                    e.target.closest('.sim-board-container');

        const isValidPanStart = (e.button === 1) || 
                                (e.button === 0 && e.shiftKey) || 
                                (e.button === 0 && !isInteractiveObject);

        if (!isValidPanStart) return;

        e.preventDefault();
        
        this.isPanning = true;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
        this.canvas.style.cursor = 'grabbing';
    }

    handleMainMouseMove(e) {
        if (this.isPanning) {
            this.handlePanMove(e);
        } else if (this.isDraggingBendPoint) {
            this.handleBendPointMove(e);
        } else {
            this.updateGhostWire(e);
        }
    }

    handlePanMove(e) {
        if (!this.isPanning) return;
        e.preventDefault();
        const dx = e.clientX - this.lastMouseX;
        const dy = e.clientY - this.lastMouseY;
    
        this.targetPanX += dx;
        this.targetPanY += dy;

        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
    }

    handleBendPointMove(e) {
        if (!this.isDraggingBendPoint) return;
        e.preventDefault();
        const { wireId, pointIndex } = this.selectedBendPoint;
        const wire = this.wires.find(w => w.id === wireId);
        if (!wire) return;

        const canvasRect = this.canvas.getBoundingClientRect();
        const worldX = (e.clientX - canvasRect.left - this.panX) / this.zoom;
        const worldY = (e.clientY - canvasRect.top - this.panY) / this.zoom;

        wire.points[pointIndex] = { worldX, worldY };
        
        wire.pathElement.setAttribute('d', this.buildWirePath(wire.points));
    }

    handleDragEnd(e) {
        if (this.isPanning) {
            this.isPanning = false;
            this.canvas.style.cursor = 'default';
        }
        if (this.isDraggingBendPoint) {
            this.isDraggingBendPoint = false;
            this.selectedBendPoint = { wireId: null, pointIndex: null };
            this._requestSaveState();
        }
    }
    
    fitToScreen() {
        if (!this.board || !this.boardElement || !this.contentWrapper) return;
        const canvasRect = this.canvas.getBoundingClientRect();
        if (canvasRect.width === 0 || canvasRect.height === 0) return;
        
        const boardWidth = this.boardElement.offsetWidth;
        const boardHeight = this.boardElement.offsetHeight;

        if (boardWidth === 0 || boardHeight === 0) {
             console.warn("FitToScreen called before board was sized. Aborting.");
             return;
        }

        let minX = -boardWidth / 2;
        let minY = -boardHeight / 2;
        let maxX = boardWidth / 2;
        let maxY = boardHeight / 2;
        
        this.components.forEach(comp => {
            const body = comp.element.querySelector('.sim-component-body');
            if (!body) return;
            const compWidth = body.offsetWidth;
            const compHeight = body.offsetHeight;
            minX = Math.min(minX, comp.position.x);
            minY = Math.min(minY, comp.position.y);
            maxX = Math.max(maxX, comp.position.x + compWidth);
            maxY = Math.max(maxY, comp.position.y + compHeight);
        });

        const contentWidth = maxX - minX;
        const contentHeight = maxY - minY;

        if (contentWidth <= 0 || contentHeight <= 0) return;
        
        const padding = 80;
        const scaleX = (canvasRect.width - padding) / contentWidth;
        const scaleY = (canvasRect.height - padding) / contentHeight;
        const newZoom = Math.min(scaleX, scaleY, 2.5);

        const contentCenterX = minX + contentWidth / 2;
        const contentCenterY = minY + contentHeight / 2;
        
        const newPanX = (canvasRect.width / 2) - (contentCenterX * newZoom);
        const newPanY = (canvasRect.height / 2) - (contentCenterY * newZoom);
        
        this.targetZoom = newZoom;
        this.targetPanX = newPanX;
        this.targetPanY = newPanY;
    }


    // --- Toolbar and Selection ---
    handleCanvasClick(e) {
        if (!e.target.closest('.sim-component-body, .sim-pin-hotspot, .sim-board-container, .sim-component-toolbar, .sim-component-props-bar, .sim-wire-toolbar')) {
            this.selectComponent(null);
            this.deselectWire();
        }
        
        if (this.wiringState === 'wiring' && e.button === 0) {
            if (!e.target.closest('.sim-pin-hotspot')) {
                this.addIntermediatePoint(e);
            }
        }
    }
    
    selectComponent(itemId) {
        this.deselectWire();
        
        // 1. Handle Deselection of previous component
        if (this.selectedComponentId) {
            if (this.selectedComponentId === 'sim-board') {
                this.boardElement?.classList.remove('selected');
            } else {
                const oldSelected = this.components.get(this.selectedComponentId);
                if (oldSelected) {
                    oldSelected.element.querySelector('.sim-component-body').classList.remove('selected');
                    // Update visual state to ensure any control overlays (like sliders) update
                    if (typeof oldSelected.updateVisualState === 'function') {
                        oldSelected.updateVisualState();
                    }
                }
            }
        }
        
        this.selectedComponentId = itemId;

        // 2. ALWAYS Hide UI elements initially (Safe Default)
        this.propsBar.innerHTML = '';
        this.propsBar.style.display = 'none';
        this.toolbar.style.display = 'none';

        // If nothing selected, stop here
        if (!itemId) return;

        // 3. Highlight the selected item (Visual Feedback only)
        let component = null;
        if (itemId === 'sim-board') {
            this.boardElement?.classList.add('selected');
        } else {
            component = this.components.get(itemId);
            if (component) {
                component.element.querySelector('.sim-component-body').classList.add('selected');
            }
        }

        // 4. CHECK SIMULATION STATE
        if (this.ide.isSimulationRunning) {
            return;
        }

        // 5. Show Editing Tools (Only if simulation is STOPPED)
        this.toolbar.style.display = 'flex';
        
        const nameInput = document.getElementById('sim-comp-name');
        const rotateLeftBtn = document.getElementById('sim-comp-rotate-left');
        const rotateRightBtn = document.getElementById('sim-comp-rotate-right');
        const flipBtn = document.getElementById('sim-comp-flip-h');

        // Ensure sub-elements are visible
        nameInput.style.display = 'block';
        rotateLeftBtn.style.display = 'block';
        rotateRightBtn.style.display = 'block';
        flipBtn.style.display = 'block';

        if (itemId === 'sim-board') {
            nameInput.value = this.board.name;
            nameInput.disabled = true;
        } else if (component) {
            nameInput.value = component.name;
            nameInput.disabled = false;
            
            // 6. Render Specific Properties (Voltage, Color, etc.)
            this.renderComponentProperties(component);
        }
    }

    injectCommonStyles() {
        if (document.getElementById('sim-common-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'sim-common-styles';
        style.textContent = `
            /* --- Properties Panel Toggle Switch --- */
            .props-toggle-switch {
                width: 40px; height: 20px; 
                background: #ccc;
                border-radius: 10px; 
                position: relative; 
                cursor: pointer;
                transition: background 0.3s ease;
                display: inline-block;
                vertical-align: middle;
            }
            .props-toggle-switch.on { 
                background: #3498db; 
            }
            .props-toggle-thumb {
                width: 16px; height: 16px; 
                background: white;
                border-radius: 50%; 
                position: absolute; 
                top: 2px; left: 2px;
                transition: transform 0.3s ease; 
                box-shadow: 0 1px 3px rgba(0,0,0,0.3);
            }
            .props-toggle-switch.on .props-toggle-thumb { 
                transform: translateX(20px); 
            }
            
            /* --- Common Property Labels --- */
            .prop-label { 
                font-family: 'Segoe UI', sans-serif;
                font-size: 12px; 
                font-weight: 600; 
                color: #555; 
                margin: 0 5px;
                vertical-align: middle;
            }
            
            /* --- Property Groups --- */
            .prop-group {
                display: flex;
                align-items: center;
                gap: 5px;
                margin-right: 10px;
            }
        `;
        document.head.appendChild(style);
    }

renderComponentProperties(component) {
    this.propsBar.innerHTML = ''; 
    this.propsBar.style.display = 'none'; // Hide by default

    if (component.type === 'battery_module') {
    this.propsBar.style.display = 'flex';
    this.propsBar.innerHTML = `
        <label style="font-size:12px;">Voltage:</label>
        <input type="number" id="batt-volt" value="${component.voltage}" step="0.1" style="width:50px;">
        <span style="font-size:12px; margin-right:10px;">V</span>
        
        <label style="font-size:12px;">Current:</label>
        <input type="number" id="batt-amp" value="${component.currentLimit}" step="0.1" style="width:50px;">
        <span style="font-size:12px;">A</span>
    `;

    const vInput = this.propsBar.querySelector('#batt-volt');
    vInput.addEventListener('focus', () => this.saveToHistory());
    vInput.addEventListener('change', (e) => {
        component.setVoltage(e.target.value);
        this._requestSaveState();
    });
    
    const cInput = this.propsBar.querySelector('#batt-amp');
    cInput.addEventListener('change', (e) => {
        component.currentLimit = parseFloat(e.target.value);
        this._requestSaveState();
    });
}
    else if (component.type === 'potentiometer') {
        this.propsBar.style.display = 'flex';
        this.propsBar.innerHTML = `
            <label title="Knob Color">Color:</label>
            <input type="color" id="pot-color" value="${component.knobColor}" style="width:30px; height:25px; border:none; padding:0; cursor:pointer; margin-right:10px;">
            <label title="Max Resistance">Res:</label>
            <input type="number" id="pot-res-val" value="${component.resistance}" min="1" style="width:45px; padding:2px; border:1px solid #ccc; border-radius:4px;">
            <select id="pot-res-unit" style="padding:2px; border:1px solid #ccc; border-radius:4px;">
                <option value="Ω">Ω</option>
                <option value="kΩ">kΩ</option>
                <option value="MΩ">MΩ</option>
            </select>
        `;

        const colorInput = this.propsBar.querySelector('#pot-color');
        const valInput = this.propsBar.querySelector('#pot-res-val');
        const unitSelect = this.propsBar.querySelector('#pot-res-unit');
        
        unitSelect.value = component.unit;

        colorInput.addEventListener('input', (e) => {
            component.setKnobColor(e.target.value);
            this._requestSaveState();
        });
        valInput.addEventListener('change', (e) => {
            component.resistance = parseFloat(e.target.value) || 10;
            this._requestSaveState();
        });
        unitSelect.addEventListener('change', (e) => {
            component.unit = e.target.value;
            this._requestSaveState();
        });
    }
    
    else if (component.type === 'ir_sensor') {
            this.propsBar.style.display = 'flex';
            const isAnalog = component.outputMode === 'analog';
            
            this.propsBar.innerHTML = `
                <div class="prop-group">
                    <span class="prop-label">Output:</span>
                    <span class="prop-label" style="font-weight:400; font-size:11px;">Digital</span>
                    <div id="ir-mode-toggle" class="props-toggle-switch ${isAnalog ? 'on' : ''}">
                        <div class="props-toggle-thumb"></div>
                    </div>
                    <span class="prop-label" style="font-weight:400; font-size:11px;">Analog</span>
                </div>
            `;

            const modeToggle = this.propsBar.querySelector('#ir-mode-toggle');
            modeToggle.addEventListener('click', (e) => {
                const toggle = e.currentTarget;
                const wasOn = toggle.classList.contains('on');
                toggle.classList.toggle('on', !wasOn);
                component.outputMode = !wasOn ? 'analog' : 'digital';
                component.updateVisualState();
                this._requestSaveState();
            });
        }

        // --- LDR SENSOR ---
        else if (component.type === 'ldr') {
            this.propsBar.style.display = 'flex';
            const isAnalog = component.outputMode === 'analog';

            this.propsBar.innerHTML = `
                <div class="prop-group">
                    <span class="prop-label">Output:</span>
                    <span class="prop-label" style="font-weight:400; font-size:11px;">Digital</span>
                    <div id="ldr-mode-toggle" class="props-toggle-switch ${isAnalog ? 'on' : ''}">
                        <div class="props-toggle-thumb"></div>
                    </div>
                    <span class="prop-label" style="font-weight:400; font-size:11px;">Analog</span>
                </div>
            `;

            const modeToggle = this.propsBar.querySelector('#ldr-mode-toggle');
            modeToggle.addEventListener('click', (e) => {
                const toggle = e.currentTarget;
                const wasOn = toggle.classList.contains('on');
                toggle.classList.toggle('on', !wasOn);
                component.outputMode = !wasOn ? 'analog' : 'digital';
                component.updateVisualState();
                this._requestSaveState();
            });
        }

else if (component.type === 'pir_sensor') {
    this.propsBar.style.display = 'flex';
    
    this.propsBar.innerHTML = `
        <div class="prop-group">
            <label for="pir-sensitivity" style="font-size:11px;">Sens.</label>
            <input type="range" id="pir-sensitivity" min="0.1" max="1" step="0.1" value="${component.sensitivity}" style="width:60px;">
        </div>
        <div class="prop-group">
            <label for="pir-delay" style="font-size:11px;">Time(s)</label>
            <input type="number" id="pir-delay" min="1" step="1" value="${component.timeDelay / 1000}" style="width:40px;">
        </div>
        <div class="prop-group">
            <label for="pir-trigger" style="font-size:11px;">Trig</label>
            <select id="pir-trigger" style="width:60px;">
                <option value="H">Repeat</option>
                <option value="L">Single</option>
            </select>
        </div>
    `;

    this.propsBar.querySelector('#pir-trigger').value = component.triggerMode;
    
    this.propsBar.querySelector('#pir-sensitivity').addEventListener('input', (e) => {
        component.sensitivity = parseFloat(e.target.value);
        this._requestSaveState();
    });

    this.propsBar.querySelector('#pir-delay').addEventListener('change', (e) => {
        component.timeDelay = Math.max(1000, parseFloat(e.target.value) * 1000);
        this._requestSaveState();
    });

    this.propsBar.querySelector('#pir-trigger').addEventListener('change', (e) => {
        component.triggerMode = e.target.value;
        this._requestSaveState();
    });
}

    // --- 4. Pushbutton ---
    else if (component.type === 'pushbutton') {
        this.propsBar.style.display = 'flex';
        this.propsBar.innerHTML = `
            <label for="btn-color">Cap Color:</label>
            <input type="color" id="btn-color" value="${component.capColor}" style="width:50px; height:30px; border:none; padding:0; cursor:pointer;">
        `;
        const colorInput = this.propsBar.querySelector('#btn-color');
        colorInput.addEventListener('input', (e) => {
            component.setCapColor(e.target.value);
            this._requestSaveState();
        });
    }
    
    // --- 5. Slide Switch ---
    else if (component.type === 'slide_switch') {
        this.propsBar.style.display = 'flex';
        this.propsBar.innerHTML = `
            <label for="ss-color">Handle Color:</label>
            <input type="color" id="ss-color" value="${component.handleColor}" style="width:50px; height:30px; border:none; padding:0; cursor:pointer;">
        `;
        const colorInput = this.propsBar.querySelector('#ss-color');
        colorInput.addEventListener('input', (e) => {
            component.setHandleColor(e.target.value);
            this._requestSaveState();
        });
    }

    else if (component.type === 'led_red') { // Matches ID in JSON
    this.propsBar.style.display = 'flex';
    this.propsBar.innerHTML = `
        <label for="led-color-picker" style="font-size:12px;">Color:</label>
        <input type="color" id="led-color-picker" value="${component.ledColor}" style="width:40px; height:25px; border:none; padding:0; cursor:pointer;">
    `;

    const picker = this.propsBar.querySelector('#led-color-picker');
    picker.addEventListener('input', (e) => {
        component.updateColor(e.target.value);
        this._requestSaveState();
    });
}
    
else if (component.type === 'neopixel_strip') {
    this.propsBar.style.display = 'flex';
    
    this.propsBar.innerHTML = `
        <label for="neo-count" style="font-size:12px;">Pixels:</label>
        <input type="number" id="neo-count" value="${component.numPixels}" min="1" max="60" style="width:50px; padding:2px; border:1px solid #ccc; border-radius:4px;">
    `;

    const countInput = this.propsBar.querySelector('#neo-count');
    countInput.addEventListener('change', (e) => {
        component.setPixelCount(e.target.value);
        this._requestSaveState();
    });
}else if (component.type === 'neopixel_ring') {
    this.propsBar.style.display = 'flex';
    this.propsBar.innerHTML = `
        <label for="ring-count" style="font-size:12px;">Pixels:</label>
        <select id="ring-count" style="padding:2px; border:1px solid #ccc; border-radius:4px;">
            <option value="4">4</option>
            <option value="8">8</option>
            <option value="12">12</option>
            <option value="16">16</option>
            <option value="24">24</option>
        </select>
    `;

    const select = this.propsBar.querySelector('#ring-count');
    select.value = component.numPixels;
    select.addEventListener('change', (e) => {
        component.setPixelCount(e.target.value);
        this._requestSaveState();
    });
}else if (component.type === 'oled_i2c') {
    this.propsBar.style.display = 'flex';
    
    const is3D = component.i2cAddress === "0x3D";
    
    this.propsBar.innerHTML = `
        <span class="prop-label" style="font-size:12px; font-weight:bold; color:#555; margin-right:8px;">I2C Address:</span>
        <span class="prop-label" style="font-size:11px; color:#777;">0x3C</span>
        <div id="addr-toggle" class="props-toggle-switch ${is3D ? 'on' : ''}" style="margin:0 5px;">
            <div class="props-toggle-thumb"></div>
        </div>
        <span class="prop-label" style="font-size:11px; color:#777;">0x3D</span>
    `;

    const toggle = this.propsBar.querySelector('#addr-toggle');
    toggle.addEventListener('click', (e) => {
        const t = e.currentTarget;
        const wasOn = t.classList.contains('on');
        t.classList.toggle('on', !wasOn);
        component.i2cAddress = !wasOn ? "0x3D" : "0x3C";
        this._requestSaveState();
    });
}
    
else if (component.type === 'servo_motor' || component.type === 'servo_continuous') {
    this.propsBar.style.display = 'flex';
    this.propsBar.innerHTML = `
        <label for="servo-horn-type">Horn Type:</label>
        <select id="servo-horn-type">
            <option value="single">Single Arm</option>
            <option value="double">Double Arm</option>
            <option value="cross">Cross (+)</option>
        </select>
    `;

    const hornSelect = this.propsBar.querySelector('#servo-horn-type');
    hornSelect.value = component.hornType;

    hornSelect.addEventListener('change', (e) => {
        component.hornType = e.target.value;
        if (component.hornElement) {
            component.hornElement.setAttribute('d', component.getHornPath(component.hornType));
        }
        this._requestSaveState();
    });
}
    
    
}

    
    initToolbarListeners() {
        document.getElementById('sim-comp-delete').addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.selectedComponentId && this.selectedComponentId !== 'sim-board') {
                this.saveToHistory();
                const componentToDelete = this.components.get(this.selectedComponentId);
                if (componentToDelete) {
                    componentToDelete.remove();
                    this.components.delete(this.selectedComponentId);
                    this.selectComponent(null);
                    this._requestSaveState();
                    const type = componentToDelete.type;
                    const currentCount = this.componentCounters[type] || 0;
                    const idNum = parseInt(componentToDelete.id.split('_').pop(), 10);
                    if (idNum === currentCount) {
                        this.componentCounters[type]--;
                    }
                }
            } else if (this.selectedWireId) {
                this.deleteSelectedWire();
                this.selectComponent(null);
            }
        });
        document.getElementById('sim-comp-name').addEventListener('click', (e) => e.stopPropagation());
        document.getElementById('sim-comp-name').addEventListener('change', (e) => {
            if (this.selectedComponentId) {
                const component = this.components.get(this.selectedComponentId);
                if (component) component.name = e.target.value;
            }

        });
        

        document.getElementById('sim-comp-rotate-right').addEventListener('click', (e) => {
            e.stopPropagation();
            if (!this.selectedComponentId) return;
            if (this.selectedComponentId === 'sim-board') {
                this.board.rotation += 90; // Accumulate angle
                this.updateBoardTransform();
            } else {
                const component = this.components.get(this.selectedComponentId);
                if (component) {
                    component.rotation += 90; // Accumulate angle
                    component.updateTransform();
                    this.updateConnectedWires(component.id);
                    this._requestSaveState(); 
                }
            }
        });

        document.getElementById('sim-comp-rotate-left').addEventListener('click', (e) => {
            e.stopPropagation();
            if (!this.selectedComponentId) return;
            if (this.selectedComponentId === 'sim-board') {
                this.board.rotation -= 90; // Allow negative angles
                this.updateBoardTransform();
            } else {
                const component = this.components.get(this.selectedComponentId);
                if (component) {
                    component.rotation -= 90; // Allow negative angles
                    component.updateTransform();
                    this.updateConnectedWires(component.id);
                    this._requestSaveState();
                }
            }
        });

        document.getElementById('sim-comp-flip-h').addEventListener('click', (e) => {
            e.stopPropagation();
            if (!this.selectedComponentId) return;
            if (this.selectedComponentId === 'sim-board') {
                this.board.scaleX *= -1;
                this.updateBoardTransform();
            } else {
                const component = this.components.get(this.selectedComponentId);
                if (component) {
                    component.scaleX *= -1;
                    component.updateTransform();
                    this.updateConnectedWires(component.id);
                    this._requestSaveState();
                }
            }
        });
    }

    updateBoardTransform() {
        if (!this.boardElement) return;
        const rotation = this.board.rotation || 0;
        const scaleX = this.board.scaleX || 1;
        this.boardElement.style.transform = `translate(-50%, -50%) rotate(${rotation}deg) scaleX(${scaleX})`;
    }

    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
                return; 
            }

            if (e.key === 'Escape') {
                e.preventDefault();
                
                if (this.wiringState === 'wiring') {
                    if (this.currentWire && this.currentWire.pathElement) {
                        this.currentWire.pathElement.remove();
                    }
                    this.resetWiringState();
                } else {
                    this.selectComponent(null);
                    this.deselectWire();
                }
            }

            if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault();
                this.saveToHistory();
                if (this.selectedWireId) {
                    this.deleteSelectedWire();
                } 
                else if (this.selectedComponentId && this.selectedComponentId !== 'sim-board') {
                    document.getElementById('sim-comp-delete').click();
                }
            }

            if (e.key === 'Tab') {
                e.preventDefault();
            }

            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    this.redo();
                } else {
                    this.undo();
                }
            }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
                e.preventDefault();
                this.redo();
            }
        });
    }

    makeDraggable(imageElement, component) {
        let startX, startY;
        let initialLeft, initialTop;
        const onMouseMove = (e) => {
            e.preventDefault();
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            const newLeft = initialLeft + dx / this.zoom;
            const newTop = initialTop + dy / this.zoom;
            component.element.style.left = `${newLeft}px`;
            component.element.style.top = `${newTop}px`;
            component.position.x = newLeft;
            component.position.y = newTop;
            
            this.updateConnectedWires(component.id); 
        };
        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            this._requestSaveState(); 
        };
        imageElement.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.selectComponent(component.id);
            this.saveToHistory();
            startX = e.clientX;
            startY = e.clientY;
            initialLeft = component.position.x;
            initialTop = component.position.y;
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    }

    // --- Wiring Logic ---

    initWireToolbarListeners() {
        // 1. Setup Color Swatches
        document.querySelectorAll('.color-swatch').forEach(swatch => {
            swatch.addEventListener('click', (e) => {
                e.stopPropagation();
                const newColor = e.target.dataset.color;
                this.setActiveWireColor(newColor);
                
                // If a wire is currently selected, update its color immediately
                if (this.selectedWireId) {
                    this.saveToHistory(); // Save state before changing color
                    const wire = this.wires.find(w => w.id === this.selectedWireId);
                    if (wire) {
                        wire.color = newColor;
                        if (wire.pathElement) {
                            wire.pathElement.setAttribute('stroke', newColor);
                        }
                        this._requestSaveState();
                    }
                }
            });
        });

        // 2. Setup Undo/Redo Buttons (Outside the loop!)
        // Check UI manager first, then fallback to DOM query
        const undoBtn = (this.ide.ui && this.ide.ui.simUndoBtn) ? this.ide.ui.simUndoBtn : document.getElementById('sim-undo-btn');
        const redoBtn = (this.ide.ui && this.ide.ui.simRedoBtn) ? this.ide.ui.simRedoBtn : document.getElementById('sim-redo-btn');

        if (undoBtn) {
            // Remove old listeners to be safe (though this runs once usually)
            const newUndo = undoBtn.cloneNode(true);
            undoBtn.parentNode.replaceChild(newUndo, undoBtn);
            
            newUndo.addEventListener('click', (e) => {
                e.stopPropagation();
                this.undo();
            });
            // Update reference if using UIManager
            if (this.ide.ui) this.ide.ui.simUndoBtn = newUndo;
        }

        if (redoBtn) {
            const newRedo = redoBtn.cloneNode(true);
            redoBtn.parentNode.replaceChild(newRedo, redoBtn);

            newRedo.addEventListener('click', (e) => {
                e.stopPropagation();
                this.redo();
            });
            if (this.ide.ui) this.ide.ui.simRedoBtn = newRedo;
        }
    }

    setActiveWireColor(color) {
        this.activeWireColor = color;
        document.querySelectorAll('.color-swatch').forEach(swatch => {
            swatch.classList.toggle('active', swatch.dataset.color === color);
        });
    }

    handlePinClick(pinElement, event) {
        if (this.wiringState === 'idle') {
            this.startNewWire(pinElement, event);
        } else if (this.wiringState === 'wiring') {
            this.completeWire(pinElement);
        }
    }

    startNewWire(startPinElement, event) {
        this.wiringState = 'wiring';
        this.canvas.style.cursor = 'crosshair';
        this.ghostWire.style.display = 'block';
        this.ghostWire.style.stroke = this.activeWireColor;

        const startRect = startPinElement.getBoundingClientRect();
        const canvasRect = this.canvas.getBoundingClientRect();
        
        const startCanvasX = startRect.left + startRect.width / 2 - canvasRect.left;
        const startCanvasY = startRect.top + startRect.height / 2 - canvasRect.top;
        
        const startPoint = {
            worldX: (startCanvasX - this.panX) / this.zoom,
            worldY: (startCanvasY - this.panY) / this.zoom
        };

        this.currentWire = {
            id: `wire_${this.nextWireId++}`, 
            color: this.activeWireColor,
            startPin: { ...startPinElement.dataset },
            endPin: null,
            points: [startPoint],
            pathElement: null
        };

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('class', 'sim-wire');
        path.setAttribute('stroke', this.currentWire.color);
        this.wireSvgLayer.appendChild(path);
        this.currentWire.pathElement = path;
        this.updateGhostWire(event);
    }

    addIntermediatePoint(mouseEvent) {
        if (!this.currentWire) return;
        const canvasRect = this.canvas.getBoundingClientRect();
        const worldX = (mouseEvent.clientX - canvasRect.left - this.panX) / this.zoom;
        const worldY = (mouseEvent.clientY - canvasRect.top - this.panY) / this.zoom;
        this.currentWire.points.push({ worldX, worldY });
    }

    completeWire(endPinElement) {
        if (!this.currentWire) return;
        this.saveToHistory();
        const endRect = endPinElement.getBoundingClientRect();
        const canvasRect = this.canvas.getBoundingClientRect();
        const endCanvasX = endRect.left + endRect.width / 2 - canvasRect.left;
        const endCanvasY = endRect.top + endRect.height / 2 - canvasRect.top;
        const endPoint = {
            worldX: (endCanvasX - this.panX) / this.zoom,
            worldY: (endCanvasY - this.panY) / this.zoom
        };
        this.currentWire.points.push(endPoint);
        
        this.currentWire.endPin = { ...endPinElement.dataset };
        
        this.currentWire.pathElement.setAttribute('d', this.buildWirePath(this.currentWire.points));
        const finalWire = this.currentWire;
        finalWire.pathElement.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectWire(finalWire, e);
        });
        finalWire.pathElement.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            this.addBendPointToWire(finalWire, e);
        });
        this.wires.push(finalWire);
        this.resetWiringState();
        this._requestSaveState();
    }

    updateGhostWire(e) {
        if (this.wiringState !== 'wiring' || !this.currentWire) {
            this.ghostWire.style.display = 'none';
            return;
        }
        
        const lastPoint = this.currentWire.points[this.currentWire.points.length - 1];
        const startX = lastPoint.worldX;
        const startY = lastPoint.worldY;
        
        const canvasRect = this.canvas.getBoundingClientRect();
        const endX = (e.clientX - canvasRect.left - this.panX) / this.zoom;
        const endY = (e.clientY - canvasRect.top - this.panY) / this.zoom;
        const permanentPathData = this.buildWirePath(this.currentWire.points);
        this.currentWire.pathElement.setAttribute('d', permanentPathData);
        const ghostPathData = `M ${startX} ${startY} L ${endX} ${endY}`;
        this.ghostWire.setAttribute('d', ghostPathData);
    }
    
    buildWirePath(points) {
        if (points.length < 2) return '';
        let path = `M ${points[0].worldX} ${points[0].worldY}`;
        if (points.length === 2) {
            path += ` L ${points[1].worldX} ${points[1].worldY}`;
        } else {
            const cornerRadius = 20;
            for (let i = 1; i < points.length - 1; i++) {
                const p0 = points[i - 1];
                const p1 = points[i];
                const p2 = points[i + 1];
                const dx1 = p0.worldX - p1.worldX;
                const dy1 = p0.worldY - p1.worldY;
                const dist1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
                const dx2 = p2.worldX - p1.worldX;
                const dy2 = p2.worldY - p1.worldY;
                const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
                const t1 = Math.min(cornerRadius / dist1, 0.5);
                const curveStartX = p1.worldX + dx1 * t1;
                const curveStartY = p1.worldY + dy1 * t1;
                const t2 = Math.min(cornerRadius / dist2, 0.5);
                const curveEndX = p1.worldX + dx2 * t2;
                const curveEndY = p1.worldY + dy2 * t2;
                path += ` L ${curveStartX} ${curveStartY}`;
                path += ` Q ${p1.worldX} ${p1.worldY}, ${curveEndX} ${curveEndY}`;
            }
            path += ` L ${points[points.length - 1].worldX} ${points[points.length - 1].worldY}`;
        }
        return path;
    }

    resetWiringState() {
        this.wiringState = 'idle';
        this.currentWire = null;
        this.ghostWire.style.display = 'none';
        this.canvas.style.cursor = 'default';
        document.addEventListener('contextmenu', (e) => {
            if (this.wiringState === 'wiring') {
                e.preventDefault();
                this.currentWire.pathElement.remove();
                this.resetWiringState();
            }
        }, { once: true });
    }

    deselectWire() {
        if (this.selectedWireId) {
            const oldWire = this.wires.find(w => w.id === this.selectedWireId);
            if (oldWire && oldWire.pathElement) {
                oldWire.pathElement.classList.remove('selected');
            }
        }
        this.selectedWireId = null;
        this.removeBendPointHandles();
    }

    selectWire(wire, event) {
        if (this.selectedComponentId) this.selectComponent(null);
        this.deselectWire();
        
        this.selectedWireId = wire.id;
        wire.pathElement.classList.add('selected');
        if (!this.ide.isSimulationRunning) {
            this.toolbar.style.display = 'flex';
        
            document.getElementById('sim-comp-name').style.display = 'none';
            document.getElementById('sim-comp-rotate-left').style.display = 'none';
            document.getElementById('sim-comp-rotate-right').style.display = 'none';
            document.getElementById('sim-comp-flip-h').style.display = 'none';
            
            this.renderBendPointHandles(wire);
        }
    }

    deleteSelectedWire() {
        if (this.ide.isSimulationRunning) return;
        if (!this.selectedWireId) return;
        this.saveToHistory();
        const wireIndex = this.wires.findIndex(w => w.id === this.selectedWireId);
        if (wireIndex > -1) {
            const wireToDelete = this.wires[wireIndex];
            if (wireToDelete.pathElement) {
                wireToDelete.pathElement.remove();
            }
            if (this.electronPaths.has(this.selectedWireId)) {
                const elPath = this.electronPaths.get(this.selectedWireId);
                if (elPath) elPath.remove();
                this.electronPaths.delete(this.selectedWireId);
            }
            this.wires.splice(wireIndex, 1);
            this.deselectWire();
            this._requestSaveState();
        }
    }

    renderBendPointHandles(wire) {
        this.removeBendPointHandles();
        wire.points.forEach((point, index) => {
            const handle = document.createElement('div');
            handle.className = 'sim-bend-point-handle';
            handle.dataset.wireId = wire.id;
            handle.dataset.pointIndex = index;
            if (index === 0 || index === wire.points.length - 1) {
                handle.classList.add('endpoint');
            }
            handle.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                this.isDraggingBendPoint = true;
                this.selectedBendPoint = { 
                    wireId: e.target.dataset.wireId, 
                    pointIndex: parseInt(e.target.dataset.pointIndex, 10) 
                };
            });
            this.canvas.appendChild(handle);
        });
    }

    updateBendPointHandles() {
        const wire = this.wires.find(w => w.id === this.selectedWireId);
        if (!wire) return;
        const handles = this.canvas.querySelectorAll('.sim-bend-point-handle');
        handles.forEach(handle => {
            const pointIndex = parseInt(handle.dataset.pointIndex, 10);
            if (pointIndex >= 0 && pointIndex < wire.points.length) {
                const point = wire.points[pointIndex];
                handle.style.left = `${(point.worldX * this.zoom) + this.panX}px`;
                handle.style.top = `${(point.worldY * this.zoom) + this.panY}px`;
            }
        });
    }

    removeBendPointHandles() {
        this.canvas.querySelectorAll('.sim-bend-point-handle').forEach(h => h.remove());
    }

    addBendPointToWire(wire, event) {
        const canvasRect = this.canvas.getBoundingClientRect();
        const worldX = (event.clientX - canvasRect.left - this.panX) / this.zoom;
        const worldY = (event.clientY - canvasRect.top - this.panY) / this.zoom;
        let closestSegment = -1;
        let minDistance = Infinity;
        for (let i = 0; i < wire.points.length - 1; i++) {
            const p1 = wire.points[i];
            const p2 = wire.points[i+1];
            const midX = (p1.worldX + p2.worldX) / 2;
            const midY = (p1.worldY + p2.worldY) / 2;
            const dist = Math.sqrt((worldX - midX)**2 + (worldY - midY)**2);
            if (dist < minDistance) {
                minDistance = dist;
                closestSegment = i;
            }
        }
        wire.points.splice(closestSegment + 1, 0, { worldX, worldY });
        wire.pathElement.setAttribute('d', this.buildWirePath(wire.points));
        this.renderBendPointHandles(wire);
        this._requestSaveState();
    }

    _requestSaveState() {
        clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => {
            this.ide.saveWorkspaceToCache();
            //console.log("Circuit state saved.");
        }, 500); 
    }


    getCircuitState() {
        const componentState = [];
        this.components.forEach(comp => {
            const state = {
                id: comp.id,
                type: comp.type,
                name: comp.name,
                position: { x: comp.position.x, y: comp.position.y },
                rotation: comp.rotation,
                scaleX: comp.scaleX
            };

            // --- Component Specific Properties ---
            if (comp.type === 'pushbutton') state.capColor = comp.capColor;   
            else if (comp.type === 'slide_switch') state.handleColor = comp.handleColor;
            else if (comp.type === 'potentiometer') {
                  state.resistance = comp.resistance;
                  state.unit = comp.unit;
                  state.knobColor = comp.knobColor;
            } 
            else if (comp.type === 'battery_module') {
                state.voltage = comp.voltage;
                state.current = comp.currentLimit;
            }
            else if (comp.type === 'ir_sensor') {
                state.detectionDistance = comp.sensitivityRange;
                state.outputMode = comp.outputMode;
            }
            else if (comp.type === 'dht11') {
                state.temp = comp.temp;
                state.humidity = comp.humidity;
            }
            else if (comp.type === 'pir_sensor') {
                state.sensitivity = comp.sensitivity;
                state.timeDelay = comp.timeDelay;
                state.triggerMode = comp.triggerMode;
            }
            else if (comp.type === 'soil_moisture') {
                state.moistureLevel = comp.moistureLevel;
            }
            else if (comp.type === 'led_red') {
                state.ledColor = comp.ledColor; // Save LED Color
            }
            else if (comp.type === 'led_rgb') {
                if (comp.color && comp.color.length === 3) {
                    state.red = comp.color[0];
                    state.green = comp.color[1];
                    state.blue = comp.color[2];
                } else {
                    state.red = 0; state.green = 0; state.blue = 0;
                }
            }
            else if (comp.type === 'neopixel_strip') {
                    state.numPixels = comp.numPixels;
            }
            else if (comp.type === 'neopixel_ring') {
                    state.numPixels = comp.numPixels;
            }
            else if (comp.type === 'oled_i2c') {
                    state.i2cAddress = comp.i2cAddress;
            }
            else if (comp.type === 'servo_motor' || comp.type === 'servo_continuous') {
                    state.hornType = comp.hornType;
            }
            else if (comp.type === 'dc_motor') {
                // No specific extra state for basic DC motor yet
            }
            
            componentState.push(state);
        });

        // Robust Wire Serialization
        const wireState = this.wires.map(w => {
            return {
                id: w.id,
                color: w.color,
                // Explicitly extract properties to avoid DOM object serialization issues
                startPin: { 
                    componentId: w.startPin.componentId || null, // null means Board
                    pinId: w.startPin.pinId 
                },
                endPin: { 
                    componentId: w.endPin.componentId || null, // null means Board
                    pinId: w.endPin.pinId 
                },
                points: w.points.map(p => ({ worldX: p.worldX, worldY: p.worldY }))
            };
        });

        return {
            components: componentState,
            wires: wireState,
            componentCounters: { ...this.componentCounters }
        };
    }

    loadCircuitState(state) {
        if (!state || !state.components) {
            console.warn("LoadCircuitState called with invalid or empty state.");
            return;
        }

        // 1. Ensure Board Logic is Ready
        if (!this.board) this.loadBoard(this.ide.boardId); 

        // 2. Clear Existing Components
        this.components.forEach(comp => comp.remove());
        this.components.clear();
        
        // 3. Clear and Reset SVG Layer
        this.wireSvgLayer.innerHTML = '';
        this.electronPaths.clear(); // Clear cached electron paths
        
        // Re-create Ghost Wire (crucial for new wiring operations)
        this.ghostWire = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this.ghostWire.setAttribute('class', 'sim-ghost-wire');
        this.wireSvgLayer.appendChild(this.ghostWire);
        
        // 4. Reset State Variables
        this.wires = [];
        this.boardPinStates = {}; 
        this.componentCounters = state.componentCounters || {};
        this.nextWireId = 1; 

        // 5. Restore Components
        state.components.forEach(compState => {
            const componentData = this.allComponentsData.find(c => c.id === compState.type);
            if (!componentData) {
                console.warn(`Unknown component type: ${compState.type}`);
                return;
            }

            let component;
            
            // Component Factory
            switch (compState.type) {
                case 'battery_module':
                    component = new BatteryModel(compState.id, this, compState.position, compState.name, componentData);
                    if (compState.voltage !== undefined) component.voltage = compState.voltage;
                    if (compState.current !== undefined) component.currentLimit = compState.current;
                    break;
                case 'pushbutton':
                    component = new PushButtonModel(compState.id, this, compState.position, compState.name, componentData);
                    if (compState.capColor) component.setCapColor(compState.capColor);
                    break;
                case 'slide_switch':
                    component = new SlideSwitchModel(compState.id, this, compState.position, compState.name, componentData);
                    if (compState.handleColor) component.setHandleColor(compState.handleColor);
                    break;                
                case 'potentiometer':
                    component = new PotentiometerModel(compState.id, this, compState.position, compState.name, componentData);
                    if (compState.resistance) component.resistance = compState.resistance;
                    if (compState.unit) component.unit = compState.unit;
                    if (compState.knobColor) component.setKnobColor(compState.knobColor);
                    break;
                case 'ultrasonic':
                    component = new UltrasonicModel(compState.id, this, compState.position, compState.name, componentData);
                    break;   
                case 'ir_sensor':
                    component = new IRSensorModel(compState.id, this, compState.position, compState.name, componentData);
                    if (compState.outputMode) component.outputMode = compState.outputMode;
                    break;  
                case 'dht11':
                    component = new DHT11Model(compState.id, this, compState.position, compState.name, componentData);
                    if (compState.temp !== undefined) component.temp = compState.temp;
                    if (compState.humidity !== undefined) component.humidity = compState.humidity;
                    break;
                case 'ldr':
                    component = new LDRModel(compState.id, this, compState.position, compState.name, componentData);
                    break;
                case 'pir_sensor':
                    component = new PIRSensorModel(compState.id, this, compState.position, compState.name, componentData);
                    if (compState.sensitivity) component.sensitivity = compState.sensitivity;
                    if (compState.timeDelay) component.timeDelay = compState.timeDelay;
                    if (compState.triggerMode) component.triggerMode = compState.triggerMode;
                    break;
                case 'soil_moisture':
                    component = new SoilMoistureModel(compState.id, this, compState.position, compState.name, componentData);
                    component.moistureLevel = compState.moistureLevel !== undefined ? compState.moistureLevel : 0.5;
                    break;
                case 'led_red':
                    component = new LEDModel(compState.id, this, compState.position, compState.name, componentData);
                    if (compState.ledColor) component.ledColor = compState.ledColor; 
                    break;
                case 'led_rgb':
                    component = new RGBLEDModel(compState.id, this, compState.position, compState.name, componentData);
                    if (compState.red !== undefined) component.color = [compState.red, compState.green, compState.blue];
                    break;
                case 'neopixel_strip':
                    component = new NeoPixelModel(compState.id, this, compState.position, compState.name, componentData);
                    if (compState.numPixels) component.setPixelCount(compState.numPixels);
                    break;
                case 'neopixel_ring':
                    component = new NeoPixelRingModel(compState.id, this, compState.position, compState.name, componentData);
                    if (compState.numPixels) component.setPixelCount(compState.numPixels);
                    break;
                case 'oled_i2c':
                    component = new OLEDModel(compState.id, this, compState.position, compState.name, componentData);
                    if (compState.i2cAddress) component.i2cAddress = compState.i2cAddress;
                    break;
                case 'dc_motor':
                    component = new DCMotorModel(compState.id, this, compState.position, compState.name, componentData);
                    break;
                case 'servo_motor':
                    component = new ServoModel(compState.id, this, compState.position, compState.name, componentData);
                    if (compState.hornType) component.hornType = compState.hornType;
                    break;
                case 'servo_continuous':
                    component = new ContinuousServoModel(compState.id, this, compState.position, compState.name, componentData);
                    if (compState.hornType) component.hornType = compState.hornType;
                    break;
                case 'buzzer':
                    component = new BuzzerModel(compState.id, this, compState.position, compState.name, componentData);
                    break;
                default:
                    // Fallback for generic components
                    component = new VirtualComponent(compState.id, compState.type, this, compState.position, compState.name, componentData);
                    break;
            }

            // Restore common transform properties
            component.rotation = compState.rotation || 0;
            component.scaleX = compState.scaleX || 1;

            this.components.set(compState.id, component);
            component.render(this.contentWrapper);
            component.updateTransform(); 
            
            // UI Updates for specific components
            if (compState.type === 'dht11') {
                const tSlider = component.element.querySelector('.temp'); 
                const hSlider = component.element.querySelector('.hum'); 
                const tText = component.element.querySelector('.val-temp'); 
                const hText = component.element.querySelector('.val-hum');
                if(tSlider) { tSlider.value = component.temp; tText.innerText = component.temp + "°C"; }
                if(hSlider) { hSlider.value = component.humidity; hText.innerText = component.humidity + "%"; }
            }
            if (compState.type === 'led_rgb') { 
                setTimeout(() => component.updateVisualState(), 0); 
            }
        });

        // 6. Restore Wires
        if (state.wires) {
            state.wires.forEach(wireState => {
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('class', 'sim-wire');
                path.setAttribute('stroke', wireState.color);
                
                // Ensure points are deep copied to prevent reference issues with History
                const points = wireState.points.map(p => ({...p}));
                const dPath = this.buildWirePath(points);
                path.setAttribute('d', dPath);
                
                this.wireSvgLayer.appendChild(path);

                const finalWire = { 
                    ...wireState, 
                    points: points,
                    pathElement: path 
                };
                
                // Re-bind Events
                finalWire.pathElement.addEventListener('click', (e) => { 
                    e.stopPropagation(); 
                    this.selectWire(finalWire, e); 
                });
                finalWire.pathElement.addEventListener('dblclick', (e) => { 
                    e.stopPropagation(); 
                    this.addBendPointToWire(finalWire, e); 
                });

                this.wires.push(finalWire);
                
                // Sync ID counter
                const idNum = parseInt(finalWire.id.split('_')[1], 10);
                if (!isNaN(idNum) && idNum >= this.nextWireId) {
                    this.nextWireId = idNum + 1;
                }
            });
        }
        
        // 7. Snap Wires to Pins (Visual Cleanup)
        // We delay this slightly to ensure DOM layout is complete
        setTimeout(() => {
            this.components.forEach(comp => {
                this.updateConnectedWires(comp.id);
            });
            // Update board wires too
            this.updateConnectedWires('sim-board');
        }, 50);
    }

    updateConnectedWires(componentId) {
        // Handle Board Pins separately
        if (componentId === 'sim-board') {
            const boardContainer = this.boardElement;
            if (!boardContainer) return;

            this.wires.forEach(wire => {
                let needsRedraw = false;
                
                // Start Pin is on Board?
                if (!wire.startPin?.componentId) { // null or undefined means board
                    const pinEl = boardContainer.querySelector(`.sim-pin-hotspot[data-pin-id="${wire.startPin.pinId}"]`);
                    if (pinEl) {
                        const rect = pinEl.getBoundingClientRect();
                        const canvasRect = this.canvas.getBoundingClientRect();
                        const worldX = (rect.left + rect.width/2 - canvasRect.left - this.panX) / this.zoom;
                        const worldY = (rect.top + rect.height/2 - canvasRect.top - this.panY) / this.zoom;
                        wire.points[0].worldX = worldX;
                        wire.points[0].worldY = worldY;
                        needsRedraw = true;
                    }
                }

                // End Pin is on Board?
                if (!wire.endPin?.componentId) {
                    const pinEl = boardContainer.querySelector(`.sim-pin-hotspot[data-pin-id="${wire.endPin.pinId}"]`);
                    if (pinEl) {
                        const rect = pinEl.getBoundingClientRect();
                        const canvasRect = this.canvas.getBoundingClientRect();
                        const worldX = (rect.left + rect.width/2 - canvasRect.left - this.panX) / this.zoom;
                        const worldY = (rect.top + rect.height/2 - canvasRect.top - this.panY) / this.zoom;
                        const last = wire.points.length - 1;
                        wire.points[last].worldX = worldX;
                        wire.points[last].worldY = worldY;
                        needsRedraw = true;
                    }
                }

                if (needsRedraw) {
                    wire.pathElement.setAttribute('d', this.buildWirePath(wire.points));
                    if (this.selectedWireId === wire.id) {
                        this.updateBendPointHandles();
                    }
                }
            });
            return;
        }

        // Handle Regular Components
        const component = this.components.get(componentId);
        if (!component) return;

        this.wires.forEach(wire => {
            let needsRedraw = false;

            if (wire.startPin?.componentId === componentId) {
                const newPos = this._getTransformedPinPosition(component, wire.startPin.pinId);
                wire.points[0].worldX = newPos.worldX;
                wire.points[0].worldY = newPos.worldY;
                needsRedraw = true;
            }

            if (wire.endPin?.componentId === componentId) {
                const newPos = this._getTransformedPinPosition(component, wire.endPin.pinId);
                const lastPointIndex = wire.points.length - 1;
                wire.points[lastPointIndex].worldX = newPos.worldX;
                wire.points[lastPointIndex].worldY = newPos.worldY;
                needsRedraw = true;
            }

            if (needsRedraw) {
                wire.pathElement.setAttribute('d', this.buildWirePath(wire.points));
                if (this.selectedWireId === wire.id) {
                    this.updateBendPointHandles();
                }
            }
        });
    }


    _getTransformedPinPosition(component, pinId) {
        const body = component.element.querySelector('.sim-component-body');
        if (!body) return { worldX: component.position.x, worldY: component.position.y };

        // Get dimensions confidently.
        let compWidth = body.offsetWidth;
        let compHeight = body.offsetHeight;

        if (compWidth === 0 && body.style.width) compWidth = parseInt(body.style.width);
        if (compHeight === 0 && body.style.height) compHeight = parseInt(body.style.height);

        let pinData = null;
        if (component.pins && component.pins[pinId]) {
            const pinEl = component.pins[pinId];
            pinData = { 
                pos: { 
                    x: parseFloat(pinEl.style.left), 
                    y: parseFloat(pinEl.style.top) 
                },
                isPixel: pinEl.style.left.includes('px') || pinEl.style.top.includes('px')
            };
        }
        
        if (!pinData) {
            pinData = component.componentData.pins ? component.componentData.pins.find(p => p.id === pinId) : null;
        }

        if (!pinData) return { worldX: component.position.x, worldY: component.position.y };

        let localX, localY;
        let rawX = pinData.pos.x;
        let rawY = pinData.pos.y;

        const isPixelX = (typeof rawX === 'string' && rawX.endsWith('px')) || (typeof rawX === 'number' && rawX > 100) || pinData.isPixel;
        const isPixelY = (typeof rawY === 'string' && rawY.endsWith('px')) || (typeof rawY === 'number' && rawY > 100) || pinData.isPixel;

        if (isPixelX) {
            localX = parseFloat(rawX);
        } else {
            localX = compWidth * (parseFloat(rawX) / 100);
        }

        if (isPixelY) {
            localY = parseFloat(rawY);
        } else {
            localY = compHeight * (parseFloat(rawY) / 100);
        }

        // 4. Translate to Center
        const centerX = compWidth / 2;
        const centerY = compHeight / 2;
        let pinRelativeToCenterX = localX - centerX;
        let pinRelativeToCenterY = localY - centerY;

        // 5. Apply Scale (Flip)
        pinRelativeToCenterX *= component.scaleX || 1;

        // 6. Apply Rotation
        const rotationRad = (component.rotation || 0) * (Math.PI / 180);
        const cos = Math.cos(rotationRad);
        const sin = Math.sin(rotationRad);
        
        const rotatedX = pinRelativeToCenterX * cos - pinRelativeToCenterY * sin;
        const rotatedY = pinRelativeToCenterX * sin + pinRelativeToCenterY * cos;

        // 7. World Coordinates
        const finalOffsetX = rotatedX + centerX;
        const finalOffsetY = rotatedY + centerY;

        return {
            worldX: component.position.x + finalOffsetX,
            worldY: component.position.y + finalOffsetY
        };
    }

    togglePinLabels() {
        if (!this.boardElement) return false;
        return this.boardElement.classList.toggle('show-labels');
    }

    // 2. REPLACE THE EXISTING renderBoardPins METHOD with this:
    renderBoardPins() {
        if (!this.board || !this.board.pins) return;
        const boardContainer = this.contentWrapper.querySelector('.sim-board-container');
        if (!boardContainer) return;
        boardContainer.querySelectorAll('.sim-pin-hotspot').forEach(p => p.remove());
        
        this.board.pins.forEach(pin => {
            const pinElement = document.createElement('div');
            pinElement.className = 'sim-pin-hotspot';
            pinElement.dataset.pinId = pin.id;
            pinElement.dataset.label = pin.name; 
            if (pin.pos.x < 50) {
                pinElement.classList.add('pin-left'); // Label will appear to the right
            } else {
                pinElement.classList.add('pin-right'); // Label will appear to the left
            }

            pinElement.title = `${pin.name} (ID: ${pin.id})`;
            pinElement.style.left = `${pin.pos.x}%`;
            pinElement.style.top = `${pin.pos.y}%`;
            
            boardContainer.appendChild(pinElement);
            
            pinElement.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handlePinClick(pinElement, e);
            });
        });
    }


    //////////////////////////////////////////

    makeUiElementDraggable(elementId, handleId) {
        const elmnt = document.getElementById(elementId);
        const handle = document.getElementById(handleId);
        
        if (!elmnt || !handle) return;

        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

        handle.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
            // Get the mouse cursor position at startup:
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            // Calculate the new cursor position:
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            // Set the element's new position:
            elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
            elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
            
            // Reset bottom/right to auto so top/left takes precedence
            elmnt.style.bottom = 'auto';
            elmnt.style.right = 'auto';
        }

        function closeDragElement() {
            // Stop moving when mouse button is released:
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }
    
}
