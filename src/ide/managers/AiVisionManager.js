// src/ide/managers/AiVisionManager.js
'use strict';

import { 
    FaceLandmarker, 
    GestureRecognizer, 
    ImageClassifier, 
    ObjectDetector, 
    FilesetResolver, 
    DrawingUtils 
} from '@mediapipe/tasks-vision';
import * as tmImage from '@teachablemachine/image';

export class AiVisionManager {
    constructor(commManager, ideInstance) {
        this.commManager = commManager;
        this.ide = ideInstance;

        // --- UI Elements ---
        this.ui = {
            sidebarWebcam: document.getElementById('sidebar-webcam'),
            sidebarCanvas: document.getElementById('sidebar-canvas-overlay'),
            aiMonitorModal: document.getElementById('ai-monitor-modal'),
            aiMonitorHeader: document.getElementById('ai-monitor-header'),
            aiMonitorCanvas: document.getElementById('ai-monitor-canvas'),
            aiMonitorDataOutput: document.getElementById('ai-monitor-data-output'),
            aiMonitorToggles: document.querySelectorAll('.ai-monitor-toggle'),
            aiMonitorCloseBtn: document.getElementById('ai-monitor-close-btn'),
            aiMonitorBtn: document.getElementById('ai-monitor-btn'),
            customModelToggle: document.querySelector('.ai-monitor-toggle[data-model="custom"]'),
        };

        // --- Optimization Configuration ---
        this.visionWasm = null; 
        this.FPS_LIMIT = 15;    
        this.FRAME_INTERVAL = 1000 / this.FPS_LIMIT;
        this.lastPredictionTime = 0;

        // --- State Management ---
        this.isBlocksRequestingAi = false;
        this.isMonitorRequestingAi = false;
        this.isStreamPaused = false; 
        this.isCameraOn = false;
        this.mediaStream = null;
        this.aiRequestAnimationFrameId = null;
        
        // --- Data Transmission State ---
        this.lastAiSendTime = 0;
        this.AI_SEND_INTERVAL_MS = 100; 
        this.lastAiDataJson = '';
        this.activeMonitorModel = null;
        
        // --- Models (Lazy Loaded) ---
        this.faceLandmarker = null;
        this.gestureRecognizer = null;
        this.imageClassifier = null;
        this.objectDetector = null;
        
        // --- Custom Model State ---
        this.customModel = null;
        this.customModelLabels = [];
        this.customModelUrl = null;
        this.isModelSuccessfullyLoaded = false;
        this.isCustomModelEnabled = false; // Block State Flag

        // --- Drawing Tools ---
        this.sidebarCanvasCtx = this.ui.sidebarCanvas ? this.ui.sidebarCanvas.getContext('2d') : null;
        this.aiMonitorCanvasCtx = this.ui.aiMonitorCanvas ? this.ui.aiMonitorCanvas.getContext('2d') : null;
        
        if (this.sidebarCanvasCtx) this.drawingUtilsSidebar = new DrawingUtils(this.sidebarCanvasCtx);
        if (this.aiMonitorCanvasCtx) this.drawingUtilsMonitor = new DrawingUtils(this.aiMonitorCanvasCtx);
        
        this.aiRequirements = {
            needsFaceCount: false, needsBlendshapes: false,
            needsHands: false, needsGestures: false,
            needsClassification: false, needsObjectDetection: false,
            needsCustomModel: false,
        };

        this._initEventListeners();
    }

    // --- Control Methods ---
    pauseAiStream() { this.isStreamPaused = true; }
    resumeAiStream() { this.isStreamPaused = false; }
    
    stopAiVision() {
        this.isBlocksRequestingAi = false;
        this.isMonitorRequestingAi = false;
        
        // Reset Custom Model
        this.isCustomModelEnabled = false;
        
        this.stopLoop();
        this._turnCameraOff();
        this._disposeUnusedModels(true); 
    }

    // =========================================================
    // 1. CAMERA STATE LOGIC
    // =========================================================

    /**
     * Centralized logic to determine if camera should be active.
     */
    async _updateCameraState() {
        const shouldBeRunning = 
            this.isBlocksRequestingAi || 
            this.isMonitorRequestingAi || 
            this.isCustomModelEnabled;
        
        if (shouldBeRunning && !this.isCameraOn) {
            await this.turnCameraOn();
        } else if (!shouldBeRunning && this.isCameraOn) {
            this._turnCameraOff();
        }
    }

