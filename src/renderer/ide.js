// src/renderer/ide.js (v3.4 - Efficient AI Data Transfer)
'use strict';

import vision from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/vision_bundle.js";
const { FaceLandmarker, GestureRecognizer, ImageClassifier, ObjectDetector, FilesetResolver, DrawingUtils } = vision;

const DEFAULT_WORKSPACE_XML = `
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="on_start" id="start_block" x="100" y="50"></block>
  <block type="forever" id="forever_block" x="100" y="220"></block>
</xml>`;

const EXTENSION_BLOCK_TYPES = {
    'face_landmark': [
        'face_landmark_enable', 
        'face_landmark_on_face_data', 
        'face_landmark_get_face_count', 
        'face_landmark_is_expression'
    ],
    'hand_gesture': [
        'hand_gesture_enable', 
        'hand_gesture_on_gesture', 
        'hand_gesture_get_hand_count', 
        'hand_gesture_is_hand_present'
    ],
    'image_classification': [
        'image_classification_enable', 
        'image_classification_is_class', 
        'image_classification_get_class'
    ],
    'object_detection': [
        'object_detection_enable', 
        'object_detection_is_object_detected', 
        'object_detection_for_each', 
        'object_detection_get_property'
    ],
    'iot_dashboard': [
        'dashboard_when_button_is',
        'dashboard_get_control_value',
        'dashboard_get_joystick_x',
        'dashboard_get_joystick_y',
        'dashboard_update_display',
        'dashboard_on_control_change',
        'dashboard_generated_html_content' 
    ]
};

class ESP32BlockIDE {
    constructor(boardId, projectName) {
        this.boardId = boardId;
        this.originalProjectName = projectName;
        this.projectName = projectName;
        this.currentCode = '';
        this.isEditingCode = false;
        this.serialComm = new SerialCommunication();
        this.workspaceUpdateTimeout = null;
        this.WORKSPACE_UPDATE_DEBOUNCE_MS = 250;
        this.boardImageMap = { 'esp32': 'src/renderer/assets/ESP32.png', 'pico': 'src/renderer/assets/Pico.png' };
        this.boardNameMap = { 'esp32': 'ESP32', 'pico': 'Pico' };
        this.consoleBuffer = [];
        this.isConsoleUpdateScheduled = false;
        this.CONSOLE_UPDATE_INTERVAL = 100;
        this.MAX_CONSOLE_LINES = 2000;
        this.plotterChart = null;
        this.plotterData = [];
        this.plotterLabels = [];
        this.plotterDataPointCount = 0;
        this.MAX_PLOTTER_POINTS = 50;
        this.isAiVisionRunning = false;
        this.faceLandmarker = null;
        this.gestureRecognizer = null;
        this.imageClassifier = null;
        this.objectDetector = null;
        this.lastAiSendTime = 0;
        this.AI_SEND_INTERVAL_MS = 100;
        this.aiRequestAnimationFrameId = null;
        this.isCameraOn = false;
        this.mediaStream = null;
        this.drawingUtils = null;
        this.sidebarCanvasCtx = null;
        this.aiMonitorCanvasCtx = null;
        this.aiRequirements = {
            needsFaceCount: false,
            needsBlendshapes: false,
            needsHands: false,
            needsGestures: false,
            needsClassification: false,
            needsObjectDetection: false
        };
        this.isAiMonitoringOnly = false;
        this.activeMonitorModel = null;
        this.loadedExtensions = new Set();
        this.availableExtensions = [
            { id: 'face_landmark', name: 'Face Landmark', description: 'Detect faces and expressions like smiling or blinking.', color: '#6d28d9', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 12a3 3 0 100-6 3 3 0 000 6z"/><path d="M20.9 19.8A10 10 0 103.1 4.2"/></svg>` },
            { id: 'hand_gesture', name: 'Hand Gestures', description: 'Recognize hand gestures like thumbs-up and pointing.', color: '#d97706', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>` },
            { id: 'image_classification', name: 'Image Classification', description: 'Identify the main object in the camera view (e.g., cat, dog, banana).', color: '#059669', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21 21-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z"/></svg>`},
            { id: 'object_detection', name: 'Object Detection', description: 'Find and locate multiple objects like people, cups, or laptops.', color: '#0891b2', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/></svg>` },
            { id: 'iot_dashboard',name: 'IoT Dashboard',description: 'Visually build a web dashboard to control your project.',color: '#4C51BF', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 7h-9a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z"/><path d="M4 17V5a2 2 0 0 1 2-2h11"/></svg>` },
        ];
        this.isLiveMode = false;
        this.geniusToastTimeout = null;
        


        this.blockGeniusTips = {
            'sensor_dht11': {
                title: 'DHT11 Sensor',
                description: 'This sensor measures temperature and humidity. Here is a common way to wire it.',
                image: 'src/renderer/assets/wiring/dht11.svg' // We will need to create this file
            },
            'display_oled_setup': {
                title: 'OLED Display',
                description: 'This block sets up a 128x64 OLED screen. Ensure the I2C pins match your wiring.',
                image: 'src/renderer/assets/wiring/oled.svg' // and this one
            },
            'sensor_ultrasonic_hcsr04': {
                title: 'Ultrasonic Sensor',
                description: 'The HC-SR04 measures distance. Make sure Trig and Echo pins are correct.',
                image: 'src/renderer/assets/wiring/hcsr04.svg' // and this one
            }
            // We can add more tips here for other hardware blocks
        };

        this.libraryFileMap = {
            'hcsr04': 'src/renderer/libs/hcsr04.py',
            'websocket_server': 'src/renderer/libs/websocket_server.py',
        };

        this.loadedExtensions = new Set();

        this.dashboardComponents = [];
        this.dashboardSelectedId = null;
        this.dashboardViewMode = 'laptop';
        this.dashboardNextId = 1;
        this.dashboardChartInstances = {};
        this.dashboardInitialized = false; 
        this.dashboardBlocks = [];
        this.dashboardBlocksDefined = false;
    }

    static async create(boardId, projectName) {
        const ide = new ESP32BlockIDE(boardId, projectName);
        await ide._initialize();
        return ide;
    }

    async _initialize() {
        this.initializeUI();
        this.setupEventListeners();
        this.initializePlotter();
        document.title = `${this.projectName} - ${this.boardId.toUpperCase()} | Block IDE`;

        await this.initializeBlockly();
        this.loadExtensionsFromCache();
        this.loadWorkspaceFromCache();
        this.setupWorkspaceListeners();
    }

    initializeUI() {
        this.ui = {
            projectName: document.getElementById('current-project-name'),
            projectTitleWrapper: document.getElementById('project-title-wrapper'),
            renameProjectBtn: document.getElementById('rename-project-btn'),
            headerBoardBadge: document.getElementById('header-board-badge'),
            boardImage: document.getElementById('board-image'),
            blocklyArea: document.getElementById('blocklyArea'),
            uploadBtn: document.getElementById('upload-code'),
            codeView: document.getElementById('code-view'),
            consoleView: document.getElementById('console-view'),
            consoleOutput: document.getElementById('console-output'),
            consoleInput: document.getElementById('console-input'),
            plotterView: document.getElementById('plotter-view'),
            connectBtn: document.getElementById('connect-device'),
            editCodeBtn: document.getElementById('edit-code-btn'),
            copyCodeBtn: document.getElementById('copy-code-btn'),
            uploadModal: document.getElementById('upload-status-modal'),
            uploadModalIcon: document.getElementById('upload-status-icon'),
            uploadModalMessage: document.getElementById('upload-status-message'),
            blocksViewBtn: document.getElementById('blocks-view-btn'),
            codeViewBtn: document.getElementById('code-view-btn'),
            consoleBtn: document.getElementById('console-btn'),
            plotterBtn: document.getElementById('plotter-btn'),
            extensionModal: document.getElementById('extension-modal'),
            extensionList: document.getElementById('extension-list'),
            extensionModalCloseBtn: document.getElementById('extension-modal-close-btn'),
            sidebarWebcam: document.getElementById('sidebar-webcam'),
            boardViewerContainer: document.getElementById('board-viewer-container'),
            toggleCamBtn: document.getElementById('toggle-cam-btn'),
            sidebarCanvas: document.getElementById('sidebar-canvas-overlay'),
            aiMonitorModal: document.getElementById('ai-monitor-modal'),
            aiMonitorHeader: document.getElementById('ai-monitor-header'),
            aiMonitorCloseBtn: document.getElementById('ai-monitor-close-btn'),
            aiMonitorCanvas: document.getElementById('ai-monitor-canvas'),
            aiMonitorDataOutput: document.getElementById('ai-monitor-data-output'),
            aiMonitorToggles: document.querySelectorAll('.ai-monitor-toggle'),
            aiMonitorBtn: document.getElementById('ai-monitor-btn'),
            liveModeBtn: document.getElementById('live-mode-btn'),
            geniusToast: document.getElementById('block-genius-toast'),
            geniusTitle: document.getElementById('genius-title'),
            geniusDescription: document.getElementById('genius-description'),
            geniusImage: document.getElementById('genius-image'),
            geniusCloseBtn: document.getElementById('genius-close-btn'),

            dashboardBtn: document.getElementById('dashboard-btn'),
            iotDashboardModal: document.getElementById('iot-dashboard-modal'),
            dashboardCloseBtn: document.getElementById('dashboard-close-btn'),
            dashboardCanvas: document.getElementById('dashboard-canvas'),
            dashboardClearBtn: document.getElementById('dashboard-clear-btn'),
            dashboardExportBtn: document.getElementById('dashboard-export-btn'),
            dashboardUpdateBtn: document.getElementById('update-properties'),
            dashboardDeleteBtn: document.getElementById('delete-component'),
            dashboardViewToggles: document.querySelectorAll('.view-toggle button'),
            propertiesContent: document.getElementById('properties-content'),
            noSelectionPrompt: document.getElementById('no-selection-prompt'),
            exportModal: document.getElementById('export-modal'),
            modalCloseBtn: document.getElementById('modal-close-btn'),
            copyHtmlBtn: document.getElementById('copy-html-btn'),
            copyMicroPythonBtn: document.getElementById('copy-micropython-btn'),

        };
        this.ui.projectName.textContent = this.projectName;
        this.ui.boardImage.src = this.boardImageMap[this.boardId] || this.boardImageMap['esp32'];
        this.ui.boardImage.alt = this.boardNameMap[this.boardId] || 'Microcontroller';
        this.sidebarCanvasCtx = this.ui.sidebarCanvas.getContext('2d');
        this.aiMonitorCanvasCtx = this.ui.aiMonitorCanvas.getContext('2d');
        this.drawingUtils = new DrawingUtils(this.sidebarCanvasCtx);
        this.ui.liveModeBtn.disabled = true;

        this.ui.lineNumbersGutter = document.getElementById('line-numbers-gutter');
        this.ui.codeContentWrapper = document.getElementById('code-content-wrapper');

        this.ui.dashboardBtn.addEventListener('click', () => this.showDashboardBuilder());
        this.ui.dashboardCloseBtn.addEventListener('click', () => { this.ui.iotDashboardModal.style.display = 'none'; });

        const boardName = this.boardNameMap[this.boardId] || 'Device';
        const uploadBtnText = this.ui.uploadBtn.querySelector('span');
        if (uploadBtnText) uploadBtnText.textContent = `Upload to ${boardName}`;
        if (this.ui.headerBoardBadge) this.ui.headerBoardBadge.textContent = boardName;
        this.updateConnectionStatus('Disconnected');
        this.disableCodeButtons();
        this.updateAiMonitorVisibility();
        this.updateDashboardVisibility();
        if (!this.serialComm.isSupported()) {
            this.ui.connectBtn.textContent = 'Browser Not Supported';
            this.ui.connectBtn.disabled = true;
            this.addConsoleMessage("Web Serial API not supported. Please use Google Chrome or Microsoft Edge.", "error");
        }
    }
        
     async initializeBlockly() {
        if (window.setupBlocklyForBoard) {
            await window.setupBlocklyForBoard(this.boardId); 
            Blockly.dialog.setPrompt(showCustomPrompt);
            Blockly.dialog.setConfirm(showCustomConfirm);

            this.registerBlocklyContextMenu();

        } else {
            console.error("Blockly init script not found.");
            this.addConsoleMessage("Fatal Error: Could not initialize block editor.", "error");
        }
    }

    setupWorkspaceListeners() {
        // REMOVED: The setTimeout wrapper is no longer needed.
        this.analyzeAiBlockUsage();

        if (window.blockyManagerInstance && window.blockyManagerInstance.workspace) {
            const workspace = window.blockyManagerInstance.workspace;
            workspace.addChangeListener((event) => {
                if (event.isUiEvent || event.type === Blockly.Events.FINISHED_LOADING) return;
                if (event.type === Blockly.Events.BLOCK_CREATE) {
                    const block = workspace.getBlockById(event.blockId);
                    if (block) {
                        this.handleBlockGenius(block.type);
                    }
                }                    
                const block = workspace.getBlockById(event.blockId);                    
                this.analyzeAiBlockUsage();
                const aiControlBlockTypes = [
                    'face_landmark_enable', 
                    'hand_gesture_enable', 
                    'image_classification_enable', 
                    'object_detection_enable'
                ];

                if (block && aiControlBlockTypes.includes(block.type) && 
                (event.type === Blockly.Events.BLOCK_CREATE || 
                (event.type === Blockly.Events.BLOCK_CHANGE && event.element === 'field'))) {
                    this.handleAiCameraBlock(block);
                }
                
                clearTimeout(this.workspaceUpdateTimeout);
                this.workspaceUpdateTimeout = setTimeout(() => {
                    if (window.blockyManagerInstance) {
                        window.blockyManagerInstance.generateCode();
                    }
                    this.saveWorkspaceToCache();
                }, this.WORKSPACE_UPDATE_DEBOUNCE_MS);
            });
        } else {
            console.error("CRITICAL: Could not attach workspace listeners because workspace is not ready.");
        }
    }

    updateLineNumbers() {
    if (!this.ui.lineNumbersGutter) return;
    const lineCount = this.currentCode.split('\n').length;
    const linesHtml = Array.from({ length: lineCount }, (_, i) => `<span>${i + 1}</span>`).join('');
    this.ui.lineNumbersGutter.innerHTML = linesHtml;
    }

    updateDashboardVisibility() {
    const hasDashboard = this.loadedExtensions.has('iot_dashboard');
    this.ui.dashboardBtn.style.display = hasDashboard ? 'flex' : 'none';
    }
    
    setupEventListeners() {
        document.getElementById('back-to-projects-btn').addEventListener('click', () => {
            this.stopAiVision();
            this.saveWorkspaceToCache();
            window.location.href = 'index.html';
        });

        this.ui.renameProjectBtn.addEventListener('click', () => this.handleProjectRename());

        this.ui.blocksViewBtn.addEventListener('click', () => this.switchView('blocks'));
        this.ui.codeViewBtn.addEventListener('click', () => this.switchView('code'));
        this.ui.connectBtn.addEventListener('click', () => this.handleDeviceConnection());
        this.ui.uploadBtn.addEventListener('click', () => this.uploadCodeToDevice());
        document.getElementById('save-project').addEventListener('click', () => this.exportProject());
        this.ui.consoleBtn.addEventListener('click', () => this.switchView('console'));
        this.ui.plotterBtn.addEventListener('click', () => this.switchView('plotter'));
        this.ui.aiMonitorBtn.addEventListener('click', () => this.toggleAiMonitorModal(true));
        this.ui.aiMonitorCloseBtn.addEventListener('click', () => this.toggleAiMonitorModal(false));

        this.ui.aiMonitorToggles.forEach(toggle => {
            toggle.addEventListener('click', () => {
                const model = toggle.dataset.model;
                let newColor = '';
                const allToggles = this.ui.aiMonitorToggles;
                const isActive = toggle.classList.contains('active');
                allToggles.forEach(t => {
                    t.classList.remove('active');
                    t.style.backgroundColor = '';
                    t.style.borderColor = '';
                });

                if (isActive) {
                    this.activeMonitorModel = null;
                    this.ui.aiMonitorHeader.style.borderColor = '';
                } else {
                    this.activeMonitorModel = model;
                    toggle.classList.add('active');
                    const extension = this.availableExtensions.find(ext => ext.id.startsWith(model));
                    if (extension) {
                        newColor = extension.color;
                        this.ui.aiMonitorHeader.style.borderColor = newColor;
                        toggle.style.backgroundColor = newColor;
                        toggle.style.borderColor = newColor;
                    }
                }
            });
        });

        document.getElementById('clear-console-btn').addEventListener('click', () => {
            this.ui.consoleOutput.innerHTML = '';
            this.consoleBuffer = []; 
            this.addConsoleMessage('Console cleared.', 'info');
        });

        this.ui.consoleInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendConsoleCommand(e.target.value + '\r\n');
                e.target.value = '';
            }
        });

        this.ui.codeContentWrapper.addEventListener('scroll', (e) => {
           if (this.ui.lineNumbersGutter) {
              this.ui.lineNumbersGutter.scrollTop = e.target.scrollTop;
            }
        });        

        window.addEventListener('codeUpdated', (event) => {
            this.currentCode = event.detail;
            const codePreview = document.getElementById('code-display-pre');
            if (codePreview) {
                codePreview.textContent = this.currentCode;
            }
            this.updateLineNumbers();
            this.updateUI();
        });

        this.ui.liveModeBtn.addEventListener('click', () => this.handleLiveModeToggle());
        this.ui.geniusCloseBtn.addEventListener('click', () => this.hideBlockGenius());
        
        this.ui.editCodeBtn.addEventListener('click', () => this.toggleCodeEditing());
        this.ui.copyCodeBtn.addEventListener('click', () => this.copyCodeToClipboard());
        this.ui.toggleCamBtn.addEventListener('click', () => this.handleCameraToggle());
        this.ui.extensionModalCloseBtn.addEventListener('click', () => { this.ui.extensionModal.style.display = 'none'; });

             
    }

