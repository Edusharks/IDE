// src/ide/blockly/blockly-init.js

import * as Blockly from 'blockly/core';

// --- Plugins ---
import { Backpack } from '@blockly/workspace-backpack';
import { CrossTabCopyPaste } from '@blockly/plugin-cross-tab-copy-paste';
import { ZoomToFitControl } from '@blockly/zoom-to-fit';
import { PositionedMinimap } from '@blockly/workspace-minimap';
import { ScrollBlockDragger, ScrollMetricsManager, ScrollOptions } from '@blockly/plugin-scroll-options';

// --- Import Modular Hardware Blocks ---
import { registerNeoPixelBlocks } from './neopixel_blocks.js';
import { registerOledBlocks } from './oled_blocks.js';
import { registerWifiBlocks } from './wifi_blocks.js';
import { registerSensorBlocks } from './sensors_blocks.js';
import { registerActuatorBlocks } from './actuators_blocks.js';
import { registerCommunicationBlocks } from './communication_blocks.js';
import { registerBluetoothBlocks } from './bluetooth_blocks.js';

// --- Import Board-Specific Low-Level Modules ---
import { registerEsp32Blocks, ESP32_PINS } from './esp32-blocks.js';
import { registerPicoBlocks, PICO_PINS } from './pico-blocks.js';

// --- Custom Category Class (For styling) ---
class CustomCategory extends Blockly.ToolboxCategory {
    constructor(categoryDef, toolbox, opt_parent) {
        super(categoryDef, toolbox, opt_parent);
    }

    setSelected(isSelected) {
        this.rowDiv_.classList.toggle('blocklyTreeSelected', isSelected);
    }

    createDom_() {
        super.createDom_();
        this.rowDiv_.classList.add('blocklyTreeRow');
        let colour = this.colour_;
        if (!colour && this.toolboxItemDef_['categorystyle']) {
            const theme = this.parentToolbox_.getWorkspace().getTheme();
            const styleName = this.toolboxItemDef_['categorystyle'];
            const styleDef = theme.categoryStyles[styleName];

            if (styleDef && styleDef.colour) {
                colour = styleDef.colour;
            }
        }

        if (!colour && this.toolboxItemDef_['colour']) {
            colour = this.toolboxItemDef_['colour'];
        }
        if (colour) {
            this.rowDiv_.style.setProperty('--category-color', colour);
        }

        return this.htmlDiv_;
    }
}

// Register the custom category class
Blockly.registry.register(
    Blockly.registry.Type.TOOLBOX_ITEM,
    Blockly.ToolboxCategory.registrationName,
    CustomCategory,
    true
);

