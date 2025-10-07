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

    // Clour Blocks 

{
  "type": "colour_from_hex",
  "message0": "create colour with hex %1",
  "args0": [
    {
      "type": "input_value",
      "name": "HEX",
      "check": "String"
    }
  ],
  "output": "Colour",
  "style": "colour_blocks",
  "tooltip": "Creates a color from a hexadecimal web code (e.g., #FF0000 for red)."
},
{
  "type": "colour_blend",
  "message0": "blend colour %1 with %2 ratio %3",
  "args0": [
    { "type": "input_value", "name": "COLOUR1", "check": "Colour" },
    { "type": "input_value", "name": "COLOUR2", "check": "Colour" },
    { "type": "input_value", "name": "RATIO", "check": "Number" }
  ],
  "output": "Colour",
  "style": "colour_blocks",
  "tooltip": "Blends two colors. A ratio of 0 is the first color, 0.5 is an even mix, 1 is the second color.",
  "inputsInline": true
},
{
  "type": "colour_get_component",
  "message0": "get %1 component of %2",
  "args0": [
    {
      "type": "field_dropdown",
      "name": "COMPONENT",
      "options": [ ["red", "0"], ["green", "1"], ["blue", "2"] ]
    },
    { "type": "input_value", "name": "COLOUR", "check": "Colour" }
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
    { "type": "input_value", "name": "RED", "check": "Number" },
    { "type": "input_value", "name": "GREEN", "check": "Number" },
    { "type": "input_value", "name": "BLUE", "check": "Number" }
  ],
  "inputsInline": true,
  "output": "Colour",
  "style": "colour_blocks",
  "tooltip": "Creates a color from individual Red, Green, and Blue component values (0-255)."
}



];

Blockly.defineBlocksWithJsonArray(blockDefinitions);