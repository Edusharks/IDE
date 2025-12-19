// src/ide/managers/DashboardBuilder.js
'use strict';

import * as Blockly from 'blockly/core';
import { showCustomPrompt, showCustomConfirm } from '../../shared/utils/modals.js';

export class DashboardBuilder {
    constructor(ideInstance) {
        this.ide = ideInstance;
        this.ui = {}; 

        this.dashboardComponents = [];
        this.dashboardSelectedId = null;
        this.dashboardViewMode = 'laptop';
        this.dashboardNextId = 1;
        this.dashboardInitialized = false;
        this.dashboardChartInstances = {};
        this.dashboardBlocks = [];
        this.dashboardBlocksDefined = false;
        this.DASHBOARD_GRID_SIZE = 20;
        
        // Mode State: 'properties' or 'templates'
        this.currentSidebarMode = 'properties'; 
        this.selectedTemplateName = null;

        // 1. Default Templates (Hardcoded JSON structure)
        this.defaultTemplates = {
            "Weather Station": [
                {"id":"heading_1","type":"heading","x":280,"y":20,"width":300,"height":50,"label":"My Weather Station","color":"#1c2a3a","fontSize":24,"fontWeight":700,"textAlign":"center"},
                {"id":"card_1","type":"card","x":40,"y":100,"width":220,"height":120,"value":"24.5°C","label":"Temperature","icon":"🌡️","color":"#f56565","bgColor":"#ffffff","fontSize":32,"fontWeight":700,"borderRadius":8},
                {"id":"card_2","type":"card","x":300,"y":100,"width":220,"height":120,"value":"45%","label":"Humidity","icon":"💧","color":"#5a67d8","bgColor":"#ffffff","fontSize":32,"fontWeight":700,"borderRadius":8},
                {"id":"led_1","type":"led","x":560,"y":100,"width":80,"height":80,"value":1,"min":0,"max":1,"label":"Status","colorOn":"#28a745","colorOff":"#555555"}
            ],
            "Robot Controller": [
                {"id":"joy_1","type":"joystick","x":40,"y":40,"width":200,"height":200,"label":"Movement","radius":80,"valueX":0,"valueY":0},
                {"id":"btn_1","type":"button","x":300,"y":60,"width":120,"height":40,"label":"Horn","value":"1","shape":"rounded","color":"#ffffff","bgColor":"#ed64a6","fontSize":16,"fontWeight":700,"borderRadius":20},
                {"id":"tog_1","type":"toggle","x":300,"y":140,"width":80,"height":50,"label":"Lights","value":1,"min":0,"max":1,"color":"#f6ad55"}
            ]
        };

        // 2. Load User Templates from LocalStorage
        try {
            this.userTemplates = JSON.parse(localStorage.getItem('dashboard_user_templates') || '{}');
        } catch (e) {
            this.userTemplates = {};
        }

        this.dashboardComponentConfig = {
          'button':   { props: ['general', 'text', 'appearance', 'layout', 'data', 'actions'], defaults: { width: 120, height: 40, label: 'Button', value: '1', shape: 'rounded', color: '#ffffff', bgColor: '#007aff', fontSize: 16, fontWeight: 700, borderRadius: 20 } },
          'slider':   { props: ['general', 'text', 'appearance', 'layout', 'data', 'actions'], defaults: { width: 200, height: 50, label: 'Slider', value: 50, min: 0, max: 100, color: '#007aff', bgColor: '#ffffff', borderRadius: 8 } },
          'toggle':   { props: ['general', 'text', 'appearance', 'layout', 'data', 'actions'], defaults: { width: 80, height: 50, label: 'Toggle', value: 1, min: 0, max: 1, color: '#34c759' } },
          'color-picker': { props: ['general', 'text', 'layout', 'data', 'actions'], defaults: { width: 150, height: 120, label: 'Color Picker', value: '#007aff' } },
          'joystick': { props: ['general', 'text', 'layout', 'data', 'actions'], defaults: { width: 150, height: 150, label: 'Joystick', radius: 60, valueX: 0, valueY: 0 } },
          'gauge':    { props: ['general', 'text', 'appearance', 'layout', 'data', 'actions'], defaults: { width: 180, height: 150, value: 65, min: 0, max: 100, label: 'Gauge', color: '#007aff', fontSize: 14 } },
          'line-chart': { props: ['general', 'text', 'appearance', 'layout', 'data', 'actions'], defaults: { width: 300, height: 200, value: '30,50,45,65,70', options: 'Mon,Tue,Wed,Thu,Fri', label: 'History', color: '#007aff', bgColor: '#ffffff', borderRadius: 8 } },
          'led':      { props: ['general', 'text', 'appearance', 'layout', 'data', 'actions'], defaults: { width: 80, height: 80, value: 1, min: 0, max: 1, label: 'LED', colorOn: '#28a745', colorOff: '#555555' } },
          'card':     { props: ['general', 'text', 'appearance', 'layout', 'data', 'actions'], defaults: { width: 220, height: 120, value: 'Online', label: 'Device Status', icon: '✅', color: '#1c2a3a', bgColor: '#ffffff', fontSize: 32, fontWeight: 700, borderRadius: 8 } },
          'label':    { props: ['general', 'text', 'appearance', 'layout', 'actions'], defaults: { width: 250, height: 50, label: 'My Label', color: '#1c2a3a', fontSize: 18, fontWeight: 400, textAlign: 'left' } },
          'container':{ props: ['general', 'appearance', 'layout', 'actions'], defaults: { width: 200, height: 150, bgColor: '#ffffff', borderColor: '#e5e7eb', borderRadius: 8 } },
          'heading':  { props: ['general', 'text', 'appearance', 'layout', 'actions'], defaults: { width: 250, height: 50, label: 'My Dashboard', color: '#1c2a3a', fontSize: 24, fontWeight: 700, textAlign: 'left' } },
          'paragraph':{ props: ['general', 'text', 'appearance', 'layout', 'actions'], defaults: { width: 250, height: 100, label: 'This is a description of the dashboard.', color: '#6b7280', fontSize: 14, fontWeight: 400, textAlign: 'left' } },
          'image':    { props: ['general', 'appearance', 'layout', 'data', 'actions'], defaults: { width: 150, height: 150, src: 'https://via.placeholder.com/150', borderRadius: 8 } }
        };
    }

