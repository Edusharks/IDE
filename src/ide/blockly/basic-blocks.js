// src/ide/blockly/basic-blocks.js
'use strict';

import * as Blockly from 'blockly/core';

export function registerBasicBlocks() {

    const blockDefinitions = [
        // --- LOOPS ---
        {
            "type": "on_start",
            "message0": "on start",
            "message1": "%1",
            "args1": [{ "type": "input_statement", "name": "DO" }],
            "style": "loops_blocks",
            "tooltip": "Code in this block runs only once when the program starts.",
            "deletable": false
        },
        {
            "type": "forever",
            "message0": "forever",
            "message1": "%1",
            "args1": [{ "type": "input_statement", "name": "DO" }],
            "style": "loops_blocks",
            "tooltip": "Code in this block runs repeatedly in a loop after the 'on start' block.",
            "deletable": false
        },
        {
            "type": "every_x_ms",
            "message0": "every %1 ms do",
            "args0": [{ "type": "field_number", "name": "TIME", "value": 500 }],
            "message1": "%1",
            "args1": [{ "type": "input_statement", "name": "DO" }],
            "previousStatement": null,
            "nextStatement": null,
            "style": "loops_blocks",
            "tooltip": "Runs the code inside in a loop, with a delay at the end of each iteration."
        },
        
        // --- CONTROL ---
        {
            "type": "control_delay_seconds",
            "message0": "delay for %1 seconds",
            "args0": [{ 
                "type": "input_value", 
                "name": "DELAY_SEC", 
                "check": "Number",
                "shadow": { "type": "math_number", "fields": { "NUM": 1 } }
            }],
            "inputsInline": true,
            "previousStatement": null,
            "nextStatement": null,
            "style": "wait_block_style",
            "tooltip": "Pauses the program for a specified number of seconds."
        },

        // --- ASYNC BLOCKS (Added to fix your error) ---
        {
            "type": "async_sleep_ms",
            "message0": "await sleep for %1 ms",
            "args0": [{ 
                "type": "input_value", 
                "name": "MS", 
                "check": "Number",
                "shadow": { "type": "math_number", "fields": { "NUM": 100 } } 
            }],
            "previousStatement": null,
            "nextStatement": null,
            "style": "loops_blocks",
            "tooltip": "Yields control to allow other tasks to run."
        },
        {
            "type": "async_run_main_loop",
            "message0": "run async tasks",
            "nextStatement": null,
            "style": "loops_blocks",
            "tooltip": "Place this in your main loop to keep async operations running.",
            "deletable": false
        },

        // --- MATH ---
        {
            "type": "math_map",
            "message0": "map %1 from low %2 high %3 to low %4 high %5",
            "args0": [
                { "type": "input_value", "name": "VALUE", "check": "Number", "shadow": { "type": "math_number", "fields": { "NUM": 512 } } }, 
                { "type": "input_value", "name": "FROM_LOW", "check": "Number", "shadow": { "type": "math_number", "fields": { "NUM": 0 } } }, 
                { "type": "input_value", "name": "FROM_HIGH", "check": "Number", "shadow": { "type": "math_number", "fields": { "NUM": 1023 } } }, 
                { "type": "input_value", "name": "TO_LOW", "check": "Number", "shadow": { "type": "math_number", "fields": { "NUM": 0 } } }, 
                { "type": "input_value", "name": "TO_HIGH", "check": "Number", "shadow": { "type": "math_number", "fields": { "NUM": 100 } } }
            ],
            "inputsInline": true,
            "output": "Number",
            "style": "math_blocks"
        },

        // --- TEXT & UTILS ---
        {
            "type": "text_parse_to_number",
            "message0": "parse to number %1",
            "args0": [{ 
                "type": "input_value", 
                "name": "TEXT", 
                "check": "String",
                "shadow": { "type": "text", "fields": { "TEXT": "123" } }
            }],
            "output": "Number",
            "style": "text_blocks",
            "tooltip": "Converts a string of text into a number."
        },
        {
            "type": "text_convert_to_text",
            "message0": "convert %1 to text",
            "args0": [{ 
                "type": "input_value", 
                "name": "VALUE",
                "shadow": { "type": "math_number", "fields": { "NUM": 0 } }
            }],
            "output": "String",
            "style": "text_blocks",
            "tooltip": "Converts any value into a string of text."
        },
        {
            "type": "text_from_char_code",
            "message0": "text from char code %1",
            "args0": [{ 
                "type": "input_value", 
                "name": "CODE", 
                "check": "Number",
                "shadow": { "type": "math_number", "fields": { "NUM": 65 } }
            }],
            "output": "String",
            "style": "text_blocks",
            "tooltip": "Creates a character from its ASCII/Unicode number."
        },
        {
            "type": "text_char_code_at",
            "message0": "char code from %1 at %2",
            "args0": [
                { "type": "input_value", "name": "TEXT", "check": "String", "shadow": { "type": "text", "fields": { "TEXT": "abc" } } }, 
                { "type": "input_value", "name": "AT", "check": "Number", "shadow": { "type": "math_number", "fields": { "NUM": 0 } } }
            ],
            "inputsInline": true,
            "output": "Number",
            "style": "text_blocks",
            "tooltip": "Gets the character code (ASCII/Unicode) from a specific position in the text."
        },
        {
            "type": "lists_get_random_item",
            "message0": "get random value from %1",
            "args0": [{ "type": "input_value", "name": "LIST", "check": "Array" }],
            "output": null,
            "style": "lists_blocks",
            "tooltip": "Returns a random item from the list."
        },

        // --- COLOURS ---
        {
            "type": "colour_from_hex",
            "message0": "create colour with hex %1",
            "args0": [{ 
                "type": "input_value", 
                "name": "HEX", 
                "check": "String",
                "shadow": { "type": "text", "fields": { "TEXT": "#ff0000" } }
            }],
            "output": "Colour",
            "style": "colour_blocks",
            "tooltip": "Creates a color from a hexadecimal web code (e.g., #FF0000 for red)."
        },
        {
            "type": "colour_get_component",
            "message0": "get %1 component of %2",
            "args0": [
                { "type": "field_dropdown", "name": "COMPONENT", "options": [["red", "0"], ["green", "1"], ["blue", "2"]] }, 
                { "type": "input_value", "name": "COLOUR", "check": "Colour", "shadow": { "type": "colour_picker", "fields": { "COLOUR": "#ff0000" } } }
            ],
            "output": "Number",
            "style": "colour_blocks",
            "tooltip": "Gets the value (0-255) of a specific component from a color.",
            "inputsInline": true
        },
        {
            "type": "colour_rgb_value",
            "message0": "color with red %1 green %2 blue %3",
            "args0": [
                { "type": "input_value", "name": "RED", "check": "Number", "shadow": { "type": "math_number", "fields": { "NUM": 255 } } }, 
                { "type": "input_value", "name": "GREEN", "check": "Number", "shadow": { "type": "math_number", "fields": { "NUM": 0 } } }, 
                { "type": "input_value", "name": "BLUE", "check": "Number", "shadow": { "type": "math_number", "fields": { "NUM": 0 } } }
            ],
            "inputsInline": true,
            "output": "Colour",
            "style": "colour_blocks",
            "tooltip": "Creates a color from individual Red, Green, and Blue component values (0-255)."
        },
        {
            "type": "colour_hsv_sliders_picker",
            "message0": "advanced colour %1",
            "args0": [
                {
                    "type": "field_colour_hsv_sliders",
                    "name": "COLOUR",
                    "colour": "#ff4000ff"
                }
            ],
            "output": "Colour",
            "style": "colour_blocks",
            "tooltip": "Select a color using advanced HSV sliders."
        },
        {
            "type": "time_date",
            "message0": "date %1",
            "args0": [
              {
                "type": "field_date",
                "name": "DATE",
                "date": "2024-01-01"
              }
            ],
            "output": "String",
            "style": "loops_blocks",
            "tooltip": "Select a date. Outputs a YYYY-MM-DD string."
        },
        {
            "type": "display_create_bitmap",
            "message0": "create 8x8 bitmap %1",
            "args0": [
              {
                "type": "field_bitmap",
                "name": "BITMAP",
                "width": 8,
                "height": 8
              }
            ],
            "output": "Array",
            "style": "display_blocks",
            "tooltip": "Create a small black and white image. Outputs a list of lists."
        }
    ];

    Blockly.defineBlocksWithJsonArray(blockDefinitions);
}