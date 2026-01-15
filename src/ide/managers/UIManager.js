// src/ide/managers/UIManager.js
'use strict';

export class UIManager {
    constructor() {
        this.elements = {};
        this.consoleBuffer = [];
        this.isConsoleUpdateScheduled = false;
        this.MAX_CONSOLE_LINES = 2000;
        this.CONSOLE_UPDATE_INTERVAL = 100;
        this.hasBle = false;
        // Cache all DOM elements immediately
        this._initializeElements();
    }

    _initializeElements() {
        this.elements = {
            // Header & Project
            projectName: document.getElementById('current-project-name'),
            projectTitleWrapper: document.getElementById('project-title-wrapper'),
            backToProjectsBtn: document.getElementById('back-to-projects-btn'),
            shareProjectBtn: document.getElementById('share-project-btn'),
            startTutorialBtn: document.getElementById('start-tutorial-btn'),
            
            // Main Views
            blocklyArea: document.getElementById('blocklyArea'),
            monacoContainer: document.getElementById('monaco-editor-container'),
            codeView: document.getElementById('code-view'),
            consoleView: document.getElementById('console-view'),
            plotterView: document.getElementById('plotter-view'),
            
            // View Toggles
            blocksViewBtn: document.getElementById('blocks-view-btn'),
            codeViewBtn: document.getElementById('code-view-btn'),
            consoleBtn: document.getElementById('console-btn'),
            plotterBtn: document.getElementById('plotter-btn'),
            liveModeBtn: document.getElementById('live-mode-btn'),
            
            // Console & Plotter
            consoleOutput: document.getElementById('console-output'),
            consoleInput: document.getElementById('console-input'),
            clearConsoleBtn: document.getElementById('clear-console-btn'),
            consoleInterruptBtn: document.getElementById('console-interrupt-btn'),
            consoleResetBtn: document.getElementById('console-reset-btn'),
            consoleDownloadBtn: document.getElementById('console-download-btn'),
            
            // Action Bar & Connection
            uploadBtn: document.getElementById('upload-code'),
            connectUsbBtn: document.getElementById('connect-usb-btn'),
            connectWifiBtn: document.getElementById('connect-wifi-btn'),
            connectBleBtn: document.getElementById('connect-ble-btn'),
            disconnectBtn: document.getElementById('disconnect-btn'),
            moreActionsBtn: document.getElementById('more-actions-btn'),
            exportProjectDropdownBtn: document.getElementById('export-project-dropdown-btn'),
            connectionStatusWrapper: document.getElementById('connection-status-wrapper'),
            
            // Sidebars
            sidebarBoardView: document.getElementById('sidebar-board-view'),
            sidebarFileView: document.getElementById('sidebar-file-view'),
            componentPalette: document.getElementById('palette-content'),
            
            // File Manager Trigger
            deviceFilesBtn: document.getElementById('device-files-btn'),
            newFileBtn: document.getElementById('new-file-btn'),
            
            // Tools & Managers
            dashboardBtn: document.getElementById('dashboard-btn'),
            aiMonitorBtn: document.getElementById('ai-monitor-btn'),

            // Workspace
            workspaceUndoBtn: document.getElementById('workspace-undo-btn'),
            workspaceRedoBtn: document.getElementById('workspace-redo-btn'),
            workspaceFloatingActions: document.querySelector('.workspace-floating-actions'),
            
            // Simulator Controls

            togglePinLabelsBtn: document.getElementById('toggle-pin-labels-btn'),
            cameraToggleBtn: document.getElementById('camera-toggle-btn'),
            playPauseBtn: document.getElementById('play-pause-btn'),
            restartBtn: document.getElementById('restart-btn'),
            fullscreenBtn: document.getElementById('fullscreen-btn'),
            fitScreenBtn: document.getElementById('fit-screen-btn'),
            gridToggleBtn: document.getElementById('grid-toggle-btn'),

            simUndoBtn: document.getElementById('sim-undo-btn'),
            simRedoBtn: document.getElementById('sim-redo-btn'),
            
            // Modals (Roots)
            webReplModal: document.getElementById('webrepl-modal'),
            webReplIpInput: document.getElementById('webrepl-ip-input'),
            webReplConnectPassword: document.getElementById('webrepl-connect-password'),
            webReplConnectTab: document.getElementById('webrepl-connect-tab'),
            webReplSetupTab: document.getElementById('webrepl-setup-tab'),
            webReplConnectContent: document.getElementById('webrepl-connect-content'),
            webReplSetupContent: document.getElementById('webrepl-setup-content'),
            
            // Buttons
            webReplConnectBtn: document.getElementById('webrepl-connect-btn'),
            webReplCancelBtn: document.getElementById('webrepl-cancel-btn'),
            webReplSetupBtn: document.getElementById('webrepl-setup-btn'),
            webReplSetupCancelBtn: document.getElementById('webrepl-setup-cancel-btn'),
            
            // Setup Inputs
            webReplSetupSsid: document.getElementById('webrepl-setup-ssid'),
            webReplSetupWifiPass: document.getElementById('webrepl-setup-wifi-pass'),
            webReplSetupReplPass: document.getElementById('webrepl-setup-repl-pass'),
            
            // BLE Elements (Pre-emptively fixing BLE modal logic too)
            bleModal: document.getElementById('ble-modal'),
            bleConnectTab: document.getElementById('ble-connect-tab'),
            bleSetupTab: document.getElementById('ble-setup-tab'),
            bleConnectContent: document.getElementById('ble-connect-content'),
            bleSetupContent: document.getElementById('ble-setup-content'),
            bleScanBtn: document.getElementById('ble-scan-btn'),
            bleCancelBtn: document.getElementById('ble-cancel-btn'),
            bleSetupBtn: document.getElementById('ble-setup-btn'),
            bleSetupCancelBtn: document.getElementById('ble-setup-cancel-btn'),
            bleSetupName: document.getElementById('ble-setup-name'),

            uploadModal: document.getElementById('upload-status-modal'),
            extensionModal: document.getElementById('extension-modal'),
            tutorialModal: document.getElementById('tutorial-modal'),
            newFileModal: document.getElementById('new-file-modal'),
            aiMonitorModal: document.getElementById('ai-monitor-modal'),
            iotDashboardModal: document.getElementById('iot-dashboard-modal'),
            
            // Upload Modal Internals
            uploadModalIcon: document.getElementById('upload-status-icon'),
            uploadModalMessage: document.getElementById('upload-status-message'),
            
            // Genius Toast
            geniusToast: document.getElementById('block-genius-toast'),
            geniusCloseBtn: document.getElementById('genius-close-btn'),
            
            // Extension Modal
            extensionList: document.getElementById('extension-list'),
            extensionModalCloseBtn: document.getElementById('extension-modal-close-btn'),

            // Tutorial Modal
            tutorialList: document.getElementById('tutorial-list'),
            tutorialModalCloseBtn: document.getElementById('tutorial-modal-close-btn'),

            // New File Modal
            newFileNameInput: document.getElementById('new-file-name-input'),
            newFileCreateBtn: document.getElementById('new-file-create-btn'),
            newFileCancelBtn: document.getElementById('new-file-cancel-btn'),

            // AI Monitor
            aiMonitorCloseBtn: document.getElementById('ai-monitor-close-btn'),
            aiMonitorToggles: document.querySelectorAll('.ai-monitor-toggle'),
            
            // Dashboard
            dashboardCloseBtn: document.getElementById('dashboard-close-btn'),
        };
    }

