// src/renderer/blockly/face-landmark-blocks.js
'use strict';

const FACE_LANDMARK_BLOCK_STYLE = 'face_landmark_blocks';

const BLENDSHAPES = [
  // Eyebrows
  ['browDownLeft', 'browDownLeft'], ['browDownRight', 'browDownRight'],
  ['browInnerUp', 'browInnerUp'], ['browOuterUpLeft', 'browOuterUpLeft'],
  ['browOuterUpRight', 'browOuterUpRight'],
  // Eyes
  ['eyeBlinkLeft', 'eyeBlinkLeft'], ['eyeBlinkRight', 'eyeBlinkRight'],
  ['eyeLookDownLeft', 'eyeLookDownLeft'], ['eyeLookDownRight', 'eyeLookDownRight'],
  ['eyeLookInLeft', 'eyeLookInLeft'], ['eyeLookInRight', 'eyeLookInRight'],
  ['eyeLookOutLeft', 'eyeLookOutLeft'], ['eyeLookOutRight', 'eyeLookOutRight'],
  ['eyeLookUpLeft', 'eyeLookUpLeft'], ['eyeLookUpRight', 'eyeLookUpRight'],
  ['eyeSquintLeft', 'eyeSquintLeft'], ['eyeSquintRight', 'eyeSquintRight'],
  ['eyeWideLeft', 'eyeWideLeft'], ['eyeWideRight', 'eyeWideRight'],
  // Jaw and Mouth
  ['jawForward', 'jawForward'], ['jawLeft', 'jawLeft'], ['jawOpen', 'jawOpen'],
  ['jawRight', 'jawRight'], ['mouthClose', 'mouthClose'],
  ['mouthDimpleLeft', 'mouthDimpleLeft'], ['mouthDimpleRight', 'mouthDimpleRight'],
  ['mouthFrownLeft', 'mouthFrownLeft'], ['mouthFrownRight', 'mouthFrownRight'],
  ['mouthFunnel', 'mouthFunnel'], ['mouthLeft', 'mouthLeft'],
  ['mouthLowerDownLeft', 'mouthLowerDownLeft'], ['mouthLowerDownRight', 'mouthLowerDownRight'],
  ['mouthPressLeft', 'mouthPressLeft'], ['mouthPressRight', 'mouthPressRight'],
  ['mouthPucker', 'mouthPucker'], ['mouthRight', 'mouthRight'],
  ['mouthRollLower', 'mouthRollLower'], ['mouthRollUpper', 'mouthRollUpper'],
  ['mouthShrugLower', 'mouthShrugLower'], ['mouthShrugUpper', 'mouthShrugUpper'],
  ['mouthSmileLeft', 'mouthSmileLeft'], ['mouthSmileRight', 'mouthSmileRight'],
  ['mouthStretchLeft', 'mouthStretchLeft'], ['mouthStretchRight', 'mouthStretchRight'],
  ['mouthUpperUpLeft', 'mouthUpperUpLeft'], ['mouthUpperUpRight', 'mouthUpperUpRight'],
  // Cheeks and Nose
  ['cheekPuff', 'cheekPuff'], ['cheekSquintLeft', 'cheekSquintLeft'],
  ['cheekSquintRight', 'cheekSquintRight'], ['noseSneerLeft', 'noseSneerLeft'],
  ['noseSneerRight', 'noseSneerRight']
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
        "type": "face_landmark_on_results",
        "message0": "when face data is received",
        "message1": "%1",
        "args1": [{ "type": "input_statement", "name": "DO" }],
        "style": FACE_LANDMARK_BLOCK_STYLE,
        "tooltip": "Runs code on the board when new data arrives from the browser's face landmark detection."
    },
    {
        "type": "face_landmark_get_face_count",
        "message0": "number of faces detected",
        "output": "Number",
        "style": FACE_LANDMARK_BLOCK_STYLE,
        "tooltip": "Gets the number of detected faces from the last received data packet."
    },
    // --- NEW Expression Blocks ---
    {
        "type": "face_landmark_get_expression_value",
        "message0": "get value of expression %1",
        "args0": [{ "type": "field_dropdown", "name": "EXPRESSION", "options": BLENDSHAPES }],
        "output": "Number",
        "style": FACE_LANDMARK_BLOCK_STYLE,
        "tooltip": "Gets the numerical value (0.0 to 1.0) of a specific facial expression."
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
                ["left eye closed", "LEFT_EYE_CLOSED"],
                ["right eye closed", "RIGHT_EYE_CLOSED"],
                ["puckering mouth", "PUCKERING"]
            ]
        }],
        "output": "Boolean",
        "style": FACE_LANDMARK_BLOCK_STYLE,
        "tooltip": "Checks if a common facial expression is currently active (based on a threshold)."
    }
]);