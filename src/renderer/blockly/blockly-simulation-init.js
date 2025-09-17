// src/renderer/blockly/blockly-simulation-init.js
'use strict';

// --- THEME DEFINITION ---
const SimIdeTheme = Blockly.Theme.defineTheme('simulation-ide', {
    'base': Blockly.Themes.Zelos,
    'blockStyles': {
        'motion_blocks': { 'colourPrimary': '#4C97FF' },
        'looks_blocks': { 'colourPrimary': '#9966FF' },
        'sound_blocks': { 'colourPrimary': '#CF63CF' },
        'event_blocks': { 'colourPrimary': '#FFBF00', 'hat': 'cap' }, 
        'control_blocks': { 'colourPrimary': '#FFAB19' },
        'sensing_blocks': { 'colourPrimary': '#59C059' },
        'operator_blocks': { 'colourPrimary': '#40BF4A' },
        'variable_blocks': { 'colourPrimary': '#FF8C1A' },
        'procedure_blocks': { 'colourPrimary': '#FF6680' },
        'list_blocks': { 'colourPrimary': '#FF6680' },
        'pen_blocks': { 'colourPrimary': '#0E9A86' },
        'tts_blocks': { 'colourPrimary': '#0891B2' },
        'video_blocks': { 'colourPrimary': '#059669' },
        'face_detection_blocks': { 'colourPrimary': '#065F46' },
    },
    'categoryStyles': {
        'motion_category': { 'colour': '#4C97FF' },
        'looks_category': { 'colour': '#9966FF' },
        'sound_category': { 'colour': '#CF63CF' },
        'events_category': { 'colour': '#FFBF00' },
        'control_category': { 'colour': '#FFAB19' },
        'sensing_category': { 'colour': '#59C059' },
        'operators_category': { 'colour': '#40BF4A' },
        'variables_category': { 'colour': '#FF8C1A' },
        'functions_category': { 'colour': '#FF6680' },
        'lists_category': { 'colour': '#FF6680' },
        'pen_category': { 'colour': '#0E9A86' },
        'tts_category': { 'colour': '#0891B2' },
        'video_category': { 'colour': '#059669' },
        'face_detection_category': { 'colour': '#065F46' }
    },
    'componentStyles': {
        'workspaceBackgroundColour': 'var(--bg-main)',
        'toolboxBackgroundColour': 'var(--bg-toolbox)',
        'flyoutBackgroundColour': 'var(--bg-flyout)',
        'scrollbarColour': 'var(--border-color)'
    },
    'fontStyle': { 'family': 'Inter, sans-serif', 'weight': '500', 'size': 12 }
});

const num = (v) => ({ "shadow": { "type": "math_number", "fields": { "NUM": v } } });
const str = (v) => ({ "shadow": { "type": "text", "fields": { "TEXT": v } } });