    setBoardCapabilities(capabilities) {
        if (capabilities.hasBle !== undefined) {
            this.hasBle = capabilities.hasBle;
        }
        // Apply initial state immediately
        this.elements.connectBleBtn.style.display = this.hasBle ? 'block' : 'none';
    }

    // --- EVENT BINDING ---

    // Accepts a 'handlers' object containing functions from ide.js
    bindEventListeners(handlers) {

        this.elements.cameraToggleBtn.addEventListener('click', handlers.onCameraToggle);
        
        // Navigation
        this.elements.backToProjectsBtn.addEventListener('click', handlers.onBackToProjects);
        this.elements.projectTitleWrapper.addEventListener('click', handlers.onRenameProject);
        this.elements.shareProjectBtn.addEventListener('click', handlers.onShareProject);
        this.elements.startTutorialBtn.addEventListener('click', handlers.onStartTutorial);

        // View Switching
        this.elements.blocksViewBtn.addEventListener('click', () => handlers.onSwitchView('blocks'));
        this.elements.codeViewBtn.addEventListener('click', () => handlers.onSwitchView('code'));
        this.elements.consoleBtn.addEventListener('click', () => handlers.onSwitchView('console'));
        this.elements.plotterBtn.addEventListener('click', () => handlers.onSwitchView('plotter'));

        // Core Actions
        this.elements.uploadBtn.addEventListener('click', handlers.onUpload);
        this.elements.liveModeBtn.addEventListener('click', handlers.onToggleLiveMode);
        
        // File Management
        this.elements.deviceFilesBtn.addEventListener('click', handlers.onOpenDeviceManager);
        this.elements.newFileBtn.addEventListener('click', handlers.onOpenNewFileModal);

        // Connection Dropdown Logic
        this._setupConnectionDropdown(handlers);

        // Console Logic
        this.elements.clearConsoleBtn.addEventListener('click', () => this.clearConsole());
        this.elements.consoleInterruptBtn.addEventListener('click', () => handlers.onConsoleControl('interrupt'));
        this.elements.consoleResetBtn.addEventListener('click', () => handlers.onConsoleControl('reset'));
        this.elements.consoleDownloadBtn.addEventListener('click', () => handlers.onConsoleControl('download'));

        this.elements.consoleInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handlers.onConsoleCommand(e.target.value);
                e.target.value = '';
            }
        });

        // ---  WEBREPL MODAL LOGIC ---
        
        // 1. Tab Switching
        this.elements.webReplConnectTab.addEventListener('click', () => {
            this.elements.webReplConnectTab.classList.add('active');
            this.elements.webReplSetupTab.classList.remove('active');
            this.elements.webReplConnectContent.classList.add('active');
            this.elements.webReplSetupContent.classList.remove('active');
        });

        this.elements.webReplSetupTab.addEventListener('click', () => {
            this.elements.webReplSetupTab.classList.add('active');
            this.elements.webReplConnectTab.classList.remove('active');
            this.elements.webReplSetupContent.classList.add('active');
            this.elements.webReplConnectContent.classList.remove('active');
        });

        // 2. Connect Button
        this.elements.webReplConnectBtn.addEventListener('click', () => {
            const ip = this.elements.webReplIpInput.value;
            const password = this.elements.webReplConnectPassword.value; // Get password
            handlers.onWebReplConnect(ip, password); // Pass both to handler
        });

        // 3. Setup Button
        this.elements.webReplSetupBtn.addEventListener('click', () => {
            const ssid = this.elements.webReplSetupSsid.value;
            const wifiPass = this.elements.webReplSetupWifiPass.value;
            const replPass = this.elements.webReplSetupReplPass.value;
            handlers.onWebReplSetup(ssid, wifiPass, replPass);
        });

        // 4. Cancel Buttons
        const closeWebRepl = () => this.elements.webReplModal.style.display = 'none';
        this.elements.webReplCancelBtn.addEventListener('click', closeWebRepl);
        this.elements.webReplSetupCancelBtn.addEventListener('click', closeWebRepl);

        // --- OPTIONAL: Password Toggles ---
        document.querySelectorAll('.password-toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const input = e.target.previousElementSibling;
                if (input) {
                    input.type = input.type === 'password' ? 'text' : 'password';
                }
            });
        });


        // --- BLE HANDLERS ---
        
        // 1. Tab Switching
        this.elements.bleConnectTab.addEventListener('click', () => {
            this.elements.bleConnectTab.classList.add('active');
            this.elements.bleSetupTab.classList.remove('active');
            this.elements.bleConnectContent.classList.add('active');
            this.elements.bleSetupContent.classList.remove('active');
        });

        this.elements.bleSetupTab.addEventListener('click', () => {
            this.elements.bleSetupTab.classList.add('active');
            this.elements.bleConnectTab.classList.remove('active');
            this.elements.bleSetupContent.classList.add('active');
            this.elements.bleConnectContent.classList.remove('active');
        });

        // 2. Scan Button (Triggers Native Browser Picker)
        this.elements.bleScanBtn.addEventListener('click', () => {
            handlers.onBleScan();
        });

        // 3. Setup Button
        this.elements.bleSetupBtn.addEventListener('click', () => {
            const name = this.elements.bleSetupName.value;
            handlers.onBleSetup(name);
        });

        // 4. Cancel Buttons
        const closeBle = () => this.elements.bleModal.style.display = 'none';
        this.elements.bleCancelBtn.addEventListener('click', closeBle);
        this.elements.bleSetupCancelBtn.addEventListener('click', closeBle);

        // --- Password Toggles (Shared) ---
        document.querySelectorAll('.password-toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const input = e.target.previousElementSibling;
                if (input) input.type = input.type === 'password' ? 'text' : 'password';
            });
        });
         
        
        // Simulator Controls

        this.elements.togglePinLabelsBtn.addEventListener('click', () => handlers.onTogglePinLabels());

        this.elements.playPauseBtn.addEventListener('click', handlers.onSimPlayPause);
        this.elements.restartBtn.addEventListener('click', handlers.onSimRestart);
        this.elements.fullscreenBtn.addEventListener('click', handlers.onSimFullscreen);
        this.elements.fitScreenBtn.addEventListener('click', handlers.onSimFitScreen);
        this.elements.gridToggleBtn.addEventListener('click', () => handlers.onToggleGrid());

        // Tool Toggles
        this.elements.dashboardBtn.addEventListener('click', handlers.onOpenDashboard);
        this.elements.aiMonitorBtn.addEventListener('click', handlers.onOpenAiMonitor);

        // Modal Closers
        this.elements.extensionModalCloseBtn.addEventListener('click', () => this.elements.extensionModal.style.display = 'none');
        this.elements.tutorialModalCloseBtn.addEventListener('click', () => this.elements.tutorialModal.style.display = 'none');
        this.elements.aiMonitorCloseBtn.addEventListener('click', () => handlers.onToggleAiMonitor(false));
        this.elements.dashboardCloseBtn.addEventListener('click', () => this.elements.iotDashboardModal.style.display = 'none');
        this.elements.geniusCloseBtn.addEventListener('click', handlers.onCloseGenius);

        // New File Modal Internal Logic
        this.elements.newFileCancelBtn.addEventListener('click', () => this.elements.newFileModal.style.display = 'none');
        this.elements.newFileCreateBtn.addEventListener('click', handlers.onCreateFile);
        this.elements.newFileNameInput.addEventListener('input', () => {
            this.elements.newFileCreateBtn.disabled = this.elements.newFileNameInput.value.trim().length === 0;
        });
        this.elements.newFileNameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !this.elements.newFileCreateBtn.disabled) handlers.onCreateFile();
        });

        // Workspace Undo/Redo
        if (this.elements.workspaceUndoBtn) {
            this.elements.workspaceUndoBtn.addEventListener('click', handlers.onUndo);
        }
        if (this.elements.workspaceRedoBtn) {
            this.elements.workspaceRedoBtn.addEventListener('click', handlers.onRedo);
        }

    }

    _setupConnectionDropdown(handlers) {
        const dropdown = this.elements.moreActionsBtn.closest('.dropdown');
        
        this.elements.moreActionsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const content = dropdown.querySelector('.dropdown-content');
            if (dropdown.classList.contains('active')) {
                dropdown.classList.remove('active');
            } else {
                const rect = this.elements.moreActionsBtn.getBoundingClientRect();
                content.style.bottom = `${window.innerHeight - rect.top + 8}px`;
                content.style.left = `${rect.left}px`;
                dropdown.classList.add('active');
            }
        });

        window.addEventListener('click', () => dropdown.classList.remove('active'));

        this.elements.connectUsbBtn.addEventListener('click', (e) => {
            e.preventDefault(); handlers.onConnect('usb');
        });
        this.elements.connectWifiBtn.addEventListener('click', (e) => {
            e.preventDefault(); handlers.onConnect('wifi');
        });
        this.elements.connectBleBtn.addEventListener('click', (e) => {
            e.preventDefault(); handlers.onConnect('ble');
        });
        this.elements.disconnectBtn.addEventListener('click', (e) => {
            e.preventDefault(); handlers.onDisconnect();
        });
        this.elements.exportProjectDropdownBtn.addEventListener('click', (e) => {
            e.preventDefault(); handlers.onExportProject();
        });
    }

    // --- VIEW MANAGEMENT ---

    switchView(viewName) {
        // Reset Tabs
        [this.elements.blocksViewBtn, this.elements.codeViewBtn, 
         this.elements.consoleBtn, this.elements.plotterBtn].forEach(btn => btn.classList.remove('active'));
        
        // Hide Views
        this.elements.blocklyArea.style.display = 'none';
        this.elements.monacoContainer.style.display = 'none';
        this.elements.consoleView.classList.remove('active');
        this.elements.plotterView.classList.remove('active');
        
        // Sidebar management
        const boardView = this.elements.sidebarBoardView;
        const fileView = this.elements.sidebarFileView;

        switch(viewName) {
            case 'blocks':
                this.elements.blocksViewBtn.classList.add('active');
                this.elements.blocklyArea.style.display = 'block';
                boardView.classList.add('active');
                fileView.classList.remove('active');
                setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
                break;
            case 'code':
                this.elements.codeViewBtn.classList.add('active');
                this.elements.monacoContainer.style.display = 'block';
                fileView.classList.add('active');
                boardView.classList.remove('active');
                break;
            case 'console':
                this.elements.consoleBtn.classList.add('active');
                this.elements.consoleView.classList.add('active');
                break;
            case 'plotter':
                this.elements.plotterBtn.classList.add('active');
                this.elements.plotterView.classList.add('active');
                break;
        }
    }

    // --- STATE UPDATES ---

    updateConnectionStatus(status) {
        const wrapper = document.getElementById('connection-status-wrapper'); // Dynamic lookup to be safe
        if (wrapper) {
            wrapper.querySelector('span').textContent = status;
            wrapper.className = `connection-status-wrapper connection-${status.toLowerCase().replace(/ /g, '-')}`;
        }
    }

    updateButtonStates(hasCode, isConnected) {
        this.elements.uploadBtn.disabled = !(hasCode && isConnected);
        this.elements.deviceFilesBtn.disabled = !isConnected;
        // Live mode only active if connected
        this.elements.liveModeBtn.disabled = !isConnected;
        if (!isConnected) this.elements.liveModeBtn.classList.remove('active');
    }
    
    updateConnectionButtons(isConnected, type) {
        this.elements.disconnectBtn.style.display = isConnected ? 'block' : 'none';
        
        if (isConnected && type === 'usb') {
            // USB Connected: Hide USB connect, Show Wireless setup options
            this.elements.connectUsbBtn.style.display = 'none';
            this.elements.connectWifiBtn.style.display = 'block';
            this.elements.connectBleBtn.style.display = this.hasBle ? 'block' : 'none';
        } else if (isConnected) {
            // Wireless (WiFi/BLE) Connected: Hide all connect buttons
            this.elements.connectUsbBtn.style.display = 'none';
            this.elements.connectWifiBtn.style.display = 'none';
            this.elements.connectBleBtn.style.display = 'none';
        } else {
            // Disconnected: Show available connect options
            this.elements.connectUsbBtn.style.display = 'block';
            this.elements.connectWifiBtn.style.display = 'block';
            this.elements.connectBleBtn.style.display = this.hasBle ? 'block' : 'none';
        }
    }

    // --- CONSOLE ---

    addConsoleMessage(message, type = 'output') {
        const lines = message.replace(/\r/g, '').split('\n').filter(l => l.length > 0);
        for (const l of lines) this.consoleBuffer.push({ text: l, type });
        
        if (!this.isConsoleUpdateScheduled) {
            this.isConsoleUpdateScheduled = true;
            setTimeout(() => this.flushConsoleBuffer(), this.CONSOLE_UPDATE_INTERVAL);
        }
    }

    flushConsoleBuffer() {
        if (this.consoleBuffer.length === 0) {
            this.isConsoleUpdateScheduled = false;
            return;
        }
        const out = this.elements.consoleOutput;
        const frag = document.createDocumentFragment();
        const messages = this.consoleBuffer.splice(0);
        
        // Auto-scroll logic
        const shouldScroll = out.scrollTop + out.clientHeight >= out.scrollHeight - 30;

        for (const msg of messages) {
            const div = document.createElement('div');
            div.className = `console-message console-${msg.type}`;
            div.textContent = msg.text;
            frag.appendChild(div);
        }
        out.appendChild(frag);

        // Cleanup old messages
        while (out.childNodes.length > this.MAX_CONSOLE_LINES) {
            out.removeChild(out.firstChild);
        }

        if (shouldScroll) out.scrollTop = out.scrollHeight;

        this.isConsoleUpdateScheduled = false;
        if (this.consoleBuffer.length > 0) {
            this.isConsoleUpdateScheduled = true;
            setTimeout(() => this.flushConsoleBuffer(), this.CONSOLE_UPDATE_INTERVAL);
        }
    }

    clearConsole() {
        this.elements.consoleOutput.innerHTML = '';
        this.consoleBuffer = [];
        this.addConsoleMessage('Console cleared.', 'info');
    }

    downloadConsoleLog(projectName) {
        const text = this.consoleBuffer.map(msg => msg.text).join('\n') || this.elements.consoleOutput.innerText;
        if (!text) return;
        
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${projectName}_console.log`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // --- MODALS & OVERLAYS ---

    showUploadModal(state) {
        const icon = this.elements.uploadModalIcon;
        const msg = this.elements.uploadModalMessage;
        icon.className = 'upload-status-icon';
        
        switch(state) {
            case 'uploading':
                icon.classList.add('uploading');
                icon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>`;
                msg.textContent = 'Uploading to device...';
                break;
            case 'success':
                icon.classList.add('success');
                icon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
                msg.textContent = 'Upload Complete!';
                break;
            case 'error':
                icon.classList.add('error');
                icon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
                msg.textContent = 'Upload Failed';
                break;
        }
        this.elements.uploadModal.style.display = 'flex';
    }

    hideUploadModal() {
        this.elements.uploadModal.style.display = 'none';
    }

    openNewFileModal() {
        this.elements.newFileNameInput.value = '';
        this.elements.newFileCreateBtn.disabled = true;
        this.elements.newFileModal.style.display = 'flex';
        this.elements.newFileNameInput.focus();
    }
    
    closeNewFileModal() {
        this.elements.newFileModal.style.display = 'none';
    }
}