initializeDashboard() {
    this.dashboardComponentConfig = {
        // Controls
        'button':   { props: ['general', 'text', 'appearance', 'layout', 'data', 'actions'], defaults: { width: 120, height: 40, label: 'Button', value: '1', shape: 'rounded', color: '#ffffff', bgColor: '#007aff', fontSize: 16, fontWeight: 700, borderRadius: 20 } },
        'slider':   { props: ['general', 'text', 'appearance', 'layout', 'data', 'actions'], defaults: { width: 200, height: 50, label: 'Slider', value: 50, min: 0, max: 100, color: '#007aff', bgColor: '#ffffff', borderRadius: 8 } },
        'toggle':   { props: ['general', 'text', 'appearance', 'layout', 'data', 'actions'], defaults: { width: 80, height: 50, label: 'Toggle', value: 1, min: 0, max: 1, color: '#34c759' } },
        'color-picker': { props: ['general', 'text', 'layout', 'data', 'actions'], defaults: { width: 150, height: 120, label: 'Color Picker', value: '#007aff' } },
        // FIXED: Added valueX: 0 and valueY: 0 to the joystick defaults to prevent NaN errors.
        'joystick': { props: ['general', 'text', 'layout', 'data', 'actions'], defaults: { width: 150, height: 150, label: 'Joystick', radius: 60, valueX: 0, valueY: 0 } },
        // Displays
        'gauge':    { props: ['general', 'text', 'appearance', 'layout', 'data', 'actions'], defaults: { width: 180, height: 150, value: 65, min: 0, max: 100, label: 'Gauge', color: '#007aff', fontSize: 14 } },
        'line-chart': { props: ['general', 'text', 'appearance', 'layout', 'data', 'actions'], defaults: { width: 300, height: 200, value: '30,50,45,65,70', options: 'Mon,Tue,Wed,Thu,Fri', label: 'History', color: '#007aff', bgColor: '#ffffff', borderRadius: 8 } },
        'led':      { props: ['general', 'text', 'appearance', 'layout', 'data', 'actions'], defaults: { width: 80, height: 80, value: 1, min: 0, max: 1, label: 'LED', colorOn: '#28a745', colorOff: '#555555' } },
        'card':     { props: ['general', 'text', 'appearance', 'layout', 'data', 'actions'], defaults: { width: 220, height: 120, value: 'Online', label: 'Device Status', icon: '✅', color: '#1c2a3a', bgColor: '#ffffff', fontSize: 32, fontWeight: 700, borderRadius: 8 } },
        'label':    { props: ['general', 'text', 'appearance', 'layout', 'actions'], defaults: { width: 250, height: 50, label: 'My Label', color: '#1c2a3a', fontSize: 18, fontWeight: 400, textAlign: 'left' } },
        // Layout & Text
        'container':{ props: ['general', 'appearance', 'layout', 'actions'], defaults: { width: 200, height: 150, bgColor: '#ffffff', borderColor: '#e5e7eb', borderRadius: 8 } },
        'heading':  { props: ['general', 'text', 'appearance', 'layout', 'actions'], defaults: { width: 250, height: 50, label: 'My Dashboard', color: '#1c2a3a', fontSize: 24, fontWeight: 700, textAlign: 'left' } },
        'paragraph':{ props: ['general', 'text', 'appearance', 'layout', 'actions'], defaults: { width: 250, height: 100, label: 'This is a description of the dashboard.', color: '#6b7280', fontSize: 14, fontWeight: 400, textAlign: 'left' } },
        'image':    { props: ['general', 'appearance', 'layout', 'data', 'actions'], defaults: { width: 150, height: 150, src: 'https://via.placeholder.com/150', borderRadius: 8 } }
    };

    // --- SETUP AND EVENT LISTENERS --- (No changes here)
    document.querySelectorAll('.palette .component-item').forEach(i => i.addEventListener('dragstart', e => e.dataTransfer.setData('text/plain', e.target.closest('.component-item').dataset.type)));
    this.ui.dashboardCanvas.addEventListener('dragover', e => e.preventDefault());
    this.ui.dashboardCanvas.addEventListener('drop', (e) => this.handleDashboardDrop(e));
    this.ui.dashboardViewToggles.forEach(b => b.addEventListener('click', () => this.setDashboardViewMode(b.dataset.view)));
    this.ui.dashboardClearBtn.addEventListener('click', () => this.clearDashboardCanvas());
    this.ui.dashboardExportBtn.addEventListener('click', () => this.generateAndApplyDashboard());
    this.ui.dashboardDeleteBtn.addEventListener('click', () => this.deleteSelectedComponent());
    document.addEventListener('click', (e) => { if (!e.target.closest('.dashboard-component, .properties-panel')) this.selectDashboardComponent(null); });
    this.ui.modalCloseBtn.addEventListener('click', () => this.ui.exportModal.style.display = 'none');
    this.ui.exportModal.addEventListener('click', (e) => { if (e.target === this.ui.exportModal) this.ui.exportModal.style.display = 'none'; });
    this.ui.copyMicroPythonBtn.addEventListener('click', () => this.copyExportCode('export-code-micropython', 'copy-micropython-btn'));
    this.ui.propertiesContent.addEventListener('input', () => {
        clearTimeout(this.workspaceUpdateTimeout);
        this.workspaceUpdateTimeout = setTimeout(() => this.updateSelectedComponentFromUI(), 50);
    });
    this.ui.propertiesContent.addEventListener('change', () => {
        this.updateSelectedComponentFromUI();
    });
    this.setDashboardViewMode('laptop');
    this.updateDashboardPropertiesPanel(null);
}

setDashboardViewMode(mode) {
    this.dashboardViewMode = mode;
    this.ui.dashboardViewToggles.forEach(b => b.classList.toggle('active', b.dataset.view === mode));
    this.ui.dashboardCanvas.className = `canvas ${mode}-view`;
    Object.values(this.dashboardChartInstances).forEach(chart => chart.destroy());
    this.dashboardChartInstances = {};

    let canvasTarget = this.ui.dashboardCanvas;
    if (mode === 'mobile') {
        if (!this.ui.dashboardCanvas.querySelector('.mobile-frame')) {
            this.ui.dashboardCanvas.innerHTML = '<div class="mobile-frame"><div class="mobile-frame-content"></div></div>';
        }
    } else {
        this.ui.dashboardCanvas.innerHTML = '';
    }
    this.renderAllDashboardComponents();
}

handleDashboardDrop(e) {
    e.preventDefault();
    const type = e.dataTransfer.getData('text/plain');
    if (!this.dashboardComponentConfig[type]) return;
    
    const canvasTarget = this.dashboardViewMode === 'mobile' ? this.ui.dashboardCanvas.querySelector('.mobile-frame-content') : this.ui.dashboardCanvas;
    const targetRect = canvasTarget.getBoundingClientRect();

    let x = e.clientX - targetRect.left;
    let y = e.clientY - targetRect.top;

    if(this.dashboardViewMode === 'laptop') {
        x -= (this.dashboardComponentConfig[type].defaults.width / 2);
        y -= (this.dashboardComponentConfig[type].defaults.height / 2);
    }
    
    // Rationale: By creating a unique ID from the start, we ensure all components are tracked properly.
    const id = `comp_${this.dashboardNextId++}`;
    const newComp = { id, type, x, y, ...structuredClone(this.dashboardComponentConfig[type].defaults) };
    
    // We add a new, unique ID property that the user can change for their code.
    newComp.id = `${type}_${this.dashboardNextId}`; 
    
    this.dashboardComponents.push(newComp);
    
    this.renderAllDashboardComponents(); // This re-renders everything, attaching all listeners correctly.
    this.selectDashboardComponent(id); // Select the newly created component.
}

renderAllDashboardComponents() {
    const canvasTarget = this.dashboardViewMode === 'mobile' ? this.ui.dashboardCanvas.querySelector('.mobile-frame-content') : this.ui.dashboardCanvas;
    canvasTarget.innerHTML = '';
    this.dashboardComponents.forEach(comp => canvasTarget.appendChild(this.renderDashboardComponent(comp)));
    if(this.dashboardSelectedId) {
        const el = document.getElementById(this.dashboardSelectedId);
        if(el) el.classList.add('selected');
    }
}

renderDashboardComponent(comp) {
    const el = document.createElement('div');
    el.id = comp.id;
    el.className = 'dashboard-component';
    el.style.cssText = `
        left:${comp.x}px; 
        top:${comp.y}px; 
        width:${comp.width}px; 
        height:${comp.height}px; 
        background-color: transparent; 
        border-radius: ${comp.borderRadius || 0}px;
        z-index:${this.dashboardNextId - parseInt(comp.id.split('_')[1])};
    `;
    el.innerHTML = this.getComponentHTML(comp) + '<div class="resize-handle"></div>';
    
    setTimeout(() => {
        if (['line-chart'].includes(comp.type)) {
            const chartCanvas = el.querySelector(`#chart-${comp.id}`);
            if (chartCanvas) this.initializeDashboardChart(chartCanvas, comp);
        }
    }, 0);

    this.addDashboardComponentInteractivity(el, comp);
    return el;
}

getComponentHTML(comp) {
    let inner = `<div class="component-preview" style="border-color: ${comp.borderColor || 'transparent'}; border-radius: ${comp.borderRadius || 0}px;">`;
    const { value, min, max, color, label, shape, colorOn, colorOff, radius, valueX, valueY, src, fontSize, fontWeight, textAlign, icon } = comp;

    switch(comp.type) {
        case 'button': inner += `<div class="button-preview shape-${shape}" style="background-color:${comp.bgColor}; color:${color}; font-size:${fontSize}px; font-weight:${fontWeight}; border-radius: ${comp.borderRadius}px;">${label}</div>`; break;
        case 'led': const ledOn = value == 1; const ledColor = ledOn ? colorOn : colorOff; inner += `<div class="led-preview ${ledOn ? 'on' : ''}" style="background-color:${ledColor}; --led-glow-color: ${ledColor};"></div><div class="label">${label}</div>`; break;
        case 'toggle': inner += `<div class="toggle-switch" style="background-color:${value == 1 ? color : '#ccc'};"><div class="thumb" style="transform: translateX(${value == 1 ? '22px' : '0'});"></div></div><div class="label">${label}</div>`; break;
        case 'slider': const percent = (max > min) ? (parseFloat(value) - min) / (max - min) * 100 : 0; inner += `<div class="slider-container"><div class="label" style="color:${color}; font-size:${fontSize}px;">${label}: ${value}</div><div class="slider-track"><div class="slider-thumb" style="background-color:${color}; left: ${percent}%;"></div></div></div>`; break;
        case 'color-picker': inner += `<div class="color-picker-preview"><label>${label}</label><input type="color" value="${value}"><div class="rgb-value">${value}</div></div>`; break;
        case 'joystick':inner += `<div class="joystick-base" style="width:${radius * 2}px; height:${radius * 2}px;"> <div class="joystick-stick" style="width:${radius * 0.6}px; height:${radius * 0.6}px;"></div> </div> <div class="label">${label} [x:${Math.round(valueX)}, y:${Math.round(valueY)}]</div>`;break;
        case 'card': inner += `<div class="card-preview"><div class="title" style="font-size: ${fontSize*0.5}px"><span class="icon">${icon}</span>${label}</div><div class="content" style="color:${color}; font-size: ${fontSize}px; font-weight: ${fontWeight};">${value}</div></div>`; break;
        case 'gauge': const circumference = Math.PI * 40; const progress = (parseFloat(value) - min) / (max - min); const offset = circumference * (1 - (progress * 0.5)); inner += `<div class="gauge-container"><svg viewBox="0 0 100 55" class="gauge-svg"><path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke-width="10" class="gauge-track" style="stroke: #e9ecef;" /><path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="${color}" stroke-width="10" class="gauge-value" style="stroke-dasharray:${circumference}; stroke-dashoffset:${offset};" /></svg><div class="gauge-text-container"><div style="font-weight:bold;font-size: ${fontSize*1.2}px;">${value}</div><div class="label" style="font-size: ${fontSize}px;">${label}</div></div></div>`; break;
        case 'line-chart': inner += `<canvas id="chart-${comp.id}"></canvas>`; break;
        case 'label':
        case 'heading': 
        case 'paragraph': inner += `<div style="color:${color}; font-size:${fontSize}px; font-weight:${fontWeight}; text-align:${textAlign}; width:100%; height: 100%; display: flex; align-items: center; justify-content: ${textAlign === 'center' ? 'center' : (textAlign === 'right' ? 'flex-end' : 'flex-start')}; white-space: pre-wrap;">${label}</div>`; break;
        case 'container': break; 
        case 'image': inner += `<img src="${src}" style="width:100%; height:100%; object-fit: cover; border-radius: ${comp.borderRadius}px;" alt="User Image">`; break;
        default: inner += `<div class="label">${label}</div>`;
    }
    return inner + '</div>';
}

