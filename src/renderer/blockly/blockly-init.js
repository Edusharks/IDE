// src/renderer/blockly/blockly-init.js

// ===== 1. THEME DEFINITION (No changes) =====
const Esp32IdeTheme = Blockly.Theme.defineTheme('esp32-ide-final', {
    'base': Blockly.Themes.Zelos,
    'blockStyles': {
        'gpio_blocks': { 'colourPrimary': '#0ea5e9' },
        'loops_blocks': { 'colourPrimary': '#16a34a' },
        'logic_blocks': { 'colourPrimary': '#ec4899' },
        'math_blocks': { 'colourPrimary': '#8b5cf6' },
        'text_blocks': { 'colourPrimary': '#f59e0b' },
        'lists_blocks': { 'colourPrimary': '#f43f5e' },
        'colour_blocks': { 'colourPrimary': '#0891b2' },
        'sensor_blocks': { 'colourPrimary': '#0891b2' },
        'actuator_blocks': { 'colourPrimary': '#14b8a6' },
        'communication_blocks': { 'colourPrimary': '#ca8a04' },
        'variable_blocks': { 'colourPrimary': '#db2777' },
        'wait_block_style': { 'colourPrimary': '#f97316' },
        'procedure_blocks': { 'colourPrimary': '#db2777' },
        'display_blocks': { 'colourPrimary': '#4f46e5' },
        'networking_blocks': { 'colourPrimary': '#059669' },
        'bluetooth_blocks': { 'colourPrimary': '#2563eb' },
        'face_landmark_blocks': { 'colourPrimary': '#6d28d9' },
        'hand_gesture_blocks': { 'colourPrimary': '#d97706' },
        'image_classification_blocks': { 'colourPrimary': '#059669' },
        'object_detection_blocks': { 'colourPrimary': '#0891b2' },

    },
    'categoryStyles': {
        'gpio_category': { 'colour': '#0ea5e9' },
        'loops_category': { 'colour': '#16a34a' },
        'logic_category': { 'colour': '#ec4899' },
        'math_category': { 'colour': '#8b5cf6' },
        'text_category': { 'colour': '#f59e0b' },
        'lists_category': { 'colour': '#f43f5e' },
        'colour_category': { 'colour': '#0891b2' },
        'sensors_category': { 'colour': '#0891b2' },
        'actuators_category': { 'colour': '#14b8a6' },
        'communication_category': { 'colour': '#ca8a04' },
        'variables_category': { 'colour': '#db2777' },
        'functions_category': { 'colour': '#db2777' },
        'display_blocks': { 'colour': '#4f46e5' },
        'networking_blocks': { 'colour': '#059669' },
        'bluetooth_blocks': { 'colour': '#2563eb' },
        'face_landmark_category': { 'colour': '#6d28d9' },
        'hand_gesture_category': { 'colour': '#d97706' },
        'image_classification_category': { 'colour': '#059669' },
        'object_detection_category': { 'colour': '#0891b2' },
    },
    'componentStyles': {
        'workspaceBackgroundColour': 'var(--bg-main)',
        'toolboxBackgroundColour': 'var(--bg-toolbox)',
        'flyoutBackgroundColour': 'var(--bg-flyout)',
        'scrollbarColour': 'var(--border-color)'
    },
    'fontStyle': {
        'family': 'Inter, sans-serif',
        'weight': '500',
        'size': 12
    }
});

// Placeholder for hardware extension categories.
const extensionCategories = {
    'face_landmark': {
        "kind": "category",
        "name": "Face Landmark",
        "categorystyle": "face_landmark_category",
        "contents": [
            { "kind": "block", "type": "face_landmark_enable" },
            { "kind": "block", "type": "face_landmark_on_results" },
            { "kind": "block", "type": "face_landmark_get_face_count" },
            { "kind": "block", "type": "face_landmark_get_expression_value" },
            { "kind": "block", "type": "face_landmark_is_expression" }
        ]
    },
    'hand_gesture': {
        "kind": "category",
        "name": "Hand Gestures",
        "categorystyle": "hand_gesture_category",
        "contents": [
            { "kind": "block", "type": "hand_gesture_enable" },
            { "kind": "block", "type": "hand_gesture_on_gesture" },
            { "kind": "block", "type": "hand_gesture_get_hand_count" },
            { "kind": "block", "type": "hand_gesture_is_hand_present" }
        ]
    },
    'image_classification': {
        "kind": "category",
        "name": "Image Classification",
        "categorystyle": "image_classification_category",
        "contents": [
            { "kind": "block", "type": "image_classification_enable" },
            { "kind": "block", "type": "image_classification_is_class" },
            { "kind": "block", "type": "image_classification_get_class" }
        ]
    },
    'object_detection': {
        "kind": "category",
        "name": "Object Detection",
        "categorystyle": "object_detection_category",
        "contents": [
            { "kind": "block", "type": "object_detection_enable" },
            { "kind": "block", "type": "object_detection_is_object_detected" },
            { "kind": "block", "type": "object_detection_for_each" },
            { "kind": "block", "type": "object_detection_get_property" }
        ]
    }
};