// ==================================================================
// 1. THEME DEFINITION
// ==================================================================
const Esp32IdeTheme = Blockly.Theme.defineTheme('esp32-ide-final', {
    'base': Blockly.Themes.Zelos,
    'blockStyles': {
        'loops_blocks': { 'colourPrimary': '#ffc800' },
        'logic_blocks': { 'colourPrimary': '#EF4444' },
        'math_blocks': { 'colourPrimary': '#8B5CF6' },
        'text_blocks': { 'colourPrimary': '#F97316' },
        'lists_blocks': { 'colourPrimary': '#F43F5E' },
        'variable_blocks': { 'colourPrimary': '#EC4899' },
        'procedure_blocks': { 'colourPrimary': '#D946EF' },
        'wait_block_style': { 'colourPrimary': '#EAB308' },
        'gpio_blocks': { 'colourPrimary': '#0EA5E9' },
        'sensor_blocks': { 'colourPrimary': '#10B981' },
        'actuator_blocks': { 'colourPrimary': '#22C55E' },
        'communication_blocks': { 'colourPrimary': '#6366F1' },
        'display_blocks': { 'colourPrimary': '#4F46E5' },
        'networking_blocks': { 'colourPrimary': '#16A34A' },
        'bluetooth_blocks': { 'colourPrimary': '#3B82F6' },
        'face_landmark_blocks': { 'colourPrimary': '#7C3AED' },
        'hand_gesture_blocks': { 'colourPrimary': '#F59E0B' },
        'image_classification_blocks': { 'colourPrimary': '#2DD4BF' },
        'object_detection_blocks': { 'colourPrimary': '#0891B2' },
    },
    'categoryStyles': {
        'loops_category': { 'colour': '#ffc800' },
        'logic_category': { 'colour': '#EF4444' },
        'math_category': { 'colour': '#8B5CF6' },
        'text_category': { 'colour': '#F97316' },
        'lists_category': { 'colour': '#F43F5E' },
        'colour_category': { 'colour': '#14B8A6' },
        'variables_category': { 'colour': '#EC4899' },
        'functions_category': { 'colour': '#D946EF' },
        'gpio_category': { 'colour': '#0EA5E9' },
        'sensors_category': { 'colour': '#10B981' },
        'actuators_category': { 'colour': '#22C55E' },
        'communication_category': { 'colour': '#6366F1' },
        'display_category': { 'colour': '#4F46E5' },
        'networking_category': { 'colour': '#16A34A' },
        'bluetooth_category': { 'colour': '#3B82F6' },
        'face_landmark_category': { 'colour': '#7C3AED' },
        'hand_gesture_category': { 'colour': '#F59E0B' },
        'image_classification_category': { 'colour': '#2DD4BF' },
        'object_detection_category': { 'colour': '#0891B2' },
    },
    'componentStyles': {
        'workspaceBackgroundColour': 'var(--bg-main)',
        'toolboxBackgroundColour': 'var(--bg-toolbox)',
        'flyoutBackgroundColour': 'var(--bg-flyout)',
        'scrollbarColour': 'var(--border-color)'
    },
    'fontStyle': { 'family': "'Nunito', sans-serif", 'weight': '600', 'size': 12 }
});

// ==================================================================
// 2. TOOLBOX CATEGORY DEFINITIONS
// ==================================================================