addDashboardComponentInteractivity(el, comp) {
    el.addEventListener('click', e => { e.stopPropagation(); this.selectDashboardComponent(comp.id); });

    if (this.dashboardViewMode !== 'mobile') {
        this.makeDashboardComponentDraggable(el, comp);
        this.makeDashboardComponentResizable(el, comp);
    }

    const updateAndRerender = (skipProps = false) => {
        const oldEl = document.getElementById(comp.id);
        if (oldEl) {
            const newEl = this.renderDashboardComponent(comp);
            oldEl.replaceWith(newEl);
            if (this.dashboardSelectedId === comp.id) {
                newEl.classList.add('selected');
                if (!skipProps) this.updateDashboardPropertiesPanel(comp);
            }
        }
    };

    const joystickBase = el.querySelector('.joystick-base');
    if (joystickBase) {
        const stick = el.querySelector('.joystick-stick');
        const labelEl = el.querySelector('.label');

        const joyMoveHandler = (e) => {
            e.stopPropagation();
            const baseRect = joystickBase.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            let dx = clientX - (baseRect.left + baseRect.width / 2);
            let dy = clientY - (baseRect.top + baseRect.height / 2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            const maxDist = baseRect.width / 2 - stick.offsetWidth / 2;

            if (distance > maxDist) {
                dx = (dx / distance) * maxDist;
                dy = (dy / distance) * maxDist;
            }
            
            stick.style.transform = `translate(-50%, -50%) translate(${dx}px, ${dy}px)`;
            
            comp.valueX = Math.round((dx / maxDist) * 255);
            comp.valueY = Math.round((-dy / maxDist) * 255);
            if (labelEl) {
                labelEl.textContent = `${comp.label} [x:${comp.valueX}, y:${comp.valueY}]`;
            }
        };

        const joyEndHandler = () => {
            stick.style.transform = `translate(-50%, -50%)`;
            comp.valueX = 0;
            comp.valueY = 0;
            
            if (this.dashboardSelectedId === comp.id) {
                this.updateDashboardPropertiesPanel(comp);
                 if (labelEl) {
                    labelEl.textContent = `${comp.label} [x:0, y:0]`;
                }
            }
            
            document.removeEventListener('mousemove', joyMoveHandler);
            document.removeEventListener('mouseup', joyEndHandler);
            document.removeEventListener('touchmove', joyMoveHandler);
            document.removeEventListener('touchend', joyEndHandler);
        };

        joystickBase.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            document.addEventListener('mousemove', joyMoveHandler);
            document.addEventListener('mouseup', joyEndHandler);
        });

        joystickBase.addEventListener('touchstart', (e) => {
            e.stopPropagation();
            document.addEventListener('touchmove', joyMoveHandler);
            document.addEventListener('touchend', joyEndHandler);
        });
    }
}

