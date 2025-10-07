// src/renderer/blockly/object-detection-blocks.js
'use strict';

const OBJECT_DETECTION_BLOCK_STYLE = 'object_detection_blocks';

const OBJECT_CLASSES = [
    ["person", "person"], ["bicycle", "bicycle"], ["car", "car"], ["motorcycle", "motorcycle"],
    ["airplane", "airplane"], ["bus", "bus"], ["train", "train"], ["truck", "truck"],
    ["boat", "boat"], ["traffic light", "traffic light"], ["fire hydrant", "fire hydrant"],
    ["stop sign", "stop sign"], ["parking meter", "parking meter"], ["bench", "bench"],
    ["bird", "bird"], ["cat", "cat"], ["dog", "dog"], ["horse", "horse"], ["sheep", "sheep"],
    ["cow", "cow"], ["elephant", "elephant"], ["bear", "bear"], ["zebra", "zebra"],
    ["giraffe", "giraffe"], ["backpack", "backpack"], ["umbrella", "umbrella"], ["handbag", "handbag"],
    ["tie", "tie"], ["suitcase", "suitcase"], ["frisbee", "frisbee"], ["skis", "skis"],
    ["snowboard", "snowboard"], ["sports ball", "sports ball"], ["kite", "kite"],
    ["baseball bat", "baseball bat"], ["baseball glove", "baseball glove"], ["skateboard", "skateboard"],
    ["surfboard", "surfboard"], ["tennis racket", "tennis racket"], ["bottle", "bottle"],
    ["wine glass", "wine glass"], ["cup", "cup"], ["fork", "fork"], ["knife", "knife"],
    ["spoon", "spoon"], ["bowl", "bowl"], ["banana", "banana"], ["apple", "apple"],
    ["sandwich", "sandwich"], ["orange", "orange"], ["broccoli", "broccoli"], ["carrot", "carrot"],
    ["hot dog", "hot dog"], ["pizza", "pizza"], ["donut", "donut"], ["cake", "cake"],
    ["chair", "chair"], ["couch", "couch"], ["potted plant", "potted plant"], ["bed", "bed"],
    ["dining table", "dining table"], ["toilet", "toilet"], ["tv", "tv"], ["laptop", "laptop"],
    ["mouse", "mouse"], ["remote", "remote"], ["keyboard", "keyboard"], ["cell phone", "cell phone"],
    ["microwave", "microwave"], ["oven", "oven"], ["toaster", "toaster"], ["sink", "sink"],
    ["refrigerator", "refrigerator"], ["book", "book"], ["clock", "clock"], ["vase", "vase"],
    ["scissors", "scissors"], ["teddy bear", "teddy bear"], ["hair drier", "hair drier"],
    ["toothbrush", "toothbrush"]
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
        "tooltip": "Runs the code inside for every detected object of the selected type."
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
        "tooltip": "Gets a property of the object currently being looped over. Must be placed inside a 'for each' block."
    }
]);