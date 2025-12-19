// src/ide/managers/DeviceFileManager.js
'use strict';

export class DeviceFileManager {
    constructor(commManager, ideInstance) {
        this.commManager = commManager;
        this.ide = ideInstance; 

        // UI Reference caching
        this.ui = {
            fileManagerModal: document.getElementById('file-manager-modal'),
            fileManagerCloseBtn: document.getElementById('file-manager-close-btn'),
            fileManagerRefreshBtn: document.getElementById('file-manager-refresh-btn'),
            fileManagerUploadBtn: document.getElementById('file-manager-upload-btn'),
            fileManagerUploadInput: document.getElementById('file-manager-upload-input'),
            fileListContainer: document.getElementById('file-list-container'),
            breadcrumbs: document.getElementById('file-manager-breadcrumbs'),
            exportProjectBtn: document.getElementById('export-project-btn'),
            saveToDeviceBtn: document.getElementById('save-to-device-btn'),
            cleanUploadBtn: document.getElementById('clean-upload-btn'),
            deviceInfoBtn: document.getElementById('device-info-btn'),
            deviceInfoModal: document.getElementById('device-info-modal'),
            deviceInfoCloseBtn: document.getElementById('device-info-close-btn'),
            deviceInfoContent: document.getElementById('device-info-content'),
            
            // Library Manager Elements
            libraryManagerBtn: document.getElementById('library-manager-btn'),
            libraryManagerModal: document.getElementById('library-manager-modal'),
            libraryManagerCloseBtn: document.getElementById('library-manager-close-btn'),
            libraryListContainer: document.getElementById('library-list-container'),

            // --- NEW: Custom Library Inputs ---
            libCustomName: document.getElementById('lib-custom-name'),
            libCustomUrl: document.getElementById('lib-custom-url'),
            libCustomDesc: document.getElementById('lib-custom-desc'),
            libCustomAddBtn: document.getElementById('lib-custom-add-btn'),
        };
        
        this.currentDevicePath = '/';
        
        // Libraries list
        this.availableLibraries = [
            { name: 'ssd1306', description: 'Driver for monochrome 128x64 SSD1306 OLED displays (I2C).', url: 'https://raw.githubusercontent.com/micropython/micropython-lib/master/micropython/drivers/display/ssd1306/ssd1306.py' },
            { name: 'dht', description: 'Driver for DHT11/DHT22 temperature and humidity sensors.', url: 'https://raw.githubusercontent.com/micropython/micropython-lib/master/micropython/drivers/sensor/dht/dht.py' },
            { name: 'hcsr04', description: 'Driver for HC-SR04 ultrasonic distance sensors.', url: 'https://raw.githubusercontent.com/rsc1975/micropython-hcsr04/master/hcsr04.py' },
            { name: 'neopixel', description: 'Driver for WS2812B (NeoPixel) addressable RGB LEDs.', url: 'https://raw.githubusercontent.com/micropython/micropython-lib/master/micropython/drivers/led/neopixel/neopixel.py' },
            { name: 'urequests', description: 'Library for making HTTP web requests (GET, POST, etc.).', url: 'https://raw.githubusercontent.com/micropython/micropython-lib/master/micropython/urequests/urequests.py' },
            { name: 'umqtt_simple', description: 'A simple and robust client for MQTT.', url: 'https://raw.githubusercontent.com/micropython/micropython-lib/master/micropython/umqtt.simple/umqtt/simple.py' }
        ];
    }
    
