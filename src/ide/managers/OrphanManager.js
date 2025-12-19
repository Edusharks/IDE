// src/ide/managers/OrphanManager.js

import * as Blockly from 'blockly/core';

export class OrphanManager {
    constructor(workspace) {
        this.workspace = workspace;
        this.ORPHAN_CLASS = 'blockly-orphan-block';
        
        // A Set of block types that are allowed to sit alone on the workspace
        this.validRoots = new Set([
            // Core Loops
            'on_start', 
            'forever', 
            'every_x_ms', 
            
            // Functions
            'procedures_defnoreturn',
            'procedures_defreturn',

            // Hardware Interrupts
            'gpio_on_pin_change', 
            
            // Web/WiFi Events
            'wifi_on_web_request',
            
            // AI Events
            'face_landmark_on_face_data',
            'hand_gesture_on_gesture',
            'image_classification_on_class',
            'object_detection_on_object',
            'custom_model_when_class',
            
            // Dashboard Events
            'dashboard_on_control_change',
            'dashboard_when_button_is'
        ]);
    }

    runOrphanCheck() {
        if (!this.workspace) return;

        try {
            // We iterate ONLY the top-level blocks (blocks with no parent)
            const topBlocks = this.workspace.getTopBlocks(false);
            const allBlocks = this.workspace.getAllBlocks(false);
            
            // 1. Mark all blocks as orphans initially
            // This is safer than trying to untag specific ones
            const validBlockIds = new Set();

            // 2. Identify Valid Trees
            topBlocks.forEach(rootBlock => {
                if (this.validRoots.has(rootBlock.type)) {
                    // This is a valid root. Mark it and ALL its children as valid.
                    const descendants = rootBlock.getDescendants(false);
                    descendants.forEach(b => validBlockIds.add(b.id));
                }
            });

            // 3. Apply Styles
            allBlocks.forEach(block => {
                const group = block.getSvgRoot();
                if (!group) return;

                if (validBlockIds.has(block.id)) {
                    // It is valid
                    Blockly.utils.dom.removeClass(group, this.ORPHAN_CLASS);
                } else {
                    // It is an orphan
                    Blockly.utils.dom.addClass(group, this.ORPHAN_CLASS);
                }
            });

        } catch (e) {
            console.error("[OrphanManager] Error:", e);
        }
    }
}