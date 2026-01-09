// src/ide/blockly/pico-blocks.js
import * as Blockly from 'blockly/core';

// --- Export Pin Definitions for use in ide-entry.js ---
export const PICO_PINS = {
    // Pico supports digital I/O on GP0-GP28
    digital: [
        ["GP0", "0"], ["GP1", "1"], ["GP2", "2"], ["GP3", "3"], ["GP4", "4"], ["GP5", "5"],
        ["GP6", "6"], ["GP7", "7"], ["GP8", "8"], ["GP9", "9"], ["GP10", "10"], ["GP11", "11"],
        ["GP12", "12"], ["GP13", "13"], ["GP14", "14"], ["GP15", "15"], ["GP16", "16"],
        ["GP17", "17"], ["GP18", "18"], ["GP19", "19"], ["GP20", "20"], ["GP21", "21"],
        ["GP22", "22"], ["GP26", "26"], ["GP27", "27"], ["GP28", "28"]
    ],
    // Pico has 3 user-accessible ADC pins
    adc: [
        ["GP26 (ADC0)", "26"], 
        ["GP27 (ADC1)", "27"], 
        ["GP28 (ADC2)", "28"]
    ],
    // All GPIO pins on Pico support PWM
    pwm: [
        ["GP0", "0"], ["GP1", "1"], ["GP2", "2"], ["GP3", "3"], ["GP4", "4"], ["GP5", "5"],
        ["GP6", "6"], ["GP7", "7"], ["GP8", "8"], ["GP9", "9"], ["GP10", "10"], ["GP11", "11"],
        ["GP12", "12"], ["GP13", "13"], ["GP14", "14"], ["GP15", "15"], ["GP16", "16"],
        ["GP17", "17"], ["GP18", "18"], ["GP19", "19"], ["GP20", "20"], ["GP21", "21"],
        ["GP22", "22"], ["GP26", "26"], ["GP27", "27"], ["GP28", "28"]
    ],
    // Common I2C pairs
    i2c: [
        ["GP0 (SDA), GP1 (SCL)", "0"], 
        ["GP4 (SDA), GP5 (SCL)", "4"],
        ["GP8 (SDA), GP9 (SCL)", "8"],
        ["GP16 (SDA), GP17 (SCL)", "16"]
    ]
};

export function registerPicoBlocks() {
    const GPIO_STYLE = 'gpio_blocks'; // Blue style

    const blocks = [
        
        // --- Digital Write ---
        {
            "type": "gpio_digital_write",
            "message0": "digital write pin %1 to %2",
            "args0": [
                { "type": "field_grid_dropdown", "name": "PIN", "options": PICO_PINS.digital },
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
                { "type": "field_grid_dropdown", "name": "PIN", "options": PICO_PINS.digital }
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
                { "type": "field_grid_dropdown", "name": "PIN", "options": PICO_PINS.adc }
            ],
            "output": "Number",
            "style": GPIO_STYLE,
            "tooltip": "Read analog voltage (returns 0-65535). Represents 0V to 3.3V."
        },

        // --- Analog Write (PWM) ---
        {
            "type": "gpio_pwm_write",
            "message0": "analog write (PWM) pin %1 value %2",
            "args0": [
                { 
                    "type": "field_grid_dropdown", 
                    "name": "PIN", 
                    "options": PICO_PINS.pwm, 
                    "columns": "4" 
                },
                { 
                    "type": "field_slider", 
                    "name": "VALUE", 
                    "min": 0, 
                    "max": 255, 
                    "value": 128,
                    "precision": 1 
                }
            ],
            "inputsInline": true,
            "previousStatement": null,
            "nextStatement": null,
            "style": "gpio_blocks",
            "tooltip": "Output a PWM signal. Slider range 0-255 (scaled automatically to 16-bit)."
        },

        

        // --- Interrupts ---
        {
            "type": "gpio_on_pin_change",
            "message0": "when pin %1 changes to %2",
            "args0": [
                { "type": "field_grid_dropdown", "name": "PIN", "options": PICO_PINS.digital },
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
                { "type": "field_grid_dropdown", "name": "UNIT", "options": [["°C", "C"], ["°F", "F"]] }
            ],
            "output": "Number",
            "style": "sensor_blocks",
            "tooltip": "Reads the Pico's built-in temperature sensor connected to ADC 4."
        }
    ];

    Blockly.defineBlocksWithJsonArray(blocks);
}