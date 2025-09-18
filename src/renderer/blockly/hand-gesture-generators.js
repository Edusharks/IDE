// src/renderer/blockly/hand-gesture-generators.js
'use strict';


function ensureHandGestureProcessor(block, statements_do) {
    if (!micropythonGenerator.functionNames_['process_face_landmark_data']) {
        micropythonGenerator.definitions_['import_sys'] = 'import sys';
        micropythonGenerator.definitions_['import_ujson'] = 'import ujson as json';
        micropythonGenerator.definitions_['import_uselect'] = 'import uselect';
        micropythonGenerator.definitions_['ai_data_poller'] = 'poller = uselect.poll()\npoller.register(sys.stdin, uselect.POLLIN)';
        if (!micropythonGenerator.definitions_['ai_data_dict']) micropythonGenerator.definitions_['ai_data_dict'] = 'ai_data = {}';
        if (!micropythonGenerator.definitions_['ai_data_buffer']) micropythonGenerator.definitions_['ai_data_buffer'] = '_ai_data_buffer = ""';
        
        const func = `
def process_face_landmark_data():
    global ai_data, _ai_data_buffer
    # ... [The full robust parser code would go here, but for simplicity, we assume
    # the face landmark generator will create it if needed. This is just a stub.]
    pass 
`;
        micropythonGenerator.functionNames_['process_face_landmark_data'] = func;
    }
}

micropythonGenerator.forBlock['hand_gesture_enable'] = function(block) {
    return '# UI: Hand tracking enabled/disabled in browser.\n';
};

micropythonGenerator.forBlock['hand_gesture_on_gesture'] = function(block) {
    const gesture = block.getFieldValue('GESTURE');
    const statements_do = micropythonGenerator.statementToCode(block, 'DO') || micropythonGenerator.INDENT + 'pass';

    // The logic is now inside the main AI data processor.
    // We create a new specific function for this event.
    const functionName = micropythonGenerator.nameDB_.getDistinctName(
        `on_gesture_${gesture}`, 'PROCEDURE'
    );
    
    // This code checks if the gesture name exists in the list of gestures from the AI data.
    const func = `def ${functionName}():\n    if '${gesture}' in ai_data.get('gestures', []):\n${statements_do}`;
    micropythonGenerator.functionNames_[functionName] = func;

    // We must ensure the main processor is defined and this new function is called from it.
    const mainProcessorName = 'process_face_landmark_data';
    if (micropythonGenerator.functionNames_[mainProcessorName]) {
        // Append the call to our new function into the main processor's body
        micropythonGenerator.functionNames_[mainProcessorName] = 
            micropythonGenerator.functionNames_[mainProcessorName].replace(
                /\n(    # If we got new data, run the user's code)/,
                `\n    ${functionName}()\n$1`
            );
    }
    
    return ''; // This is a hat block, it doesn't generate code directly.
};

micropythonGenerator.forBlock['hand_gesture_get_hand_count'] = function(block) {
    ensureHandGestureProcessor(block, '');
    const code = `ai_data.get('hand_count', 0)`;
    return [code, micropythonGenerator.ORDER_FUNCTION_CALL];
};

micropythonGenerator.forBlock['hand_gesture_is_hand_present'] = function(block) {
    ensureHandGestureProcessor(block, '');
    const handedness = block.getFieldValue('HANDEDNESS');
    let code = 'False';
    const hands_list = "ai_data.get('hands', [])";

    if (handedness === 'Any') {
        code = `len(${hands_list}) > 0`;
    } else {
        code = `'${handedness}' in ${hands_list}`;
    }
    
    return [code, micropythonGenerator.ORDER_RELATIONAL];
};

