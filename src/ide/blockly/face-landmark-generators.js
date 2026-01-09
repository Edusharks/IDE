// src/ide/blockly/face-landmark-generators.js (REWORKED & ENHANCED)

export function registerFaceLandmarkGenerators(generator) {
'use strict';

generator.forBlock['face_landmark_enable'] = function(block) {
    generator.ensureAiDataProcessor();
    return '# UI: Face detection enabled/disabled in browser.\n';
};

function getExpressionCondition(expression, threshold = '0.5') {
    const blendshapes = "ai_data.get('blendshapes', {})";
    switch (expression) {
        case 'SMILING': return `((${blendshapes}.get('mouthSmileLeft', 0.0) + ${blendshapes}.get('mouthSmileRight', 0.0)) / 2) > ${threshold}`;
        case 'JAW_OPEN': return `${blendshapes}.get('jawOpen', 0.0) > (${threshold} * 0.8)`; // Jaw open is more sensitive, scale threshold
        case 'LEFT_EYE_CLOSED': return `${blendshapes}.get('eyeBlinkLeft', 0.0) > ${threshold}`;
        case 'RIGHT_EYE_CLOSED': return `${blendshapes}.get('eyeBlinkRight', 0.0) > ${threshold}`;
        case 'PUCKERING': return `${blendshapes}.get('mouthPucker', 0.0) > ${threshold}`;
        case 'FROWNING': return `((${blendshapes}.get('mouthPressLeft', 0.0) + ${blendshapes}.get('mouthPressRight', 0.0)) / 2) > ${threshold}`;
        case 'SQUINTING': return `((${blendshapes}.get('eyeSquintLeft', 0.0) + ${blendshapes}.get('eyeSquintRight', 0.0)) / 2) > ${threshold}`;
        case 'MOUTH_O': return `${blendshapes}.get('mouthFunnel', 0.0) > ${threshold}`;
        default: return 'False';
    }
}

generator.forBlock['face_landmark_on_face_data'] = function(block) {
    generator.ensureAiDataProcessor();
    
    const expression = block.getFieldValue('EXPRESSION');
    const statements_do = generator.statementToCode(block, 'DO') || generator.INDENT + 'pass\n';
    const functionName = generator.nameDB_.getDistinctName(`on_face_${expression.toLowerCase()}`, 'PROCEDURE');
    
    let condition;
    if (expression === 'ANY_FACE') {
        condition = `ai_data.get('face_count', 0) > 0`;
    } else {
        // Use a default sensitivity of 0.5 for the event block
        condition = `ai_data.get('face_count', 0) > 0 and ${getExpressionCondition(expression, '0.5')}`;
    }

    const func = `def ${functionName}():
${generator.INDENT}if ${condition}:
${generator.prefixLines(statements_do, generator.INDENT)}`;

    generator.functionNames_[functionName] = func;
    
    if (!generator.aiEventHandlers) generator.aiEventHandlers = new Set();
    generator.aiEventHandlers.add(functionName);

    return ''; // This is a hat block.
};

generator.forBlock['face_landmark_get_face_count'] = function(block) {
    generator.ensureAiDataProcessor();
    return [`ai_data.get('face_count', 0)`, generator.ORDER_FUNCTION_CALL];
};

generator.forBlock['face_landmark_is_expression'] = function(block) {
    generator.ensureAiDataProcessor();
    const expression = block.getFieldValue('EXPRESSION');
    const threshold = generator.valueToCode(block, 'THRESHOLD', generator.ORDER_ATOMIC) || '50';
    
    // Convert percentage (0-100) to a float (0.0-1.0) for the condition
    const thresholdFloat = `(max(0, min(100, ${threshold})) / 100.0)`;
    
    const conditionCode = getExpressionCondition(expression, thresholdFloat);
    
    const final_code = `(ai_data.get('face_count', 0) > 0 and ${conditionCode})`;
    return [final_code, generator.ORDER_LOGICAL_AND];
};

generator.forBlock['face_landmark_get_blendshape_value'] = function(block) {
    generator.ensureAiDataProcessor();
    const blendshape = block.getFieldValue('BLENDSHAPE');
    const code = `ai_data.get('blendshapes', {}).get('${blendshape}', 0.0)`;
    return [code, generator.ORDER_FUNCTION_CALL];
};

}