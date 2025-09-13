// src/renderer/simulation-ide.js (WEB VERSION)
'use strict';

console.log("Simulation IDE renderer script loaded and is now executing.");

// --- Global State ---
let workspace = null;
let runtime = null;
let projectName = 'Untitled-Simulation';
let workspaceUpdateTimeout = null;
let uiUpdateLoopId = null;

// --- Project Data Structure ---
let projectData = {
    targets: {}
};

const WORKSPACE_UPDATE_DEBOUNCE_MS = 250;
const DEFAULT_SIM_WORKSPACE_XML = `<xml xmlns="https://developers.google.com/blockly/xml"><block type="event_when_green_flag_clicked" id="start_block" x="100" y="50"></block></xml>`;
const DEFAULT_SPRITE_COSTUME = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTBweCIgaGVpZ2h0PSIxMDBweCIgdmlld0JveD0iMCAwIDkwIDEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNNjkuMjUgODguMjVIMjAuNzVDMTQuMzc1IDg4LjI1IDkgODMuMjUgOSA3Ni43NVY0MS4yNUM5IDMyLjUgMTQuNzUgMjcgMjEuNSAyN0g2OC41Qzc1LjI1IDI3IDgxIDMyLjUgODEgNDEuMjVWMzYuNUg4MVY3Ni43NUM4MSA4My4yNSA3NS44NzUgODguMjUgNjkuMjUgODguMjVaTTQ1IDE5QzI3LjUgMTkgMTkgMjcuNSA5IDQxLjI1Vjc2Ljc1QzkgODMuMjUgMTQuMzc1IDg4LjI1IDIwLjc1IDg4LjI1SDY5LjI1Qzc1Ljg4NyUgODguMjUgODEgODMuMjUgODEgNzYuNzVWNDEuMjVDODEgMjcuNSA2Mi4yNSA5IDQ1IDE5WiIgZmlsbD0iIzQzNjNGRiIvPjxwYXRoIGQ9Ik00NSAxOUM2Mi41IDE5IDgxIDI3LjUgODEgNDEuMjVWMzYuNzVDODEgODMuMjUgNzUuODc1IDg4LjI1IDY5LjI1IDg4LjI1SDIwLjc1QzE0LjM3NSA4OC4yNSA5IDgzLjI1IDkgNzYuNzVWNDEuMjVDOSAyNy41IDI3LjUgMTkgNDUgMTlaIiBmaWxsPSIjNUE2OUZGIi8+PHBhdGggZD0iTTY4LjUgMjdDMjIgMjYuOSA5IDMyIDkgNDEuMjVWMzYuNzVDOSAzLjI1IDE0LjM3NSA4OC4yNSAyMC43NSA4OC4yNUg2OS4yNUM3NS44NzUgODguMjUgODEgODMuMjUgODEgNzYuNzVWNDEuMjVDODEgMzIuNSA3NS4yNSAyNyA2OC41IDI3WiIgZmlsbD0iIzQzNjNGRiIvPjxwYXRoIGQ9Ik02OC41IDI3QzcyIDMyLjYyNSA3My4yNSA0MCA3MC41IDQ0QzY3LjUgNDggNjEgNDYgNTkgNDJDNjIgMzYgNjUgMjcgNjguNSAyN1oiIGZpbGw9IiNmZmYiIG9wYWNpdHk9IjAuMiIvPjxwYXRoIGQ9Ik0zNCA1Mi43NUMzOCA1Mi43NSAzOCA0OC43NSAzNCA0OC43NUMzMCA0OC43NSAzMCA1Mi43NSAzNCA1Mi43NVpNNjAgNTIuNzVDNjQgNTIuNzUgNjQgNDguNzUgNjAgNDguNzVDNTYgNDguNzUgNTYgNTIuNzUgNjAgNTIuNzVaIiBmaWxsPSIjRkZGIi8+PHBhdGggZD0iTTQ3IDY4QzQxIDY4IDM3IDY2IDM5IDYySDU1QzU4IDY2IDUzIDY4IDQ3IDY4WiIgZmlsbD0iI0ZGRiIvPjwvc3ZnPg==";
const DEFAULT_BACKDROP = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0ODAgMzYwIj48cmVjdCB3aWR0aD0iNDgwIiBoZWlnaHQ9IjM2MCIgZmlsbD0iI0Y5RkFGQiIvPjwvc3ZnPg==";

