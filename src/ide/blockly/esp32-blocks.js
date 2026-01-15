// src/ide/blockly/esp32-blocks.js
import * as Blockly from 'blockly/core';

// --- Export Pin Definitions ---
export const ESP32_PINS = {
    digitalInput: [
        ["D2", "2"], ["D4", "4"], ["D5", "5"], ["D12", "12"], ["D13", "13"], ["D14", "14"],
        ["D15", "15"], ["D16", "16"], ["D17", "17"], ["D18", "18"], ["D19", "19"], ["D21", "21"],
        ["D22", "22"], ["D23", "23"], ["D25", "25"], ["D26", "26"], ["D27", "27"], ["D32", "32"],
        ["D33", "33"], ["D34", "34"], ["D35", "35"], ["D36", "36"], ["D39", "39"]
    ],
    digitalOutput: [
        ["D2", "2"], ["D4", "4"], ["D5", "5"], ["D12", "12"], ["D13", "13"], ["D14", "14"],
        ["D15", "15"], ["D16", "16"], ["D17", "17"], ["D18", "18"], ["D19", "19"], ["D21", "21"],
        ["D22", "22"], ["D23", "23"], ["D25", "25"], ["D26", "26"], ["D27", "27"]
    ],
    // ESP32 ADC1 pins are safe to use with WiFi. ADC2 pins cannot be used when WiFi is active.
    adc: [
        ["D32", "32"], ["D33", "33"], ["D34", "34"], ["D35", "35"], ["D36", "36"], ["D39", "39"]
    ],
    // ESP32 supports PWM on all output pins
    pwm: [
        ["D2", "2"], ["D4", "4"], ["D5", "5"], ["D12", "12"], ["D13", "13"], ["D14", "14"],
        ["D15", "15"], ["D18", "18"], ["D19", "19"], ["D21", "21"], ["D22", "22"], ["D23", "23"],
        ["D25", "25"], ["D26", "26"], ["D27", "27"]
    ],
    i2c: [
        ["D21 (SDA), D22 (SCL)", "21"], 
        ["D25 (SDA), D26 (SCL)", "25"]
    ]
};

export function registerEsp32Blocks() {
    const GPIO_STYLE = 'gpio_blocks'; // Blue style

    

    const blocks = [
        
        // --- Digital Write ---
        {
            "type": "gpio_digital_write",
            "message0": "digital write pin %1 to %2",
            "args0": [
                { "type": "field_grid_dropdown", "name": "PIN", "options": ESP32_PINS.digitalOutput },
                { "type": "field_grid_dropdown", "name": "STATE", "options": [["HIGH", "1"], ["LOW", "0"]] }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "style": GPIO_STYLE,
            "tooltip": "Set a GPIO pin to High (3.3V) or Low (GND)."
        },

        // --- Digital Read ---
        {
            "type": "gpio_digital_read",
            "message0": "digital read pin %1",
            "args0": [
                { "type": "field_grid_dropdown", "name": "PIN", "options": ESP32_PINS.digitalInput }
            ],
            "output": "Boolean",
            "style": GPIO_STYLE,
            "tooltip": "Read the state of a pin. Returns True (High) or False (Low)."
        },

        // --- Analog Read ---
        {
            "type": "gpio_analog_read",
            "message0": "analog read pin %1",
            "args0": [
                { "type": "field_grid_dropdown", "name": "PIN", "options": ESP32_PINS.adc }
            ],
            "output": "Number",
            "style": GPIO_STYLE,
            "tooltip": "Read analog voltage (0-4095). Represents 0V to 3.3V."
        },

        // --- Analog Write (PWM) - UPDATED ---
        {
            "type": "gpio_pwm_write",
            "message0": "analog write (PWM) pin %1 value %2",
            "args0": [
                { 
                    "type": "field_grid_dropdown", 
                    "name": "PIN", 
                    "options": ESP32_PINS.pwm, 
                    "columns": "4" 
                },
                { 
                    // Changed to input_value to allow blocks like 'map' or variables
                    "type": "input_value", 
                    "name": "VALUE",
                    "check": "Number",
                    // Use the helper block as the default shadow
                    "shadow": {
                        "type": "math_number_slider",
                        "fields": { "NUM": 128 }
                    }
                }
            ],
            "inputsInline": true,
            "previousStatement": null,
            "nextStatement": null,
            "style": GPIO_STYLE,
            "tooltip": "Output a PWM signal. Value 0-255 (mapped internally)."
        },

        // --- Interrupts ---
        {
            "type": "gpio_on_pin_change",
            "message0": "when pin %1 changes to %2",
            "args0": [
                { "type": "field_grid_dropdown", "name": "PIN", "options": ESP32_PINS.digitalInput },
                { "type": "field_grid_dropdown", "name": "TRIGGER", "options": [["High", "IRQ_RISING"], ["Low", "IRQ_FALLING"]] }
            ],
            "message1": "do %1",
            "args1": [{ "type": "input_statement", "name": "DO" }],
            "style": GPIO_STYLE,
            "tooltip": "Runs code immediately when the pin state changes (Interrupt)."
        },

        // --- Internal Sensors ---
        {
            "type": "sensor_internal_temp",
            "message0": "read internal temperature (%1)",
            "args0": [
                { "type": "field_grid_dropdown", "name": "UNIT", "options": [["°F", "F"], ["°C", "C"]] }
            ],
            "output": "Number",
            "style": "sensor_blocks",
            "tooltip": "Reads the ESP32's built-in Hall/Temp sensor (Note: Not available on all ESP32 variants)."
        }
    ];

    Blockly.defineBlocksWithJsonArray(blocks);
}