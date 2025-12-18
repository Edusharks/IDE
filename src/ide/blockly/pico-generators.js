// src/ide/blockly/pico-generators.js

/**
 * Registers Pico-specific generators.
 * @param {any} generator - The Python generator instance.
 */
export function registerPicoGenerators(generator) {

    // Helper to ensure machine imports
    function ensureMachineImport() {
        generator.definitions_['import_machine'] = 'from machine import Pin, PWM, ADC';
    }

    // --- Digital Write ---
    generator.forBlock['gpio_digital_write'] = function(block) {
        ensureMachineImport();
        const pin = block.getFieldValue('PIN');
        const state = block.getFieldValue('STATE');
        
        const pinVar = `pin_${pin}`;
        generator.definitions_[pinVar] = `${pinVar} = Pin(${pin}, Pin.OUT)`;
        
        return `${pinVar}.value(${state})\n`;
    };

    // --- Digital Read ---
    generator.forBlock['gpio_digital_read'] = function(block) {
        ensureMachineImport();
        const pin = block.getFieldValue('PIN');
        
        const pinVar = `pin_${pin}_in`;
        // Pico input pins default to Pull Down usually, but Pull Up is safer for buttons
        generator.definitions_[pinVar] = `${pinVar} = Pin(${pin}, Pin.IN, Pin.PULL_UP)`;
        
        return [`${pinVar}.value()`, generator.ORDER_FUNCTION_CALL];
    };

    // --- Analog Read (ADC) ---
    generator.forBlock['gpio_analog_read'] = function(block) {
        ensureMachineImport();
        const pin = block.getFieldValue('PIN');
        const adcVar = `adc_${pin}`;
        
        if (!generator.definitions_[adcVar]) {
            generator.definitions_[adcVar] = `${adcVar} = ADC(Pin(${pin}))`;
        }
        
        // Pico uses .read_u16() which returns 0-65535
        return [`${adcVar}.read_u16()`, generator.ORDER_FUNCTION_CALL];
    };

    // --- PWM Write ---
    generator.forBlock['gpio_pwm_write'] = function(block) {
        ensureMachineImport();
        const pin = block.getFieldValue('PIN');
        const val = block.getFieldValue('VALUE'); // 0-255 from slider
        
        const pwmVar = `pwm_${pin}`;
        if (!generator.definitions_[pwmVar]) {
            generator.definitions_[pwmVar] = `${pwmVar} = PWM(Pin(${pin}))`;
            generator.definitions_[`${pwmVar}_freq`] = `${pwmVar}.freq(1000)`;
        }
        
        // Map 0-255 -> 0-65535
        // 65535 / 255 = 257
        return `${pwmVar}.duty_u16(int(${val} * 257))\n`;
    };


    // --- Interrupts (IRQ) ---
    generator.forBlock['gpio_on_pin_change'] = function(block) {
        ensureMachineImport();
        const pin = block.getFieldValue('PIN');
        const trigger = block.getFieldValue('TRIGGER'); // IRQ_RISING or IRQ_FALLING
        
        const statements = generator.statementToCode(block, 'DO') || 'pass\n';
        const handlerName = `handle_pin_${pin}_change`;
        
        // Create the handler function
        const funcCode = `
def ${handlerName}(p):
${statements}`;
        generator.definitions_[handlerName] = funcCode;

        // Setup the Pin and IRQ
        const pinVar = `pin_irq_${pin}`;
        generator.definitions_[pinVar] = `${pinVar} = Pin(${pin}, Pin.IN, Pin.PULL_UP)`;
        
        return `${pinVar}.irq(trigger=Pin.${trigger}, handler=${handlerName})\n`;
    };

    // --- Internal Temp (Pico Specific) ---
    generator.forBlock['sensor_internal_temp'] = function(block) {
        ensureMachineImport();
        const unit = block.getFieldValue('UNIT');
        
        // Pico Internal Temp is on ADC channel 4
        generator.definitions_['adc_temp'] = 'sensor_temp = ADC(4)';
        
        // Standard Pico conversion formula:
        // 27 - (voltage - 0.706) / 0.001721
        const conversion = `(27 - ((sensor_temp.read_u16() * 3.3 / 65535) - 0.706) / 0.001721)`;
        
        let code = conversion;
        if (unit === 'F') {
            code = `(${conversion} * 9/5 + 32)`;
        }
        
        return [code, generator.ORDER_FUNCTION_CALL];
    };
}