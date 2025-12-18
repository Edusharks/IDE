// src/renderer/blockly/object-detection-blocks.js (REWORKED)

import * as Blockly from 'blockly/core';

export function registerObjectDetectionBlocks() {

'use strict';

const OBJECT_DETECTION_BLOCK_STYLE = 'object_detection_blocks';

// A reduced, more focused list for the dropdowns.
const OBJECT_CLASSES = [
    ["person", "person"], ["bicycle", "bicycle"], ["car", "car"], ["motorcycle", "motorcycle"],
    ["bird", "bird"], ["cat", "cat"], ["dog", "dog"], ["sports ball", "sports ball"],
    ["bottle", "bottle"], ["wine glass", "wine glass"], ["cup", "cup"], ["fork", "fork"],
    ["knife", "knife"], ["spoon", "spoon"], ["bowl", "bowl"], ["banana", "banana"],
    ["apple", "apple"], ["sandwich", "sandwich"], ["orange", "orange"], ["chair", "chair"],
    ["couch", "couch"], ["potted plant", "potted plant"], ["bed", "bed"], ["dining table", "dining table"],
    ["toilet", "toilet"], ["tv", "tv"], ["laptop", "laptop"], ["mouse", "mouse"],
    ["remote", "remote"], ["keyboard", "keyboard"], ["cell phone", "cell phone"], ["book", "book"],
    ["clock", "clock"], ["vase", "vase"], ["scissors", "scissors"], ["teddy bear", "teddy bear"]
];

Blockly.defineBlocksWithJsonArray([
    {
        "type": "object_detection_enable",
        "message0": "enable object detection %1",
        "args0": [{ "type": "field_dropdown", "name": "STATE", "options": [["ON", "ON"], ["OFF", "OFF"]] }],
        "previousStatement": null,
        "nextStatement": null,
        "style": OBJECT_DETECTION_BLOCK_STYLE,
        "tooltip": "Turns the camera and object detection model on or off in the browser."
    },
    // NEW: The event-driven hat block
    {
        "type": "object_detection_on_object",
        "message0": "when object %1 is detected",
        "args0": [{ "type": "field_dropdown", "name": "OBJECT_CLASS", "options": OBJECT_CLASSES }],
        "message1": "%1",
        "args1": [{ "type": "input_statement", "name": "DO" }],
        "style": OBJECT_DETECTION_BLOCK_STYLE,
        "tooltip": "Runs the code inside for every detected object of the selected type, each time new data arrives."
    },
    {
        "type": "object_detection_is_object_detected",
        "message0": "is a %1 detected?",
        "args0": [{ "type": "field_dropdown", "name": "OBJECT_CLASS", "options": OBJECT_CLASSES }],
        "output": "Boolean",
        "style": OBJECT_DETECTION_BLOCK_STYLE,
        "tooltip": "Checks if at least one of a specific object is visible."
    },
    {
        "type": "object_detection_for_each",
        "message0": "for each %1 detected",
        "args0": [{ "type": "field_dropdown", "name": "OBJECT_CLASS", "options": OBJECT_CLASSES }],
        "message1": "%1",
        "args1": [{ "type": "input_statement", "name": "DO" }],
        "previousStatement": null,
        "nextStatement": null,
        "style": OBJECT_DETECTION_BLOCK_STYLE,
        "tooltip": "Runs the code inside a loop for every detected object. Must be placed inside a 'forever' block."
    },
    {
        "type": "object_detection_get_property",
        "message0": "get %1 of current object",
        "args0": [{
            "type": "field_dropdown",
            "name": "PROPERTY",
            "options": [
                ["x position (center)", "x"],
                ["y position (center)", "y"],
                ["width", "width"],
                ["height", "height"],
                ["confidence score", "score"]
            ]
        }],
        "output": "Number",
        "style": OBJECT_DETECTION_BLOCK_STYLE,
        "tooltip": "Gets a property of the object currently being looped over. Must be placed inside a 'for each' or 'when object' block."
    }
]);

}