// src/ide/blockly/neopixel_blocks.js
import * as Blockly from 'blockly/core';

export function registerNeoPixelBlocks(pinOptions) {
    const NEOPIXEL_STYLE = 'actuator_blocks';

    const blocks = [
        {
            "type": "actuator_neopixel_setup",
            "message0": "setup NeoPixel strip on pin %1 with %2 pixels",
            "args0": [
                { "type": "field_grid_dropdown", "name": "PIN", "options": pinOptions, "columns": "4" },
                { "type": "field_number", "name": "NUM_PIXELS", "value": 8, "min": 1, "max": 256 }
            ],
            "inputsInline": true,
            "previousStatement": null,
            "nextStatement": null,
            "style": NEOPIXEL_STYLE
        },
        {
            "type": "actuator_neopixel_brightness",
            "message0": "set NeoPixel brightness to %1 %%",
            "args0": [
                { "type": "field_slider", "name": "BRIGHTNESS", "value": 100, "min": 0, "max": 100 }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "style": NEOPIXEL_STYLE
        },
        {
            "type": "actuator_neopixel_brightness_val",
            "message0": "set NeoPixel brightness to %1 %%",
            "args0": [
                { 
                    "type": "input_value", 
                    "name": "BRIGHTNESS", 
                    "check": "Number",
                    "shadow": { "type": "math_number", "fields": { "NUM": 100 } }
                }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "style": NEOPIXEL_STYLE,
            "tooltip": "Set brightness using a number or variable (0-100)."
        },

        {
            "type": "actuator_neopixel_fill",
            "message0": "fill NeoPixel strip with color %1",
            "args0": [
                { "type": "field_colour_hsv_sliders", "name": "COLOR", "colour": "#ff0000" }
            ],
            "inputsInline": true,
            "previousStatement": null,
            "nextStatement": null,
            "style": NEOPIXEL_STYLE
        },
        {
            "type": "actuator_neopixel_set",
            "message0": "set NeoPixel # %1 to color %2",
            "args0": [
                { "type": "field_number", "name": "PIXEL_NUM", "value": 0, "min": 0 },
                { "type": "field_colour_hsv_sliders", "name": "COLOR", "colour": "#00ff00" }
            ],
            "inputsInline": true,
            "previousStatement": null,
            "nextStatement": null,
            "style": NEOPIXEL_STYLE
        },
        {
            "type": "actuator_neopixel_shift",
            "message0": "shift pixels by %1 positions",
            "args0": [
                { "type": "field_number", "name": "SHIFT", "value": 1 }
            ],
            "inputsInline": true,
            "previousStatement": null,
            "nextStatement": null,
            "style": NEOPIXEL_STYLE
        },
        {
            "type": "actuator_neopixel_rainbow",
            "message0": "advance rainbow effect by one step",
            "previousStatement": null,
            "nextStatement": null,
            "style": NEOPIXEL_STYLE
        },
        {
            "type": "actuator_neopixel_show",
            "message0": "show NeoPixel changes",
            "previousStatement": null,
            "nextStatement": null,
            "style": NEOPIXEL_STYLE
        },
        {
            "type": "actuator_neopixel_clear",
            "message0": "clear NeoPixel strip",
            "previousStatement": null,
            "nextStatement": null,
            "style": NEOPIXEL_STYLE
        }
    ];

    Blockly.defineBlocksWithJsonArray(blocks);
}