function getBasicToolbox() {
    return [
        { "kind": "search", "name": "Search", "contents": [] },
        {
            "kind": "category", "name": "Loops", "categorystyle": "loops_category", "contents": [
                { "kind": "block", "type": "on_start" },
                { "kind": "block", "type": "forever" },
                { "kind": "block", "type": "every_x_ms" },
                { "kind": "block", "type": "control_delay_seconds", "inputs": { "DELAY_SEC": { "shadow": { "type": "math_number", "fields": { "NUM": 1 } } } } },
                { "kind": "block", "type": "controls_repeat_ext", "inputs": { "TIMES": { "shadow": { "type": "math_number", "fields": { "NUM": 4 } } } } },
                { "kind": "block", "type": "controls_whileUntil" },
                { "kind": "block", "type": "controls_for", "inputs": { "FROM": { "shadow": { "type": "math_number", "fields": { "NUM": 0 } } }, "TO": { "shadow": { "type": "math_number", "fields": { "NUM": 4 } } }, "BY": { "shadow": { "type": "math_number", "fields": { "NUM": 1 } } } } },
                { "kind": "block", "type": "controls_forEach" },
                { "kind": "block", "type": "controls_flow_statements" },
                { "kind": "sep", "gap": "16" },
                { "kind": "label", "text": "Async" },
                { "kind": "block", "type": "async_run_main_loop" },
                { "kind": "block", "type": "async_sleep_ms", "inputs": { "MS": { "shadow": { "type": "math_number", "fields": { "NUM": 100 } } } } }
            ]
        },
        {
            "kind": "category", "name": "Logic", "categorystyle": "logic_category", "contents": [
                { "kind": "block", "type": "controls_if" },
                { "kind": "block", "type": "logic_compare" },
                { "kind": "block", "type": "logic_operation" },
                { "kind": "block", "type": "logic_negate" },
                { "kind": "block", "type": "logic_boolean" },
            ]
        },
        {
            "kind": "category", "name": "Math", "categorystyle": "math_category", "contents": [
                { "kind": "block", "type": "math_number" },
                { "kind": "block", "type": "math_arithmetic", "inputs": { "A": { "shadow": { "type": "math_number", "fields": { "NUM": 1 } } }, "B": { "shadow": { "type": "math_number", "fields": { "NUM": 1 } } } } },
                { "kind": "block", "type": "math_single", "inputs": { "NUM": { "shadow": { "type": "math_number", "fields": { "NUM": 9 } } } } },
                { "kind": "block", "type": "math_modulo", "inputs": { "DIVIDEND": { "shadow": { "type": "math_number", "fields": { "NUM": 64 } } }, "DIVISOR": { "shadow": { "type": "math_number", "fields": { "NUM": 10 } } } } },
                { "kind": "block", "type": "math_constrain", "inputs": { "VALUE": { "shadow": { "type": "math_number", "fields": { "NUM": 50 } } }, "LOW": { "shadow": { "type": "math_number", "fields": { "NUM": 1 } } }, "HIGH": { "shadow": { "type": "math_number", "fields": { "NUM": 100 } } } } },
                { "kind": "block", "type": "math_random_int", "inputs": { "FROM": { "shadow": { "type": "math_number", "fields": { "NUM": 1 } } }, "TO": { "shadow": { "type": "math_number", "fields": { "NUM": 100 } } } } },
                { "kind": "block", "type": "math_map", "inputs": { "VALUE": { "shadow": { "type": "math_number", "fields": { "NUM": 512 } } }, "FROM_LOW": { "shadow": { "type": "math_number", "fields": { "NUM": 0 } } }, "FROM_HIGH": { "shadow": { "type": "math_number", "fields": { "NUM": 1023 } } }, "TO_LOW": { "shadow": { "type": "math_number", "fields": { "NUM": 0 } } }, "TO_HIGH": { "shadow": { "type": "math_number", "fields": { "NUM": 100 } } } } },
                { "kind": "block", "type": "math_round" },
                { "kind": "block", "type": "math_number_slider" }
            ]
        },
        {
            "kind": "category", "name": "Text", "categorystyle": "text_category", "contents": [
                { "kind": "block", "type": "text" },
                { "kind": "block", "type": "text_multiline" },
                { "kind": "block", "type": "text_join" },
                { "kind": "block", "type": "text_length", "inputs": { "VALUE": { "shadow": { "type": "text", "fields": { "TEXT": "abc" } } } } },
                { "kind": "block", "type": "text_isEmpty", "inputs": { "VALUE": { "shadow": { "type": "text", "fields": { "TEXT": "" } } } } },
                { "kind": "block", "type": "text_indexOf", "inputs": { "VALUE": { "shadow": { "type": "text", "fields": { "TEXT": "hello world" } } }, "FIND": { "shadow": { "type": "text", "fields": { "TEXT": "world" } } } } },
                { "kind": "block", "type": "text_charAt", "inputs": { "VALUE": { "shadow": { "type": "text", "fields": { "TEXT": "abc" } } } } },
                { "kind": "block", "type": "text_getSubstring", "inputs": { "STRING": { "shadow": { "type": "text", "fields": { "TEXT": "hello world" } } } } },
                { "kind": "block", "type": "text_parse_to_number", "inputs": { "TEXT": { "shadow": { "type": "text", "fields": { "TEXT": "123" } } } } },
                { "kind": "block", "type": "text_convert_to_text", "inputs": { "VALUE": { "shadow": { "type": "math_number", "fields": { "NUM": 0 } } } } },
            ]
        },
        {
            "kind": "category", "name": "Lists", "categorystyle": "lists_category", "contents": [
                { "kind": "block", "type": "lists_create_with" },
                { "kind": "block", "type": "lists_length" },
                { "kind": "block", "type": "lists_isEmpty" },
                { "kind": "block", "type": "lists_indexOf" },
                { "kind": "block", "type": "lists_getIndex" },
                { "kind": "block", "type": "lists_setIndex" },
                { "kind": "block", "type": "lists_getSublist" },
                { "kind": "block", "type": "lists_get_random_item" },
            ]
        },
        { "kind": "category", "name": "Variables", "categorystyle": "variables_category", "custom": "VARIABLE" },
        { "kind": "category", "name": "Functions", "categorystyle": "functions_category", "custom": "PROCEDURE" },
    ];
}

