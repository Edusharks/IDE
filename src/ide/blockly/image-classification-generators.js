// src/ide/blockly/image-classification-generators.js (REWORKED)

export function registerImageClassificationGenerators(generator) {

'use strict';

generator.forBlock['image_classification_enable'] = function(block) {
    generator.ensureAiDataProcessor();
    return '# UI: Image classification enabled/disabled in browser.\n';
};

// NEW: Generator for the event-driven hat block
generator.forBlock['image_classification_on_class'] = function(block) {
    generator.ensureAiDataProcessor();
    
    const objectClass = block.getFieldValue('CLASS');
    const statements_do = generator.statementToCode(block, 'DO') || generator.INDENT + 'pass\n';
    
    // Create a unique function name for the event handler
    const functionName = generator.nameDB_.getDistinctName(`on_class_${objectClass}`, 'PROCEDURE');
    
    // Define the function with the condition to check the received AI data
    const func = `def ${functionName}():
${generator.INDENT}if ai_data.get('classification', {}).get('category', '') == '${objectClass}':
${generator.prefixLines(statements_do, generator.INDENT)}`;

    generator.functionNames_[functionName] = func;

    // Register this function as an AI event handler
    if (!generator.aiEventHandlers) generator.aiEventHandlers = new Set();
    generator.aiEventHandlers.add(functionName);
    
    return ''; // This is a hat block.
};

generator.forBlock['image_classification_is_class'] = function(block) {
    generator.ensureAiDataProcessor();
    const objectClass = block.getFieldValue('CLASS');
    const code = `ai_data.get('classification', {}).get('category', '') == '${objectClass}'`;
    return [code, generator.ORDER_EQUALITY];
};

generator.forBlock['image_classification_get_class'] = function(block) {
    generator.ensureAiDataProcessor();
    const code = `ai_data.get('classification', {}).get('category', '')`;
    return [code, generator.ORDER_FUNCTION_CALL];
};

}