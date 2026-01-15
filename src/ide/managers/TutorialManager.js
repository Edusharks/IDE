// src/ide/managers/TutorialManager.js
'use strict';

export class TutorialManager {
    constructor(ideInstance) {
        this.ide = ideInstance;
        this.currentTutorial = null;
        this.currentStepIndex = 0;
        this.isFloating = false;
        this.isLeftAligned = false;
        
        this.panel = null;
        this.container = null; 
        
        this.initUI();
    }

    initUI() {
        const panel = document.createElement('aside');
        panel.id = 'tutorial-panel';
        panel.className = 'docked'; 
        panel.innerHTML = `
            <div class="tut-header" id="tut-drag-handle">
                <span class="tut-title">Tutorial</span>
                <div class="tut-controls">
                    <button class="tut-btn" id="tut-flip-btn" title="Move Left/Right">
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><path d="M12 4v16"></path></svg>
                    </button>
                    <button class="tut-btn" id="tut-dock-btn" title="Dock/Float">
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>
                    </button>
                    <button class="tut-btn" id="tut-close-btn" title="Close">
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>
            </div>
            <div class="tut-content" id="tut-content-area"></div>
            <div class="tut-footer">
                <button class="btn secondary" id="tut-prev-btn" disabled>Back</button>
                <span class="tut-progress" id="tut-progress-text">Step 1/1</span>
                <button class="btn primary" id="tut-next-btn">Next</button>
            </div>
        `;

        this.container = document.querySelector('.ide-container');
        this.container.appendChild(panel);
        this.panel = panel;

        document.getElementById('tut-close-btn').addEventListener('click', () => this.close());
        document.getElementById('tut-dock-btn').addEventListener('click', () => this.toggleLayoutMode());
        document.getElementById('tut-flip-btn').addEventListener('click', () => this.toggleDockSide());
        document.getElementById('tut-prev-btn').addEventListener('click', () => this.prevStep());
        document.getElementById('tut-next-btn').addEventListener('click', () => this.nextStep());

        if (this.ide.simulatorManager) {
            this.ide.simulatorManager.makeUiElementDraggable('tutorial-panel', 'tut-drag-handle');
        }
    }

    loadTutorial(tutorialJson) {
        if (!tutorialJson || !tutorialJson.steps) return;
        this.currentTutorial = tutorialJson;
        this.currentStepIndex = 0;
        this.panel.style.display = 'flex';
        
        if (!this.container.classList.contains('tutorial-active')) {
            this.container.classList.add('tutorial-active');
        }
        if (this.isLeftAligned && !this.isFloating) {
            this.container.classList.add('tut-left');
        }
        
        this._triggerResize();
        this.renderStep();
    }

    close() {
        this.panel.style.display = 'none';
        this.container.classList.remove('tutorial-active');
        this.container.classList.remove('tut-left');
        this.currentTutorial = null;
        this._triggerResize();
    }

    toggleLayoutMode() {
        this.isFloating = !this.isFloating;
        if (this.isFloating) {
            this.panel.classList.remove('docked');
            this.panel.classList.add('floating');
            this.container.classList.remove('tutorial-active');
            this.container.classList.remove('tut-left'); 
            
            this.panel.style.top = '100px';
            this.panel.style.width = '400px';
            this.panel.style.height = '600px';
            if (this.isLeftAligned) { this.panel.style.left = '20px'; this.panel.style.right = 'auto'; } 
            else { this.panel.style.right = '20px'; this.panel.style.left = 'auto'; }
            document.getElementById('tut-flip-btn').style.display = 'none';
        } else {
            this.panel.classList.remove('floating');
            this.panel.classList.add('docked');
            this.container.classList.add('tutorial-active'); 
            this.panel.removeAttribute('style');
            this.panel.style.display = 'flex';
            
            if (this.isLeftAligned) this.container.classList.add('tut-left');
            else this.container.classList.remove('tut-left');
            
            document.getElementById('tut-flip-btn').style.display = 'inline-flex';
        }
        this._triggerResize();
    }

    toggleDockSide() {
        if (this.isFloating) return; 
        this.isLeftAligned = !this.isLeftAligned;
        if (this.isLeftAligned) this.container.classList.add('tut-left');
        else this.container.classList.remove('tut-left');
        this._triggerResize();
    }

