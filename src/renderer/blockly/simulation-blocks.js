// src/renderer/blockly/simulation-blocks.js
'use strict';

Blockly.defineBlocksWithJsonArray([
    // =================================================================
    // MOTION BLOCKS
    // =================================================================
    { "type": "motion_move_steps", "message0": "move %1 steps", "args0": [{ "type": "input_value", "name": "STEPS", "check": "Number" }], "previousStatement": null, "nextStatement": null, "style": "motion_blocks" },
    { "type": "motion_turn_right", "message0": "turn ↻ %1 degrees", "args0": [{ "type": "input_value", "name": "DEGREES", "check": "Number" }], "previousStatement": null, "nextStatement": null, "style": "motion_blocks" },
    { "type": "motion_turn_left", "message0": "turn ↺ %1 degrees", "args0": [{ "type": "input_value", "name": "DEGREES", "check": "Number" }], "previousStatement": null, "nextStatement": null, "style": "motion_blocks" },
    { "type": "motion_go_to_xy", "message0": "go to x: %1 y: %2", "args0": [{ "type": "input_value", "name": "X", "check": "Number" }, { "type": "input_value", "name": "Y", "check": "Number" }], "previousStatement": null, "nextStatement": null, "style": "motion_blocks", "inputsInline": true },
    { "type": "motion_point_in_direction", "message0": "point in direction %1", "args0": [{ "type": "input_value", "name": "DIRECTION", "check": "Number" }], "previousStatement": null, "nextStatement": null, "style": "motion_blocks" },
    { "type": "motion_change_x_by", "message0": "change x by %1", "args0": [{"type": "input_value", "name": "DX", "check": "Number"}], "previousStatement": null, "nextStatement": null, "style": "motion_blocks"},
    { "type": "motion_set_x_to", "message0": "set x to %1", "args0": [{"type": "input_value", "name": "X", "check": "Number"}], "previousStatement": null, "nextStatement": null, "style": "motion_blocks"},
    { "type": "motion_change_y_by", "message0": "change y by %1", "args0": [{"type": "input_value", "name": "DY", "check": "Number"}], "previousStatement": null, "nextStatement": null, "style": "motion_blocks"},
    { "type": "motion_set_y_to", "message0": "set y to %1", "args0": [{"type": "input_value", "name": "Y", "check": "Number"}], "previousStatement": null, "nextStatement": null, "style": "motion_blocks"},
    { "type": "motion_set_rotation_style", "message0": "set rotation style %1", "args0": [{"type": "field_dropdown", "name": "STYLE", "options": [["left-right", "left-right"], ["don't rotate", "don't rotate"], ["all around", "all around"]]}], "previousStatement": null, "nextStatement": null, "style": "motion_blocks"},
    { "type": "motion_go_to_layer", "message0": "go to %1 layer", "args0": [{"type": "field_dropdown", "name": "LAYER", "options": [["front", "front"], ["back", "back"]]}], "previousStatement": null, "nextStatement": null, "style": "motion_blocks" },
    { "type": "motion_go_layer_by", "message0": "go %1 %2 layers", "args0": [{"type": "field_dropdown", "name": "DIRECTION", "options": [["forward", "forward"], ["backward", "backward"]]}, {"type": "input_value", "name": "NUM", "check": "Number"}], "previousStatement": null, "nextStatement": null, "style": "motion_blocks", "inputsInline": true },


    // =================================================================
    // LOOKS BLOCKS
    // =================================================================
    { "type": "looks_say_for_seconds", "message0": "say %1 for %2 seconds", "args0": [{ "type": "input_value", "name": "MESSAGE" }, { "type": "input_value", "name": "SECS", "check": "Number" }], "previousStatement": null, "nextStatement": null, "style": "looks_blocks", "inputsInline": true },
    { "type": "looks_say", "message0": "say %1", "args0": [{ "type": "input_value", "name": "MESSAGE" }], "previousStatement": null, "nextStatement": null, "style": "looks_blocks" },
    { "type": "looks_think_for_seconds", "message0": "think %1 for %2 seconds", "args0": [{ "type": "input_value", "name": "MESSAGE" }, { "type": "input_value", "name": "SECS", "check": "Number" }], "previousStatement": null, "nextStatement": null, "style": "looks_blocks", "inputsInline": true },
    { "type": "looks_think", "message0": "think %1", "args0": [{ "type": "input_value", "name": "MESSAGE" }], "previousStatement": null, "nextStatement": null, "style": "looks_blocks" },
    { "type": "looks_switch_costume_to", "message0": "switch costume to %1", "args0": [{"type": "input_value", "name": "COSTUME", "check": ["String", "Number"]}], "previousStatement": null, "nextStatement": null, "style": "looks_blocks" },
    { "type": "looks_next_costume", "message0": "next costume", "previousStatement": null, "nextStatement": null, "style": "looks_blocks" },
    { "type": "looks_switch_backdrop_to", "message0": "switch backdrop to %1", "args0": [{"type": "input_value", "name": "BACKDROP", "check": ["String", "Number"]}], "previousStatement": null, "nextStatement": null, "style": "looks_blocks" },
    { "type": "looks_next_backdrop", "message0": "next backdrop", "previousStatement": null, "nextStatement": null, "style": "looks_blocks" },
    { "type": "looks_costume_number_name", "message0": "costume %1", "args0": [{"type": "field_dropdown", "name": "NUMBER_NAME", "options": [["number", "number"],["name", "name"]]}], "output": ["Number", "String"], "style": "looks_blocks", "outputShape": Blockly.OUTPUT_SHAPE_ROUND },
    { "type": "looks_backdrop_number_name", "message0": "backdrop %1", "args0": [{"type": "field_dropdown", "name": "NUMBER_NAME", "options": [["number", "number"],["name", "name"]]}], "output": ["Number", "String"], "style": "looks_blocks", "outputShape": Blockly.OUTPUT_SHAPE_ROUND },
    { "type": "looks_show", "message0": "show", "previousStatement": null, "nextStatement": null, "style": "looks_blocks" },
    { "type": "looks_hide", "message0": "hide", "previousStatement": null, "nextStatement": null, "style": "looks_blocks" },
    { "type": "looks_change_size_by", "message0": "change size by %1", "args0": [{ "type": "input_value", "name": "CHANGE", "check": "Number" }], "previousStatement": null, "nextStatement": null, "style": "looks_blocks" },
    { "type": "looks_set_size_to", "message0": "set size to %1 %%", "args0": [{ "type": "input_value", "name": "SIZE", "check": "Number" }], "previousStatement": null, "nextStatement": null, "style": "looks_blocks" },
    { "type": "looks_change_effect_by", "message0": "change %1 effect by %2", "args0": [{"type": "field_dropdown", "name": "EFFECT", "options": [["color", "color"],["ghost", "ghost"]]},{"type": "input_value", "name": "CHANGE", "check": "Number"}], "previousStatement": null, "nextStatement": null, "style": "looks_blocks" },
    { "type": "looks_set_effect_to", "message0": "set %1 effect to %2", "args0": [{"type": "field_dropdown", "name": "EFFECT", "options": [["color", "color"],["ghost", "ghost"]]},{"type": "input_value", "name": "VALUE", "check": "Number"}], "previousStatement": null, "nextStatement": null, "style": "looks_blocks" },
    { "type": "looks_clear_graphic_effects", "message0": "clear graphic effects", "previousStatement": null, "nextStatement": null, "style": "looks_blocks" },
    { "type": "looks_switch_backdrop_to", "message0": "switch backdrop to %1", "args0": [{"type": "input_value", "name": "BACKDROP", "check": ["String", "Number"]}], "previousStatement": null, "nextStatement": null, "style": "looks_blocks" },
    { "type": "looks_next_backdrop", "message0": "next backdrop", "previousStatement": null, "nextStatement": null, "style": "looks_blocks" },
    { "type": "looks_backdrop_number_name", "message0": "backdrop %1", "args0": [{"type": "field_dropdown", "name": "NUMBER_NAME", "options": [["number", "number"],["name", "name"]]}], "output": ["Number", "String"], "style": "looks_blocks", "outputShape": Blockly.OUTPUT_SHAPE_ROUND },

    // =================================================================
    // SOUND BLOCKS
    // =================================================================
    { "type": "sound_play_until_done", "message0": "play sound %1 until done", "args0": [{ "type": "field_dropdown", "name": "SOUND", "options": [["Meow", "src/renderer/assets/sounds/meow.mp3"], ["Boing", "src/renderer/assets/sounds/boing.mp3"]] }], "previousStatement": null, "nextStatement": null, "style": "sound_blocks" },
    {
      "type": "sound_start_sound",
      "message0": "start sound %1",
      "args0": [{
        "type": "field_dropdown",
        "name": "SOUND",
        "options": [
          ["Meow", "src/renderer/assets/sounds/meow.wav"],
          ["Boing", "src/renderer/assets/sounds/boing.mp3"]
        ]
      }],
      "previousStatement": null,
      "nextStatement": null,
      "style": "sound_blocks"
    },
    {
      "type": "sound_stop_all_sounds",
      "message0": "stop all sounds",
      "previousStatement": null,
      "nextStatement": null,
      "style": "sound_blocks"
    },
    
    // =================================================================
    // EVENTS BLOCKS
    // =================================================================
    { "type": "event_when_green_flag_clicked", "message0": "when %1 clicked", "args0": [{ "type": "field_image", "src": "src/renderer/assets/green-flag.png", "width": 24, "height": 24, "alt": "green flag" }], "message1": "%1", "args1": [{"type": "input_statement", "name": "DO"}], "style": "event_blocks"},
    { "type": "event_when_key_pressed", "message0": "when %1 key pressed", "args0": [{"type": "field_dropdown", "name": "KEY_OPTION", "options": [["space", " "], ["up arrow", "ArrowUp"], ["down arrow", "ArrowDown"], ["right arrow", "ArrowRight"], ["left arrow", "ArrowLeft"], ["any", "any"], ["a", "a"],["b", "b"],["c", "c"],["d", "d"],["e", "e"],["f", "f"],["g", "g"],["h", "h"],["i", "i"],["j", "j"],["k", "k"],["l", "l"],["m", "m"],["n", "n"],["o", "o"],["p", "p"],["q", "q"],["r", "r"],["s", "s"],["t", "t"],["u", "u"],["v", "v"],["w", "w"],["x", "x"],["y", "y"],["z", "z"],["0","0"],["1","1"],["2","2"],["3","3"],["4","4"],["5","5"],["6","6"],["7","7"],["8","8"],["9","9"]] }], "message1": "%1", "args1": [{"type": "input_statement", "name": "DO"}], "style": "event_blocks"},
    { "type": "event_when_this_sprite_clicked", "message0": "when this sprite clicked", "message1": "%1", "args1": [{"type": "input_statement", "name": "DO"}], "style": "event_blocks"},
    { "type": "event_when_backdrop_switches", "message0": "when backdrop switches to %1", "args0": [{"type": "input_value", "name": "BACKDROP", "check": "String"}], "message1": "%1", "args1": [{"type": "input_statement", "name": "DO"}], "style": "event_blocks"},
    { "type": "event_when_broadcast_received", "message0": "when I receive %1", "args0": [{"type": "field_variable", "name": "BROADCAST_OPTION"}], "message1": "%1", "args1": [{"type": "input_statement", "name": "DO"}], "style": "event_blocks"},
    { "type": "event_broadcast", "message0": "broadcast %1", "args0": [{"type": "input_value", "name": "BROADCAST_INPUT"}], "previousStatement": null, "nextStatement": null, "style": "event_blocks"},
    { "type": "event_broadcast_and_wait", "message0": "broadcast %1 and wait", "args0": [{"type": "input_value", "name": "BROADCAST_INPUT"}], "previousStatement": null, "nextStatement": null, "style": "event_blocks"},
    { "type": "event_when_backdrop_switches", "message0": "when backdrop switches to %1", "args0": [{"type": "input_value", "name": "BACKDROP", "check": "String"}], "message1": "%1", "args1": [{"type": "input_statement", "name": "DO"}], "style": "event_blocks", "isHat": true },

    // =================================================================
    // CONTROL BLOCKS
    // =================================================================
    { "type": "control_wait", "message0": "wait %1 seconds", "args0": [{ "type": "input_value", "name": "DURATION", "check": "Number" }], "previousStatement": null, "nextStatement": null, "style": "control_blocks" },
    { "type": "controls_forever", "message0": "forever %1 %2", "args0": [{ "type": "input_dummy" }, { "type": "input_statement", "name": "DO" }], "previousStatement": null, "style": "control_blocks" },
    { "type": "control_stop", "message0": "stop %1", "args0": [{ "type": "field_dropdown", "name": "STOP_OPTION", "options": [["all", "all"], ["this script", "this"]] }], "previousStatement": null, "style": "control_blocks" },
    {
      "type": "control_when_i_start_as_a_clone",
      "message0": "when I start as a clone",
      "message1": "%1",
      "args1": [{ "type": "input_statement", "name": "DO" }],
      "style": "control_blocks",
      "isHat": true
    },
    {
      "type": "control_create_clone_of",
      "message0": "create clone of %1",
      "args0": [{ "type": "input_value", "name": "CLONE_OPTION" }],
      "previousStatement": null,
      "nextStatement": null,
      "style": "control_blocks"
    },
    {
      "type": "control_delete_this_clone",
      "message0": "delete this clone",
      "previousStatement": null,
      "style": "control_blocks"
    },
    // =================================================================
    // SENSING BLOCKS
    // =================================================================
    // NEW: Sensing Blocks
    { "type": "sensing_touching", "message0": "touching %1?", "args0": [{"type": "input_value", "name": "TOUCHINGOBJECTMENU"}], "output": "Boolean", "style": "sensing_blocks", "outputShape": Blockly.OUTPUT_SHAPE_HEXAGONAL },
    { "type": "sensing_touchingobjectmenu", "message0": "%1", "args0": [{"type": "field_dropdown", "name": "TOUCHINGOBJECTMENU", "options": [["mouse-pointer", "_mouse_"], ["edge", "_edge_"], ["myself", "_myself_"]]}], "output": "String", "style": "sensing_blocks", "outputShape": Blockly.OUTPUT_SHAPE_ROUND, "extensions": ["output_string_converter"] },
    { "type": "sensing_distance_to", "message0": "distance to %1", "args0": [{"type": "input_value", "name": "DISTANCETOMENU"}], "output": "Number", "style": "sensing_blocks", "outputShape": Blockly.OUTPUT_SHAPE_ROUND },
    { "type": "sensing_distancetomenu", "message0": "%1", "args0": [{"type": "field_dropdown", "name": "DISTANCETOMENU", "options": [["mouse-pointer", "_mouse_"]]}], "output": "String", "style": "sensing_blocks", "outputShape": Blockly.OUTPUT_SHAPE_ROUND, "extensions": ["output_string_converter"] },
    { "type": "sensing_ask_and_wait", "message0": "ask %1 and wait", "args0": [{"type": "input_value", "name": "QUESTION", "check": "String"}], "previousStatement": null, "nextStatement": null, "style": "sensing_blocks" },
    { "type": "sensing_answer", "message0": "answer", "output": "String", "style": "sensing_blocks", "outputShape": Blockly.OUTPUT_SHAPE_ROUND },
    { "type": "sensing_key_pressed", "message0": "key %1 pressed?", "args0": [{"type": "input_value", "name": "KEY_OPTION"}], "output": "Boolean", "style": "sensing_blocks", "outputShape": Blockly.OUTPUT_SHAPE_HEXAGONAL },
    { "type": "sensing_keyoptions", "message0": "%1", "args0": [{"type": "field_dropdown", "name": "KEY_OPTION", "options": [["space", " "], ["up arrow", "ArrowUp"], ["down arrow", "ArrowDown"], ["right arrow", "ArrowRight"], ["left arrow", "ArrowLeft"], ["any", "any"], ["a", "a"],["b", "b"],["c", "c"],["d", "d"],["e", "e"],["f", "f"],["g", "g"],["h", "h"],["i", "i"],["j", "j"],["k", "k"],["l", "l"],["m", "m"],["n", "n"],["o", "o"],["p", "p"],["q", "q"],["r", "r"],["s", "s"],["t", "t"],["u", "u"],["v", "v"],["w", "w"],["x", "x"],["y", "y"],["z", "z"],["0","0"],["1","1"],["2","2"],["3","3"],["4", "4"],["5","5"],["6","6"],["7","7"],["8","8"],["9","9"]] }], "output": "String", "style": "sensing_blocks", "outputShape": Blockly.OUTPUT_SHAPE_ROUND, "extensions": ["output_string_converter"] },
    { "type": "sensing_mouse_x", "message0": "mouse x", "output": "Number", "style": "sensing_blocks", "outputShape": Blockly.OUTPUT_SHAPE_ROUND },
    { "type": "sensing_mouse_y", "message0": "mouse y", "output": "Number", "style": "sensing_blocks", "outputShape": Blockly.OUTPUT_SHAPE_ROUND },
    { "type": "sensing_mouse_down", "message0": "mouse down?", "output": "Boolean", "style": "sensing_blocks", "outputShape": Blockly.OUTPUT_SHAPE_HEXAGONAL },
    { "type": "sensing_timer", "message0": "timer", "output": "Number", "style": "sensing_blocks", "outputShape": Blockly.OUTPUT_SHAPE_ROUND },
    { "type": "sensing_resettimer", "message0": "reset timer", "previousStatement": null, "nextStatement": null, "style": "sensing_blocks" },
    
    // =================================================================
    // OPERATORS BLOCKS (Unchanged from original prompt)
    // =================================================================
    { "type": "operator_add", "message0": "%1 + %2", "args0": [{ "type": "input_value", "name": "NUM1" }, { "type": "input_value", "name": "NUM2" }], "output": "Number", "style": "operator_blocks", "inputsInline": true, "outputShape": Blockly.OUTPUT_SHAPE_ROUND },
    { "type": "operator_subtract", "message0": "%1 - %2", "args0": [{ "type": "input_value", "name": "NUM1" }, { "type": "input_value", "name": "NUM2" }], "output": "Number", "style": "operator_blocks", "inputsInline": true, "outputShape": Blockly.OUTPUT_SHAPE_ROUND },
    { "type": "operator_multiply", "message0": "%1 * %2", "args0": [{ "type": "input_value", "name": "NUM1" }, { "type": "input_value", "name": "NUM2" }], "output": "Number", "style": "operator_blocks", "inputsInline": true, "outputShape": Blockly.OUTPUT_SHAPE_ROUND },
    { "type": "operator_divide", "message0": "%1 / %2", "args0": [{ "type": "input_value", "name": "NUM1" }, { "type": "input_value", "name": "NUM2" }], "output": "Number", "style": "operator_blocks", "inputsInline": true, "outputShape": Blockly.OUTPUT_SHAPE_ROUND },
    { "type": "operator_random", "message0": "pick random %1 to %2", "args0": [{ "type": "input_value", "name": "FROM" }, { "type": "input_value", "name": "TO" }], "output": "Number", "style": "operator_blocks", "inputsInline": true, "outputShape": Blockly.OUTPUT_SHAPE_ROUND },
    { "type": "operator_lt", "message0": "%1 < %2", "args0": [{ "type": "input_value", "name": "OPERAND1" }, { "type": "input_value", "name": "OPERAND2" }], "output": "Boolean", "style": "operator_blocks", "inputsInline": true, "outputShape": Blockly.OUTPUT_SHAPE_HEXAGONAL },
    { "type": "operator_equals", "message0": "%1 = %2", "args0": [{ "type": "input_value", "name": "OPERAND1" }, { "type": "input_value", "name": "OPERAND2" }], "output": "Boolean", "style": "operator_blocks", "inputsInline": true, "outputShape": Blockly.OUTPUT_SHAPE_HEXAGONAL },
    { "type": "operator_gt", "message0": "%1 > %2", "args0": [{ "type": "input_value", "name": "OPERAND1" }, { "type": "input_value", "name": "OPERAND2" }], "output": "Boolean", "style": "operator_blocks", "inputsInline": true, "outputShape": Blockly.OUTPUT_SHAPE_HEXAGONAL },
    { "type": "operator_and", "message0": "%1 and %2", "args0": [{ "type": "input_value", "name": "OPERAND1", "check": "Boolean" }, { "type": "input_value", "name": "OPERAND2", "check": "Boolean" }], "output": "Boolean", "style": "operator_blocks", "inputsInline": true, "outputShape": Blockly.OUTPUT_SHAPE_HEXAGONAL },
    { "type": "operator_or", "message0": "%1 or %2", "args0": [{ "type": "input_value", "name": "OPERAND1", "check": "Boolean" }, { "type": "input_value", "name": "OPERAND2", "check": "Boolean" }], "output": "Boolean", "style": "operator_blocks", "inputsInline": true, "outputShape": Blockly.OUTPUT_SHAPE_HEXAGONAL },
    { "type": "operator_not", "message0": "not %1", "args0": [{ "type": "input_value", "name": "OPERAND", "check": "Boolean" }], "output": "Boolean", "style": "operator_blocks", "inputsInline": true, "outputShape": Blockly.OUTPUT_SHAPE_HEXAGONAL },
    { "type": "operator_join", "message0": "join %1 %2", "args0": [{ "type": "input_value", "name": "STRING1" }, { "type": "input_value", "name": "STRING2" }], "output": "String", "style": "operator_blocks", "inputsInline": true, "outputShape": Blockly.OUTPUT_SHAPE_ROUND },
    { "type": "operator_letter_of", "message0": "letter %1 of %2", "args0": [{ "type": "input_value", "name": "LETTER" }, { "type": "input_value", "name": "STRING" }], "output": "String", "style": "operator_blocks", "inputsInline": true, "outputShape": Blockly.OUTPUT_SHAPE_ROUND },
    { "type": "operator_length", "message0": "length of %1", "args0": [{ "type": "input_value", "name": "STRING" }], "output": "Number", "style": "operator_blocks", "inputsInline": true, "outputShape": Blockly.OUTPUT_SHAPE_ROUND },
    { "type": "operator_contains", "message0": "%1 contains %2?", "args0": [{ "type": "input_value", "name": "STRING1" }, { "type": "input_value", "name": "STRING2" }], "output": "Boolean", "style": "operator_blocks", "inputsInline": true, "outputShape": Blockly.OUTPUT_SHAPE_HEXAGONAL },
    { "type": "operator_mod", "message0": "%1 mod %2", "args0": [{ "type": "input_value", "name": "NUM1" }, { "type": "input_value", "name": "NUM2" }], "output": "Number", "style": "operator_blocks", "inputsInline": true, "outputShape": Blockly.OUTPUT_SHAPE_ROUND },
    { "type": "operator_round", "message0": "round %1", "args0": [{ "type": "input_value", "name": "NUM" }], "output": "Number", "style": "operator_blocks", "inputsInline": true, "outputShape": Blockly.OUTPUT_SHAPE_ROUND },
    { "type": "operator_mathop", "message0": "%1 of %2", "args0": [{ "type": "field_dropdown", "name": "OPERATOR", "options": [["abs", "ABS"],["floor", "FLOOR"],["ceiling", "CEILING"],["sqrt", "SQRT"],["sin", "SIN"],["cos", "COS"],["tan", "TAN"],["asin", "ASIN"],["acos", "ACOS"],["atan", "ATAN"],["ln", "LN"],["log", "LOG10"],["e ^", "EXP"],["10 ^", "POW10"]] }, { "type": "input_value", "name": "NUM" }], "output": "Number", "style": "operator_blocks", "inputsInline": true, "outputShape": Blockly.OUTPUT_SHAPE_ROUND },
  
    // =================================================================
    // PEN BLOCKS
    // =================================================================

    {
      "type": "pen_clear",
      "message0": "erase all",
      "previousStatement": null,
      "nextStatement": null,
      "style": "pen_blocks"
    },
    {
      "type": "pen_pen_down",
      "message0": "pen down",
      "previousStatement": null,
      "nextStatement": null,
      "style": "pen_blocks"
    },
    {
      "type": "pen_pen_up",
      "message0": "pen up",
      "previousStatement": null,
      "nextStatement": null,
      "style": "pen_blocks"
    },
    {
      "type": "pen_set_pen_color_to_color",
      "message0": "set pen color to %1",
      "args0": [
        {
          "type": "field_colour",
          "name": "COLOR",
          "colour": "#0000ff"
        }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "style": "pen_blocks"
    },
    {
      "type": "pen_change_pen_size_by",
      "message0": "change pen size by %1",
      "args0": [
        {
          "type": "input_value",
          "name": "SIZE",
          "check": "Number"
        }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "style": "pen_blocks"
    },
    {
      "type": "pen_set_pen_size_to",
      "message0": "set pen size to %1",
      "args0": [
        {
          "type": "input_value",
          "name": "SIZE",
          "check": "Number"
        }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "style": "pen_blocks"
    },


    // =================================================================
    // SPEECH  BLOCKS
    // =================================================================

{
  "type": "tts_speak",
  "message0": "speak %1",
  "args0": [
    {
      "type": "input_value",
      "name": "TEXT",
      "check": "String"
    }
  ],
  "previousStatement": null,
  "nextStatement": null,
  "style": "tts_blocks" // We will define this style next
},
{
      "type": "tts_set_voice",
      "message0": "set voice to %1",
      "args0": [
        {
          "type": "input_value",
          "name": "VOICE",
          "check": "String"
        }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "style": "tts_blocks"
    },
    {
      "type": "tts_get_voice",
      "message0": "voice",
      "output": "String",
      "style": "tts_blocks",
      "outputShape": Blockly.OUTPUT_SHAPE_ROUND
    },

    // =================================================================
    // VIDEO SENSING BLOCKS
    // =================================================================
    
{
  "type": "video_turn_on_off",
  "message0": "turn video %1",
  "args0": [
    { "type": "field_dropdown", "name": "STATE", "options": [["on", "ON"], ["off", "OFF"]] }
  ],
  "previousStatement": null,
  "nextStatement": null,
  "style": "video_blocks"
},
{
  "type": "video_motion",
  "message0": "video motion",
  "output": "Number",
  "style": "video_blocks",
  "outputShape": Blockly.OUTPUT_SHAPE_ROUND
},

    // =================================================================
    // Face detection
    // =================================================================
    

{ "type": "face_detection_num_faces", "message0": "number of faces", "output": "Number", "style": "face_detection_blocks", "outputShape": Blockly.OUTPUT_SHAPE_ROUND },
{
  "type": "face_detection_property",
  "message0": "%1 of face %2",
  "args0": [
    { "type": "field_dropdown", "name": "PROP", "options": [["x position", "x"], ["y position", "y"], ["width", "width"], ["height", "height"]] },
    { "type": "input_value", "name": "INDEX", "check": "Number" }
  ],
  "output": "Number",
  "style": "face_detection_blocks",
  "outputShape": Blockly.OUTPUT_SHAPE_ROUND,
  "inputsInline": true
},

{
      "type": "face_is_smiling",
      "message0": "is face %1 smiling?",
      "args0": [
        { "type": "input_value", "name": "INDEX", "check": "Number" }
      ],
      "output": "Boolean",
      "style": "face_detection_blocks",
      "outputShape": Blockly.OUTPUT_SHAPE_HEXAGONAL,
      "inputsInline": true
    },
    {
      "type": "face_is_eye_open",
      "message0": "is face %1 %2 eye open?",
      "args0": [
        { "type": "input_value", "name": "INDEX", "check": "Number" },
        { "type": "field_dropdown", "name": "SIDE", "options": [["left", "left"], ["right", "right"]] }
      ],
      "output": "Boolean",
      "style": "face_detection_blocks",
      "outputShape": Blockly.OUTPUT_SHAPE_HEXAGONAL,
      "inputsInline": true
    },
    {
      "type": "face_expression_amount",
      "message0": "%1 of face %2",
      "args0": [
        { "type": "field_dropdown", "name": "EXPRESSION", "options": [
            ["mouth smile", "mouthSmile"], 
            ["mouth open", "jawOpen"], 
            ["eyebrow raise", "browInnerUp"],
            ["eye blink left", "eyeBlinkLeft"],
            ["eye blink right", "eyeBlinkRight"]
        ]},
        { "type": "input_value", "name": "INDEX", "check": "Number" }
      ],
      "output": "Number",
      "style": "face_detection_blocks",
      "outputShape": Blockly.OUTPUT_SHAPE_ROUND,
      "inputsInline": true
    }

  
  ]);

// This is a helper extension to make dropdowns return their value directly as a string.
Blockly.Extensions.register('output_string_converter', function() {
  this.setOnChange(function(event) {
    if (event.isUiEvent) return;
    if (this.outputConnection && this.outputConnection.isConnected()) {
        const parent = this.outputConnection.targetConnection.getSourceBlock();
        if (parent.type !== 'text') {
            this.unplug(true);
        }
    }
  });
});