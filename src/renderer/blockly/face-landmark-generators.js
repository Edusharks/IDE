// src/renderer/blockly/face-landmark-generators.js
'use strict';

micropythonGenerator.forBlock['face_landmark_enable'] = function(block) {
    ensureAiDataProcessor(); // Call the global function
    return '# UI: Face detection enabled/disabled in browser.\n';
};

micropythonGenerator.forBlock['face_landmark_on_face_data'] = function(block) {
    ensureAiDataProcessor();
    const statements_do = micropythonGenerator.statementToCode(block, 'DO') || micropythonGenerator.INDENT + 'pass';
    const functionName = micropythonGenerator.nameDB_.getDistinctName('on_face_event', 'PROCEDURE');
    
    // This function will be called by the main processor only when data is fresh
    const func = `def ${functionName}():\n    if ai_data.get('face_count', 0) > 0:\n${statements_do}`;
    micropythonGenerator.functionNames_[functionName] = func;
    
    // Register this function to be called by the main processor
    if (!micropythonGenerator.aiEventHandlers) micropythonGenerator.aiEventHandlers = new Set();
    micropythonGenerator.aiEventHandlers.add(functionName);

    return ''; // This is a hat block, it doesn't generate code in-line.
};

micropythonGenerator.forBlock['face_landmark_get_face_count'] = function(block) {
    ensureAiDataProcessor();
    return [`ai_data.get('face_count', 0)`, micropythonGenerator.ORDER_FUNCTION_CALL];
};

micropythonGenerator.forBlock['face_landmark_is_expression'] = function(block) {
    ensureAiDataProcessor();
    const expression = block.getFieldValue('EXPRESSION');
    const blendshapes = "ai_data.get('blendshapes', {})";
    let code = 'False';
    switch (expression) {
        case 'SMILING': code = `((${blendshapes}.get('mouthSmileLeft', 0.0) + ${blendshapes}.get('mouthSmileRight', 0.0)) / 2) > 0.5`; break;
        case 'JAW_OPEN': code = `${blendshapes}.get('jawOpen', 0.0) > 0.25`; break;
        case 'LEFT_EYE_CLOSED': code = `${blendshapes}.get('eyeBlinkLeft', 0.0) > 0.6`; break;
        case 'RIGHT_EYE_CLOSED': code = `${blendshapes}.get('eyeBlinkRight', 0.0) > 0.6`; break;
        case 'PUCKERING': code = `${blendshapes}.get('mouthPucker', 0.0) > 0.5`; break;
    }
    return [code, micropythonGenerator.ORDER_RELATIONAL];
};