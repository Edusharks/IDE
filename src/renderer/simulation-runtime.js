// src/renderer/simulation-runtime.js

class StopScriptExecution extends Error {
    constructor() {
        super('Script execution stopped by user.');
        this.name = 'StopScriptExecution';
    }
}

function waitForMediaPipe(timeout = 5000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const interval = setInterval(() => {
            if (window.MediaPipeTasks && window.MediaPipeTasks.FaceLandmarker) {
                clearInterval(interval);
                resolve();
            } else if (Date.now() - startTime > timeout) {
                clearInterval(interval);
                reject(new Error("MediaPipe library failed to load in time."));
            }
        }, 50);
    });
}

class Sprite {
    constructor(config) {
        this.id = config.id || Symbol('sprite');
        this.name = config.name || 'Sprite';
        this.isClone = config.isClone || false;
        this.cloneOf = config.cloneOf || null;
        this.isStage = config.isStage || false;
        this.variables = config.variables || {};
        this.x = config.x || 0;
        this.y = config.y || 0;
        this.direction = config.direction !== undefined ? config.direction : 90;
        this.costumes = (config.costumes || []).map(c => ({ name: c.name, src: c.src }));
        this.currentCostumeIndex = config.currentCostumeIndex || 0;
        this.isLoaded = false;
        this.visible = config.visible !== undefined ? config.visible : true;
        this.size = config.size !== undefined ? config.size : 100;
        this.graphicEffects = { ... (config.graphicEffects || { color: 0, fisheye: 0, whirl: 0, pixelate: 0, mosaic: 0, brightness: 0, ghost: 0 }) };
        this.rotationStyle = config.rotationStyle || 'all around';
        this.sayText = null;
        this.sayTimeout = null;
        this.thinkText = null;
        this.thinkTimeout = null;
        this.isPenDown = false;
        this.penColor = '#0000FF';
        this.penSize = 1;
        this.initialState = { 
            x: this.x, y: this.y, direction: this.direction, 
            visible: this.visible, size: this.size,
            costumeIndex: this.currentCostumeIndex
        };
    }

    clone() {
        const config = {
            id: Symbol('sprite'),
            name: this.name,
            isClone: true,
            cloneOf: this.id,
            isStage: this.isStage,
            variables: JSON.parse(JSON.stringify(this.variables)),
            x: this.x,
            y: this.y,
            direction: this.direction,
            costumes: this.costumes,
            currentCostumeIndex: this.currentCostumeIndex,
            visible: this.visible,
            size: this.size,
            graphicEffects: { ...this.graphicEffects },
            rotationStyle: this.rotationStyle
        };
        return new Sprite(config);
    }
    
    reset() {
        this.x = this.initialState.x;
        this.y = this.initialState.y;
        this.direction = this.initialState.direction;
        this.visible = this.initialState.visible;
        this.size = this.initialState.size;
        this.variables = {};
        this.isPenDown = false;
        this.penColor = '#0000FF';
        this.penSize = 1;
        this.currentCostumeIndex = this.initialState.costumeIndex;
        this.graphicEffects = { color: 0, fisheye: 0, whirl: 0, pixelate: 0, mosaic: 0, brightness: 0, ghost: 0 };
        this.sayText = null;
        this.thinkText = null;
        clearTimeout(this.sayTimeout);
        clearTimeout(this.thinkTimeout);
    }