const ui = {
    canvas: document.getElementById('simulation-stage'),
    penCanvas: document.getElementById('pen-canvas'),
    spriteList: document.querySelector('.sprite-list'),
    stageThumbContainer: document.getElementById('stage-thumbnail-container'),
    assetsListContainer: document.getElementById('assets-list-container'),
    assetsTitle: document.getElementById('assets-title'),
    inspector: document.querySelector('.sprite-inspector'),
    inspectorTitle: document.getElementById('inspector-title'),
    spriteOnlyFields: document.querySelectorAll('.sprite-only-field'),
    nameInput: document.getElementById('sprite-name-input'),
    xInput: document.getElementById('sprite-x-input'),
    yInput: document.getElementById('sprite-y-input'),
    visibleInput: document.getElementById('sprite-visible-input'),
    sizeInput: document.getElementById('sprite-size-input'),
    directionInput: document.getElementById('sprite-direction-input'),
    assetUploader: document.createElement('input'),
    contextMenu: document.createElement('div')
};
ui.assetUploader.type = 'file';
ui.assetUploader.accept = 'image/*';
ui.assetUploader.style.display = 'none';
ui.contextMenu.className = 'custom-context-menu';
document.body.appendChild(ui.assetUploader);
document.body.appendChild(ui.contextMenu);

document.getElementById('back-to-projects-btn').addEventListener('click', () => { 
    saveProjectToCache(); 
    window.location.href = 'index.html'; 
});

function resizeCanvas() {
    const stageArea = document.querySelector('.sim-stage-area');
    if (!stageArea) return;
    const padding = 6;
    const newWidth = stageArea.clientWidth - padding;
    const newHeight = stageArea.clientHeight - padding;
    if (ui.canvas) {
        ui.canvas.width = newWidth;
        ui.canvas.height = newHeight;
    }
    if (ui.penCanvas) {
        ui.penCanvas.width = newWidth;
        ui.penCanvas.height = newHeight;
    }
}

function saveProjectToCache() {
    if (!runtime || !projectName || !workspace) return;

    const activeTarget = runtime.getActiveTarget();
    if (activeTarget) {
        const dom = Blockly.Xml.workspaceToDom(workspace);
        const xml = Blockly.Xml.domToText(dom);
        projectData.targets[activeTarget.id.toString()] = xml;
    }

    const getSpriteData = (sprite) => ({
        id_str: sprite.id.toString(),
        name: sprite.name,
        isStage: sprite.isStage,
        x: sprite.x,
        y: sprite.y,
        direction: sprite.direction,
        costumes: sprite.costumes.map(c => ({ name: c.name, src: c.src })),
        currentCostumeIndex: sprite.currentCostumeIndex,
        visible: sprite.visible,
        size: sprite.size,
        rotationStyle: sprite.rotationStyle,
        variables: sprite.variables
    });

    const dataToSave = {
        stage: getSpriteData(runtime.stage),
        sprites: runtime.sprites.map(getSpriteData),
        targets: projectData.targets,
        globalVariables: runtime.variables,
        variableModels: workspace.getVariableMap().getAllVariables().map(v => ({
            name: v.name,
            id: v.getId(),
            type: v.type
        }))
    };

    localStorage.setItem(`project_${projectName}`, JSON.stringify(dataToSave));

    const allProjects = JSON.parse(localStorage.getItem('blockIdeProjects') || '[]');
    const projectIndex = allProjects.findIndex(p => p.name === projectName);
    if (projectIndex !== -1) {
        allProjects[projectIndex].modifiedAt = Date.now();
        localStorage.setItem('blockIdeProjects', JSON.stringify(allProjects));
    }
}

