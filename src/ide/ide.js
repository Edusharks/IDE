// src/ide/ide.js
'use strict';

import { getWorkspace, saveWorkspace, getExtensions, saveExtensions, saveProject, getAllProjects, deleteProjectByName } from '../shared/utils/db.js';
import { ideTutorials as tutorials } from './ide-tutorials.js';
import { MICROPYTHON_SUGGESTIONS } from './utils/micropython-definitions.js';
import { showCustomPrompt, showCustomConfirm } from '../shared/utils/modals.js';
import componentsData from './data/components.json';
import { UIManager } from './managers/UIManager.js';
import { CommunicationManager } from './managers/CommunicationManager.js';
import { AiVisionManager } from './managers/AiVisionManager.js';
import { DeviceFileManager } from './managers/DeviceFileManager.js';
import { DashboardBuilder } from './managers/DashboardBuilder.js';
import { BlockGenius } from './managers/BlockGenius.js';
import { SimulatorManager } from './managers/SimulatorManager.js';
import { HardwareBridge } from './utils/HardwareBridge.js';
import * as monaco from 'monaco-editor';
import Chart from 'chart.js/auto';
import * as Blockly from 'blockly/core';
import { dialog } from 'blockly/core';
import * as pako from 'pako';
import JSZip from 'jszip';
import Shepherd from 'shepherd.js';
import { ToastManager } from './managers/ToastManager.js';
import { OrphanManager } from './managers/OrphanManager.js';

// --- CONSTANTS ---

// Minified WebSocket Server Library for MicroPython
const WEBSOCKET_SERVER_CODE = `
import socket
import struct
import hashlib
import binascii

class WsServer:
    def __init__(self, client_socket, on_message=None, request_str=None):
        self.client = client_socket
        self.on_message = on_message
        self.closed = False
        if request_str:
            self.handshake(request_str)

    def handshake(self, request):
        headers = request.split('\\r\\n')
        key = None
        for h in headers:
            if "Sec-WebSocket-Key" in h:
                key = h.split(": ")[1]
                break
        
        if key:
            resp_key = binascii.b2a_base64(hashlib.sha1((key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11").encode()).digest()).decode().strip()
            response = "HTTP/1.1 101 Switching Protocols\\r\\nUpgrade: websocket\\r\\nConnection: Upgrade\\r\\nSec-WebSocket-Accept: " + resp_key + "\\r\\n\\r\\n"
            self.client.send(response.encode())

    def serve_forever(self):
        while not self.closed:
            try:
                data = self.client.recv(2)
                if not data: break
                byte1, byte2 = struct.unpack('BB', data)
                opcode = byte1 & 0x0F
                if opcode == 8:
                    self.close()
                    break
                masked = (byte2 & 0x80) == 0x80
                length = byte2 & 0x7F
                if length == 126:
                    length = struct.unpack('>H', self.client.recv(2))[0]
                elif length == 127:
                    length = struct.unpack('>Q', self.client.recv(8))[0]
                masks = None
                if masked:
                    masks = self.client.recv(4)
                payload = b""
                remaining = length
                while remaining > 0:
                    chunk = self.client.recv(min(remaining, 1024))
                    if not chunk: break
                    payload += chunk
                    remaining -= len(chunk)
                if masked:
                    decoded = bytearray(len(payload))
                    for i in range(len(payload)):
                        decoded[i] = payload[i] ^ masks[i % 4]
                    payload = decoded
                if self.on_message:
                    self.on_message(self, payload.decode('utf-8'))
            except Exception as e:
                self.close()
                break

    def send(self, msg):
        if self.closed: return
        try:
            data = msg.encode('utf-8')
            length = len(data)
            frame = bytearray([0x81])
            if length <= 125:
                frame.append(length)
            elif length <= 65535:
                frame.append(126)
                frame.extend(struct.pack('>H', length))
            else:
                frame.append(127)
                frame.extend(struct.pack('>Q', length))
            frame.extend(data)
            self.client.send(frame)
        except:
            self.close()

    def close(self):
        self.closed = True
        try: self.client.close()
        except: pass
`;

// --- HELPERS ---
function toBase64URL(u8) {
    return btoa(String.fromCharCode.apply(null, u8)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function fromBase64URL(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) { str += '='; }
    const bin = atob(str);
    const u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) { u8[i] = bin.charCodeAt(i); }
    return u8;
}

const DEFAULT_PROJECT = {
    'main.py': `<xml xmlns="https://developers.google.com/blockly/xml"><block type="on_start" id="start_block" x="100" y="50"></block><block type="forever" id="forever_block" x="100" y="220"></block></xml>`,
};

const EXTENSION_BLOCK_TYPES = {
    'face_landmark': ['face_landmark_enable', 'face_landmark_on_face_data', 'face_landmark_get_face_count', 'face_landmark_is_expression', 'face_landmark_get_blendshape_value'],
    'hand_gesture': ['hand_gesture_enable', 'hand_gesture_on_gesture', 'hand_gesture_get_hand_count', 'hand_gesture_is_hand_present'],
    'image_classification': ['image_classification_enable', 'image_classification_on_class', 'image_classification_is_class', 'image_classification_get_class'],
    'object_detection': ['object_detection_enable', 'object_detection_on_object', 'object_detection_is_object_detected', 'object_detection_for_each', 'object_detection_get_property'],
    'custom_model': ['custom_model_setup', 'custom_model_when_class', 'custom_model_is_class'],
    'iot_dashboard': ['dashboard_when_button_is', 'dashboard_get_control_value', 'dashboard_get_joystick_x', 'dashboard_get_joystick_y', 'dashboard_update_display', 'dashboard_on_control_change', 'dashboard_generated_html_content'],
    'neopixel': ['actuator_neopixel_setup', 'actuator_neopixel_brightness', 'actuator_neopixel_fill', 'actuator_neopixel_set', 'actuator_neopixel_shift', 'actuator_neopixel_rainbow', 'actuator_neopixel_clear', 'actuator_neopixel_show'],
    'display': ['display_oled_setup', 'display_oled_text', 'display_oled_pixel', 'display_oled_line', 'display_oled_rect', 'display_create_bitmap', 'display_oled_draw_image', 'display_oled_show', 'display_oled_clear', 'display_oled_power', 'display_oled_contrast', 'display_oled_invert', 'display_oled_animate_fireworks'],
    'wifi': ['wifi_connect', 'wifi_is_connected', 'wifi_get_ip', 'http_get_json', 'json_get_key', 'http_post_json', 'wifi_start_web_server', 'wifi_on_web_request', 'wifi_get_web_request_path', 'wifi_send_web_response'],
    'bluetooth': ['ble_setup', 'ble_advertise_data'],
};



