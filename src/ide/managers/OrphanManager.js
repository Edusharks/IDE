
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
            'gpio_on_pin_change', 
            'wifi_on_web_request',
            'face_landmark_on_face_data',
            'hand_gesture_on_gesture',
            'image_classification_on_class',
            'object_detection_on_object',
            'custom_model_when_class',
            'dashboard_on_control_change',
            'dashboard_when_button_is',
        ]);
    }

    runOrphanCheck() {
        if (!this.workspace) return;

        //console.log("%c[OrphanManager] Running Check...", "color: #2dd4bf");

        try {
            const allRenderedBlocks = this.workspace.getAllBlocks(true);
            allRenderedBlocks.forEach(renderedBlock => {
                if (!renderedBlock.svgGroup_ || renderedBlock.isInsertionMarker()) {
                    return; 
                }
                const root = renderedBlock.getRootBlock();
                const isValid = this.validRoots.has(root.type);
                const hasClass = renderedBlock.svgGroup_.classList.contains(this.ORPHAN_CLASS);
                if (!isValid && !hasClass) {
                    Blockly.utils.dom.addClass(renderedBlock.svgGroup_, this.ORPHAN_CLASS);
                } 
                else if (isValid && hasClass) {
                    Blockly.utils.dom.removeClass(renderedBlock.svgGroup_, this.ORPHAN_CLASS);
                }
            });

        } catch (e) {
            console.error("[OrphanManager] CRITICAL ERROR during style update:", e);
        }
    }
}