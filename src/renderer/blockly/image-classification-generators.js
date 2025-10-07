'use strict';

micropythonGenerator.forBlock['image_classification_enable'] = function(block) {
    ensureAiDataProcessor();
    return '# UI: Image classification enabled/disabled in browser.\n';
};

micropythonGenerator.forBlock['image_classification_is_class'] = function(block) {
    ensureAiDataProcessor();
    const objectClass = block.getFieldValue('CLASS');
    const code = `ai_data.get('classification', {}).get('category', '') == '${objectClass}'`;
    return [code, micropythonGenerator.ORDER_EQUALITY];
};

micropythonGenerator.forBlock['image_classification_get_class'] = function(block) {
    ensureAiDataProcessor();
    const code = `ai_data.get('classification', {}).get('category', '')`;
    return [code, micropythonGenerator.ORDER_FUNCTION_CALL];
};