// src/ide/blockly/sensors_generators.js

export function registerSensorGenerators(generator, boardId) {

    const MAX_ADC = boardId === 'pico' ? 65535 : 4095;
    const READ_METHOD = boardId === 'pico' ? 'read_u16' : 'read';
    function getAdcSetup(pin) {
        const varName = `adc_${pin}`;
        generator.definitions_['import_machine'] = 'from machine import Pin, ADC';
        
        if (boardId === 'pico') {
            generator.definitions_[varName] = `${varName} = ADC(Pin(${pin}))`;
        } else {
            generator.definitions_[varName] = `${varName} = ADC(Pin(${pin}))`;
            generator.definitions_[`${varName}_att`] = `${varName}.atten(ADC.ATTN_11DB)`;
        }
        return varName;
    }

    // ================= BUTTON (UPDATED to PULL_DOWN) =================
    generator.forBlock['sensor_button_is_pressed'] = function(block) {
        const pin = block.getFieldValue('PIN');
        generator.definitions_['import_machine'] = 'from machine import Pin, PWM, ADC';
        generator.definitions_[`btn_${pin}`] = `btn_${pin} = Pin(${pin}, Pin.IN, Pin.PULL_DOWN)`;
        
        return [`int(btn_${pin}.value() == 1)`, generator.ORDER_FUNCTION_CALL];
    };

    generator.forBlock['sensor_button_wait'] = function(block) {
        const pin = block.getFieldValue('PIN');
        generator.definitions_['import_machine'] = 'from machine import Pin, PWM, ADC';
        generator.definitions_['import_time'] = 'import time';
        generator.definitions_[`btn_${pin}`] = `btn_${pin} = Pin(${pin}, Pin.IN, Pin.PULL_DOWN)`;
        
        return `while btn_${pin}.value() == 0: time.sleep_ms(10)\n`; // Wait while 0
    };

    // ================= SLIDE SWITCH (UPDATED to PULL_DOWN) =================
    generator.forBlock['sensor_switch_is_on'] = function(block) {
        const pin = block.getFieldValue('PIN');
        generator.definitions_['import_machine'] = 'from machine import Pin, PWM, ADC';
        generator.definitions_[`sw_${pin}`] = `sw_${pin} = Pin(${pin}, Pin.IN, Pin.PULL_DOWN)`;
        
        return [`int(sw_${pin}.value() == 1)`, generator.ORDER_FUNCTION_CALL];
    };

    // ================= POTENTIOMETER =================
    generator.forBlock['sensor_pot_read'] = function(block) {
        const pin = block.getFieldValue('PIN');
        const mode = block.getFieldValue('MODE');
        const adcVar = getAdcSetup(pin);
        
        if (mode === 'PERCENT') {
            return [`int((${adcVar}.${READ_METHOD}() / ${MAX_ADC}) * 100)`, generator.ORDER_FUNCTION_CALL];
        } else {
            return [`${adcVar}.${READ_METHOD}()`, generator.ORDER_FUNCTION_CALL];
        }
    };

    // ================= ULTRASONIC =================
    generator.forBlock['sensor_ultrasonic_read'] = function(block) {
        generator.definitions_['import_hcsr04'] = 'from hcsr04 import HCSR04';
        generator.definitions_['import_machine'] = 'from machine import Pin, PWM, ADC';
        
        const trig = block.getFieldValue('TRIG');
        const echo = block.getFieldValue('ECHO');
        const unit = block.getFieldValue('UNIT'); 
        
        const sensorVar = `us_${trig}_${echo}`;
        generator.definitions_[sensorVar] = `${sensorVar} = HCSR04(trigger_pin=Pin(${trig}), echo_pin=Pin(${echo}))`;
        
        const method = unit === 'cm' ? 'distance_cm' : 'distance_mm';
        
        const safeFunc = `read_safe_${sensorVar}`;
        if (!generator.functionNames_[safeFunc]) {
            generator.functionNames_[safeFunc] = `
def ${safeFunc}():
    try:
        return ${sensorVar}.${method}()
    except OSError:
        return -1`;
        }
        
        return [`${safeFunc}()`, generator.ORDER_FUNCTION_CALL];
    };

    // ================= IR SENSOR =================
    generator.forBlock['sensor_ir_read_digital'] = function(block) {
        const pin = block.getFieldValue('PIN');
        generator.definitions_['import_machine'] = 'from machine import Pin, PWM, ADC';
        const pinVar = `ir_raw_d_${pin}`;
        generator.definitions_[pinVar] = `${pinVar} = Pin(${pin}, Pin.IN)`;
        return [`${pinVar}.value()`, generator.ORDER_FUNCTION_CALL];
    };

    generator.forBlock['sensor_ir_read_analog'] = function(block) {
        const pin = block.getFieldValue('PIN');
        const adcVar = getAdcSetup(pin); 
        return [`${adcVar}.${READ_METHOD}()`, generator.ORDER_FUNCTION_CALL];
    };

    generator.forBlock['sensor_ir_is_obstacle'] = function(block) {
        const pin = block.getFieldValue('PIN');
        generator.definitions_['import_machine'] = 'from machine import Pin, PWM, ADC';
        generator.definitions_[`ir_${pin}`] = `ir_${pin} = Pin(${pin}, Pin.IN)`;
        return [`(ir_${pin}.value() == 0)`, generator.ORDER_RELATIONAL];
    };

    // ================= LDR (LIGHT) =================
    generator.forBlock['sensor_ldr_read_analog'] = function(block) {
        const pin = block.getFieldValue('PIN');
        const adcVar = getAdcSetup(pin);
        return [`${adcVar}.${READ_METHOD}()`, generator.ORDER_FUNCTION_CALL];
    };

    generator.forBlock['sensor_ldr_read_digital'] = function(block) {
        const pin = block.getFieldValue('PIN');
        generator.definitions_['import_machine'] = 'from machine import Pin, PWM, ADC';
        const pinVar = `ldr_dig_${pin}`;
        generator.definitions_[pinVar] = `${pinVar} = Pin(${pin}, Pin.IN)`;
        return [`${pinVar}.value()`, generator.ORDER_FUNCTION_CALL];
    };

    generator.forBlock['sensor_ldr_is_status'] = function(block) {
        const pin = block.getFieldValue('PIN');
        const status = block.getFieldValue('STATUS');
        const adcVar = getAdcSetup(pin);
        const calc = `(100 - (${adcVar}.${READ_METHOD}() / ${MAX_ADC} * 100))`;
        if (status === 'DARK') return [`(${calc} < 30)`, generator.ORDER_RELATIONAL];
        else return [`(${calc} > 70)`, generator.ORDER_RELATIONAL];
    };

    // ================= PIR (MOTION) =================
    generator.forBlock['sensor_pir_read_digital'] = function(block) {
        const pin = block.getFieldValue('PIN');
        generator.definitions_['import_machine'] = 'from machine import Pin, PWM, ADC';
        const pinVar = `pir_raw_${pin}`;
        generator.definitions_[pinVar] = `${pinVar} = Pin(${pin}, Pin.IN)`;
        return [`${pinVar}.value()`, generator.ORDER_FUNCTION_CALL];
    };
    generator.forBlock['sensor_pir_motion'] = function(block) {
        const pin = block.getFieldValue('PIN');
        generator.definitions_['import_machine'] = 'from machine import Pin, PWM, ADC';
        generator.definitions_[`pir_${pin}`] = `pir_${pin} = Pin(${pin}, Pin.IN)`;
        return [`(pir_${pin}.value() == 1)`, generator.ORDER_RELATIONAL];
    };

    // ================= SOIL MOISTURE =================
    generator.forBlock['sensor_soil_read_analog'] = function(block) {
        const pin = block.getFieldValue('PIN');
        const adcVar = getAdcSetup(pin);
        return [`${adcVar}.${READ_METHOD}()`, generator.ORDER_FUNCTION_CALL];
    };

    generator.forBlock['sensor_soil_read_digital'] = function(block) {
        const pin = block.getFieldValue('PIN');
        generator.definitions_['import_machine'] = 'from machine import Pin, PWM, ADC';
        const pinVar = `soil_dig_${pin}`;
        generator.definitions_[pinVar] = `${pinVar} = Pin(${pin}, Pin.IN)`;
        return [`${pinVar}.value()`, generator.ORDER_FUNCTION_CALL];
    };

    // ================= DHT11 =================
    generator.forBlock['sensor_dht11_read'] = function(block) {
        const pin = block.getFieldValue('PIN');
        const type = block.getFieldValue('TYPE');
        generator.definitions_['import_dht'] = 'import dht';
        generator.definitions_['import_machine'] = 'from machine import Pin, PWM, ADC';
        
        const sensorVar = `dht11_${pin}`;
        generator.definitions_[sensorVar] = `${sensorVar} = dht.DHT11(Pin(${pin}))`;
        
        const readerFunc = `get_dht_${type}_${pin}`;
        if (!generator.functionNames_[readerFunc]) {
            generator.functionNames_[readerFunc] = `
def ${readerFunc}():
    try:
        ${sensorVar}.measure()
        return ${sensorVar}.${type}()
    except:
        return 0`;
        }
        return [`${readerFunc}()`, generator.ORDER_FUNCTION_CALL];
    };
}