// ===== 2. BLOCK STYLE ASSIGNMENT (No changes) =====
function applyBlockStyles() {
    ['controls_if', 'controls_repeat_ext', 'controls_whileUntil', 'controls_for', 'controls_forEach', 'controls_flow_statements'].forEach(b => {
        if (Blockly.Blocks[b]) Blockly.Blocks[b].style = 'loops_blocks';
    });
    
    if (Blockly.Blocks['control_delay']) Blockly.Blocks['control_delay'].style = 'wait_block_style';
    ['logic_compare', 'logic_operation', 'logic_negate', 'logic_boolean'].forEach(b => {
        if (Blockly.Blocks[b]) Blockly.Blocks[b].style = 'logic_blocks';
    });

    ['math_number', 'math_arithmetic', 'math_random_int', 'math_constrain'].forEach(b => {
        if (Blockly.Blocks[b]) Blockly.Blocks[b].style = 'math_blocks';
    });

    ['text', 'text_length', 'text_join', 'text_indexOf', 'text_isEmpty', 'text_getSubstring', 'text_charAt', 'text_split'].forEach(b => {
      if(Blockly.Blocks[b]) Blockly.Blocks[b].style = 'text_blocks';
    });

    [
        'lists_create_with', 'lists_create_with_item', 'lists_length', 'lists_isEmpty', 
        'lists_indexOf', 'lists_getIndex', 'lists_setIndex', 'lists_getSublist', 
        'lists_split', 'lists_sort', 'lists_reverse', 'lists_get_random_item'
    ].forEach(b => {
        if (Blockly.Blocks[b]) Blockly.Blocks[b].style = 'lists_blocks';
    });

    ['colour_picker', 'colour_random', 'colour_rgb'].forEach(b => {
        if (Blockly.Blocks[b]) Blockly.Blocks[b].style = 'colour_blocks';
    });

    if (Blockly.Blocks['variables_set']) Blockly.Blocks['variables_set'].style = 'variable_blocks';
    if (Blockly.Blocks['variables_get']) Blockly.Blocks['variables_get'].style = 'variable_blocks';
}

// ===== 3. MODULAR TOOLBOX DEFINITIONS (No changes) =====

