// src/renderer/blockly/face-landmark-generators.js
'use strict';

// --- HELPER FUNCTION ---
// This ensures the data processing function is defined once if any face block is used.
function ensureFaceLandmarkProcessor(block, statements_do) {
    micropythonGenerator.definitions_['import_sys'] = 'import sys';
    micropythonGenerator.definitions_['import_ujson'] = 'import ujson as json';
    micropythonGenerator.definitions_['import_uselect'] = 'import uselect';
    micropythonGenerator.definitions_['ai_data_poller'] = 'poller = uselect.poll()\npoller.register(sys.stdin, uselect.POLLIN)';
    
    if (!micropythonGenerator.definitions_['ai_data_dict']) {
        micropythonGenerator.definitions_['ai_data_dict'] = 'ai_data = {}';
    }

    const functionName = 'process_face_landmark_data';
    
    if (micropythonGenerator.functionNames_[functionName]) {
        return; 
    }

    // Indent the user's code block correctly.
    const indented_statements = statements_do.split('\n').map(line => line ? '    ' + line : '').join('\n');

    // REVISED AND CORRECTED: This structure is now 100% valid.
    // The user's code is now called *after* the try/except block, which is much cleaner.
    const func = `
def ${functionName}():
    global ai_data
    has_new_data = False
    if poller.poll(0):
        line = sys.stdin.readline().strip()
        if line:
            try:
                data = json.loads(line)
                if isinstance(data, dict):
                    ai_data = data
                    has_new_data = True
            except (ValueError, KeyError) as e:
                pass # Ignore corrupted data
    
    # If we got new data, run the user's code
    if has_new_data:
${indented_statements}
`;
    micropythonGenerator.functionNames_[functionName] = func;
}


micropythonGenerator.forBlock['face_landmark_enable'] = function(block) {
    return '# UI: Face detection enabled/disabled in browser.\n';
};

micropythonGenerator.forBlock['face_landmark_on_results'] = function(block) {
    // If the 'DO' statement is empty, provide a correctly indented 'pass'.
    const statements_do = micropythonGenerator.statementToCode(block, 'DO') || micropythonGenerator.INDENT + 'pass';
    ensureFaceLandmarkProcessor(block, statements_do);
    return ''; 
};

micropythonGenerator.forBlock['face_landmark_get_face_count'] = function(block) {
    ensureFaceLandmarkProcessor(block, micropythonGenerator.INDENT + 'pass');
    const code = `ai_data.get('face_count', 0)`;
    return [code, micropythonGenerator.ORDER_FUNCTION_CALL];
};

micropythonGenerator.forBlock['face_landmark_get_expression_value'] = function(block) {
    ensureFaceLandmarkProcessor(block, micropythonGenerator.INDENT + 'pass');
    const expression = block.getFieldValue('EXPRESSION');
    const code = `ai_data.get('blendshapes', {}).get('${expression}', 0.0)`;
    return [code, micropythonGenerator.ORDER_FUNCTION_CALL];
};

micropythonGenerator.forBlock['face_landmark_is_expression'] = function(block) {
    ensureFaceLandmarkProcessor(block, micropythonGenerator.INDENT + 'pass');
    const expression = block.getFieldValue('EXPRESSION');
    let code = 'False';
    const blendshapes = "ai_data.get('blendshapes', {})";
    switch (expression) {
        case 'SMILING':
            code = `((${blendshapes}.get('mouthSmileLeft', 0.0) + ${blendshapes}.get('mouthSmileRight', 0.0)) / 2) > 0.5`;
            break;
        case 'JAW_OPEN':
            code = `${blendshapes}.get('jawOpen', 0.0) > 0.25`;
            break;
        case 'LEFT_EYE_CLOSED':
            code = `${blendshapes}.get('eyeBlinkLeft', 0.0) > 0.6`;
            break;
        case 'RIGHT_EYE_CLOSED':
            code = `${blendshapes}.get('eyeBlinkRight', 0.0) > 0.6`;
            break;
        case 'PUCKERING':
            code = `${blendshapes}.get('mouthPucker', 0.0) > 0.5`;
            break;
    }
    return [code, micropythonGenerator.ORDER_RELATIONAL];
};