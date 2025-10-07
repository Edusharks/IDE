// src/renderer/blockly/hand-gesture-generators.js
'use strict';

micropythonGenerator.forBlock['hand_gesture_enable'] = function(block) {
    ensureAiDataProcessor();
    return '# UI: Hand tracking enabled/disabled in browser.\n';
};

micropythonGenerator.forBlock['hand_gesture_on_gesture'] = function(block) {
    ensureAiDataProcessor();
    const gesture = block.getFieldValue('GESTURE');
    const statements_do = micropythonGenerator.statementToCode(block, 'DO') || micropythonGenerator.INDENT + 'pass';
    const functionName = micropythonGenerator.nameDB_.getDistinctName(`on_gesture_${gesture}`, 'PROCEDURE');
    
    const func = `def ${functionName}():\n    if '${gesture}' in ai_data.get('gestures', []):\n${statements_do}`;
    micropythonGenerator.functionNames_[functionName] = func;

    if (!micropythonGenerator.aiEventHandlers) micropythonGenerator.aiEventHandlers = new Set();
    micropythonGenerator.aiEventHandlers.add(functionName);
    
    return ''; // Hat block
};

micropythonGenerator.forBlock['hand_gesture_get_hand_count'] = function(block) {
    ensureAiDataProcessor();
    return [`ai_data.get('hand_count', 0)`, micropythonGenerator.ORDER_FUNCTION_CALL];
};

micropythonGenerator.forBlock['hand_gesture_is_hand_present'] = function(block) {
    ensureAiDataProcessor();
    const handedness = block.getFieldValue('HANDEDNESS');
    const hands_list = "ai_data.get('hands', [])";
    const code = (handedness === 'Any') ? `len(${hands_list}) > 0` : `'${handedness}' in ${hands_list}`;
    return [code, micropythonGenerator.ORDER_RELATIONAL];
};