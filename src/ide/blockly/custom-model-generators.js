// src/ide/blockly/custom-model-generators.js

export function registerCustomModelGenerators(generator) {
    'use strict';

    // Enable Block Generator
    // Note: Python code doesn't load the model (that happens in browser JS).
    // This generator ensures the Python environment listens for the data.
    generator.forBlock['custom_model_enable'] = function(block) {
        generator.ensureAiDataProcessor();
        return '# UI: Custom Model processing enabled in browser via Block settings.\n';
    };

    // Event Block Generator
    generator.forBlock['custom_model_when_class'] = function(block) {
        generator.ensureAiDataProcessor();
        
        const className = block.getFieldValue('CLASS_NAME');
        if (className === 'NONE') return '';

        const statements_do = generator.statementToCode(block, 'DO') || generator.INDENT + 'pass\n';
        
        const safeClassName = className.replace(/[^a-zA-Z0-9]/g, '_');
        const functionName = generator.nameDB_.getDistinctName(`on_custom_class_${safeClassName}`, 'PROCEDURE');

        // Logic: Check if the first prediction matches the selected class
        const func = `def ${functionName}():
${generator.INDENT}preds = ai_data.get('predictions', [])
${generator.INDENT}if len(preds) > 0 and preds[0].get('class') == '${className}':
${generator.prefixLines(statements_do, generator.INDENT)}`;

        generator.functionNames_[functionName] = func;
        
        if (!generator.aiEventHandlers) generator.aiEventHandlers = new Set();
        generator.aiEventHandlers.add(functionName);
        
        return ''; 
    };

    // Boolean Block Generator
    generator.forBlock['custom_model_is_class'] = function(block) {
        generator.ensureAiDataProcessor();
        const className = block.getFieldValue('CLASS_NAME');
        if (className === 'NONE') return ['False', generator.ORDER_ATOMIC];

        const code = `(len(ai_data.get('predictions', [])) > 0 and ai_data.get('predictions', [])[0].get('class') == '${className}')`;
        return [code, generator.ORDER_RELATIONAL];
    };
}