function switchActiveTarget(newTargetId) {
    if (!runtime || runtime.getActiveTarget()?.id === newTargetId) return;

    const outgoingTarget = runtime.getActiveTarget();
    if (outgoingTarget) {
        const dom = Blockly.Xml.workspaceToDom(workspace);
        const xml = Blockly.Xml.domToText(dom);
        projectData.targets[outgoingTarget.id.toString()] = xml;
    }

    runtime.setActiveTarget(newTargetId);
    const incomingTarget = runtime.getActiveTarget();

    if (incomingTarget) {
        workspace.clear();
        const xmlToLoad = projectData.targets[incomingTarget.id.toString()] || DEFAULT_SIM_WORKSPACE_XML;
        try {
            const domToLoad = Blockly.utils.xml.textToDom(xmlToLoad);
            Blockly.Xml.domToWorkspace(domToLoad, workspace);
        } catch (e) {
            console.error("Could not load workspace for target:", incomingTarget.name, e);
            workspace.clear();
        }
    }

    updateToolboxForTarget(workspace, incomingTarget.isStage);
    renderTargetList();
    renderAssetsList();
    updateSpriteInspector();
}

function renderAssetsList() {
    if (!runtime) return;
    const target = runtime.getActiveTarget();
    if (!target) return;
    ui.assetsTitle.textContent = target.isStage ? "Backdrops" : "Costumes";
    ui.assetsListContainer.innerHTML = '';
    target.costumes.forEach((costume, index) => {
        const assetThumb = document.createElement('div');
        assetThumb.className = 'asset-thumbnail';
        if (index === target.currentCostumeIndex) assetThumb.classList.add('active');
        assetThumb.innerHTML = ` <span class="asset-index">${index + 1}</span> <img src="${costume.src}" alt="${costume.name}"> <span class="asset-name">${costume.name}</span> `;
        assetThumb.addEventListener('click', () => {
            target.currentCostumeIndex = index;
            renderAssetsList();
            renderTargetList();
        });
        ui.assetsListContainer.appendChild(assetThumb);
    });
    const addAssetBtn = document.createElement('button');
    addAssetBtn.className = 'btn primary add-asset-btn';
    addAssetBtn.textContent = `Choose a ${target.isStage ? "Backdrop" : "Costume"}`;
    addAssetBtn.addEventListener('click', () => ui.assetUploader.click());
    ui.assetsListContainer.appendChild(addAssetBtn);
}

function renderTargetList() {
    if (!runtime || !ui.spriteList) return;
    const activeTargetId = runtime.getActiveTarget()?.id;
    ui.stageThumbContainer.innerHTML = '';
    const stageThumb = document.createElement('div');
    stageThumb.className = 'stage-thumbnail';
    if (activeTargetId === runtime.stage.id) stageThumb.classList.add('active');
    stageThumb.innerHTML = `<img src="${runtime.stage.getCurrentCostume()?.src || ''}" alt="Stage"><p>Stage</p>`;
    stageThumb.addEventListener('click', () => switchActiveTarget(runtime.stage.id));
    ui.stageThumbContainer.appendChild(stageThumb);
    ui.spriteList.innerHTML = '';
    runtime.sprites.filter(sprite => !sprite.isClone).forEach(sprite => {
        const spriteThumb = document.createElement('div');
        spriteThumb.className = 'sprite-thumbnail';
        if (activeTargetId === sprite.id) spriteThumb.classList.add('active');
        spriteThumb.innerHTML = `<button class="delete-sprite-btn" title="Delete ${sprite.name}">&times;</button><img src="${sprite.getCurrentCostume()?.src || ''}" alt="${sprite.name}"><p>${sprite.name}</p>`;
        spriteThumb.addEventListener('click', (e) => { if (e.target.classList.contains('delete-sprite-btn')) return; switchActiveTarget(sprite.id); });
        spriteThumb.addEventListener('contextmenu', (e) => { e.preventDefault(); showContextMenu(e.pageX, e.pageY, sprite); });
        const deleteBtn = spriteThumb.querySelector('.delete-sprite-btn');
        deleteBtn.addEventListener('click', () => {
            showCustomConfirm(`Are you sure you want to delete "${sprite.name}"?`, (confirmed) => {
                if (confirmed) {
                    const wasActive = runtime.getActiveTarget()?.id === sprite.id;
                    const deletedId = sprite.id.toString();
                    runtime.deleteSprite(sprite.id);
                    delete projectData.targets[deletedId];
                    if (wasActive) {
                        switchActiveTarget(runtime.stage.id);
                    } else {
                        renderTargetList();
                    }
                }
            });
        });
        ui.spriteList.appendChild(spriteThumb);
    });
}

