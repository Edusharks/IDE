// src/ide/blockly/esp32-generators.js

export function registerEsp32Generators(generator) {

    // Helper to ensure machine imports
    function ensureMachineImport() {
        generator.definitions_['import_machine'] = 'from machine import Pin, PWM, ADC';
    }

    // --- Helper Generator for the Slider Shadow Block ---
    generator.forBlock['math_number_slider'] = function(block) {
        const code = block.getFieldValue('NUM');
        return [code, generator.ORDER_ATOMIC];
    };

    // --- Digital Write ---
    generator.forBlock['gpio_digital_write'] = function(block) {
        ensureMachineImport();
        const pin = block.getFieldValue('PIN');
        const state = block.getFieldValue('STATE');
        
        const pinVar = `pin_${pin}`;
        // Define pin only once
        generator.definitions_[pinVar] = `${pinVar} = Pin(${pin}, Pin.OUT)`;
        
        return `${pinVar}.value(${state})\n`;
    };

    // --- Digital Read ---
    generator.forBlock['gpio_digital_read'] = function(block) {
        ensureMachineImport();
        const pin = block.getFieldValue('PIN');
        
        const pinVar = `pin_${pin}_in`;
        // Input pins usually need a Pull-Up for buttons/sensors
        generator.definitions_[pinVar] = `${pinVar} = Pin(${pin}, Pin.IN, Pin.PULL_UP)`;
        
        return [`${pinVar}.value()`, generator.ORDER_FUNCTION_CALL];
    };

    // --- Analog Read (ADC) ---
    generator.forBlock['gpio_analog_read'] = function(block) {
        ensureMachineImport();
        const pin = block.getFieldValue('PIN');
        const adcVar = `adc_${pin}`;
        
        if (!generator.definitions_[adcVar]) {
            // ESP32 Specific: Set attenuation to 11dB for full 0-3.3V range
            generator.definitions_[adcVar] = `${adcVar} = ADC(Pin(${pin}))`;
            generator.definitions_[`${adcVar}_atten`] = `${adcVar}.atten(ADC.ATTN_11DB)`;
        }
        
        // ESP32 uses .read() which returns 0-4095
        return [`${adcVar}.read()`, generator.ORDER_FUNCTION_CALL];
    };

    // --- Analog Write (PWM) - UPDATED ---
     generator.forBlock['gpio_pwm_write'] = function(block) {
        ensureMachineImport();
        const pin = block.getFieldValue('PIN');
        
        // UPDATED: Use valueToCode to accept numbers from Slider OR connected Blocks (Map, Variables)
        const val = generator.valueToCode(block, 'VALUE', generator.ORDER_ATOMIC) || '0';
        
        const pwmVar = `pwm_${pin}`;
        if (!generator.definitions_[pwmVar]) {
            // Standard PWM setup
            generator.definitions_[pwmVar] = `${pwmVar} = PWM(Pin(${pin}), freq=1000)`;
        }
        
        // Map 0-255 input to ESP32's 0-1023 resolution
        // Logic: val * 4 (approx)
        return `${pwmVar}.duty(int(${val} * 1023 / 255))\n`;
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
        
        // This code runs once at startup to attach the interrupt
        return `${pinVar}.irq(trigger=Pin.${trigger}, handler=${handlerName})\n`;
    };

    // --- Internal Temp (ESP32 Specific) ---
    generator.forBlock['sensor_internal_temp'] = function(block) {
        generator.definitions_['import_esp32'] = 'import esp32';
        const unit = block.getFieldValue('UNIT');
        
        // esp32.raw_temperature() returns Fahrenheit on most firmware
        let code = `esp32.raw_temperature()`;
        
        if (unit === 'C') {
            code = `((${code} - 32) / 1.8)`; // Conversion logic
        }
        
        return [code, generator.ORDER_FUNCTION_CALL];
    };
}