makeDashboardComponentDraggable(el, comp) {
    el.addEventListener('mousedown', e => {
        // Ignore clicks on interactive elements
        if (e.target.matches('.resize-handle, input, select') || e.target.closest('.slider-thumb, .joystick-base, .toggle-switch, .color-picker-preview')) return;
        
        e.preventDefault();
        const startX = e.clientX, startY = e.clientY, startLeft = el.offsetLeft, startTop = el.offsetTop;
        el.style.zIndex = 1000;

        const onMouseMove = (moveEvent) => {
            el.style.left = `${startLeft + moveEvent.clientX - startX}px`;
            el.style.top = `${startTop + moveEvent.clientY - startY}px`;
        };
        const onMouseUp = () => {
            comp.x = el.offsetLeft;
            comp.y = el.offsetTop;
            el.style.zIndex = this.dashboardNextId - parseInt(comp.id.split('_')[1]);
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
}

makeDashboardComponentResizable(el, comp) {
    const handle = el.querySelector('.resize-handle');
    handle.addEventListener('mousedown', e => {
        e.stopPropagation();
        e.preventDefault();
        const startX = e.clientX, startY = e.clientY, startWidth = el.offsetWidth, startHeight = el.offsetHeight;
        
        const onMouseMove = (moveEvent) => {
            const newWidth = Math.max(80, startWidth + moveEvent.clientX - startX);
            const newHeight = Math.max(60, startHeight + moveEvent.clientY - startY);
            el.style.width = `${newWidth}px`;
            el.style.height = `${newHeight}px`;
            if (this.dashboardChartInstances[comp.id]) this.dashboardChartInstances[comp.id].resize();
        };
        const onMouseUp = () => {
            comp.width = el.offsetWidth;
            comp.height = el.offsetHeight;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            // Re-render non-chart components to fix any internal stretching issues
            if (!['line-chart'].includes(comp.type)) {
                 const newEl = this.renderDashboardComponent(comp);
                 el.replaceWith(newEl);
                 newEl.classList.add('selected');
            }
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
}

selectDashboardComponent(id) {
    if (this.dashboardSelectedId === id) return;
    if (this.dashboardSelectedId) {
        const oldEl = document.getElementById(this.dashboardSelectedId);
        if (oldEl) {
            oldEl.classList.remove('selected');
            oldEl.style.zIndex = this.dashboardNextId - parseInt(oldEl.id.split('_')[1]);
        }
    }
    this.dashboardSelectedId = id;
    const comp = this.dashboardComponents.find(c => c.id === id);
    if (id) {
        const newEl = document.getElementById(id);
        if (newEl) {
            newEl.classList.add('selected');
            newEl.style.zIndex = 1001;
        }
    }
    this.updateDashboardPropertiesPanel(comp);
}

updateDashboardPropertiesPanel(comp) {
    if (!comp) {
        this.ui.propertiesContent.querySelectorAll('.property-group').forEach(g => g.style.display = 'none');
        this.ui.noSelectionPrompt.style.display = 'flex';
        return;
    }
    this.ui.noSelectionPrompt.style.display = 'none';
    const config = this.dashboardComponentConfig[comp.type];
    this.ui.propertiesContent.querySelectorAll('.property-group').forEach(group => {
        group.style.display = config.props.includes(group.dataset.propGroup) ? 'block' : 'none';
    });

    const componentVisibleProps = {
        'button':       ['id', 'label', 'value', 'shape', 'color', 'bgColor', 'fontSize', 'fontWeight', 'borderRadius'],
        'slider':       ['id', 'label', 'value', 'min', 'max', 'color', 'fontSize'],
        'toggle':       ['id', 'label', 'value', 'min', 'max', 'color'],
        'color-picker': ['id', 'label', 'value'],
        'joystick':     ['id', 'label', 'radius', 'valueX', 'valueY'], 
        'gauge':        ['id', 'label', 'value', 'min', 'max', 'color', 'fontSize'],
        'led':          ['id', 'label', 'value', 'min', 'max', 'colorOn', 'colorOff'],
        'line-chart':   ['id', 'label', 'value', 'options', 'color', 'bgColor', 'borderRadius'],
        'card':         ['id', 'label', 'value', 'icon', 'color', 'bgColor', 'fontSize', 'fontWeight', 'borderRadius'],
        'label':        ['id', 'label', 'color', 'fontSize', 'fontWeight', 'textAlign'],
        'container':    ['id', 'bgColor', 'borderColor', 'borderRadius'],
        'heading':      ['id', 'label', 'color', 'fontSize', 'fontWeight', 'textAlign'],
        'paragraph':    ['id', 'label', 'color', 'fontSize', 'fontWeight', 'textAlign'],
        'image':        ['id', 'src', 'borderRadius']
    };
    
    this.ui.propertiesContent.querySelectorAll('.property-item').forEach(item => {
        const propName = item.dataset.prop;
        if(propName) {
            const isVisible = (componentVisibleProps[comp.type] || []).includes(propName);
            const input = document.getElementById(`prop-${propName}`);
            // RATIONALE: We make the value fields read-only as they are updated by interaction, not typing.
            if (input) input.readOnly = ['valueX', 'valueY'].includes(propName);
            item.style.display = isVisible ? 'flex' : 'none';
        }
    });
    
    for (const [key, value] of Object.entries(comp)) {
        const input = document.getElementById(`prop-${key}`);
        if (input) {
            input.type === 'checkbox' ? (input.checked = value) : (input.value = value);
        }
    }
}

updateSelectedComponentFromUI() {
    const comp = this.dashboardComponents.find(c => c.id === this.dashboardSelectedId);
    if (!comp) return;
    const previousShape = comp.shape;

    const fields = [
        'id', 'label', 'fontSize', 'fontWeight', 'textAlign', 'color', 'bgColor',
        'borderColor', 'borderRadius', 'shape', 'width', 'height', 'value', 'min',
        'max', 'src', 'colorOn', 'colorOff', 'icon', 'radius'
    ];
    
    fields.forEach(field => {
        const input = document.getElementById(`prop-${field}`);
        if (input && input.offsetParent !== null) {
             const isNumber = input.type === 'number';
             if (comp.hasOwnProperty(field)) {
                 comp[field] = isNumber ? parseFloat(input.value) || 0 : input.value;
             }
        }
    });
    if (comp.type === 'button') {
        const shapeChanged = comp.shape !== previousShape;
        if (comp.shape === 'circle') {
            comp.borderRadius = Math.min(comp.width, comp.height) / 2;
        } 
        else if (shapeChanged) {
            if (comp.shape === 'rounded') {
                comp.borderRadius = 20;
            } else { 
                comp.borderRadius = 4;
            }
        }
    }
    const updateAndRerender = (c) => {
        const oldEl = document.getElementById(c.id);
        if (oldEl) {
            const newEl = this.renderDashboardComponent(c);
            oldEl.replaceWith(newEl);
            if (this.dashboardSelectedId === c.id) {
                newEl.classList.add('selected');
            }
        }
    };
    
    updateAndRerender(comp);
    this.updateDashboardPropertiesPanel(comp);
}

deleteSelectedComponent() {
    if (!this.dashboardSelectedId || !confirm("Delete this component?")) return;
    this.dashboardComponents = this.dashboardComponents.filter(c => c.id !== this.dashboardSelectedId);
    if (this.dashboardChartInstances[this.dashboardSelectedId]) {
        this.dashboardChartInstances[this.dashboardSelectedId].destroy();
        delete this.dashboardChartInstances[this.dashboardSelectedId];
    }
    document.getElementById(this.dashboardSelectedId)?.remove();
    this.dashboardSelectedId = null;
    this.updateDashboardPropertiesPanel(null);
}

clearDashboardCanvas() {
    if (!confirm("Clear the entire canvas?")) return;
    this.dashboardComponents = [];
    this.dashboardSelectedId = null;
    Object.values(this.dashboardChartInstances).forEach(chart => chart.destroy());
    this.dashboardChartInstances = {};
    this.renderAllDashboardComponents();
    this.updateDashboardPropertiesPanel(null);
}

getDashboardControlOptions() {
    const controls = this.dashboardComponents.filter(c => ['button', 'toggle', 'slider', 'color-picker', 'joystick'].includes(c.type));
    if (controls.length === 0) return [['(no controls)', 'NONE']];
    // --- CHANGE THIS LINE ---
    // Change from: return controls.map(c => [c.label || c.id, c.id]);
    return controls.map(c => [c.id, c.id]);
}

getDashboardJoystickOptions() {
    const joysticks = this.dashboardComponents.filter(c => c.type === 'joystick');
    if (joysticks.length === 0) return [['(no joysticks)', 'NONE']];
    // --- CHANGE THIS LINE ---
    // Change from: return joysticks.map(c => [c.label || c.id, c.id]);
    return joysticks.map(c => [c.id, c.id]);
}

getDashboardDisplayOptions() {
    const displays = this.dashboardComponents.filter(c => ['led', 'gauge', 'label', 'card', 'line-chart'].includes(c.type));
    if (displays.length === 0) return [['(no displays)', 'NONE']];
    // --- CHANGE THIS LINE ---
    // Change from: return displays.map(c => [c.label || c.id, c.id]);
    return displays.map(c => [c.id, c.id]);
}

generateAndApplyDashboard() {
    this.addConsoleMessage("Generating dashboard code and blocks...", "info");

    const { micropythonString } = this.generateDashboardHTML();
    const htmlBlockType = 'dashboard_generated_html_content';
    micropythonGenerator.forBlock[htmlBlockType] = (block) => {
        return [micropythonString, micropythonGenerator.ORDER_ATOMIC];
    };
    
    const workspace = window.blockyManagerInstance.workspace;
    Blockly.Events.disable();
    try {
        let onRequestHandler = null;
        let sendResponseHandler = null;
        let existingHtmlBlock = null;

        const allBlocks = workspace.getAllBlocks(false);
        for (const block of allBlocks) {
            if (block.type === 'wifi_on_web_request') onRequestHandler = block;
            if (block.type === 'wifi_send_web_response') sendResponseHandler = block;
            if (block.type === 'dashboard_generated_html_content') existingHtmlBlock = block;
        }

        if (existingHtmlBlock) {
            existingHtmlBlock.dispose(true);
        }

        const newHtmlBlock = workspace.newBlock(htmlBlockType);
        newHtmlBlock.initSvg();
        newHtmlBlock.render();

        if (sendResponseHandler) {
            const htmlInput = sendResponseHandler.getInput('HTML');
            if (htmlInput && htmlInput.connection) {
                if (htmlInput.connection.targetBlock()) {
                    htmlInput.connection.targetBlock().dispose(true);
                }
                htmlInput.connection.connect(newHtmlBlock.outputConnection);
            }
        } 
        else if (onRequestHandler) {
            sendResponseHandler = workspace.newBlock('wifi_send_web_response');
            sendResponseHandler.initSvg();
            sendResponseHandler.render();
            onRequestHandler.getInput('DO').connection.connect(sendResponseHandler.previousConnection);
            sendResponseHandler.getInput('HTML').connection.connect(newHtmlBlock.outputConnection);
        } 
        else {
            onRequestHandler = workspace.newBlock('wifi_on_web_request');
            onRequestHandler.initSvg();
            onRequestHandler.render();
            sendResponseHandler = workspace.newBlock('wifi_send_web_response');
            sendResponseHandler.initSvg();
            sendResponseHandler.render();
            onRequestHandler.getInput('DO').connection.connect(sendResponseHandler.previousConnection);
            sendResponseHandler.getInput('HTML').connection.connect(newHtmlBlock.outputConnection);
            
            const startBlock = workspace.getBlocksByType('on_start', false)[0];
            if (startBlock) {
                 const pos = startBlock.getRelativeToSurfaceXY();
                 onRequestHandler.moveBy(pos.x, pos.y + 180);
            }
        }

    } finally {
        Blockly.Events.enable();
    }

    this.ui.iotDashboardModal.style.display = 'none';
    this.addConsoleMessage("✅ Dashboard blocks created and placed in your workspace!", "success");
}

generateDashboardHTML() {
    let bodyElements = '';
    let scriptLogic = '';
let styleAdditions = `
    .button-preview { 
        user-select: none; 
        -webkit-user-select: none; 
        overflow: hidden; /* Crucial for containing the ripple */
        position: relative; /* Crucial for positioning the ripple */
    }
    .ripple {
        position: absolute;
        border-radius: 50%;
        background-color: rgba(255, 255, 255, 0.6);
        transform: scale(0);
        animation: ripple-animation 0.6s linear;
        pointer-events: none; /* Make sure it doesn't interfere with clicks */
    }
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    .toggle-switch { width: 50px; height: 28px; border-radius: 14px; position: relative; cursor: pointer; background-color: #ccc; transition: background-color 0.3s; }
    .toggle-switch .thumb { position: absolute; width: 22px; height: 22px; background: white; border-radius: 50%; top: 3px; left: 3px; box-shadow: 0 1px 3px rgba(0,0,0,0.2); transition: transform 0.3s; }
    .joystick-base { background: #e0e0e0; border-radius: 50%; position: relative; cursor: grab; user-select: none; }
    .joystick-stick { background: #555; border-radius: 50%; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); pointer-events: none; }
    .joystick-label { margin-bottom: 10px; font-weight: 500; color: #555; }
    .led-light.on { box-shadow: 0 0 15px 3px var(--glow-color), inset 0 0 5px rgba(0,0,0,0.2); }
    .gauge-svg .gauge-track { stroke: #e9ecef; }
    .gauge-svg .gauge-value { transition: stroke-dashoffset 0.5s ease-out; }
`;

    this.dashboardComponents.forEach(comp => {
        const style = `position:absolute; left:${comp.x}px; top:${comp.y}px; width:${comp.width}px; height:${comp.height}px; background-color:${comp.bgColor || 'transparent'}; border-radius:${comp.borderRadius || 0}px; border: 1px solid ${comp.borderColor || 'transparent'}; display:flex; flex-direction:column; align-items:center; justify-content:center; box-sizing:border-box; padding:10px;`;

        switch (comp.type) {
            case 'button':
                bodyElements += `<div id="${comp.id}" class="button-preview" style="${style} color:${comp.color}; font-size:${comp.fontSize}px; font-weight:${comp.fontWeight}; cursor:pointer;">${comp.label}</div>`;
                scriptLogic += `
                    const btn_${comp.id} = document.getElementById('${comp.id}');
                    const sendPress_${comp.id} = (e) => { e.preventDefault(); applyRippleEffect(e); sendData('${comp.id}', '1'); };
                    const sendRelease_${comp.id} = (e) => { e.preventDefault(); sendData('${comp.id}', '0'); };
                    btn_${comp.id}.addEventListener('mousedown', sendPress_${comp.id});
                    btn_${comp.id}.addEventListener('mouseup', sendRelease_${comp.id});
                    btn_${comp.id}.addEventListener('mouseleave', sendRelease_${comp.id});
                    btn_${comp.id}.addEventListener('touchstart', sendPress_${comp.id}, {passive: false});
                    btn_${comp.id}.addEventListener('touchend', sendRelease_${comp.id});
                `;
                break;
            case 'toggle':
                bodyElements += `<div style="${style}"><div id="${comp.id}" class="toggle-switch"><div class="thumb"></div></div><label style="margin-top:5px; font-size:14px;">${comp.label}</label></div>`;
                scriptLogic += `
                    const tgl_${comp.id} = document.getElementById('${comp.id}');
                    tgl_${comp.id}.dataset.value = '${comp.value}';
                    const updateToggle_${comp.id} = () => {
                        const val = tgl_${comp.id}.dataset.value;
                        tgl_${comp.id}.style.backgroundColor = val == '1' ? '${comp.color}' : '#ccc';
                        tgl_${comp.id}.querySelector('.thumb').style.transform = val == '1' ? 'translateX(22px)' : 'translateX(0)';
                    };
                    tgl_${comp.id}.onclick = () => {
                        const newVal = tgl_${comp.id}.dataset.value == '1' ? '0' : '1';
                        tgl_${comp.id}.dataset.value = newVal;
                        updateToggle_${comp.id}();
                        sendData('${comp.id}', newVal);
                    };
                    updateToggle_${comp.id}();
                `;
                break;
            case 'slider':
                bodyElements += `<div style="${style}"><label>${comp.label}: <span id="val-${comp.id}">${comp.value}</span></label><input type="range" id="${comp.id}" min="${comp.min}" max="${comp.max}" value="${comp.value}" style="width: 80%;"></div>`;
                scriptLogic += `document.getElementById('${comp.id}').oninput = (e) => { document.getElementById('val-${comp.id}').textContent = e.target.value; sendData('${comp.id}', e.target.value); };\n`;
                break;
            case 'color-picker':
                bodyElements += `<div style="${style}"><label>${comp.label}</label><input type="color" id="${comp.id}" value="${comp.value}" style="width:80%; height: 50%; border:none; padding:0; background:transparent;"></div>`;
                scriptLogic += `document.getElementById('${comp.id}').oninput = (e) => sendData('${comp.id}', e.target.value);\n`;
                break;
case 'joystick':
     bodyElements += `<div style="${style}"><div id="label-${comp.id}" class="joystick-label">${comp.label} [x:0, y:0]</div><div id="${comp.id}" class="joystick-base" style="width:80%; height:80%; margin:auto;"><div class="joystick-stick" style="width:35%; height:35%;"></div></div></div>`;
     
     scriptLogic += `
        const joy_${comp.id} = document.getElementById('${comp.id}');
        const stick_${comp.id} = joy_${comp.id}.querySelector('.joystick-stick');
        const label_${comp.id} = document.getElementById('label-${comp.id}');
        let isDragging_${comp.id} = false;
        const joyMoveHandler_${comp.id} = (e) => {
            if (!isDragging_${comp.id}) return;
            e.preventDefault();
            const baseRect = joy_${comp.id}.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            let dx = clientX - (baseRect.left + baseRect.width / 2);
            let dy = clientY - (baseRect.top + baseRect.height / 2);
            const distance = Math.sqrt(dx*dx + dy*dy);
            const maxDist = baseRect.width / 2 - stick_${comp.id}.offsetWidth / 2;
            if (distance > maxDist) { dx = (dx / distance) * maxDist; dy = (dy / distance) * maxDist; }
            stick_${comp.id}.style.transform = \`translate(-50%, -50%) translate(\${dx}px, \${dy}px)\`;
            const xVal = Math.round((dx / maxDist) * 255);
            const yVal = Math.round((-dy / maxDist) * 255);
            if (label_${comp.id}) label_${comp.id}.textContent = \`${comp.label} [x:\${xVal}, y:\${yVal}]\`;
            sendData('${comp.id}', {x: xVal, y: yVal});
        };
        const joyEndHandler_${comp.id} = () => {
            if (!isDragging_${comp.id}) return;
            isDragging_${comp.id} = false;
            stick_${comp.id}.style.transform = 'translate(-50%, -50%)';
            if (label_${comp.id}) label_${comp.id}.textContent = \`${comp.label} [x:0, y:0]\`;
            sendData('${comp.id}', {x: 0, y: 0});
            document.removeEventListener('mousemove', joyMoveHandler_${comp.id});
            document.removeEventListener('mouseup', joyEndHandler_${comp.id});
            document.removeEventListener('touchmove', joyMoveHandler_${comp.id});
            document.removeEventListener('touchend', joyEndHandler_${comp.id});
        };
        joy_${comp.id}.addEventListener('mousedown', (e) => { isDragging_${comp.id} = true; document.addEventListener('mousemove', joyMoveHandler_${comp.id}); document.addEventListener('mouseup', joyEndHandler_${comp.id}); });
        joy_${comp.id}.addEventListener('touchstart', (e) => { isDragging_${comp.id} = true; document.addEventListener('touchmove', joyMoveHandler_${comp.id}); document.addEventListener('touchend', joyEndHandler_${comp.id}); });
    `;
    break;
            case 'led':
                bodyElements += `<div style="${style}"><div id="${comp.id}" class="led-light" data-color-on="${comp.colorOn}" data-color-off="${comp.colorOff}" style="width:40px; height:40px; border-radius:50%; background-color:${comp.colorOff}; --glow-color: ${comp.colorOn};"></div><label style="margin-top:8px;">${comp.label}</label></div>`;
                break;
            case 'gauge':
                bodyElements += `<div style="${style}"><svg viewBox="0 0 100 55" style="width:100%;"><path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke-width="10" class="gauge-track" /><path id="${comp.id}" class="gauge-value" data-min="${comp.min}" data-max="${comp.max}" d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="${comp.color}" stroke-width="10" style="stroke-dasharray:125.6; stroke-dashoffset:125.6;"/></svg><div style="position:absolute; bottom:10px; text-align:center;"><div id="val-${comp.id}" style="font-weight:bold;font-size:1.2em;">${comp.value}</div><label>${comp.label}</label></div></div>`;
                break;
             case 'label':
                 bodyElements += `<div style="${style} text-align:${comp.textAlign};"><h2 id="${comp.id}" style="margin:0; font-size:${comp.fontSize}px; font-weight:${comp.fontWeight}; color:${comp.color};">${comp.label}</h2></div>`;
                 break;
        }
    });

    const fullHtml = `<!DOCTYPE html><html><head><title>IoT Dashboard</title><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{font-family:sans-serif;background:#f0f4f8;}${styleAdditions}</style></head><body>${bodyElements}<script>let ws;function connect(){ws=new WebSocket('ws://'+window.location.host+'/ws');ws.onmessage=event=>{const data=JSON.parse(event.data);const el=document.getElementById(data.id);if(!el)return;const valEl=document.getElementById('val-'+data.id);if(data.prop==='value'){const val=data.value;if(el.classList.contains('led-light')){const isOn=val==1;el.classList.toggle('on',isOn);el.style.backgroundColor=isOn?el.dataset.colorOn:el.dataset.colorOff;}else if(el.classList.contains('gauge-value')){const min=parseFloat(el.dataset.min);const max=parseFloat(el.dataset.max);const progress=Math.max(0,Math.min(1,(val-min)/(max-min)));el.style.strokeDashoffset=125.6*(1-progress*0.5);if(valEl)valEl.textContent=val;}else{if(el.tagName==='H2')el.textContent=val;if(valEl)valEl.textContent=val;}}};ws.onclose=()=>setTimeout(connect,1000)}function applyRippleEffect(e){const btn=e.currentTarget;const circle=document.createElement("span");const diameter=Math.max(btn.clientWidth,btn.clientHeight);const radius=diameter/2;circle.style.width=circle.style.height=\`\${diameter}px\`;circle.style.left=\`\${e.clientX-(btn.offsetLeft+radius)}px\`;circle.style.top=\`\${e.clientY-(btn.offsetTop+radius)}px\`;circle.classList.add("ripple");const ripple=btn.getElementsByClassName("ripple")[0];if(ripple){ripple.remove()}btn.appendChild(circle)}function sendData(id,value){if(ws&&ws.readyState===WebSocket.OPEN){const payload={id:id};if(typeof value==='object'){payload.value=value.x;payload.y=value.y}else{payload.value=value}ws.send(JSON.stringify(payload))}}connect();${scriptLogic}</script></body></html>`;

    const singleLineHTML = fullHtml.replace(/\s{2,}/g, ' ').trim();
    const sanitizedHTML = singleLineHTML.replace(/"""/g, '""\\""');
    const micropythonString = `"""${sanitizedHTML}"""`;
    
    return { htmlString: fullHtml, micropythonString: micropythonString };
}

generateDashboardBlocks() {
    this.dashboardBlocks = [];
    const getDashboardOptions = (type, placeholderText) => {
        const components = this.dashboardComponents.filter(c => c.type === type);
        if (components.length === 0) {
            return [[`(no ${placeholderText})`, 'NONE']];
        }
        return components.map(c => [c.id, c.id]);
    };

    const genericEventBlock = {
    "type": "dashboard_on_control_change",
    "message0": "when dashboard control %1 changes",
    "args0": [{
        "type": "field_dropdown",
        "name": "CONTROL_ID",
        "options": () => {
            const controls = [
                ...getDashboardOptions('button', 'buttons'),
                ...getDashboardOptions('slider', 'sliders'),
                ...getDashboardOptions('toggle', 'toggles'),
                ...getDashboardOptions('color-picker', 'color pickers'),
                ...getDashboardOptions('joystick', 'joysticks')
            ];
            const validControls = controls.filter(opt => opt[1] !== 'NONE');
            return validControls.length > 0 ? validControls : [[`(no controls)`, 'NONE']];
        }
    }],
    "message1": "%1",
    "args1": [{ "type": "input_statement", "name": "DO" }],
    "style": "networking_blocks",
};
this.dashboardBlocks.push(genericEventBlock);

micropythonGenerator.forBlock['dashboard_on_control_change'] = function(block) {
    const statements_do = micropythonGenerator.statementToCode(block, 'DO') || `${micropythonGenerator.INDENT}pass\n`;
    const controlId = block.getFieldValue('CONTROL_ID');
    const funcName = micropythonGenerator.nameDB_.getDistinctName(`on_${controlId}_change_handler`, 'PROCEDURE');
    
    // This function now checks the previous and current state
    const func = `def ${funcName}():\n${statements_do}`;
    micropythonGenerator.functionNames_[funcName] = func;

    if (!micropythonGenerator.dashboardEventHandlers) {
        micropythonGenerator.dashboardEventHandlers = {};
    }
    // FIX: Ensure an array exists and push the new handler
    if (!micropythonGenerator.dashboardEventHandlers[controlId]) {
        micropythonGenerator.dashboardEventHandlers[controlId] = [];
    }
    micropythonGenerator.dashboardEventHandlers[controlId].push(funcName);
    
    return ''; // Hat block
};


    // 1. Button Block
    const buttonEventBlock = {
        "type": "dashboard_when_button_is",
        "message0": "when button %1 is %2",
        "args0": [
            { "type": "field_dropdown", "name": "CONTROL_ID", "options": () => getDashboardOptions('button', 'buttons') },
            { "type": "field_dropdown", "name": "STATE", "options": [["pressed", "1"], ["released", "0"]] }
        ],
        "message1": "%1", "args1": [{ "type": "input_statement", "name": "DO" }],
        "style": "networking_blocks", "tooltip": "Runs code when a dashboard button is pressed or released."
    };
    this.dashboardBlocks.push(buttonEventBlock);

micropythonGenerator.forBlock['dashboard_when_button_is'] = function(block) {
    const controlId = block.getFieldValue('CONTROL_ID');
    const state = block.getFieldValue('STATE');
    let statements_do = micropythonGenerator.statementToCode(block, 'DO');
    if (!statements_do) {
        statements_do = `${micropythonGenerator.INDENT}pass\n`;
    }

    const funcName = micropythonGenerator.nameDB_.getDistinctName(`on_${controlId}_state_${state}`, 'PROCEDURE');

    const func = `def ${funcName}():\n` +
                 `${micropythonGenerator.INDENT}if str(_dashboard_state.get('${controlId}')) == '${state}':\n` +
                 `${micropythonGenerator.INDENT}${statements_do}`;
    
    micropythonGenerator.functionNames_[funcName] = func;
    if (!micropythonGenerator.dashboardEventHandlers) {
        micropythonGenerator.dashboardEventHandlers = {};
    }
    if (!micropythonGenerator.dashboardEventHandlers[controlId]) {
        micropythonGenerator.dashboardEventHandlers[controlId] = [];
    }
    micropythonGenerator.dashboardEventHandlers[controlId].push(funcName);

    return ''; // Hat block
};

    // 2. Control Value Block (for Slider, Toggle, Color Picker)
    const valueBlock = {
        "type": "dashboard_get_control_value",
        "message0": "value of %1",
        "args0": [
            { "type": "field_dropdown", "name": "CONTROL_ID", "options": () => {
                const controls = [
                    ...getDashboardOptions('button', 'buttons'),
                    ...getDashboardOptions('slider', 'sliders'), 
                    ...getDashboardOptions('toggle', 'toggles'), 
                    ...getDashboardOptions('color-picker', 'color pickers')
                ];
                // Filter out the placeholder if other valid controls exist
                const validControls = controls.filter(opt => opt[1] !== 'NONE');
                return validControls.length > 0 ? validControls : [[`(no controls)`, 'NONE']];
            }}
        ],
        "output": null, "style": "networking_blocks", "tooltip": "Gets the current value from a slider, toggle, or color picker."
    };
    this.dashboardBlocks.push(valueBlock);
    micropythonGenerator.forBlock['dashboard_get_control_value'] = (block) => {
        const controlId = block.getFieldValue('CONTROL_ID');
        const code = `_dashboard_state.get('${controlId}', 0)`;
        return [code, micropythonGenerator.ORDER_FUNCTION_CALL];
    };

    // 3. Joystick Blocks
    const joystickXBlock = {
        "type": "dashboard_get_joystick_x",
        "message0": "x value of joystick %1",
        "args0": [{ "type": "field_dropdown", "name": "CONTROL_ID", "options": () => getDashboardOptions('joystick', 'joysticks') }],
        "output": "Number", "style": "networking_blocks",
    };
    this.dashboardBlocks.push(joystickXBlock);
    micropythonGenerator.forBlock['dashboard_get_joystick_x'] = (block) => {
        const id = block.getFieldValue('CONTROL_ID');
        // The 'value' key holds the X value for joysticks
        return [`_dashboard_state.get('${id}', 0)`, micropythonGenerator.ORDER_FUNCTION_CALL];
    };

    const joystickYBlock = {
        "type": "dashboard_get_joystick_y",
        "message0": "y value of joystick %1",
        "args0": [{ "type": "field_dropdown", "name": "CONTROL_ID", "options": () => getDashboardOptions('joystick', 'joysticks') }],
        "output": "Number", "style": "networking_blocks",
    };
    this.dashboardBlocks.push(joystickYBlock);
    micropythonGenerator.forBlock['dashboard_get_joystick_y'] = (block) => {
        const id = block.getFieldValue('CONTROL_ID');
        return [`_dashboard_state.get('${id}_y', 0)`, micropythonGenerator.ORDER_FUNCTION_CALL];
    };

    // 4. Display Update Block
    const updateBlock = {
        "type": "dashboard_update_display",
        "message0": "update dashboard display %1 with value %2",
        "args0": [
            { "type": "field_dropdown", "name": "DISPLAY_ID", "options": () => {
                const displays = [
                    ...getDashboardOptions('led', 'LEDs'), 
                    ...getDashboardOptions('gauge', 'gauges'), 
                    ...getDashboardOptions('label', 'labels')
                ];
                const validDisplays = displays.filter(opt => opt[1] !== 'NONE');
                return validDisplays.length > 0 ? validDisplays : [[`(no displays)`, 'NONE']];
            }},
            { "type": "input_value", "name": "VALUE" }
        ],
        "previousStatement": null, "nextStatement": null, "inputsInline": true, "style": "networking_blocks",
    };
    this.dashboardBlocks.push(updateBlock);
    micropythonGenerator.forBlock['dashboard_update_display'] = (block) => {
        const displayId = block.getFieldValue('DISPLAY_ID');
        const value = micropythonGenerator.valueToCode(block, 'VALUE', micropythonGenerator.ORDER_ATOMIC) || '""';
        return `send_to_dashboard('${displayId}', 'value', ${value})\n`;
    };
}

setupDashboardBlocks() {
    if (this.dashboardBlocksDefined) return;

    const htmlBlockType = 'dashboard_generated_html_content';
    micropythonGenerator.forBlock[htmlBlockType] = (block) => {
        return ['"""No dashboard generated yet."""', micropythonGenerator.ORDER_ATOMIC];
    };
    this.generateDashboardBlocks(); 
    const htmlBlockDefinition = {
        "type": htmlBlockType, "message0": "Dashboard HTML Content", "output": "String",
        "style": "text_blocks", "tooltip": "The generated HTML for your IoT dashboard. Connect this to the 'send web response' block."
    };
    this.dashboardBlocks.push(htmlBlockDefinition);
    Blockly.defineBlocksWithJsonArray(this.dashboardBlocks);
    this.dashboardBlocksDefined = true; // Set the flag
}


copyExportCode(textareaId, buttonId) {
    const codeTextarea = document.getElementById(textareaId);
    codeTextarea.select();
    navigator.clipboard.writeText(codeTextarea.value).then(() => {
        const copyBtn = this.ui[buttonId] || document.getElementById(buttonId);
        const originalText = copyBtn.innerText;
        copyBtn.innerText = 'Copied!';
        setTimeout(() => { copyBtn.innerText = originalText; }, 2000);
    }).catch(err => alert('Failed to copy code: ' + err));
}

initializeDashboardChart(canvas, comp) {
    if (!canvas) return;
    if (this.dashboardChartInstances[comp.id]) this.dashboardChartInstances[comp.id].destroy();
    const labels = comp.options.split(',');
    const data = comp.value.split(',').map(Number);
    this.dashboardChartInstances[comp.id] = new Chart(canvas.getContext('2d'), {
        type: 'line', // Simplified to just line chart for now
        data: { labels, datasets: [{ label: comp.label, data, backgroundColor: 'transparent', borderColor: comp.color, borderWidth: 2, pointBackgroundColor: comp.color, tension: 0.2 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true }, x: {} } }
    });
}

    async handleCameraToggle() {
        if (this.isAiVisionRunning) {
            this.stopAiVision();
        } else {
            const isAnyAiBlockUsed = Object.values(this.aiRequirements).some(v => v);
            await this.startAiVision(!isAnyAiBlockUsed);
        }
    }

    async turnCameraOn() {
        if (this.isCameraOn) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            this.mediaStream = stream;
            this.ui.sidebarWebcam.srcObject = stream;
            this.ui.sidebarWebcam.onloadedmetadata = () => {
                this.ui.sidebarCanvas.width = this.ui.sidebarWebcam.videoWidth;
                this.ui.sidebarCanvas.height = this.ui.sidebarWebcam.videoHeight;
                this.ui.aiMonitorCanvas.width = this.ui.sidebarWebcam.videoWidth;
                this.ui.aiMonitorCanvas.height = this.ui.sidebarWebcam.videoHeight;
            };

            this.ui.boardViewerContainer.classList.add('camera-active');
            this.ui.toggleCamBtn.classList.add('active');
            this.isCameraOn = true;
            this.addConsoleMessage("Camera feed started.", 'info');
        } catch (err) {
            this.addConsoleMessage("Could not access camera: " + err.message, 'error');
            this.mediaStream = null;
        }
    }
    
    turnCameraOff() {
        if (!this.isCameraOn || !this.mediaStream) return;
        this.mediaStream.getTracks().forEach(track => track.stop());
        this.mediaStream = null;
        this.ui.sidebarWebcam.srcObject = null;
        this.sidebarCanvasCtx.clearRect(0, 0, this.ui.sidebarCanvas.width, this.ui.sidebarCanvas.height);
        this.aiMonitorCanvasCtx.clearRect(0, 0, this.ui.aiMonitorCanvas.width, this.ui.aiMonitorCanvas.height);
        this.ui.boardViewerContainer.classList.remove('camera-active');
        this.ui.toggleCamBtn.classList.remove('active');
        this.isCameraOn = false;
        this.addConsoleMessage("Camera feed stopped.", 'info');
    }

    async initFaceLandmarker() {
        if (this.faceLandmarker) return true;
        try {
            const filesetResolver = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm");
            this.faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
                baseOptions: { modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task", delegate: "GPU" },
                outputFaceBlendshapes: true, runningMode: "VIDEO", numFaces: 5 
            });
            this.addConsoleMessage("AI Face Detection model loaded.", 'success');
            return true;
        } catch (e) {
            this.addConsoleMessage("Error loading Face Detection model: " + e.message, 'error');
            console.error(e);
            return false;
        }
    }

    async initGestureRecognizer() {
        if (this.gestureRecognizer) return true;
        try {
            const filesetResolver = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm");
            this.gestureRecognizer = await GestureRecognizer.createFromOptions(filesetResolver, {
                baseOptions: { modelAssetPath: "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task", delegate: "GPU" },
                runningMode: "VIDEO", numHands: 2
            });
            this.addConsoleMessage("AI Hand Gesture model loaded.", 'success');
            return true;
        } catch (e) {
            this.addConsoleMessage("Error loading Hand Gesture model: " + e.message, 'error');
            console.error(e);
            return false;
        }
    }

    async initImageClassifier() {
        if (this.imageClassifier) return true;
        try {
            const filesetResolver = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm");
            this.imageClassifier = await ImageClassifier.createFromOptions(filesetResolver, {
                baseOptions: { 
                    modelAssetPath: "https://storage.googleapis.com/mediapipe-models/image_classifier/efficientnet_lite0/float32/latest/efficientnet_lite0.tflite", 
                    delegate: "GPU" 
                },
                runningMode: "VIDEO", maxResults: 1
            });
            this.addConsoleMessage("AI Image Classification model loaded.", 'success');
            return true;
        } catch (e) {
            this.addConsoleMessage("Error loading Image Classification model: " + e.message, 'error');
            console.error(e);
            return false;
        }
    }

    async initObjectDetector() {
        if (this.objectDetector) return true;
        try {
            const filesetResolver = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm");
            this.objectDetector = await ObjectDetector.createFromOptions(filesetResolver, {
                baseOptions: { 
                    modelAssetPath: "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float32/latest/efficientdet_lite0.tflite", 
                    delegate: "GPU" 
                },
                runningMode: "VIDEO",
                scoreThreshold: 0.5,
            });
            this.addConsoleMessage("AI Object Detection model loaded.", 'success');
            return true;
        } catch (e) {
            this.addConsoleMessage("Error loading Object Detection model: " + e.message, 'error');
            console.error(e);
            return false;
        }
    }

    handleAiCameraBlock(block) {
        const state = block.getFieldValue('STATE');
        if (state === 'ON') {
            this.startAiVision(false);
        } else {
            this.stopAiVision();
        }
    }

    async startAiVision(isMonitoringOnly = false) {
        if (this.isAiVisionRunning) return;

        this.isAiMonitoringOnly = isMonitoringOnly;
        await this.turnCameraOn();
        if (!this.mediaStream) return;

        let modelsInitialized = true;
        if (isMonitoringOnly) {
            this.addConsoleMessage("AI Monitor: Pre-loading all available models.", 'info');
            modelsInitialized = modelsInitialized && await this.initFaceLandmarker();
            modelsInitialized = modelsInitialized && await this.initGestureRecognizer();
            modelsInitialized = modelsInitialized && await this.initImageClassifier();
            modelsInitialized = modelsInitialized && await this.initObjectDetector();
        } else {
            if (this.aiRequirements.needsFaceCount || this.aiRequirements.needsBlendshapes) modelsInitialized = modelsInitialized && await this.initFaceLandmarker();
            if (this.aiRequirements.needsGestures || this.aiRequirements.needsHands) modelsInitialized = modelsInitialized && await this.initGestureRecognizer();
            if (this.aiRequirements.needsClassification) modelsInitialized = modelsInitialized && await this.initImageClassifier();
            if (this.aiRequirements.needsObjectDetection) modelsInitialized = modelsInitialized && await this.initObjectDetector();
        }

        if (!modelsInitialized) this.addConsoleMessage("One or more AI models failed to load. AI vision may be limited.", 'error');

        this.isAiVisionRunning = true;
        this.aiRequestAnimationFrameId = requestAnimationFrame(this.predictWebcam.bind(this));
        this.ui.toggleCamBtn.classList.add('active');
    }

    stopAiVision() {
        if (!this.isAiVisionRunning) return;
        
        if (this.aiRequestAnimationFrameId) {
            cancelAnimationFrame(this.aiRequestAnimationFrameId);
            this.aiRequestAnimationFrameId = null;
        }
        
        this.isAiVisionRunning = false;
        this.turnCameraOff();
        this.ui.toggleCamBtn.classList.remove('active');
        
        if (this.ui.aiMonitorModal.style.display === 'flex') this.toggleAiMonitorModal(false);
        
        this.ui.aiMonitorDataOutput.innerHTML = '<p class="ai-monitor-placeholder">Turn on the camera and use an AI extension block to see live data.</p>';
    }

    async predictWebcam() {
        if (!this.isAiVisionRunning) return;

        const video = this.ui.sidebarWebcam;
        if (video.readyState < 2) {
             requestAnimationFrame(this.predictWebcam.bind(this));
             return;
        }

        const startTimeMs = performance.now();
        const results = {};
        const isModalOpen = this.ui.aiMonitorModal.style.display === 'flex';

        if (this.faceLandmarker && (isModalOpen || this.aiRequirements.needsFaceCount || this.aiRequirements.needsBlendshapes)) results.faceLandmarker = this.faceLandmarker.detectForVideo(video, startTimeMs);
        if (this.gestureRecognizer && (isModalOpen || this.aiRequirements.needsGestures || this.aiRequirements.needsHands)) results.gestureRecognizer = this.gestureRecognizer.recognizeForVideo(video, startTimeMs);
        if (this.imageClassifier && (isModalOpen || this.aiRequirements.needsClassification)) results.imageClassifier = this.imageClassifier.classifyForVideo(video, startTimeMs);
        if (this.objectDetector && (isModalOpen || this.aiRequirements.needsObjectDetection)) results.objectDetector = this.objectDetector.detectForVideo(video, startTimeMs);
        
        const canvases = [ { ctx: this.sidebarCanvasCtx, isSidebar: true } ];
        if (isModalOpen) canvases.push({ ctx: this.aiMonitorCanvasCtx, isSidebar: false });

        for (const { ctx, isSidebar } of canvases) {
            ctx.save();
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.scale(-1, 1);
            ctx.translate(-ctx.canvas.width, 0);
            if (!isSidebar || this.ui.boardViewerContainer.classList.contains('camera-active')) {
                 ctx.drawImage(video, 0, 0, ctx.canvas.width, ctx.canvas.height);
            }
            const drawingUtils = new DrawingUtils(ctx);
            if (results.faceLandmarker?.faceLandmarks) {
                const shouldDraw = isSidebar ? (this.aiRequirements.needsFaceCount || this.aiRequirements.needsBlendshapes) : (this.activeMonitorModel === 'face');
                if (shouldDraw) for (const landmarks of results.faceLandmarker.faceLandmarks) drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_TESSELATION, { color: "#C0C0C070", lineWidth: 1 });
            }
            if (results.gestureRecognizer?.landmarks) {
                const shouldDraw = isSidebar ? (this.aiRequirements.needsGestures || this.aiRequirements.needsHands) : (this.activeMonitorModel === 'hand');
                if (shouldDraw) for (const landmarks of results.gestureRecognizer.landmarks) drawingUtils.drawConnectors(landmarks, GestureRecognizer.HAND_CONNECTIONS, { color: "#FFC107", lineWidth: 3 });
            }
            if (results.objectDetector?.detections) {
                const shouldDraw = isSidebar ? this.aiRequirements.needsObjectDetection : (this.activeMonitorModel === 'detection');
                if (shouldDraw) {
                    for (const detection of results.objectDetector.detections) {
                        drawingUtils.drawBoundingBox(detection.boundingBox, { color: "#FF5370", lineWidth: 2, fillColor: "#FF537020" });
                        ctx.save();
                        ctx.scale(-1, 1);
                        const label = `${detection.categories[0].categoryName} (${Math.round(detection.categories[0].score * 100)}%)`;
                        ctx.font = "16px Nunito";
                        const textWidth = ctx.measureText(label).width;
                        const unFlippedX = -detection.boundingBox.originX * ctx.canvas.width - textWidth - 12;
                        const y = detection.boundingBox.originY * ctx.canvas.height + 20;
                        ctx.fillStyle = "#FF5370";
                        ctx.fillRect(unFlippedX, y - 20, textWidth + 8, 24);
                        ctx.fillStyle = "#FFFFFF";
                        ctx.fillText(label, unFlippedX + 4, y - 6);
                        ctx.restore();
                    }
                }
            }
            ctx.restore();
        }
        
        this.processAiResults(results);
        requestAnimationFrame(this.predictWebcam.bind(this));
    }
    
    async processAiResults(results) {
        if (!results) return;

        if (this.ui.aiMonitorModal.style.display === 'flex') {
            this.updateAiMonitorUI(results);
        }
        
        const isAnyAiRequired = Object.values(this.aiRequirements).some(req => req);
        if (this.isAiMonitoringOnly || !this.serialComm.isConnected || !isAnyAiRequired) {
            return;
        }
        
        const now = performance.now();
        if (now - this.lastAiSendTime < this.AI_SEND_INTERVAL_MS) {
            return; 
        }

        // MODIFICATION START: This logic is now robust
        const dataToSend = {};

        // 1. Face Landmark Data
        if (this.aiRequirements.needsFaceCount || this.aiRequirements.needsBlendshapes) {
            const faceCount = results.faceLandmarker?.faceLandmarks?.length || 0;
            if (this.aiRequirements.needsFaceCount) {
                dataToSend.face_count = faceCount;
            }
            if (this.aiRequirements.needsBlendshapes) {
                const blendshapes = {};
                if (faceCount > 0 && results.faceLandmarker.faceBlendshapes[0]) {
                    results.faceLandmarker.faceBlendshapes[0].categories.forEach(c => {
                        blendshapes[c.categoryName] = c.score;
                    });
                }
                dataToSend.blendshapes = blendshapes; // Send empty object if no face
            }
        }

        // 2. Hand Gesture Data
        if (this.aiRequirements.needsHands || this.aiRequirements.needsGestures) {
            const hasHands = results.gestureRecognizer?.landmarks?.length > 0;
            if (this.aiRequirements.needsHands) {
                dataToSend.hand_count = hasHands ? results.gestureRecognizer.landmarks.length : 0;
                dataToSend.hands = hasHands ? results.gestureRecognizer.handedness.map(h => h[0].categoryName) : [];
            }
            if (this.aiRequirements.needsGestures) {
                dataToSend.gestures = hasHands ? results.gestureRecognizer.gestures.flat().map(g => g.categoryName) : [];
            }
        }
        
        // 3. Image Classification Data
        if (this.aiRequirements.needsClassification) {
            const topResult = results.imageClassifier?.classifications?.[0]?.categories?.[0];
            dataToSend.classification = topResult ? {
                category: topResult.categoryName.replace(/_/g, ' '),
                score: topResult.score
            } : {}; // Send empty object if no classification
        }

        // 4. Object Detection Data
        if (this.aiRequirements.needsObjectDetection) {
            dataToSend.objects = results.objectDetector?.detections?.map(d => ({
                label: d.categories[0].categoryName,
                score: d.categories[0].score,
                x: d.boundingBox.originX,
                y: d.boundingBox.originY,
                width: d.boundingBox.width,
                height: d.boundingBox.height
            })) || []; // Send empty array if no detections
        }

        if (Object.keys(dataToSend).length > 0) {
            this.lastAiSendTime = now;
            try {
                await this.serialComm.sendData(JSON.stringify(dataToSend) + '\n');
            } catch (e) {
                // Fail silently on send error
            }
        }
    }
    
    updateAiMonitorUI(results) {
        let content = '{\n';
        const parts = [];

        switch (this.activeMonitorModel) {
            case 'face':
                if (results.faceLandmarker?.faceLandmarks) {
                    parts.push(`  "face_count": ${results.faceLandmarker.faceLandmarks.length}`);
                    if (results.faceLandmarker.faceBlendshapes?.[0]) {
                        const blendshapes = results.faceLandmarker.faceBlendshapes[0].categories.map(c => `    "${c.categoryName}": ${c.score.toFixed(4)}`).join(',\n');
                        parts.push(`  "blendshapes": {\n${blendshapes}\n  }`);
                    }
                }
                break;
            case 'hand':
                if (results.gestureRecognizer?.landmarks) {
                    parts.push(`  "hand_count": ${results.gestureRecognizer.landmarks.length}`);
                    const gestures = results.gestureRecognizer.gestures.flat().map(g => `"${g.categoryName}"`).join(', ');
                    if (gestures) parts.push(`  "gestures": [${gestures}]`);
                }
                break;
            case 'classification':
                if (results.imageClassifier?.classifications?.[0]?.categories?.[0]) {
                    const topResult = results.imageClassifier.classifications[0].categories[0];
                    parts.push(`  "classification": {\n    "category": "${topResult.categoryName.replace(/_/g, ' ')}",\n    "score": ${topResult.score.toFixed(4)}\n  }`);
                }
                break;
            case 'detection':
                if (results.objectDetector?.detections) {
                    const detectedObjects = results.objectDetector.detections.map(d => `    {\n      "label": "${d.categories[0].categoryName}",\n      "score": ${d.categories[0].score.toFixed(4)}\n    }`).join(',\n');
                    if (detectedObjects) parts.push(`  "objects": [\n${detectedObjects}\n  ]`);
                }
                break;
        }
        if (parts.length === 0) {
            if (this.activeMonitorModel) {
                const modelName = this.activeMonitorModel.charAt(0).toUpperCase() + this.activeMonitorModel.slice(1);
                this.ui.aiMonitorDataOutput.innerHTML = `<p class="ai-monitor-placeholder">No data from ${modelName} model.\nMake sure objects are visible to the camera.</p>`;
            } else {
                this.ui.aiMonitorDataOutput.innerHTML = `<p class="ai-monitor-placeholder">Select a model above to view its live data.</p>`;
            }
            return;
        }
        content += parts.join(',\n') + '\n}';
        this.ui.aiMonitorDataOutput.textContent = content;
    }

    async toggleAiMonitorModal(show) {
        if (show) {
            this.ui.aiMonitorModal.style.display = 'flex';
            const extensionToModelMap = { 'face_landmark': 'face', 'hand_gesture': 'hand', 'image_classification': 'classification', 'object_detection': 'detection' };
            this.ui.aiMonitorToggles.forEach(toggle => {
                const model = toggle.dataset.model;
                const correspondingExtension = Object.keys(extensionToModelMap).find(key => extensionToModelMap[key] === model);
                toggle.style.display = (correspondingExtension && this.loadedExtensions.has(correspondingExtension)) ? 'flex' : 'none';
            });
            this.ui.aiMonitorToggles.forEach(t => t.classList.remove('active'));
            this.activeMonitorModel = null;
            this.updateAiMonitorUI({});
            if (!this.isAiVisionRunning) await this.startAiVision(true);
        } else {
            this.ui.aiMonitorModal.style.display = 'none';
            if (this.isAiMonitoringOnly) this.stopAiVision();
            this.activeMonitorModel = null;
        }
    }

    updateAiMonitorVisibility() {
        const aiExtensionIds = ['face_landmark', 'hand_gesture', 'image_classification', 'object_detection'];
        const hasAiExtension = aiExtensionIds.some(id => this.loadedExtensions.has(id));
        this.ui.aiMonitorBtn.style.display = hasAiExtension ? 'flex' : 'none';
    }

    analyzeAiBlockUsage() {
        this.aiRequirements = { needsFaceCount: false, needsBlendshapes: false, needsHands: false, needsGestures: false, needsClassification: false, needsObjectDetection: false };
        if (!window.blockyManagerInstance || !window.blockyManagerInstance.workspace) return;
        const allBlocks = window.blockyManagerInstance.workspace.getAllBlocks(false);
        for (const block of allBlocks) {
            switch (block.type) {
                case 'face_landmark_enable': if (block.getFieldValue('STATE') === 'ON') { this.aiRequirements.needsFaceCount = true; this.aiRequirements.needsBlendshapes = true; } break;
                case 'face_landmark_get_face_count': this.aiRequirements.needsFaceCount = true; break;
                case 'face_landmark_get_expression_value': case 'face_landmark_is_expression': this.aiRequirements.needsBlendshapes = true; this.aiRequirements.needsFaceCount = true; break;
                case 'hand_gesture_enable': if (block.getFieldValue('STATE') === 'ON') { this.aiRequirements.needsHands = true; this.aiRequirements.needsGestures = true; } break;
                case 'hand_gesture_on_gesture': this.aiRequirements.needsGestures = true; this.aiRequirements.needsHands = true; break;
                case 'hand_gesture_get_hand_count': case 'hand_gesture_is_hand_present': this.aiRequirements.needsHands = true; break;
                case 'image_classification_enable': if (block.getFieldValue('STATE') === 'ON') this.aiRequirements.needsClassification = true; break;
                case 'image_classification_get_class': case 'image_classification_is_class': this.aiRequirements.needsClassification = true; break;
                case 'object_detection_enable': if (block.getFieldValue('STATE') === 'ON') this.aiRequirements.needsObjectDetection = true; break;
                case 'object_detection_is_object_detected': case 'object_detection_for_each': case 'object_detection_get_property': this.aiRequirements.needsObjectDetection = true; break;
            }
        }
    }

    showDashboardBuilder() {
    this.ui.iotDashboardModal.style.display = 'flex';
    if (!this.dashboardInitialized) {
        this.initializeDashboard();
        this.dashboardInitialized = true;
    }
    // TODO: Add logic to load saved dashboard state here
    this.addConsoleMessage("Dashboard builder opened.", "info");
}


    showExtensionModal() {
        this.ui.extensionList.innerHTML = '';
        if (this.availableExtensions.length === 0) {
            this.ui.extensionList.innerHTML = '<p>No extensions are currently available for this board.</p>';
        } else {
            this.availableExtensions.forEach(ext => {
                const card = document.createElement('div');
                card.className = 'extension-card';
                card.dataset.extensionId = ext.id;
                if (this.loadedExtensions.has(ext.id)) {
                    card.classList.add('added');
                    card.innerHTML = `<div class="extension-card-icon" style="background-color: ${ext.color};">${ext.icon}</div><h3>${ext.name}</h3><p>${ext.description}</p><button class="btn danger remove-ext-btn">Remove</button>`;
                    card.querySelector('.remove-ext-btn').addEventListener('click', (e) => { e.stopPropagation(); this.removeExtension(ext.id); });
                } else {
                    card.innerHTML = `<div class="extension-card-icon" style="background-color: ${ext.color};">${ext.icon}</div><h3>${ext.name}</h3><p>${ext.description}</p>`;
                    card.addEventListener('click', () => { this.addExtension(ext.id); this.ui.extensionModal.style.display = 'none'; });
                }
                this.ui.extensionList.appendChild(card);
            });
        }
        this.ui.extensionModal.style.display = 'flex';
    }
    
addExtension(extensionId) {
    if (this.loadedExtensions.has(extensionId) || !window.blockyManagerInstance) return;
    if (extensionId === 'iot_dashboard') {
        this.setupDashboardBlocks();
    }
    this.loadedExtensions.add(extensionId);
    window.blockyManagerInstance.rebuildAndApplyToolbox(this.loadedExtensions, this.dashboardBlocks);
    this.saveExtensionsToCache();
    this.addConsoleMessage(`Extension '${extensionId}' added.`, 'info');
    this.updateAiMonitorVisibility();
    this.updateDashboardVisibility(); 
}


cleanupBlocksForExtension(extensionId) {
    const blockTypesToRemove = EXTENSION_BLOCK_TYPES[extensionId];
    if (!blockTypesToRemove || !window.blockyManagerInstance || !window.blockyManagerInstance.workspace) {
        return;
    }

    const workspace = window.blockyManagerInstance.workspace;
    const allBlocks = workspace.getAllBlocks(false);
    let blocksDeleted = 0;
    Blockly.Events.disable();

    try {
        allBlocks.forEach(block => {
            if (blockTypesToRemove.includes(block.type)) {
                // Safely dispose of the block and its children
                block.dispose(true); 
                blocksDeleted++;
            }
        });
    } finally {
        // Always re-enable events, even if an error occurs
        Blockly.Events.enable();
    }
    
    if (blocksDeleted > 0) {
        this.addConsoleMessage(`Removed ${blocksDeleted} block(s) from the '${extensionId}' extension.`, 'info');
        // Trigger an immediate code regeneration and save after cleanup
        if (window.blockyManagerInstance) {
            window.blockyManagerInstance.generateCode();
        }
        this.saveWorkspaceToCache();
    }
    }
    
removeExtension(extensionId) {
    if (!this.loadedExtensions.has(extensionId) || !window.blockyManagerInstance) return;
    this.cleanupBlocksForExtension(extensionId);
    this.loadedExtensions.delete(extensionId);
    window.blockyManagerInstance.rebuildAndApplyToolbox(this.loadedExtensions, this.dashboardBlocks);
    this.saveExtensionsToCache();
    this.addConsoleMessage(`Extension '${extensionId}' removed.`, 'info');
    this.updateAiMonitorVisibility();
    this.updateDashboardVisibility();
    this.showExtensionModal();
}

    registerBlocklyContextMenu() {
        const myCommand = {
            displayText: "⚡ Run this block on device",
            preconditionFn: (scope) => {
                return (this.isLiveMode && this.serialComm.isConnected) ? 'enabled' : 'hidden';
            },
            callback: (scope) => {
                this.executeBlockViaRepl(scope.block);
            },
            scopeType: Blockly.ContextMenuRegistry.ScopeType.BLOCK,
            id: 'run_block_on_device',
            weight: 200,
        };
        Blockly.ContextMenuRegistry.registry.register(myCommand);
    }
    
    // Toggles Live Mode on/off
    handleLiveModeToggle() {
        if (!this.serialComm.isConnected) return;
        this.isLiveMode = !this.isLiveMode;
        this.ui.liveModeBtn.classList.toggle('active', this.isLiveMode);
        
        if (this.isLiveMode) {
            this.addConsoleMessage("⚡ Live Mode Activated. Right-click blocks to run them.", "info");
            this.serialComm.sendData('\x03'); // Send CTRL+C to interrupt any running script
        } else {
            this.addConsoleMessage("⚡ Live Mode Deactivated.", "info");
        }
    }

    // Generates code for a single block and sends it over serial
    async executeBlockViaRepl(block) {
        if (!this.isLiveMode || !this.serialComm.isConnected) return;

        const nonExecutableTypes = new Set([
            'on_start', 'forever', 'every_x_ms', 'controls_repeat_ext',
            'controls_whileUntil', 'controls_for', 'controls_forEach'
        ]);

        if (nonExecutableTypes.has(block.type)) {
            this.addConsoleMessage("⚡ Live Mode can only run individual action blocks, not loops or events.", "info");
            return;
        }
        
        micropythonGenerator.isLiveMode = true;
        let code = Blockly.Python.blockToCode(block, true);
        micropythonGenerator.isLiveMode = false; // Reset the flag immediately after use

        if (!code || !code.trim()) return;
        
        // If the block returns a value, wrap it in a print() statement.
        // This check must happen *before* we enter paste mode.
        if (block.outputConnection && !code.includes('\n')) {
            code = `print(${code})`;
        }

        this.addConsoleMessage(`>>> (Live) ${code.trim().replace(/\n/g, '\n... ')}`, "input");
        
        try {
            // Use MicroPython's paste mode for reliable multi-line execution
            await this.serialComm.sendData('\x05'); // CTRL+E: Enter Paste Mode
            await new Promise(r => setTimeout(r, 50));
            await this.serialComm.sendData(code + '\r\n');
            await new Promise(r => setTimeout(r, 50));
            await this.serialComm.sendData('\x04'); // CTRL+D: Execute
        } catch (e) {
            this.addConsoleMessage(`Live Mode Error: ${e.message}`, 'error');
            await this.serialComm.sendData('\x03'); // Send CTRL+C to recover REPL
        }
    }

    // Shows the Block Genius toast if the block is new
    handleBlockGenius(blockType) {
        const seenBlocks = JSON.parse(localStorage.getItem('blockGeniusSeen') || '[]');
        if (this.blockGeniusTips[blockType] && !seenBlocks.includes(blockType)) {
            this.showBlockGenius(blockType);
            seenBlocks.push(blockType);
            localStorage.setItem('blockGeniusSeen', JSON.stringify(seenBlocks));
        }
    }

    // Displays and populates the toast notification
    showBlockGenius(blockType) {
        clearTimeout(this.geniusToastTimeout);
        const tip = this.blockGeniusTips[blockType];
        
        this.ui.geniusTitle.textContent = tip.title;
        this.ui.geniusDescription.textContent = tip.description;
        this.ui.geniusImage.src = tip.image;
        
        this.ui.geniusToast.classList.add('show');
        
        // Auto-hide after 12 seconds
        this.geniusToastTimeout = setTimeout(() => this.hideBlockGenius(), 12000);
    }

    // Hides the toast notification
    hideBlockGenius() {
        clearTimeout(this.geniusToastTimeout);
        this.ui.geniusToast.classList.remove('show');
    }
    
    async handleDeviceConnection() {
        if (this.serialComm.isConnected) {
            await this.serialComm.disconnect();
            return;
        }
        this.ui.connectBtn.textContent = 'Connecting...';
        this.ui.connectBtn.disabled = true;
        this.updateConnectionStatus('Connecting');
        try {
            const result = await this.serialComm.connect();
            if (result.success) {
                this.addConsoleMessage('Device connected.', 'success');
                this.updateConnectionStatus('Connected');
                this.ui.connectBtn.textContent = 'Disconnect';
                this.enableCodeButtons();
                this.setupSerialCallbacks();
                this.ui.liveModeBtn.disabled = false;
                await this.serialComm.sendData('\x03');
            } else {
                this.addConsoleMessage(`Connection failed: ${result.message}`, 'error');
                this.updateConnectionStatus('Disconnected');
                this.ui.connectBtn.textContent = 'Connect';
            }
        } catch (error) {
            this.addConsoleMessage(`Connection error: ${error.message}`, 'error');
            this.updateConnectionStatus('Disconnected');
            this.ui.connectBtn.textContent = 'Connect';
        } finally {
            this.ui.connectBtn.disabled = false;
        }
    }
    
    setupSerialCallbacks() {
        let lineBuffer = '';
        this.serialComm.onData(data => {
            lineBuffer += data;
            let newlineIndex;
            while ((newlineIndex = lineBuffer.indexOf('\n')) !== -1) {
                const line = lineBuffer.slice(0, newlineIndex).trim();
                lineBuffer = lineBuffer.slice(newlineIndex + 1);

                if (line.startsWith('plot:')) {
                this.addPlotterData(line); 
                 } else if (line) {
                this.addConsoleMessage(line, 'output');
                 }
            }
        });

        this.serialComm.onDisconnect(() => {
            this.addConsoleMessage('Device disconnected.', 'info');
            this.updateConnectionStatus('Disconnected');
            this.disableCodeButtons();
            this.ui.connectBtn.textContent = 'Connect';
            this.isLiveMode = false;
            this.ui.liveModeBtn.classList.remove('active');
            this.ui.liveModeBtn.disabled = true;
            this.stopAiVision();
        });
    }
    async copyCodeToClipboard() {
        if (!this.currentCode) return;
        try {
            await navigator.clipboard.writeText(this.currentCode);
            const originalIcon = this.ui.copyCodeBtn.innerHTML;
            this.ui.copyCodeBtn.innerHTML = `<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;
            this.ui.copyCodeBtn.classList.add('success');
            this.ui.copyCodeBtn.title = 'Copied!';
            setTimeout(() => {
                this.ui.copyCodeBtn.innerHTML = originalIcon;
                this.ui.copyCodeBtn.classList.remove('success');
                this.ui.copyCodeBtn.title = 'Copy Code';
            }, 1500);
        } catch (err) {
            console.error('Failed to copy code:', err);
            this.addConsoleMessage('Error: Could not copy code to clipboard.', 'error');
        }
    }

    toggleCodeEditing() {
    this.isEditingCode = !this.isEditingCode;
    const wrapper = this.ui.codeContentWrapper;
    if (!wrapper) return;

    if (this.isEditingCode) {
        const codeDisplay = document.getElementById('code-display-pre');
        if (!codeDisplay) return;

        const newTextarea = document.createElement('textarea');
        newTextarea.id = 'code-edit-textarea';
        newTextarea.spellcheck = false;
        newTextarea.value = this.currentCode;
        
        wrapper.innerHTML = ''; // Clear the wrapper
        wrapper.appendChild(newTextarea);

        newTextarea.addEventListener('input', () => {
            this.currentCode = newTextarea.value;
            this.updateLineNumbers();
        });

        this.ui.editCodeBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`;
        this.ui.editCodeBtn.title = 'Save Changes';
        this.ui.editCodeBtn.classList.add('primary');
        newTextarea.focus();
    } else {
        const textarea = document.getElementById('code-edit-textarea');
        if (textarea) this.currentCode = textarea.value;

        const newPre = document.createElement('pre');
        newPre.id = 'code-display-pre';
        newPre.spellcheck = false;
        newPre.textContent = this.currentCode;
        
        wrapper.innerHTML = ''; // Clear the wrapper
        wrapper.appendChild(newPre);

        this.ui.editCodeBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
        this.ui.editCodeBtn.title = 'Edit Code';
        this.ui.editCodeBtn.classList.remove('primary');
        this.addConsoleMessage('Code updated manually. Block changes will overwrite edits.', 'info');
    }
    this.updateLineNumbers(); // Update numbers after switching view
}
    switchView(viewName) {
        this.ui.codeView.classList.remove('active');
        this.ui.consoleView.classList.remove('active');
        this.ui.plotterView.classList.remove('active');

        const blocklyArea = document.getElementById('blocklyArea');
        const isBlocksView = viewName === 'blocks';

        if (blocklyArea) blocklyArea.style.display = isBlocksView ? 'block' : 'none';

        this.ui.blocksViewBtn.classList.toggle('active', isBlocksView);
        this.ui.codeViewBtn.classList.toggle('active', viewName === 'code');
        
        if (viewName === 'code') this.ui.codeView.classList.add('active');
        else if (viewName === 'console') this.ui.consoleView.classList.add('active');
        else if (viewName === 'plotter') this.ui.plotterView.classList.add('active');

        if (isBlocksView) {
            setTimeout(() => { 
                if (window.blockyManagerInstance && window.blockyManagerInstance.workspace) {
                     Blockly.svgResize(window.blockyManagerInstance.workspace);
                }
            }, 50);
        }
    }
    
    saveWorkspaceToCache() {
        try {
            if (window.blockyManagerInstance && window.blockyManagerInstance.workspace) {
                const dom = Blockly.Xml.workspaceToDom(window.blockyManagerInstance.workspace);
                const xml = Blockly.Xml.domToText(dom);
                localStorage.setItem(`project_workspace_${this.projectName}`, xml);

                const allProjects = JSON.parse(localStorage.getItem('blockIdeProjects') || '[]');
                const projectIndex = allProjects.findIndex(p => p.name === this.projectName);
                if (projectIndex !== -1) {
                    allProjects[projectIndex].modifiedAt = Date.now();
                    localStorage.setItem('blockIdeProjects', JSON.stringify(allProjects));
                }
            }
        } catch (e) {
            console.error('Auto-save failed:', e);
        }
    }

    loadWorkspaceFromCache() {
        const xml = localStorage.getItem(`project_workspace_${this.projectName}`);
        if (xml) {
            // REMOVED: The polling `tryLoad` function is gone.
            if (window.blockyManagerInstance && window.blockyManagerInstance.workspace) {
                try {
                    const dom = Blockly.utils.xml.textToDom(xml);
                    window.blockyManagerInstance.workspace.clear();
                    Blockly.Xml.domToWorkspace(dom, window.blockyManagerInstance.workspace);
                    this.addConsoleMessage(`Loaded project "${this.projectName}".`, 'info');
                } catch (e) {
                     this.addConsoleMessage("Could not load saved blocks. Reverting to default.", "error");
                     this.loadDefaultBlocks();
                }
            } else {
                 console.error("CRITICAL: loadWorkspaceFromCache called but workspace not ready.");
            }
        } else {
            this.loadDefaultBlocks();
        }
    }
    
    saveExtensionsToCache() {
        localStorage.setItem(`project_extensions_${this.projectName}`, JSON.stringify(Array.from(this.loadedExtensions)));
    }
    
    loadExtensionsFromCache() {
        const savedExtensions = localStorage.getItem(`project_extensions_${this.projectName}`);
        if (savedExtensions) JSON.parse(savedExtensions).forEach(extId => { setTimeout(() => this.addExtension(extId), 50); });
    }

    loadDefaultBlocks() {
        // REMOVED: The polling `tryLoad` function is gone.
        if (window.blockyManagerInstance && window.blockyManagerInstance.workspace) {
            try {
                const dom = Blockly.utils.xml.textToDom(DEFAULT_WORKSPACE_XML);
                window.blockyManagerInstance.workspace.clear();
                Blockly.Xml.domToWorkspace(dom, window.blockyManagerInstance.workspace);
                this.addConsoleMessage(`Started new project "${this.projectName}".`, 'info');
            } catch (e) {
                this.addConsoleMessage("Could not load default blocks.", "error");
            }
        } else {
            console.error("CRITICAL: loadDefaultBlocks called but workspace not ready.");
        }
    }

    showUploadModal(state) {
        const iconContainer = this.ui.uploadModalIcon;
        const messageEl = this.ui.uploadModalMessage;
        iconContainer.className = 'upload-status-icon';
        switch(state) {
            case 'uploading':
                iconContainer.classList.add('uploading');
                iconContainer.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>`;
                messageEl.textContent = 'Uploading to device...';
                break;
            case 'success':
                iconContainer.classList.add('success');
                iconContainer.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
                messageEl.textContent = 'Upload Complete!';
                break;
            case 'error':
                iconContainer.classList.add('error');
                iconContainer.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
                messageEl.textContent = 'Upload Failed';
                break;
        }
        this.ui.uploadModal.style.display = 'flex';
    }

    hideUploadModal() { this.ui.uploadModal.style.display = 'none'; }

async uploadCodeToDevice() {
    if (this.isEditingCode) {
        const textarea = document.getElementById('code-edit-textarea');
        if (textarea) this.currentCode = textarea.value;
    }
    if (!this.serialComm.isConnected) return showCustomConfirm("Connect to a device to upload.", () => {});
    if (!this.currentCode.trim()) return showCustomConfirm("No code to upload.", () => {});

    const wasAiRunning = this.isAiVisionRunning;
    if (wasAiRunning) {
        this.stopAiVision();
        await new Promise(r => setTimeout(r, 500)); 
    }

    this.serialComm.detachListener();
    this.addConsoleMessage('Stopping running script on device...', 'info');
    this.showUploadModal('uploading');
    
    try {
        await this.serialComm.sendData('\x03\x03'); 
        await new Promise(r => setTimeout(r, 200));
        
        const requiredLibs = Object.keys(this.libraryFileMap)
            .filter(libName => new RegExp(`from ${libName} import|import ${libName}`).test(this.currentCode));

        if (requiredLibs.length > 0) {
            this.addConsoleMessage(`Detected ${requiredLibs.length} required library/libraries.`, 'info');
            await this.serialComm.sendData('\x01'); // Enter Raw REPL
            await new Promise(r => setTimeout(r, 200));

            for (const libName of requiredLibs) {
                this.addConsoleMessage(`Uploading ${libName}.py...`, 'info');
                const libPath = this.libraryFileMap[libName];
                const response = await fetch(libPath);
                if (!response.ok) throw new Error(`Failed to fetch library: ${libName}`);
                const libCode = await response.text();
                
                // RATIONALE: We must escape backslashes and triple-quotes to safely embed the library
                // code inside the f.write('''...''') command. This prevents syntax errors.
                const escapedLibCode = libCode.replace(/\\/g, '\\\\').replace(/'''/g, "' ''");
                const writeCommand = `f=open('${libName}.py','w');f.write('''${escapedLibCode}''');f.close()`;

                await this.serialComm.sendData(writeCommand + '\x04');
                await new Promise(r => setTimeout(r, 200)); // Wait for file to write
            }
            await this.serialComm.sendData('\x02'); // Exit Raw REPL
            await new Promise(r => setTimeout(r, 200));
        }

        this.addConsoleMessage('Uploading main.py...', 'info');
        
        await this.serialComm.sendData('\x01'); 
        await new Promise(r => setTimeout(r, 200));

        // RATIONALE: Apply the same escaping logic to the user's main code for robustness.
        const escapedMainCode = this.currentCode.replace(/\\/g, '\\\\').replace(/'''/g, "' ''");
        const codeToWrite = `f=open('main.py','w');f.write('''\n${escapedMainCode}\n''');f.close()`;
        
        await this.serialComm.sendData(codeToWrite + '\x04');
        await new Promise(r => setTimeout(r, 200));
        
        await this.serialComm.sendData('\x02');
        await new Promise(r => setTimeout(r, 200));
        await this.serialComm.sendData('\x04');
        await new Promise(r => setTimeout(r, 50));
        
        this.showUploadModal('success');
        this.addConsoleMessage('Upload complete! Device has been soft-rebooted and is running the new code.', 'success');
        
    } catch (e) {
        this.showUploadModal('error');
        this.addConsoleMessage(`Upload error: ${e.message}`, 'error');
        await this.serialComm.sendData('\x02'); 
    } finally {
        this.serialComm.attachListener();
        setTimeout(() => {
            this.hideUploadModal();
            if (wasAiRunning) this.startAiVision(false);
        }, 2000);
        this.updateUI();
    }
}

    async sendConsoleCommand(command) {
        if (!this.serialComm.isConnected) return this.addConsoleMessage('Not connected.', 'error');
        try {
            this.addConsoleMessage(`>>> ${command.trim()}`, 'input');
            await this.serialComm.sendData(command);
        } catch (e) {
            this.addConsoleMessage(`Command error: ${e.message}`, 'error');
        }
    }

    addConsoleMessage(message, type = 'output') {
        const lines = message.replace(/\r/g, '').split('\n').filter(l => l.length > 0);
        for (const l of lines) this.consoleBuffer.push({ text: l, type });
        if (!this.isConsoleUpdateScheduled) {
            this.isConsoleUpdateScheduled = true;
            setTimeout(() => this.flushConsoleBuffer(), this.CONSOLE_UPDATE_INTERVAL);
        }
    }

    flushConsoleBuffer() {
        if (this.consoleBuffer.length === 0) { this.isConsoleUpdateScheduled = false; return; }
        const out = this.ui.consoleOutput; if (!out) return;
        const frag = document.createDocumentFragment();
        const messagesToRender = this.consoleBuffer.splice(0);
        const shouldScroll = out.scrollTop + out.clientHeight >= out.scrollHeight - 30;
        for (const msg of messagesToRender) { const div = document.createElement('div'); div.className = `console-message console-${msg.type}`; div.textContent = msg.text; frag.appendChild(div); }
        out.appendChild(frag);
        const excessNodes = out.childNodes.length - this.MAX_CONSOLE_LINES;
        if (excessNodes > 0) { for (let i = 0; i < excessNodes; i++) { if (out.firstChild) out.removeChild(out.firstChild); } }
        if (shouldScroll) out.scrollTop = out.scrollHeight;
        this.isConsoleUpdateScheduled = false;
        if (this.consoleBuffer.length > 0) { this.isConsoleUpdateScheduled = true; setTimeout(() => this.flushConsoleBuffer(), this.CONSOLE_UPDATE_INTERVAL); }
    }

    updateConnectionStatus(status) {
        const wrapper = document.getElementById('connection-status-wrapper');
        if (wrapper) { wrapper.querySelector('span').textContent = status; wrapper.className = `connection-status-wrapper connection-${status.toLowerCase().replace(/ /g, '-')}`; }
    }

    enableCodeButtons() {
        this.ui.uploadBtn.disabled = false;
        this.ui.liveModeBtn.disabled = false;
    }

    disableCodeButtons() {
        this.ui.uploadBtn.disabled = true;
        this.ui.liveModeBtn.disabled = true; 
    }
    updateUI() {
        const hasCode = this.currentCode.trim().length > 0;
        const isConnected = this.serialComm.isConnected;
        this.ui.uploadBtn.disabled = !(hasCode && isConnected);
        document.getElementById('save-project').disabled = !hasCode;
    }

    exportProject() {
        this.saveWorkspaceToCache();
        this.saveExtensionsToCache();
        try {
            const allProjects = JSON.parse(localStorage.getItem('blockIdeProjects') || '[]');
            const currentProject = allProjects.find(p => p.name === this.projectName);
            const projectData = {
                workspace: localStorage.getItem(`project_workspace_${this.projectName}`),
                extensions: JSON.parse(localStorage.getItem(`project_extensions_${this.projectName}`) || '[]'),
                boardId: this.boardId,
                projectName: this.projectName,
                description: currentProject ? currentProject.description : ''
            };
            const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `${this.projectName}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(a.href);
            this.addConsoleMessage('Project exported successfully.', 'success');
        } catch (e) {
            this.addConsoleMessage(`Export failed: ${e.message}`, 'error');
        }
    }

    initializePlotter() {
    const ctx = document.getElementById('plotter-canvas').getContext('2d');
    const theme = document.documentElement.getAttribute('data-theme') || 'light';
    const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const fontColor = theme === 'dark' ? '#A0AEC0' : '#718096';

    this.plotterChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [], 
            datasets: []
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { ticks: { color: fontColor }, grid: { color: gridColor } },
                y: { ticks: { color: fontColor }, grid: { color: gridColor } }
            },
            plugins: { 
                legend: { 
                    display: true,
                    position: 'top',
                    labels: {
                        color: fontColor
                    }
                } 
            }
        }
    });
}


addPlotterData(line) { // Now accepts the full line, e.g., "plot:temp:#ff0000:25.5"
    if (!this.plotterChart) return;

    const parts = line.split(':');
    if (parts.length < 4 || parts[0] !== 'plot') return;

    const name = parts[1].replace(/"/g, ''); // Clean up quotes from name string
    const color = parts[2];
    const value = parseFloat(parts[3]);

    if (isNaN(value)) return;

    let dataset = this.plotterChart.data.datasets.find(ds => ds.label === name);

    // If this data series is new, create it
    if (!dataset) {
        dataset = {
            label: name,
            data: [],
            borderColor: color,
            backgroundColor: `${color}33`, 
            borderWidth: 2,
            pointRadius: 3,
            tension: 0.3,
            fill: true
        };
        this.plotterChart.data.datasets.push(dataset);
    }

    dataset.data.push(value);
    const labels = this.plotterChart.data.labels;
    if (dataset.data.length > labels.length) {
         labels.push(this.plotterDataPointCount++);
    }

    if (dataset.data.length > this.MAX_PLOTTER_POINTS) {
        dataset.data.shift();
        const allTooLong = this.plotterChart.data.datasets.every(ds => ds.data.length >= this.MAX_PLOTTER_POINTS);
        if (allTooLong) {
            labels.shift();
        }
    }
    
    this.plotterChart.update('none');
}

    handleProjectRename() {
        const h1 = this.ui.projectName;
        const wrapper = this.ui.projectTitleWrapper;
        
        const input = document.createElement('input');
        input.type = 'text';
        input.value = this.projectName;

        h1.style.display = 'none';
        wrapper.insertBefore(input, h1.nextSibling);
        input.focus();
        input.select();

        const saveRename = () => {
            const newName = input.value.trim();
            
            // Revert to original view
            input.remove();
            h1.style.display = 'block';
            
            if (newName && newName !== this.projectName) {
                // Check if new name is already taken
                const allProjects = JSON.parse(localStorage.getItem('blockIdeProjects') || '[]');
                if (allProjects.some(p => p.name === newName)) {
                    alert(`A project named "${newName}" already exists. Please choose a different name.`);
                    h1.textContent = this.projectName; // Revert text
                    return;
                }

                // Update project data in localStorage
                const projectIndex = allProjects.findIndex(p => p.name === this.projectName);
                if (projectIndex !== -1) {
                    allProjects[projectIndex].name = newName;
                    localStorage.setItem('blockIdeProjects', JSON.stringify(allProjects));
                }

                // Move workspace and extension data to new keys
                const workspaceData = localStorage.getItem(`project_workspace_${this.projectName}`);
                if (workspaceData) {
                    localStorage.setItem(`project_workspace_${newName}`, workspaceData);
                    localStorage.removeItem(`project_workspace_${this.projectName}`);
                }
                const extensionsData = localStorage.getItem(`project_extensions_${this.projectName}`);
                if (extensionsData) {
                    localStorage.setItem(`project_extensions_${newName}`, extensionsData);
                    localStorage.removeItem(`project_extensions_${this.projectName}`);
                }

                // Update internal state and UI
                this.projectName = newName;
                this.originalProjectName = newName;
                h1.textContent = newName;
                document.title = `${this.projectName} - ${this.boardId.toUpperCase()} | Block IDE`;
                this.addConsoleMessage(`Project renamed to "${newName}".`, 'success');
                
                // Update the URL without reloading the page
                const newUrl = `${window.location.pathname}?project=${encodeURIComponent(newName)}&board=${this.boardId}`;
                window.history.pushState({ path: newUrl }, '', newUrl);

            } else {
                h1.textContent = this.projectName; // Revert if name is empty or unchanged
            }
        };

        input.addEventListener('blur', saveRename);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                input.blur();
            } else if (e.key === 'Escape') {
                input.value = this.projectName; // Revert changes
                input.blur();
            }
        });
    }
}

// --- INITIALIZATION LOGIC ---
document.addEventListener('DOMContentLoaded', async () => { // Make this function async
    const params = new URLSearchParams(window.location.search);
    const projectName = params.get('project');
    const boardId = params.get('board');

    if (projectName && boardId) {
        window.esp32IDE = await ESP32BlockIDE.create(boardId, projectName);

    } else {
        document.body.innerHTML = '<h1>Error: No project specified.</h1><a href="index.html">Go back to projects</a>';
    }
});