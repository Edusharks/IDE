// src/renderer/blockly/face-landmark-blocks.js (REWORKED & ENHANCED)

import * as Blockly from 'blockly/core';

export function registerFaceLandmarkBlocks() {

'use strict';

const FACE_LANDMARK_BLOCK_STYLE = 'face_landmark_blocks';

const EXPRESSION_OPTIONS = [
    ["any face", "ANY_FACE"],
    ["smiling", "SMILING"],
    ["jaw open", "JAW_OPEN"],
    ["left eye closed (wink)", "LEFT_EYE_CLOSED"],
    ["right eye closed (wink)", "RIGHT_EYE_CLOSED"],
    ["puckering mouth", "PUCKERING"],
    ["frowning / lips pressed", "FROWNING"], // NEW
    ["squinting", "SQUINTING"],             // NEW
    ["mouth 'O' shape", "MOUTH_O"]        // NEW
];

// NEW: A comprehensive list of all blendshapes for the advanced block.
const ALL_BLENDSHAPE_OPTIONS = [
    ["Brow Down Left", "browDownLeft"], ["Brow Down Right", "browDownRight"], ["Brow Inner Up", "browInnerUp"],
    ["Brow Outer Up Left", "browOuterUpLeft"], ["Brow Outer Up Right", "browOuterUpRight"],
    ["Cheek Puff", "cheekPuff"], ["Cheek Squint Left", "cheekSquintLeft"], ["Cheek Squint Right", "cheekSquintRight"],
    ["Eye Blink Left", "eyeBlinkLeft"], ["Eye Blink Right", "eyeBlinkRight"], ["Eye Look Down Left", "eyeLookDownLeft"],
    ["Eye Look Down Right", "eyeLookDownRight"], ["Eye Look In Left", "eyeLookInLeft"], ["Eye Look In Right", "eyeLookInRight"],
    ["Eye Look Out Left", "eyeLookOutLeft"], ["Eye Look Out Right", "eyeLookOutRight"], ["Eye Look Up Left", "eyeLookUpLeft"],
    ["Eye Look Up Right", "eyeLookUpRight"], ["Eye Squint Left", "eyeSquintLeft"], ["Eye Squint Right", "eyeSquintRight"],
    ["Eye Wide Left", "eyeWideLeft"], ["Eye Wide Right", "eyeWideRight"], ["Jaw Forward", "jawForward"], ["Jaw Left", "jawLeft"],
    ["Jaw Open", "jawOpen"], ["Jaw Right", "jawRight"], ["Mouth Close", "mouthClose"], ["Mouth Dimple Left", "mouthDimpleLeft"],
    ["Mouth Dimple Right", "mouthDimpleRight"], ["Mouth Frown Left", "mouthFrownLeft"], ["Mouth Frown Right", "mouthFrownRight"],
    ["Mouth Funnel", "mouthFunnel"], ["Mouth Lower Down Left", "mouthLowerDownLeft"], ["Mouth Lower Down Right", "mouthLowerDownRight"],
    ["Mouth Press Left", "mouthPressLeft"], ["Mouth Press Right", "mouthPressRight"], ["Mouth Pucker", "mouthPucker"],
    ["Mouth Roll Lower", "mouthRollLower"], ["Mouth Roll Upper", "mouthRollUpper"], ["Mouth Shrug Lower", "mouthShrugLower"],
    ["Mouth Shrug Upper", "mouthShrugUpper"], ["Mouth Smile Left", "mouthSmileLeft"], ["Mouth Smile Right", "mouthSmileRight"],
    ["Mouth Stretch Left", "mouthStretchLeft"], ["Mouth Stretch Right", "mouthStretchRight"], ["Mouth Upper Up Left", "mouthUpperUpLeft"],
    ["Mouth Upper Up Right", "mouthUpperUpRight"], ["Nose Sneer Left", "noseSneerLeft"], ["Nose Sneer Right", "noseSneerRight"]
];


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
        "message0": "when face expression %1 is detected",
        "args0": [{ "type": "field_dropdown", "name": "EXPRESSION", "options": EXPRESSION_OPTIONS }],
        "message1": "%1",
        "args1": [{ "type": "input_statement", "name": "DO" }],
        "style": FACE_LANDMARK_BLOCK_STYLE,
        "tooltip": "Runs code when a specific face or expression is seen by the camera."
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
        "message0": "is face %1 with sensitivity %2 %%",
        "args0": [
            { "type": "field_dropdown", "name": "EXPRESSION", "options": EXPRESSION_OPTIONS.filter(o => o[1] !== 'ANY_FACE') }, // Don't include 'any face' here
            { "type": "input_value", "name": "THRESHOLD", "check": "Number", "shadow": { "type": "math_number", "fields": { "NUM": 50 } } }
        ],
        "output": "Boolean",
        "style": FACE_LANDMARK_BLOCK_STYLE,
        "tooltip": "Checks if the first detected face is making a specific expression with a certain confidence level (0-100).",
        "inputsInline": true
    },
    {
        "type": "face_landmark_get_blendshape_value",
        "message0": "get raw score for %1",
        "args0": [{
            "type": "field_dropdown",
            "name": "BLENDSHAPE",
            "options": ALL_BLENDSHAPE_OPTIONS
        }],
        "output": "Number",
        "style": FACE_LANDMARK_BLOCK_STYLE,
        "tooltip": "Gets the raw confidence score (0.0 to 1.0) for a specific facial blendshape."
    }
]);

}