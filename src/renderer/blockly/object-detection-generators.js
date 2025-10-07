// src/renderer/blockly/object-detection-generators.js
'use strict';

micropythonGenerator.forBlock['object_detection_enable'] = function(block) {
    ensureAiDataProcessor();
    return '# UI: Object detection enabled/disabled in browser.\n';
};

micropythonGenerator.forBlock['object_detection_is_object_detected'] = function(block) {
    ensureAiDataProcessor();
    const objectClass = block.getFieldValue('OBJECT_CLASS');
    const code = `any(obj.get('label') == '${objectClass}' for obj in ai_data.get('objects', []))`;
    return [code, micropythonGenerator.ORDER_FUNCTION_CALL];
};

micropythonGenerator.forBlock['object_detection_for_each'] = function(block) {
    ensureAiDataProcessor();
    const objectClass = block.getFieldValue('OBJECT_CLASS');
    const statements_do = micropythonGenerator.statementToCode(block, 'DO') || micropythonGenerator.INDENT + 'pass';
    const loopVar = micropythonGenerator.nameDB_.getDistinctName('detected_object', 'VARIABLE');
    block.loopVar = loopVar;
    return `for ${loopVar} in [obj for obj in ai_data.get('objects', []) if obj.get('label') == '${objectClass}']:\n${statements_do}\n`;
};

micropythonGenerator.forBlock['object_detection_get_property'] = function(block) {
    ensureAiDataProcessor();
    const property = block.getFieldValue('PROPERTY');
    let loopVar = 'detected_object';
    let parentBlock = block.getSurroundParent();
    if (parentBlock && parentBlock.type === 'object_detection_for_each') {
        loopVar = parentBlock.loopVar || 'detected_object';
    }
    return [`${loopVar}.get('${property}', 0)`, micropythonGenerator.ORDER_MEMBER];
};