export class ESP32BlockIDE {
    constructor(boardId, projectName, pythonGenerator) {
        // --- Core State ---
        this.boardId = boardId;
        this.projectName = projectName;
        this.pythonGenerator = pythonGenerator;
        this.projectFiles = {};
        this.activeFile = 'main.py';
        this.currentCode = '';
        this.codeWithBlockIds = '';
        this.monacoEditor = null;
        this.isCodeOnlyMode = false;
        this.isLiveMode = false;
        this.loadedExtensions = new Set();
        this.blocklyManager = null;

        // --- Connection State ---
        this.webReplCreds = null;       
        this.isAutoReconnecting = false; 

        this.isWaitingForIpAfterSetup = false; 
        this.tempSetupPassword = null;

        // --- Simulator State ---
        this.pyodide = null;
        this.isPyodideLoading = false;
        this.isSimulationRunning = false;
        this.simulationInterval = null;

        // --- Data State ---
        this.plotterDataPointCount = 0;
        this.workspaceUpdateTimeout = null;
        this.lastDataBuffer = '';

        // --- Initialize Managers ---
        this.uiManager = new UIManager();
        this.toastManager = new ToastManager();
        this.ui = this.uiManager.elements; 

        this.commManager = new CommunicationManager();
        this.aiManager = new AiVisionManager(this.commManager, this);
        this.deviceFileManager = new DeviceFileManager(this.commManager, this);
        this.dashboardBuilder = new DashboardBuilder(this);
        this.blockGenius = new BlockGenius();
        this.simulatorManager = new SimulatorManager(this);

        this.orphanManager = null; 

        // --- Configuration ---
        this.WORKSPACE_UPDATE_DEBOUNCE_MS = 250;
        this.MAX_PLOTTER_POINTS = 50;
        this.boardNameMap = { 'esp32': 'ESP32', 'pico': 'Pico' };
        
        // --- Available Extensions ---
        this.availableExtensions = [
            { id: 'face_landmark', name: 'Face Landmark', description: 'Detect faces and expressions like smiling or blinking.', color: '#6d28d9', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 12a3 3 0 100-6 3 3 0 000 6z"/><path d="M20.9 19.8A10 10 0 103.1 4.2"/></svg>` },
            { id: 'hand_gesture', name: 'Hand Gestures', description: 'Recognize hand gestures like thumbs-up and pointing.', color: '#d97706', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>` },
            { id: 'image_classification', name: 'Image Classification', description: 'Identify the main object in the camera view (e.g., cat, dog, banana).', color: '#059669', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21 21-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z"/></svg>`},
            { id: 'object_detection', name: 'Object Detection', description: 'Find and locate multiple objects like people, cups, or laptops.', color: '#0891b2', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/></svg>` },
            { id: 'custom_model',name: 'Custom Vision Model', description: 'Load your own image classification models from Teachable Machine.', color: '#000dffff', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8V4H8"/><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M14 2v2"/><path d="M14 20v2"/></svg>`, boards: ['esp32', 'pico']},
            { id: 'iot_dashboard',name: 'IoT Dashboard',description: 'Visually build a web dashboard to control your project.',color: '#4C51BF', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 7h-9a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z"/><path d="M4 17V5a2 2 0 0 1 2-2h11"/></svg>` },
            { id: 'neopixel', name: 'NeoPixel', description: 'Control addressable RGB LED strips like WS2812B.', color: '#F97316', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 5.042A6 6 0 1 0 12 21a6 6 0 0 0 2-11.958Z"/><path d="M12 2v2"/><path d="m4.929 4.929 1.414 1.414"/><path d="M2 12h2"/><path d="m4.929 19.071 1.414-1.414"/><path d="m12 18 v2"/><path d="m19.071 19.071-1.414-1.414"/><path d="M22 12h-2"/><path d="m19.071 4.929-1.414 1.414"/></svg>`, boards: ['esp32', 'pico'] },
            { id: 'display', name: 'OLED Display', description: 'Draw shapes, text, and images on SSD1306 displays.', color: '#6366F1', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><path d="M7 8h10M7 12h5M7 16h3"/></svg>`, boards: ['esp32', 'pico'] },
            { id: 'wifi', name: 'Wi-Fi & Web', description: 'Connect to Wi-Fi, make web requests, and create a web server.', color: '#22C55E', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>`, boards: ['esp32', 'pico'] },
            { id: 'bluetooth', name: 'Bluetooth LE', description: 'Advertise data using Bluetooth Low Energy.', color: '#3B82F6', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m7 7 10 10-5 5V2l5 5L7 17"/></svg>`, boards: ['esp32', 'pico'] },
        ];


        Object.defineProperty(this, '__CREDITS__', {
            value: Object.freeze({
                owner: "Edusharks Learning and Research Pvt Ltd",
                developer: "Guhan S",
                build_ver: "1.0.0",
                message: "Proprietary Logic - Do Not Distribute without Attribution"
            }),
            writable: false,     // Cannot be changed
            configurable: false, // Cannot be deleted
            enumerable: false    // Does not show up in standard console.log loops
        });


    }

    // --- STATIC CREATION ---
    static async create(boardId, projectName, pythonGenerator, blocklyManager) {
        const ide = new ESP32BlockIDE(boardId, projectName, pythonGenerator);
        if (blocklyManager) {
            ide.setBlocklyManager(blocklyManager);
        } else {
            console.error("FATAL: Blockly Manager not provided to IDE creation.");
        }

        await ide._initialize();
        return ide;
    }

    setBlocklyManager(manager) {
        this.blocklyManager = manager;
        this.orphanManager = new OrphanManager(this.blocklyManager.workspace);

        if (Blockly.dialog) {
            Blockly.dialog.setPrompt(showCustomPrompt);
            Blockly.dialog.setConfirm(showCustomConfirm);
        }
        this.registerBlocklyContextMenu();
        this.setupWorkspaceListeners();
    }

    async _initialize() {
        this.ui.projectName.textContent = this.projectName;
        const boardName = this.boardNameMap[this.boardId] || 'Board';
        const uploadSpan = this.ui.uploadBtn.querySelector('span');
        if (uploadSpan) {
            uploadSpan.textContent = `Upload to ${boardName}`;
        }
        
        this.uiManager.setBoardCapabilities({ 
            hasBle: (this.boardId === 'esp32') 
        });        
        this.updateConnectionStatus('Disconnected');
        this.updateAiMonitorVisibility();
        this.updateDashboardVisibility();
        this.updatePlotterVisibility();
        
        this.uiManager.bindEventListeners({
            onBackToProjects: () => {
                this.aiManager.stopAiVision();
                this.saveWorkspaceToCache();
                window.location.href = 'dashboard.html';
            },
            onRenameProject: () => this.handleProjectRename(),
            onShareProject: () => this.handleProjectShare(),
            onStartTutorial: () => this.openTutorialModal(),
            onSwitchView: (view) => this.switchView(view),
            onUpload: () => this.uploadCodeToDevice(),
            onToggleLiveMode: () => this.handleLiveModeToggle(),
            onOpenDeviceManager: () => this.deviceFileManager.open(),
            onOpenNewFileModal: () => this.uiManager.openNewFileModal(),
            onCreateFile: () => this.handleCreateNewFile(),
            onConsoleCommand: (cmd) => this.sendConsoleCommand(cmd + '\r\n'),

            onUndo: () => {
                if (this.blocklyManager && this.blocklyManager.workspace) {
                    this.blocklyManager.workspace.undo(false); // false = undo
                }
            },
            onRedo: () => {
                if (this.blocklyManager && this.blocklyManager.workspace) {
                    this.blocklyManager.workspace.undo(true); // true = redo
                }
            },

            onConsoleControl: (action) => {
                if (action === 'download') {
                    this.uiManager.downloadConsoleLog(this.projectName);
                    return;
                }

                // For hardware controls, check connection
                if (!this.commManager.isConnected()) {
                    this.addConsoleMessage("⚠️ Not connected to a device.", "warning");
                    return;
                }

                if (action === 'interrupt') {
                    this.addConsoleMessage("Sending Interrupt (Ctrl+C)...", "info");
                    this.commManager.sendData('\x03'); // ASCII ETX
                } else if (action === 'reset') {
                    this.addConsoleMessage("Sending Soft Reset (Ctrl+D)...", "info");
                    this.commManager.sendData('\x04'); // ASCII EOT
                }
            },

            onConnect: (type) => {
                if (type === 'usb') this.commManager.connectUSB();
                if (type === 'wifi') {
                    this.ui.webReplModal.style.display = 'flex';
                    setTimeout(() => this.ui.webReplIpInput.focus(), 50);
                }
                if (type === 'ble') {
                    this.ui.bleModal.style.display = 'flex';
                    document.getElementById('ble-connect-tab').click();
                }
            },
            onDisconnect: () => {
                if(this.commManager.isConnected()) this.commManager.disconnect();
            },

            // --- Webrepl HANDLERS ---

            onWebReplConnect: (input, password) => {
                if (!input) return this.toastManager.show("Please enter an IP address.", "warning");
                if (!password) return this.toastManager.show("Please enter the WebREPL password.", "warning");
                
                let ip = input.trim();
                ip = ip.replace(/^(http|ws)s?:\/\//, '');
                ip = ip.split('/')[0];
                ip = ip.split(':')[0];
                
                if (ip === '0.0.0.0') { this.toastManager.show("0.0.0.0 is a placeholder address. Check USB console.", "warning"); return; }
                this.webReplCreds = { ip, password };

                this.ui.webReplModal.style.display = 'none';
                this.commManager.connectWebREPL(ip, password);
            },

            onWebReplSetup: async (ssid, wifiPass, replPass) => {
                if (!ssid || !replPass) return this.toastManager.show("SSID and Password are required.", "warning");
                
                if (this.commManager.getConnectionType() !== 'usb' || !this.commManager.isConnected()) {
                    return this.toastManager.show("Please connect via USB first.", "warning");
                }

                this.addConsoleMessage("⚙️ Configuring device...", "info");

                const webreplCfgContent = `PASS = '${replPass}'\n`;

                // CROSS-PLATFORM BOOT SCRIPT (ESP32 + PICO W)
                const bootPyContent = `
import sys
import gc
import webrepl
import network
import time

# ESP32 Specific optimizations (Ignore on Pico)
try:
    import esp
    esp.osdebug(None)
except ImportError:
    pass

def do_connect():
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    if not wlan.isconnected():
        print('Connecting to network...')
        wlan.connect('${ssid}', '${wifiPass}')
        # Pico W can take longer to associate
        for _ in range(30):
            if wlan.isconnected(): break
            time.sleep(1)
            print('.', end='')
    
    print('')
    if wlan.isconnected():
        # This specific print format is sniffed by the IDE
        print('Network config:', wlan.ifconfig())
    else:
        print('Failed to connect to Wi-Fi. Check credentials.')

gc.collect()
do_connect()
webrepl.start()
`;

                try {
                    await this.deviceFileManager.performAtomicDeviceOperation(async () => {
                        await this.commManager.enterRawREPL();
                        
                        await this.deviceFileManager._uploadSingleFileInRawMode('webrepl_cfg.py', webreplCfgContent);
                        await this.deviceFileManager._uploadSingleFileInRawMode('boot.py', bootPyContent);

                        this.addConsoleMessage("Restarting device...", "info");
                        await this.commManager.sendData("import machine; machine.reset()\x04"); 
                        await new Promise(r => setTimeout(r, 1000));
                    });
                    
                    // State Flags
                    this.isWaitingForIpAfterSetup = true;
                    this.tempSetupPassword = replPass;

                    // Update UI
                    const connectTabBtn = document.getElementById('webrepl-connect-tab');
                    if (connectTabBtn) connectTabBtn.click();

                    this.ui.webReplIpInput.value = "Waiting for reboot...";
                    this.ui.webReplConnectPassword.value = "******";
                    this.ui.webReplConnectBtn.textContent = "♻️ Waiting for IP...";
                    this.ui.webReplConnectBtn.disabled = true;

                    this.addConsoleMessage("✅ Configuration complete! Rebooting...", "success");
                    this.addConsoleMessage("👀 Watching console for IP address...", "info");
                    
                } catch (e) {
                    this.addConsoleMessage(`Setup Error: ${e.message}`, "error");
                    try { await this.commManager.exitRawREPL(); } catch {}
                }
            },


            // --- BLE HANDLERS ---

            onBleScan: async () => {
                const listArea = document.getElementById('ble-device-list');
                const scanBtn = this.ui.bleScanBtn;
                const originalBtnText = scanBtn.textContent;
                const originalListHtml = listArea.innerHTML;

                try {
                    // 1. Trigger Native Browser Scan
                    // This promise resolves ONLY after user selects a device and clicks "Pair"
                    const device = await this.commManager.bleComm.scan();

                    // 2. Update UI to show Connecting Animation
                    scanBtn.textContent = "Connecting...";
                    scanBtn.disabled = true;
                    this.ui.bleCancelBtn.disabled = true;

                    // Insert Spinner into the list area
                    listArea.innerHTML = `
                        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem;">
                            <div class="upload-status-icon uploading" style="width: 40px; height: 40px; margin-bottom: 1rem;">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                                </svg>
                            </div>
                            <p style="color: var(--text-primary); font-weight: 600;">Connecting to ${device.name}...</p>
                            <p style="color: var(--text-secondary); font-size: 0.9rem;">Please wait...</p>
                        </div>
                    `;

                    // 3. Perform Connection (This takes 1-4 seconds)
                    await this.commManager.connectBLE(device);

                    // 4. Success (Modal closes automatically via event listener, but we reset state just in case)
                    this.ui.bleModal.style.display = 'none';
                    this.addConsoleMessage(`✅ Connected to ${device.name}`, 'success');

                } catch (e) {
                    if (!e.message.includes('cancelled')) {
                        this.addConsoleMessage(`BLE Error: ${e.message}`, 'error');
                        // Show error in modal if it wasn't just a cancel
                        listArea.innerHTML = `<p style="color: var(--accent-error); padding: 1rem; text-align: center;">Connection Failed: ${e.message}</p>`;
                    } else {
                        // User cancelled scan, revert to original text
                        listArea.innerHTML = originalListHtml;
                    }
                } finally {
                    // Always restore button state
                    scanBtn.textContent = originalBtnText;
                    scanBtn.disabled = false;
                    this.ui.bleCancelBtn.disabled = false;
                    
                    // Restore original list text if we are still open and not showing an error/spinner
                    if (this.ui.bleModal.style.display === 'none') {
                        listArea.innerHTML = originalListHtml;
                    }
                }
            },

            onBleSetup: async (deviceName) => {
                if (!deviceName) return this.toastManager.show("Device Name is required.", "warning");
                if (this.commManager.getConnectionType() !== 'usb' || !this.commManager.isConnected()) {
                    return this.toastManager.show("Please connect via USB first to configure BLE.", "warning");
                }

                this.addConsoleMessage("⚙️ Configuring BLE REPL (v4 - Stable)...", "info");

                // PYTHON SCRIPT (Keep existing robust version)
                const bleReplCode = `
import bluetooth
import io
import os
import micropython
import struct
import time
import gc
from micropython import const

_IRQ_CENTRAL_CONNECT = const(1)
_IRQ_CENTRAL_DISCONNECT = const(2)
_IRQ_GATTS_WRITE = const(3)
_MP_STREAM_POLL = const(3)
_MP_STREAM_POLL_RD = const(0x0001)

_UART_UUID = bluetooth.UUID("6E400001-B5A3-F393-E0A9-E50E24DCCA9E")
_UART_TX = (bluetooth.UUID("6E400003-B5A3-F393-E0A9-E50E24DCCA9E"), const(0x0010),)
_UART_RX = (bluetooth.UUID("6E400002-B5A3-F393-E0A9-E50E24DCCA9E"), const(0x0004),)

_UART_SERVICE = (_UART_UUID, (_UART_TX, _UART_RX),)

class BLEUART(io.IOBase):
    def __init__(self, name="${deviceName}", rxbuf=100):
        self._ble = bluetooth.BLE()
        self._ble.active(False)
        time.sleep_ms(500)
        self._ble.active(True)
        time.sleep_ms(500)
        
        self._ble.irq(self._irq)
        ((self._tx_handle, self._rx_handle),) = self._ble.gatts_register_services((_UART_SERVICE,))
        
        self._ble.gap_advertise(100000, adv_data=self._adv_payload(), resp_data=self._resp_payload(name))
        
        self._rx_buffer = bytearray()
        self._conn_handle = None

    def _irq(self, event, data):
        try:
            if event == _IRQ_CENTRAL_CONNECT:
                self._conn_handle, _, _ = data
            elif event == _IRQ_CENTRAL_DISCONNECT:
                self._conn_handle = None
                self._ble.gap_advertise(100000, adv_data=self._adv_payload(), resp_data=self._resp_payload("${deviceName}"))
            elif event == _IRQ_GATTS_WRITE:
                conn_handle, value_handle = data
                if conn_handle == self._conn_handle and value_handle == self._rx_handle:
                    self._rx_buffer += self._ble.gatts_read(self._rx_handle)
                    if hasattr(os, 'dupterm_notify'):
                        os.dupterm_notify(self)
        except:
            pass

    def any(self):
        return len(self._rx_buffer)

    def read(self, sz=None):
        if not self._rx_buffer: return None
        if sz is None: sz = len(self._rx_buffer)
        result = self._rx_buffer[:sz]
        self._rx_buffer = self._rx_buffer[sz:]
        return result

    def readinto(self, buf):
        if not self._rx_buffer: return None
        l = len(buf)
        if len(self._rx_buffer) < l:
            l = len(self._rx_buffer)
        buf[:l] = self._rx_buffer[:l]
        self._rx_buffer = self._rx_buffer[l:]
        return l

    def write(self, data):
        if self._conn_handle is None: return
        try:
            self._ble.gatts_notify(self._conn_handle, self._tx_handle, data)
        except:
            pass

    def ioctl(self, request, arg):
        if request == _MP_STREAM_POLL:
            if self.any():
                return _MP_STREAM_POLL_RD
        return 0

    def close(self):
        self._ble.active(False)

    def _adv_payload(self):
        payload = bytearray([0x02, 0x01, 0x06]) 
        uuid = b'\\x9e\\xca\\xdc\\x24\\x0e\\xe5\\xa9\\xe0\\x93\\xf3\\xa3\\xb5\\x01\\x00\\x40\\x6e'
        payload += bytearray([0x11, 0x07]) + uuid
        return payload

    def _resp_payload(self, name):
        name_bytes = name.encode('utf-8')[:20]
        return bytearray([len(name_bytes) + 1, 0x09]) + name_bytes

def start():
    import os
    global uart
    try:
        uart = BLEUART()
        os.dupterm(uart)
    except:
        pass
`;

                // CRITICAL FIX: Increased boot delay to 3 seconds
                const bootPyContent = `
import machine
import time
import ble_uart_repl
# Wait for radio to stabilize
time.sleep(3)
ble_uart_repl.start()
`;

                try {
                    await this.deviceFileManager.performAtomicDeviceOperation(async () => {
                        await this.commManager.enterRawREPL();
                        
                        this.addConsoleMessage("Uploading BLE driver...", "info");
                        await this.deviceFileManager._uploadSingleFileInRawMode('ble_uart_repl.py', bleReplCode);
                        
                        this.addConsoleMessage("Updating boot script...", "info");
                        await this.deviceFileManager._uploadSingleFileInRawMode('boot.py', bootPyContent);

                        this.addConsoleMessage("Restarting device...", "info");
                        await this.commManager.sendData("import machine; machine.reset()\x04"); 
                        await new Promise(r => setTimeout(r, 1000));
                    });

                    // --- AUTO-SWITCH TO CONNECT ---
                    this.addConsoleMessage("✅ BLE Setup Complete! Rebooting...", "success");
                    this.addConsoleMessage("🔌 Auto-switching to BLE mode...", "info");

                    if (this.commManager.isConnected()) {
                        await this.commManager.disconnect();
                    }

                    if (this.ui.bleConnectTab) {
                        this.ui.bleConnectTab.click();
                    }

                    this.ui.bleModal.style.display = 'flex';
                    this.addConsoleMessage(`👉 Click 'Scan for Devices' to connect to "${deviceName}".`, "info");

                } catch (e) {
                    this.addConsoleMessage(`BLE Setup Failed: ${e.message}`, "error");
                    try { await this.commManager.exitRawREPL(); } catch {}
                }
            },

            onCameraToggle: () => {
                const wrapper = document.getElementById('ai-camera-wrapper');
                if (!wrapper) return;
                
                if (!this.aiManager.isCameraOn) {
                    this.addConsoleMessage("⚠️ Camera not active. Use an AI block to start it.", "warning");
                    return;
                }

                const isActive = wrapper.classList.toggle('active');
                const btn = document.getElementById('camera-toggle-btn');
                if (btn) {
                    if (isActive) btn.classList.add('active');
                    else btn.classList.remove('active');
                }
            },


            onExportProject: () => this.exportProject(),
            onSimPlayPause: () => this.runSimulation(),
            onSimRestart: () => {
                if (this.isSimulationRunning) this.stopSimulation();
                setTimeout(() => this.runSimulation(), 100);
            },
            onSimFullscreen: () => this.toggleSimulatorFullscreen(),
            onSimFitScreen: () => { if(this.simulatorManager) this.simulatorManager.fitToScreen(); },
            onTogglePinLabels: () => {
                const isActive = this.simulatorManager.togglePinLabels();
                this.ui.togglePinLabelsBtn.classList.toggle('active', isActive);
            },
            onToggleGrid: () => {
                const isActive = this.simulatorManager.toggleGrid();
                this.ui.gridToggleBtn.classList.toggle('active', isActive);
            },
            onOpenDashboard: () => this.dashboardBuilder.show(),
            onOpenAiMonitor: () => this.aiManager.toggleAiMonitorModal(true, this.loadedExtensions),
            onToggleAiMonitor: (show) => this.aiManager.toggleAiMonitorModal(show, this.loadedExtensions),
            onCloseGenius: () => this.blockGenius.hide()
        });

        this.simulatorManager.init();
        this.simulatorManager.loadBoard(this.boardId);
        this.loadAndRenderComponents();
        this.deviceFileManager.init();
        this.blockGenius.init();
        this.dashboardBuilder.init();
        this.initializePlotter();
        this.setupCommunicationListeners();
        this.setupResizer();

        const monacoPromise = this.initializeMonacoEditor(); 
        this.loadPyodide();

        const params = new URLSearchParams(window.location.search);
        const sharedProjectData = params.get('project_data');

        const dataLoadingPromise = (async () => {
            if (sharedProjectData) {
                await this.loadProjectFromURLData(sharedProjectData);
            } else {
                await Promise.all([
                    this.loadExtensionsFromCache(),
                    this.loadWorkspaceFromCache()
                ]);
            }
        })();

        window.addEventListener('codeUpdated', (event) => {
            this.codeWithBlockIds = event.detail; 
            this.currentCode = this.codeWithBlockIds.replace(/^\s*# block_id=.*\n/gm, '');
            if (this.monacoEditor) {
                this.monacoEditor.setValue(this.currentCode);
            }
            this.updateUI();
        });

        window.addEventListener('beforeunload', () => this.saveWorkspaceToCache());

        const simulatorCanvas = document.getElementById('simulator-canvas-container');
        simulatorCanvas.addEventListener('dragover', (e) => e.preventDefault());
        simulatorCanvas.addEventListener('drop', (e) => {
            e.preventDefault();
            const componentType = e.dataTransfer.getData('text/plain');
            const canvasRect = simulatorCanvas.getBoundingClientRect();
            const x = e.clientX - canvasRect.left;
            const y = e.clientY - canvasRect.top;
            if (componentType) {
                this.simulatorManager.addComponent(componentType, { x, y });
            }
        });

        await dataLoadingPromise;
        this.updateAiMonitorVisibility();
        this.updateDashboardVisibility();
        this.updatePlotterVisibility(); 

        setTimeout(() => {
            const loader = document.getElementById('app-loader');
            if(loader) loader.classList.add('loaded');
        }, 500);

        setTimeout(() => {
            if (!this.pyodide) {
                this.addConsoleMessage("Initializing background compiler...", "info");
                monacoPromise.then(() => {
                    if (this.currentCode) this.checkPythonSyntax();
                });
            }
        }, 1000);
    }

    updateEditorTheme() {
        if (!this.monacoEditor) return;
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        this.monacoEditor.updateOptions({ theme: currentTheme === 'dark' ? 'vs-dark' : 'vs' });
    }


    async checkPythonSyntax() {
        if (!this.monacoEditor || !this.pyodide) return;

        const code = this.monacoEditor.getValue();
        const model = this.monacoEditor.getModel();

        // 1. Clear previous errors
        monaco.editor.setModelMarkers(model, "python", []);

        // 2. Python script to check syntax without running
        const checkScript = `
import sys
try:
    compile(${JSON.stringify(code)}, 'main.py', 'exec')
    res = None
except SyntaxError as e:
    res = {'line': e.lineno, 'msg': e.msg, 'offset': e.offset}
except Exception as e:
    res = {'line': 1, 'msg': str(e), 'offset': 0}
res
`;

        try {
            // 3. Run check
            const result = await this.pyodide.runPythonAsync(checkScript);
            
            // 4. Map Python error to Monaco Marker
            if (result) {
                const jsResult = result.toJs(); // Convert PyProxy to JS Map
                const line = jsResult.get('line') || 1;
                const msg = jsResult.get('msg') || "Syntax Error";
                
                monaco.editor.setModelMarkers(model, "python", [{
                    startLineNumber: line,
                    startColumn: 1,
                    endLineNumber: line,
                    endColumn: 1000,
                    message: msg,
                    severity: monaco.MarkerSeverity.Error
                }]);
            }
        } catch (err) {
            // Internal Pyodide error (ignore)
        }
    }

    setupResizer() {
        const resizer = document.getElementById('layout-resizer');
        const container = document.querySelector('.ide-container');
        
        // Load saved width
        const savedWidth = localStorage.getItem('ideSidebarWidth');
        if (savedWidth) {
            container.style.setProperty('--sidebar-width', savedWidth);
            setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
        }

        let isResizing = false;
        let animationFrameId = null; // Helper for throttling

        const startResize = (e) => {
            e.preventDefault(); 

            isResizing = true;
            resizer.classList.add('active');
            document.body.classList.add('resizing');
            document.addEventListener('mousemove', resize);
            document.addEventListener('mouseup', stopResize);
        };

        const resize = (e) => {
            if (!isResizing) return;
            const newWidth = Math.max(300, Math.min(e.clientX, 800));
            container.style.setProperty('--sidebar-width', `${newWidth}px`);
            if (!animationFrameId) {
                animationFrameId = requestAnimationFrame(() => {
                    if (this.blocklyManager) Blockly.svgResize(this.blocklyManager.workspace);
                    if (this.simulatorManager) this.simulatorManager.fitToScreen();
                    animationFrameId = null;
                });
            }
        };

        const stopResize = () => {
            if (!isResizing) return;
            isResizing = false;
            
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }

            resizer.classList.remove('active');
            document.body.classList.remove('resizing');
            document.removeEventListener('mousemove', resize);
            document.removeEventListener('mouseup', stopResize);
            
            // Final save and resize to ensure everything is crisp
            const finalWidth = getComputedStyle(container).getPropertyValue('--sidebar-width');
            localStorage.setItem('ideSidebarWidth', finalWidth);
            
            // One final force resize to align everything perfectly
            if (this.blocklyManager) Blockly.svgResize(this.blocklyManager.workspace);
            if (this.simulatorManager) this.simulatorManager.fitToScreen();
            window.dispatchEvent(new Event('resize'));
        };

        resizer.addEventListener('mousedown', startResize);
    }

    async initializeMonacoEditor() {
        // --- AUTO-COMPLETE REGISTRATION ---
        monaco.languages.registerCompletionItemProvider('python', {
            provideCompletionItems: (model, position) => {
                const textUntilPosition = model.getValueInRange({
                    startLineNumber: position.lineNumber,
                    startColumn: 1,
                    endLineNumber: position.lineNumber,
                    endColumn: position.column
                });

                const word = model.getWordUntilPosition(position);
                const range = {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: word.startColumn,
                    endColumn: word.endColumn
                };

                let suggestions = [];

                // 1. Check for Dot Trigger (e.g., "pin.")
                if (textUntilPosition.endsWith('.')) {
                    // Return instance methods
                    suggestions = MICROPYTHON_SUGGESTIONS['.'].map(item => ({
                        label: item.label,
                        kind: monaco.languages.CompletionItemKind.Method,
                        documentation: item.detail,
                        insertText: item.insertText,
                        insertTextRules: item.insertTextRules || monaco.languages.CompletionItemInsertTextRule.None,
                        range: range
                    }));
                } 
                // 2. Check for Module Imports (e.g., "import mach")
                else if (textUntilPosition.includes('import ')) {
                    suggestions = MICROPYTHON_SUGGESTIONS['import'].map(mod => ({
                        label: mod,
                        kind: monaco.languages.CompletionItemKind.Module,
                        insertText: mod,
                        range: range
                    }));
                } 
                // 3. Global Scope Suggestions
                else {
                    // Add Modules
                    Object.keys(MICROPYTHON_SUGGESTIONS).forEach(key => {
                        if (key !== '.' && key !== 'import') {
                            // Add the module itself
                            suggestions.push({
                                label: key,
                                kind: monaco.languages.CompletionItemKind.Module,
                                insertText: key,
                                range: range
                            });
                            
                            // Add the module's contents (simple fuzzy match)
                            MICROPYTHON_SUGGESTIONS[key].forEach(item => {
                                suggestions.push({
                                    label: item.label,
                                    kind: monaco.languages.CompletionItemKind.Class,
                                    documentation: item.detail,
                                    insertText: item.insertText,
                                    insertTextRules: item.insertTextRules || monaco.languages.CompletionItemInsertTextRule.None,
                                    range: range
                                });
                            });
                        }
                    });
                    
                    // Add Keywords
                    ['if', 'else', 'elif', 'while', 'for', 'def', 'class', 'try', 'except', 'return', 'global', 'True', 'False', 'None'].forEach(kw => {
                        suggestions.push({
                            label: kw,
                            kind: monaco.languages.CompletionItemKind.Keyword,
                            insertText: kw,
                            range: range
                        });
                    });
                }

                return { suggestions: suggestions };
            },
            triggerCharacters: ['.'] // Trigger on dot
        });

        // --- EDITOR CREATION (Existing Code) ---
        this.monacoEditor = monaco.editor.create(document.getElementById('monaco-editor-container'), {
            value: '# Connect to a device and start coding!',
            language: 'python',
            readOnly: false,
            fontFamily: 'Fira Code, monospace',
            fontSize: 15,
            lineHeight: 28,
            automaticLayout: true,
            minimap: { enabled: false },
            wordWrap: 'on',
            renderLineHighlight: 'all',
            // Enable suggestions
            quickSuggestions: true, 
            suggestOnTriggerCharacters: true
        });

        let debounceTimer;
        this.monacoEditor.onDidChangeModelContent(() => {
            this.currentCode = this.monacoEditor.getValue();
            this.updateUI(); // Updates button states

            // Debounce linting (wait 800ms after typing stops)
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                this.checkPythonSyntax();
            }, 800);
        });

        this.updateEditorTheme();
    }

    initializePlotter() {
        const ctx = document.getElementById('plotter-canvas').getContext('2d');
        const theme = document.documentElement.getAttribute('data-theme') || 'light';
        const fontColor = theme === 'dark' ? '#A0AEC0' : '#718096';
        
        // NEW: Store raw history separately for export
        this.plotterHistory = []; 
        this.plotterStartTime = Date.now();

        this.plotterChart = new Chart(ctx, {
            type: 'line',
            data: { labels: [], datasets: [] },
            options: {
                responsive: true, maintainAspectRatio: false,
                animation: false, // Performance optimization
                scales: { x: { ticks: { color: fontColor } }, y: { ticks: { color: fontColor } } },
                plugins: { legend: { display: true, labels: { color: fontColor } } }
            }
        });

        // Bind Export Button
        document.getElementById('plotter-export-btn').addEventListener('click', () => this.exportPlotterCsv());
    }

    addConsoleMessage(message, type) { this.uiManager.addConsoleMessage(message, type); }
    updateConnectionStatus(status) { this.uiManager.updateConnectionStatus(status); }
    showUploadModal(state) { this.uiManager.showUploadModal(state); }
    hideUploadModal() { this.uiManager.hideUploadModal(); }
    
    updateUI() {
        const hasCode = this.currentCode.trim().length > 0;
        const isConnected = this.commManager.isConnected();
        this.uiManager.updateButtonStates(hasCode, isConnected);
    }

    enableCodeButtons() { this.updateUI(); }
    disableCodeButtons() { this.updateUI(); }

    switchView(viewName) {
        if (viewName === 'code') {
            if (this.activeFile === 'main.py') {
                this.openFile('main.py');
            }
        }
        this.uiManager.switchView(viewName);
    }

    loadAndRenderComponents() {
        try {
            const components = componentsData.components;
            const categories = components.reduce((acc, comp) => {
                (acc[comp.category] = acc[comp.category] || []).push(comp);
                return acc;
            }, {});

            const paletteHtml = Object.entries(categories).map(([categoryName, comps]) => {
                const itemsHtml = comps.map(comp => {
                    let imagePath = comp.image;
                    const visualHtml = `<img src="${imagePath}" alt="${comp.name}" draggable="false">`;
                    return `
                        <div class="palette-component-item" draggable="true" data-component-id="${comp.id}">
                            ${visualHtml}
                            <div class="component-name">${comp.name}</div>
                        </div>
                    `;
                }).join('');
                return `<div class="category-title">${categoryName}</div><div class="category-grid">${itemsHtml}</div>`;
            }).join('');
            
            this.ui.componentPalette.innerHTML = paletteHtml;
            this.ui.componentPalette.querySelectorAll('.palette-component-item').forEach(item => {
                item.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', e.target.closest('.palette-component-item').dataset.componentId);
                });
            });
        } catch (error) {
            console.error("Error loading components:", error);
        }
    }

    setupCommunicationListeners() {
        this.commManager.on('status', () => this.addConsoleMessage('Connecting...', 'info'));
        this.commManager.on('connected', (detail) => {
            this.comm = this.commManager.getActiveComm();
            this.addConsoleMessage(detail.message, 'success');
            this.enableCodeButtons();
            this.uiManager.updateConnectionButtons(true, detail.type);
            
            if (this.isAutoReconnecting) {
                this.isAutoReconnecting = false;
                this.hideUploadModal(); // Ensure modal is gone
            }
        });
        
        this.commManager.on('disconnected', (detail) => {
            if (this.isAutoReconnecting) {
                this.addConsoleMessage("Device rebooting...", "info");
                return; 
            }

            this.comm = null;
            if (detail.message) this.addConsoleMessage(detail.message, 'info');
            this.updateConnectionStatus('Disconnected');
            this.disableCodeButtons();
            this.uiManager.updateConnectionButtons(false);
            this.isLiveMode = false;
            this.ui.liveModeBtn.classList.remove('active');
            this.aiManager.stopAiVision();
            if (this.isCodeOnlyMode) {
                this.openFile('main.py');
                this.switchView('blocks');
            }
        });
        this.commManager.on('error', (msg) => this.addConsoleMessage(msg, 'error'));
        this.commManager.on('data', (data) => this.handleData(data));
    }

    sendConsoleCommand(command) {
        if (!this.commManager.isConnected()) return;
        this.commManager.sendData(command).catch(e => this.addConsoleMessage(`Error: ${e}`, 'error'));
        this.addConsoleMessage(`> ${command}`, 'input');
    }

    handleData(data) {
        let lineBuffer = this.lastDataBuffer + data;
        let newlineIndex;
        if (this.isWaitingForIpAfterSetup && (lineBuffer.includes('>>>') || lineBuffer.includes('Type "help()"'))) {
            if (!this._ipQuerySent) {
                this._ipQuerySent = true; 
                this.addConsoleMessage("ℹ️ Booted fast. Querying IP manually...", "info");
                this.commManager.sendData("\r\nimport network; w=network.WLAN(0); print('Network config:', w.ifconfig())\r\n");
                
                setTimeout(() => { this._ipQuerySent = false; }, 2000);
            }
        }

        while ((newlineIndex = lineBuffer.indexOf('\n')) !== -1) {
            const line = lineBuffer.slice(0, newlineIndex).trim();
            lineBuffer = lineBuffer.slice(newlineIndex + 1);
            if (this.isWaitingForIpAfterSetup) {
                const ipMatch = line.match(/Network config:\s*\('([^']+)'/);
                if (ipMatch && ipMatch[1] && ipMatch[1] !== '0.0.0.0') {
                    this.triggerAutoWifiTransition(ipMatch[1]);
                }
            }
            if (line.startsWith('plot:')) {
                this.addPlotterData(line);
            } else if (line.startsWith('AI_CMD:')) {
                this.aiManager.executeAiCommandFromBoard(line);
            } else if (line.includes('File "<stdin>", line')) {
                const errorMatch = line.match(/line (\d+)/);
                if (errorMatch && errorMatch[1]) {
                    this.handleErrorHighlighting(parseInt(errorMatch[1], 10));
                }
                this.addConsoleMessage(line, 'error');
            } else if (line) {
                if (!line.includes("print('Network config'")) {
                    this.addConsoleMessage(line, 'output');
                }
            }
        }
        this.lastDataBuffer = lineBuffer;
    }

    async triggerAutoWifiTransition(ip) {
        this.isWaitingForIpAfterSetup = false; 
        const password = this.tempSetupPassword;
        this.tempSetupPassword = null; 

        this.addConsoleMessage(`✅ IP Detected: ${ip}`, 'success');
        
        // UI Feedback
        if (this.ui.webReplIpInput) this.ui.webReplIpInput.value = ip;
        if (this.ui.webReplConnectPassword) this.ui.webReplConnectPassword.value = password;
        
        const connectBtn = this.ui.webReplConnectBtn;
        if (connectBtn) connectBtn.textContent = "🔌 Switching connection...";

        try {
            if (this.commManager.isConnected()) {
                await this.commManager.disconnect();
            }
            this.webReplCreds = { ip, password };
            
            if (connectBtn) connectBtn.textContent = "📡 Connecting to WebREPL...";
        
            await new Promise(r => setTimeout(r, 1500));

            await this.commManager.connectWebREPL(ip, password);
            this.ui.webReplModal.style.display = 'none';
            this.addConsoleMessage("🚀 Auto-connection successful!", "success");

        } catch (e) {
            this.addConsoleMessage(`Auto-connect failed: ${e.message}`, "error");
            if (connectBtn) {
                connectBtn.textContent = "Connect";
                connectBtn.disabled = false;
            }
        } finally {
            if (connectBtn && this.commManager.isConnected()) {
                connectBtn.textContent = "Connect";
                connectBtn.disabled = false;
            }
        }
    }

    addPlotterData(line) {
        if (!this.plotterChart) return;
        const parts = line.split(':');
        if (parts.length < 4 || parts[0] !== 'plot') return;
        
        const name = parts[1].replace(/"/g, '');
        const color = parts[2];
        const value = parseFloat(parts[3]);
        
        if (isNaN(value)) return;

        const timeSec = ((Date.now() - this.plotterStartTime) / 1000).toFixed(2);
        
        this.plotterHistory.push({
            time: timeSec,
            name: name,
            value: value
        });
        
        if (this.plotterHistory.length > 10000) this.plotterHistory.shift();
        let dataset = this.plotterChart.data.datasets.find(ds => ds.label === name);
        if (!dataset) {
            dataset = { 
                label: name, 
                data: new Array(this.plotterDataPointCount).fill(null), // Pad existing
                borderColor: color, 
                backgroundColor: `${color}33`, 
                borderWidth: 2, 
                pointRadius: 0, // Performance: hide points, just show line
                tension: 0.1,   // Performance: less smoothing
                fill: true 
            };
            this.plotterChart.data.datasets.push(dataset);
        }
        
        // Sync labels if this is a new tick
        if (this.plotterChart.data.labels.length <= this.plotterDataPointCount) {
             this.plotterChart.data.labels.push(this.plotterDataPointCount);
        }
        
        dataset.data.push(value);

        // Shift if too long
        if (dataset.data.length > this.MAX_PLOTTER_POINTS) {
            dataset.data.shift();
        }
        
        // Ensure labels match longest dataset
        const maxLen = Math.max(...this.plotterChart.data.datasets.map(d => d.data.length));
        while(this.plotterChart.data.labels.length > maxLen) {
             this.plotterChart.data.labels.shift();
        }
        while(this.plotterChart.data.labels.length < maxLen) {
             this.plotterChart.data.labels.push(this.plotterDataPointCount++);
        }

        this.plotterChart.update('none');
    }

    exportPlotterCsv() {
        if (!this.plotterHistory || this.plotterHistory.length === 0) {
            this.addConsoleMessage("No data to export.", "warning");
            return;
        }

        const rowMap = {};
        const allSeriesNames = new Set();

        this.plotterHistory.forEach(entry => {
            if (!rowMap[entry.time]) rowMap[entry.time] = {};
            rowMap[entry.time][entry.name] = entry.value;
            allSeriesNames.add(entry.name);
        });

        // 2. Build Header
        const seriesList = Array.from(allSeriesNames);
        let csvContent = "Time (s)," + seriesList.join(",") + "\n";

        // 3. Build Rows
        Object.keys(rowMap).sort((a, b) => parseFloat(a) - parseFloat(b)).forEach(time => {
            const row = [time];
            seriesList.forEach(name => {
                const val = rowMap[time][name];
                row.push(val !== undefined ? val : "");
            });
            csvContent += row.join(",") + "\n";
        });

        // 4. Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `plotter_data_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.addConsoleMessage("✅ Data exported to CSV", "success");
    }

    handleErrorHighlighting(lineNumber) {
        if (!this.currentCode || !this.blocklyManager) return;
        const codeLines = this.codeWithBlockIds.split('\n');
        let blockId = null;
        for (let i = lineNumber - 1; i >= 0; i--) {
            const line = codeLines[i];
            const match = line.match(/^\s*# block_id=([a-zA-Z0-9\-_!@#$%^&*()_=+.,'":;?/~`|{}[\]]+)/);
            if (match && match[1]) { blockId = match[1]; break; }
        }
        if (blockId) {
            this.addConsoleMessage(`Highlighting block for line ${lineNumber}.`, 'info');
            this.switchView('blocks');
            this.blocklyManager.workspace.highlightBlock(blockId);
        }
    }

    async saveWorkspaceToCache() {
        if (!this.blocklyManager?.workspace) return;
        try {
            if (this.activeFile !== 'main.py' && this.monacoEditor) {
                this.projectFiles[this.activeFile] = this.monacoEditor.getValue();
            }
            const workspaceJson = Blockly.serialization.workspaces.save(this.blocklyManager.workspace);
            this.projectFiles['main.py'] = JSON.stringify(workspaceJson);

            await saveWorkspace(this.projectName, this.projectFiles);
            
            const projects = await getAllProjects();
            const project = projects.find(p => p.name === this.projectName);
            if (project) {
                project.modifiedAt = Date.now();
                project.extensions = Array.from(this.loadedExtensions);
                project.dashboard = this.dashboardBuilder.getDashboardState();
                project.circuit = this.simulatorManager.getCircuitState();
                project.customModelLoaded = this.aiManager.isModelSuccessfullyLoaded; 
                project.customModelUrl = this.aiManager.customModelUrl;
                await saveProject(project);
            }
        } catch (e) { console.error('Auto-save failed:', e); }
    }

    async loadWorkspaceFromCache() {
        const projects = await getAllProjects();
        const project = projects.find(p => p.name === this.projectName);
        
        if (project) {
            if (project.customModelLoaded) {
                this.aiManager.isModelSuccessfullyLoaded = true;
                this.aiManager.customModelUrl = project.customModelUrl;
            }
            this.loadedExtensions.clear();
            if (Array.isArray(project.extensions)) {
                project.extensions.forEach(extId => this.addExtension(extId));
            }
            if (project.dashboard) this.dashboardBuilder.loadDashboardState(project.dashboard);
            if (project.circuit) {
                 const attemptLoad = () => {
                     if(this.simulatorManager.isReady) this.simulatorManager.loadCircuitState(project.circuit);
                     else setTimeout(attemptLoad, 100);
                 };
                 attemptLoad();
            }
        }

        const projectData = await getWorkspace(this.projectName);
        this.projectFiles = (projectData && typeof projectData === 'object') ? projectData : structuredClone(DEFAULT_PROJECT);
        
        this.renderFileTree();
        this.openFile('main.py');
        this.updateAiMonitorVisibility();
        this.updatePlotterVisibility();
    }

    async openFile(filePath) {
        if (this.activeFile !== filePath) await this.saveWorkspaceToCache();
        this.activeFile = filePath;
        const isBlockly = (filePath === 'main.py');
        
        document.getElementById('read-only-banner').style.display = 'none';
        
        // SAFETY CHECK: Only touch Monaco options if it exists
        if (this.monacoEditor) {
            this.monacoEditor.updateOptions({ readOnly: false });
        }
        
        this.ui.blocksViewBtn.disabled = !isBlockly;

        if (isBlockly) {
            this.isCodeOnlyMode = false;
            const workspace = this.blocklyManager.workspace;
            workspace.clear();
            const content = this.projectFiles['main.py'] || DEFAULT_PROJECT['main.py'];
            try {
                if (content.startsWith('{')) Blockly.serialization.workspaces.load(JSON.parse(content), workspace);
                else Blockly.Xml.domToWorkspace(Blockly.utils.xml.textToDom(content), workspace);
            } catch (e) { 
                console.error(e); 
                Blockly.Xml.domToWorkspace(Blockly.utils.xml.textToDom(DEFAULT_PROJECT['main.py']), workspace);
            }
            this.blocklyManager.generateCode();
        } else {
            this.isCodeOnlyMode = true;
            // SAFETY CHECK: Only set value if editor exists
            if (this.monacoEditor) {
                this.monacoEditor.setValue(this.projectFiles[filePath] || '');
            } else {
                // If user clicks a file before Monaco loads, retry briefly
                setTimeout(() => this.openFile(filePath), 100);
            }
        }
        this.renderFileTree();
    }

    async deleteFile(filePath) {
        if (!confirm(`Delete "${filePath}"?`)) return;
        if (this.activeFile === filePath) await this.openFile('main.py');
        delete this.projectFiles[filePath];
        await this.saveWorkspaceToCache();
        this.renderFileTree();
        this.addConsoleMessage(`Deleted "${filePath}"`, 'info');
    }

    async handleCreateNewFile() {
        const fileName = this.uiManager.elements.newFileNameInput.value.trim();
        if (!fileName || this.projectFiles[fileName]) return this.toastManager.show("Invalid or existing file.", "error");
        this.projectFiles[fileName] = `# New file: ${fileName}\n`;
        await this.saveWorkspaceToCache();
        this.uiManager.closeNewFileModal();
        this.renderFileTree();
        this.openFile(fileName);
        this.addConsoleMessage(`Created ${fileName}`, 'success');
    }

    renderFileTree(temporaryFile = null) {
        const container = document.getElementById('file-tree-container');
        container.innerHTML = '';
        const createItem = (filePath, isTemp) => {
            const itemEl = document.createElement('div');
            itemEl.className = `file-item ${filePath === this.activeFile ? 'active' : ''}`;
            itemEl.innerHTML = `<div class="file-item-icon"><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg></div><span class="file-item-name">${filePath}</span>`;
            if (!isTemp && filePath !== 'main.py' && filePath !== 'boot.py') {
                const delBtn = document.createElement('button');
                delBtn.className = 'file-delete-btn';
                delBtn.innerHTML = '&times;';
                delBtn.onclick = (e) => { e.stopPropagation(); this.deleteFile(filePath); };
                itemEl.appendChild(delBtn);
            }
            itemEl.onclick = () => { if (!isTemp) this.openFile(filePath); };
            return itemEl;
        };
        Object.keys(this.projectFiles).sort().forEach(fp => container.appendChild(createItem(fp, false)));
        if (temporaryFile) container.appendChild(createItem(temporaryFile, true));
    }

    async handleProjectRename() {
        const oldName = this.projectName;
        const newName = await new Promise(resolve => showCustomPrompt(`Rename project "${oldName}" to:`, oldName, resolve));
        if (!newName || newName.trim() === '' || newName === oldName) return;
        
        try {
            const allProjects = await getAllProjects();
            if (allProjects.some(p => p.name === newName)) return this.toastManager.show("Name already exists.", "error");
            
            const project = allProjects.find(p => p.name === oldName);
            const workspaceData = await getWorkspace(oldName);
            const extData = await getExtensions(oldName);
            
            await saveProject({ ...project, name: newName, modifiedAt: Date.now() });
            if (workspaceData) await saveWorkspace(newName, workspaceData);
            if (extData) await saveExtensions(newName, extData);
            await deleteProjectByName(oldName);
            
            this.projectName = newName;
            this.ui.projectName.textContent = newName;
            const newUrl = `${window.location.pathname}?project=${encodeURIComponent(newName)}&board=${this.boardId}`;
            window.history.pushState({ path: newUrl }, '', newUrl);
        } catch (e) { console.error(e); }
    }

    async handleProjectShare() {
        try {
            // 1. Ensure current state (including Monaco changes/Files) is saved to memory
            await this.saveWorkspaceToCache();

            const workspace = this.blocklyManager.workspace;
            const xml = Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(workspace));
            
            const projectData = {
                projectName: this.projectName,
                workspaceXML: xml,
                // 2. Include ALL files (e.g. libraries, extra .py files)
                projectFiles: this.projectFiles, 
                extensions: Array.from(this.loadedExtensions),
                dashboard: this.dashboardBuilder.getDashboardState(),
                circuit: this.simulatorManager.getCircuitState(),
                aiConfig: {
                    customModelLoaded: this.aiManager.isModelSuccessfullyLoaded,
                    customModelUrl: this.aiManager.customModelUrl
                }
            };
            const jsonString = JSON.stringify(projectData);
            const compressed = pako.deflate(jsonString);
            const base64Data = toBase64URL(compressed);
            const url = new URL(window.location.href);
            url.searchParams.delete('project');
            url.searchParams.set('board', this.boardId);
            url.searchParams.set('project_data', base64Data);
            await navigator.clipboard.writeText(url.toString());
            
            // 3. Explicit Visual Notification
            if (url.toString().length > 8000) {
                this.toastManager.show('Link copied! Warning: Project is large, link might be truncated by some apps.', 'warning', 6000);
                this.addConsoleMessage('Warning: Project is very large. Link might be too long for some browsers.', 'warning');
            } else {
                this.toastManager.show('Share link copied to clipboard!', 'success');
            }
            
            this.addConsoleMessage('✅ Full project snapshot copied to clipboard!', 'success');
            
        } catch (err) {
            console.error('Share failed:', err);
            this.toastManager.show('Failed to create share link.', 'error');
            this.addConsoleMessage(`Failed to generate link: ${err.message}`, 'error');
        }
    }

    async loadProjectFromURLData(encodedData) {
        try {
            const json = JSON.parse(pako.inflate(fromBase64URL(encodedData), { to: 'string' }));
            
            this.projectName = json.projectName || 'Shared-Project';
            this.ui.projectName.textContent = this.projectName;
            this.addConsoleMessage(`Loading shared project "${this.projectName}"...`, 'info');
            
            // 4. Restore extra files if present in the link
            if (json.projectFiles) {
                this.projectFiles = json.projectFiles;
            }

            this.loadedExtensions.clear();
            if (json.extensions) json.extensions.forEach(id => this.addExtension(id));
            const workspace = this.blocklyManager.workspace;
            workspace.clear();
            if (json.workspaceXML) {
                Blockly.Xml.domToWorkspace(Blockly.utils.xml.textToDom(json.workspaceXML), workspace);
            }
            if (json.dashboard) {
                this.dashboardBuilder.loadDashboardState(json.dashboard);
                this.dashboardBuilder.refreshGenerator();
            }
            if (json.circuit) {
                const attemptCircuitLoad = () => {
                    if (this.simulatorManager.isReady && this.simulatorManager.boardElement && this.simulatorManager.boardElement.offsetWidth > 0) {
                        this.simulatorManager.loadCircuitState(json.circuit);
                    } else {
                        setTimeout(attemptCircuitLoad, 100);
                    }
                };
                attemptCircuitLoad();
            }
            if (json.aiConfig && json.aiConfig.customModelLoaded && json.aiConfig.customModelUrl) {
                this.aiManager.loadAndTestInMonitor(json.aiConfig.customModelUrl);
            }
            
            // 5. Refresh File Explorer UI
            this.renderFileTree();

            setTimeout(() => {
                this.blocklyManager.generateCode(); // Update Python view
                this.updateUI();
                this.addConsoleMessage('✅ Project loaded successfully.', 'success');
                this.toastManager.show('Project loaded successfully!', 'success');
            }, 600);

        } catch (e) { 
            console.error("Load Error:", e);
            this.addConsoleMessage(`Error loading link: ${e.message}`, 'error');
            this.toastManager.show('Error loading shared project.', 'error');
            this.openFile('main.py'); 
        }
    }

    async exportProject() {
        // 1. Ensure latest state is saved
        await this.saveWorkspaceToCache();
        
        try {
            const zip = new JSZip();

            // 2. Capture Workspace XML for Metadata (Consistency with Share Logic)
            const workspace = this.blocklyManager.workspace;
            const xml = Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(workspace));

            const projectMetadata = {
                name: this.projectName,
                boardId: this.boardId,
                // Include XML in metadata for robust restoration
                workspaceXML: xml,
                extensions: Array.from(this.loadedExtensions),
                dashboard: this.dashboardBuilder.getDashboardState(),
                circuit: this.simulatorManager.getCircuitState(),
                aiConfig: {
                    customModelLoaded: this.aiManager.isModelSuccessfullyLoaded,
                    customModelUrl: this.aiManager.customModelUrl
                }
            };

            zip.file("project.json", JSON.stringify(projectMetadata, null, 2));

            // 3. Include ALL files (This includes 'lib/' folders, extra scripts, etc.)
            for (const [filePath, fileContent] of Object.entries(this.projectFiles)) {
                zip.file(filePath, fileContent);
            }

            // 4. Generate and Download
            const blob = await zip.generateAsync({ type: 'blob' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `${this.projectName}.zip`;
            document.body.appendChild(a); 
            a.click();
            document.body.removeChild(a);
            
            // 5. Visual Notification
            this.toastManager.show(`Project exported as ${this.projectName}.zip`, 'success');
            this.addConsoleMessage(`✅ Project exported as ${this.projectName}.zip`, 'success');
            
        } catch (e) { 
            console.error(e);
            this.toastManager.show(`Export failed: ${e.message}`, 'error');
            this.addConsoleMessage(`Export failed: ${e.message}`, 'error'); 
        }
    }

    // --- EXTENSIONS ---
    addExtension(extensionId) {
        if (this.loadedExtensions.has(extensionId)) return;
        if (extensionId === 'iot_dashboard') this.dashboardBuilder.setupDashboardBlocks();
        this.loadedExtensions.add(extensionId);
        this.blocklyManager.rebuildAndApplyToolbox(this.loadedExtensions, this.dashboardBuilder.getDashboardBlockDefinitions());
        this.saveExtensionsToCache();
        this.updateAiMonitorVisibility();
        this.updateDashboardVisibility();
    }

    removeExtension(extensionId) {
        if (!this.loadedExtensions.has(extensionId)) return;
        this.cleanupBlocksForExtension(extensionId);
        this.loadedExtensions.delete(extensionId);
        if (extensionId === 'iot_dashboard') this.dashboardBuilder.clearDashboardBlocks();
        this.blocklyManager.rebuildAndApplyToolbox(this.loadedExtensions, this.dashboardBuilder.getDashboardBlockDefinitions());
        this.saveExtensionsToCache();
        this.updateAiMonitorVisibility();
        this.updateDashboardVisibility();
        this.showExtensionModal();
    }

    cleanupBlocksForExtension(extensionId) {
        const types = EXTENSION_BLOCK_TYPES[extensionId];
        if (!types || !this.blocklyManager?.workspace) return;
        Blockly.Events.setGroup(true);
        this.blocklyManager.workspace.getAllBlocks(false).forEach(b => {
            if (types.includes(b.type)) b.dispose(true);
        });
        Blockly.Events.setGroup(false);
    }

    async saveExtensionsToCache() { await saveExtensions(this.projectName, Array.from(this.loadedExtensions)); }
    
    async loadExtensionsFromCache() {
        const saved = await getExtensions(this.projectName);
        if (saved) saved.forEach(id => this.addExtension(id));
    }

    showExtensionModal() {
        const list = this.ui.extensionList;
        list.innerHTML = '';
        const valid = this.availableExtensions.filter(ext => !ext.boards || ext.boards.includes(this.boardId));
        valid.forEach(ext => {
            const card = document.createElement('div');
            card.className = 'extension-card';
            if (this.loadedExtensions.has(ext.id)) {
                card.classList.add('added');
                card.innerHTML = `<div class="extension-card-icon" style="background-color: ${ext.color};">${ext.icon}</div><h3>${ext.name}</h3><p>${ext.description}</p><button class="btn danger remove-ext-btn">Remove</button>`;
                card.querySelector('.remove-ext-btn').addEventListener('click', (e) => { e.stopPropagation(); this.removeExtension(ext.id); });
            } else {
                card.innerHTML = `<div class="extension-card-icon" style="background-color: ${ext.color};">${ext.icon}</div><h3>${ext.name}</h3><p>${ext.description}</p>`;
                card.addEventListener('click', () => { this.addExtension(ext.id); this.ui.extensionModal.style.display = 'none'; });
            }
            list.appendChild(card);
        });
        this.ui.extensionModal.style.display = 'flex';
    }

    // --- INTERACTIVITY ---



    registerBlocklyContextMenu() {
        // 1. Run on Device
        if (!Blockly.ContextMenuRegistry.registry.getItem('run_block_on_device')) {
            Blockly.ContextMenuRegistry.registry.register({
                id: 'run_block_on_device',
                weight: 200,
                scopeType: Blockly.ContextMenuRegistry.ScopeType.BLOCK,
                displayText: "⚡ Run this block on device",
                preconditionFn: () => (this.isLiveMode && this.commManager.isConnected()) ? 'enabled' : 'hidden',
                callback: (scope) => this.executeBlockViaRepl(scope.block)
            });
        }

        // 2. Download Block Image
        if (!Blockly.ContextMenuRegistry.registry.getItem('download_block_image')) {
            Blockly.ContextMenuRegistry.registry.register({
                id: 'download_block_image',
                weight: 301,
                scopeType: Blockly.ContextMenuRegistry.ScopeType.BLOCK,
                displayText: "📸 Download Block (Transparent)",
                preconditionFn: () => 'enabled',
                callback: (scope) => {
                    setTimeout(() => {
                        this.captureBlock(scope.block);
                    }, 100);
                }
            });
        }
        
    }

// --- SCREENSHOT & EXPORT LOGIC ---

    inlineSvgStyles(source, target) {
        const computed = window.getComputedStyle(source);
        const properties = [
            "fill", "fill-opacity", 
            "stroke", "stroke-width", "stroke-opacity", "stroke-linecap", "stroke-linejoin", 
            "font-family", "font-size", "font-weight", 
            "visibility", "display", "opacity", 
            "dominant-baseline", "text-anchor"
        ];

        for (const prop of properties) {
            const val = computed.getPropertyValue(prop);
            if (val && val !== 'none' && val !== 'auto' && val !== 'inherit') {
                target.style.setProperty(prop, val);
            }
        }

        target.style.setProperty("shape-rendering", "geometricPrecision");
        target.style.setProperty("text-rendering", "geometricPrecision");

        if (source.tagName === 'text' || source.tagName === 'tspan') {
            if (!target.style.fontFamily) target.style.fontFamily = "sans-serif";
            if (!target.style.fontWeight) target.style.fontWeight = "bold";
            const fill = computed.getPropertyValue("fill");
            if (!fill || fill === 'none' || fill === 'rgba(0, 0, 0, 0)') {
                target.style.fill = '#ffffff'; 
            }
        }

        for (let i = 0; i < source.children.length; i++) {
            if (target.children[i]) {
                this.inlineSvgStyles(source.children[i], target.children[i]);
            }
        }
    }

    captureWorkspace(workspace) {
        try {
            const canvasGroup = workspace.getCanvas(); 
            const bBox = canvasGroup.getBBox();

            if (bBox.width === 0 || bBox.height === 0) {
                this.toastManager.show("Workspace is empty.", "warning");
                return;
            }
            const padding = 20;
            const width = bBox.width + (padding * 2);
            const height = bBox.height + (padding * 2);
            const x = bBox.x - padding;
            const y = bBox.y - padding;
            const svg = workspace.getParentSvg();
            const clone = svg.cloneNode(true);
            this.inlineSvgStyles(svg, clone);
            clone.setAttribute('viewBox', `${x} ${y} ${width} ${height}`);
            clone.setAttribute('width', width);
            clone.setAttribute('height', height);
            clone.style.backgroundColor = 'transparent'; 
            const blockCanvas = clone.querySelector('.blocklyBlockCanvas');
            if(blockCanvas) blockCanvas.removeAttribute('transform');
            const bubbleCanvas = clone.querySelector('.blocklyBubbleCanvas');
            if(bubbleCanvas) bubbleCanvas.removeAttribute('transform');
            this.rasterizeSvg(clone, width, height, 3, `${this.projectName}_code.png`);
        } catch (e) {
            console.error("Export Error:", e);
            this.addConsoleMessage(`Export failed: ${e.message}`, "error");
        }
    }

    captureBlock(block) {
        try {
            const bBox = block.getSvgRoot().getBBox();
            const padding = 10;
            const width = bBox.width + (padding * 2);
            const height = bBox.height + (padding * 2);
            const blockGroup = block.getSvgRoot().cloneNode(true);
            this.inlineSvgStyles(block.getSvgRoot(), blockGroup);
            blockGroup.removeAttribute('transform');
            blockGroup.setAttribute('transform', `translate(${padding}, ${padding})`);
            const workspaceSvg = block.workspace.getParentSvg();
            const defs = workspaceSvg.querySelector('defs').cloneNode(true);
            const wrapperSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            wrapperSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
            wrapperSvg.setAttribute("width", width);
            wrapperSvg.setAttribute("height", height);
            wrapperSvg.setAttribute("viewBox", `0 0 ${width} ${height}`);
            wrapperSvg.appendChild(defs);
            wrapperSvg.appendChild(blockGroup);
            this.rasterizeSvg(wrapperSvg, width, height, 3, `${block.type}.png`);
        } catch (e) {
            this.addConsoleMessage(`Block Snapshot failed: ${e.message}`, "error");
        }
    }

    rasterizeSvg(svgNode, width, height, scaleFactor, filename) {
        const serializer = new XMLSerializer();
        let svgString = serializer.serializeToString(svgNode);
        if (!svgString.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
            svgString = svgString.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
        }
        const fallbackCSS = `
            <style>
                .blocklyText { font-family: sans-serif; font-weight: bold; font-size: 11pt; fill: #ffffff; }
                .blocklyPath { fill: none; stroke: #000; stroke-width: 1px; }
                text { font-family: sans-serif; }
            </style>
        `;
        svgString = svgString.replace('>', '>' + fallbackCSS);
        const img = new Image();
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = width * scaleFactor;
            canvas.height = height * scaleFactor;
            const ctx = canvas.getContext('2d');
            ctx.scale(scaleFactor, scaleFactor);
            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0);
            const a = document.createElement('a');
            a.download = filename;
            a.href = canvas.toDataURL('image/png');
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        };
        img.src = url;
    }

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    handleLiveModeToggle() {
        if (!this.commManager.isConnected()) return;
        this.isLiveMode = !this.isLiveMode;
        this.ui.liveModeBtn.classList.toggle('active', this.isLiveMode);
        if (this.isLiveMode) {
            this.addConsoleMessage("⚡ Live Mode Activated", "info");
            this.commManager.sendData('\x03'); 
        }
    }

    async executeBlockViaRepl(block) {
        if (!this.isLiveMode || !this.commManager.isConnected()) return;
        this.pythonGenerator.isLiveMode = true;
        let code = this.pythonGenerator.blockToCode(block, true);
        this.pythonGenerator.isLiveMode = false;
        if (!code) return;
        if (block.outputConnection && !code.includes('\n')) code = `print(${code})`;
        this.addConsoleMessage(`>>> (Live) ${code.trim()}`, "input");
        try {
            await this.commManager.sendData('\x05'); 
            await new Promise(r => setTimeout(r, 50));
            await this.commManager.sendData(code + '\r\n');
            await new Promise(r => setTimeout(r, 50));
            await this.commManager.sendData('\x04');
        } catch (e) { this.addConsoleMessage(`Error: ${e.message}`, 'error'); }
    }

    openTutorialModal() {
        this.ui.tutorialList.innerHTML = '';
        tutorials.forEach(tut => {
            if (!tut.steps.length) return;
            const card = document.createElement('div');
            card.className = 'extension-card';
            card.innerHTML = `<div class="extension-card-icon" style="background-color: var(--accent-primary);">${tut.icon}</div><h3>${tut.title}</h3><p>${tut.description}</p>`;
            card.onclick = () => {
                this.ui.tutorialModal.style.display = 'none';
                const tour = new Shepherd.Tour({ useModalOverlay: true, defaultStepOptions: { classes: 'shadow-md bg-purple-dark', scrollTo: { behavior: 'smooth', block: 'center' }, cancelIcon: { enabled: true } } });
                tour.addSteps(tut.steps);
                tour.start();
            };
            this.ui.tutorialList.appendChild(card);
        });
        this.ui.tutorialModal.style.display = 'flex';
    }

    // --- DELEGATED FUNCTIONALITY ---
    loadCodeIntoEditor(fileName, code) {
        this.activeFile = fileName;
        this.isCodeOnlyMode = true;
        this.monacoEditor.setValue(code);
        this.monacoEditor.updateOptions({ readOnly: true });
        document.getElementById('read-only-banner').style.display = 'flex';
        this.ui.blocksViewBtn.disabled = true;
        this.renderFileTree(fileName);
        this.switchView('code');
        this.addConsoleMessage(`Loaded "${fileName}" (Read-Only)`, "info");
    }


    async uploadCodeToDevice() {
        if (!this.commManager.isConnected()) return this.toastManager.show("Device is not connected.", "error");
        
        this.aiManager.pauseAiStream();
        
        try { await this.commManager.sendData('\x03'); } catch(e){} 

        // Capture state before upload/reboot cycles
        const connType = this.commManager.getConnectionType();
        const wasWifi = (connType === 'wifi' && this.webReplCreds);
        const wasBle = (connType === 'ble');

        try {
            await this.saveWorkspaceToCache();
            if (this.blocklyManager) {
                this.pythonGenerator.connectionType = this.commManager.getConnectionType();
                this.blocklyManager.generateCode();
            }
            const files = { ...this.projectFiles };
            files['main.py'] = this.currentCode;

            if (this.currentCode.includes('import websocket_server') || this.currentCode.includes('websocket_server.')) {
                this.addConsoleMessage("📦 Auto-injecting 'websocket_server.py' for Dashboard...", "info");
                files['websocket_server.py'] = WEBSOCKET_SERVER_CODE;
            }

            this.showUploadModal('uploading');
            this.addConsoleMessage('Starting project sync...', 'info');
            
            await this.deviceFileManager.uploadProject(files);
            
            try {
                if (this.boardId === 'esp32') {
                    this.addConsoleMessage("Hard Resetting ESP32 (Clearing Pins)...", "info");
                    
                    // 1. Send Interrupt (Ctrl+C) to stop any lingering loops/output
                    await this.commManager.sendData('\x03'); 
                    await new Promise(r => setTimeout(r, 200)); // Wait for prompt
                    
                    // 2. Send Reset Command
                    await this.commManager.sendData('\r\nimport machine; machine.reset()\r\n');
                } else {
                    // Pico works fine with Soft Reset
                    await this.commManager.sendData('\x04'); 
                }
            } catch(e) {
                console.error("Reset failed", e);
            }
            
            
            this.showUploadModal('success');
            this.addConsoleMessage('✅ Sync complete! Rebooting...', 'success');
            setTimeout(() => this.hideUploadModal(), 1500);

            if (wasWifi || wasBle) {
                this.isAutoReconnecting = true;
                
                // Keep UI buttons disabled during background reconnect
                this.disableCodeButtons(); 

                // 1. Force Disconnect logic immediately to clear browser state
                if(this.commManager.isConnected()) {
                    this.commManager.disconnect().catch(() => {});
                }

                if (wasBle) {
                    // BLE REBOOT
                    const waitTime = 5500; 
                    this.addConsoleMessage(`♻️ Device rebooting (background)...`, "info");
                    
                    await new Promise(r => setTimeout(r, waitTime));

                    let reconnected = false;
                    for (let i = 1; i <= 3; i++) {
                        try {
                            this.addConsoleMessage(`Reconnecting BLE (${i}/3)...`, "info");
                            await this.commManager.reconnectBLE();
                            reconnected = true;
                            break;
                        } catch (e) {
                            // console.warn("Reconnect attempt failed", e);
                            await new Promise(r => setTimeout(r, 1500));
                        }
                    }
                    
                    this.isAutoReconnecting = false;
                    
                    if (reconnected) {
                        this.addConsoleMessage("✅ BLE Reconnected.", "success");
                        this.enableCodeButtons(); // Re-enable UI
                        this.updateConnectionStatus('Connected');
                    } else {
                        this.addConsoleMessage("⚠️ Auto-reconnect timed out.", "warning");
                        this.updateConnectionStatus('Disconnected');
                        this.disableCodeButtons();
                    }
                } 
                else if (wasWifi) {
                    // WIFI REBOOT
                    this.addConsoleMessage("♻️ Device rebooting (background)...", "info");
                    await new Promise(r => setTimeout(r, 4000));

                    let reconnected = false;
                    for (let i = 1; i <= 5; i++) {
                        try {
                            this.addConsoleMessage(`Reconnecting WiFi (${i}/5)...`, "info");
                            await this.commManager.connectWebREPL(this.webReplCreds.ip, this.webReplCreds.password);
                            reconnected = true;
                            break;
                        } catch (e) {
                            await new Promise(r => setTimeout(r, 2000));
                        }
                    }
                    this.isAutoReconnecting = false;
                    if (reconnected) {
                        this.enableCodeButtons();
                    } else {
                        this.addConsoleMessage("❌ Auto-reconnect failed.", "error");
                        this.updateConnectionStatus('Disconnected'); 
                        this.disableCodeButtons();
                    }
                }
            } else {
                // USB Mode
                setTimeout(() => this.hideUploadModal(), 1500);
            }

        } catch (e) {
            this.isAutoReconnecting = false;
            this.showUploadModal('error');
            this.addConsoleMessage(`❌ Upload failed: ${e.message}`, 'error');
            console.error(e);
            setTimeout(() => this.hideUploadModal(), 2000);
        } finally {
            this.aiManager.resumeAiStream();
            // Only update UI if we aren't in the middle of a background reconnect
            if (!this.isAutoReconnecting) {
                this.updateUI();
            }
        }
    }

    sendSimulatorData(data) {
        if (this.pyodide && this.isSimulationRunning) {
            try {
                // 1. Escape backslashes (for JSON)
                // 2. Escape single quotes
                // 3. Ensure Newline is passed as a character, not a line break in JS string
                const safeData = data
                    .replace(/\\/g, '\\\\')
                    .replace(/'/g, "\\'")
                    .replace(/\n/g, '\\n'); 
                
                this.pyodide.runPython(`_sim_inject_stdin('${safeData}')`);
            } catch (e) {
                console.warn("Sim Input Error:", e);
            }
        }
    }

    async loadPyodide() {
        if (this.pyodide || this.isPyodideLoading) return;
        this.isPyodideLoading = true;
        try {
            this.pyodide = await loadPyodide({ stdout: (txt) => this.handleData(txt + '\n') });
            const bridge = new HardwareBridge(this.simulatorManager);
            
            // EXPOSE BRIDGE TO GLOBAL SCOPE
            window.rawVirtualHardware = bridge.getVirtualHardware();
            
            await this.pyodide.runPythonAsync(`
                import sys
                import asyncio
                import time
                import json
                
                # --- CRITICAL FIX: Map 'ujson' to standard 'json' ---
                # This allows MicroPython code (import ujson) to run in Pyodide.
                sys.modules['ujson'] = json

                # --- INPUT SHIM FOR AI DATA (SIMULATOR) ---
                class SimStdin:
                    def __init__(self):
                        self.buffer = ""
                    
                    def write(self, data):
                        self.buffer += data
                        
                    def readline(self):
                        if '\\n' in self.buffer:
                            line, rest = self.buffer.split('\\n', 1)
                            self.buffer = rest
                            return line
                        return ''
                
                _sim_stdin_instance = SimStdin()
                sys.stdin = _sim_stdin_instance

                # Global function called by JS (sendSimulatorData) to push data
                def _sim_inject_stdin(data):
                    _sim_stdin_instance.write(data)

                # --- COMPATIBILITY SHIM for uselect ---
                class MockPoller:
                    def register(self, obj, flags=0): 
                        pass
                    
                    def poll(self, timeout=0):
                        # Check if our custom stdin buffer has a full line
                        if len(_sim_stdin_instance.buffer) > 0 and '\\n' in _sim_stdin_instance.buffer:
                            return [(sys.stdin, 1)] # 1 = POLLIN
                        return []

                class MockUSelect:
                    POLLIN = 1
                    def poll(self): return MockPoller()

                sys.modules['uselect'] = MockUSelect()
                
                from js import rawVirtualHardware
                from pyodide.ffi import to_js

                # ... (The rest of your Hardware Classes: Pin, ADC, PWM etc. remain exactly as they were) ...
                
                async def _sim_sleep(sec): await asyncio.sleep(float(sec))
                async def _sim_sleep_ms(ms): await asyncio.sleep(float(ms)/1000)

                class Pin:
                    def __init__(self, id, mode=-1, pull=-1): self.id=str(id); self._js=rawVirtualHardware.Pin.new(str(id),mode,pull)
                    def value(self, v=None): return self._js.value() if v is None else self._js.value(v)
                    def on(self): self._js.on()
                    def off(self): self._js.off()
                    def irq(self, trigger, handler): self._js.irq(trigger, handler)
                Pin.OUT=1; Pin.IN=0; Pin.PULL_UP=2; Pin.PULL_DOWN=1; Pin.IRQ_RISING=1; Pin.IRQ_FALLING=2

                class ADC:
                    def __init__(self, pin): self._js=rawVirtualHardware.ADC.new(pin._js)
                    def read_u16(self): return self._js.read_u16()
                    def read(self): return self._js.read()
                    def atten(self, a): pass
                ADC.ATTN_11DB=3

                class PWM:
                    def __init__(self, pin, freq=-1, duty=0): self._js=rawVirtualHardware.PWM.new(pin._js); self.freq(freq)
                    def duty(self, v=None): return self._js.duty(v) if v is not None else self._js.duty()
                    def duty_u16(self, v=None): return self._js.duty_u16(v) if v is not None else self._js.duty_u16()
                    def freq(self, v=None): return self._js.freq(v) if v is not None else self._js.freq()

                class I2C:
                    def __init__(self, id=-1, sda=None, scl=None, freq=400000): 
                        self.sda = sda
                        self.scl = scl
                    def writeto(self, addr, buf): pass
                    def readfrom(self, addr, nbytes): return b'\\x00'*nbytes
                
                class SoftI2C(I2C):
                    def __init__(self, sda, scl, freq=400000):
                        self.sda = sda
                        self.scl = scl

                class HCSR04:
                    def __init__(self, trigger_pin, echo_pin): self._js=rawVirtualHardware.HCSR04.new(trigger_pin._js, echo_pin._js)
                    def distance_cm(self): return self._js.distance_cm()
                    def distance_mm(self): return self._js.distance_mm()

                class DHT11:
                    def __init__(self, pin): self._js = rawVirtualHardware.DHT.new(pin._js)
                    def measure(self): self._js.measure()
                    def temperature(self): return self._js.temperature()
                    def humidity(self): return self._js.humidity()
                
                class DHTModule: pass
                dht_mod = DHTModule(); dht_mod.DHT11 = DHT11; sys.modules['dht'] = dht_mod

                class NeoPixel:
                    def __init__(self, pin, n): 
                        self.n = n; self.p = [(0,0,0)] * n
                        self._js = rawVirtualHardware.findNeoPixel(pin.id)
                    def __setitem__(self, i, v): self.p[i]=v
                    def __getitem__(self, i): return self.p[i]
                    def fill(self, c): self.p=[c]*self.n
                    def write(self): 
                        if self._js: self._js.update(to_js(self.p))

                class Machine: pass
                m=Machine(); m.Pin=Pin; m.ADC=ADC; m.PWM=PWM; m.I2C=I2C; m.SoftI2C=SoftI2C
                sys.modules['machine']=m
                
                h=Machine(); h.HCSR04=HCSR04; sys.modules['hcsr04']=h
                n=Machine(); n.NeoPixel=NeoPixel; sys.modules['neopixel']=n

                class SSD1306_I2C:
                    def __init__(self, width, height, i2c, addr=0x3c, external_vcc=False):
                        self.width = width
                        self.height = height
                        self._js = None
                        try:
                            sda_id = -1
                            scl_id = -1
                            if hasattr(i2c, 'sda') and hasattr(i2c.sda, 'id'):
                                sda_id = i2c.sda.id
                            if hasattr(i2c, 'scl') and hasattr(i2c.scl, 'id'):
                                scl_id = i2c.scl.id
                            self._js = rawVirtualHardware.findOLEDByPins(sda_id, scl_id)
                        except: pass

                    def fill(self, col):
                        if self._js: self._js.fill(int(col))
                    def pixel(self, x, y, col):
                        if self._js: self._js.pixel(int(x), int(y), int(col))
                    def text(self, string, x, y, col=1):
                        if self._js: self._js.text(str(string), int(x), int(y), int(col))
                    def line(self, x1, y1, x2, y2, col):
                        if self._js: self._js.line(int(x1), int(y1), int(x2), int(y2), int(col))
                    def rect(self, x, y, w, h, col, fill=False):
                        if self._js: self._js.rect(int(x), int(y), int(w), int(h), int(col), bool(fill))
                    def fill_rect(self, x, y, w, h, col):
                        self.rect(x, y, w, h, col, True)
                    def show(self): 
                        if self._js: self._js.show()
                    def poweron(self):
                        if self._js: self._js.power(True)
                    def poweroff(self):
                        if self._js: self._js.power(False)
                    def contrast(self, contrast):
                        if self._js: self._js.contrast(int(contrast))
                    def invert(self, invert):
                        if self._js: self._js.invert(int(invert))

                class SSD1306Module: pass
                ssd_mod = SSD1306Module()
                ssd_mod.SSD1306_I2C = SSD1306_I2C
                sys.modules['ssd1306'] = ssd_mod
            `);
            
            this.isPyodideLoading = false;
            this.ui.playPauseBtn.disabled = false;
            this.addConsoleMessage("✅ Simulation engine ready.", "success");
        } catch (e) { this.addConsoleMessage(`Sim Error: ${e.message}`, 'error'); }
    }

    runSimulation() {
        if (!this.pyodide) return;
        if (this.isSimulationRunning) return this.stopSimulation();
        
        this.isSimulationRunning = true;
        this.ui.playPauseBtn.innerHTML = '<svg viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>';
        this.ui.restartBtn.disabled = false;
        
        this.simulatorManager.reset();
        this.addConsoleMessage("▶️ Simulation Started", "info");

        let codeObj;
        if (this.uiManager.elements.codeViewBtn.classList.contains('active')) {
            codeObj = { setupCode: '', loopCode: this.monacoEditor.getValue(), loopDelay: 20 };
        } else {
            codeObj = this.blocklyManager.generator.workspaceToCode(this.blocklyManager.workspace);
        }

        const prepareAsyncCode = (code) => {
            return code
                .replace(/time\.sleep\(([^)]+)\)/g, "await _sim_sleep($1)")
                .replace(/time\.sleep_ms\(([^)]+)\)/g, "await _sim_sleep_ms($1)")
                .replace(/from hcsr04 import HCSR04/g, ''); 
        };

        const executeLoop = async () => {
            if (!this.isSimulationRunning) return;
            try {                
                const isManualLoop = codeObj.loopCode.includes('while True:');
                if (isManualLoop) {
                    await this.pyodide.runPythonAsync(prepareAsyncCode(codeObj.loopCode));
                    this.stopSimulation(); 
                } else {
                    let iterationCode = codeObj.loopCode;
                    if (iterationCode) {
                        iterationCode = iterationCode.replace(/^  /gm, "");
                    }
                    if (codeObj.setupCode && codeObj.setupCode.includes('def process_ai_data():')) {
                        iterationCode = 'process_ai_data()\n' + iterationCode;
                    }

                    await this.pyodide.runPythonAsync(prepareAsyncCode(iterationCode));
                    
                    if (this.isSimulationRunning) setTimeout(executeLoop, codeObj.loopDelay); 
                }
            } catch (e) {
                this.stopSimulation();
                if (!e.message.includes('KeyboardInterrupt')) this.addConsoleMessage(`Runtime Error: ${e}`, 'error');
            }
        };

        (async () => {
            try {
                if (codeObj.setupCode) await this.pyodide.runPythonAsync(prepareAsyncCode(codeObj.setupCode));
                executeLoop();
            } catch (e) {
                this.stopSimulation();
                this.addConsoleMessage(`Setup Error: ${e}`, 'error');
            }
        })();
    }