function createBasicToolbox() {
    return {
        "kind": "categoryToolbox",
        "contents": [
            {
                "kind": "category",
                "name": "Loops",
                "categorystyle": "loops_category",
                "contents": [
                  { "kind": "block", "type": "on_start" },
                  { "kind": "block", "type": "forever" },
                  { "kind": "block", "type": "every_x_ms" },
                  { "kind": "block", "type": "control_delay_seconds", "inputs": { "DELAY_SEC": { "shadow": { "type": "math_number", "fields": { "NUM": 1 } } } } },
                  { "kind": "block", "type": "controls_repeat_ext", "inputs": { "TIMES": { "shadow": { "type": "math_number", "fields": { "NUM": 4 } } } } },
                  { "kind": "block", "type": "controls_whileUntil" },
                  { "kind": "block", "type": "controls_for", "inputs": { "FROM": { "shadow": { "type": "math_number", "fields": { "NUM": 0 } } }, "TO": { "shadow": { "type": "math_number", "fields": { "NUM": 4 } } }, "BY": { "shadow": { "type": "math_number", "fields": { "NUM": 1 } } } } },
                  { "kind": "block", "type": "controls_forEach" },
                  { "kind": "block", "type": "controls_flow_statements" }
                ]
            },
            {
                "kind": "category",
                "name": "Logic",
                "categorystyle": "logic_category",
                "contents": [
                    { "kind": "label", "text": "Conditionals"},
                    { "kind": "block", "type": "controls_if", "inputs": { "IF0": { "shadow": { "type": "logic_boolean", "fields": { "BOOL": "TRUE" } } } } },
                    { "kind": "label", "text": "Comparison"},
                    { "kind": "block", "type": "logic_compare", "fields": {"OP": "EQ"}, "inputs": { "A": { "shadow": { "type": "math_number", "fields": { "NUM": 0 } } }, "B": { "shadow": { "type": "math_number", "fields": { "NUM": 0 } } } } },
                    { "kind": "block", "type": "logic_compare", "fields": {"OP": "NEQ"}, "inputs": { "A": { "shadow": { "type": "math_number", "fields": { "NUM": 0 } } }, "B": { "shadow": { "type": "math_number", "fields": { "NUM": 0 } } } } },
                    { "kind": "block", "type": "logic_compare", "fields": {"OP": "GT"}, "inputs": { "A": { "shadow": { "type": "math_number", "fields": { "NUM": 0 } } }, "B": { "shadow": { "type": "math_number", "fields": { "NUM": 0 } } } } },
                    { "kind": "block", "type": "logic_compare", "fields": {"OP": "EQ"}, "inputs": { "A": { "shadow": { "type": "text", "fields": { "TEXT": "" } } }, "B": { "shadow": { "type": "text", "fields": { "TEXT": "" } } } } },
                    { "kind": "block", "type": "logic_compare", "fields": {"OP": "NEQ"}, "inputs": { "A": { "shadow": { "type": "text", "fields": { "TEXT": "" } } }, "B": { "shadow": { "type": "text", "fields": { "TEXT": "" } } } } },
                    { "kind": "label", "text": "Boolean"},
                    { "kind": "block", "type": "logic_operation", "inputs": { "A": { "shadow": { "type": "logic_boolean", "fields": { "BOOL": "TRUE" } } }, "B": { "shadow": { "type": "logic_boolean", "fields": { "BOOL": "TRUE" } } } } },
                    { "kind": "block", "type": "logic_negate", "inputs": { "BOOL": { "shadow": { "type": "logic_boolean", "fields": { "BOOL": "TRUE" } } } } },
                    { "kind": "block", "type": "logic_boolean" }
                ]
            },
            {
                "kind": "category",
                "name": "Math",
                "categorystyle": "math_category",
                "contents": [
                    { "kind": "block", "type": "math_number", "fields": { "NUM": 0 } },
                    { "kind": "block", "type": "math_arithmetic", "fields": {"OP": "ADD"}, "inputs": { "A": { "shadow": { "type": "math_number", "fields": { "NUM": 0 } } }, "B": { "shadow": { "type": "math_number", "fields": { "NUM": 0 } } } } },
                    { "kind": "block", "type": "math_arithmetic", "fields": {"OP": "MINUS"}, "inputs": { "A": { "shadow": { "type": "math_number", "fields": { "NUM": 0 } } }, "B": { "shadow": { "type": "math_number", "fields": { "NUM": 0 } } } } },
                    { "kind": "block", "type": "math_arithmetic", "fields": {"OP": "MULTIPLY"}, "inputs": { "A": { "shadow": { "type": "math_number", "fields": { "NUM": 0 } } }, "B": { "shadow": { "type": "math_number", "fields": { "NUM": 0 } } } } },
                    { "kind": "block", "type": "math_arithmetic", "fields": {"OP": "DIVIDE"}, "inputs": { "A": { "shadow": { "type": "math_number", "fields": { "NUM": 0 } } }, "B": { "shadow": { "type": "math_number", "fields": { "NUM": 0 } } } } },
                    { "kind": "block", "type": "math_modulo", "inputs": { "DIVIDEND": { "shadow": { "type": "math_number", "fields": { "NUM": 0 } } }, "DIVISOR": { "shadow": { "type": "math_number", "fields": { "NUM": 1 } } } } },
                    { "kind": "block", "type": "math_single", "fields": {"OP": "ABS"}, "inputs": { "NUM": { "shadow": { "type": "math_number", "fields": { "NUM": 0 } } } } },
                    { "kind": "block", "type": "math_single", "fields": {"OP": "ROOT"}, "inputs": { "NUM": { "shadow": { "type": "math_number", "fields": { "NUM": 0 } } } } },
                    { "kind": "block", "type": "math_constant" },
                    { "kind": "block", "type": "math_on_list", "fields": {"OP": "MIN"} },
                    { "kind": "block", "type": "math_on_list", "fields": {"OP": "MAX"} },
                    { "kind": "block", "type": "math_random_int", "inputs": { "FROM": { "shadow": { "type": "math_number", "fields": { "NUM": 0 } } }, "TO": { "shadow": { "type": "math_number", "fields": { "NUM": 10 } } } } },
                    { "kind": "block", "type": "math_constrain", "inputs": { "VALUE": { "shadow": { "type": "math_number", "fields": { "NUM": 0 } } }, "LOW": { "shadow": { "type": "math_number", "fields": { "NUM": 0 } } }, "HIGH": { "shadow": { "type": "math_number", "fields": { "NUM": 0 } } } } },
                    { "kind": "block", "type": "math_map", "inputs": { "VALUE": { "shadow": { "type": "math_number", "fields": { "NUM": 0 } } }, "FROM_LOW": { "shadow": { "type": "math_number", "fields": { "NUM": 0 } } }, "FROM_HIGH": { "shadow": { "type": "math_number", "fields": { "NUM": 1023 } } }, "TO_LOW": { "shadow": { "type": "math_number", "fields": { "NUM": 0 } } }, "TO_HIGH": { "shadow": { "type": "math_number", "fields": { "NUM": 4 } } } } }
                ]
            },
            {
                "kind": "category",
                "name": "Text",
                "categorystyle": "text_category",
                "contents": [
                    { "kind": "block", "type": "text", "fields": { "TEXT": "" } },
                    { "kind": "block", "type": "text_length", "inputs": { "VALUE": { "shadow": { "type": "text", "fields": {"TEXT": "Hello"} } } } },
                    { "kind": "block", "type": "text_join" },
                    { "kind": "block", "type": "text_parse_to_number", "inputs": { "TEXT": { "shadow": { "type": "text", "fields": {"TEXT": "123"} } } } },
                    { "kind": "block", "type": "text_isEmpty", "inputs": { "VALUE": { "shadow": { "type": "text", "fields": {"TEXT": ""} } } } },
                    { "kind": "block", "type": "text_indexOf", "inputs": { "VALUE": { "shadow": { "type": "text", "fields": {"TEXT": "this"} } }, "FIND": { "shadow": { "type": "text", "fields": {"TEXT": ""} } } } },
                    { "kind": "block", "type": "text_charAt", "inputs": { "VALUE": { "shadow": { "type": "text", "fields": {"TEXT": "this"} } } } },
                    { "kind": "block", "type": "text_getSubstring", "inputs": { "STRING": { "shadow": { "type": "text", "fields": {"TEXT": "this"} } } } },
                    { "kind": "block", "type": "text_convert_to_text", "inputs": { "VALUE": { "shadow": { "type": "math_number", "fields": {"NUM": 0} } } } },
                    { "kind": "block", "type": "text_from_char_code", "inputs": { "CODE": { "shadow": { "type": "math_number", "fields": {"NUM": 0} } } } },
                    { "kind": "block", "type": "text_char_code_at", "inputs": { "TEXT": { "shadow": { "type": "text", "fields": {"TEXT": "this"} } }, "AT": { "shadow": { "type": "math_number", "fields": {"NUM": 0} } } } },
                ]
            },
            {
                "kind": "category",
                "name": "Lists",
                "categorystyle": "lists_category",
                "contents": [
                    { "kind": "label", "text": "Create" },
                    { "kind": "block", "type": "variables_set", "fields": { "VAR": "list" }, "inputs": { "VALUE": { "block": { "type": "lists_create_with", "extraState": { "itemCount": 2 }, "inputs": { "ADD0": { "shadow": { "type": "math_number", "fields": { "NUM": 0 } } }, "ADD1": { "shadow": { "type": "math_number", "fields": { "NUM": 1 } } } } } } } },
                    { "kind": "block", "type": "variables_set", "fields": { "VAR": "text list" }, "inputs": { "VALUE": { "block": { "type": "lists_create_with", "extraState": { "itemCount": 3 }, "inputs": { "ADD0": { "shadow": { "type": "text", "fields": { "TEXT": "a" } } }, "ADD1": { "shadow": { "type": "text", "fields": { "TEXT": "b" } } }, "ADD2": { "shadow": { "type": "text", "fields": { "TEXT": "c" } } } } } } } },
                    { "kind": "block", "type": "lists_create_with", "extraState": { "itemCount": 0 } },
                    { "kind": "label", "text": "Read" },
                    { "kind": "block", "type": "lists_get_random_item" },
                    { "kind": "block", "type": "lists_length" },
                    { "kind": "block", "type": "lists_getIndex", "fields": { "MODE": "GET", "WHERE": "FROM_START" }, "inputs": { "AT": { "shadow": { "type": "math_number", "fields": { "NUM": 0 } } } } },
                    { "kind": "block", "type": "lists_getIndex", "fields": { "MODE": "GET_REMOVE", "WHERE": "FROM_START" }, "inputs": { "AT": { "shadow": { "type": "math_number", "fields": { "NUM": 0 } } } } },
                    { "kind": "block", "type": "lists_getIndex", "fields": { "MODE": "GET_REMOVE", "WHERE": "LAST" } },
                    { "kind": "block", "type": "lists_getIndex", "fields": { "MODE": "GET_REMOVE", "WHERE": "FIRST" } },
                    { "kind": "label", "text": "Modify" },
                    { "kind": "block", "type": "lists_setIndex", "fields": { "MODE": "SET", "WHERE": "FROM_START" }, "inputs": { "AT": { "shadow": { "type": "math_number", "fields": { "NUM": 0 } } } } },
                    { "kind": "block", "type": "lists_setIndex", "fields": { "MODE": "INSERT", "WHERE": "LAST" } },
                    { "kind": "block", "type": "lists_getIndex", "fields": { "MODE": "REMOVE", "WHERE": "LAST" } },
                    { "kind": "block", "type": "lists_getIndex", "fields": { "MODE": "REMOVE", "WHERE": "FIRST" } },
                    { "kind": "block", "type": "lists_setIndex", "fields": { "MODE": "INSERT", "WHERE": "FIRST" } },
                    { "kind": "block", "type": "lists_setIndex", "fields": { "MODE": "INSERT", "WHERE": "FROM_START" }, "inputs": { "AT": { "shadow": { "type": "math_number", "fields": { "NUM": 0 } } } } },
                    { "kind": "block", "type": "lists_getIndex", "fields": { "MODE": "REMOVE", "WHERE": "FROM_START" }, "inputs": { "AT": { "shadow": { "type": "math_number", "fields": { "NUM": 0 } } } } },
                    { "kind": "label", "text": "Operations" },
                    { "kind": "block", "type": "lists_indexOf" },
                    { "kind": "block", "type": "lists_reverse" },
                ]
            },
            {
                "kind": "category",
                "name": "Colour",
                "categorystyle": "colour_category",
                "contents": [
                    { "kind": "block", "type": "colour_picker" },
                    { "kind": "block", "type": "colour_random" },
                    { "kind": "block", "type": "colour_rgb", "inputs": { "RED": { "shadow": { "type": "math_number", "fields": { "NUM": 100 }}}, "GREEN": { "shadow": { "type": "math_number", "fields": { "NUM": 50 }}}, "BLUE": { "shadow": { "type": "math_number", "fields": { "NUM": 0 }}}}},
                ]
            },
            {
                "kind": "category",
                "name": "Variables",
                "categorystyle": "variables_category",
                "custom": "VARIABLE",
                "contents": [{ "kind": "button", "text": "Create variable...", "callbackKey": "CREATE_VARIABLE" }]
            },
            {
                "kind": "category",
                "name": "Functions",
                "categorystyle": "functions_category",
                "custom": "PROCEDURE",
            },
            { "kind": "sep" },
            {
                "kind": "category",
                "name": "Add Extension",
                "categorystyle": "functions_category",
                "custom": "ADD_EXTENSION"
            }
        ]
    };
}