function updateSpriteInspector() {
    if (!runtime) return;
    const target = runtime.getActiveTarget();
    if (!target) { ui.inspector.style.visibility = 'hidden'; return; }
    ui.inspector.style.visibility = 'visible';
    const isSprite = !target.isStage;
    ui.inspectorTitle.textContent = isSprite ? "Sprite" : "Stage";
    if (document.activeElement !== ui.nameInput) ui.nameInput.value = target.name;
    ui.nameInput.disabled = false; // Name should always be editable
    ui.spriteOnlyFields.forEach(field => { field.style.display = isSprite ? 'flex' : 'none'; });
    if (isSprite) {
        if (document.activeElement !== ui.xInput) ui.xInput.value = Math.round(target.x);
        if (document.activeElement !== ui.yInput) ui.yInput.value = Math.round(target.y);
        if (document.activeElement !== ui.sizeInput) ui.sizeInput.value = Math.round(target.size);
        if (document.activeElement !== ui.directionInput) ui.directionInput.value = Math.round(target.direction);
        ui.visibleInput.checked = target.visible;
    }
}

function startUiUpdateLoop() {
    if (uiUpdateLoopId) cancelAnimationFrame(uiUpdateLoopId);
    function loop() {
        updateSpriteInspector();
        uiUpdateLoopId = requestAnimationFrame(loop);
    }
    uiUpdateLoopId = requestAnimationFrame(loop);
}

function setupEventListeners() {
    document.getElementById('add-sprite-btn').addEventListener('click', async () => {
        if (!runtime) return;
        const spriteCount = runtime.sprites.filter(s => !s.isClone).length + 1;
        const newSprite = new Sprite({
            name: `Sprite${spriteCount}`,
            costumes: [{ name: 'costume1', src: DEFAULT_SPRITE_COSTUME }],
            x: Math.random() * 200 - 100,
            y: Math.random() * 100 - 50,
        });
        await newSprite.load();
        runtime.addSprite(newSprite);
        projectData.targets[newSprite.id.toString()] = DEFAULT_SIM_WORKSPACE_XML;
        switchActiveTarget(newSprite.id);
    });

    ui.assetUploader.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file || !runtime) return;
        const target = runtime.getActiveTarget();
        const reader = new FileReader();
        reader.onload = async (e) => {
            const newCostume = { name: file.name.split('.').slice(0, -1).join('.') || 'new_costume', src: e.target.result };
            target.costumes.push(newCostume);
            try {
                await target.load();
                target.currentCostumeIndex = target.costumes.length - 1;
                renderAssetsList();
                renderTargetList();
            } catch (err) {
                console.error("Failed to load new asset:", err);
                target.costumes.pop();
            }
        };
        reader.readAsDataURL(file);
        ui.assetUploader.value = '';
    });

    const updateTargetFromUi = () => {
        if (!runtime) return;
        const target = runtime.getActiveTarget();
        if (!target) return;
        target.name = ui.nameInput.value;
        if (!target.isStage) {
            target.x = parseFloat(ui.xInput.value) || 0;
            target.y = parseFloat(ui.yInput.value) || 0;
            target.size = parseFloat(ui.sizeInput.value) || 100;
            target.direction = parseFloat(ui.directionInput.value) || 90;
            target.visible = ui.visibleInput.checked;
        }
        renderTargetList(); // Update name in the list
    };
    ['change', 'input'].forEach(evt => {
        ui.nameInput.addEventListener(evt, updateTargetFromUi);
        ui.xInput.addEventListener(evt, updateTargetFromUi);
        ui.yInput.addEventListener(evt, updateTargetFromUi);
        ui.sizeInput.addEventListener(evt, updateTargetFromUi);
        ui.directionInput.addEventListener(evt, updateTargetFromUi);
        ui.visibleInput.addEventListener(evt, updateTargetFromUi);
    });
}