function getSensorCategory() {
    return {
        "kind": "category", "name": "Sensors", "categorystyle": "sensors_category",
        "contents": [
            { "kind": "label", "text": "🔘 Button" },
            { "kind": "block", "type": "sensor_button_is_pressed" },
            { "kind": "block", "type": "sensor_button_wait" },
            { "kind": "sep", "gap": "12" },
            { "kind": "label", "text": "🔛 Slide Switch" },
            { "kind": "block", "type": "sensor_switch_is_on" },
            { "kind": "sep", "gap": "12" },
            { "kind": "label", "text": "🎚️ Potentiometer" },
            { "kind": "block", "type": "sensor_pot_read" },
            { "kind": "sep", "gap": "12" },
            { "kind": "label", "text": "🦇 Ultrasonic" },
            { "kind": "block", "type": "sensor_ultrasonic_read" },
            { "kind": "sep", "gap": "12" },
            { "kind": "label", "text": "📡 IR Obstacle" },
            { "kind": "block", "type": "sensor_ir_read_digital" },
            { "kind": "block", "type": "sensor_ir_read_analog" },
            { "kind": "block", "type": "sensor_ir_is_obstacle" },
            { "kind": "sep", "gap": "12" },
            { "kind": "label", "text": "☀️ Light (LDR)" },
            { "kind": "block", "type": "sensor_ldr_read_analog" },
            { "kind": "block", "type": "sensor_ldr_read_digital" },
            { "kind": "block", "type": "sensor_ldr_is_status" },
            { "kind": "sep", "gap": "12" },
            { "kind": "label", "text": "🏃 Motion (PIR)" },
            { "kind": "block", "type": "sensor_pir_read_digital" },
            { "kind": "block", "type": "sensor_pir_motion" },
            { "kind": "sep", "gap": "12" },
            { "kind": "label", "text": "🌱 Soil Moisture" },
            { "kind": "block", "type": "sensor_soil_read_analog" },
            { "kind": "block", "type": "sensor_soil_read_digital" },
            { "kind": "sep", "gap": "12" },
            { "kind": "label", "text": "🌡️ Temp/Hum (DHT11)" },
            { "kind": "block", "type": "sensor_dht11_read" }
        ]
    };
}

function getActuatorCategory() {
    return {
        "kind": "category", "name": "Actuators", "categorystyle": "actuators_category",
        "contents": [
            { "kind": "label", "text": "💡 LED Module" },
            { "kind": "block", "type": "actuator_builtin_led" },
            { "kind": "block", "type": "actuator_led_set" },
            { "kind": "block", "type": "actuator_led_toggle" },
            { "kind": "block", "type": "actuator_led_brightness" },
            { "kind": "sep", "gap": "12" },
            { "kind": "label", "text": "🌈 RGB LED" },
            { "kind": "block", "type": "actuator_rgb_set" },
            { "kind": "sep", "gap": "12" },
            { "kind": "label", "text": "🔊 Buzzer" },
            { "kind": "block", "type": "actuator_buzzer_tone" },
            { "kind": "block", "type": "actuator_buzzer_note" },
            { "kind": "sep", "gap": "12" },
            { "kind": "label", "text": "🦾 Servo Motor" },
            {
                "kind": "block",
                "type": "actuator_servo_write",
                "inputs": {
                    "ANGLE": {
                        "shadow": {
                            "type": "math_angle_shadow",
                            "fields": { "ANGLE": 90 }
                        }
                    }
                }
            },
            { "kind": "block", "type": "actuator_servo_continuous" },
            { "kind": "sep", "gap": "12" },
            { "kind": "label", "text": "⚙️ DC Motor" },
            { "kind": "block", "type": "actuator_motor_speed" }
        ]
    };
}

