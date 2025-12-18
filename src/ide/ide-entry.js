// src/ide/ide-entry.js

import './ide.css';
import 'shepherd.js/dist/css/shepherd.css';

// --- Monaco Editor ---
import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';

self.MonacoEnvironment = {
  getWorker() {
    return new editorWorker();
  },
};

// --- Blockly Core & Fields ---
import * as Blockly from 'blockly';
import { installAllBlocks as installColourBlocks } from '@blockly/field-colour';
import '@blockly/field-colour-hsv-sliders'; 
import { registerFieldAngle } from '@blockly/field-angle';
import { registerFieldMultilineInput, textMultiline } from '@blockly/field-multilineinput';
import '@blockly/field-bitmap';             
import '@blockly/field-date';               
import '@blockly/field-slider';             
import '@blockly/field-grid-dropdown';      
import '@blockly/field-dependent-dropdown'; 
import 'blockly/blocks';
import { pythonGenerator } from 'blockly/python';
import 'blockly/msg/en';
import '@blockly/toolbox-search';

// --- App Logic ---
import { SettingsManager } from '../shared/SettingsManager.js';
import { ESP32BlockIDE } from './ide.js';
import { initializeBlockly } from './blockly/blockly-init.js';

// --- Block Definitions (Non-Hardware) ---
import { registerBasicBlocks } from './blockly/basic-blocks.js';
import { registerFaceLandmarkBlocks } from './blockly/face-landmark-blocks.js';
import { registerHandGestureBlocks } from './blockly/hand-gesture-blocks.js';
import { registerImageClassificationBlocks } from './blockly/image-classification-blocks.js';
import { registerObjectDetectionBlocks } from './blockly/object-detection-blocks.js';
import { registerCustomModelBlocks } from './blockly/custom-model-blocks.js';

// --- GENERATORS (Logic) ---
import { registerBasicGenerators } from './blockly/basic-generators.js';
import { registerFaceLandmarkGenerators } from './blockly/face-landmark-generators.js';
import { registerHandGestureGenerators } from './blockly/hand-gesture-generators.js';
import { registerImageClassificationGenerators } from './blockly/image-classification-generators.js';
import { registerObjectDetectionGenerators } from './blockly/object-detection-generators.js';
import { registerCustomModelGenerators } from './blockly/custom-model-generators.js';

// --- HARDWARE GENERATORS (Modular) ---
import { registerNeoPixelGenerators } from './blockly/neopixel_generators.js';
import { registerOledGenerators } from './blockly/oled_generators.js';
import { registerWifiGenerators } from './blockly/wifi_generators.js';
import { registerSensorGenerators } from './blockly/sensors_generators.js';
import { registerActuatorGenerators } from './blockly/actuators_generators.js';
import { registerCommunicationGenerators } from './blockly/communication_generators.js';
import { registerBluetoothGenerators } from './blockly/bluetooth_generators.js';

// --- BOARD SPECIFIC GENERATORS ---
import { registerEsp32Generators } from './blockly/esp32-generators.js';
import { registerPicoGenerators } from './blockly/pico-generators.js';

// Style Helper
function applyBlockStyles() {
    ['controls_if', 'controls_repeat_ext', 'controls_whileUntil', 'controls_for', 'controls_forEach', 'controls_flow_statements'].forEach(b => {
        if (Blockly.Blocks[b]) Blockly.Blocks[b].style = 'loops_blocks';
    });
    ['logic_compare', 'logic_operation', 'logic_negate', 'logic_boolean'].forEach(b => {
        if (Blockly.Blocks[b]) Blockly.Blocks[b].style = 'logic_blocks';
    });
    ['math_number', 'math_arithmetic', 'math_single', 'math_modulo', 'math_constrain', 'math_random_int', 'math_constant', 'math_on_list'].forEach(b => {
        if (Blockly.Blocks[b]) Blockly.Blocks[b].style = 'math_blocks';
    });
    ['text', 'text_join', 'text_length', 'text_isEmpty', 'text_indexOf', 'text_charAt', 'text_getSubstring'].forEach(b => {
        if(Blockly.Blocks[b]) Blockly.Blocks[b].style = 'text_blocks';
    });
    ['lists_create_with', 'lists_length', 'lists_isEmpty', 'lists_indexOf', 'lists_getIndex', 'lists_setIndex', 'lists_getSublist'].forEach(b => {
        if (Blockly.Blocks[b]) Blockly.Blocks[b].style = 'lists_blocks';
    });
    if (Blockly.Blocks['variables_set']) Blockly.Blocks['variables_set'].style = 'variable_blocks';
    if (Blockly.Blocks['variables_get']) Blockly.Blocks['variables_get'].style = 'variable_blocks';
    if (Blockly.Blocks['math_change']) Blockly.Blocks['math_change'].style = 'variable_blocks';
}