    init() {
        this.ui.fileManagerCloseBtn.addEventListener('click', () => this.close());
        this.ui.fileManagerRefreshBtn.addEventListener('click', () => this.fetchAndRenderFileList());
        this.ui.fileManagerUploadBtn.addEventListener('click', () => this.ui.fileManagerUploadInput.click());
        this.ui.fileManagerUploadInput.addEventListener('change', (e) => this.uploadSelectedFileToDevice(e.target.files[0]));
        this.ui.exportProjectBtn.addEventListener('click', () => this.ide.exportProject());
        this.ui.saveToDeviceBtn.addEventListener('click', () => this.saveCodeToDevice());
        this.ui.cleanUploadBtn.addEventListener('click', () => this.cleanAndUpload());
        this.ui.deviceInfoBtn.addEventListener('click', () => this.showDeviceInfo());
        this.ui.deviceInfoCloseBtn.addEventListener('click', () => this.ui.deviceInfoModal.style.display = 'none');
        
        // Library Manager Listeners
        this.ui.libraryManagerBtn.addEventListener('click', () => this.showLibraryManager());
        this.ui.libraryManagerCloseBtn.addEventListener('click', () => this.ui.libraryManagerModal.style.display = 'none');
        
        // NEW: Custom Library Add Listener
        if (this.ui.libCustomAddBtn) {
            this.ui.libCustomAddBtn.addEventListener('click', () => this.handleCustomLibraryInstall());
        }
    }

    // Helper to pause the read loop, do work, and resume
    async performAtomicDeviceOperation(asyncFn) {
        if (!this.commManager.isConnected()) throw new Error("Device is not connected.");
        
        // For WebREPL, check if authenticated
        if (this.commManager.getConnectionType() === 'wifi') {
            const comm = this.commManager.getActiveComm();
            if (comm && !comm.isAuthenticated) {
                throw new Error("WebREPL not authenticated. Please reconnect.");
            }
        }

        await this.commManager.stopReadLoop();
        await new Promise(resolve => setTimeout(resolve, 50)); 

        try {
            return await asyncFn();
        } catch (error) {
            console.error("Device operation failed:", error);
            throw error;
        } finally {
            await this.commManager.startReadLoop();
        }
    }

    log(message, type = 'info') { this.ide.addConsoleMessage(message, type); }
    
    open() {
        if (!this.commManager.isConnected()) return this.ide.toastManager.show("Connect to a device to manage files.", "warning");
        this.currentDevicePath = '/';
        this.ui.fileManagerModal.style.display = 'flex';
        this.fetchAndRenderFileList();
    }

    close() { this.ui.fileManagerModal.style.display = 'none'; }

    async uploadProject(projectFiles) {
        return this.performAtomicDeviceOperation(async () => {
            let isInRawRepl = false;
            let attempt = 0;
            const maxRetries = 3; 

            while (!isInRawRepl && attempt < maxRetries) {
                attempt++;
                
                if (!this.commManager.isConnected()) {
                    throw new Error("Device disconnected unexpectedly.");
                }

                try {
                    this.log(attempt > 1 ? `Retrying connection (Attempt ${attempt})...` : 'Interrupting device...');
                    
                    await this.commManager.enterRawREPL();
                    isInRawRepl = true; 
                } catch (e) {
                    console.warn(`Raw REPL attempt ${attempt} failed:`, e);
                    try { await this.commManager.sendData('\x02'); } catch(err) {}
                    await new Promise(r => setTimeout(r, 1000));
                    
                    if (attempt === maxRetries) {
                        throw new Error("Could not initialize device. Please press the physical RESET button on the board.");
                    }
                }
            }

            try {
                const hasLibDir = Object.keys(projectFiles).some(path => path.startsWith('lib/'));
                if (hasLibDir) {
                    this.log('Checking /lib folder...');
                    await this.commManager.rawREPL_execute("import os; os.mkdir('lib') if 'lib' not in os.listdir() else None");
                }
                for (const [filePath, fileContent] of Object.entries(projectFiles)) {
                    this.log(`Uploading ${filePath}...`);
                    await this._uploadSingleFileInRawMode(filePath, fileContent);
                }
            } catch (e) {
                throw e; 
            } finally {
                await this.commManager.exitRawREPL().catch(e => console.warn("Failed to exit Raw REPL", e));
            }
        });
    }