function getNeoPixelCategory() {
    return {
        "kind": "category", "name": "NeoPixel", "categorystyle": "actuators_category",
        "contents": [
            { "kind": "label", "text": "Setup" },
            { "kind": "block", "type": "actuator_neopixel_setup" },
            { "kind": "block", "type": "actuator_neopixel_brightness" },
            { "kind": "block", "type": "actuator_neopixel_brightness_val" },
            { "kind": "sep", "gap": "12" },
            { "kind": "label", "text": "Control" },
            { "kind": "block", "type": "actuator_neopixel_fill" },
            { "kind": "block", "type": "actuator_neopixel_set" },
            { "kind": "block", "type": "actuator_neopixel_show" },
            { "kind": "block", "type": "actuator_neopixel_clear" },
            { "kind": "block", "type": "actuator_neopixel_shift" },
            { "kind": "block", "type": "actuator_neopixel_rainbow" },
            { "kind": "sep", "gap": "12" },
            { "kind": "label", "text": "Colors" },
            { "kind": "block", "type": "colour_picker" },
            { "kind": "block", "type": "colour_hsv_sliders_picker" },
            { "kind": "block", "type": "colour_rgb_value" },
            { "kind": "block", "type": "colour_random" },
            { "kind": "block", "type": "colour_from_hex" }
        ]
    };
}

function getDisplayCategory() {
    return {
        "kind": "category", "name": "Display", "categorystyle": "display_category",
        "contents": [
            { "kind": "label", "text": "Setup" },
            { "kind": "block", "type": "display_oled_setup" },
            { "kind": "sep", "gap": "8" },
            { "kind": "label", "text": "Draw" },
            { "kind": "block", "type": "display_oled_text", "inputs": { "TEXT": { "shadow": { "type": "text", "fields": { "TEXT": "Hello" } } } } },
            { "kind": "block", "type": "display_oled_pixel" },
            { "kind": "block", "type": "display_oled_line" },
            { "kind": "block", "type": "display_oled_rect" },
            { "kind": "block", "type": "display_oled_draw_bitmap" },
            { "kind": "sep", "gap": "8" },

            { "kind": "label", "text": "Images (Advanced)" },
            { "kind": "block", "type": "display_oled_create_image" },
            { "kind": "block", "type": "display_oled_draw_image" },
            { "kind": "sep", "gap": "8" },

            { "kind": "label", "text": "Control" },
            { "kind": "block", "type": "display_oled_show" },
            { "kind": "block", "type": "display_oled_clear" },
            { "kind": "block", "type": "display_oled_animate_fireworks" },
            { "kind": "block", "type": "display_oled_power" },
            { "kind": "block", "type": "display_oled_contrast" },
            { "kind": "block", "type": "display_oled_invert" }
        ]
    };
}

function getWifiCategory() {
    return {
        "kind": "category", "name": "Wi-Fi", "categorystyle": "networking_category",
        "contents": [
            { "kind": "label", "text": "Connection" },
            {
                "kind": "block",
                "type": "wifi_connect",
                "inputs": {
                    "SSID": { "shadow": { "type": "text", "fields": { "TEXT": "wifi_id" } } },
                    "PASSWORD": { "shadow": { "type": "text", "fields": { "TEXT": "" } } }
                }
            },
            { "kind": "block", "type": "wifi_is_connected" },
            { "kind": "block", "type": "wifi_get_ip" },
            { "kind": "sep", "gap": "8" },

            { "kind": "label", "text": "Web Server" },
            { "kind": "block", "type": "wifi_start_web_server" },
            { "kind": "block", "type": "wifi_on_web_request" },
            {
                "kind": "block",
                "type": "wifi_send_web_response",
                "inputs": {
                    "HTML": { "shadow": { "type": "text_multiline", "fields": { "TEXT": "<h1>Hello World</h1>" } } }
                }
            },
            { "kind": "block", "type": "wifi_get_web_request_path" },
            { "kind": "sep", "gap": "8" },

            { "kind": "label", "text": "HTTP Requests" },
            {
                "kind": "block",
                "type": "http_get_json",
                "inputs": {
                    "URL": { "shadow": { "type": "text", "fields": { "TEXT": "https://api.example.com/data" } } }
                }
            },
            {
                "kind": "block",
                "type": "json_get_key",
                "inputs": {
                    "KEY": { "shadow": { "type": "text", "fields": { "TEXT": "key_name" } } }
                }
            },
            {
                "kind": "block",
                "type": "http_post_json",
                "inputs": {
                    "URL": { "shadow": { "type": "text", "fields": { "TEXT": "https://blockide.ifttt.com/trigger/..." } } },
                    "VALUE1": { "shadow": { "type": "text", "fields": { "TEXT": "" } } },
                    "VALUE2": { "shadow": { "type": "text", "fields": { "TEXT": "" } } },
                    "VALUE3": { "shadow": { "type": "text", "fields": { "TEXT": "" } } }
                }
            }
        ]
    };
}