// --- EXTENSION CATEGORY DEFINITIONS ---
const extensionCategories = {
    pen: {
        "kind": "category",
        "name": "Pen",
        "categorystyle": "pen_category",
        "contents": [
            { "kind": "block", "type": "pen_clear" },
            { "kind": "block", "type": "pen_pen_down" },
            { "kind": "block", "type": "pen_pen_up" },
            { "kind": "block", "type": "pen_set_pen_color_to_color" },
            { "kind": "block", "type": "pen_change_pen_size_by", "inputs": { "SIZE": num(1) } },
            { "kind": "block", "type": "pen_set_pen_size_to", "inputs": { "SIZE": num(1) } },
        ]
    },
    tts: {
        "kind": "category",
        "name": "Text to Speech",
        "categorystyle": "tts_category",
        "contents": [
            { "kind": "block", "type": "tts_speak", "inputs": { "TEXT": str("hello") } },
            { 
              "kind": "block", 
              "type": "tts_set_voice",
              "inputs": {
                "VOICE": {
                  "shadow": {
                    "type": "text",
                    "fields": { "TEXT": "Google US English" }
                  }
                }
              }
            },
            { "kind": "block", "type": "tts_get_voice" }
        ]
    },
    video: {
        "kind": "category",
        "name": "Video Sensing",
        "categorystyle": "video_category",
        "contents": [
            { "kind": "block", "type": "video_turn_on_off" },
            { "kind": "block", "type": "video_motion" }
        ]
    },
    face_detection: {
        "kind": "category",
        "name": "Face Detection",
        "categorystyle": "face_detection_category",
        "contents": [
            { "kind": "block", "type": "face_detection_num_faces" },
            { "kind": "block", "type": "face_detection_property", "inputs": { "INDEX": num(1) } },
            { "kind": "sep" },
            { "kind": "block", "type": "face_is_smiling", "inputs": { "INDEX": num(1) } },
            { "kind": "block", "type": "face_is_eye_open", "inputs": { "INDEX": num(1) } },
            { "kind": "block", "type": "face_expression_amount", "inputs": { "INDEX": num(1) } }
        ]
    }

    // Future extensions  will be added here.
};