    async _uploadSingleFileInRawMode(fileName, fileContent) {
        const CHUNK_SIZE = 64; 
        await this.commManager.rawREPL_execute(`f = open('${fileName}', 'w')`);
        for (let i = 0; i < fileContent.length; i += CHUNK_SIZE) {
            const chunk = fileContent.substring(i, i + CHUNK_SIZE);
            const escapedChunk = JSON.stringify(chunk); 
            await this.commManager.rawREPL_execute(`f.write(${escapedChunk})`);
            await new Promise(r => setTimeout(r, 20));
        }
        await this.commManager.rawREPL_execute(`f.close()`);
    }

    // --- FILE LISTING & MANAGEMENT ---

    async fetchAndRenderFileList() {
        this.ui.fileListContainer.innerHTML = `<p style="padding: 1rem;">Loading files from ${this.currentDevicePath}...</p>`;
        this.renderBreadcrumbs();
        try {
            const items = await this.performAtomicDeviceOperation(async () => {
                await this.commManager.enterRawREPL();
                const sep = this.currentDevicePath.endsWith('/') ? '' : '/';
                const command = `import os, ujson; print(ujson.dumps([(i, (os.stat('${this.currentDevicePath}${sep}' + i)[0] & 0x4000) != 0) for i in os.listdir('${this.currentDevicePath}')]))`;
                
                const response = await this.commManager.rawREPL_execute(command, 10000);
                await this.commManager.exitRawREPL();
                const start = response.indexOf('[');
                const end = response.lastIndexOf(']');
                
                if (start === -1 || end === -1) {
                    throw new Error(`Device Error: ${response.trim()}`);
                }

                const jsonStr = response.substring(start, end + 1);
                return JSON.parse(jsonStr);
            });
            
            this.renderFileList(items);
            
        } catch (e) {
            console.error("File fetch error:", e);
            this.ui.fileListContainer.innerHTML = `<p style="padding: 1rem; color: var(--accent-error);">Error fetching files: ${e.message}</p>`;
            try { await this.commManager.exitRawREPL(); } catch(err){}
        }
    }

    renderBreadcrumbs() {
        const container = this.ui.breadcrumbs;
        container.innerHTML = '';
        const pathParts = this.currentDevicePath.split('/').filter(p => p);
        
        const rootEl = document.createElement('span');
        rootEl.textContent = 'Device > ';
        rootEl.onclick = () => { this.currentDevicePath = '/'; this.fetchAndRenderFileList(); };
        container.appendChild(rootEl);

        let currentPath = '';
        pathParts.forEach((part, index) => {
            currentPath += '/' + part;
            const partEl = document.createElement('span');
            partEl.textContent = `${part} > `;
            const clickablePath = currentPath; 
            if (index < pathParts.length - 1) {
                partEl.onclick = () => { this.currentDevicePath = clickablePath; this.fetchAndRenderFileList(); };
            }
            container.appendChild(partEl);
        });
    }
    
    renderFileList(items) {
        const container = this.ui.fileListContainer;
        container.innerHTML = ''; 

        items.sort((a, b) => {
            if (a[1] && !b[1]) return -1;
            if (!a[1] && b[1]) return 1;
            return a[0].localeCompare(b[0]);
        });

        if (items.length === 0) {
            container.innerHTML = '<p style="padding: 1rem; color: var(--text-secondary);">This directory is empty.</p>';
            return;
        }

        items.forEach(([itemName, isDir]) => {
            const itemEl = document.createElement('div');
            itemEl.className = 'file-list-item';
            itemEl.innerHTML = `
                <div class="file-name">
                    <span>${isDir ? '📁' : '📄'}</span>
                    <span>${itemName}</span>
                </div>
                <div class="file-actions"></div>
            `;
            
            const nameEl = itemEl.querySelector('.file-name');
            const actionsEl = itemEl.querySelector('.file-actions');

            if (isDir) {
                nameEl.style.cursor = 'pointer';
                nameEl.onclick = () => {
                    this.currentDevicePath = this.currentDevicePath === '/' ? `/${itemName}` : `${this.currentDevicePath}/${itemName}`;
                    this.fetchAndRenderFileList();
                };
            } else {
                const openBtn = document.createElement('button');
                openBtn.className = 'btn secondary';
                openBtn.textContent = 'Open';
                openBtn.onclick = () => this.openFileFromDevice(itemName);
                actionsEl.appendChild(openBtn);

                if (itemName.endsWith('.py')) {
                    const runBtn = document.createElement('button');
                    runBtn.className = 'btn secondary';
                    runBtn.textContent = 'Run';
                    runBtn.onclick = () => this.runFileOnDevice(itemName);
                    actionsEl.appendChild(runBtn);
                }
            }
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn danger';
            deleteBtn.textContent = 'Delete';
            deleteBtn.onclick = (e) => { e.stopPropagation(); this.deleteFileOnDevice(itemName, isDir); };
            actionsEl.appendChild(deleteBtn);
            
            container.appendChild(itemEl);
        });
    }

