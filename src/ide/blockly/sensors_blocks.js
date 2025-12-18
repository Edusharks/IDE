// src/ide/blockly/sensors_blocks.js
import * as Blockly from 'blockly/core';

/**
 * Registers all Sensor blocks.
 * @param {Object} pins - Contains { digital: [['D1', '1']...], adc: [['A0', '26']...] }
 */
export function registerSensorBlocks(pins) {
    const SENSOR_BLOCK_STYLE = 'sensor_blocks'; // Emerald style

    const blocks = [
        // ================= BUTTON =================
        {
            "type": "sensor_button_is_pressed",
            "message0": "is button on pin %1 pressed?",
            "args0": [
                { "type": "field_grid_dropdown", "name": "PIN", "options": pins.digital, "columns": "3" }
            ],
            "output": ["Boolean", "Number"], 
            "style": SENSOR_BLOCK_STYLE,
            "tooltip": "Returns 1 if the button is pressed, 0 if released."
        },
        {
            "type": "sensor_button_wait",
            "message0": "wait until button %1 is pressed",
            "args0": [
                { "type": "field_grid_dropdown", "name": "PIN", "options": pins.digital, "columns": "3" }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "style": "loops_blocks", 
            "tooltip": "Pauses the program until the button is pressed."
        },

        // ================= SLIDE SWITCH =================
        {
            "type": "sensor_switch_is_on",
            "message0": "is slide switch on pin %1 ON?",
            "args0": [
                { "type": "field_grid_dropdown", "name": "PIN", "options": pins.digital, "columns": "3" }
            ],
            "output": ["Boolean", "Number"],
            "style": SENSOR_BLOCK_STYLE,
            "tooltip": "Returns 1 if the switch is in the ON position, 0 otherwise."
        },

        // ================= POTENTIOMETER =================
        {
            "type": "sensor_pot_read",
            "message0": "read potentiometer on pin %1 as %2",
            "args0": [
                { "type": "field_grid_dropdown", "name": "PIN", "options": pins.adc, "columns": "3" },
                { "type": "field_dropdown", "name": "MODE", "options": [["percentage (0-100)", "PERCENT"], ["raw value", "RAW"]] }
            ],
            "output": "Number",
            "style": SENSOR_BLOCK_STYLE,
            "tooltip": "Reads the knob position. Percentage is recommended."
        },

        // ================= ULTRASONIC (HC-SR04) =================
        {
            "type": "sensor_ultrasonic_read",
            "message0": "ultrasonic distance in %1 | Trig %2 Echo %3",
            "args0": [
                { "type": "field_dropdown", "name": "UNIT", "options": [["cm", "cm"], ["inches", "mm"]] }, 
                { "type": "field_grid_dropdown", "name": "TRIG", "options": pins.digital, "columns": "3" },
                { "type": "field_grid_dropdown", "name": "ECHO", "options": pins.digital, "columns": "" }
            ],
            "output": "Number",
            "style": SENSOR_BLOCK_STYLE,
            "tooltip": "Measures distance using sound waves."
        },

        // ================= IR SENSOR =================
        {
            "type": "sensor_ir_read_digital",
            "message0": "read IR digital value (0/1) on pin %1",
            "args0": [
                { 
                    "type": "field_grid_dropdown", 
                    "name": "PIN", 
                    "options": pins.digital, // Uses Digital Pins
                    "columns": "4" 
                }
            ],
            "output": "Number",
            "style": SENSOR_BLOCK_STYLE,
            "tooltip": "Returns 0 (Detected) or 1 (Not Detected)."
        },
        {
            "type": "sensor_ir_read_analog",
            "message0": "read IR analog value on pin %1",
            "args0": [
                { 
                    "type": "field_grid_dropdown", 
                    "name": "PIN", 
                    "options": pins.adc, // Uses Analog Pins ONLY
                    "columns": "3" 
                }
            ],
            "output": "Number",
            "style": SENSOR_BLOCK_STYLE,
            "tooltip": "Returns the raw voltage value from the sensor."
        },
        {
            "type": "sensor_ir_is_obstacle",
            "message0": "is obstacle detected by IR on pin %1?",
            "args0": [
                { "type": "field_grid_dropdown", "name": "PIN", "options": pins.digital, "columns": "3" }
            ],
            "output": "Boolean",
            "style": SENSOR_BLOCK_STYLE,
            "tooltip": "Returns true if an object is close to the IR sensor."
        },

        // ================= LDR (LIGHT) =================
        {
            "type": "sensor_ldr_read_analog",
            "message0": "read LDR analog value on pin %1",
            "args0": [
                { 
                    "type": "field_grid_dropdown", 
                    "name": "PIN", 
                    "options": pins.adc, // Analog pins only
                    "columns": "3" 
                }
            ],
            "output": "Number",
            "style": SENSOR_BLOCK_STYLE,
            "tooltip": "Returns the raw analog value (0-1023 for ESP32)."
        },
        {
            "type": "sensor_ldr_read_digital",
            "message0": "read LDR digital value (0/1) on pin %1",
            "args0": [
                { 
                    "type": "field_grid_dropdown", 
                    "name": "PIN", 
                    "options": pins.digital, // Digital pins
                    "columns": "4" 
                }
            ],
            "output": "Number",
            "style": SENSOR_BLOCK_STYLE,
            "tooltip": "Returns 1 if light is detected, 0 otherwise."
        },
        {
            "type": "sensor_ldr_is_status",
            "message0": "is it %1 ? (LDR pin %2)",
            "args0": [
                { "type": "field_dropdown", "name": "STATUS", "options": [["Dark (<30%)", "DARK"], ["Bright (>70%)", "BRIGHT"]] },
                { "type": "field_grid_dropdown", "name": "PIN", "options": pins.adc, "columns": "3" }
            ],
            "output": "Boolean",
            "style": SENSOR_BLOCK_STYLE
        },

        // ================= PIR (MOTION) =================
        {
            "type": "sensor_pir_read_digital",
            "message0": "read PIR value (0/1) on pin %1",
            "args0": [
                { 
                    "type": "field_grid_dropdown", 
                    "name": "PIN", 
                    "options": pins.digital, 
                    "columns": "4" 
                }
            ],
            "output": "Number",
            "style": SENSOR_BLOCK_STYLE,
            "tooltip": "Returns 1 if motion is detected, 0 otherwise."
        },
        {
            "type": "sensor_pir_motion",
            "message0": "is motion detected on pin %1?",
            "args0": [
                { "type": "field_grid_dropdown", "name": "PIN", "options": pins.digital, "columns": "3" }
            ],
            "output": "Boolean",
            "style": SENSOR_BLOCK_STYLE,
            "tooltip": "Returns true if the PIR sensor detects movement."
        },

        // ================= SOIL MOISTURE =================
        {
            "type": "sensor_soil_read_analog",
            "message0": "read soil analog value on pin %1",
            "args0": [
                { 
                    "type": "field_grid_dropdown", 
                    "name": "PIN", 
                    "options": pins.adc, // Analog pins only
                    "columns": "3" 
                }
            ],
            "output": "Number",
            "style": SENSOR_BLOCK_STYLE,
            "tooltip": "Returns 0-1023. Usually Low = Wet, High = Dry."
        },
        {
            "type": "sensor_soil_read_digital",
            "message0": "read soil digital value (0/1) on pin %1",
            "args0": [
                { 
                    "type": "field_grid_dropdown", 
                    "name": "PIN", 
                    "options": pins.digital, // Digital pins
                    "columns": "4" 
                }
            ],
            "output": "Number",
            "style": SENSOR_BLOCK_STYLE,
            "tooltip": "Returns 0 (Wet) or 1 (Dry) based on potentiometer threshold."
        },

        // ================= DHT11 =================
        {
            "type": "sensor_dht11_read",
            "message0": "read %1 from DHT11 on pin %2",
            "args0": [
                { "type": "field_dropdown", "name": "TYPE", "options": [["Temperature (°C)", "temperature"], ["Humidity (%)", "humidity"]] },
                { "type": "field_grid_dropdown", "name": "PIN", "options": pins.digital, "columns": "3" }
            ],
            "output": "Number",
            "style": SENSOR_BLOCK_STYLE,
            "tooltip": "Reads temperature or humidity from the blue DHT11 sensor."
        }
    ];

    Blockly.defineBlocksWithJsonArray(blocks);
}