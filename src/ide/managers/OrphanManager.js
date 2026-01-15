// src/ide/managers/OrphanManager.js

import * as Blockly from 'blockly/core';

export class OrphanManager {
    constructor(workspace) {
        this.workspace = workspace;
        this.ORPHAN_CLASS = 'blockly-orphan-block';
        
        this.validRoots = new Set([
            'on_start', 
            'forever', 
            'every_x_ms', 
            'procedures_defnoreturn',
            'procedures_defreturn',
            'gpio_on_pin_change', 
            'wifi_on_web_request',
            'face_landmark_on_face_data',
            'hand_gesture_on_gesture',
            'image_classification_on_class',
            'object_detection_on_object',
            'custom_model_when_class',
            'dashboard_on_control_change',
            'dashboard_when_button_is'
        ]);
    }

    runOrphanCheck() {
        if (!this.workspace) return;

        requestAnimationFrame(() => {
            try {
                const allBlocks = this.workspace.getAllBlocks(false);
                allBlocks.forEach(block => {
                    const group = block.getSvgRoot();
                    if (group) {
                        Blockly.utils.dom.removeClass(group, this.ORPHAN_CLASS);
                    }
                });
                const topBlocks = this.workspace.getTopBlocks(false);
                
                topBlocks.forEach(rootBlock => {
                    if (!this.validRoots.has(rootBlock.type)) {
                        const group = rootBlock.getSvgRoot();
                        if (group) {
                            Blockly.utils.dom.addClass(group, this.ORPHAN_CLASS);
                        }
                    }
                });

            } catch (e) {
                console.error("[OrphanManager] Error:", e);
            }
        });
    }
}