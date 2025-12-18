// src/ide/blockly/actuators_generators.js

export function registerActuatorGenerators(generator, boardId) {

    // --- JS Helper to parse Hex color (used locally in this file) ---
    function parseHex(hex) {
        hex = hex.replace(/^#/, '');
        if (hex.length === 3) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return { r, g, b };
    }

    // --- General Helpers ---
    function getPwmInit(pinVar, pinNum, freq = 1000) {
        return `${pinVar} = PWM(Pin(${pinNum}), freq=${freq})`;
    }

    function getDutyCycleCode(pinVar, value, maxInput) {
        if (boardId === 'pico') {
            return `${pinVar}.duty_u16(int(${value} / ${maxInput} * 65535))`;
        } else {
            return `${pinVar}.duty(int(${value} / ${maxInput} * 1023))`;
        }
    }

function getBuzzerCode(pin, freq, dur) {
        const varName = `buzzer_${pin}`;
        const dutyOn = boardId === 'pico' ? '32768' : '512';
        const dutyMethod = boardId === 'pico' ? 'duty_u16' : 'duty';

        return `
${varName} = PWM(Pin(${pin}))
${varName}.freq(int(${freq}))
${varName}.${dutyMethod}(${dutyOn})
time.sleep_ms(int(${dur}))
${varName}.${dutyMethod}(0)
${varName}.deinit() 
`;
    }

    // ================= LED MODULE =================

    generator.forBlock['actuator_builtin_led'] = function(block) {
        generator.definitions_['import_machine'] = 'from machine import Pin';
        const state = block.getFieldValue('STATE');
        
        const pin = (boardId === 'pico') ? '"LED"' : 2;
        
        const varName = 'builtin_led';
        
        if (!generator.definitions_[varName]) {
            generator.definitions_[varName] = `${varName} = Pin(${pin}, Pin.OUT)`;
        }
        
        return `${varName}.value(${state})\n`;
    };
    
    generator.forBlock['actuator_led_set'] = function(block) {
        generator.definitions_['import_machine'] = 'from machine import Pin';
        const pin = block.getFieldValue('PIN');
        const state = block.getFieldValue('STATE');
        const varName = `led_${pin}`;
        generator.definitions_[varName] = `${varName} = Pin(${pin}, Pin.OUT)`;
        return `${varName}.value(${state})\n`;
    };

    generator.forBlock['actuator_led_toggle'] = function(block) {
        generator.definitions_['import_machine'] = 'from machine import Pin';
        const pin = block.getFieldValue('PIN');
        const varName = `led_${pin}`;
        generator.definitions_[varName] = `${varName} = Pin(${pin}, Pin.OUT)`;
        return `${varName}.value(not ${varName}.value())\n`;
    };

    generator.forBlock['actuator_led_brightness'] = function(block) {
        generator.definitions_['import_machine'] = 'from machine import Pin, PWM';
        const pin = block.getFieldValue('PIN');
        const brightness = block.getFieldValue('BRIGHTNESS'); // Slider Field
        const varName = `pwm_led_${pin}`;
        
        if (!generator.definitions_[varName]) {
            generator.definitions_[varName] = getPwmInit(varName, pin, 1000);
        }
        
        return getDutyCycleCode(varName, brightness, 100) + '\n';
    };

    // ================= RGB LED MODULE =================


    generator.forBlock['actuator_rgb_set'] = function(block) {
        generator.definitions_['import_machine'] = 'from machine import Pin, PWM';
        
        const colorHex = block.getFieldValue('COLOR');
        const pR = block.getFieldValue('PIN_R');
        const pG = block.getFieldValue('PIN_G');
        const pB = block.getFieldValue('PIN_B');

        // Parse the color in JavaScript HERE
        const { r, g, b } = parseHex(colorHex);

        const vR = `rgb_r_${pR}`, vG = `rgb_g_${pG}`, vB = `rgb_b_${pB}`;
        
        if (!generator.definitions_[vR]) generator.definitions_[vR] = getPwmInit(vR, pR, 1000);
        if (!generator.definitions_[vG]) generator.definitions_[vG] = getPwmInit(vG, pG, 1000);
        if (!generator.definitions_[vB]) generator.definitions_[vB] = getPwmInit(vB, pB, 1000);

        let code = '';
        if (boardId === 'pico') {
            code = `
${vR}.duty_u16(int(${r} / 255 * 65535))
${vG}.duty_u16(int(${g} / 255 * 65535))
${vB}.duty_u16(int(${b} / 255 * 65535))
`;
        } else { // ESP32
            code = `
${vR}.duty(int(${r} / 255 * 1023))
${vG}.duty(int(${g} / 255 * 1023))
${vB}.duty(int(${b} / 255 * 1023))
`;
        }
        return code;
    };

    // ================= BUZZER =================
    generator.forBlock['actuator_buzzer_tone'] = function(block) {
        generator.definitions_['import_machine'] = 'from machine import Pin, PWM';
        generator.definitions_['import_time'] = 'import time';
        const pin = block.getFieldValue('PIN');
        const freq = block.getFieldValue('FREQ'); // Number Field
        const dur = block.getFieldValue('DURATION'); // Number Field
        return getBuzzerCode(pin, freq, dur);
    };

    generator.forBlock['actuator_buzzer_note'] = function(block) {
        generator.definitions_['import_machine'] = 'from machine import Pin, PWM';
        generator.definitions_['import_time'] = 'import time';
        const pin = block.getFieldValue('PIN');
        const freq = block.getFieldValue('NOTE');
        const dur = block.getFieldValue('DURATION'); // Number Field
        return getBuzzerCode(pin, freq, dur);
    };

    // ================= SERVO MOTORS =================
    generator.forBlock['actuator_servo_write'] = function(block) {
        generator.definitions_['import_machine'] = 'from machine import Pin, PWM';
        const pin = block.getFieldValue('PIN');
        const angle = block.getFieldValue('ANGLE'); // Angle Field
        const varName = `servo_${pin}`;
        
        if (!generator.definitions_[varName]) {
            generator.definitions_[varName] = `${varName} = PWM(Pin(${pin}), freq=50)`;
        }

        if (boardId === 'pico') {
            return `${varName}.duty_u16(int(1638 + (${angle} / 180) * 6554))\n`;
        } else {
            return `${varName}.duty(int(26 + (${angle} / 180) * 102))\n`;
        }
    };

    generator.forBlock['actuator_servo_continuous'] = function(block) {
        generator.definitions_['import_machine'] = 'from machine import Pin, PWM';
        const pin = block.getFieldValue('PIN');
        const speed = block.getFieldValue('SPEED'); // Slider Field (-100 to 100)
        
        const angle = `(${speed} + 100) * 180 / 200`;
        
        const varName = `servo_${pin}`;
        if (!generator.definitions_[varName]) {
            generator.definitions_[varName] = `${varName} = PWM(Pin(${pin}), freq=50)`;
        }

        if (boardId === 'pico') {
            return `${varName}.duty_u16(int(1638 + (${angle} / 180) * 6554))\n`;
        } else {
            return `${varName}.duty(int(26 + (${angle} / 180) * 102))\n`;
        }
    };

    generator.forBlock['actuator_servo_continuous_stop'] = function(block) {
        generator.definitions_['import_machine'] = 'from machine import Pin, PWM';
        const pin = block.getFieldValue('PIN');
        const varName = `servo_${pin}`;
        
        if (!generator.definitions_[varName]) {
            generator.definitions_[varName] = `${varName} = PWM(Pin(${pin}), freq=50)`;
        }

        // 90 degrees is the universal "stop" signal for continuous servos
        if (boardId === 'pico') {
            // Duty for 90 deg on Pico
            return `${varName}.duty_u16(4915)\n`; 
        } else {
            // Duty for 90 deg on ESP32
            return `${varName}.duty(77)\n`;
        }
    };

    // ================= DC MOTOR =================
    generator.forBlock['actuator_motor_speed'] = function(block) {
        generator.definitions_['import_machine'] = 'from machine import Pin, PWM';
        const pin = block.getFieldValue('PIN');
        const speed = block.getFieldValue('SPEED'); // Slider Field (0-100)
        
        const varName = `motor_${pin}`;
        if (!generator.definitions_[varName]) {
            generator.definitions_[varName] = getPwmInit(varName, pin, 1000);
        }
        
        return getDutyCycleCode(varName, speed, 100) + '\n';
    };
}