    getCurrentCostume() { return this.costumes[this.currentCostumeIndex] || null; }
    async load() { if (this.costumes.length === 0) { this.isLoaded = true; return; } const loadPromises = this.costumes.map(costume => { return new Promise((resolve, reject) => { if (costume.image && costume.image.complete) { return resolve(); } costume.image = new Image(); costume.image.src = costume.src; costume.image.onload = resolve; costume.image.onerror = reject; }); }); await Promise.all(loadPromises); this.isLoaded = true; }
    getBounds() { const costume = this.getCurrentCostume(); if (!this.visible || !this.isLoaded || !costume || !costume.image) return null; const w = costume.image.width * (this.size / 100); const h = costume.image.height * (this.size / 100); return { left: this.x - w / 2, right: this.x + w / 2, top: this.y + h / 2, bottom: this.y - h / 2 }; }
    isUnderPoint(stageX, stageY) { if (this.isStage) return false; const bounds = this.getBounds(); if (!bounds) return false; return (stageX >= bounds.left && stageX <= bounds.right && stageY <= bounds.top && stageY >= bounds.bottom); }
    
    
    draw(ctx, isSelected, isVideoOn = false) { 
        const costume = this.getCurrentCostume();
        if (this.isStage && isVideoOn) {
            return;
        }

        if (!this.isLoaded || !this.visible || !costume || !costume.image) return;

        ctx.save();
        ctx.globalAlpha = 1 - (this.graphicEffects.ghost / 100);

        if (this.isStage) {
            ctx.drawImage(costume.image, 0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.restore();
            return;
        }

        const canvasCenterX = ctx.canvas.width / 2;
        const canvasCenterY = ctx.canvas.height / 2;
        const spriteCanvasX = canvasCenterX + this.x;
        const spriteCanvasY = canvasCenterY - this.y;
        
        ctx.translate(spriteCanvasX, spriteCanvasY);
        
        const rotationRadians = (this.direction - 90) * Math.PI / 180;
        if (this.rotationStyle === 'all around') {
            ctx.rotate(rotationRadians);
        }
        if (this.rotationStyle === 'left-right') {
            const angle = (this.direction % 360 + 360) % 360;
            if (angle > 90 && angle < 270) {
                ctx.scale(-1, 1);
            }
        }
        
        const scale = this.size / 100;
        ctx.scale(scale, scale);
        
        if (isSelected && !this.isClone) {
            ctx.strokeStyle = '#007bff';
            ctx.lineWidth = 4 / scale;
            ctx.strokeRect(-costume.image.width / 2, -costume.image.height / 2, costume.image.width, costume.image.height);
        }
        
        ctx.drawImage(costume.image, -costume.image.width / 2, -costume.image.height / 2);
        ctx.restore();
        
        this._drawBubble(ctx, this.sayText, false, spriteCanvasX, spriteCanvasY);
        this._drawBubble(ctx, this.thinkText, true, spriteCanvasX, spriteCanvasY);
    }
    
    _drawBubble(ctx, text, isThinking, spriteCanvasX, spriteCanvasY) { const costume = this.getCurrentCostume(); if (!text || !costume || this.isStage) return; ctx.font = '14px sans-serif'; const textWidth = ctx.measureText(text).width; const bubbleWidth = textWidth + 20; const bubbleHeight = 30; const bubbleX = spriteCanvasX; const bubbleY = spriteCanvasY - (costume.image.height * (this.size/100) / 2) - bubbleHeight - 10; ctx.fillStyle = 'white'; ctx.strokeStyle = '#999'; ctx.lineWidth = 1; ctx.beginPath(); if (isThinking) { ctx.roundRect(bubbleX - bubbleWidth / 2, bubbleY, bubbleWidth, bubbleHeight, 15); } else { ctx.roundRect(bubbleX - bubbleWidth / 2, bubbleY, bubbleWidth, bubbleHeight, [15, 15, 15, 15]); } ctx.fill(); ctx.stroke(); ctx.fillStyle = 'black'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, bubbleX, bubbleY + bubbleHeight / 2); }
}

class SimulationRuntime {
    constructor(canvas, showPromptCallback) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.showPrompt = showPromptCallback;
        this.penCanvas = document.getElementById('pen-canvas');
        this.penCtx = this.penCanvas.getContext('2d');
        this.stage = null;
        this.sprites = [];
        this.activeTargetId = null;
        this.isRunning = false;
        this.activeScripts = new Set();
        this.stopSignal = false;
        this.eventScripts = { 'greenFlag': [], 'broadcast': {}, 'backdropSwitch': {}, 'spriteClick': {}, 'keyPress': {}, 'cloneStart': {} };
        this.keysDown = new Set();
        this.mouseX = 0; this.mouseY = 0; this.isMouseDown = false;
        this.timerStart = Date.now();
        this.answer = '';
        this.variables = {};
        this.lists = {};
        this.activeSounds = new Set();
        this.ttsVoices = [];
        this.selectedTtsVoice = null;
        this.populateVoices();

