// src/renderer/blockly/basic-generators.js
const micropythonGenerator = Blockly.Python;

// --- CORE INITIALIZATION AND ORCHESTRATION ---
micropythonGenerator.init = function(workspace) {
    Object.getPrototypeOf(this).init.call(this, workspace);
    this.definitions_ = Object.create(null);
    this.functionNames_ = Object.create(null);
    // Add default imports required by basic blocks
    this.definitions_['import_time'] = 'import time';
};

micropythonGenerator.finish = function(code) {
    return code;
};

micropythonGenerator.workspaceToCode = function(workspace) {
    // Reset state for each code generation
    this.definitions_ = Object.create(null);
    this.functionNames_ = Object.create(null);
    this.definitions_['import_time'] = 'import time';

    let onStartCode = '', foreverCode = '', everyXmsCode = '';
    const topBlocks = workspace.getTopBlocks(true);

    // This first pass populates definitions and function names by calling blockToCode
    for (const block of topBlocks) {
        if (block.type === 'on_start') {
            onStartCode += this.blockToCode(block);
        } else if (block.type === 'forever') {
            foreverCode += this.blockToCode(block);
        } else if (block.type === 'every_x_ms') {
            everyXmsCode += this.blockToCode(block);
        } else {
            // Process any detached blocks (like a lone "get face count" block)
            // to ensure their dependencies are registered.
            this.blockToCode(block);
        }
    }

    // Assemble definitions and functions
    let definitions = Object.values(this.definitions_);
    definitions = definitions.filter((def, i) => definitions.indexOf(def) === i);
    const functions = Object.values(this.functionNames_);
    const preamble = definitions.join('\n') + '\n\n' + functions.join('\n\n');
    const startupDelay = "print('--- Starting Program ---')\ntime.sleep(2)\n";

    // Assemble the 'on_start' section
    let finalCode = preamble + '\n\n' + startupDelay + '# Code that runs once at the start\n' + (onStartCode.trim() || 'pass');
    
    // Assemble the main loop section
    finalCode += '\n\n# Main loop that runs forever\n';
    let mainLoopCode = foreverCode || everyXmsCode;

    // --- FIX: Automatically create a main loop if AI blocks require it ---
    if (!mainLoopCode && this.functionNames_['process_face_landmark_data']) {
        mainLoopCode = 'while True:\n' + this.INDENT + 'process_face_landmark_data()\n' + this.INDENT + 'time.sleep_ms(20)\n';
    } else if (!mainLoopCode) {
        mainLoopCode = 'while True:\n    pass';
    }

    finalCode += mainLoopCode;

    return finalCode.trim();
};


// --- CONTROL BLOCK GENERATORS ---

micropythonGenerator.forBlock['on_start'] = function(block) {
    let code = '';
    let branch = block.getInputTargetBlock('DO');
    while (branch) {
        code += micropythonGenerator.blockToCode(branch);
        branch = branch.getNextBlock();
    }
    return code;
};

micropythonGenerator.forBlock['forever'] = function(block) {
    const statements_do = micropythonGenerator.statementToCode(block, 'DO') || micropythonGenerator.INDENT + 'pass';
    const aiProcessorCall = micropythonGenerator.functionNames_['process_face_landmark_data'] 
        ? micropythonGenerator.INDENT + 'process_face_landmark_data()\n' 
        : '';
    return 'while True:\n' + aiProcessorCall + statements_do + '\n';
};

micropythonGenerator.forBlock['every_x_ms'] = function(block) {
    const time = block.getFieldValue('TIME') || '500';
    const statements_do = micropythonGenerator.statementToCode(block, 'DO') || micropythonGenerator.INDENT + 'pass';
    const aiProcessorCall = micropythonGenerator.functionNames_['process_face_landmark_data'] 
        ? micropythonGenerator.INDENT + 'process_face_landmark_data()\n' 
        : '';
    return 'while True:\n' + aiProcessorCall + statements_do + '\n' + micropythonGenerator.INDENT + `time.sleep_ms(int(${time}))\n`;
};