function setupCanvasListeners() {
    let isDragging = false, dragOffsetX = 0, dragOffsetY = 0, draggedSprite = null;
    ui.canvas.addEventListener('mousedown', (e) => {
        if (!runtime) return;
        const pos = runtime.getCanvasCoordinates(e);
        const clickedSprite = runtime.getSpriteAt(pos.x, pos.y);
        if (clickedSprite) {
            switchActiveTarget(clickedSprite.id);
            isDragging = true;
            draggedSprite = clickedSprite;
            dragOffsetX = clickedSprite.x - pos.x;
            dragOffsetY = clickedSprite.y - pos.y;
            ui.canvas.style.cursor = 'grabbing';
        }
    });
    ui.canvas.addEventListener('mousemove', (e) => {
        if (!runtime) return;
        const pos = runtime.getCanvasCoordinates(e);
        if (isDragging && draggedSprite) {
            draggedSprite.x = pos.x + dragOffsetX;
            draggedSprite.y = pos.y + dragOffsetY;
        } else {
            ui.canvas.style.cursor = runtime.getSpriteAt(pos.x, pos.y) ? 'grab' : 'default';
        }
    });
    const stopDragging = () => { isDragging = false; draggedSprite = null; ui.canvas.style.cursor = 'default'; };
    ui.canvas.addEventListener('mouseup', stopDragging);
    ui.canvas.addEventListener('mouseleave', stopDragging);
}

function showCustomPrompt(message, defaultValue, callback) {
    const modal = document.getElementById('custom-prompt-modal'), msgEl = document.getElementById('custom-prompt-message'), input = document.getElementById('custom-prompt-input'), okBtn = document.getElementById('custom-prompt-ok'), cancelBtn = document.getElementById('custom-prompt-cancel');
    msgEl.textContent = message; input.value = defaultValue; modal.style.display = 'flex'; input.focus(); input.select();
    const close = (value) => { modal.style.display = 'none'; okBtn.onclick = null; cancelBtn.onclick = null; input.onkeydown = null; if (callback) callback(value); };
    okBtn.onclick = () => close(input.value); cancelBtn.onclick = () => close(null);
    input.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); close(input.value); } else if (e.key === 'Escape') { close(null); } };
}

function showCustomConfirm(message, callback) {
    const modal = document.getElementById('custom-confirm-modal'), msgEl = document.getElementById('custom-confirm-message'), yesBtn = document.getElementById('custom-confirm-yes'), noBtn = document.getElementById('custom-confirm-no');
    msgEl.textContent = message; modal.style.display = 'flex';
    const close = (value) => { modal.style.display = 'none'; yesBtn.onclick = null; noBtn.onclick = null; if (callback) callback(value); };
    yesBtn.onclick = () => close(true); noBtn.onclick = () => close(false);
}

function showContextMenu(x, y, sprite) {
    ui.contextMenu.innerHTML = ''; ui.contextMenu.style.display = 'block'; ui.contextMenu.style.left = `${x}px`; ui.contextMenu.style.top = `${y}px`;
    const duplicateOption = document.createElement('div');
    duplicateOption.className = 'context-menu-item'; duplicateOption.textContent = 'Duplicate';
    duplicateOption.onclick = () => { duplicateSprite(sprite.id); hideContextMenu(); };
    ui.contextMenu.appendChild(duplicateOption);
    window.addEventListener('click', hideContextMenu, { once: true });
}

function hideContextMenu() { ui.contextMenu.style.display = 'none'; }