function getCommunicationCategory() {
    return {
        "kind": "category",
        "name": "Communication",
        "categorystyle": "communication_category",
        "contents": [
            { "kind": "label", "text": "Console Output" },
            {
                "kind": "block",
                "type": "comm_print_line",
                "inputs": { "DATA": { "shadow": { "type": "text", "fields": { "TEXT": "Hello" } } } }
            },
            {
                "kind": "block",
                "type": "comm_print_value",
                "inputs": { "NAME": { "shadow": { "type": "text", "fields": { "TEXT": "Sensor" } } }, "VALUE": { "shadow": { "type": "math_number", "fields": { "NUM": 100 } } } }
            },
            {
                "kind": "block",
                "type": "comm_print_no_newline",
                "inputs": { "DATA": { "shadow": { "type": "text", "fields": { "TEXT": "Temp: " } } } }
            },

            { "kind": "sep", "gap": "24" },

            { "kind": "label", "text": "Console Input" },
            { "kind": "block", "type": "comm_read_line" },

            { "kind": "sep", "gap": "24" },

            { "kind": "label", "text": "Live Plotter" },
            {
                "kind": "block",
                "type": "comm_plot_simple",
                "inputs": { "VALUE": { "shadow": { "type": "math_number", "fields": { "NUM": 0 } } } }
            },
            {
                "kind": "block",
                "type": "comm_plot_advanced",
                "inputs": {
                    "VALUE": { "shadow": { "type": "math_number", "fields": { "NUM": 0 } } },
                    "NAME": { "shadow": { "type": "text", "fields": { "TEXT": "Temperature" } } }
                }
            },

            { "kind": "sep", "gap": "24" },

            { "kind": "label", "text": "IDE Control" },
            {
                "kind": "block",
                "type": "comm_send_ai_command",
                "inputs": { "PARAM": { "shadow": { "type": "text", "fields": { "TEXT": "" } } } }
            },
        ]
    };
}

function getBoardSpecificCategory(boardId) {
    return {
        "kind": "category",
        "name": boardId === 'esp32' ? "ESP32 GPIO" : "Pico GPIO",
        "categorystyle": "gpio_category",
        "contents": [
            { "kind": "block", "type": "gpio_digital_write" },
            { "kind": "block", "type": "gpio_digital_read" },
            { "kind": "block", "type": "gpio_analog_read" },
            // --- FIX: Explicitly define shadow for the PWM slider input ---
            {
                "kind": "block",
                "type": "gpio_pwm_write",
                "inputs": {
                    "VALUE": {
                        "shadow": {
                            "type": "math_number_slider",
                            "fields": { "NUM": 128 }
                        }
                    }
                }
            },
            { "kind": "block", "type": "gpio_on_pin_change" },
            { "kind": "block", "type": "sensor_internal_temp" }
        ]
    };
}

// ==================================================================
// 3. WORKSPACE MANAGER
// ==================================================================

class BlocklyWorkspaceManager {
    constructor(boardId, generator) {
        this.boardId = boardId;
        this.workspace = null;
        this.generator = generator;
        this.toolbox = null;

        if (this.boardId === 'esp32') {
            this.pinConfig = ESP32_PINS;
        } else {
            this.pinConfig = PICO_PINS;
        }
    }

    registerBlocks() {
        const digitalInputPins = this.boardId === 'esp32' ? this.pinConfig.digitalInput : this.pinConfig.digital;
        const digitalOutputPins = this.boardId === 'esp32' ? this.pinConfig.digitalOutput : this.pinConfig.digital;
        const pwmPins = this.pinConfig.pwm;
        const adcPins = this.pinConfig.adc;
        const i2cPins = this.pinConfig.i2c;

        registerSensorBlocks({ digital: digitalInputPins, adc: adcPins });
        registerActuatorBlocks({ digital: digitalOutputPins, pwm: pwmPins });
        registerNeoPixelBlocks(digitalOutputPins);
        registerOledBlocks(i2cPins);
        registerWifiBlocks();
        registerCommunicationBlocks();
        registerBluetoothBlocks();

        if (this.boardId === 'esp32') {
            registerEsp32Blocks();
        } else {
            registerPicoBlocks();
        }
    }

