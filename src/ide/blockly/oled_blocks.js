// src/ide/blockly/oled_blocks.js
import * as Blockly from 'blockly/core';
import '@blockly/field-bitmap'; 

export function registerOledBlocks(i2cPinOptions) {
    const OLED_BLOCK_STYLE = 'display_blocks'; 

    const blocks = [
        // --- 1. Setup ---
        {
            "type": "display_oled_setup",
            "message0": "setup OLED display on I2C pins %1 address %2",
            "args0": [
                {
                    "type": "field_grid_dropdown",
                    "name": "PINS",
                    "options": i2cPinOptions,
                    "columns": "2"
                },
                {
                    "type": "field_input",
                    "name": "ADDR",
                    "text": "0x3C"
                }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "style": OLED_BLOCK_STYLE,
            "tooltip": "Initialize SSD1306 128x64 display. Default address is 0x3C."
        },

        // --- 2. Drawing ---
        {
            "type": "display_oled_pixel",
            "message0": "draw pixel at x %1 y %2 color %3",
            "args0": [
                { "type": "field_number", "name": "X", "value": 64, "min": 0, "max": 127 },
                { "type": "field_number", "name": "Y", "value": 32, "min": 0, "max": 63 },
                { "type": "field_grid_dropdown", "name": "COLOR", "options": [["ON (White)", "1"], ["OFF (Black)", "0"]], "columns": "2" }
            ],
            "inputsInline": true,
            "previousStatement": null,
            "nextStatement": null,
            "style": OLED_BLOCK_STYLE
        },
        {
            "type": "display_oled_line",
            "message0": "draw line from x1 %1 y1 %2 to x2 %3 y2 %4",
            "args0": [
                { "type": "field_number", "name": "X1", "value": 0, "min": 0, "max": 127 },
                { "type": "field_number", "name": "Y1", "value": 0, "min": 0, "max": 63 },
                { "type": "field_number", "name": "X2", "value": 127, "min": 0, "max": 127 },
                { "type": "field_number", "name": "Y2", "value": 63, "min": 0, "max": 63 }
            ],
            "inputsInline": false,
            "previousStatement": null,
            "nextStatement": null,
            "style": OLED_BLOCK_STYLE
        },
        {
            "type": "display_oled_rect",
            "message0": "%1 rectangle at x %2 y %3 width %4 height %5",
            "args0": [
                { "type": "field_grid_dropdown", "name": "MODE", "options": [["draw (outline)", "rect"], ["fill (solid)", "fill_rect"]], "columns": "2" },
                { "type": "field_number", "name": "X", "value": 10, "min": 0, "max": 127 },
                { "type": "field_number", "name": "Y", "value": 10, "min": 0, "max": 63 },
                { "type": "field_number", "name": "WIDTH", "value": 20, "min": 1, "max": 128 },
                { "type": "field_number", "name": "HEIGHT", "value": 15, "min": 1, "max": 64 }
            ],
            "inputsInline": false,
            "previousStatement": null,
            "nextStatement": null,
            "style": OLED_BLOCK_STYLE
        },
        {
            "type": "display_oled_text",
            "message0": "on OLED, print %1 at x %2 y %3",
            "args0": [
                { 
                    "type": "input_value", 
                    "name": "TEXT", 
                    "shadow": { "type": "text", "fields": { "TEXT": "Hello" } } 
                },
                { "type": "field_number", "name": "X", "value": 0, "min": 0, "max": 127 },
                { "type": "field_number", "name": "Y", "value": 0, "min": 0, "max": 63 }
            ],
            "inputsInline": true,
            "previousStatement": null,
            "nextStatement": null,
            "style": "display_blocks", // or OLED_BLOCK_STYLE
            "tooltip": "Draw text. You can type text directly or connect a variable block."
        },

        // --- 3. Images & Bitmaps ---
        {
            "type": "display_oled_draw_bitmap",
            "message0": "draw bitmap at x %1 y %2 %3",
            "args0": [
                { "type": "field_number", "name": "X", "value": 0, "min": 0, "max": 127 },
                { "type": "field_number", "name": "Y", "value": 0, "min": 0, "max": 63 },
                { 
                    "type": "field_bitmap", 
                    "name": "BITMAP", 
                    "width": 16, 
                    "height": 16,
                    "colour": "#ffffff" 
                }
            ],
            "inputsInline": false,
            "previousStatement": null,
            "nextStatement": null,
            "style": OLED_BLOCK_STYLE,
            "tooltip": "Draw a custom image using the visual editor."
        },
        // RESTORED: Raw Image Create Block (Updated to use Fields)
        {
            "type": "display_oled_create_image",
            "message0": "create image w %1 h %2 data %3",
            "args0": [
                { "type": "field_number", "name": "WIDTH", "value": 16, "min": 1 },
                { "type": "field_number", "name": "HEIGHT", "value": 16, "min": 1 },
                { "type": "field_input", "name": "DATA", "text": "\\xff\\xff" }
            ],
            "output": "Image",
            "style": OLED_BLOCK_STYLE,
            "tooltip": "Create an image from a raw byte string."
        },
        // RESTORED: Draw Image Variable Block
        {
            "type": "display_oled_draw_image",
            "message0": "draw image variable %1 at x %2 y %3",
            "args0": [
                { "type": "input_value", "name": "IMAGE", "check": "Image" },
                { "type": "field_number", "name": "X", "value": 0 },
                { "type": "field_number", "name": "Y", "value": 0 }
            ],
            "inputsInline": true,
            "previousStatement": null,
            "nextStatement": null,
            "style": OLED_BLOCK_STYLE,
            "tooltip": "Draws an image stored in a variable."
        },

        // --- 4. Controls ---
        {
            "type": "display_oled_show",
            "message0": "show OLED changes",
            "previousStatement": null,
            "nextStatement": null,
            "style": OLED_BLOCK_STYLE
        },
        {
            "type": "display_oled_clear",
            "message0": "clear OLED display",
            "previousStatement": null,
            "nextStatement": null,
            "style": OLED_BLOCK_STYLE
        },
        {
            "type": "display_oled_power",
            "message0": "turn OLED display %1",
            "args0": [
                { "type": "field_grid_dropdown", "name": "STATE", "options": [["ON", "poweron"], ["OFF", "poweroff"]], "columns": "2" }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "style": OLED_BLOCK_STYLE
        },
        {
            "type": "display_oled_contrast",
            "message0": "set OLED contrast to %1",
            "args0": [
                { "type": "field_slider", "name": "CONTRAST", "value": 255, "min": 0, "max": 255 }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "style": OLED_BLOCK_STYLE
        },
        {
            "type": "display_oled_invert",
            "message0": "invert OLED colors %1",
            "args0": [
                { "type": "field_grid_dropdown", "name": "INVERT", "options": [["ON", "1"], ["OFF", "0"]], "columns": "2" }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "style": OLED_BLOCK_STYLE
        },
        {
            "type": "display_oled_animate_fireworks",
            "message0": "run fireworks animation for %1 seconds",
            "args0": [
                { "type": "field_number", "name": "DURATION", "value": 5, "min": 1, "max": 60 }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "style": OLED_BLOCK_STYLE
        }
    ];

    Blockly.defineBlocksWithJsonArray(blocks);
}