// src/ide/blockly/communication_blocks.js
import * as Blockly from 'blockly/core';

export function registerCommunicationBlocks() {
    const COMM_STYLE = 'communication_blocks'; 

    const blocks = [
        // --- CONSOLE OUTPUT ---
        {
            "type": "comm_print_line",
            "message0": "console print line %1",
            "args0": [{ 
                "type": "input_value", 
                "name": "DATA", 
                "check": ["String", "Number", "Boolean"], 
                "shadow": { "type": "text", "fields": { "TEXT": "Hello World" } } 
            }],
            "inputsInline": true,
            "previousStatement": null,
            "nextStatement": null,
            "style": COMM_STYLE,
            "tooltip": "Prints text to the console followed by a new line."
        },
        {
            "type": "comm_print_no_newline",
            "message0": "console print %1 (no new line)",
            "args0": [{ 
                "type": "input_value", 
                "name": "DATA", 
                "check": ["String", "Number", "Boolean"], 
                "shadow": { "type": "text", "fields": { "TEXT": "Data: " } } 
            }],
            "inputsInline": true,
            "previousStatement": null,
            "nextStatement": null,
            "style": COMM_STYLE,
            "tooltip": "Prints text without moving to the next line. Useful for building sentences."
        },
        {
            "type": "comm_print_value",
            "message0": "console print label %1 = value %2",
            "args0": [
                { "type": "input_value", "name": "NAME", "check": "String", "shadow": { "type": "text", "fields": { "TEXT": "Sensor" } } },
                { "type": "input_value", "name": "VALUE", "check": ["String", "Number", "Boolean"], "shadow": { "type": "math_number", "fields": { "NUM": 0 } } }
            ],
            "inputsInline": true,
            "previousStatement": null,
            "nextStatement": null,
            "style": COMM_STYLE,
            "tooltip": "Prints a label and value formatted as 'Label = Value'."
        },

        // --- CONSOLE INPUT ---
        {
            "type": "comm_read_line",
            "message0": "wait for text input from console",
            "output": "String",
            "style": COMM_STYLE,
            "tooltip": "Pauses the program and waits for the user to type something in the console."
        },

        // --- PLOTTER ---
        {
            "type": "comm_plot_simple",
            "message0": "plot number %1",
            "args0": [
                { "type": "input_value", "name": "VALUE", "check": "Number", "shadow": { "type": "math_number", "fields": { "NUM": 0 } } }
            ],
            "inputsInline": true,
            "previousStatement": null,
            "nextStatement": null,
            "style": COMM_STYLE,
            "tooltip": "Quickly graphs a number on the Live Plotter."
        },
        {
            "type": "comm_plot_advanced",
            "message0": "plot value %1 name %2 color %3",
            "args0": [
                { "type": "input_value", "name": "VALUE", "check": "Number", "shadow": { "type": "math_number", "fields": { "NUM": 0 } } },
                { "type": "input_value", "name": "NAME", "check": "String", "shadow": { "type": "text", "fields": { "TEXT": "Series1" } } },
                { "type": "field_colour_hsv_sliders", "name": "COLOR", "colour": "#5a67d8" }
            ],
            "inputsInline": true,
            "previousStatement": null,
            "nextStatement": null,
            "style": COMM_STYLE,
            "tooltip": "Graphs a named value with a specific color on the Live Plotter."
        },

        // --- AI INTEGRATION ---
        {
            "type": "comm_send_ai_command",
            "message0": "send IDE command %1 param %2",
            "args0": [
                { 
                    "type": "field_dropdown", 
                    "name": "COMMAND", 
                    "options": [ 
                        ["Toggle Camera", "toggle_camera"], 
                        ["Turn Camera ON", "camera_on"], 
                        ["Turn Camera OFF", "camera_off"], 
                        ["Monitor Face Landmarks", "monitor_face"], 
                        ["Monitor Hand Gestures", "monitor_hand"], 
                        ["Monitor Object Detection", "monitor_detection"], 
                        ["Monitor Image Classification", "monitor_classification"], 
                        ["Stop Monitoring", "monitor_stop"] 
                    ] 
                },
                { "type": "input_value", "name": "PARAM", "check": "String", "shadow": { "type": "text", "fields": { "TEXT": "" } } }
            ],
            "inputsInline": true,
            "previousStatement": null,
            "nextStatement": null,
            "style": COMM_STYLE,
            "tooltip": "Sends commands back to the IDE to control features like the AI Camera."
        }
    ];

    Blockly.defineBlocksWithJsonArray(blocks);
}