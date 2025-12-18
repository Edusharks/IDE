// src/ide/blockly/communication_generators.js

export function registerCommunicationGenerators(generator) {
    
    // --- CONSOLE OUTPUT ---
    generator.forBlock['comm_print_line'] = function(block) {
        // Legacy support for old block name 'usb_serial_println' if it exists in saved files
        const data = generator.valueToCode(block, 'DATA', 0) || '""';
        return `print(str(${data}))\n`;
    };
    // Map legacy ID
    generator.forBlock['usb_serial_println'] = generator.forBlock['comm_print_line'];

    generator.forBlock['comm_print_no_newline'] = function(block) {
        const data = generator.valueToCode(block, 'DATA', 0) || '""';
        return `print(str(${data}), end="")\n`;
    };

    generator.forBlock['comm_print_value'] = function(block) {
        const name = generator.valueToCode(block, 'NAME', 0) || '""';
        const value = generator.valueToCode(block, 'VALUE', 0) || '""';
        return `print(str(${name}) + " = " + str(${value}))\n`;
    };
    generator.forBlock['usb_serial_print_value'] = generator.forBlock['comm_print_value'];

    // --- CONSOLE INPUT ---
    generator.forBlock['comm_read_line'] = function(block) {
        return ['input()', generator.ORDER_FUNCTION_CALL];
    };
    generator.forBlock['usb_serial_read_line'] = generator.forBlock['comm_read_line'];

    // --- PLOTTER ---
    generator.forBlock['comm_plot_simple'] = function(block) {
        const value = generator.valueToCode(block, 'VALUE', generator.ORDER_ATOMIC) || '0';
        // Default color (Blue-ish) and name ("Value")
        return `print("plot:Value:#3b82f6:" + str(${value}))\n`;
    };

    generator.forBlock['comm_plot_advanced'] = function(block) {
        const value = generator.valueToCode(block, 'VALUE', generator.ORDER_ATOMIC) || '0';
        const name = generator.valueToCode(block, 'NAME', generator.ORDER_ATOMIC) || '"Data"';
        const color = block.getFieldValue('COLOR');
        return `print("plot:" + str(${name}) + ":${color}:" + str(${value}))\n`;
    };
    generator.forBlock['usb_serial_plot_value'] = generator.forBlock['comm_plot_advanced'];

    // --- AI ---
    generator.forBlock['comm_send_ai_command'] = function(block) {
        const command = block.getFieldValue('COMMAND');
        const param = generator.valueToCode(block, 'PARAM', generator.ORDER_ATOMIC) || '""';
        return `print(f"AI_CMD:{'${command}'}:{str(${param})}")\n`;
    };
}