        this.videoFeed = document.getElementById('video-feed');
        this.videoStream = null;
        this.videoMotion = 0;
        this.lastVideoFrame = null;
        this.videoCanvas = document.createElement('canvas');
        this.videoCtx = this.videoCanvas.getContext('2d', { willReadFrequently: true });
        this.stageArea = document.querySelector('.sim-stage-area');

        this.faceLandmarker = null; 
        this.faceLandmarkerResults = [];
        this.lastPredictionTime = -1;
        this.isFaceLandmarkerInitialized = false;
    }
    
    // ... (No changes needed in most SimulationRuntime methods, they can remain as is)
    initializeStage(stage) { this.stage = stage; this.setActiveTarget(stage.id); }
    start() { if (this.isRunning) return; this.isRunning = true; this.resetTimer(); this._setupSensing(); this._renderLoop(); }
    stopAllScripts() { this.stopSignal = true; this.activeScripts.clear(); console.log("Stop signal sent to all scripts."); }
    reset() { this.stopAllScripts(); this.clearPen(); this.stopAllSounds();window.speechSynthesis.cancel();this.turnVideoOff(); this.stage.reset(); this.sprites.forEach(s => s.reset()); this.variables = {}; }
    addSprite(sprite) { this.sprites.push(sprite); }
    deleteSprite(spriteId) { this.sprites = this.sprites.filter(s => s.id !== spriteId && s.cloneOf !== spriteId); }
    getActiveTarget() { if (this.stage && this.activeTargetId === this.stage.id) return this.stage; return this.sprites.find(s => s.id === this.activeTargetId) || null; }
    setActiveTarget(targetId) { this.activeTargetId = targetId; }
    getSpriteAt(stageX, stageY) { for (let i = this.sprites.length - 1; i >= 0; i--) { if (this.sprites[i].isUnderPoint(stageX, stageY)) return this.sprites[i]; } return null; }
    getCanvasCoordinates(event) { const r = this.canvas.getBoundingClientRect(); return { x: event.clientX - r.left - this.canvas.width / 2, y: this.canvas.height / 2 - (event.clientY - r.top) }; }
    _runScripts(scripts) { if (!scripts) return; scripts.forEach(script => { const id = Symbol(); this.activeScripts.add(id); script().catch(e => { if (e.name !== 'StopScriptExecution') { console.error("Error in script:", e); } }).finally(() => this.activeScripts.delete(id)); }); }
    registerGreenFlagScript(func) { this.eventScripts.greenFlag.push(func); }
    registerBroadcastReceiver(msg, func) { if (!this.eventScripts.broadcast[msg]) this.eventScripts.broadcast[msg] = []; this.eventScripts.broadcast[msg].push(func); }
    registerBackdropSwitchReceiver(name, func) { if (!this.eventScripts.backdropSwitch[name]) this.eventScripts.backdropSwitch[name] = []; this.eventScripts.backdropSwitch[name].push(func); }
    registerSpriteClickScript(id, func) { if (!this.eventScripts.spriteClick[id]) this.eventScripts.spriteClick[id] = []; this.eventScripts.spriteClick[id].push(func); }
    registerKeyPressScript(key, func) { if (!this.eventScripts.keyPress[key]) this.eventScripts.keyPress[key] = []; this.eventScripts.keyPress[key].push(func); }
    runGreenFlagScripts() { this._runScripts(this.eventScripts.greenFlag); }
    _setupSensing() { this._onMouseMove=(e)=>{const p=this.getCanvasCoordinates(e);this.mouseX=p.x;this.mouseY=p.y;};this._onMouseDown=(e)=>{this.isMouseDown=true;const p=this.getCanvasCoordinates(e);const s=this.getSpriteAt(p.x,p.y);if(s)this._runScripts(this.eventScripts.spriteClick[s.id]);};this._onMouseUp=()=>{this.isMouseDown=false;};this._onKeyDown=(e)=>{const k=e.key.toLowerCase();this.keysDown.add(k);this._runScripts(this.eventScripts.keyPress[k]);this._runScripts(this.eventScripts.keyPress['any']);};this._onKeyUp=(e)=>{this.keysDown.delete(e.key.toLowerCase());};this.canvas.addEventListener('mousemove',this._onMouseMove);this.canvas.addEventListener('mousedown',this._onMouseDown);this.canvas.addEventListener('mouseup',this._onMouseUp);this.canvas.addEventListener('mouseleave',this._onMouseUp);window.addEventListener('keydown',this._onKeyDown);window.addEventListener('keyup',this._onKeyUp); }
    
    
    _renderLoop() {
        if (!this.isRunning) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.stage) {
            const isVideoActive = !!this.videoStream;
            this.stage.draw(this.ctx, this.activeTargetId === this.stage.id, isVideoActive);
        }

        for (const s of this.sprites) {
            s.draw(this.ctx, s.id === this.activeTargetId); 
        }

        requestAnimationFrame(() => this._renderLoop());
    }

    getStopFlag() { return this.stopSignal; }
    
    async wait(secs) { if (this.stopSignal) { throw new StopScriptExecution(); } return new Promise(resolve => setTimeout(resolve, secs * 1000)); }
    
    move(target, steps) { const t = target; if (t && !t.isStage) { const oldX = t.x; const oldY = t.y; const rad = (t.direction - 90) * Math.PI / 180; t.x += steps * Math.cos(rad); t.y += steps * Math.sin(rad); this._drawPenLine(t, oldX, oldY); } return Promise.resolve(); }
    turn(target, degrees) { const t = target; if (t && !t.isStage) t.direction += degrees; return Promise.resolve(); }
    goTo(target, x, y) { const t = target; if (t && !t.isStage) { const oldX = t.x; const oldY = t.y; t.x = x; t.y = y; this._drawPenLine(t, oldX, oldY); } return Promise.resolve(); }
    pointInDirection(target, dir) { const t = target; if (t && !t.isStage) t.direction = dir; return Promise.resolve(); }
    changeXBy(target, dx) { const t = target; if (t && !t.isStage) { const oldX = t.x; const oldY = t.y; t.x += dx; this._drawPenLine(t, oldX, oldY); } return Promise.resolve(); }
    setXTo(target, x) { const t = target; if (t && !t.isStage) { const oldX = t.x; const oldY = t.y; t.x = x; this._drawPenLine(t, oldX, oldY); } return Promise.resolve(); }
    changeYBy(target, dy) { const t = target; if (t && !t.isStage) { const oldX = t.x; const oldY = t.y; t.y += dy; this._drawPenLine(t, oldX, oldY); } return Promise.resolve(); }
    setYTo(target, y) { const t = target; if (t && !t.isStage) { const oldX = t.x; const oldY = t.y; t.y = y; this._drawPenLine(t, oldX, oldY); } return Promise.resolve(); }
    setRotationStyle(target, style) { const t = target; if (t && !t.isStage) t.rotationStyle = style; return Promise.resolve(); }
    goToLayer(target, layer) { const t = target; if (!t || t.isStage) return Promise.resolve(); const index = this.sprites.findIndex(s => s.id === t.id); if (index === -1) return Promise.resolve(); const [sprite] = this.sprites.splice(index, 1); if (layer === 'front') { this.sprites.push(sprite); } else { this.sprites.unshift(sprite); } return Promise.resolve(); }
    goLayerBy(target, direction, num) { const t = target; if (!t || t.isStage) return Promise.resolve(); const index = this.sprites.findIndex(s => s.id === t.id); if (index === -1) return Promise.resolve(); const newIndex = direction === 'forward' ? index + num : index - num; const clampedIndex = Math.max(0, Math.min(this.sprites.length - 1, newIndex)); if (index === clampedIndex) return Promise.resolve(); const [sprite] = this.sprites.splice(index, 1); this.sprites.splice(clampedIndex, 0, sprite); return Promise.resolve(); }
    
    say(target, msg) { const t = target; if (t) { t.sayText = msg.toString(); clearTimeout(t.sayTimeout); } return Promise.resolve(); }
    sayForSeconds(target, msg, secs) { const t = target; if (!t) return this.wait(secs); t.sayText = msg.toString(); clearTimeout(t.sayTimeout); t.sayTimeout = setTimeout(() => { t.sayText = null; }, secs * 1000); return this.wait(secs); }
    think(target, msg) { const t = target; if (t) { t.thinkText = msg.toString(); clearTimeout(t.thinkTimeout); } return Promise.resolve(); }
    thinkForSeconds(target, msg, secs) { const t = target; if (!t) return this.wait(secs); t.thinkText = msg.toString(); clearTimeout(t.thinkTimeout); t.thinkTimeout = setTimeout(() => { t.thinkText = null; }, secs * 1000); return this.wait(secs); }
    show(target) { const t = target; if (t) t.visible = true; return Promise.resolve(); }
    hide(target) { const t = target; if (t) t.visible = false; return Promise.resolve(); }
    changeSizeBy(target, d) { const t = target; if (t && !t.isStage) t.size += d; return Promise.resolve(); }
    setSizeTo(target, s) { const t = target; if (t && !t.isStage) t.size = s; return Promise.resolve(); }
    changeEffectBy(target, effect, d) { const t = target; if (t && t.graphicEffects.hasOwnProperty(effect)) t.graphicEffects[effect] += d; return Promise.resolve(); }
    setEffectTo(target, effect, v) { const t = target; if (t && t.graphicEffects.hasOwnProperty(effect)) t.graphicEffects[effect] = v; return Promise.resolve(); }
    clearGraphicEffects(target) { const t = target; if (t) t.graphicEffects = { ghost: 0 }; return Promise.resolve(); }
    switchCostumeTo(target, costume) { const t = target; if (t) { const index = typeof costume === 'number' ? costume - 1 : t.costumes.findIndex(c => c.name === costume); if (index >= 0 && index < t.costumes.length) t.currentCostumeIndex = index; } return Promise.resolve(); }
    nextCostume(target) { const t = target; if (t && t.costumes.length > 0) t.currentCostumeIndex = (t.currentCostumeIndex + 1) % t.costumes.length; return Promise.resolve(); }
    getCostumeInfo(target, type) { const t = target; if (!t) return ''; return type === 'number' ? t.currentCostumeIndex + 1 : t.getCurrentCostume()?.name || ''; }
    switchBackdropTo(backdrop) { const index = typeof backdrop === 'number' ? backdrop - 1 : this.stage.costumes.findIndex(c => c.name === backdrop); if (index >= 0 && index < this.stage.costumes.length) { this.stage.currentCostumeIndex = index; const newBackdrop = this.stage.getCurrentCostume(); if(newBackdrop) this._runScripts(this.eventScripts.backdropSwitch[newBackdrop.name]); } return Promise.resolve(); }
    nextBackdrop() { if (this.stage.costumes.length > 0) { this.stage.currentCostumeIndex = (this.stage.currentCostumeIndex + 1) % this.stage.costumes.length; const newBackdrop = this.stage.getCurrentCostume(); if(newBackdrop) this._runScripts(this.eventScripts.backdropSwitch[newBackdrop.name]); } return Promise.resolve(); }
    getBackdropInfo(type) { return type === 'number' ? this.stage.currentCostumeIndex + 1 : this.stage.getCurrentCostume()?.name || ''; }

    playSound(url) { return new Promise(resolve => { const audio = new Audio(url); this.activeSounds.add(audio); audio.onended = () => { this.activeSounds.delete(audio); resolve(); }; audio.play().catch(e => { console.warn("Sound play interrupted"); this.activeSounds.delete(audio); resolve(); }); }); }
    startSound(url) { if (this.stopSignal) return; const audio = new Audio(url); audio.addEventListener('ended', () => { this.activeSounds.delete(audio); }); audio.play().catch(e => { console.warn("Sound play failed:", e); this.activeSounds.delete(audio); }); this.activeSounds.add(audio); return Promise.resolve(); }
    stopAllSounds() { this.activeSounds.forEach(sound => { sound.pause(); sound.currentTime = 0; }); this.activeSounds.clear(); return Promise.resolve(); }

    async ask(question) { const result = await this.showPrompt(question, ''); this.answer = result; }
    getAnswer() { return this.answer; }
    isKeyPressed(key) { return this.keysDown.has(key.toLowerCase()); }
    isTouching(target, targetName) { const t = target; if (!t || t.isStage) return false; const b1 = t.getBounds(); if (!b1) return false; if (targetName === '_mouse_') return this.mouseX >= b1.left && this.mouseX <= b1.right && this.mouseY <= b1.top && this.mouseY >= b1.bottom; if (targetName === '_edge_') return b1.left <= -240 || b1.right >= 240 || b1.bottom <= -180 || b1.top >= 180; const other = this.sprites.find(s => s.name === targetName); if (!other) return false; const b2 = other.getBounds(); if (!b2) return false; return b1.left < b2.right && b1.right > b2.left && b1.bottom < b2.top && b1.top > b2.bottom; }
    distanceTo(target, targetName) { const t = target; if (!t || t.isStage) return 0; let tx, ty; if (targetName === '_mouse_') { tx = this.mouseX; ty = this.mouseY; } else { const other = this.sprites.find(s => s.name === targetName); if (!other) return 0; tx = other.x; ty = other.y; } return Math.hypot(t.x - tx, t.y - ty); }
    getMouseX() { return this.mouseX; }
    getMouseY() { return this.mouseY; }
    getIsMouseDown() { return this.isMouseDown; }
    getTimer() { return (Date.now() - this.timerStart) / 1000; }
    resetTimer() { this.timerStart = Date.now(); return Promise.resolve(); }
    
    pickRandom(a, b) { const min = Math.min(a, b); const max = Math.max(a, b); return Math.random() * (max - min) + min; }
    
    setVariable(name, value, isLocal, target) { if (isLocal) { if (target) { target.variables[name] = value; } } else { this.variables[name] = value; } }
    getVariable(name, isLocal, target) { if (isLocal) { return target ? (target.variables[name] ?? 0) : 0; } return this.variables[name] ?? 0; }
    changeVariableBy(name, value, isLocal, target) { if (isLocal) { if (target) { const currentVal = Number(target.variables[name] || 0); target.variables[name] = currentVal + Number(value); } } else { const currentVal = Number(this.variables[name] || 0); this.variables[name] = currentVal + Number(value); } }
    getList(name) { if (!this.lists[name]) this.lists[name] = []; return this.lists[name]; }
    addToList(name, item) { this.getList(name).push(item); }
    deleteAllOfList(name) { this.lists[name] = []; }
    deleteOfList(name, index) { if (index > 0 && index <= this.getList(name).length) this.getList(name).splice(index - 1, 1); }
    insertAtList(name, index, item) { if (index > 0 && index <= this.getList(name).length + 1) this.getList(name).splice(index - 1, 0, item); }
    replaceItemOfList(name, index, item) { if (index > 0 && index <= this.getList(name).length) this.getList(name)[index - 1] = item; }
    getItemOfList(name, index) { return this.getList(name)[index - 1] || ''; }
    getIndexOfItemInList(name, item) { const index = this.getList(name).indexOf(item); return index === -1 ? 0 : index + 1; }
    getLengthOfList(name) { return this.getList(name).length; }
    listContainsItem(name, item) { return this.getList(name).includes(item); }

    registerCloneStartScript(originalSpriteId, func) { if (!this.eventScripts.cloneStart[originalSpriteId]) this.eventScripts.cloneStart[originalSpriteId] = []; this.eventScripts.cloneStart[originalSpriteId].push(func); }
    async createCloneOf(target, targetName) { const originalSprite = targetName === '_myself_' ? target : this.sprites.find(s => s.name === targetName && !s.isClone); if (!originalSprite) return; const newClone = originalSprite.clone(); await newClone.load(); this.sprites.push(newClone); const cloneStartScripts = this.eventScripts.cloneStart[originalSprite.id]; if (cloneStartScripts) { const previousTargetId = this.activeTargetId; this.setActiveTarget(newClone.id); const cloneContext = { scriptIsActive: true, target: newClone }; const boundScripts = cloneStartScripts.map(script => script.bind(cloneContext)); this._runScripts(boundScripts); this.setActiveTarget(previousTargetId); } }
    async deleteThisClone(target) { if (target && target.isClone) { this.sprites = this.sprites.filter(s => s.id !== target.id); } throw new StopScriptExecution(); }

    clearPen() { this.penCtx.clearRect(0, 0, this.penCanvas.width, this.penCanvas.height); return Promise.resolve(); }
    penDown(target) { const t = target; if (t && !t.isStage) { t.isPenDown = true; } return Promise.resolve(); }
    penUp(target) { const t = target; if (t && !t.isStage) { t.isPenDown = false; } return Promise.resolve(); }
    setPenColor(target, color) { const t = target; if (t && !t.isStage) { t.penColor = color; } return Promise.resolve(); }
    setPenSizeTo(target, size) { const t = target; if (t && !t.isStage) { t.penSize = Math.max(1, Number(size)); } return Promise.resolve(); }
    changePenSizeBy(target, delta) { const t = target; if (t && !t.isStage) { t.penSize = Math.max(1, t.penSize + Number(delta)); } return Promise.resolve(); }
    _drawPenLine(sprite, oldX, oldY) { if (!sprite.isPenDown || sprite.isStage) return; const canvasCenterX = this.penCanvas.width / 2; const canvasCenterY = this.penCanvas.height / 2; this.penCtx.beginPath(); this.penCtx.moveTo(canvasCenterX + oldX, canvasCenterY - oldY); this.penCtx.lineTo(canvasCenterX + sprite.x, canvasCenterY - sprite.y); this.penCtx.strokeStyle = sprite.penColor; this.penCtx.lineWidth = sprite.penSize; this.penCtx.lineCap = 'round'; this.penCtx.stroke(); }

   populateVoices() { const getAndSetVoices = () => { this.ttsVoices = window.speechSynthesis.getVoices(); if (!this.selectedTtsVoice && this.ttsVoices.length > 0) { this.selectedTtsVoice = this.ttsVoices.find(v => v.name === 'Google US English') || this.ttsVoices[0]; } }; getAndSetVoices(); if (window.speechSynthesis.onvoiceschanged !== undefined) { window.speechSynthesis.onvoiceschanged = getAndSetVoices; } }
    speak(text) { return new Promise((resolve, reject) => { if (this.stopSignal) { return resolve(); } try { const utterance = new SpeechSynthesisUtterance(String(text)); if (this.selectedTtsVoice) { utterance.voice = this.selectedTtsVoice; } utterance.onend = () => { resolve(); }; utterance.onerror = (event) => { if (this.stopSignal && event.error === 'interrupted') { resolve(); } else { console.error("Speech synthesis error:", event.error); reject(event.error); } }; window.speechSynthesis.speak(utterance); } catch (error) { console.error("Could not start speech synthesis:", error); reject(error); } }); }
    setVoice(voiceName) { const foundVoice = this.ttsVoices.find(v => v.name === voiceName); if (foundVoice) { this.selectedTtsVoice = foundVoice; } return Promise.resolve(); }
    getCurrentVoice() { return this.selectedTtsVoice ? this.selectedTtsVoice.name : ''; }

    async turnVideoOn() { if (this.videoStream) return Promise.resolve(); try { this.videoStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false }); this.videoFeed.srcObject = this.videoStream; this.videoFeed.onloadedmetadata = () => { try { this.videoFeed.play(); this.videoFeed.style.display = 'block'; if (this.stageArea) { this.stageArea.style.backgroundColor = 'transparent'; } this.videoCanvas.width = this.videoFeed.videoWidth; this.videoCanvas.height = this.videoFeed.videoHeight; requestAnimationFrame(this._analyzeVideoMotion.bind(this)); } catch (e) { console.warn("Video play interrupted, likely by project stop.", e.name); } }; } catch (err) { console.error("Error accessing webcam:", err); this.videoStream = null; } return Promise.resolve(); }
    turnVideoOff() { if (this.videoStream) { this.videoStream.getTracks().forEach(track => track.stop()); this.videoStream = null; this.videoFeed.style.display = 'none'; this.lastVideoFrame = null; this.videoMotion = 0; if (this.stageArea) { this.stageArea.style.backgroundColor = ''; } } return Promise.resolve(); }

    async initFaceLandmarker() {
        if (this.isFaceLandmarkerInitialized) return;
        
        try {
            await waitForMediaPipe();
            const { FaceLandmarker, FilesetResolver } = window.MediaPipeTasks;
    
            const filesetResolver = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
            );

            this.faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
                baseOptions: {
                    modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                    delegate: "GPU"
                },
                outputFaceBlendshapes: true,
                outputFacialTransformationMatrixes: true,
                runningMode: "VIDEO",
                numFaces: 1
            });
            this.isFaceLandmarkerInitialized = true;
            console.log("Face Landmarker initialized successfully from CDN.");
        } catch (e) {
            console.error("Failed to initialize Face Landmarker:", e);
        }
    }
    
    _analyzeVideoMotion() { if (!this.videoStream) return; const now = performance.now(); if (this.faceLandmarker && now - this.lastPredictionTime > 100) { this.lastPredictionTime = now; this.faceLandmarkerResults = this.faceLandmarker.detectForVideo(this.videoFeed, now); } this.videoCtx.drawImage(this.videoFeed, 0, 0, this.videoCanvas.width, this.videoCanvas.height); const currentFrame = this.videoCtx.getImageData(0, 0, this.videoCanvas.width, this.videoCanvas.height).data; if (this.lastVideoFrame) { let motion = 0; for (let i = 0; i < currentFrame.length; i += 4) { const diff = Math.abs(currentFrame[i] - this.lastVideoFrame[i]) + Math.abs(currentFrame[i+1] - this.lastVideoFrame[i+1]) + Math.abs(currentFrame[i+2] - this.lastVideoFrame[i+2]); if (diff > 50) { motion++; } } this.videoMotion = Math.min(100, (motion / (currentFrame.length / 4)) * 100 * 5); } this.lastVideoFrame = currentFrame; requestAnimationFrame(this._analyzeVideoMotion.bind(this)); }
    getNumberOfFaces() { return this.faceLandmarkerResults?.faceLandmarks?.length || 0; }
    getFaceProperty(prop, index) { if (!this.faceLandmarkerResults?.faceLandmarks || index < 1 || index > this.faceLandmarkerResults.faceLandmarks.length) { return 0; } const landmarks = this.faceLandmarkerResults.faceLandmarks[index - 1]; let minX = 1, maxX = 0, minY = 1, maxY = 0; for (const point of landmarks) { minX = Math.min(minX, point.x); maxX = Math.max(maxX, point.x); minY = Math.min(minY, point.y); maxY = Math.max(maxY, point.y); } const stageWidth = 480; const stageHeight = 360; const faceCenterX = (minX + (maxX - minX) / 2); const faceCenterY = (minY + (maxY - minY) / 2); const scratchX = (1 - faceCenterX - 0.5) * stageWidth; const scratchY = (0.5 - faceCenterY) * stageHeight; switch (prop) { case 'x': return Math.max(-stageWidth / 2, Math.min(stageWidth / 2, scratchX)); case 'y': return Math.max(-stageHeight / 2, Math.min(stageHeight / 2, scratchY)); case 'width': return (maxX - minX) * stageWidth; case 'height': return (maxY - minY) * stageHeight; default: return 0; } }
    getFaceExpression(index, expressionName) { if (!this.faceLandmarkerResults?.faceBlendshapes || index < 1 || index > this.faceLandmarkerResults.faceBlendshapes.length) { return 0; } const blendshapes = this.faceLandmarkerResults.faceBlendshapes[index - 1].categories; const expression = blendshapes.find(c => c.categoryName === expressionName); return expression ? expression.score * 100 : 0; }
    isSmiling(index) { const smileLeft = this.getFaceExpression(index, 'mouthSmileLeft'); const smileRight = this.getFaceExpression(index, 'mouthSmileRight'); return (smileLeft + smileRight) / 2 > 30; }
    isEyeOpen(index, side) { const eyeBlink = this.getFaceExpression(index, side === 'left' ? 'eyeBlinkLeft' : 'eyeBlinkRight'); return eyeBlink < 40; }
}