async function duplicateSprite(spriteId) {
    if (!runtime) return;
    const originalSprite = runtime.sprites.find(s => s.id === spriteId);
    if (!originalSprite) return;
    const activeTarget = runtime.getActiveTarget();
    if (activeTarget) { const dom = Blockly.Xml.workspaceToDom(workspace); const xml = Blockly.Xml.domToText(dom); projectData.targets[activeTarget.id.toString()] = xml; }
    const newSprite = originalSprite.clone();
    let newName = originalSprite.name, counter = 2;
    const allNames = runtime.sprites.map(s => s.name);
    while (allNames.includes(newName)) { newName = `${originalSprite.name} ${counter}`; counter++; }
    newSprite.name = newName;
    await newSprite.load();
    runtime.addSprite(newSprite);
    const originalXml = projectData.targets[originalSprite.id.toString()];
    projectData.targets[newSprite.id.toString()] = originalXml;
    switchActiveTarget(newSprite.id);
}

let loadedExtensions = new Set();

async function initialize() {
    const params = new URLSearchParams(window.location.search);
    projectName = params.get('project');

    if (!projectName) {
        document.body.innerHTML = '<h1>Error: No project specified.</h1><a href="index.html">Go back</a>';
        return;
    }
    
    document.getElementById('sim-project-name').textContent = projectName;
    document.title = `${projectName} - Simulation | Block IDE`;
    
    workspace = initializeSimulationBlockly();
    Blockly.dialog.setPrompt(showCustomPrompt);
    Blockly.dialog.setConfirm(showCustomConfirm);

    workspace.registerToolboxCategoryCallback('ADD_EXTENSION', () => {
        showExtensionModal();
        return null;
    });
    
    resizeCanvas();
    runtime = new SimulationRuntime(ui.canvas, showCustomPrompt);

    const savedProjectJSON = localStorage.getItem(`project_${projectName}`);
    let activeTargetOnInit = null;

    if (savedProjectJSON) {
        const savedData = JSON.parse(savedProjectJSON);
        if (savedData.sprites && savedData.stage && savedData.targets) {
            if (savedData.variableModels) { savedData.variableModels.forEach(model => { workspace.createVariable(model.name, model.type, model.id); }); }
            runtime.variables = savedData.globalVariables || {};
            const stage = new Sprite(savedData.stage);
            runtime.initializeStage(stage);
            const newTargets = {};
            newTargets[stage.id.toString()] = savedData.targets[savedData.stage.id_str];
            for (const spriteData of savedData.sprites) { const newSprite = new Sprite(spriteData); runtime.addSprite(newSprite); newTargets[newSprite.id.toString()] = savedData.targets[spriteData.id_str]; }
            projectData.targets = newTargets;
            await Promise.all([stage.load(), ...runtime.sprites.map(s => s.load())]);
            activeTargetOnInit = runtime.sprites.length > 0 ? runtime.sprites[0].id : runtime.stage.id;
        }
    } else {
        const stage = new Sprite({ name: 'Stage', isStage: true, costumes: [{ name: 'backdrop1', src: DEFAULT_BACKDROP }] });
        const defaultSprite = new Sprite({ name: 'Sprite1', costumes: [{ name: 'costume1', src: DEFAULT_SPRITE_COSTUME }]});
        await Promise.all([stage.load(), defaultSprite.load()]);
        runtime.initializeStage(stage);
        runtime.addSprite(defaultSprite);
        projectData.targets[stage.id.toString()] = DEFAULT_SIM_WORKSPACE_XML;
        projectData.targets[defaultSprite.id.toString()] = DEFAULT_SIM_WORKSPACE_XML;
        activeTargetOnInit = defaultSprite.id;
    }
    
    workspace.addChangeListener((event) => { 
        if (event.isUiEvent || event.type === Blockly.Events.FINISHED_LOADING) return; 
        clearTimeout(workspaceUpdateTimeout); 
        workspaceUpdateTimeout = setTimeout(saveProjectToCache, WORKSPACE_UPDATE_DEBOUNCE_MS); 
    });
    
    runtime.start();
    switchActiveTarget(activeTargetOnInit);
    setupEventListeners();
    setupCanvasListeners();
    startUiUpdateLoop();

    window.addEventListener('resize', () => { resizeCanvas(); if (workspace) Blockly.svgResize(workspace); });

    document.getElementById('green-flag-btn').addEventListener('click', () => {
        if (!workspace || !runtime) return;
        runtime.reset();
        runtime.stopSignal = false;
        runtime.eventScripts = { 'greenFlag': [], 'broadcast': {}, 'backdropSwitch': {}, 'spriteClick': {}, 'keyPress': {}, 'cloneStart': {} };
        let fullCode = '';
        const generateCodeForTarget = (xml) => { const tempWorkspace = new Blockly.Workspace(); try { const dom = Blockly.utils.xml.textToDom(xml); Blockly.Xml.domToWorkspace(dom, tempWorkspace); return Blockly.JavaScript.workspaceToCode(tempWorkspace); } catch (e) { console.error('Code generation error:', e); return ''; } finally { tempWorkspace.dispose(); } };
        const stage = runtime.stage;
        const stageXml = projectData.targets[stage.id.toString()];
        if (stageXml) { const stageContext = `{ target: runtime.stage }`; fullCode += `(function() { ${generateCodeForTarget(stageXml)} }).call(${stageContext});\n`; }
        runtime.sprites.filter(s => !s.isClone).forEach(sprite => {
            const spriteXml = projectData.targets[sprite.id.toString()];
            if (spriteXml) { const spriteContext = `{ target: runtime.sprites.find(s => s.id.toString() === '${sprite.id.toString()}') }`; fullCode += `(function() { ${generateCodeForTarget(spriteXml)} }).call(${spriteContext});\n`; }
        });
        try { const runner = new Function('runtime', fullCode); runner(runtime); runtime.runGreenFlagScripts(); } catch (e) { console.error("Error evaluating generated code:", e); }
    });

    document.getElementById('stop-btn').addEventListener('click', () => { if (runtime) { runtime.reset(); } });
}