    _triggerResize() {
        setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
            if (this.ide.simulatorManager) this.ide.simulatorManager.fitToScreen();
        }, 100);
    }

    // =========================================================
    // RENDER LOGIC (UPDATED FOR STYLES & NEW COMPONENTS)
    // =========================================================

    renderStep() {
        if (!this.currentTutorial) return;
        const step = this.currentTutorial.steps[this.currentStepIndex];
        const contentArea = document.getElementById('tut-content-area');
        
        this.panel.querySelector('.tut-title').textContent = this.currentTutorial.meta.title;
        document.getElementById('tut-progress-text').textContent = `Step ${this.currentStepIndex + 1} / ${this.currentTutorial.steps.length}`;
        
        let html = `<div class="tut-step-h1">${step.title}</div>`;
        
        step.content.forEach(block => {
            // Helper to generate style string from JSON properties
            const style = this._generateStyleString(block.properties);

            switch(block.type) {
                case 'heading': 
                    html += `<h3 style="${style} margin:1rem 0 0.5rem 0;">${block.text}</h3>`; 
                    break;
                
                case 'paragraph': 
                    html += `<p style="${style} margin-bottom:1rem;">${block.text}</p>`; 
                    break;
                
                case 'image': 
                    // Images need a container for alignment, and img for dimensions
                    const align = block.properties?.alignment || 'center';
                    html += `<div style="text-align:${align}; margin-bottom:1rem;">
                                <img src="${block.src}" style="${style} max-width:100%; border:1px solid var(--border-color);" alt="Image">
                                ${block.properties?.caption ? `<div style="font-size:0.8rem; color:var(--text-secondary); margin-top:4px;">${block.properties.caption}</div>` : ''}
                             </div>`; 
                    break;
                
                case 'code': 
                    const themeBg = block.properties?.theme === 'light' ? '#f5f5f5' : '#171923';
                    const themeColor = block.properties?.theme === 'light' ? '#333' : '#e2e8f0';
                    html += `<div class="tut-code" style="background:${themeBg}; color:${themeColor}; ${style}">${block.text}</div>`; 
                    break;
                
                case 'info': 
                    html += this._renderInfoBox(block);
                    break;

                case 'hint': 
                    html += `<details style="margin-bottom:1rem; border:1px solid var(--border-color); border-radius:6px; padding:8px;">
                                <summary style="cursor:pointer; font-weight:bold; color:var(--accent-primary);">💡 Show Hint</summary>
                                <div style="margin-top:8px; ${style}">${block.text}</div>
                             </details>`;
                    break;
                
                case 'video': 
                    const h = block.properties?.height || '200px';
                    const safeUrl = this._formatVideoUrl(block.url);
                    
                    html += `<div style="position:relative; width:100%; height:${h}; margin-bottom:1rem;">
                                <iframe src="${safeUrl}" 
                                    style="width:100%; height:100%; border:none; border-radius:8px;" 
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                    credentialless="true"
                                    allowfullscreen>
                                </iframe>
                             </div>`;
                    break;
                
                case 'quiz': 
                    html += this._renderQuiz(block); 
                    break;

                case 'exercise':
                    html += this._renderExercise(block);
                    break;

                case 'challenge':
                    html += this._renderChallenge(block);
                    break;
            }
        });

        if (step.validation) {
            html += `<div class="tut-validation" id="tut-validation-box">
                        <p><strong>Task:</strong> ${this._getValidationText(step.validation)}</p>
                        <button class="btn secondary" style="width:100%; margin-top:5px;" onclick="window.ide.tutorialManager.checkValidation()">Check Code</button>
                     </div>`;
        }

        contentArea.innerHTML = html;
        contentArea.scrollTop = 0;

        document.getElementById('tut-prev-btn').disabled = (this.currentStepIndex === 0);
        document.getElementById('tut-next-btn').innerText = (this.currentStepIndex === this.currentTutorial.steps.length - 1) ? 'Finish' : 'Next';
    }

    /**
     * Converts JSON properties object into a CSS string.
     */
    _generateStyleString(props) {
        if (!props) return '';
        let css = '';
        if (props.color) css += `color: ${props.color}; `;
        if (props.textColor) css += `color: ${props.textColor}; `; // Handle alias
        if (props.fontSize) css += `font-size: ${props.fontSize}; `;
        if (props.fontWeight) css += `font-weight: ${props.fontWeight}; `;
        if (props.textAlign) css += `text-align: ${props.textAlign}; `;
        if (props.alignment) css += `text-align: ${props.alignment}; `; // Handle alias
        if (props.fontFamily) css += `font-family: ${props.fontFamily}; `;
        if (props.lineHeight) css += `line-height: ${props.lineHeight}; `;
        
        // Image/Video specific
        if (props.width) css += `width: ${props.width}; `;
        if (props.height) css += `height: ${props.height}; `;
        if (props.borderRadius) css += `border-radius: ${props.borderRadius}; `;
        
        return css;
    }

    _formatVideoUrl(url) {
        if (!url) return '';
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);

        if (match && match[2].length === 11) {
            return `https://www.youtube.com/embed/${match[2]}`;
        }
        return url;
    }

    _renderInfoBox(block) {
        const bg = block.properties?.backgroundColor || 'rgba(90, 103, 216, 0.1)';
        const border = block.properties?.borderColor || 'var(--accent-primary)';
        const textColor = block.properties?.textColor || 'var(--text-primary)';
        
        return `<div style="background:${bg}; border-left:4px solid ${border}; color:${textColor}; padding:12px; margin-bottom:1rem; border-radius:4px;">
                    ${block.text}
                </div>`;
    }

    _renderExercise(block) {
        return `<div style="border:1px solid var(--border-color); border-radius:8px; padding:15px; margin-bottom:1rem; background:var(--bg-inset);">
                    <div style="font-weight:bold; color:var(--accent-primary); margin-bottom:5px;">💪 ${block.title}</div>
                    <div style="font-size:0.9rem; margin-bottom:10px;">${block.description}</div>
                    ${block.instructions ? `<div style="font-size:0.85rem; padding:8px; background:var(--bg-main); border-radius:4px;">${block.instructions}</div>` : ''}
                </div>`;
    }

    _renderChallenge(block) {
        return `<div style="border:1px solid #F59E0B; border-radius:8px; padding:15px; margin-bottom:1rem; background:rgba(245, 158, 11, 0.05);">
                    <div style="font-weight:bold; color:#F59E0B; margin-bottom:5px;">🏆 ${block.title}</div>
                    <div style="font-size:0.9rem;">${block.description}</div>
                    <div style="margin-top:10px; font-size:0.8rem; opacity:0.8;">Points: ${block.properties?.points || 50}</div>
                </div>`;
    }

    _renderQuiz(block) {
        const opts = block.options.map((opt, i) => 
            `<button class="tut-quiz-opt" onclick="window.ide.tutorialManager.handleQuiz(this, ${i}, ${block.correctIndex}, '${block.successMessage}', '${block.failMessage}')">${opt}</button>`
        ).join('');
        return `<div class="tut-quiz"><h4>❓ ${block.question}</h4>${opts}<p class="quiz-feedback" style="font-size:0.85rem; margin-top:8px; font-weight:bold;"></p></div>`;
    }

    handleQuiz(btnElement, selectedIndex, correctIndex, successMsg, failMsg) {
        const parent = btnElement.parentElement;
        const feedback = parent.querySelector('.quiz-feedback');
        parent.querySelectorAll('.tut-quiz-opt').forEach(b => {
            b.classList.remove('correct', 'wrong');
            b.style.cursor = 'default';
        });

        if (selectedIndex === correctIndex) {
            btnElement.classList.add('correct');
            feedback.style.color = 'var(--accent-success)';
            feedback.textContent = successMsg || "Correct!";
        } else {
            btnElement.classList.add('wrong');
            feedback.style.color = 'var(--accent-error)';
            feedback.textContent = failMsg || "Try again.";
        }
    }

    _getValidationText(rule) {
        if (rule.type === 'block_exists') return `Place a "${rule.blockType}" block.`;
        if (rule.type === 'component_exists') return `Add a "${rule.componentType}" to the simulator.`;
        if (rule.type === 'code_run') return `Run the code/simulation.`;
        return "Complete the task.";
    }

    checkValidation() {
        const step = this.currentTutorial.steps[this.currentStepIndex];
        if (!step.validation) return;

        const rule = step.validation;
        const workspace = this.ide.blocklyManager.workspace;
        let passed = false;

        if (rule.type === 'block_exists') {
            const blocks = workspace.getAllBlocks(false);
            passed = blocks.some(b => b.type === rule.blockType);
        }
        else if (rule.type === 'component_exists') {
            const components = Array.from(this.ide.simulatorManager.components.values());
            passed = components.some(c => c.type === rule.componentType);
        }
        else if (rule.type === 'code_run') {
            passed = this.ide.isSimulationRunning;
        }

        const box = document.getElementById('tut-validation-box');
        if (passed) {
            box.classList.add('success');
            box.innerHTML = `<p>✅ <strong>Task Complete!</strong></p>`;
            this.ide.toastManager.show("Task Complete!", "success");
            setTimeout(() => this.nextStep(), 1000);
        } else {
            this.ide.toastManager.show("Not quite. Check instructions.", "warning");
        }
    }

    nextStep() {
        if (this.currentStepIndex < this.currentTutorial.steps.length - 1) {
            this.currentStepIndex++;
            this.renderStep();
        } else {
            this.ide.toastManager.show("Tutorial Completed! 🎉", "success");
            this.close();
        }
    }

    prevStep() {
        if (this.currentStepIndex > 0) {
            this.currentStepIndex--;
            this.renderStep();
        }
    }
}