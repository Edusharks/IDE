// src/renderer/blockly/face-landmark-blocks.js
'use strict';

const FACE_LANDMARK_BLOCK_STYLE = 'face_landmark_blocks';

Blockly.defineBlocksWithJsonArray([
    {
        "type": "face_landmark_enable",
        "message0": "enable face detection %1",
        "args0": [{ "type": "field_dropdown", "name": "STATE", "options": [["ON", "ON"], ["OFF", "OFF"]] }],
        "previousStatement": null,
        "nextStatement": null,
        "style": FACE_LANDMARK_BLOCK_STYLE,
        "tooltip": "Turns the camera and face detection model on or off in the browser."
    },
    {
        "type": "face_landmark_on_face_data",
        "message0": "when face is detected",
        "message1": "%1",
        "args1": [{ "type": "input_statement", "name": "DO" }],
        "style": FACE_LANDMARK_BLOCK_STYLE,
        "tooltip": "Runs code inside whenever at least one face is detected."
    },
    {
        "type": "face_landmark_get_face_count",
        "message0": "number of faces",
        "output": "Number",
        "style": FACE_LANDMARK_BLOCK_STYLE,
        "tooltip": "Gets the total number of faces currently detected."
    },
    {
        "type": "face_landmark_is_expression",
        "message0": "is face %1 ?",
        "args0": [{
            "type": "field_dropdown",
            "name": "EXPRESSION",
            "options": [
                ["smiling", "SMILING"],
                ["jaw open", "JAW_OPEN"],
                ["left eye closed (wink)", "LEFT_EYE_CLOSED"],
                ["right eye closed (wink)", "RIGHT_EYE_CLOSED"],
                ["puckering mouth", "PUCKERING"]
            ]
        }],
        "output": "Boolean",
        "style": FACE_LANDMARK_BLOCK_STYLE,
        "tooltip": "Checks if the first detected face is making a specific expression."
    }
]);