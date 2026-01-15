// src/ide/blockly/object-detection-generators.js (REWORKED)

export function registerObjectDetectionGenerators(generator) {

'use strict';

generator.forBlock['object_detection_enable'] = function(block) {
    generator.ensureAiDataProcessor();
    return '# UI: Object detection enabled/disabled in browser.\n';
};

// NEW: Generator for the event-driven hat block
generator.forBlock['object_detection_on_object'] = function(block) {
    generator.ensureAiDataProcessor();
    
    const objectClass = block.getFieldValue('OBJECT_CLASS');
    const statements_do = generator.statementToCode(block, 'DO') || generator.INDENT + 'pass\n';
    
    // The loop variable that will be used inside the event handler
    const loopVar = generator.nameDB_.getDistinctName('detected_object', 'VARIABLE');
    
    // Store the variable on the block itself so the 'get_property' block can find it
    block.loopVar = loopVar; 
    
    const functionName = generator.nameDB_.getDistinctName(`on_object_${objectClass}`, 'PROCEDURE');
    
    // The generated function now contains the for loop automatically!
    const func = `def ${functionName}():
${generator.INDENT}# This event triggers a loop for every detected '${objectClass}'
${generator.INDENT}for ${loopVar} in [obj for obj in ai_data.get('objects', []) if obj.get('label') == '${objectClass}']:
${generator.prefixLines(statements_do, generator.INDENT)}`;

    generator.functionNames_[functionName] = func;

    if (!generator.aiEventHandlers) generator.aiEventHandlers = new Set();
    generator.aiEventHandlers.add(functionName);
    
    return ''; // This is a hat block.
};

generator.forBlock['object_detection_is_object_detected'] = function(block) {
    generator.ensureAiDataProcessor();
    const objectClass = block.getFieldValue('OBJECT_CLASS');
    const code = `any(obj.get('label') == '${objectClass}' for obj in ai_data.get('objects', []))`;
    return [code, generator.ORDER_FUNCTION_CALL];
};

generator.forBlock['object_detection_for_each'] = function(block) {
    generator.ensureAiDataProcessor();
    const objectClass = block.getFieldValue('OBJECT_CLASS');
    const statements_do = generator.statementToCode(block, 'DO') || generator.INDENT + 'pass';
    const loopVar = generator.nameDB_.getDistinctName('detected_object', 'VARIABLE');
    block.loopVar = loopVar;
    
    return `for ${loopVar} in [obj for obj in ai_data.get('objects', []) if obj.get('label') == '${objectClass}']:\n${statements_do}\n`;
};

generator.forBlock['object_detection_get_property'] = function(block) {
    generator.ensureAiDataProcessor();
    const property = block.getFieldValue('PROPERTY');
    let loopVar = 'detected_object'; 
    let parentBlock = block.getSurroundParent();
    if (parentBlock && (parentBlock.type === 'object_detection_for_each' || parentBlock.type === 'object_detection_on_object')) {
        loopVar = parentBlock.loopVar || 'detected_object';
    }

    return [`${loopVar}.get('${property}', 0)`, generator.ORDER_MEMBER];
};

}