// --- BASE TOOLBOX DEFINITION FOR SPRITES ---
const spriteToolbox = {
    "kind": "categoryToolbox",
    "contents": [
        { "kind": "category", "name": "Motion", "categorystyle": "motion_category", "contents": [
            { "kind": "block", "type": "motion_move_steps", "inputs": { "STEPS": num(10) } },
            { "kind": "block", "type": "motion_turn_right", "inputs": { "DEGREES": num(15) } },
            { "kind": "block", "type": "motion_turn_left", "inputs": { "DEGREES": num(15) } },
            { "kind": "sep" },
            { "kind": "block", "type": "motion_go_to_xy", "inputs": { "X": num(0), "Y": num(0) } },
            { "kind": "block", "type": "motion_point_in_direction", "inputs": { "DIRECTION": num(90) } },
            { "kind": "sep" },
            { "kind": "block", "type": "motion_change_x_by", "inputs": { "DX": num(10) } },
            { "kind": "block", "type": "motion_set_x_to", "inputs": { "X": num(0) } },
            { "kind": "block", "type": "motion_change_y_by", "inputs": { "DY": num(10) } },
            { "kind": "block", "type": "motion_set_y_to", "inputs": { "Y": num(0) } },
            { "kind": "sep" },
            { "kind": "block", "type": "motion_set_rotation_style" },
            { "kind": "block", "type": "motion_go_to_layer" },
            { "kind": "block", "type": "motion_go_layer_by", "inputs": { "NUM": num(1) } },
        ]},
        { "kind": "category", "name": "Looks", "categorystyle": "looks_category", "contents": [
            { "kind": "block", "type": "looks_say_for_seconds", "inputs": { "MESSAGE": str("Hello!"), "SECS": num(2) } },
            { "kind": "block", "type": "looks_say", "inputs": { "MESSAGE": str("Hello!") } },
            { "kind": "block", "type": "looks_think_for_seconds", "inputs": { "MESSAGE": str("Hmm..."), "SECS": num(2) } },
            { "kind": "block", "type": "looks_think", "inputs": { "MESSAGE": str("Hmm...") } },
            { "kind": "sep" },
            { "kind": "block", "type": "looks_switch_costume_to", "inputs": { "COSTUME": str("costume1") } },
            { "kind": "block", "type": "looks_next_costume" },
            { "kind": "block", "type": "looks_costume_number_name" },
            { "kind": "sep" },
            { "kind": "block", "type": "looks_switch_backdrop_to", "inputs": { "BACKDROP": str("backdrop1") } },
            { "kind": "block", "type": "looks_next_backdrop" },
            { "kind": "block", "type": "looks_backdrop_number_name" },
            { "kind": "sep" },
            { "kind": "block", "type": "looks_show" },
            { "kind": "block", "type": "looks_hide" },
            { "kind": "sep" },
            { "kind": "block", "type": "looks_change_size_by", "inputs": { "CHANGE": num(10) } },
            { "kind": "block", "type": "looks_set_size_to", "inputs": { "SIZE": num(100) } },
            { "kind": "sep" },
            { "kind": "block", "type": "looks_change_effect_by", "inputs": { "CHANGE": num(25) } },
            { "kind": "block", "type": "looks_set_effect_to", "inputs": { "VALUE": num(0) } },
            { "kind": "block", "type": "looks_clear_graphic_effects" },
        ]},
        { "kind": "category", "name": "Sound", "categorystyle": "sound_category", "contents": [
            { "kind": "block", "type": "sound_start_sound" },
            { "kind": "block", "type": "sound_play_until_done" },
            { "kind": "block", "type": "sound_stop_all_sounds" },
        ]},
        { "kind": "category", "name": "Events", "categorystyle": "events_category", "contents": [
            { "kind": "block", "type": "event_when_green_flag_clicked" },
            { "kind": "block", "type": "event_when_key_pressed" },
            { "kind": "block", "type": "event_when_this_sprite_clicked" },
            { "kind": "block", "type": "event_when_backdrop_switches", "inputs": { "BACKDROP": str("backdrop1") } },
            { "kind": "sep" },
            { "kind": "block", "type": "event_when_broadcast_received" },
            { "kind": "block", "type": "event_broadcast", "inputs": { "BROADCAST_INPUT": str("message1") } },
            { "kind": "block", "type": "event_broadcast_and_wait", "inputs": { "BROADCAST_INPUT": str("message1") } },
        ]},
        { "kind": "category", "name": "Control", "categorystyle": "control_category", "contents": [
            { "kind": "block", "type": "control_wait", "inputs": { "DURATION": num(1) } },
            { "kind": "block", "type": "controls_repeat_ext", "inputs": { "TIMES": num(10) } },
            { "kind": "block", "type": "controls_forever" },
            { "kind": "block", "type": "controls_if" },
            { "kind": "block", "type": "controls_if", "extraState": { "hasElse": true } },
            { "kind": "sep" },
            { "kind": "block", "type": "control_when_i_start_as_a_clone" },
            { "kind": "block", "type": "control_create_clone_of", "inputs": { "CLONE_OPTION": { "shadow": { "type": "sensing_touchingobjectmenu", "fields": { "TOUCHINGOBJECTMENU": "_myself_" } } } } },
            { "kind": "block", "type": "control_delete_this_clone" },
            { "kind": "sep" },
            { "kind": "block", "type": "control_stop" },
        ]},
        { "kind": "category", "name": "Sensing", "categorystyle": "sensing_category", "contents": [
            { "kind": "block", "type": "sensing_touching", "inputs": { "TOUCHINGOBJECTMENU": { "shadow": { "type": "sensing_touchingobjectmenu" } } } },
            { "kind": "block", "type": "sensing_distance_to", "inputs": { "DISTANCETOMENU": { "shadow": { "type": "sensing_distancetomenu" } } } },
            { "kind": "sep" },
            { "kind": "block", "type": "sensing_ask_and_wait", "inputs": { "QUESTION": str("What's your name?") } },
            { "kind": "block", "type": "sensing_answer" },
            { "kind": "sep" },
            { "kind": "block", "type": "sensing_key_pressed", "inputs": { "KEY_OPTION": { "shadow": { "type": "sensing_keyoptions" } } } },
            { "kind": "block", "type": "sensing_mouse_down" },
            { "kind": "block", "type": "sensing_mouse_x" },
            { "kind": "block", "type": "sensing_mouse_y" },
            { "kind": "sep" },
            { "kind": "block", "type": "sensing_timer" },
            { "kind": "block", "type": "sensing_resettimer" },
        ]},
        { "kind": "category", "name": "Operators", "categorystyle": "operators_category", "contents": [
            { "kind": "block", "type": "operator_add", "inputs": { "NUM1": num(), "NUM2": num() } },
            { "kind": "block", "type": "operator_subtract", "inputs": { "NUM1": num(), "NUM2": num() } },
            { "kind": "block", "type": "operator_multiply", "inputs": { "NUM1": num(), "NUM2": num() } },
            { "kind": "block", "type": "operator_divide", "inputs": { "NUM1": num(), "NUM2": num() } },
            { "kind": "sep" },
            { "kind": "block", "type": "operator_random", "inputs": { "FROM": num(1), "TO": num(10) } },
            { "kind": "sep" },
            { "kind": "block", "type": "operator_gt", "inputs": { "OPERAND1": str(''), "OPERAND2": str(50) } },
            { "kind": "block", "type": "operator_lt", "inputs": { "OPERAND1": str(''), "OPERAND2": str(50) } },
            { "kind": "block", "type": "operator_equals", "inputs": { "OPERAND1": str(''), "OPERAND2": str(50) } },
            { "kind": "sep" },
            { "kind": "block", "type": "operator_and" },
            { "kind": "block", "type": "operator_or" },
            { "kind": "block", "type": "operator_not" },
            { "kind": "sep" },
            { "kind": "block", "type": "operator_join", "inputs": { "STRING1": str("apple "), "STRING2": str("banana") } },
            { "kind": "block", "type": "operator_letter_of", "inputs": { "LETTER": num(1), "STRING": str("apple") } },
            { "kind": "block", "type": "operator_length", "inputs": { "STRING": str("apple") } },
            { "kind": "block", "type": "operator_contains", "inputs": { "STRING1": str("apple"), "STRING2": str("a") } },
            { "kind": "sep" },
            { "kind": "block", "type": "operator_mod", "inputs": { "NUM1": num(), "NUM2": num() } },
            { "kind": "block", "type": "operator_round", "inputs": { "NUM": num() } },
            { "kind": "sep" },
            { "kind": "block", "type": "operator_mathop", "inputs": { "NUM": num() } },
        ]},
        { "kind": "category", "name": "Variables", "categorystyle": "variables_category", "custom": "VARIABLE" },
        { "kind": "category", "name": "Lists", "categorystyle": "lists_category", "custom": "VARIABLE_DYNAMIC"},
        { "kind": "category", "name": "My Blocks", "categorystyle": "functions_category", "custom": "PROCEDURE" },
        { "kind": "sep" },
        {
            "kind": "category",
            "name": "Add Extension",
            "categorystyle": "functions_category", 
            "custom": "ADD_EXTENSION"
        }
    ]
};