    /**
     * Manages loading/unloading the Custom Model based on Block inputs.
     */
    async manageCustomModel(isActive, url) {
        // --- TURN OFF ---
        if (!isActive) {
            if (this.isCustomModelEnabled) {
                console.log("Stopping Custom Model...");
                this.isCustomModelEnabled = false;
                this.isModelSuccessfullyLoaded = false;
                this.customModel = null;
                this.customModelLabels = [];
                
                this.ide.addConsoleMessage("Custom Model: Disabled", "info");
                
                // Immediate check to turn off camera if nothing else needs it
                this._updateCameraState();
                
                if (this.ide.updateUIAfterModelLoad) this.ide.updateUIAfterModelLoad();
            }
            return;
        }

        // --- TURN ON ---
        if (!url || !url.startsWith('https://teachablemachine.withgoogle.com/models/')) {
            this.ide.addConsoleMessage("⚠️ Invalid URL. Use 'https://teachablemachine...'", "warning");
            return;
        }
        
        if (!url.endsWith('/')) url += '/';

        // Prevent redundant reload
        if (this.isModelSuccessfullyLoaded && this.customModelUrl === url && this.isCustomModelEnabled) {
            return;
        }

        this.ide.addConsoleMessage("⏳ Loading Custom Model...", "info");
        
        try {
            const modelURL = `${url}model.json`;
            const metadataURL = `${url}metadata.json`;

            this.customModel = await tmImage.load(modelURL, metadataURL);
            this.customModelLabels = this.customModel.getClassLabels();
            this.customModelUrl = url;
            
            this.isModelSuccessfullyLoaded = true;
            this.isCustomModelEnabled = true;
            
            this.ide.addConsoleMessage(`✅ Model Loaded: ${this.customModelLabels.join(', ')}`, 'success');
            
            this._updateCameraState();
            
            if (this.ide.updateUIAfterModelLoad) this.ide.updateUIAfterModelLoad();

        } catch (err) {
            console.error(err);
            this.ide.addConsoleMessage(`❌ Load Error: ${err.message}`, 'error');
            this.isModelSuccessfullyLoaded = false;
            this.isCustomModelEnabled = false;
            this._updateCameraState();
        }
    }

    // =========================================================
    // 2. MODEL INITIALIZERS (Standard)
    // =========================================================