function createEsp32Toolbox() {
    return {
        "contents": [
            { "kind": "sep" },
            {
                "kind": "category",
                "name": "GPIO",
                "categorystyle": "gpio_category",
                "contents": [
                    { "kind": "block", "type": "gpio_digital_write" },
                    { "kind": "block", "type": "gpio_digital_read" },
                    { "kind": "block", "type": "gpio_analog_read" },
                    { "kind": "block", "type": "gpio_pwm_write", "inputs": { "VALUE": { "shadow": { "type": "math_number", "fields": { "NUM": 255 } } } } }
                ]
            },
            {
                "kind": "category",
                "name": "Sensors",
                "categorystyle": "sensors_category",
                "contents": [
                    { "kind": "label", "text": "Onboard" },
                    { "kind": "block", "type": "sensor_internal_temp" },
                    { "kind": "label", "text": "Environmental" },
                    { "kind": "block", "type": "sensor_dht_measure" },
                    { "kind": "block", "type": "sensor_dht11" },
                    { "kind": "block", "type": "sensor_ultrasonic_hcsr04" },
                    { "kind": "label", "text": "Input" },
                    { "kind": "block", "type": "sensor_pir_motion" },
                    { "kind": "block", "type": "sensor_limit_switch" },
                    { "kind": "block", "type": "sensor_analog_percent" },
                ]
            },
            {
                "kind": "category",
                "name": "Actuators",
                "categorystyle": "actuators_category",
                "contents": [
                    { "kind": "label", "text": "LED" },
                    { "kind": "block", "type": "actuator_onboard_led" },
                    { "kind": "block", "type": "actuator_led" },
                    { "kind": "block", "type": "actuator_led_toggle" },
                    { "kind": "label", "text": "Sound" },
                    { "kind": "block", "type": "actuator_buzzer_note", "inputs": { "DURATION": { "shadow": { "type": "math_number", "fields": { "NUM": 500 }}}} },
                    { "kind": "label", "text": "Movement" },
                    { "kind": "block", "type": "actuator_servo_positional", "inputs": { "ANGLE": { "shadow": { "type": "math_number", "fields": { "NUM": 90 } } } } },
                    { "kind": "block", "type": "actuator_servo_continuous", "inputs": { "SPEED": { "shadow": { "type": "math_number", "fields": { "NUM": 0 } } } } }
                ]
            },
            {
                "kind": "category", "name": "NeoPixel", "categorystyle": "actuators_category",
                "contents": [
                    { "kind": "block", "type": "actuator_neopixel_setup", "inputs": { "NUM_PIXELS": { "shadow": { "type": "math_number", "fields": { "NUM": 8 } } } } },
                    { "kind": "block", "type": "actuator_neopixel_brightness", "inputs": { "BRIGHTNESS": { "shadow": { "type": "math_number", "fields": { "NUM": 50 } } } } },
                    { "kind": "label", "text": "Set Pixels"},
                    { "kind": "block", "type": "actuator_neopixel_fill" },
                    { "kind": "block", "type": "actuator_neopixel_set", "inputs": { "PIXEL_NUM": { "shadow": { "type": "math_number", "fields": { "NUM": 0 } } } } },
                    { "kind": "label", "text": "Animation"},
                    { "kind": "block", "type": "actuator_neopixel_rainbow" },
                    { "kind": "block", "type": "actuator_neopixel_shift", "inputs": { "SHIFT": { "shadow": { "type": "math_number", "fields": { "NUM": 1 } } } } },
                    { "kind": "label", "text": "Control"},
                    { "kind": "block", "type": "actuator_neopixel_clear" },
                    { "kind": "block", "type": "actuator_neopixel_show" }
                ]
            },
            {
                "kind": "category",
                "name": "Display",
                "categorystyle": "display_blocks",
                "contents": [
                    { "kind": "label", "text": "Setup & Control" },
                    { "kind": "block", "type": "display_oled_setup" },
                    { "kind": "block", "type": "display_oled_show" },
                    { "kind": "block", "type": "display_oled_clear" },
                    { "kind": "block", "type": "display_oled_power" },
                    { "kind": "block", "type": "display_oled_contrast", "inputs": { "CONTRAST": { "shadow": { "type": "math_number", "fields": { "NUM": 255 } } } } },
                    { "kind": "block", "type": "display_oled_invert" },
                    { "kind": "sep", "gap": "16" },
                    { "kind": "label", "text": "Drawing" },
                    { "kind": "block", "type": "display_oled_text", "inputs": { "TEXT": { "shadow": { "type": "text", "fields": { "TEXT": "Hello" } } }, "X": { "shadow": { "type": "math_number", "fields": { "NUM": 0 } } }, "Y": { "shadow": { "type": "math_number", "fields": { "NUM": 0 } } } } },
                    { "kind": "block", "type": "display_oled_pixel", "inputs": { "X": { "shadow": { "type": "math_number", "fields": { "NUM": 64 } } }, "Y": { "shadow": { "type": "math_number", "fields": { "NUM": 32 } } } } },
                    { "kind": "block", "type": "display_oled_line", "inputs": { "X1": { "shadow": { "type": "math_number", "fields": { "NUM": 0 } } }, "Y1": { "shadow": { "type": "math_number", "fields": { "NUM": 0 } } }, "X2": { "shadow": { "type": "math_number", "fields": { "NUM": 127 } } }, "Y2": { "shadow": { "type": "math_number", "fields": { "NUM": 63 } } } } },
                    { "kind": "block", "type": "display_oled_rect", "inputs": { "X": { "shadow": { "type": "math_number", "fields": { "NUM": 10 } } }, "Y": { "shadow": { "type": "math_number", "fields": { "NUM": 10 } } }, "WIDTH": { "shadow": { "type": "math_number", "fields": { "NUM": 20 } } }, "HEIGHT": { "shadow": { "type": "math_number", "fields": { "NUM": 20 } } } } },
                    { "kind": "sep", "gap": "16" },
                    { "kind": "label", "text": "Images" },
                    { "kind": "block", "type": "display_oled_draw_image", "inputs": { "IMAGE": { "shadow": { "type": "variables_get", "fields": { "VAR": "my_image" } } }, "X": { "shadow": { "type": "math_number", "fields": { "NUM": 0 } } }, "Y": { "shadow": { "type": "math_number", "fields": { "NUM": 0 } } } } },
                    { "kind": "block", "type": "display_oled_create_image", "inputs": { "WIDTH": { "shadow": { "type": "math_number", "fields": { "NUM": 8 } } }, "HEIGHT": { "shadow": { "type": "math_number", "fields": { "NUM": 8 } } }, "DATA": { "shadow": { "type": "text", "fields": { "TEXT": "\\x81B$\\x18\\x18$B\\x81" } } } } },
                    { "kind": "sep", "gap": "16" },
                    { "kind": "label", "text": "Animation" },
                    { "kind": "block", "type": "display_oled_animate_fireworks", "inputs": { "DURATION": { "shadow": { "type": "math_number", "fields": { "NUM": 10 } } } } }
                ]
            },
            {
                "kind": "category",
                "name": "Communication",
                "categorystyle": "communication_category",
                "contents": [
                    { "kind": "label", "text": "USB Serial (REPL)" },
                    { "kind": "block", "type": "usb_serial_println", "inputs": { "DATA": { "shadow": { "type": "text", "fields": { "TEXT": "Hello, world!" } } } } },
                    { "kind": "block", "type": "usb_serial_print_value", "inputs": { "NAME": { "shadow": { "type": "text", "fields": { "TEXT": "Sensor Value" } } }, "VALUE": { "shadow": { "type": "math_number", "fields": { "NUM": 0 } } } } },
                    { "kind": "block", "type": "usb_serial_read_line" }
                ]
            },
            {
                "kind": "category",
                "name": "Wi-Fi",
                "categorystyle": "networking_blocks",
                "contents": [
                    { "kind": "label", "text": "Connection" },
                    { "kind": "block", "type": "wifi_connect", "inputs": { "SSID": { "shadow": { "type": "text", "fields": { "TEXT": "Your_SSID" }}}, "PASSWORD": { "shadow": { "type": "text", "fields": { "TEXT": "Your_Password" }}}}},
                    { "kind": "block", "type": "wifi_is_connected" },
                    { "kind": "block", "type": "wifi_get_ip" },
                    { "kind": "sep", "gap": "16" },
                    { "kind": "label", "text": "Get Information from Web" },
                    { "kind": "block", "type": "http_get_json", "inputs": { "URL": { "shadow": { "type": "text", "fields": { "TEXT": "http://worldtimeapi.org/api/ip" } } } } },
                    { "kind": "block", "type": "json_get_key", "inputs": { "JSON": { "shadow": { "type": "variables_get", "fields": { "VAR": "data" } } }, "KEY": { "shadow": { "type": "text", "fields": { "TEXT": "datetime" } } } } },
                    { "kind": "sep", "gap": "16" },
                    { "kind": "label", "text": "Send Information to Web" },
                    { "kind": "block", "type": "http_post_json", "inputs": { "URL": { "shadow": { "type": "text", "fields": { "TEXT": "IFTTT Webhook URL" }}}, "VALUE1": { "shadow": { "type": "text", "fields": { "TEXT": "Sensor reading" }}}}},
                    { "kind": "sep", "gap": "16" },
                    { "kind": "label", "text": "Act as Web Server" },
                    { "kind": "block", "type": "wifi_start_web_server" },
                    { "kind": "block", "type": "wifi_on_web_request" },
                    { "kind": "block", "type": "wifi_get_web_request_path" },
                    { "kind": "block", "type": "wifi_send_web_response", "inputs": { "HTML": { "shadow": { "type": "text", "fields": { "TEXT": "<h1>Hello from ESP32!</h1>" } } } } }
                ]
            },
            {
                "kind": "category", "name": "Bluetooth", "categorystyle": "bluetooth_blocks",
                "contents": [
                    { "kind": "block", "type": "ble_setup", "inputs": { "NAME": { "shadow": { "type": "text", "fields": { "TEXT": "MyESP32" }}}}},
                    { "kind": "block", "type": "ble_advertise_data", "inputs": { "DATA": { "shadow": { "type": "text", "fields": { "TEXT": "Hello" }}}}}
                ]
            }
        ]
    };
}