const availableExtensions = [
    { id: 'pen', name: 'Pen', description: 'Draw with your sprites.', color: '#0E9A86', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>` },
    { id: 'tts', name: 'Text to Speech', description: 'Make your projects talk.', color: '#0891B2', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>` },
    { id: 'video', name: 'Video Sensing', description: 'Sense motion with the camera.', color: '#059669', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>` },
    { id: 'face_detection', name: 'Face Landmarks', description: 'Detect faces, eyes, and smiles.', color: '#065F46', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 4 16.25"/><path d="M8 10h.01"/><path d="M16 10h.01"/><path d="M12 16a4 4 0 0 0-4-4h8a4 4 0 0 0-4 4z"/></svg>` }
];

function showExtensionModal() {
    const modal = document.getElementById('extension-modal'), extensionList = document.getElementById('extension-list'), closeBtn = document.getElementById('extension-modal-close-btn');
    extensionList.innerHTML = '';
    availableExtensions.forEach(ext => {
        const card = document.createElement('div');
        card.className = 'extension-card'; card.dataset.extensionId = ext.id;
        if (loadedExtensions.has(ext.id)) card.classList.add('added');
        card.innerHTML = `<div class="extension-card-icon" style="background-color: ${ext.color};">${ext.icon}</div><h3>${ext.name}</h3><p>${ext.description}</p>`;
        card.addEventListener('click', () => { if (!card.classList.contains('added')) { addExtension(ext.id); modal.style.display = 'none'; } });
        extensionList.appendChild(card);
    });
    closeBtn.onclick = () => modal.style.display = 'none';
    modal.style.display = 'flex';
}

function addExtension(extensionId) {
    if (loadedExtensions.has(extensionId)) return;
    const isCvExtension = ['face_detection', 'hand_pose', 'body_pose'].includes(extensionId);
    if (isCvExtension && !loadedExtensions.has('video')) addExtension('video'); 
    if (!extensionCategories[extensionId]) return;
    if (extensionId === 'face_detection' && runtime) runtime.initFaceLandmarker();
    const extensionCategory = extensionCategories[extensionId];
    spriteToolbox.contents.splice(spriteToolbox.contents.length - 2, 0, extensionCategory);
    stageToolbox.contents.splice(stageToolbox.contents.length - 2, 0, extensionCategory);
    loadedExtensions.add(extensionId);
    const activeTarget = runtime.getActiveTarget();
    if (activeTarget) updateToolboxForTarget(workspace, activeTarget.isStage);
}

// --- Start the application ---
initialize();