    stopSimulation() {
        if (!this.isSimulationRunning) return;
        this.isSimulationRunning = false;
        this.ui.playPauseBtn.innerHTML = '<svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
        this.ui.restartBtn.disabled = true;
        this.simulatorManager.reset();
        this.addConsoleMessage("⏹️ Simulation Stopped", "info");
    }
    
    toggleSimulatorFullscreen() {
        const container = document.querySelector('.ide-container');
        if (!container) return;
        const isFullscreen = container.classList.toggle('fullscreen-sim');
        this.ui.fullscreenBtn.innerHTML = isFullscreen ? 
            `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>` : 
            `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>`;
        this.ui.fullscreenBtn.title = isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen";        
        
        const performSmoothResize = () => {
            if (this.blocklyManager?.workspace) Blockly.svgResize(this.blocklyManager.workspace);
            if (this.simulatorManager) this.simulatorManager.fitToScreen();
        };
        requestAnimationFrame(performSmoothResize);
        setTimeout(performSmoothResize, 400); 
    }

    setupWorkspaceListeners() {
        if (!this.blocklyManager?.workspace) return;
        const ws = this.blocklyManager.workspace;
        
        // 1. Initial check on load
        if (this.orphanManager) this.orphanManager.runOrphanCheck();

        ws.addChangeListener((e) => {
            // Ignore UI events (clicks, scrolls)
            if (e.isUiEvent) return;

            // 2. Handle Genius Tips
            if (e.type === Blockly.Events.BLOCK_CREATE) {
                this.blockGenius.handleBlockCreate(ws.getBlockById(e.blockId)?.type);
            }

            // 3. Trigger Orphan Manager
            // We run this on almost every structural change
            if (e.type === Blockly.Events.BLOCK_MOVE || 
                e.type === Blockly.Events.BLOCK_CREATE || 
                e.type === Blockly.Events.BLOCK_DELETE ||
                e.type === Blockly.Events.FINISHED_LOADING) {
            }

            // 4. Code Generation (Debounced)
            clearTimeout(this.workspaceUpdateTimeout);
            this.workspaceUpdateTimeout = setTimeout(() => {
                this.aiManager.updateAiStateFromBlocks();
                this.updatePlotterVisibility(); 
                this.blocklyManager.generateCode();
                this.saveWorkspaceToCache();
            }, this.WORKSPACE_UPDATE_DEBOUNCE_MS);
        });
    }