    buildToolbox() {
        const toolbox = {
            "kind": "categoryToolbox",
            "contents": [
                ...getBasicToolbox(),
                { "kind": "sep" },
                // Default Categories
                getBoardSpecificCategory(this.boardId),
                getSensorCategory(),
                getActuatorCategory(),
                getCommunicationCategory(),

                // Extension Point
                { "kind": "sep" },
                { "kind": "category", "name": "Extensions", "categorystyle": "functions_category", "custom": "ADD_EXTENSION" }
            ]
        };
        this.toolbox = toolbox;
        return toolbox;
    }

    async initialize() {
        this.registerBlocks();

        this.workspace = Blockly.inject('blocklyArea', {
            theme: Esp32IdeTheme,
            toolbox: this.buildToolbox(),
            renderer: 'zelos',
            media: 'https://unpkg.com/blockly/media/',
            grid: { spacing: 20, length: 1, colour: 'var(--border-color)', snap: true },
            zoom: { controls: true, wheel: true, startScale: 0.9, maxScale: 3, minScale: 0.3, scaleSpeed: 1.2 },
            trashcan: true,
            move: { scrollbars: { horizontal: true, vertical: true }, drag: true, wheel: true },
        });

        /* const backpack = new Backpack(this.workspace);

        const originalBackpackPosition = backpack.position;
        backpack.position = function(metrics, savedPositions) {
            originalBackpackPosition.call(this, metrics, savedPositions);
            if (this.svgGroup_) {
                const currentTransform = this.svgGroup_.getAttribute('transform');
                if (currentTransform) {
                    const match = /translate\(\s*([-\d.]+),\s*([-\d.]+)\s*\)/.exec(currentTransform);
                    if (match) {
                        const x = parseFloat(match[1]);
                        const newY = 160; 
                        
                        this.svgGroup_.setAttribute('transform', `translate(${x}, ${newY})`);
                    }
                }
            }
        };

        backpack.init(); */

        const crossTabCopyPaste = new CrossTabCopyPaste();
        crossTabCopyPaste.init({ contextMenu: true, shortcut: true });

        const zoomToFit = new ZoomToFitControl(this.workspace);
        zoomToFit.init();

        const minimap = new PositionedMinimap(this.workspace);
        minimap.init();

        this.registerCallbacks();
        this.generator.init(this.workspace);
    }

    registerCallbacks() {
        this.workspace.registerButtonCallback('CREATE_VARIABLE', (button) => {
            Blockly.Variables.createVariableButtonHandler(button.getTargetWorkspace());
        });

        this.workspace.registerToolboxCategoryCallback('ADD_EXTENSION', () => {
            if (window.ide) {
                window.ide.showExtensionModal();
            }
            return null;
        });
    }

