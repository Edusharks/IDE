// src/renderer/blockly/basic-blocks.js
'use strict';

// === DEFINE ALL BASIC BLOCKS ===
const blockDefinitions = [
    // Control Blocks
    {
        "type": "on_start",
        "message0": "on start",
        "message1": "%1",
        "args1": [{
            "type": "input_statement",
            "name": "DO"
        }],
        "style": "loops_blocks",
        "tooltip": "Code in this block runs only once when the program starts.",
        "deletable": false
    },
    {
        "type": "forever",
        "message0": "forever",
        "message1": "%1",
        "args1": [{
            "type": "input_statement",
            "name": "DO"
        }],
        "style": "loops_blocks",
        "tooltip": "Code in this block runs repeatedly in a loop after the 'on start' block.",
        "deletable": false
    },
    {
        "type": "control_delay",
        "message0": "wait %1 milliseconds",
        "args0": [{
            "type": "input_value",
            "name": "TIME",
            "check": "Number"
        }],
        "inputsInline": true,
        "previousStatement": null,
        "nextStatement": null,
        "style": "wait_block_style"
    },
    {
      "type": "every_x_ms",
      "message0": "every %1 ms do",
      "args0": [
        {
          "type": "field_number",
          "name": "TIME",
          "value": 500
        }
      ],
      "message1": "%1",
      "args1": [
        {
          "type": "input_statement",
          "name": "DO"
        }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "style": "loops_blocks",
      "tooltip": "Runs the code inside in a loop, with a delay at the end of each iteration."
    },
    {
        "type": "control_delay_seconds",
        "message0": "delay for %1 seconds",
        "args0": [{
            "type": "input_value",
            "name": "DELAY_SEC",
            "check": "Number"
        }],
        "inputsInline": true,
        "previousStatement": null,
        "nextStatement": null,
        "style": "wait_block_style",
        "tooltip": "Pauses the program for a specified number of seconds."
    },

    // Math Blocks
    {
        "type": "math_map",
        "message0": "map %1 from low %2 high %3 to low %4 high %5",
        "args0": [{
            "type": "input_value",
            "name": "VALUE",
            "check": "Number"
        }, {
            "type": "input_value",
            "name": "FROM_LOW",
            "check": "Number"
        }, {
            "type": "input_value",
            "name": "FROM_HIGH",
            "check": "Number"
        }, {
            "type": "input_value",
            "name": "TO_LOW",
            "check": "Number"
        }, {
            "type": "input_value",
            "name": "TO_HIGH",
            "check": "Number"
        }],
        "inputsInline": true,
        "output": "Number",
        "style": "math_blocks"
    },

    // Text & Conversion Blocks
    {
        "type": "text_parse_to_number",
        "message0": "parse to number %1",
        "args0": [{
            "type": "input_value",
            "name": "TEXT",
            "check": "String"
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
            "name": "VALUE"
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
            "check": "Number"
        }],
        "output": "String",
        "style": "text_blocks",
        "tooltip": "Creates a character from its ASCII/Unicode number."
    },
    {
      "type": "text_char_code_at",
      "message0": "char code from %1 at %2",
      "args0": [
        { "type": "input_value", "name": "TEXT", "check": "String" },
        { "type": "input_value", "name": "AT", "check": "Number" }
      ],
      "inputsInline": true,
      "output": "Number",
      "style": "text_blocks",
      "tooltip": "Gets the character code (ASCII/Unicode) from a specific position in the text."
    },

    // List Blocks
    {
      "type": "lists_get_random_item",
      "message0": "get random value from %1",
      "args0": [
        {
          "type": "input_value",
          "name": "LIST",
          "check": "Array"
        }
      ],
      "output": null,
      "style": "lists_blocks",
      "tooltip": "Returns a random item from the list."
    },

    {
      "type": "colour_picker",
      "message0": "%1",
      "args0": [{ "type": "field_colour", "name": "COLOUR", "colour": "#ff0000" }],
      "output": "Colour",
      "style": "colour_blocks",
      "tooltip": "Choose a colour."
    },
    {
      "type": "colour_random",
      "message0": "random colour",
      "output": "Colour",
      "style": "colour_blocks",
      "tooltip": "Generates a random colour."
    },
    {
      "type": "colour_rgb",
      "message0": "colour with red %1 green %2 blue %3",
      "args0": [
        { "type": "input_value", "name": "RED", "check": "Number", "align": "RIGHT" },
        { "type": "input_value", "name": "GREEN", "check": "Number", "align": "RIGHT" },
        { "type": "input_value", "name": "BLUE", "check": "Number", "align": "RIGHT" }
      ],
      "output": "Colour",
      "style": "colour_blocks",
      "tooltip": "Create a colour with the specified amounts of red, green, and blue.",
      "inputsInline": true
    }
];

Blockly.defineBlocksWithJsonArray(blockDefinitions);