    updatePlotterVisibility() {
        if (!this.blocklyManager?.workspace) {
            this.ui.plotterBtn.style.display = 'none';
            return;
        }
        const allBlocks = this.blocklyManager.workspace.getAllBlocks(false);
        const hasPlotterBlock = allBlocks.some(b => 
            b.isEnabled() && (b.type === 'comm_plot_simple' || b.type === 'comm_plot_advanced')
        );
        this.ui.plotterBtn.style.display = hasPlotterBlock ? 'flex' : 'none';
        if (!hasPlotterBlock && this.ui.plotterBtn.classList.contains('active')) {
            this.switchView('blocks');
        }
    }

    handleTestCustomModel(url) {
        if (!url || !url.startsWith('https://teachablemachine.withgoogle.com/models/')) 
            return this.toastManager.show("Invalid URL. Must be Teachable Machine.", "error");
        this.aiManager.loadAndTestInMonitor(url);
    }

    updateUIAfterModelLoad() {
        this.updateAiMonitorVisibility();
        this.blocklyManager.rebuildToolboxForCustomModel();
    }

    updateAiMonitorVisibility() {
        const hasAi = ['face_landmark', 'hand_gesture', 'image_classification', 'object_detection'].some(id => this.loadedExtensions.has(id));
        const hasCustom = this.loadedExtensions.has('custom_model') && this.aiManager.isModelSuccessfullyLoaded;
        this.ui.aiMonitorBtn.style.display = (hasAi || hasCustom) ? 'flex' : 'none';
    }