function createPicoToolbox() {
    return {
        "contents": [
            { "kind": "sep" },
            {
                "kind": "category", "name": "GPIO", "categorystyle": "gpio_category",
                "contents": [
                    { "kind": "block", "type": "gpio_digital_write" },
                    { "kind": "block", "type": "gpio_digital_read" },
                    { "kind": "block", "type": "gpio_analog_read" },
                    { "kind": "block", "type": "gpio_pwm_write", "inputs": { "VALUE": { "shadow": { "type": "math_number", "fields": { "NUM": 100 } } } } }
                ]
            },
            {
                "kind": "category", "name": "Sensors", "categorystyle": "sensors_category",
                "contents": [
                    { "kind": "label", "text": "Onboard" },
                    { "kind": "block", "type": "sensor_internal_temp" },
                    { "kind": "label", "text": "Environmental" },
                    { "kind": "block", "type": "sensor_dht_measure" },
                    { "kind": "block", "type": "sensor_dht11" },
                    { "kind": "block", "type": "sensor_ultrasonic_hcsr04" },
                    { "kind": "label", "text": "Input" },
                    { "kind": "block", "type": "sensor_pir_motion" },
                    { "kind": "block", "type": "sensor_limit_switch" },
                    { "kind": "block", "type": "sensor_analog_percent" },
                ]
            },
            {
                "kind": "category", "name": "Actuators", "categorystyle": "actuators_category",
                "contents": [
                    { "kind": "label", "text": "LED" },
                    { "kind": "block", "type": "actuator_onboard_led" },
                    { "kind": "block", "type": "actuator_led" },
                    { "kind": "block", "type": "actuator_led_toggle" },
                    { "kind": "label", "text": "Sound" },
                    { "kind": "block", "type": "actuator_buzzer_note", "inputs": { "DURATION": { "shadow": { "type": "math_number", "fields": { "NUM": 500 }}}} },
                    { "kind": "label", "text": "Movement" },
                    { "kind": "block", "type": "actuator_servo_positional", "inputs": { "ANGLE": { "shadow": { "type": "math_number", "fields": { "NUM": 90 } } } } },

                ]
            },
            {
                "kind": "category", "name": "NeoPixel", "categorystyle": "actuators_category",
                "contents": [
                    { "kind": "block", "type": "actuator_neopixel_setup", "inputs": { "NUM_PIXELS": { "shadow": { "type": "math_number", "fields": { "NUM": 8 } } } } },
                    { "kind": "block", "type": "actuator_neopixel_brightness", "inputs": { "BRIGHTNESS": { "shadow": { "type": "math_number", "fields": { "NUM": 50 } } } } },
                    { "kind": "label", "text": "Set Pixels"},
                    { "kind": "block", "type": "actuator_neopixel_fill" },
                    { 
                        "kind": "block", 
                        "type": "actuator_neopixel_set", 
                        "inputs": { 
                            "PIXEL_NUM": { "shadow": { "type": "math_number", "fields": { "NUM": 0 } } },
                            "COLOR": { "shadow": { "type": "colour_picker", "fields": { "COLOUR": "#ff0000" } } } 
                        } 
                    },

                    { "kind": "label", "text": "Animation"},
                    { "kind": "block", "type": "actuator_neopixel_rainbow" },
                    { "kind": "block", "type": "actuator_neopixel_shift", "inputs": { "SHIFT": { "shadow": { "type": "math_number", "fields": { "NUM": 1 } } } } },
                    { "kind": "label", "text": "Control"},
                    { "kind": "block", "type": "actuator_neopixel_clear" },
                    { "kind": "block", "type": "actuator_neopixel_show" }
                ]
            },
            {
                "kind": "category",
                "name": "Display",
                "categorystyle": "display_blocks",
                "contents": [
                    { "kind": "label", "text": "Setup & Control" },
                    { "kind": "block", "type": "display_oled_setup" },
                    { "kind": "block", "type": "display_oled_show" },
                    { "kind": "block", "type": "display_oled_clear" },
                    { "kind": "block", "type": "display_oled_power" },
                    { "kind": "block", "type": "display_oled_contrast", "inputs": { "CONTRAST": { "shadow": { "type": "math_number", "fields": { "NUM": 255 } } } } },
                    { "kind": "block", "type": "display_oled_invert" },
                    { "kind": "sep", "gap": "16" },
                    { "kind": "label", "text": "Drawing" },
                    { "kind": "block", "type": "display_oled_text", "inputs": { "TEXT": { "shadow": { "type": "text", "fields": { "TEXT": "Hello" } } }, "X": { "shadow": { "type": "math_number", "fields": { "NUM": 0 } } }, "Y": { "shadow": { "type": "math_number", "fields": { "NUM": 0 } } } } },
                    { "kind": "block", "type": "display_oled_pixel", "inputs": { "X": { "shadow": { "type": "math_number", "fields": { "NUM": 64 } } }, "Y": { "shadow": { "type": "math_number", "fields": { "NUM": 32 } } } } },
                    { "kind": "block", "type": "display_oled_line", "inputs": { "X1": { "shadow": { "type": "math_number", "fields": { "NUM": 0 } } }, "Y1": { "shadow": { "type": "math_number", "fields": { "NUM": 0 } } }, "X2": { "shadow": { "type": "math_number", "fields": { "NUM": 127 } } }, "Y2": { "shadow": { "type": "math_number", "fields": { "NUM": 63 } } } } },
                    { "kind": "block", "type": "display_oled_rect", "inputs": { "X": { "shadow": { "type": "math_number", "fields": { "NUM": 10 } } }, "Y": { "shadow": { "type": "math_number", "fields": { "NUM": 10 } } }, "WIDTH": { "shadow": { "type": "math_number", "fields": { "NUM": 20 } } }, "HEIGHT": { "shadow": { "type": "math_number", "fields": { "NUM": 20 } } } } },
                    { "kind": "sep", "gap": "16" },
                    { "kind": "label", "text": "Images" },
                    { 
                        "kind": "block", 
                        "type": "display_oled_draw_image",
                        "inputs": {
                            "IMAGE": {
                                "shadow": {
                                    "type": "variables_get",
                                    "fields": { "VAR": "my_image" }
                                }
                            },
                            "X": { "shadow": { "type": "math_number", "fields": { "NUM": 0 } } },
                            "Y": { "shadow": { "type": "math_number", "fields": { "NUM": 0 } } }
                        }
                    },
                    { 
                        "kind": "block", 
                        "type": "display_oled_create_image",
                        "inputs": {
                            "WIDTH": { "shadow": { "type": "math_number", "fields": { "NUM": 8 } } },
                            "HEIGHT": { "shadow": { "type": "math_number", "fields": { "NUM": 8 } } },
                            "DATA": { "shadow": { "type": "text", "fields": { "TEXT": "\\x81B$\\x18\\x18$B\\x81" }  } }
                        }
                    },                    
                    { "kind": "sep", "gap": "16" },
                    { "kind": "label", "text": "Animation" },
                    { "kind": "block", "type": "display_oled_animate_fireworks", "inputs": { "DURATION": { "shadow": { "type": "math_number", "fields": { "NUM": 10 } } } } }
                ]
            },
            {
                "kind": "category", "name": "Communication", "categorystyle": "communication_category",
                "contents": [
                    { "kind": "label", "text": "USB Serial (REPL)" },
                    { "kind": "block", "type": "usb_serial_println", "inputs": { "DATA": { "shadow": { "type": "text", "fields": { "TEXT": "Hello, world!" } } } } },
                    { "kind": "block", "type": "usb_serial_print_value", "inputs": { "NAME": { "shadow": { "type": "text", "fields": { "TEXT": "Sensor Value" } } }, "VALUE": { "shadow": { "type": "math_number", "fields": { "NUM": 0 } } } } },
                    { "kind": "block", "type": "usb_serial_read_line" }
                ]
            },
            {
                "kind": "category",
                "name": "Wi-Fi (Pico W)",
                "categorystyle": "networking_blocks",
                "contents": [
                    { "kind": "label", "text": "Connection" },
                    { "kind": "block", "type": "wifi_connect", "inputs": { "SSID": { "shadow": { "type": "text", "fields": { "TEXT": "Your_SSID" }}}, "PASSWORD": { "shadow": { "type": "text", "fields": { "TEXT": "Your_Password" }}}}},
                    { "kind": "block", "type": "wifi_is_connected" },
                    { "kind": "block", "type": "wifi_get_ip" },
                    { "kind": "sep", "gap": "16" },
                    { "kind": "label", "text": "Get Information from Web" },
                    { "kind": "block", "type": "http_get_json", "inputs": { "URL": { "shadow": { "type": "text", "fields": { "TEXT": "http://worldtimeapi.org/api/ip" } } } } },
                    { "kind": "block", "type": "json_get_key", "inputs": { "JSON": { "shadow": { "type": "variables_get", "fields": { "VAR": "data" } } }, "KEY": { "shadow": { "type": "text", "fields": { "TEXT": "datetime" } } } } },
                    { "kind": "sep", "gap": "16" },
                    { "kind": "label", "text": "Send Information to Web" },
                    { "kind": "block", "type": "http_post_json", "inputs": { "URL": { "shadow": { "type": "text", "fields": { "TEXT": "IFTTT Webhook URL" }}}, "VALUE1": { "shadow": { "type": "text", "fields": { "TEXT": "Sensor reading" }}}}},
                    { "kind": "sep", "gap": "16" },
                    { "kind": "label", "text": "Act as Web Server" },
                    { "kind": "block", "type": "wifi_start_web_server" },
                    { "kind": "block", "type": "wifi_on_web_request" },
                    { "kind": "block", "type": "wifi_get_web_request_path" },
                    { "kind": "block", "type": "wifi_send_web_response", "inputs": { "HTML": { "shadow": { "type": "text", "fields": { "TEXT": "<h1>Hello from Pico!</h1>" } } } } }
                ]
            },
            {
                "kind": "category", "name": "Bluetooth (Pico W)", "categorystyle": "bluetooth_blocks",
                "contents": [
                    { "kind": "block", "type": "ble_setup", "inputs": { "NAME": { "shadow": { "type": "text", "fields": { "TEXT": "MyPico" }}}}},
                    { "kind": "block", "type": "ble_advertise_data", "inputs": { "DATA": { "shadow": { "type": "text", "fields": { "TEXT": "Hello" }}}}}
                ]
            }
        ]
    };
}



