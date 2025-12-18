// src/ide/blockly/actuators_blocks.js
import * as Blockly from 'blockly/core';

export function registerActuatorBlocks(pins) {
    const ACTUATOR_STYLE = 'actuator_blocks';

    const blocks = [
        // ================= LED MODULE =================
        {
            "type": "actuator_builtin_led",
            "message0": "turn built-in LED %1",
            "args0": [
                { 
                    "type": "field_dropdown", 
                    "name": "STATE", 
                    "options": [["ON", "1"], ["OFF", "0"]] 
                }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "style": ACTUATOR_STYLE,
            "tooltip": "Controls the onboard LED (Pin 2 for ESP32, Pin 25 for Pico)."
        },
        {
            "type": "actuator_led_set",
            "message0": "turn LED on pin %1 %2",
            "args0": [
                { "type": "field_grid_dropdown", "name": "PIN", "options": pins.digital, "columns": "4" },
                { "type": "field_dropdown", "name": "STATE", "options": [["ON", "1"], ["OFF", "0"]] }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "style": ACTUATOR_STYLE
        },
        {
            "type": "actuator_led_toggle",
            "message0": "toggle LED on pin %1",
            "args0": [{ "type": "field_grid_dropdown", "name": "PIN", "options": pins.digital, "columns": "4" }],
            "previousStatement": null,
            "nextStatement": null,
            "style": ACTUATOR_STYLE
        },
        {
            "type": "actuator_led_brightness",
            "message0": "set LED brightness on pin %1 to %2 %%",
            "args0": [
                { "type": "field_grid_dropdown", "name": "PIN", "options": pins.pwm, "columns": "4" },
                { "type": "field_slider", "name": "BRIGHTNESS", "min": 0, "max": 100, "value": 50 }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "style": ACTUATOR_STYLE
        },

        // ================= RGB LED MODULE =================
        
        {
            "type": "actuator_rgb_set",
            "message0": "set RGB LED color %1",
            "message1": "Red Pin %1 Green Pin %2 Blue Pin %3",
            "args0": [
                { "type": "field_colour_hsv_sliders", "name": "COLOR", "colour": "#ff0000" }
            ],
            "args1": [
                { "type": "field_grid_dropdown", "name": "PIN_R", "options": pins.pwm, "columns": "3" },
                { "type": "field_grid_dropdown", "name": "PIN_G", "options": pins.pwm, "columns": "3" },
                { "type": "field_grid_dropdown", "name": "PIN_B", "options": pins.pwm, "columns": "3" }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "style": ACTUATOR_STYLE
        },

        // ================= BUZZER =================
        {
            "type": "actuator_buzzer_tone",
            "message0": "play tone %1 Hz on pin %2 for %3 ms",
            "args0": [
                { "type": "field_number", "name": "FREQ", "value": 1000, "min": 20, "max": 20000 },
                { "type": "field_grid_dropdown", "name": "PIN", "options": pins.pwm, "columns": "4" },
                { "type": "field_number", "name": "DURATION", "value": 500, "min": 0 }
            ],
            "inputsInline": true,
            "previousStatement": null,
            "nextStatement": null,
            "style": ACTUATOR_STYLE
        },
        {
            "type": "actuator_buzzer_note",
            "message0": "play note %1 on pin %2 for %3 ms",
            "args0": [
                { 
                    "type": "field_dropdown", 
                    "name": "NOTE", 
                    "options": [
                        ["C4 (Do)", "262"], ["D4 (Re)", "294"], ["E4 (Mi)", "330"], ["F4 (Fa)", "349"],
                        ["G4 (Sol)", "392"], ["A4 (La)", "440"], ["B4 (Ti)", "494"], ["C5 (Do)", "523"]
                    ] 
                },
                { "type": "field_grid_dropdown", "name": "PIN", "options": pins.pwm, "columns": "4" },
                { "type": "field_number", "name": "DURATION", "value": 250, "min": 0 }
            ],
            "inputsInline": true,
            "previousStatement": null,
            "nextStatement": null,
            "style": ACTUATOR_STYLE
        },

        // ================= POSITIONAL SERVO =================
        {
            "type": "actuator_servo_write",
            "message0": "set servo on pin %1 to %2",
            "args0": [
                { "type": "field_grid_dropdown", "name": "PIN", "options": pins.pwm, "columns": "4" },
                { "type": "field_angle", "name": "ANGLE", "angle": 90 }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "style": ACTUATOR_STYLE
        },

        // ================= CONTINUOUS SERVO =================
        {
            "type": "actuator_servo_continuous",
            "message0": "rotate continuous servo on pin %1 speed %2 %%",
            "args0": [
                { "type": "field_grid_dropdown", "name": "PIN", "options": pins.pwm, "columns": "4" },
                { "type": "field_slider", "name": "SPEED", "min": -100, "max": 100, "value": 0 }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "style": ACTUATOR_STYLE
        },
        {
            "type": "actuator_servo_continuous_stop",
            "message0": "stop continuous servo on pin %1",
            "args0": [
                { "type": "field_grid_dropdown", "name": "PIN", "options": pins.pwm, "columns": "4" }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "style": ACTUATOR_STYLE,
            "tooltip": "Stops the continuous rotation servo by setting its speed to zero."
        },

        // ================= DC MOTOR =================
        {
            "type": "actuator_motor_speed",
            "message0": "set DC motor speed on pin %1 to %2 %%",
            "args0": [
                { "type": "field_grid_dropdown", "name": "PIN", "options": pins.pwm, "columns": "4" },
                { "type": "field_slider", "name": "SPEED", "min": 0, "max": 100, "value": 50 }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "style": ACTUATOR_STYLE
        }
    ];

    Blockly.defineBlocksWithJsonArray(blocks);
}