    async ensureVisionWasm() {
        if (this.visionWasm) return this.visionWasm;
        this.ide.addConsoleMessage("📥 Downloading AI Engine...", "info");
        try {
            this.visionWasm = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
            );
            return this.visionWasm;
        } catch (e) {
            this.ide.addConsoleMessage(`AI Init Failed: ${e.message}`, "error");
            throw e;
        }
    }

    async initFaceLandmarker(enableBlendshapes = false) {
        if (this.faceLandmarker && this.faceLandmarker.enableBlendshapes === enableBlendshapes) return;
        try {
            const wasm = await this.ensureVisionWasm();
            if (this.faceLandmarker) this.faceLandmarker.close();
            this.faceLandmarker = await FaceLandmarker.createFromOptions(wasm, {
                baseOptions: { modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task", delegate: "GPU" },
                outputFaceBlendshapes: enableBlendshapes, runningMode: "VIDEO", numFaces: 1
            });
            this.faceLandmarker.enableBlendshapes = enableBlendshapes;
        } catch (e) { this.ide.addConsoleMessage(`Face Model Error: ${e.message}`, "error"); }
    }

    async initGestureRecognizer() {
        if (this.gestureRecognizer) return;
        try {
            const wasm = await this.ensureVisionWasm();
            this.gestureRecognizer = await GestureRecognizer.createFromOptions(wasm, {
                baseOptions: { modelAssetPath: "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task", delegate: "GPU" },
                runningMode: "VIDEO", numHands: 2
            });
        } catch (e) { this.ide.addConsoleMessage(`Hand Model Error: ${e.message}`, "error"); }
    }

    async initImageClassifier() {
        if (this.imageClassifier) return;
        try {
            const wasm = await this.ensureVisionWasm();
            this.imageClassifier = await ImageClassifier.createFromOptions(wasm, {
                baseOptions: { modelAssetPath: "https://storage.googleapis.com/mediapipe-models/image_classifier/efficientnet_lite0/float32/latest/efficientnet_lite0.tflite", delegate: "GPU" },
                runningMode: "VIDEO", maxResults: 1
            });
        } catch (e) { this.ide.addConsoleMessage(`Classifier Error: ${e.message}`, "error"); }
    }

    async initObjectDetector() {
        if (this.objectDetector) return;
        try {
            const wasm = await this.ensureVisionWasm();
            this.objectDetector = await ObjectDetector.createFromOptions(wasm, {
                baseOptions: { modelAssetPath: "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float32/latest/efficientdet_lite0.tflite", delegate: "GPU" },
                runningMode: "VIDEO", scoreThreshold: 0.5
            });
        } catch (e) { this.ide.addConsoleMessage(`Detector Error: ${e.message}`, "error"); }
    }

    // =========================================================
    // 3. WORKSPACE SYNC (CRITICAL FIX)
    // =========================================================

    async updateAiStateFromBlocks() {
        this.analyzeAiBlockUsage(this.ide.blocklyManager?.workspace);
        const req = this.aiRequirements;
        
        // Standard Models Init
        if (req.needsFaceCount || req.needsBlendshapes) await this.initFaceLandmarker(req.needsBlendshapes);
        if (req.needsHands || req.needsGestures) await this.initGestureRecognizer();
        if (req.needsClassification) await this.initImageClassifier();
        if (req.needsObjectDetection) await this.initObjectDetector();

        this._disposeUnusedModels();

        // Calculate if standard blocks need camera
        const isStandardReq = Object.values(req).some(r => r === true);

        // Update state
        if (isStandardReq !== this.isBlocksRequestingAi) {
            this.isBlocksRequestingAi = isStandardReq;
        }
        
        // Always trigger a camera check to handle Custom Model overrides
        this._updateCameraState();
    }

    analyzeAiBlockUsage(workspace) {
        // Reset Standard Requirements
        this.aiRequirements = {
            needsFaceCount: false, needsBlendshapes: false,
            needsHands: false, needsGestures: false,
            needsClassification: false, needsObjectDetection: false,
            needsCustomModel: false
        };
        
        if (!workspace) return;
        
        const allBlocks = workspace.getAllBlocks(false);
        const feats = { face: false, hand: false, classify: false, detect: false };
        const explicit = { face: null, hand: null, classify: null, detect: null };
        
        let customBlockState = 'OFF';
        let customBlockFound = false;

        for (const b of allBlocks) {
            if (!b.isEnabled()) continue;
            const t = b.type;
            
            // Standard Checks
            if (t === 'face_landmark_enable') explicit.face = b.getFieldValue('STATE');
            if (t.startsWith('face_landmark_')) feats.face = true;
            if (t === 'hand_gesture_enable') explicit.hand = b.getFieldValue('STATE');
            if (t.startsWith('hand_gesture_')) feats.hand = true;
            if (t === 'image_classification_enable') explicit.classify = b.getFieldValue('STATE');
            if (t.startsWith('image_classification_')) feats.classify = true;
            if (t === 'object_detection_enable') explicit.detect = b.getFieldValue('STATE');
            if (t.startsWith('object_detection_')) feats.detect = true;

            // --- FAILSAFE: Check Custom Model Block ---
            if (t === 'custom_model_enable') {
                customBlockFound = true;
                customBlockState = b.getFieldValue('STATE');
            }
        }

        // Apply Standard Rules
        this.aiRequirements.needsFaceCount = (explicit.face === 'ON') || (explicit.face !== 'OFF' && feats.face);
        this.aiRequirements.needsBlendshapes = this.aiRequirements.needsFaceCount; 
        this.aiRequirements.needsHands = (explicit.hand === 'ON') || (explicit.hand !== 'OFF' && feats.hand);
        this.aiRequirements.needsGestures = this.aiRequirements.needsHands;
        this.aiRequirements.needsClassification = (explicit.classify === 'ON') || (explicit.classify !== 'OFF' && feats.classify);
        this.aiRequirements.needsObjectDetection = (explicit.detect === 'ON') || (explicit.detect !== 'OFF' && feats.detect);
        if (this.isCustomModelEnabled && (!customBlockFound || customBlockState === 'OFF')) {
            console.log("Force syncing Custom Model State: OFF");
            this.manageCustomModel(false);
        }
    }

    _disposeUnusedModels(forceAll = false) {
        const req = this.aiRequirements;
        const mon = this.activeMonitorModel;

        if (forceAll || (!req.needsFaceCount && !req.needsBlendshapes && mon !== 'face')) {
            if (this.faceLandmarker) { this.faceLandmarker.close(); this.faceLandmarker = null; }
        }
        if (forceAll || (!req.needsHands && !req.needsGestures && mon !== 'hand')) {
            if (this.gestureRecognizer) { this.gestureRecognizer.close(); this.gestureRecognizer = null; }
        }
        if (forceAll || (!req.needsClassification && mon !== 'classification')) {
            if (this.imageClassifier) { this.imageClassifier.close(); this.imageClassifier = null; }
        }
        if (forceAll || (!req.needsObjectDetection && mon !== 'detection')) {
            if (this.objectDetector) { this.objectDetector.close(); this.objectDetector = null; }
        }
    }

    // =========================================================
    // 4. RENDER LOOP
    // =========================================================

    async turnCameraOn() {
        if (this.isCameraOn) return;
        try {
            this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } 
            });
            this.ui.sidebarWebcam.srcObject = this.mediaStream;
            await this.ui.sidebarWebcam.play();
            
            const w = this.ui.sidebarWebcam.videoWidth;
            const h = this.ui.sidebarWebcam.videoHeight;
            if (this.ui.sidebarCanvas) { this.ui.sidebarCanvas.width = w; this.ui.sidebarCanvas.height = h; }
            if (this.ui.aiMonitorCanvas) { this.ui.aiMonitorCanvas.width = w; this.ui.aiMonitorCanvas.height = h; }

            document.getElementById('ai-camera-wrapper')?.classList.add('active');
            document.getElementById('camera-toggle-btn')?.classList.add('active');
            
            this.isCameraOn = true;
            this.startLoop();

        } catch (err) {
            this.ide.addConsoleMessage("Camera Error: " + err.message, 'error');
        }
    }

    _turnCameraOff() {
        this.stopLoop();
        if (this.mediaStream) this.mediaStream.getTracks().forEach(track => track.stop());
        this.mediaStream = null;
        if(this.ui.sidebarWebcam) this.ui.sidebarWebcam.srcObject = null;
        
        if(this.sidebarCanvasCtx) this.sidebarCanvasCtx.clearRect(0, 0, this.ui.sidebarCanvas.width, this.ui.sidebarCanvas.height);
        if(this.aiMonitorCanvasCtx) this.aiMonitorCanvasCtx.clearRect(0, 0, this.ui.aiMonitorCanvas.width, this.ui.aiMonitorCanvas.height);
        
        document.getElementById('ai-camera-wrapper')?.classList.remove('active');
        document.getElementById('camera-toggle-btn')?.classList.remove('active');
        this.isCameraOn = false;
    }

    startLoop() {
        if (this.aiRequestAnimationFrameId) return;
        this.aiRequestAnimationFrameId = requestAnimationFrame(this.processFrame.bind(this));
    }

    stopLoop() {
        if (this.aiRequestAnimationFrameId) {
            cancelAnimationFrame(this.aiRequestAnimationFrameId);
            this.aiRequestAnimationFrameId = null;
        }
    }

    async processFrame(timestamp) {
        if (!this.isCameraOn || document.hidden || !this.ui.sidebarWebcam) {
            this.aiRequestAnimationFrameId = requestAnimationFrame(this.processFrame.bind(this));
            return;
        }

        const video = this.ui.sidebarWebcam;
        if (video.readyState < 2) {
            this.aiRequestAnimationFrameId = requestAnimationFrame(this.processFrame.bind(this));
            return;
        }

        const elapsed = timestamp - this.lastPredictionTime;

        if (elapsed > this.FRAME_INTERVAL) {
            this.lastPredictionTime = timestamp - (elapsed % this.FRAME_INTERVAL);
            await this.runInference(video);
        }

        this.aiRequestAnimationFrameId = requestAnimationFrame(this.processFrame.bind(this));
    }

    async runInference(video) {
        const isMonitoring = this.isMonitorRequestingAi;
        const activeModel = this.activeMonitorModel;
        const req = this.aiRequirements;
        const results = {};
        const startTimeMs = performance.now();

        try {
            // Standard Models
            if ((isMonitoring && activeModel === 'face') || req.needsFaceCount || req.needsBlendshapes) {
                if(this.faceLandmarker) results.faceLandmarker = this.faceLandmarker.detectForVideo(video, startTimeMs);
            }
            if ((isMonitoring && activeModel === 'hand') || req.needsGestures || req.needsHands) {
                if(this.gestureRecognizer) results.gestureRecognizer = this.gestureRecognizer.recognizeForVideo(video, startTimeMs);
            }
            if ((isMonitoring && activeModel === 'classification') || req.needsClassification) {
                if(this.imageClassifier) results.imageClassifier = this.imageClassifier.classifyForVideo(video, startTimeMs);
            }
            if ((isMonitoring && activeModel === 'detection') || req.needsObjectDetection) {
                if(this.objectDetector) results.objectDetector = this.objectDetector.detectForVideo(video, startTimeMs);
            }
            
            // --- CUSTOM MODEL INFERENCE ---
            // If Block is ON (isCustomModelEnabled) OR Monitor tab is 'custom'
            if ((this.isCustomModelEnabled || (isMonitoring && activeModel === 'custom')) && this.isModelSuccessfullyLoaded && this.customModel) {
                results.customModel = await this.customModel.predict(video);
            }
            
            this.handlePredictionResults(results);

        } catch(e) { }
    }

    // =========================================================
    // 5. DRAWING & DATA
    // =========================================================

    handlePredictionResults(results) {
        if (!results) return;
        const isMonitoring = this.isMonitorRequestingAi;
        
        // A. Draw on Sidebar (Standard Models only)
        const sbCtx = this.sidebarCanvasCtx;
        if(sbCtx) {
            sbCtx.clearRect(0, 0, this.ui.sidebarCanvas.width, this.ui.sidebarCanvas.height);
            sbCtx.save();
            if (results.faceLandmarker?.faceLandmarks) {
                for (const lm of results.faceLandmarker.faceLandmarks) this.drawingUtilsSidebar.drawConnectors(lm, FaceLandmarker.FACE_LANDMARKS_TESSELATION, { color: "#C0C0C070", lineWidth: 1 });
            }
            if (results.gestureRecognizer?.landmarks) {
                for (const lm of results.gestureRecognizer.landmarks) this.drawingUtilsSidebar.drawConnectors(lm, GestureRecognizer.HAND_CONNECTIONS, { color: "#FFC107", lineWidth: 3 });
            }
            sbCtx.restore();
        }

        // B. Draw on Monitor
        if (isMonitoring && this.aiMonitorCanvasCtx) {
            const mCtx = this.aiMonitorCanvasCtx;
            mCtx.clearRect(0, 0, this.ui.aiMonitorCanvas.width, this.ui.aiMonitorCanvas.height);
            mCtx.save();
            
            if(this.ui.sidebarWebcam) {
                mCtx.scale(-1, 1);
                mCtx.translate(-this.ui.aiMonitorCanvas.width, 0);
                mCtx.drawImage(this.ui.sidebarWebcam, 0, 0, this.ui.aiMonitorCanvas.width, this.ui.aiMonitorCanvas.height);
            }
            
            // Standard Overlays
            if (results.faceLandmarker?.faceLandmarks) {
                for (const lm of results.faceLandmarker.faceLandmarks) this.drawingUtilsMonitor.drawConnectors(lm, FaceLandmarker.FACE_LANDMARKS_TESSELATION, { color: "#C0C0C070", lineWidth: 1 });
            }
            if (results.gestureRecognizer?.landmarks) {
                for (const lm of results.gestureRecognizer.landmarks) this.drawingUtilsMonitor.drawConnectors(lm, GestureRecognizer.HAND_CONNECTIONS, { color: "#FFC107", lineWidth: 3 });
            }
            if (results.objectDetector?.detections) {
                for (const detection of results.objectDetector.detections) {
                    const box = detection.boundingBox;
                    mCtx.strokeStyle = "#00FF00"; mCtx.lineWidth = 3;
                    mCtx.strokeRect(box.originX, box.originY, box.width, box.height);
                }
            }

            mCtx.restore();
            this.updateAiMonitorUI(results);
        }

        this.processAiDataForDevices(results);
    }

    updateAiMonitorUI(results) {
        let parts = [];
        const am = this.activeMonitorModel;
        
        if (am === 'face' && results.faceLandmarker) {
            parts.push(`"face_count": ${results.faceLandmarker.faceLandmarks.length}`);
            if (results.faceLandmarker.faceBlendshapes?.[0]) {
                const b = results.faceLandmarker.faceBlendshapes[0].categories.filter(c => c.score > 0.1).map(c => `    "${c.categoryName}": ${c.score.toFixed(2)}`).join(',\n');
                if(b) parts.push(`"blendshapes": {\n${b}\n  }`);
            }
        }
        else if (am === 'hand' && results.gestureRecognizer) {
             const hands = results.gestureRecognizer.handedness.map(h => h[0].categoryName).join(', ');
             const g = results.gestureRecognizer.gestures.flat().map(x => x.categoryName).join(', ');
             parts.push(`"hands": [${hands}]`);
             if(g) parts.push(`"gestures": [${g}]`);
        }
        else if (am === 'classification' && results.imageClassifier?.classifications?.[0]) {
             const t = results.imageClassifier.classifications[0].categories[0];
             parts.push(`"classification": { "label": "${t.categoryName}", "score": ${t.score.toFixed(2)} }`);
        }
        else if (am === 'detection' && results.objectDetector?.detections) {
             const d = results.objectDetector.detections.map(o => `    { "label": "${o.categories[0].categoryName}", "score": ${o.categories[0].score.toFixed(2)} }`).join(',\n');
             if(d) parts.push(`"objects": [\n${d}\n  ]`);
        }
        // Custom Model UI
        else if (am === 'custom') {
            if (!this.isModelSuccessfullyLoaded) {
                this.ui.aiMonitorDataOutput.textContent = "Status: Model NOT Loaded.\n\nUse the 'enable custom model' block\nto load a Teachable Machine URL.";
                return;
            }
            if (results.customModel) {
                const p = results.customModel.map(c => `    { "class": "${c.className}", "score": ${c.probability.toFixed(2)} }`).join(',\n');
                parts.push(`"model": "Loaded"`);
                parts.push(`"predictions": [\n${p}\n  ]`);
            } else {
                parts.push(`"status": "Waiting..."`);
            }
        }

        if (parts.length === 0) {
            this.ui.aiMonitorDataOutput.textContent = "Waiting for data...";
        } else {
            this.ui.aiMonitorDataOutput.textContent = `{\n  ${parts.join(',\n  ')}\n}`;
        }
    }

    processAiDataForDevices(results) {
        if (this.isStreamPaused) return;
        
        const isSimRunning = this.ide.isSimulationRunning;
        
        if (!this.isBlocksRequestingAi && !isSimRunning && !this.isCustomModelEnabled) return;

        const now = performance.now();
        if (now - this.lastAiSendTime < this.AI_SEND_INTERVAL_MS) return;

        const dataToSend = {};
        const forceAll = isSimRunning; 
        const req = this.aiRequirements;
        const am = this.activeMonitorModel;

        if (forceAll || req.needsFaceCount || req.needsBlendshapes || am === 'face') {
            const count = results.faceLandmarker?.faceLandmarks?.length || 0;
            dataToSend.face_count = count;
            if (count > 0 && results.faceLandmarker.faceBlendshapes[0]) {
                const shapes = {};
                results.faceLandmarker.faceBlendshapes[0].categories.forEach(c => shapes[c.categoryName] = c.score);
                dataToSend.blendshapes = shapes;
            }
        }
        if (forceAll || req.needsHands || req.needsGestures || am === 'hand') {
            const hasHands = results.gestureRecognizer?.landmarks?.length > 0;
            dataToSend.hand_count = hasHands ? results.gestureRecognizer.landmarks.length : 0;
            if (hasHands) {
                dataToSend.hands = results.gestureRecognizer.handedness.map(h => h[0].categoryName);
                if (results.gestureRecognizer.gestures.length > 0) {
                    dataToSend.gestures = results.gestureRecognizer.gestures.flat().map(g => g.categoryName);
                }
            }
        }
        if ((forceAll || req.needsClassification || am === 'classification') && results.imageClassifier?.classifications?.[0]) {
            const top = results.imageClassifier.classifications[0].categories[0];
            dataToSend.classification = { category: top.categoryName.replace(/_/g, ' '), score: top.score };
        }
        if ((forceAll || req.needsObjectDetection || am === 'detection') && results.objectDetector?.detections) {
            dataToSend.objects = results.objectDetector.detections.map(d => ({ 
                label: d.categories[0].categoryName, 
                score: d.categories[0].score, 
                x: d.boundingBox.originX, y: d.boundingBox.originY, 
                width: d.boundingBox.width, height: d.boundingBox.height 
            }));
        }

        // --- CUSTOM MODEL DATA (SORTED) ---
        if ((forceAll || this.isCustomModelEnabled) && results.customModel) {
            const rawPreds = results.customModel.map(c => ({
                class: c.className,
                score: c.probability
            }));
            // Sort by score DESC so index 0 is best match
            rawPreds.sort((a, b) => b.score - a.score);
            dataToSend.predictions = rawPreds;
        }

        if (Object.keys(dataToSend).length > 0) {
            const json = JSON.stringify(dataToSend);
            
            if (json !== this.lastAiDataJson || now - this.lastAiSendTime > 1000) {
                this.lastAiDataJson = json;
                this.lastAiSendTime = now;
                const payload = json + '\n';
                
                if (this.ide.isSimulationRunning) {
                    this.ide.sendSimulatorData(payload);
                }
                
                if (this.commManager.isConnected()) {
                    this.commManager.sendData(payload).catch(() => {});
                }
            }
        }
    }

    _initEventListeners() {
        if(this.ui.aiMonitorBtn) {
            this.ui.aiMonitorBtn.addEventListener('click', () => this.toggleAiMonitorModal(true, this.ide.loadedExtensions));
        }
        if(this.ui.aiMonitorCloseBtn) {
            this.ui.aiMonitorCloseBtn.addEventListener('click', () => this.toggleAiMonitorModal(false));
        }

        this.ui.aiMonitorToggles.forEach(toggle => {
            toggle.addEventListener('click', async () => {
                const model = toggle.dataset.model;
                
                // UI
                this.ui.aiMonitorToggles.forEach(t => t.classList.remove('active'));
                toggle.classList.add('active');
                
                this.activeMonitorModel = model;
                
                const extension = this.ide.availableExtensions.find(ext => ext.id.startsWith(model));
                if (extension) {
                    this.ui.aiMonitorHeader.style.borderColor = extension.color;
                }

                // Standard Init
                if (model === 'face') await this.initFaceLandmarker(true);
                if (model === 'hand') await this.initGestureRecognizer();
                if (model === 'classification') await this.initImageClassifier();
                if (model === 'detection') await this.initObjectDetector();
                // Custom: no init needed here, reliant on block or pre-load
                
                this._updateCameraState();
            });
        });

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) this.stopLoop();
            else if (this.isCameraOn) this.startLoop();
        });
    }

    toggleAiMonitorModal(show, loadedExtensions = new Set()) {
        if (show) {
            this.ui.aiMonitorModal.style.display = 'flex';
            this.isMonitorRequestingAi = true;
            
            let first = null;
            this.ui.aiMonitorToggles.forEach(t => {
                const m = t.dataset.model;
                if(m === 'custom') { 
                    const visible = loadedExtensions.has('custom_model');
                    t.style.display = visible ? 'flex' : 'none';
                    if(visible && !first) first = t;
                    // Prioritize custom tab if block is enabled
                    if(this.isCustomModelEnabled) first = t;
                    return; 
                }
                const ext = this.ide.availableExtensions.find(e => e.id.startsWith(m));
                const visible = ext && loadedExtensions.has(ext.id);
                t.style.display = visible ? 'flex' : 'none';
                if(visible && !first) first = t;
            });
            
            if (first && !this.activeMonitorModel) first.click();
            
            this._updateCameraState();

        } else {
            this.ui.aiMonitorModal.style.display = 'none';
            this.isMonitorRequestingAi = false;
            this.activeMonitorModel = null;
            
            this._updateCameraState();
            this._disposeUnusedModels();
        }
    }
}