// --- BASE TOOLBOX DEFINITION FOR THE STAGE ---
const stageToolbox = {
    "kind": "categoryToolbox",
    "contents": [
        { "kind": "category", "name": "Looks", "categorystyle": "looks_category", "contents": [
            { "kind": "block", "type": "looks_switch_backdrop_to", "inputs": { "BACKDROP": str("backdrop1") } },
            { "kind": "block", "type": "looks_next_backdrop" },
            { "kind": "block", "type": "looks_backdrop_number_name" },
            { "kind": "sep" },
            { "kind": "block", "type": "looks_change_effect_by", "inputs": { "CHANGE": num(25) } },
            { "kind": "block", "type": "looks_set_effect_to", "inputs": { "VALUE": num(0) } },
            { "kind": "block", "type": "looks_clear_graphic_effects" },
        ]},
        { "kind": "category", "name": "Sound", "categorystyle": "sound_category", "contents": [
            { "kind": "block", "type": "sound_start_sound" },
            { "kind": "block", "type": "sound_play_until_done" },
            { "kind": "block", "type": "sound_stop_all_sounds" },
        ]},
        { "kind": "category", "name": "Events", "categorystyle": "events_category", "contents": [
            { "kind": "block", "type": "event_when_green_flag_clicked" },
            { "kind": "block", "type": "event_when_key_pressed" },
            { "kind": "block", "type": "event_when_backdrop_switches", "inputs": { "BACKDROP": str("backdrop1") } },
            { "kind": "sep" },
            { "kind": "block", "type": "event_when_broadcast_received" },
            { "kind": "block", "type": "event_broadcast", "inputs": { "BROADCAST_INPUT": str("message1") } },
            { "kind": "block", "type": "event_broadcast_and_wait", "inputs": { "BROADCAST_INPUT": str("message1") } },
        ]},
        { "kind": "category", "name": "Control", "categorystyle": "control_category", "contents": [
            { "kind": "block", "type": "control_wait", "inputs": { "DURATION": num(1) } },
            { "kind": "block", "type": "controls_repeat_ext", "inputs": { "TIMES": num(10) } },
            { "kind": "block", "type": "controls_forever" },
            { "kind": "block", "type": "controls_if" },
            { "kind": "block", "type": "controls_if", "extraState": { "hasElse": true } },
            { "kind": "block", "type": "control_stop" },
        ]},
        { "kind": "category", "name": "Sensing", "categorystyle": "sensing_category", "contents": [
            { "kind": "block", "type": "sensing_ask_and_wait", "inputs": { "QUESTION": str("What's your name?") } },
            { "kind": "block", "type": "sensing_answer" },
            { "kind": "sep" },
            { "kind": "block", "type": "sensing_key_pressed", "inputs": { "KEY_OPTION": { "shadow": { "type": "sensing_keyoptions" } } } },
            { "kind": "block", "type": "sensing_mouse_down" },
            { "kind": "block", "type": "sensing_mouse_x" },
            { "kind": "block", "type": "sensing_mouse_y" },
            { "kind": "sep" },
            { "kind": "block", "type": "sensing_timer" },
            { "kind": "block", "type": "sensing_resettimer" },
        ]},
        { "kind": "category", "name": "Operators", "categorystyle": "operators_category", "contents": spriteToolbox.contents.find(c => c.name === "Operators").contents },
        { "kind": "category", "name": "Variables", "categorystyle": "variables_category", "custom": "VARIABLE" },
        { "kind": "category", "name": "Lists", "categorystyle": "lists_category", "custom": "VARIABLE_DYNAMIC"},
        { "kind": "category", "name": "My Blocks", "categorystyle": "functions_category", "custom": "PROCEDURE" },
        { "kind": "sep" },
        {
            "kind": "category",
            "name": "Add Extension",
            "categorystyle": "functions_category",
            "custom": "ADD_EXTENSION"
        }
    ]
};

// --- INITIALIZATION FUNCTION ---
function initializeSimulationBlockly() {
    const blocklyArea = document.getElementById('blocklyArea');
    if (!blocklyArea) return null;

    const workspace = Blockly.inject(blocklyArea, {
        theme: SimIdeTheme,
        toolbox: spriteToolbox, // Start with the sprite toolbox by default
        media: 'https://unpkg.com/blockly/media/',
        sounds: true,
        renderer: 'zelos',
        grid: {
            spacing: 20,
            length: 1,
            colour: 'var(--border-color)',
            snap: true
        },
        zoom: {
            controls: true,
            wheel: true,
            startScale: 0.9,
            maxScale: 3,
            minScale: 0.3,
            scaleSpeed: 1.2
        },
        trashcan: true,
    });
    Blockly.JavaScript.init(workspace);
    return workspace;
}

// --- DYNAMIC TOOLBOX SWITCHER ---
function updateToolboxForTarget(workspace, isStage) {
    if (!workspace) return;
    const newToolbox = isStage ? stageToolbox : spriteToolbox;
    workspace.updateToolbox(newToolbox);
}

// Expose the function to be callable from other scripts
window.updateToolboxForTarget = updateToolboxForTarget;
