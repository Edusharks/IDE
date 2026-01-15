// src/ide/blockly/custom-model-blocks.js
import * as Blockly from 'blockly/core';

export function registerCustomModelBlocks() {
    const STYLE = 'image_classification_blocks';

    // Helper to populate dropdowns dynamically
    const getCustomClasses = () => {
        if (window.ide && window.ide.aiManager && window.ide.aiManager.isModelSuccessfullyLoaded) {
            const labels = window.ide.aiManager.customModelLabels;
            if (labels && labels.length > 0) {
                return labels.map(label => [label, label]);
            }
        }
        return [["(Load Model First)", "NONE"]];
    };

    const blocks = [
        // 1. Unified Enable Block (Replaces separate Setup block)
        {
            "type": "custom_model_enable",
            "message0": "enable custom model %1",
            "args0": [{ "type": "field_dropdown", "name": "STATE", "options": [["OFF", "OFF"], ["ON", "ON"]] }],
            "message1": "URL %1",
            "args1": [{ "type": "field_input", "name": "URL", "text": "https://teachablemachine.withgoogle.com/models/..." }],
            "previousStatement": null,
            "nextStatement": null,
            "style": STYLE,
            "tooltip": "Turn ON to load model from URL. Turn OFF to stop.",
            "extensions": ["custom_model_validator"]
        },
        
        // 2. Event Block
        {
            "type": "custom_model_when_class",
            "message0": "when Custom Model detects %1",
            "args0": [
                { 
                    "type": "field_dropdown", 
                    "name": "CLASS_NAME", 
                    "options": getCustomClasses
                }
            ],
            "message1": "%1",
            "args1": [{ "type": "input_statement", "name": "DO" }],
            "style": STYLE,
            "tooltip": "Runs code when the specific class is detected."
        },
        
        // 3. Boolean Block
        {
            "type": "custom_model_is_class",
            "message0": "is Custom Model class %1 ?",
            "args0": [
                { 
                    "type": "field_dropdown", 
                    "name": "CLASS_NAME", 
                    "options": getCustomClasses
                }
            ],
            "output": "Boolean",
            "style": STYLE
        }
    ];

    // --- VALIDATOR EXTENSION ---
    // Connects block changes directly to the AiManager logic
    Blockly.Extensions.register('custom_model_validator', function() {
        // Validator for the ON/OFF Dropdown
        const stateField = this.getField('STATE');
        stateField.setValidator(function(option) {
            const block = this.getSourceBlock();
            const url = block.getFieldValue('URL');
            
            // Allow time for block init
            setTimeout(() => {
                if (window.ide && window.ide.aiManager) {
                    if (option === 'ON') {
                        window.ide.aiManager.manageCustomModel(true, url);
                    } else {
                        window.ide.aiManager.manageCustomModel(false);
                    }
                }
            }, 10);
            return option;
        });

        // Validator for the URL Input
        const urlField = this.getField('URL');
        urlField.setValidator(function(newValue) {
            const block = this.getSourceBlock();
            const state = block.getFieldValue('STATE');
            
            // If currently ON, reload with new URL (Debounced)
            if (state === 'ON' && window.ide && window.ide.aiManager) {
                setTimeout(() => {
                    // Check if value still matches (user might still be typing)
                    if(block.getFieldValue('URL') === newValue) {
                        window.ide.aiManager.manageCustomModel(true, newValue);
                    }
                }, 800);
            }
            return newValue;
        });
    });

    Blockly.defineBlocksWithJsonArray(blocks);
}