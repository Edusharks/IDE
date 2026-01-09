// src/ide/blockly/hand-gesture-generators.js (DEFINITIVE FIX)

export function registerHandGestureGenerators(generator) {
'use strict';

generator.forBlock['hand_gesture_enable'] = function(block) {
    generator.ensureAiDataProcessor();
    return '# UI: Hand tracking enabled/disabled in browser.\n';
};

generator.forBlock['hand_gesture_on_gesture'] = function(block) {
    generator.ensureAiDataProcessor();
    const gesture = block.getFieldValue('GESTURE');
    const statements_do = generator.statementToCode(block, 'DO') || generator.INDENT + 'pass\n';
    
    const functionName = generator.nameDB_.getDistinctName(`on_gesture_${gesture}`, 'PROCEDURE');
    const func = `def ${functionName}():
${generator.INDENT}if '${gesture}' in ai_data.get('gestures', []):
${generator.prefixLines(statements_do, generator.INDENT)}`;

    generator.functionNames_[functionName] = func;

    // This part remains the same
    if (!generator.aiEventHandlers) generator.aiEventHandlers = new Set();
    generator.aiEventHandlers.add(functionName);
    
    return ''; // This is a hat block.
};

generator.forBlock['hand_gesture_get_hand_count'] = function(block) {
    generator.ensureAiDataProcessor();
    return [`ai_data.get('hand_count', 0)`, generator.ORDER_FUNCTION_CALL];
};

generator.forBlock['hand_gesture_is_hand_present'] = function(block) {
    generator.ensureAiDataProcessor();
    const handedness = block.getFieldValue('HANDEDNESS');
    const hands_list = "ai_data.get('hands', [])";
    const code = (handedness === 'Any') ? `len(${hands_list}) > 0` : `'${handedness}' in ${hands_list}`;
    return [code, generator.ORDER_RELATIONAL];
};
}