    init() {
        if (this.dashboardInitialized) return;
        this.dashboardInitialized = true;

        this.ui = {
            dashboardBtn: document.getElementById('dashboard-btn'),
            iotDashboardModal: document.getElementById('iot-dashboard-modal'),
            dashboardCloseBtn: document.getElementById('dashboard-close-btn'),
            dashboardCanvas: document.getElementById('dashboard-canvas'),
            dashboardClearBtn: document.getElementById('dashboard-clear-btn'),
            dashboardExportBtn: document.getElementById('dashboard-export-btn'),
            dashboardDeleteBtn: document.getElementById('delete-component'),
            dashboardViewToggles: document.querySelectorAll('.view-toggle button'),
            propertiesContent: document.getElementById('properties-content'), // Default container
            noSelectionPrompt: document.getElementById('no-selection-prompt'),
            exportModal: document.getElementById('export-modal'),
            modalCloseBtn: document.getElementById('modal-close-btn'),
            copyMicroPythonBtn: document.getElementById('copy-micropython-btn'),
        };

        // --- DYNAMIC UI INJECTION ---
        // Ensure "templates-content" exists in the sidebar without forcing user to edit HTML
        let tplContent = document.getElementById('templates-content');
        if (!tplContent && this.ui.propertiesContent) {
            tplContent = document.createElement('div');
            tplContent.id = 'templates-content';
            tplContent.style.display = 'none';
            tplContent.style.padding = '10px';
            tplContent.style.height = '100%';
            // Insert it after properties content
            this.ui.propertiesContent.parentNode.appendChild(tplContent);
        }
        this.ui.templatesContent = tplContent;

        // --- EVENT LISTENERS ---
        this.ui.dashboardCloseBtn.addEventListener('click', () => this.hide());
        
        document.querySelectorAll('.palette .component-item').forEach(i => {
            const clone = i.cloneNode(true);
            i.parentNode.replaceChild(clone, i);
            clone.addEventListener('dragstart', e => e.dataTransfer.setData('text/plain', e.target.closest('.component-item').dataset.type));
        });

        this.ui.dashboardCanvas.addEventListener('dragover', e => e.preventDefault());
        this.ui.dashboardCanvas.addEventListener('drop', (e) => this.handleDashboardDrop(e));
        
        this.ui.dashboardViewToggles.forEach(b => b.addEventListener('click', () => this.setDashboardViewMode(b.dataset.view)));
        this.ui.dashboardClearBtn.addEventListener('click', () => this.clearDashboardCanvas());
        this.ui.dashboardExportBtn.addEventListener('click', () => this.generateAndApplyDashboard());
        this.ui.dashboardDeleteBtn.addEventListener('click', () => this.deleteSelectedComponent());
        
        // Template Buttons
        const loadBtn = document.getElementById('dashboard-load-template-btn');
        if(loadBtn) loadBtn.addEventListener('click', () => this.openTemplateListUI());
        
        const saveBtn = document.getElementById('dashboard-save-template-btn');
        if(saveBtn) saveBtn.addEventListener('click', () => this.saveCurrentAsTemplate());
        
        // Background Click Deselect
        document.addEventListener('click', (e) => { 
            if (this.ui.iotDashboardModal.style.display === 'flex' && !e.target.closest('.dashboard-component, .properties-panel')) {
                this.selectDashboardComponent(null); 
            }
        });
        
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

    show() {
        if (!this.dashboardInitialized) this.init();
        this.ui.iotDashboardModal.style.display = 'flex';
        this.ide.addConsoleMessage("Dashboard builder opened.", "info");
    }

    hide() {
        this.ui.iotDashboardModal.style.display = 'none';
    }

    setDashboardViewMode(mode) {
        this.dashboardViewMode = mode;
        this.ui.dashboardViewToggles.forEach(b => b.classList.toggle('active', b.dataset.view === mode));
        this.ui.dashboardCanvas.className = `canvas ${mode}-view`;
        Object.values(this.dashboardChartInstances).forEach(chart => chart.destroy());
        this.dashboardChartInstances = {};

        if (mode === 'mobile') {
            if (!this.ui.dashboardCanvas.querySelector('.mobile-frame')) {
                this.ui.dashboardCanvas.innerHTML = '<div class="mobile-frame"><div class="mobile-frame-content"></div></div>';
            }
        } else {
            this.ui.dashboardCanvas.innerHTML = '';
        }
        this.renderAllDashboardComponents();
    }

    // --- TEMPLATE MANAGEMENT ---

    openTemplateListUI() {
        this.currentSidebarMode = 'templates';
        this.dashboardSelectedId = null;
        this.selectedTemplateName = null;
        
        // Visual updates
        document.querySelectorAll('.dashboard-component.selected').forEach(el => el.classList.remove('selected'));
        
        this.ui.propertiesContent.style.display = 'none';
        this.ui.templatesContent.style.display = 'block';

        this.ui.templatesContent.innerHTML = `
            <div class="template-list-container">
                <h4 class="prop-title">Select Template</h4>
                <div class="template-list" id="template-list-scroll"></div>
                <div class="template-actions">
                    <button id="btn-load-selected-template" class="btn primary" style="width:100%" disabled>Load Template</button>
                </div>
            </div>
        `;

        this.renderTemplateItems();

        document.getElementById('btn-load-selected-template').addEventListener('click', () => {
            if (this.selectedTemplateName) this.loadTemplate(this.selectedTemplateName);
        });
    }

    renderTemplateItems() {
        const listContainer = document.getElementById('template-list-scroll');
        if (!listContainer) return;
        listContainer.innerHTML = '';

        const allTemplates = { ...this.defaultTemplates, ...this.userTemplates };

        Object.keys(allTemplates).forEach(name => {
            const isDefault = this.defaultTemplates.hasOwnProperty(name);
            const item = document.createElement('div');
            item.className = `template-item ${this.selectedTemplateName === name ? 'selected' : ''}`;
            
            let html = `<span class="template-item-name">${name} ${isDefault ? '<span class="template-tag">Default</span>' : ''}</span>`;
            if (!isDefault) html += `<button class="template-delete-btn" title="Delete Template">&times;</button>`;
            
            item.innerHTML = html;

            item.addEventListener('click', (e) => {
                if (e.target.classList.contains('template-delete-btn')) return;
                this.selectedTemplateName = name;
                document.querySelectorAll('.template-item').forEach(el => el.classList.remove('selected'));
                item.classList.add('selected');
                document.getElementById('btn-load-selected-template').disabled = false;
            });

            if (!isDefault) {
                const delBtn = item.querySelector('.template-delete-btn');
                delBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.deleteUserTemplate(name);
                });
            }
            listContainer.appendChild(item);
        });
    }

    loadTemplate(name) {
        const allTemplates = { ...this.defaultTemplates, ...this.userTemplates };
        const templateData = allTemplates[name];

        if (templateData) {
            if (this.dashboardComponents.length > 0) {
                if (!confirm(`Load "${name}"? This will overwrite your current dashboard.`)) return;
            }

            this.dashboardComponents = JSON.parse(JSON.stringify(templateData));
            this.dashboardSelectedId = null;
            
            // Calc Next ID
            const maxId = this.dashboardComponents.reduce((max, comp) => {
                const parts = comp.id.split('_');
                const idNum = parseInt(parts[parts.length-1], 10);
                return !isNaN(idNum) && idNum > max ? idNum : max;
            }, 0);
            this.dashboardNextId = maxId + 1;

            this.renderAllDashboardComponents();
            
            // Switch back to properties view
            this.currentSidebarMode = 'properties';
            this.updateDashboardPropertiesPanel(null);
            
            this.ide.addConsoleMessage(`Loaded template: "${name}".`, 'success');
        }
    }

    saveCurrentAsTemplate() {
        if (this.dashboardComponents.length === 0) return this.ide.toastManager.show("Canvas is empty.", "warning");

        showCustomPrompt("Enter a name for this template:", "My Dashboard", (name) => {
            if (!name) return;
            if (this.defaultTemplates.hasOwnProperty(name)) return this.ide.toastManager.show("Cannot overwrite default templates.", "error");

            this.userTemplates[name] = JSON.parse(JSON.stringify(this.dashboardComponents));
            localStorage.setItem('dashboard_user_templates', JSON.stringify(this.userTemplates));
            this.ide.addConsoleMessage(`Template "${name}" saved!`, 'success');
            
            if (this.currentSidebarMode === 'templates') this.renderTemplateItems();
        });
    }

    deleteUserTemplate(name) {
        if (confirm(`Delete template "${name}"?`)) {
            delete this.userTemplates[name];
            localStorage.setItem('dashboard_user_templates', JSON.stringify(this.userTemplates));
            
            if (this.selectedTemplateName === name) {
                this.selectedTemplateName = null;
                document.getElementById('btn-load-selected-template').disabled = true;
            }
            this.renderTemplateItems();
        }
    }

    // --- DRAG & DROP LOGIC ---

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
        
        x = Math.round(x / this.DASHBOARD_GRID_SIZE) * this.DASHBOARD_GRID_SIZE;
        y = Math.round(y / this.DASHBOARD_GRID_SIZE) * this.DASHBOARD_GRID_SIZE;

        const id = `${type}_${this.dashboardNextId++}`; 
        const newComp = { id, type, x, y, ...structuredClone(this.dashboardComponentConfig[type].defaults) };
        
        this.dashboardComponents.push(newComp);
        this.renderAllDashboardComponents();
        this.selectDashboardComponent(id);
        
        // Auto-refresh generated code
        this.refreshGenerator();
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
                if (labelEl) labelEl.textContent = `${comp.label} [x:${comp.valueX}, y:${comp.valueY}]`;
            };

            const joyEndHandler = () => {
                stick.style.transform = `translate(-50%, -50%)`;
                comp.valueX = 0; comp.valueY = 0;
                if (this.dashboardSelectedId === comp.id) {
                    this.updateDashboardPropertiesPanel(comp);
                     if (labelEl) labelEl.textContent = `${comp.label} [x:0, y:0]`;
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
            if (e.target.matches('.resize-handle, input, select') || e.target.closest('.slider-thumb, .joystick-base, .toggle-switch, .color-picker-preview')) return;
            
            e.preventDefault();
            const startX = e.clientX, startY = e.clientY, startLeft = el.offsetLeft, startTop = el.offsetTop;
            el.style.zIndex = 1000;
    
            const onMouseMove = (moveEvent) => {
                el.style.left = `${startLeft + moveEvent.clientX - startX}px`;
                el.style.top = `${startTop + moveEvent.clientY - startY}px`;
            };
            const onMouseUp = () => {
                comp.x = Math.round(el.offsetLeft / this.DASHBOARD_GRID_SIZE) * this.DASHBOARD_GRID_SIZE;
                comp.y = Math.round(el.offsetTop / this.DASHBOARD_GRID_SIZE) * this.DASHBOARD_GRID_SIZE;

                el.style.left = `${comp.x}px`; 
                el.style.top = `${comp.y}px`; 
                el.style.zIndex = this.dashboardNextId - parseInt(comp.id.split('_')[1]);
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                
                // Auto-refresh generator on move
                this.refreshGenerator();
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
                if (!['line-chart'].includes(comp.type)) {
                     const newEl = this.renderDashboardComponent(comp);
                     el.replaceWith(newEl);
                     newEl.classList.add('selected');
                }
                this.refreshGenerator();
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
        // Switch Logic
        if (comp) {
            this.currentSidebarMode = 'properties';
        }

        const propContent = this.ui.propertiesContent;
        const tplContent = this.ui.templatesContent;

        if (this.currentSidebarMode === 'templates') {
            propContent.style.display = 'none';
            if(tplContent) tplContent.style.display = 'block';
            return;
        } else {
            propContent.style.display = 'block';
            if(tplContent) tplContent.style.display = 'none';
        }

        if (!comp) {
            propContent.querySelectorAll('.property-group').forEach(g => g.style.display = 'none');
            this.ui.noSelectionPrompt.style.display = 'flex';
            return;
        }
        this.ui.noSelectionPrompt.style.display = 'none';
        const config = this.dashboardComponentConfig[comp.type];
        propContent.querySelectorAll('.property-group').forEach(group => {
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
        
        propContent.querySelectorAll('.property-item').forEach(item => {
            const propName = item.dataset.prop;
            if(propName) {
                const isVisible = (componentVisibleProps[comp.type] || []).includes(propName);
                const input = document.getElementById(`prop-${propName}`);
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
        
        const oldEl = document.getElementById(comp.id);
        if (oldEl) {
            const newEl = this.renderDashboardComponent(comp);
            oldEl.replaceWith(newEl);
            if (this.dashboardSelectedId === comp.id) {
                newEl.classList.add('selected');
            }
        }
        
        // Auto-refresh generated code
        this.refreshGenerator();
        this.updateDashboardPropertiesPanel(comp);
    }

    deleteSelectedComponent() {
        if (!this.dashboardSelectedId) return;
        this.dashboardComponents = this.dashboardComponents.filter(c => c.id !== this.dashboardSelectedId);
        
        if (this.dashboardChartInstances[this.dashboardSelectedId]) {
            this.dashboardChartInstances[this.dashboardSelectedId].destroy();
            delete this.dashboardChartInstances[this.dashboardSelectedId];
        }
        
        document.getElementById(this.dashboardSelectedId)?.remove();
        this.dashboardSelectedId = null;
        this.updateDashboardPropertiesPanel(null);
        this.refreshGenerator();
    }

    clearDashboardCanvas() {
        if (!confirm("Clear the entire canvas?")) return;
        this.dashboardComponents = [];
        this.dashboardSelectedId = null;
        Object.values(this.dashboardChartInstances).forEach(chart => chart.destroy());
        this.dashboardChartInstances = {};
        this.renderAllDashboardComponents();
        this.updateDashboardPropertiesPanel(null);
        this.refreshGenerator();
    }
    
    // --- GENERATOR LOGIC ---

    refreshGenerator() {
        const generator = this.ide.pythonGenerator;
        const htmlBlockType = 'dashboard_generated_html_content';
        const { micropythonString } = this.generateDashboardHTML();
        
        generator.forBlock[htmlBlockType] = (block) => {
            return [micropythonString, generator.ORDER_ATOMIC];
        };
    }

    generateAndApplyDashboard() {
        this.ide.addConsoleMessage("Generating dashboard code and blocks...", "info");
        this.refreshGenerator();
        
        const htmlBlockType = 'dashboard_generated_html_content';
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

            if (!existingHtmlBlock) {
                const newHtmlBlock = workspace.newBlock(htmlBlockType);
                newHtmlBlock.initSvg();
                newHtmlBlock.render();

                if (sendResponseHandler) {
                    const htmlInput = sendResponseHandler.getInput('HTML');
                    if (htmlInput && htmlInput.connection) {
                        if (htmlInput.connection.targetBlock()) htmlInput.connection.targetBlock().dispose(true);
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
            }
        } finally {
            Blockly.Events.enable();
        }

        this.ui.iotDashboardModal.style.display = 'none';
        this.ide.addConsoleMessage("✅ Dashboard blocks updated!", "success");
    }

    generateDashboardHTML() {
        let bodyElements = '';
        let scriptLogic = '';
        let styleAdditions = `
            .button-preview { user-select: none; -webkit-user-select: none; overflow: hidden; position: relative; }
            .ripple { position: absolute; border-radius: 50%; background-color: rgba(255, 255, 255, 0.6); transform: scale(0); animation: ripple-animation 0.6s linear; pointer-events: none; }
            @keyframes ripple-animation { to { transform: scale(4); opacity: 0; } }
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
                    scriptLogic += ` const btn_${comp.id} = document.getElementById('${comp.id}'); const sendPress_${comp.id} = (e) => { e.preventDefault(); applyRippleEffect(e); sendData('${comp.id}', '1'); }; const sendRelease_${comp.id} = (e) => { e.preventDefault(); sendData('${comp.id}', '0'); }; btn_${comp.id}.addEventListener('mousedown', sendPress_${comp.id}); btn_${comp.id}.addEventListener('mouseup', sendRelease_${comp.id}); btn_${comp.id}.addEventListener('mouseleave', sendRelease_${comp.id}); btn_${comp.id}.addEventListener('touchstart', sendPress_${comp.id}, {passive: false}); btn_${comp.id}.addEventListener('touchend', sendRelease_${comp.id}); `;
                    break;
                case 'toggle':
                    bodyElements += `<div style="${style}"><div id="${comp.id}" class="toggle-switch"><div class="thumb"></div></div><label style="margin-top:5px; font-size:14px;">${comp.label}</label></div>`;
                    scriptLogic += ` const tgl_${comp.id} = document.getElementById('${comp.id}'); tgl_${comp.id}.dataset.value = '${comp.value}'; const updateToggle_${comp.id} = () => { const val = tgl_${comp.id}.dataset.value; tgl_${comp.id}.style.backgroundColor = val == '1' ? '${comp.color}' : '#ccc'; tgl_${comp.id}.querySelector('.thumb').style.transform = val == '1' ? 'translateX(22px)' : 'translateX(0)'; }; tgl_${comp.id}.onclick = () => { const newVal = tgl_${comp.id}.dataset.value == '1' ? '0' : '1'; tgl_${comp.id}.dataset.value = newVal; updateToggle_${comp.id}(); sendData('${comp.id}', newVal); }; updateToggle_${comp.id}(); `;
                    break;
                case 'slider':
                    bodyElements += `<div style="${style}"><label>${comp.label}: <span id="val-${comp.id}">${comp.value}</span></label><input type="range" id="${comp.id}" min="${comp.min}" max="${comp.max}" value="${comp.value}" style="width: 80%;"></div>`;
                    scriptLogic += `document.getElementById('${comp.id}').oninput = (e) => { document.getElementById('val-${comp.id}').textContent = e.target.value; sendData('${comp.id}', e.target.value); }; `;
                    break;
                case 'color-picker':
                    bodyElements += `<div style="${style}"><label>${comp.label}</label><input type="color" id="${comp.id}" value="${comp.value}" style="width:80%; height: 50%; border:none; padding:0; background:transparent;"></div>`;
                    scriptLogic += `document.getElementById('${comp.id}').oninput = (e) => sendData('${comp.id}', e.target.value); `;
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
                 // ... Add other display types if needed
            }
        });

        const fullHtml = `<!DOCTYPE html><html><head><title>IoT Dashboard</title><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{font-family:sans-serif;background:#f0f4f8;}${styleAdditions}</style></head><body>${bodyElements}<script>let ws;function connect(){ws=new WebSocket('ws://'+window.location.host+'/ws');ws.onmessage=event=>{const data=JSON.parse(event.data);const el=document.getElementById(data.id);if(!el)return;const valEl=document.getElementById('val-'+data.id);if(data.prop==='value'){const val=data.value;if(el.classList.contains('led-light')){const isOn=val==1;el.classList.toggle('on',isOn);el.style.backgroundColor=isOn?el.dataset.colorOn:el.dataset.colorOff;}else if(el.classList.contains('gauge-value')){const min=parseFloat(el.dataset.min);const max=parseFloat(el.dataset.max);const progress=Math.max(0,Math.min(1,(val-min)/(max-min)));el.style.strokeDashoffset=125.6*(1-progress*0.5);if(valEl)valEl.textContent=val;}else{if(el.tagName==='H2')el.textContent=val;if(valEl)valEl.textContent=val;}}};ws.onclose=()=>setTimeout(connect,1000)}function applyRippleEffect(e){const btn=e.currentTarget;const circle=document.createElement("span");const diameter=Math.max(btn.clientWidth,btn.clientHeight);const radius=diameter/2;circle.style.width=circle.style.height=\`\${diameter}px\`;circle.style.left=\`\${e.clientX-(btn.offsetLeft+radius)}px\`;circle.style.top=\`\${e.clientY-(btn.offsetTop+radius)}px\`;circle.classList.add("ripple");const ripple=btn.getElementsByClassName("ripple")[0];if(ripple){ripple.remove()}btn.appendChild(circle)}function sendData(id,value){if(ws&&ws.readyState===WebSocket.OPEN){const payload={id:id};if(typeof value==='object'){payload.value=value.x;payload.y=value.y}else{payload.value=value}ws.send(JSON.stringify(payload))}}connect();${scriptLogic}</script></body></html>`;

        const singleLineHTML = fullHtml.replace(/\s{2,}/g, ' ').trim();
        const sanitizedHTML = singleLineHTML.replace(/"""/g, '""\\""');
        const micropythonString = `"""${sanitizedHTML}"""`;
        
        return { htmlString: fullHtml, micropythonString: micropythonString };
    }

    defineDashboardBlockGenerators() {
        const generator = this.ide.pythonGenerator;
        this.dashboardBlocks = [];

        const getDashboardOptions = (type, placeholderText) => {
            const components = this.dashboardComponents.filter(c => c.type === type);
            if (components.length === 0) return [[`(no ${placeholderText})`, 'NONE']];
            return components.map(c => [c.id, c.id]);
        };

        const genericEventBlock = { "type": "dashboard_on_control_change", "message0": "when dashboard control %1 changes", "args0": [{ "type": "field_dropdown", "name": "CONTROL_ID", "options": () => { const controls = [ ...getDashboardOptions('button', 'buttons'), ...getDashboardOptions('slider', 'sliders'), ...getDashboardOptions('toggle', 'toggles'), ...getDashboardOptions('color-picker', 'color pickers'), ...getDashboardOptions('joystick', 'joysticks') ]; const validControls = controls.filter(opt => opt[1] !== 'NONE'); return validControls.length > 0 ? validControls : [[`(no controls)`, 'NONE']]; } }], "message1": "%1", "args1": [{ "type": "input_statement", "name": "DO" }], "style": "networking_blocks", };
        const buttonEventBlock = { "type": "dashboard_when_button_is", "message0": "when button %1 is %2", "args0": [ { "type": "field_dropdown", "name": "CONTROL_ID", "options": () => getDashboardOptions('button', 'buttons') }, { "type": "field_dropdown", "name": "STATE", "options": [["pressed", "1"], ["released", "0"]] } ], "message1": "%1", "args1": [{ "type": "input_statement", "name": "DO" }], "style": "networking_blocks", "tooltip": "Runs code when a dashboard button is pressed or released." };
        const valueBlock = { "type": "dashboard_get_control_value", "message0": "value of %1", "args0": [ { "type": "field_dropdown", "name": "CONTROL_ID", "options": () => { const controls = [ ...getDashboardOptions('button', 'buttons'), ...getDashboardOptions('slider', 'sliders'), ...getDashboardOptions('toggle', 'toggles'), ...getDashboardOptions('color-picker', 'color pickers') ]; const validControls = controls.filter(opt => opt[1] !== 'NONE'); return validControls.length > 0 ? validControls : [[`(no controls)`, 'NONE']]; }} ], "output": null, "style": "networking_blocks", "tooltip": "Gets the current value from a slider, toggle, or color picker." };
        const joystickXBlock = { "type": "dashboard_get_joystick_x", "message0": "x value of joystick %1", "args0": [{ "type": "field_dropdown", "name": "CONTROL_ID", "options": () => getDashboardOptions('joystick', 'joysticks') }], "output": "Number", "style": "networking_blocks", };
        const joystickYBlock = { "type": "dashboard_get_joystick_y", "message0": "y value of joystick %1", "args0": [{ "type": "field_dropdown", "name": "CONTROL_ID", "options": () => getDashboardOptions('joystick', 'joysticks') }], "output": "Number", "style": "networking_blocks", };
        const updateBlock = { "type": "dashboard_update_display", "message0": "update dashboard display %1 with value %2", "args0": [ { "type": "field_dropdown", "name": "DISPLAY_ID", "options": () => { const displays = [ ...getDashboardOptions('led', 'LEDs'), ...getDashboardOptions('gauge', 'gauges'), ...getDashboardOptions('label', 'labels') ]; const validDisplays = displays.filter(opt => opt[1] !== 'NONE'); return validDisplays.length > 0 ? validDisplays : [[`(no displays)`, 'NONE']]; }}, { "type": "input_value", "name": "VALUE" } ], "previousStatement": null, "nextStatement": null, "inputsInline": true, "style": "networking_blocks", };
        
        this.dashboardBlocks.push(genericEventBlock, buttonEventBlock, valueBlock, joystickXBlock, joystickYBlock, updateBlock);

        generator.forBlock['dashboard_on_control_change'] = function(block) {
            const statements_do = generator.statementToCode(block, 'DO') || `${generator.INDENT}pass\n`;
            const controlId = block.getFieldValue('CONTROL_ID');
            if (controlId === 'NONE') return '';
            const funcName = generator.nameDB_.getDistinctName(`on_${controlId}_change_handler`, 'PROCEDURE');
            const func = `def ${funcName}():\n${statements_do}`;
            generator.functionNames_[funcName] = func;
            if (!generator.dashboardEventHandlers) generator.dashboardEventHandlers = {};
            if (!generator.dashboardEventHandlers[controlId]) generator.dashboardEventHandlers[controlId] = [];
            generator.dashboardEventHandlers[controlId].push(funcName);
            return ''; 
        };

        generator.forBlock['dashboard_when_button_is'] = function(block) {
            const controlId = block.getFieldValue('CONTROL_ID');
            if (controlId === 'NONE') return '';
            const state = block.getFieldValue('STATE');
            const statements_do = generator.statementToCode(block, 'DO') || `${generator.INDENT}pass\n`;
            const funcName = generator.nameDB_.getDistinctName(`on_${controlId}_state_${state}`, 'PROCEDURE');
            
            // Fix: Use str() and prefixLines for proper Python syntax
            const func = `def ${funcName}():\n` +
                         `${generator.INDENT}if str(_dashboard_state.get('${controlId}', '0')) == '${state}':\n` +
                         generator.prefixLines(statements_do, generator.INDENT); 
            
            generator.functionNames_[funcName] = func;
            if (!generator.dashboardEventHandlers) generator.dashboardEventHandlers = {};
            if (!generator.dashboardEventHandlers[controlId]) generator.dashboardEventHandlers[controlId] = [];
            generator.dashboardEventHandlers[controlId].push(funcName);
            return ''; 
        };

        generator.forBlock['dashboard_get_control_value'] = (block) => {
            const controlId = block.getFieldValue('CONTROL_ID');
            if (controlId === 'NONE') return ['"NONE"', generator.ORDER_ATOMIC];
            const code = `_dashboard_state.get('${controlId}', 0)`;
            return [code, generator.ORDER_FUNCTION_CALL];
        };
        
        generator.forBlock['dashboard_get_joystick_x'] = (block) => {
            const id = block.getFieldValue('CONTROL_ID');
            if (id === 'NONE') return ['0', generator.ORDER_ATOMIC];
            return [`_dashboard_state.get('${id}', 0)`, generator.ORDER_FUNCTION_CALL];
        };

        generator.forBlock['dashboard_get_joystick_y'] = (block) => {
            const id = block.getFieldValue('CONTROL_ID');
            if (id === 'NONE') return ['0', generator.ORDER_ATOMIC];
            return [`_dashboard_state.get('${id}_y', 0)`, generator.ORDER_FUNCTION_CALL];
        };

        generator.forBlock['dashboard_update_display'] = (block) => {
            const displayId = block.getFieldValue('DISPLAY_ID');
            if (displayId === 'NONE') return '';
            const value = generator.valueToCode(block, 'VALUE', generator.ORDER_ATOMIC) || '""';
            return `send_to_dashboard('${displayId}', 'value', ${value})\n`;
        };
    }

    getDashboardBlockDefinitions() {
        return this.dashboardBlocks;
    }

    setupDashboardBlocks() {
        if (this.dashboardBlocksDefined) return;
    
        const generator = this.ide.pythonGenerator;
        const htmlBlockType = 'dashboard_generated_html_content';
        
        generator.forBlock[htmlBlockType] = (block) => {
            return ['"""No dashboard generated yet."""', generator.ORDER_ATOMIC];
        };
        
        this.defineDashboardBlockGenerators(); 
        
        const htmlBlockDefinition = {
            "type": htmlBlockType, "message0": "Dashboard HTML Content", "output": "String",
            "style": "text_blocks", "tooltip": "The generated HTML for your IoT dashboard. Connect this to the 'send web response' block."
        };
        this.dashboardBlocks.push(htmlBlockDefinition);
        
        Blockly.defineBlocksWithJsonArray(this.dashboardBlocks);
        this.dashboardBlocksDefined = true;
    }

    clearDashboardBlocks() {
        this.dashboardBlocks = [];
        this.dashboardBlocksDefined = false;
    }

    loadDashboardState(state) {
        if (!state || !Array.isArray(state.components)) {
            this.dashboardComponents = [];
            this.dashboardNextId = 1;
        } else {
            this.dashboardComponents = state.components;
            this.dashboardNextId = state.nextId || 1;
        }
        
        this.renderAllDashboardComponents();
        this.updateDashboardPropertiesPanel(null);
        this.defineDashboardBlockGenerators(); 
        
        this.refreshGenerator();
    }

    getDashboardState() {
        return {
            components: this.dashboardComponents,
            nextId: this.dashboardNextId
        };
    }

    initializeDashboardChart(canvas, comp) {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = '12px Arial';
        ctx.fillStyle = '#666';
        ctx.fillText("Chart Preview", 10, 20);
    }

    copyExportCode(elementId, btnId) {
        // Implementation depends on UI requirements
    }
}