    updateDashboardVisibility() {
        this.ui.dashboardBtn.style.display = this.loadedExtensions.has('iot_dashboard') ? 'flex' : 'none';
    }


    exportBlocklyToPng(workspace) {
        try {
            // 1. Get the SVG XML
            const svg = workspace.getParentSvg();
            const serializer = new XMLSerializer();
            let source = serializer.serializeToString(svg);

            // 2. Fix Namespaces
            if(!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)){
                source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
            }
            if(!source.match(/^<svg[^>]+xmlns:xlink/)){
                source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
            }

            // 3. Inject Critical CSS 
            // (Canvas doesn't see external CSS, so we must inline basic styles or blocks appear broken)
            const style = `
            <style>
                .blocklyPath { fill: none; stroke: #000; }
                .blocklyText { font-family: sans-serif; font-size: 11pt; fill: #000; }
                .blocklyEditableText > rect { fill: #fff; fill-opacity: .6; stroke: none; }
                .blocklyNonEditableText > rect { fill: #fff; fill-opacity: .6; stroke: none; }
                .blocklyDraggable { display: block; }
                .blocklySvg { background-color: #fff; }
                text.blocklyText { fill: #000; }
            </style>`;
            
            // Insert style before closing defs or at start
            if (source.includes('</defs>')) {
                source = source.replace('</defs>', style + '</defs>');
            } else {
                source = source.replace('>', '>' + style);
            }

            // 4. Create Blob & Image
            const svgBlob = new Blob([source], {type: "image/svg+xml;charset=utf-8"});
            const svgUrl = URL.createObjectURL(svgBlob);
            const img = new Image();

            img.onload = () => {
                const canvas = document.createElement("canvas");
                // Capture current view dimensions
                const metrics = workspace.getMetrics();
                canvas.width = metrics.viewWidth;
                canvas.height = metrics.viewHeight;
                
                const ctx = canvas.getContext("2d");
                
                // Draw white background (transparency can look weird in PNGs)
                ctx.fillStyle = "#ffffff"; 
                ctx.fillRect(0,0, canvas.width, canvas.height);
                
                // Draw SVG
                ctx.drawImage(img, 0, 0);
                
                // Trigger Download
                const a = document.createElement("a");
                a.download = `${this.projectName}_blocks.png`;
                a.href = canvas.toDataURL("image/png");
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                
                URL.revokeObjectURL(svgUrl);
            };
            img.src = svgUrl;

        } catch(e) {
            console.error("Screenshot failed", e);
            this.addConsoleMessage("Screenshot failed: " + e.message, "error");
        }
    }

}