    rebuildAndApplyToolbox(loadedExtensionsSet, dynamicDashboardBlocks = []) {

        const metrics = this.workspace.getMetrics();
        const scrollX = this.workspace.scrollX;
        const scrollY = this.workspace.scrollY;
        const scale = this.workspace.scale;


        const newToolbox = JSON.parse(JSON.stringify(this.toolbox));

        const extensionMap = {
            'neopixel': getNeoPixelCategory(),
            'display': getDisplayCategory(),
            'wifi': getWifiCategory(),
            'bluetooth': {
                "kind": "category", "name": "Bluetooth", "categorystyle": "bluetooth_category",
                "contents": [{ "kind": "block", "type": "ble_setup" }, { "kind": "block", "type": "ble_advertise_data" }]
            },
            'face_landmark': { "kind": "category", "name": "Face Landmark", "categorystyle": "face_landmark_category", "contents": [{ "kind": "block", "type": "face_landmark_enable" }, { "kind": "block", "type": "face_landmark_on_face_data" }, { "kind": "block", "type": "face_landmark_get_face_count" }, { "kind": "block", "type": "face_landmark_is_expression" }, { "kind": "block", "type": "face_landmark_get_blendshape_value" }] },
            'hand_gesture': { "kind": "category", "name": "Hand Gesture", "categorystyle": "hand_gesture_category", "contents": [{ "kind": "block", "type": "hand_gesture_enable" }, { "kind": "block", "type": "hand_gesture_on_gesture" }, { "kind": "block", "type": "hand_gesture_get_hand_count" }, { "kind": "block", "type": "hand_gesture_is_hand_present" }] },
            'image_classification': { "kind": "category", "name": "Image Classification", "categorystyle": "image_classification_category", "contents": [{ "kind": "block", "type": "image_classification_enable" }, { "kind": "block", "type": "image_classification_on_class" }, { "kind": "block", "type": "image_classification_is_class" }, { "kind": "block", "type": "image_classification_get_class" }] },
            'object_detection': { "kind": "category", "name": "Object Detection", "categorystyle": "object_detection_category", "contents": [{ "kind": "block", "type": "object_detection_enable" }, { "kind": "block", "type": "object_detection_on_object" }, { "kind": "block", "type": "object_detection_is_object_detected" }, { "kind": "block", "type": "object_detection_for_each" }, { "kind": "block", "type": "object_detection_get_property" }] },

            'custom_model': {
                "kind": "category",
                "name": "Custom Model",
                "categorystyle": "image_classification_category",
                "contents": [
                    {
                        "kind": "block",
                        "type": "custom_model_enable",
                        "fields": { "STATE": "OFF" }
                    },
                    { "kind": "block", "type": "custom_model_when_class" },
                    { "kind": "block", "type": "custom_model_is_class" }
                ]
            }
        };

        const categoriesToAdd = [];

        loadedExtensionsSet.forEach(extensionId => {
            if (extensionMap[extensionId]) {
                categoriesToAdd.push(extensionMap[extensionId]);
            }

            if (extensionId === 'iot_dashboard' && dynamicDashboardBlocks.length > 0) {
                const dashboardCategory = {
                    "kind": "category",
                    "name": "Dashboard",
                    "categorystyle": "networking_category",
                    "contents": dynamicDashboardBlocks.map(blockDef => ({ "kind": "block", "type": blockDef.type }))
                };
                categoriesToAdd.push(dashboardCategory);
            }
        });

        const addExtensionIndex = newToolbox.contents.findIndex(cat => cat.custom === 'ADD_EXTENSION');
        const insertIndex = (addExtensionIndex !== -1) ? addExtensionIndex : newToolbox.contents.length;

        if (categoriesToAdd.length > 0) {
            newToolbox.contents.splice(insertIndex, 0, { "kind": "sep" }, ...categoriesToAdd);
        }

        this.workspace.updateToolbox(newToolbox);
        this.workspace.setScale(scale);
        this.workspace.scroll(scrollX, scrollY);
    }

    rebuildToolboxForCustomModel() {
        if (window.ide) {
            this.rebuildAndApplyToolbox(window.ide.loadedExtensions, window.ide.dashboardBuilder?.getDashboardBlockDefinitions() || []);
        }
    }

    generateCode() {
        if (!this.workspace) return;
        const codeObject = this.generator.workspaceToCode(this.workspace);
        window.dispatchEvent(new CustomEvent('codeUpdated', { detail: codeObject.fullScript }));
    }
}

export function initializeBlockly(boardId, generator) {
    ['procedures_defnoreturn', 'procedures_defreturn'].forEach(type => {
        if (Blockly.Blocks[type]) {
            const originalInit = Blockly.Blocks[type].init;
            Blockly.Blocks[type].init = function () {
                originalInit.call(this);
                this.toString = function () {
                    return this.getFieldValue('NAME');
                };
            };
        }
    });

    if (window.blockyManagerInstance) {
        console.warn("Blockly manager instance already exists.");
        return;
    }
    const manager = new BlocklyWorkspaceManager(boardId, generator);
    manager.initialize();
    window.blockyManagerInstance = manager;
}