micropythonGenerator.forBlock['control_delay'] = function(block) {
    const time = micropythonGenerator.valueToCode(block, 'TIME', micropythonGenerator.ORDER_ATOMIC) || '0';
    return `time.sleep_ms(int(${time}))\n`;
};

micropythonGenerator.forBlock['control_delay_seconds'] = function(block) {
    const delay = micropythonGenerator.valueToCode(block, 'DELAY_SEC', micropythonGenerator.ORDER_ATOMIC) || '1';
    return `time.sleep(float(${delay}))\n`;
};

// --- MATH & CONVERSION GENERATORS ---
micropythonGenerator.forBlock['math_map'] = function(block) {
    const value = micropythonGenerator.valueToCode(block, 'VALUE', micropythonGenerator.ORDER_NONE) || '0';
    const fromLow = micropythonGenerator.valueToCode(block, 'FROM_LOW', micropythonGenerator.ORDER_NONE) || '0';
    const fromHigh = micropythonGenerator.valueToCode(block, 'FROM_HIGH', micropythonGenerator.ORDER_NONE) || '0';
    const toLow = micropythonGenerator.valueToCode(block, 'TO_LOW', micropythonGenerator.ORDER_NONE) || '0';
    const toHigh = micropythonGenerator.valueToCode(block, 'TO_HIGH', micropythonGenerator.ORDER_NONE) || '0';
    const functionName = 'math_map_func';
    if (!micropythonGenerator.functionNames_[functionName]) {
        const func = `
def ${functionName}(x, in_min, in_max, out_min, out_max):
    return (x - in_min) * (out_max - out_min) // (in_max - in_min) + out_min`;
        micropythonGenerator.functionNames_[functionName] = func;
    }
    return [`${functionName}(${value}, ${fromLow}, ${fromHigh}, ${toLow}, ${toHigh})`, micropythonGenerator.ORDER_FUNCTION_CALL];
};

micropythonGenerator.forBlock['text_parse_to_number'] = function(block) {
    const text = micropythonGenerator.valueToCode(block, 'TEXT', micropythonGenerator.ORDER_ATOMIC) || '0';
    return [`int(${text})`, micropythonGenerator.ORDER_FUNCTION_CALL];
};

micropythonGenerator.forBlock['text_convert_to_text'] = function(block) {
    const value = micropythonGenerator.valueToCode(block, 'VALUE', micropythonGenerator.ORDER_ATOMIC) || '""';
    return [`str(${value})`, micropythonGenerator.ORDER_FUNCTION_CALL];
};

micropythonGenerator.forBlock['text_from_char_code'] = function(block) {
    const code = micropythonGenerator.valueToCode(block, 'CODE', micropythonGenerator.ORDER_ATOMIC) || '0';
    return [`chr(int(${code}))`, micropythonGenerator.ORDER_FUNCTION_CALL];
};

micropythonGenerator.forBlock['text_char_code_at'] = function(block) {
    const text = micropythonGenerator.valueToCode(block, 'TEXT', micropythonGenerator.ORDER_MEMBER) || "''";
    const at = micropythonGenerator.valueToCode(block, 'AT', micropythonGenerator.ORDER_NONE) || '0';
    return [`ord(${text}[int(${at})])`, micropythonGenerator.ORDER_FUNCTION_CALL];
};

// --- LIST GENERATORS ---
micropythonGenerator.forBlock['lists_get_random_item'] = function(block) {
    micropythonGenerator.definitions_['import_random'] = 'import random';
    const list = micropythonGenerator.valueToCode(block, 'LIST', micropythonGenerator.ORDER_NONE) || '[]';
    return [`random.choice(${list})`, micropythonGenerator.ORDER_FUNCTION_CALL];
};