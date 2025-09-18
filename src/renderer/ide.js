// src/renderer/ide.js (Fully Updated for Face, Hand, and Image Classification)
'use strict';

import vision from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/vision_bundle.js";
const { FaceLandmarker, GestureRecognizer, ImageClassifier, ObjectDetector, FilesetResolver, DrawingUtils } = vision;

const DEFAULT_WORKSPACE_XML = `
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="on_start" id="start_block" x="100" y="50"></block>
  <block type="forever" id="forever_block" x="100" y="220"></block>
</xml>`;

class ESP32BlockIDE {
    constructor(boardId, projectName) {
        this.boardId = boardId;
        this.projectName = projectName;
        this.currentCode = '';
        this.isEditingCode = false;
        this.serialComm = new SerialCommunication();
        this.workspaceUpdateTimeout = null;
        this.WORKSPACE_UPDATE_DEBOUNCE_MS = 250;
        this.boardImageMap = {
            'esp32': 'src/renderer/assets/ESP32.png',  
            'pico': 'src/renderer/assets/Pico.png',    
        };
        this.boardNameMap = {
            'esp32': 'ESP32',
            'pico': 'Pico',
        };
        this.consoleBuffer = [];
        this.isConsoleUpdateScheduled = false;
        this.CONSOLE_UPDATE_INTERVAL = 100;
        this.MAX_CONSOLE_LINES = 2000;
        
        // --- AI Vision Properties ---
        this.isAiVisionRunning = false;
        this.faceLandmarker = null;
        this.gestureRecognizer = null; 
        this.imageClassifier = null;
        this.objectDetector = null;
        this.lastAiSendTime = 0;
        this.AI_SEND_INTERVAL_MS = 100; // Throttle data to microcontroller
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

        this.availableExtensions = [
            { id: 'face_landmark', name: 'Face Landmark', description: 'Detect faces and expressions like smiling or blinking.', color: '#6d28d9', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 12a3 3 0 100-6 3 3 0 000 6z"/><path d="M20.9 19.8A10 10 0 103.1 4.2"/></svg>` },
            { id: 'hand_gesture', name: 'Hand Gestures', description: 'Recognize hand gestures like thumbs-up and pointing.', color: '#d97706', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>` },
            { id: 'image_classification', name: 'Image Classification', description: 'Identify the main object in the camera view (e.g., cat, dog, banana).', color: '#059669', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21 21-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z"/></svg>`},
            { id: 'object_detection', name: 'Object Detection', description: 'Find and locate multiple objects like people, cups, or laptops.', color: '#0891b2', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/></svg>` },

        ];
        this.loadedExtensions = new Set();

        this.initializeUI();
        this.setupEventListeners();
        document.title = `${this.projectName} - ${this.boardId.toUpperCase()} | Block IDE`;

        this.initializeBlockly();
        
        this.loadExtensionsFromCache(); 
        this.loadWorkspaceFromCache();
        this.setupWorkspaceListeners();
    }

initializeUI() {
    this.ui = {
        projectName: document.getElementById('current-project-name'),
        boardImage: document.getElementById('board-image'),
        blocklyArea: document.getElementById('blocklyArea'),
        uploadBtn: document.getElementById('upload-code'),
        codeView: document.getElementById('code-view'),
        consoleView: document.getElementById('console-view'),
        consoleOutput: document.getElementById('console-output'),
        consoleInput: document.getElementById('console-input'),
        connectBtn: document.getElementById('connect-device'),
        editCodeBtn: document.getElementById('edit-code-btn'),
        copyCodeBtn: document.getElementById('copy-code-btn'),
        uploadModal: document.getElementById('upload-status-modal'),
        uploadModalIcon: document.getElementById('upload-status-icon'),
        uploadModalMessage: document.getElementById('upload-status-message'),
        blocksViewBtn: document.getElementById('blocks-view-btn'),
        codeViewBtn: document.getElementById('code-view-btn'),
        extensionModal: document.getElementById('extension-modal'),
        extensionList: document.getElementById('extension-list'),
        extensionModalCloseBtn: document.getElementById('extension-modal-close-btn'),
        sidebarWebcam: document.getElementById('sidebar-webcam'),
        boardViewerContainer: document.getElementById('board-viewer-container'),
        toggleCamBtn: document.getElementById('toggle-cam-btn'),
        sidebarCanvas: document.getElementById('sidebar-canvas-overlay'),
        aiMonitorModal: document.getElementById('ai-monitor-modal'),
        aiMonitorCloseBtn: document.getElementById('ai-monitor-close-btn'),
        aiMonitorCanvas: document.getElementById('ai-monitor-canvas'),
        aiMonitorDataOutput: document.getElementById('ai-monitor-data-output'),
        aiMonitorToggles: document.querySelectorAll('.ai-monitor-toggle'),
        aiMonitorBtn: document.getElementById('ai-monitor-btn')
    };
    this.ui.projectName.textContent = this.projectName;
    this.ui.boardImage.src = this.boardImageMap[this.boardId] || this.boardImageMap['esp32'];
    this.ui.boardImage.alt = this.boardNameMap[this.boardId] || 'Microcontroller';
    this.sidebarCanvasCtx = this.ui.sidebarCanvas.getContext('2d');
    this.aiMonitorCanvasCtx = this.ui.aiMonitorCanvas.getContext('2d');
    this.drawingUtils = new DrawingUtils(this.sidebarCanvasCtx);
    
    const boardName = this.boardNameMap[this.boardId] || 'Device';
    const uploadBtnText = this.ui.uploadBtn.querySelector('span');
    if (uploadBtnText) {
        uploadBtnText.textContent = `Upload to ${boardName}`;
    }
    
    this.updateConnectionStatus('Disconnected');
    this.disableCodeButtons();
    this.updateAiMonitorVisibility();
    
    if (!this.serialComm.isSupported()) {
        this.ui.connectBtn.textContent = 'Browser Not Supported';
        this.ui.connectBtn.disabled = true;
        this.addConsoleMessage("Web Serial API not supported. Please use Google Chrome or Microsoft Edge.", "error");
    }
}
    
    initializeBlockly() {
        if (window.setupBlocklyForBoard) {
            window.setupBlocklyForBoard(this.boardId);
            Blockly.dialog.setPrompt(this.showCustomPrompt.bind(this));
            Blockly.dialog.setConfirm(this.showCustomConfirm.bind(this));
        } else {
            console.error("Blockly init script not found.");
            this.addConsoleMessage("Fatal Error: Could not initialize block editor.", "error");
        }
    }

    updateViewPositions() {
        
    }

    setupWorkspaceListeners() {
        setTimeout(() => { 
            this.updateViewPositions(); 
            this.analyzeAiBlockUsage();

            if (window.blockyManagerInstance && window.blockyManagerInstance.workspace) {
        const workspace = window.blockyManagerInstance.workspace;
        workspace.addChangeListener((event) => {
        if (event.isUiEvent || event.type === Blockly.Events.FINISHED_LOADING) return;
        
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
    console.warn("Could not attach workspace listeners: workspace not ready.");
}
        }, 500);
    }
    
    setupEventListeners() {
        document.getElementById('back-to-projects-btn').addEventListener('click', () => {
            this.stopAiVision();
            this.saveWorkspaceToCache();
            window.location.href = 'index.html';
        });

        this.ui.blocksViewBtn.addEventListener('click', () => this.switchView('blocks'));
        this.ui.codeViewBtn.addEventListener('click', () => this.switchView('code'));

        this.ui.connectBtn.addEventListener('click', () => this.handleDeviceConnection());
        this.ui.uploadBtn.addEventListener('click', () => this.uploadCodeToDevice());
        document.getElementById('save-project').addEventListener('click', () => this.exportProject());
        document.getElementById('console-btn').addEventListener('click', () => this.switchView('console'));
        
        this.ui.aiMonitorBtn.addEventListener('click', () => this.toggleAiMonitorModal(true));
        this.ui.aiMonitorCloseBtn.addEventListener('click', () => this.toggleAiMonitorModal(false));


        this.ui.aiMonitorToggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
           const model = toggle.dataset.model;
           if (toggle.classList.contains('active')) {
              this.activeMonitorModel = null;
              toggle.classList.remove('active');
           } else {
              this.activeMonitorModel = model;
              this.ui.aiMonitorToggles.forEach(t => t.classList.remove('active'));
              toggle.classList.add('active');
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

        window.addEventListener('codeUpdated', (event) => {
            this.currentCode = event.detail;
            const codePreview = document.getElementById('code-display-pre');
            if (codePreview) {
                codePreview.textContent = this.currentCode;
            }
            this.updateUI();
        });
        
        this.ui.editCodeBtn.addEventListener('click', () => this.toggleCodeEditing());
        this.ui.copyCodeBtn.addEventListener('click', () => this.copyCodeToClipboard());

        this.ui.toggleCamBtn.addEventListener('click', () => this.handleCameraToggle());
        
        this.ui.extensionModalCloseBtn.addEventListener('click', () => {
            this.ui.extensionModal.style.display = 'none';
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
                    // UPDATED THE URL IN THE LINE BELOW
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
                    // UPDATED THE URL IN THE LINE BELOW
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
        if (this.aiRequirements.needsFaceCount || this.aiRequirements.needsBlendshapes) {
            modelsInitialized = modelsInitialized && await this.initFaceLandmarker();
        }
        if (this.aiRequirements.needsGestures || this.aiRequirements.needsHands) {
            modelsInitialized = modelsInitialized && await this.initGestureRecognizer();
        }
        if (this.aiRequirements.needsClassification) {
            modelsInitialized = modelsInitialized && await this.initImageClassifier();
        }
        if (this.aiRequirements.needsObjectDetection) {
            modelsInitialized = modelsInitialized && await this.initObjectDetector();
        }
    }

    if (!modelsInitialized) {
        this.addConsoleMessage("One or more AI models failed to load. AI vision may be limited.", 'error');
    }

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
        
        if (this.ui.aiMonitorModal.style.display === 'flex') {
            this.toggleAiMonitorModal(false);
        }
        
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

        // --- MODIFICATION 1: EFFICIENT PREDICTION ---
        // Only run models if the monitor is open OR if they are required by a block.

        if (this.faceLandmarker && (isModalOpen || this.aiRequirements.needsFaceCount || this.aiRequirements.needsBlendshapes)) {
            results.faceLandmarker = this.faceLandmarker.detectForVideo(video, startTimeMs);
        }
        if (this.gestureRecognizer && (isModalOpen || this.aiRequirements.needsGestures || this.aiRequirements.needsHands)) {
            results.gestureRecognizer = this.gestureRecognizer.recognizeForVideo(video, startTimeMs);
        }
        if (this.imageClassifier && (isModalOpen || this.aiRequirements.needsClassification)) {
            results.imageClassifier = this.imageClassifier.classifyForVideo(video, startTimeMs);
        }
        if (this.objectDetector && (isModalOpen || this.aiRequirements.needsObjectDetection)) {
            results.objectDetector = this.objectDetector.detectForVideo(video, startTimeMs);
        }
        
        // --- MODIFICATION 2: CONTEXT-AWARE DRAWING ---
        const canvases = [ { ctx: this.sidebarCanvasCtx, isSidebar: true } ];
        if (isModalOpen) {
            canvases.push({ ctx: this.aiMonitorCanvasCtx, isSidebar: false });
        }

        for (const { ctx, isSidebar } of canvases) {
            ctx.save();
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            
            if (!isSidebar) {
                ctx.drawImage(video, 0, 0, ctx.canvas.width, ctx.canvas.height);
            }
            
            const drawingUtils = new DrawingUtils(ctx);

            // Conditionally draw Face Landmarks
            if (results.faceLandmarker?.faceLandmarks) {
                // Only draw in monitor if 'face' is the active model
                const shouldDraw = isSidebar ? (this.aiRequirements.needsFaceCount || this.aiRequirements.needsBlendshapes) : (this.activeMonitorModel === 'face');
                if (shouldDraw) {
                    for (const landmarks of results.faceLandmarker.faceLandmarks) {
                        drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_TESSELATION, { color: "#C0C0C070", lineWidth: 1 });
                    }
                }
            }
            
            // Conditionally draw Hand Gestures
            if (results.gestureRecognizer?.landmarks) {
                 // Only draw in monitor if 'hand' is the active model
                const shouldDraw = isSidebar ? (this.aiRequirements.needsGestures || this.aiRequirements.needsHands) : (this.activeMonitorModel === 'hand');
                if (shouldDraw) {
                    for (const landmarks of results.gestureRecognizer.landmarks) {
                        drawingUtils.drawConnectors(landmarks, GestureRecognizer.HAND_CONNECTIONS, { color: "#FFC107", lineWidth: 3 });
                    }
                }
            }
            
            // Conditionally draw Object Detection
            if (results.objectDetector?.detections) {
                 // Only draw in monitor if 'detection' is the active model
                const shouldDraw = isSidebar ? this.aiRequirements.needsObjectDetection : (this.activeMonitorModel === 'detection');
                if (shouldDraw) {
                    for (const detection of results.objectDetector.detections) {
                        drawingUtils.drawBoundingBox(detection.boundingBox, { color: "#FF5370", lineWidth: 2, fillColor: "#FF537020" });
                        const label = `${detection.categories[0].categoryName} (${Math.round(detection.categories[0].score * 100)}%)`;
                        const x = detection.boundingBox.originX * ctx.canvas.width;
                        const y = detection.boundingBox.originY * ctx.canvas.height;
                        const textHeight = 18;
                        ctx.font = "16px Nunito";
                        const textWidth = ctx.measureText(label).width;
                        ctx.fillStyle = "#FF5370";
                        ctx.fillRect(x, y, textWidth + 8, textHeight);
                        ctx.fillStyle = "#FFFFFF";
                        ctx.fillText(label, x + 4, y + 14);
                    }
                }
            }
            // --- MODIFICATION END ---
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
        
        if (this.isAiMonitoringOnly || !this.serialComm.isConnected) return;
        
        const now = performance.now();
        if (now - this.lastAiSendTime < this.AI_SEND_INTERVAL_MS) {
            return; 
        }

        const dataToSend = {};

        if (results.faceLandmarker && results.faceLandmarker.faceLandmarks) {
            const faceCount = results.faceLandmarker.faceLandmarks.length;
            if (this.aiRequirements.needsFaceCount) {
                dataToSend.face_count = faceCount;
            }
            if (this.aiRequirements.needsBlendshapes && faceCount > 0 && results.faceLandmarker.faceBlendshapes[0]) {
                const blendshapes = {};
                results.faceLandmarker.faceBlendshapes[0].categories.forEach(c => { blendshapes[c.categoryName] = c.score; });
                dataToSend.blendshapes = blendshapes;
            }
        }

        if (results.gestureRecognizer && results.gestureRecognizer.landmarks) {
            if (this.aiRequirements.needsHands) {
                dataToSend.hand_count = results.gestureRecognizer.landmarks.length;
                dataToSend.hands = results.gestureRecognizer.handedness.map(h => h[0].categoryName);
            }
            if (this.aiRequirements.needsGestures) {
                dataToSend.gestures = results.gestureRecognizer.gestures.flat().map(g => g.categoryName);
            }
        }
        
        if (results.imageClassifier && results.imageClassifier.classifications) {
            if (this.aiRequirements.needsClassification && results.imageClassifier.classifications.length > 0 && results.imageClassifier.classifications[0].categories.length > 0) {
                const topResult = results.imageClassifier.classifications[0].categories[0];
                dataToSend.classification = {
                    category: topResult.categoryName.replace(/_/g, ' '),
                    score: topResult.score
                };
            }
        }

        if (results.objectDetector && results.objectDetector.detections) {
          if (this.aiRequirements.needsObjectDetection) {
            dataToSend.objects = results.objectDetector.detections.map(d => ({
                label: d.categories[0].categoryName,
                score: d.categories[0].score,
                x: d.boundingBox.originX,
                y: d.boundingBox.originY,
                width: d.boundingBox.width,
                height: d.boundingBox.height
            }));
        }
        }

        if (Object.keys(dataToSend).length > 0) {
            this.lastAiSendTime = now;
            const jsonString = JSON.stringify(dataToSend);
            try {
                await this.serialComm.sendData(jsonString + '\n');
            } catch (e) {
                // Fail silently
            }
        }
    }
    
updateAiMonitorUI(results) {
    let content = '{\n';
    const parts = [];

    switch (this.activeMonitorModel) {
        case 'face':
            if (results.faceLandmarker && results.faceLandmarker.faceLandmarks) {
                parts.push(`  "face_count": ${results.faceLandmarker.faceLandmarks.length}`);
                if (results.faceLandmarker.faceBlendshapes && results.faceLandmarker.faceBlendshapes.length > 0) {
                    const blendshapes = results.faceLandmarker.faceBlendshapes[0].categories
                        .map(c => `    "${c.categoryName}": ${c.score.toFixed(4)}`)
                        .join(',\n');
                    parts.push(`  "blendshapes": {\n${blendshapes}\n  }`);
                }
            }
            break;
        case 'hand':
            if (results.gestureRecognizer && results.gestureRecognizer.landmarks) {
                parts.push(`  "hand_count": ${results.gestureRecognizer.landmarks.length}`);
                const gestures = results.gestureRecognizer.gestures.flat().map(g => `"${g.categoryName}"`).join(', ');
                if (gestures) parts.push(`  "gestures": [${gestures}]`);
            }
            break;
        case 'classification':
            if (results.imageClassifier && results.imageClassifier.classifications && results.imageClassifier.classifications.length > 0 && results.imageClassifier.classifications[0].categories.length > 0) {
                const topResult = results.imageClassifier.classifications[0].categories[0];
                parts.push(`  "classification": {\n    "category": "${topResult.categoryName.replace(/_/g, ' ')}",\n    "score": ${topResult.score.toFixed(4)}\n  }`);
            }
            break;
        case 'detection':
            if (results.objectDetector && results.objectDetector.detections) {
                const detectedObjects = results.objectDetector.detections.map(d => 
                    `    {\n      "label": "${d.categories[0].categoryName}",\n      "score": ${d.categories[0].score.toFixed(4)}\n    }`
                ).join(',\n');
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

    content += parts.join(',\n');
    content += '\n}';
    this.ui.aiMonitorDataOutput.textContent = content;
}

async toggleAiMonitorModal(show) {
    if (show) {
        this.ui.aiMonitorModal.style.display = 'flex';
        
        const extensionToModelMap = {
            'face_landmark': 'face',
            'hand_gesture': 'hand',
            'image_classification': 'classification',
            'object_detection': 'detection'
        };

        this.ui.aiMonitorToggles.forEach(toggle => {
            const model = toggle.dataset.model;
            const correspondingExtension = Object.keys(extensionToModelMap).find(key => extensionToModelMap[key] === model);
            
            if (correspondingExtension && this.loadedExtensions.has(correspondingExtension)) {
                toggle.style.display = 'flex';
            } else {
                toggle.style.display = 'none';
            }
        });

        this.ui.aiMonitorToggles.forEach(t => t.classList.remove('active'));
        this.activeMonitorModel = null;
        this.updateAiMonitorUI({});

        if (!this.isAiVisionRunning) {
            await this.startAiVision(true);
        }
    } else {
        this.ui.aiMonitorModal.style.display = 'none';
        if (this.isAiMonitoringOnly) {
            this.stopAiVision();
        }
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
                case 'face_landmark_enable':
                    if (block.getFieldValue('STATE') === 'ON') {
                        this.aiRequirements.needsFaceCount = true;
                        this.aiRequirements.needsBlendshapes = true;
                    }
                    break;
                case 'face_landmark_get_face_count':
                    this.aiRequirements.needsFaceCount = true;
                    break;
                case 'face_landmark_get_expression_value':
                case 'face_landmark_is_expression':
                    this.aiRequirements.needsBlendshapes = true;
                    this.aiRequirements.needsFaceCount = true;
                    break;
                case 'hand_gesture_enable':
                    if (block.getFieldValue('STATE') === 'ON') {
                        this.aiRequirements.needsHands = true;
                        this.aiRequirements.needsGestures = true;
                    }
                    break;
                case 'hand_gesture_on_gesture':
                    this.aiRequirements.needsGestures = true;
                    this.aiRequirements.needsHands = true;
                    break;
                case 'hand_gesture_get_hand_count':
                case 'hand_gesture_is_hand_present':
                    this.aiRequirements.needsHands = true;
                    break;
                case 'image_classification_enable':
                    if (block.getFieldValue('STATE') === 'ON') {
                        this.aiRequirements.needsClassification = true;
                    }
                    break;
                case 'image_classification_get_class':
                case 'image_classification_is_class':
                    this.aiRequirements.needsClassification = true;
                    break;
                case 'object_detection_enable':
                     if (block.getFieldValue('STATE') === 'ON') {
                        this.aiRequirements.needsObjectDetection = true;
                    }
                    break;
                case 'object_detection_is_object_detected':
                case 'object_detection_for_each':
                case 'object_detection_get_property':
                    this.aiRequirements.needsObjectDetection = true;
                    break;
            }
        }
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
                    // MODIFIED: Add a remove button for added extensions
                    card.innerHTML = `
                        <div class="extension-card-icon" style="background-color: ${ext.color};">${ext.icon}</div>
                        <h3>${ext.name}</h3>
                        <p>${ext.description}</p>
                        <button class="btn danger remove-ext-btn">Remove</button>
                    `;
                    card.querySelector('.remove-ext-btn').addEventListener('click', (e) => {
                        e.stopPropagation(); // Prevent the card's click event from firing
                        this.removeExtension(ext.id);
                    });
                } else {
                    card.innerHTML = `
                        <div class="extension-card-icon" style="background-color: ${ext.color};">${ext.icon}</div>
                        <h3>${ext.name}</h3>
                        <p>${ext.description}</p>`;
                    card.addEventListener('click', () => {
                        this.addExtension(ext.id);
                        this.ui.extensionModal.style.display = 'none';
                    });
                }
                this.ui.extensionList.appendChild(card);
            });
        }
        this.ui.extensionModal.style.display = 'flex';
    }
    
    addExtension(extensionId) {
        if (this.loadedExtensions.has(extensionId) || !window.blockyManagerInstance) return;
        this.loadedExtensions.add(extensionId);
        window.blockyManagerInstance.rebuildAndApplyToolbox(this.loadedExtensions);
        
        this.saveExtensionsToCache();
        this.addConsoleMessage(`Extension '${extensionId}' added.`, 'info');
        this.updateAiMonitorVisibility();
    }
    
    removeExtension(extensionId) {
        if (!this.loadedExtensions.has(extensionId) || !window.blockyManagerInstance) return;
        this.loadedExtensions.delete(extensionId);
        window.blockyManagerInstance.rebuildAndApplyToolbox(this.loadedExtensions);

        this.saveExtensionsToCache();
        this.addConsoleMessage(`Extension '${extensionId}' removed.`, 'info');
        this.updateAiMonitorVisibility();
        this.showExtensionModal();
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
        this.serialComm.onData(data => this.addConsoleMessage(data, 'output'));
        this.serialComm.onDisconnect(() => {
            this.addConsoleMessage('Device disconnected.', 'info');
            this.updateConnectionStatus('Disconnected');
            this.disableCodeButtons();
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
        const codeDisplay = document.getElementById('code-display-pre');
        const textarea = document.getElementById('code-edit-textarea');
        
        if (this.isEditingCode) {
            if (!codeDisplay) return;
            const newTextarea = document.createElement('textarea');
            newTextarea.id = 'code-edit-textarea';
            newTextarea.spellcheck = false;
            newTextarea.value = this.currentCode;
            codeDisplay.parentNode.replaceChild(newTextarea, codeDisplay);
            this.ui.editCodeBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`;
            this.ui.editCodeBtn.title = 'Save Changes';
            this.ui.editCodeBtn.classList.add('primary');
            newTextarea.focus();
        } else {
            if (!textarea) return;
            this.currentCode = textarea.value;
            const newPre = document.createElement('pre');
            newPre.id = 'code-display-pre';
            newPre.spellcheck = false;
            newPre.textContent = this.currentCode;
            textarea.parentNode.replaceChild(newPre, textarea);
            this.ui.editCodeBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
            this.ui.editCodeBtn.title = 'Edit Code';
            this.ui.editCodeBtn.classList.remove('primary');
            this.addConsoleMessage('Code updated manually. Block changes will overwrite edits.', 'info');
        }
    }

    switchView(viewName) {
        // Deactivate all views first
        this.ui.codeView.classList.remove('active');
        this.ui.consoleView.classList.remove('active');

        // Get a reference to the main blockly editor container
        const blocklyArea = document.getElementById('blocklyArea');
        const isBlocksView = viewName === 'blocks';

        // Toggle the display of the entire Blockly editor area
        if (blocklyArea) {
            blocklyArea.style.display = isBlocksView ? 'block' : 'none';
        }

        // Update the active state of the toggle buttons
        this.ui.blocksViewBtn.classList.toggle('active', isBlocksView);
        this.ui.codeViewBtn.classList.toggle('active', viewName === 'code');
        
        // Activate the selected view
        if (viewName === 'code') {
            this.ui.codeView.classList.add('active');
        } else if (viewName === 'console') {
            this.ui.consoleView.classList.add('active');
        }

        // IMPORTANT: When switching back to blocks, we must tell Blockly to resize itself.
        if (isBlocksView) {
            setTimeout(() => { 
                if (window.blockyManagerInstance && window.blockyManagerInstance.workspace) {
                     Blockly.svgResize(window.blockyManagerInstance.workspace);
                }
            }, 50); // A small delay ensures the element is fully visible before resizing.
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
            const tryLoad = () => {
                if (window.blockyManagerInstance && window.blockyManagerInstance.workspace) {
                    try {
                        const dom = Blockly.utils.xml.textToDom(xml);
                        const ws = window.blockyManagerInstance.workspace;
                        ws.clear();
                        Blockly.Xml.domToWorkspace(dom, ws);
                        this.addConsoleMessage(`Loaded project "${this.projectName}".`, 'info');
                    } catch (e) {
                        this.addConsoleMessage("Could not load saved blocks.", "error");
                    }
                } else {
                    setTimeout(tryLoad, 100);
                }
            };
            tryLoad();
        } else {
            this.loadDefaultBlocks();
        }
    }
    
    saveExtensionsToCache() {
        const extensionsArray = Array.from(this.loadedExtensions);
        localStorage.setItem(`project_extensions_${this.projectName}`, JSON.stringify(extensionsArray));
    }
    
    loadExtensionsFromCache() {
        const savedExtensions = localStorage.getItem(`project_extensions_${this.projectName}`);
        if (savedExtensions) {
            const extensionsArray = JSON.parse(savedExtensions);
            extensionsArray.forEach(extId => {
                setTimeout(() => this.addExtension(extId), 50);
            });
        }
    }

    loadDefaultBlocks() {
        const tryLoad = () => {
            if (window.blockyManagerInstance && window.blockyManagerInstance.workspace) {
                try {
                    const dom = Blockly.utils.xml.textToDom(DEFAULT_WORKSPACE_XML);
                    const ws = window.blockyManagerInstance.workspace;
                    ws.clear();
                    Blockly.Xml.domToWorkspace(dom, ws);
                    this.addConsoleMessage(`Started new project "${this.projectName}".`, 'info');
                } catch (e) {
                    this.addConsoleMessage("Could not load default blocks.", "error");
                }
            } else {
                setTimeout(tryLoad, 100);
            }
        };
        tryLoad();
    }

    showCustomPrompt(message, defaultValue, callback) {
        const modal = document.getElementById('custom-prompt-modal'), el = document.getElementById('custom-prompt-message'), input = document.getElementById('custom-prompt-input'), ok = document.getElementById('custom-prompt-ok'), cancel = document.getElementById('custom-prompt-cancel');
        el.textContent = message; input.value = defaultValue; modal.style.display = 'flex'; input.focus(); input.select();
        const close = (val) => { modal.style.display = 'none'; ok.onclick = null; cancel.onclick = null; input.onkeydown = null; if (callback) callback(val); };
        ok.onclick = () => close(input.value); cancel.onclick = () => close(null);
        input.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); close(input.value); } else if (e.key === 'Escape') close(null); };
    }

    showCustomConfirm(message, callback) {
        const modal = document.getElementById('custom-confirm-modal'), el = document.getElementById('custom-confirm-message'), yes = document.getElementById('custom-confirm-yes'), no = document.getElementById('custom-confirm-no');
        el.textContent = message; modal.style.display = 'flex';
        const close = (res) => { modal.style.display = 'none'; yes.onclick = null; no.onclick = null; if (callback) callback(res); };
        yes.onclick = () => close(true); no.onclick = () => close(false);
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
        if (!this.serialComm.isConnected) return this.showCustomConfirm("Connect to a device to upload.", () => {});
        if (!this.currentCode.trim()) return this.showCustomConfirm("No code to upload.", () => {});
    
        const wasAiRunning = this.isAiVisionRunning;
        if (wasAiRunning) {
            this.stopAiVision();
            await new Promise(r => setTimeout(r, 500)); 
        }

        this.showUploadModal('uploading');
        this.addConsoleMessage('Uploading to main.py...', 'info');
        try {
            await this.serialComm.sendData('\x03\x03'); 
            await new Promise(r => setTimeout(r, 200));
            await this.serialComm.sendData('\x01');
            await new Promise(r => setTimeout(r, 200));
            const codeToWrite = `f=open('main.py','w');f.write('''\n${this.currentCode.replace(/'''/g, "' ''")}\n''');f.close()`;
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
            setTimeout(() => {
                this.hideUploadModal();
                if (wasAiRunning) {
                    this.startAiVision(false);
                }
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

    enableCodeButtons() { this.ui.uploadBtn.disabled = false; }
    disableCodeButtons() { this.ui.uploadBtn.disabled = true; }

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
}

// --- INITIALIZATION LOGIC ---
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const projectName = params.get('project');
    const boardId = params.get('board');

    if (projectName && boardId) {
        window.esp32IDE = new ESP32BlockIDE(boardId, projectName);
    } else {
        document.body.innerHTML = '<h1>Error: No project specified.</h1><a href="index.html">Go back to projects</a>';
    }
});