function printSignature() {
    const styleTitle = [
        'font-family: sans-serif',
        'font-size: 20px',
        'font-weight: bold',
        'color: #5A67D8',
        'text-shadow: 1px 1px 0px black'
    ].join(';');

    const styleBody = [
        'font-family: monospace',
        'font-size: 12px',
        'color: #475569'
    ].join(';');

    console.log('%c Block IDE ', styleTitle);
    console.log('%cProperty of Edusharks Learning and Research Pvt Ltd', styleBody);
    console.log('%cDeveloped by Guhan S', styleBody);
    console.log('%c-------------------------------------------', 'color: #ccc');
}


// --- Main Initialization ---
async function main() {

    printSignature();
    SettingsManager.init();
    
    
    // 1. Install Field Types
    installColourBlocks({ python: pythonGenerator });
    registerFieldAngle();
    registerFieldMultilineInput();
    textMultiline.installBlock({ python: pythonGenerator });
    
    // 2. Register Core & AI Blocks (UI)
    // Note: Hardware Blocks (UI) are registered inside initializeBlockly() via blockly-init.js
    registerBasicBlocks();
    registerFaceLandmarkBlocks();
    registerHandGestureBlocks();
    registerImageClassificationBlocks();
    registerObjectDetectionBlocks();
    registerCustomModelBlocks();
    
    applyBlockStyles();

    // 3. Register Core & AI Generators (Logic)
    registerBasicGenerators(pythonGenerator);
    registerFaceLandmarkGenerators(pythonGenerator);
    registerHandGestureGenerators(pythonGenerator);
    registerImageClassificationGenerators(pythonGenerator);
    registerObjectDetectionGenerators(pythonGenerator);
    registerCustomModelGenerators(pythonGenerator);
    
    // 4. Determine Board
    const params = new URLSearchParams(window.location.search);
    const boardId = params.get('board') || 'esp32';

    // 5. Register Hardware Generators (Logic)
    // We pass the pythonGenerator and the boardId so generators know 
    // if they should output 10-bit (ESP) or 16-bit (Pico) code.
    registerNeoPixelGenerators(pythonGenerator);
    registerOledGenerators(pythonGenerator);
    registerWifiGenerators(pythonGenerator);
    registerSensorGenerators(pythonGenerator, boardId);
    registerActuatorGenerators(pythonGenerator, boardId);
     registerCommunicationGenerators(pythonGenerator);
     registerBluetoothGenerators(pythonGenerator);

    if (boardId === 'esp32') {
        registerEsp32Generators(pythonGenerator);
    } else {
        registerPicoGenerators(pythonGenerator);
    }
    
    // 6. Helper: Block ID Injection for Error Highlighting
    const originalBlockToCode = pythonGenerator.blockToCode;
    pythonGenerator.blockToCode = function(block, ...args) {
        if (block && block.id) {
            const code = originalBlockToCode.call(this, block, ...args);
            if (!Array.isArray(code) && typeof code === 'string' && code.includes('\n')) {
                 return `# block_id=${block.id}\n${code}`;
            }
            return code;
        }
        return originalBlockToCode.call(this, block, ...args);
    };
    
    // 7. Start Application
    const projectName = params.get('project');
    const sharedData = params.get('project_data');

    if (boardId && (projectName || sharedData)) {
        const initialName = projectName || 'Shared Project';
        
        // A. Initialize Workspace UI
        initializeBlockly(boardId, pythonGenerator);

        // B. Create IDE Logic AND Pass the Manager immediately
        const ide = await ESP32BlockIDE.create(
            boardId, 
            initialName, 
            pythonGenerator, 
            window.blockyManagerInstance 
        );

        window.ide = ide;

    window.addEventListener('app-settings-changed', (e) => {
        if (e.detail.key === 'theme' && window.ide) {
            window.ide.updateEditorTheme();
        }
    });
    
    // Also listen for cross-tab updates
    window.addEventListener('storage', (e) => {
        if (e.key === 'app_setting_theme' && window.ide) {
            window.ide.updateEditorTheme();
        }
    });
    
    // Force initial editor theme update after load
    setTimeout(() => window.ide.updateEditorTheme(), 500);

    } else {
        document.body.innerHTML = '<h1>Error: Project information or Board ID is missing.</h1><a href="index.html">Go back to projects</a>';
    }

    ////////////////////////////////////////////////////////////////

    let secretCode = ['a','u','t','h','o','r'];
    let secretPosition = 0;

    document.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === secretCode[secretPosition]) {
            secretPosition++;
            if (secretPosition === secretCode.length) {
                alert("Block IDE\n\nProperty of: Edusharks Learning and Research Pvt Ltd\nMade by: Guhan S");
                secretPosition = 0;
            }
        } else {
            secretPosition = 0;
        }
    });
}

document.addEventListener('DOMContentLoaded', main);