    async openFileFromDevice(fileName) {
        this.log(`Reading ${fileName} from device...`);
        try {
            const content = await this.performAtomicDeviceOperation(async () => {
                await this.commManager.enterRawREPL();
                const fullPath = this.currentDevicePath === '/' ? `/${fileName}` : `${this.currentDevicePath}/${fileName}`;
                const command = `with open('${fullPath}', 'r') as f: print(f.read())`;
                const res = await this.commManager.rawREPL_execute(command);
                await this.commManager.exitRawREPL();
                return res;
            });
            this.ide.loadCodeIntoEditor(fileName, content);
            this.close();
        } catch (e) {
            this.log(`Error reading file: ${e.message}`, 'error');
            try { await this.commManager.exitRawREPL(); } catch(err){}
        }
    }

    async runFileOnDevice(fileName) {
        const fullPath = this.currentDevicePath === '/' ? `/${fileName}` : `${this.currentDevicePath}/${fileName}`;
        this.log(`>>> Executing ${fullPath}...`, 'input');
        this.ide.switchView('console');
        this.close();
        try {
            await this.commManager.sendData('\x03'); // Stop
            await new Promise(r => setTimeout(r, 100));
            await this.commManager.sendData(`exec(open('${fullPath}').read())\r\n`);
        } catch (e) {
            this.log(`Error running file: ${e.message}`, 'error');
        }
    }

    async deleteFileOnDevice(itemName, isDir) {
        // --- SAFETY CHECK: Prevent deleting connectivity scripts while connected wirelessly ---
        const connType = this.commManager.getConnectionType();
        
        if (connType === 'wifi') {
            const protectedFiles = ['boot.py', 'webrepl_cfg.py'];
            if (protectedFiles.includes(itemName)) {
                this.ide.toastManager.show(`Cannot delete "${itemName}" via Wi-Fi. Connect via USB.`, "error");
                return;
            }
        } 
        else if (connType === 'ble') {
            const protectedFiles = ['boot.py', 'ble_uart_repl.py'];
            if (protectedFiles.includes(itemName)) {
                this.ide.toastManager.show(`Cannot delete "${itemName}" via Bluetooth. Connect via USB.`, "error");
                return;
            }
        }

        if (!confirm(`Delete ${itemName}? This cannot be undone.`)) return;
        try {
            await this.performAtomicDeviceOperation(async () => {
                await this.commManager.enterRawREPL();
                const fullPath = this.currentDevicePath === '/' ? `/${itemName}` : `${this.currentDevicePath}/${itemName}`;
                const command = `import os; os.${isDir ? 'rmdir' : 'remove'}('${fullPath}')`;
                await this.commManager.rawREPL_execute(command);
                await this.commManager.exitRawREPL();
                this.log(`Deleted ${fullPath}.`, 'success');
            });
            await this.fetchAndRenderFileList();
        } catch (e) {
            this.log(`Error deleting: ${e.message}`, 'error');
            try { await this.commManager.exitRawREPL(); } catch(err){}
        }
    }

