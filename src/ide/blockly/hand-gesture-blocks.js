// src/renderer/blockly/hand-gesture-blocks.js

import * as Blockly from 'blockly/core';

export function registerHandGestureBlocks() {

'use strict';

const HAND_GESTURE_BLOCK_STYLE = 'hand_gesture_blocks';

const GESTURE_OPTIONS = [
    ["👍 Thumbs Up", "Thumb_Up"],
    ["👎 Thumbs Down", "Thumb_Down"],
    ["✊ Closed Fist", "Closed_Fist"],
    ["✋ Open Palm", "Open_Palm"],
    ["👆 Pointing Up", "Pointing_Up"],
    ["✌️ Victory", "Victory"],
    ["🤟 I Love You", "ILoveYou"]
];

Blockly.defineBlocksWithJsonArray([
    {
        "type": "hand_gesture_enable",
        "message0": "enable hand tracking %1",
        "args0": [{ "type": "field_dropdown", "name": "STATE", "options": [["ON", "ON"], ["OFF", "OFF"]] }],
        "previousStatement": null,
        "nextStatement": null,
        "style": HAND_GESTURE_BLOCK_STYLE,
        "tooltip": "Turns the camera and hand gesture model on or off in the browser."
    },
    {
        "type": "hand_gesture_on_gesture",
        "message0": "when hand gesture %1 is detected",
        "args0": [{ "type": "field_dropdown", "name": "GESTURE", "options": GESTURE_OPTIONS }],
        "message1": "%1",
        "args1": [{ "type": "input_statement", "name": "DO" }],
        "style": HAND_GESTURE_BLOCK_STYLE,
        "tooltip": "Runs code when a specific hand gesture is seen by the camera."
    },
    {
        "type": "hand_gesture_get_hand_count",
        "message0": "number of hands",
        "output": "Number",
        "style": HAND_GESTURE_BLOCK_STYLE,
        "tooltip": "Gets the total number of hands detected in the camera view."
    },
    {
        "type": "hand_gesture_is_hand_present",
        "message0": "is a %1 hand detected?",
        "args0": [{
            "type": "field_dropdown",
            "name": "HANDEDNESS",
            "options": [["left", "Left"], ["right", "Right"], ["any", "Any"]]
        }],
        "output": "Boolean",
        "style": HAND_GESTURE_BLOCK_STYLE,
        "tooltip": "Checks if a specific hand (or any hand) is visible."
    }
]);

}