// ===== 4. WORKSPACE CLASS (MODIFIED) =====
class BlocklyWorkspace {
    constructor(boardId) {
        applyBlockStyles();
        this.boardId = boardId;
        this.workspace = null;
        this.loadedExtensions = new Set();
        this.toolbox = this.createToolbox();
    }
    
    createToolbox() {
        let finalToolbox = createBasicToolbox();

        if (this.boardId === 'esp32') {
            finalToolbox.contents.push(...createEsp32Toolbox().contents);
        } else if (this.boardId === 'pico') { 
            finalToolbox.contents.push(...createPicoToolbox().contents);
        }

        return finalToolbox;
    }

    initialize() {
        this.workspace = Blockly.inject('blocklyArea', {
            theme: Esp32IdeTheme,
            toolbox: this.toolbox, 
            media: 'src/renderer/assets/blockly/media/',
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
            move: {
                scrollbars: {
                    horizontal: true,
                    vertical: true
                },
                drag: true,
                wheel: true
            }
        });
        
        this.registerCallbacks();

        micropythonGenerator.init(this.workspace);
        this.generateCode();
    }

    registerCallbacks() {
        this.workspace.registerButtonCallback('CREATE_VARIABLE', (button) => {
            Blockly.Variables.createVariableButtonHandler(button.getTargetWorkspace());
        });
        
        this.workspace.registerToolboxCategoryCallback('ADD_EXTENSION', () => {
            if (window.esp32IDE) {
                window.esp32IDE.showExtensionModal();
            }
            // Return null to prevent the category from being selected.
            return null; 
        });
    }

    addExtensionCategory(extensionId) {
        if (this.loadedExtensions.has(extensionId) || !extensionCategories[extensionId]) {
            return;
        }

        const extensionCategory = extensionCategories[extensionId];
        // Insert before the separator and 'Add Extension' button.
        this.toolbox.contents.splice(this.toolbox.contents.length - 2, 0, extensionCategory);
        this.loadedExtensions.add(extensionId);
        this.workspace.updateToolbox(this.toolbox);
    }

    generateCode() {
        if (!this.workspace) return;
        const code = micropythonGenerator.workspaceToCode(this.workspace);
        const event = new CustomEvent('codeUpdated', {
            detail: code
        });
        window.dispatchEvent(event);
    }
}

// ===== 5. GLOBAL INITIALIZATION (MODIFIED) =====
// Reverted to its simpler form. It no longer needs to handle callbacks.
function setupBlocklyForBoard(boardId) {
    if (window.blockyManagerInstance) {
        return; // Avoid re-initializing
    }
    const blocklyManager = new BlocklyWorkspace(boardId);
    blocklyManager.initialize();
    window.blockyManagerInstance = blocklyManager;
}