    async saveCodeToDevice() {
        const fileName = prompt("Enter filename to save on device:", this.ide.activeFile || "main.py");
        if (!fileName) return;
        try {
            this.log(`Saving to ${fileName}...`, 'info');
            await this.performAtomicDeviceOperation(async () => {
                await this.commManager.enterRawREPL();
                await this._uploadSingleFileInRawMode(fileName, this.ide.currentCode);
                await this.commManager.exitRawREPL();
            });
            this.log(`Saved ${fileName}.`, 'success');
            await this.fetchAndRenderFileList();
        } catch (e) {
            this.log(`Save failed: ${e.message}`, 'error');
        }
    }
    
    async cleanAndUpload() {
        try {
            this.log('Cleaning device (Protected Mode)...', 'warning');
            
            await this.performAtomicDeviceOperation(async () => {
                await this.commManager.enterRawREPL();

                const connType = this.commManager.getConnectionType();
                let protectedFiles = [];
                
                if (connType === 'wifi') {
                    protectedFiles = ['boot.py', 'webrepl_cfg.py'];
                } else if (connType === 'ble') {
                    protectedFiles = ['boot.py', 'ble_uart_repl.py'];
                }

                const pyList = "['" + protectedFiles.join("', '") + "']";

                const cleanCmd = `
import os
try:
    keep = ${pyList}
    for f in os.listdir():
        if f not in keep and f.endswith('.py'):
            try:
                os.remove(f)
                print("Del:" + f)
            except:
                pass
except:
    pass
`;
                await this.commManager.rawREPL_execute(cleanCmd, 5000);
                await this.commManager.exitRawREPL();
            });

            this.log('Device cleaned.', 'success');
            
            await this.fetchAndRenderFileList();
            this.ide.uploadCodeToDevice();

        } catch (e) {
            this.log(`Clean failed: ${e.message}`, 'error');
            try { await this.commManager.exitRawREPL(); } catch(err){}
        }
    }

    // Info and Library functions
    async showDeviceInfo() {
        this.ui.deviceInfoModal.style.display = 'flex';
        this.ui.deviceInfoContent.innerHTML = `<p class="device-info-loading">Querying device...</p>`;
        try {
            let resultsHtml = '';
            await this.performAtomicDeviceOperation(async () => {
                await this.commManager.enterRawREPL();
                
                const commands = [
                    { label: 'MicroPython', command: "import sys; print(sys.version)" },
                    { label: 'Board/OS', command: "import os; print(os.uname().sysname + ' ' + os.uname().release)" },
                    { label: 'CPU Freq', command: "import machine; print(f'{machine.freq() / 1000000} MHz')" },
                    { label: 'Free RAM', command: "import gc; print(f'{gc.mem_free()} bytes')" },
                    { label: 'Wi-Fi IP', command: "import network; wlan = network.WLAN(network.STA_IF); print(wlan.ifconfig()[0] if wlan.isconnected() else 'Not Connected')" }
                ];

                for (const item of commands) {
                    try {
                        const val = await this.commManager.rawREPL_execute(item.command, 2000);
                        const cleanVal = val.replace(/^'|'$/g, "");
                        resultsHtml += `<div class="device-info-item"><span class="device-info-label">${item.label}</span><span class="device-info-value">${cleanVal}</span></div>`;
                    } catch (e) {
                        resultsHtml += `<div class="device-info-item"><span class="device-info-label">${item.label}</span><span class="device-info-value">Error</span></div>`;
                    }
                }
                await this.commManager.exitRawREPL();
            });
            this.ui.deviceInfoContent.innerHTML = resultsHtml;
        } catch (e) {
            this.ui.deviceInfoContent.innerHTML = `<p style="color:var(--accent-error)">Error: ${e.message}</p>`;
        }
    }

    // --- LIBRARY MANAGER LOGIC ---

    showLibraryManager() {
        this.ui.libraryListContainer.innerHTML = '';
        
        // Render the list (includes standard + custom)
        this.availableLibraries.forEach(lib => {
            const itemEl = document.createElement('div');
            itemEl.className = 'library-item';
            
            const badge = lib.isCustom ? '<span style="font-size:10px; background:#3182ce; color:white; padding:2px 6px; border-radius:4px; margin-left:8px;">CUSTOM</span>' : '';

            itemEl.innerHTML = `
                <div class="library-info">
                    <h4>${lib.name}.py ${badge}</h4>
                    <p>${lib.description}</p>
                </div>
                <div class="library-actions">
                    <button class="btn primary install-btn" data-name="${lib.name}" data-url="${lib.url}">
                        ${lib.isCustom ? 'Re-install' : 'Add'}
                    </button>
                </div>
            `;
            this.ui.libraryListContainer.appendChild(itemEl);
        });

        this.ui.libraryListContainer.querySelectorAll('.install-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const { name, url } = e.target.dataset;
                e.target.textContent = 'Downloading...';
                e.target.disabled = true;
                this.installLibrary(name, url).then(() => {
                    e.target.textContent = 'Installed!';
                    setTimeout(() => { e.target.textContent = 'Re-install'; e.target.disabled = false; }, 2000);
                }).catch((err) => {
                    e.target.textContent = 'Failed';
                    setTimeout(() => { e.target.textContent = 'Retry'; e.target.disabled = false; }, 2000);
                });
            });
        });

        this.ui.libraryManagerModal.style.display = 'flex';
    }

    async handleCustomLibraryInstall() {
        const ui = this.ui;
        const nameInput = ui.libCustomName;
        const urlInput = ui.libCustomUrl;
        const descInput = ui.libCustomDesc;
        const btn = ui.libCustomAddBtn;

        let name = nameInput.value.trim();
        let url = urlInput.value.trim();
        const desc = descInput.value.trim() || "Custom Library";

        if (!name || !url) {
            this.ide.toastManager.show("Please provide both a Filename and a URL.", "warning");
            return;
        }

        name = name.replace(/\.py$/, '');

        // Auto-fix GitHub Blob URLs
        if (url.includes('github.com') && url.includes('/blob/')) {
            url = url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
        }

        const originalText = btn.textContent;
        btn.textContent = "Fetching...";
        btn.disabled = true;

        try {
            await this.installLibrary(name, url);
            
            // Add to the local list
            const newItem = { name: name, description: desc, url: url, isCustom: true };
            this.availableLibraries.push(newItem);
            this.showLibraryManager(); 
            
            nameInput.value = '';
            urlInput.value = '';
            descInput.value = '';
            
        } catch (error) {
            console.error(error);
            this.ide.toastManager.show(`Failed to install library: ${error.message}`, "error");
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    }

    async installLibrary(libName, libUrl) {
        this.log(`Downloading ${libName}.py...`);
        try {
            const response = await fetch(libUrl);
            if (!response.ok) throw new Error('Network response was not ok');
            const libCode = await response.text();

            const filePath = `lib/${libName}.py`;
            this.ide.projectFiles[filePath] = libCode;
            
            await this.ide.saveWorkspaceToCache();
            this.ide.renderFileTree();
            this.log(`✅ ${libName}.py added to project.`, 'success');
        } catch (e) {
            this.log(`Library install failed: ${e.message}`, 'error');
            throw e;
        }
    }
    
    async uploadSelectedFileToDevice(file) {
        if (!file) return;
        const content = await file.text();
        try {
            this.log(`Uploading ${file.name}...`);
            await this.performAtomicDeviceOperation(async () => {
                await this.commManager.enterRawREPL();
                const fullPath = this.currentDevicePath === '/' ? `/${file.name}` : `${this.currentDevicePath}/${file.name}`;
                await this._uploadSingleFileInRawMode(fullPath, content);
                await this.commManager.exitRawREPL();
            });
            this.log(`Uploaded ${file.name}.`, 'success');
            await this.fetchAndRenderFileList();
        } catch (e) {
            this.log(`Upload failed: ${e.message}`, 'error');
        } finally {
            this.ui.fileManagerUploadInput.value = '';
        }
    }
}