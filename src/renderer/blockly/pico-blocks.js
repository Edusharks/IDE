
// src/renderer/blockly/pico-blocks.js
'use strict';

(() => {
    // === 1. DEFINE PICO-SPECIFIC PIN LISTS ===
    const PICO_DIGITAL_PINS = [
        ["GP0", "0"], ["GP1", "1"], ["GP2", "2"], ["GP3", "3"], ["GP4", "4"], ["GP5", "5"],
        ["GP6", "6"], ["GP7", "7"], ["GP8", "8"], ["GP9", "9"], ["GP10", "10"], ["GP11", "11"],
        ["GP12", "12"], ["GP13", "13"], ["GP14", "14"], ["GP15", "15"], ["GP16", "16"],
        ["GP17", "17"], ["GP18", "18"], ["GP19", "19"], ["GP20", "20"], ["GP21", "21"],
        ["GP22", "22"], ["GP26", "26"], ["GP27", "27"], ["GP28", "28"]
    ];
    const PICO_PWM_PINS = PICO_DIGITAL_PINS;
    const PICO_ADC_PINS = [ 
        
        ["GP26 (ADC0)", "26"], ["GP27 (ADC1)", "27"], ["GP28 (ADC2)", "28"]
    ];
    const PICO_I2C_PINS = [
        ["SDA:GP0, SCL:GP1", "0"],
        ["SDA:GP2, SCL:GP3", "2"],
        ["SDA:GP4, SCL:GP5", "4"],
        ["SDA:GP6, SCL:GP7", "6"],
        ["SDA:GP8, SCL:GP9", "8"],
        ["SDA:GP10, SCL:GP11", "10"],
        ["SDA:GP12, SCL:GP13", "12"],
        ["SDA:GP14, SCL:GP15", "14"],
        ["SDA:GP16, SCL:GP17", "16"],
        ["SDA:GP18, SCL:GP19", "18"],
        ["SDA:GP20, SCL:GP21", "20"],
    ];

    // === 2. DEFINE ALL PICO BLOCKS ===
    const blockDefinitions = [
        // --- GPIO Blocks ---
        { "type": "gpio_digital_read", "message0": "digital read pin %1", "args0": [{ "type": "field_dropdown", "name": "PIN", "options": PICO_DIGITAL_PINS }], "output": "Boolean", "style": "gpio_blocks" },
        { "type": "gpio_digital_write", "message0": "digital write to pin %1 state %2", "args0": [ { "type": "field_dropdown", "name": "PIN", "options": PICO_DIGITAL_PINS }, { "type": "field_dropdown", "name": "STATE", "options": [["HIGH", "1"], ["LOW", "0"]] } ], "previousStatement": null, "nextStatement": null, "style": "gpio_blocks" },
        { "type": "gpio_analog_read", "message0": "analog read pin %1", "args0": [{ "type": "field_dropdown", "name": "PIN", "options": PICO_ADC_PINS }], "output": "Number", "style": "gpio_blocks" },
        { "type": "gpio_pwm_write", "message0": "analog write (PWM) to pin %1 with value %2", "args0": [ { "type": "field_dropdown", "name": "PIN", "options": PICO_PWM_PINS }, { "type": "input_value", "name": "VALUE", "check": "Number" } ], "inputsInline": true, "previousStatement": null, "nextStatement": null, "style": "gpio_blocks" },

        // --- Sensor Blocks ---
        { "type": "sensor_internal_temp", "message0": "read internal temperature in %1", "args0": [{ "type": "field_dropdown", "name": "UNIT", "options": [["°C", "C"], ["°F", "F"]] }], "output": "Number", "style": "sensor_blocks" },
        { "type": "sensor_dht11", "message0": "read %1 from DHT11 pin %2", "args0": [ { "type": "field_dropdown", "name": "READING", "options": [["temperature", "temperature"], ["humidity", "humidity"]] }, { "type": "field_dropdown", "name": "PIN", "options": PICO_DIGITAL_PINS } ], "output": "Number", "style": "sensor_blocks" },
        { "type": "sensor_dht_measure", "message0": "measure temperature and humidity from DHT11 pin %1", "args0": [{ "type": "field_dropdown", "name": "PIN", "options": PICO_DIGITAL_PINS }], "previousStatement": null, "nextStatement": null, "style": "sensor_blocks" },
        { "type": "sensor_ultrasonic_hcsr04", "message0": "ultrasonic distance in %1 trig pin %2 echo pin %3", "args0": [ { "type": "field_dropdown", "name": "UNIT", "options": [["cm", "CM"], ["inches", "INCHES"]] }, { "type": "field_dropdown", "name": "TRIG_PIN", "options": PICO_DIGITAL_PINS }, { "type": "field_dropdown", "name": "ECHO_PIN", "options": PICO_DIGITAL_PINS } ], "output": "Number", "style": "sensor_blocks" },
        { "type": "sensor_pir_motion", "message0": "motion detected on PIR pin %1", "args0": [{ "type": "field_dropdown", "name": "PIN", "options": PICO_DIGITAL_PINS }], "output": "Boolean", "style": "sensor_blocks" },
        { "type": "sensor_limit_switch", "message0": "button/switch on pin %1 is pressed", "args0": [{ "type": "field_dropdown", "name": "PIN", "options": PICO_DIGITAL_PINS }], "output": "Boolean", "style": "sensor_blocks" },
        { "type": "sensor_analog_percent", "message0": "read %1 value (%%) from pin %2", "args0": [ { "type": "field_dropdown", "name": "SENSOR_TYPE", "options": [ ["light level", "LDR"], ["sound level", "SOUND"], ["soil moisture", "SOIL"], ["potentiometer", "POT"] ]}, { "type": "field_dropdown", "name": "PIN", "options": PICO_ADC_PINS } ], "output": "Number", "style": "sensor_blocks" },
        
        // --- Actuator Blocks ---
        { 
            "type": "actuator_onboard_led_blink", 
            "message0": "blink onboard LED", 
            "previousStatement": null, 
            "nextStatement": null, 
            "style": "actuator_blocks",
            "tooltip": "Blinks the Pico's built-in LED once."
        },
        { "type": "actuator_onboard_led", "message0": "turn onboard LED %1", "args0": [{ "type": "field_dropdown", "name": "STATE", "options": [["ON", "1"], ["OFF", "0"]] }], "previousStatement": null, "nextStatement": null, "style": "actuator_blocks" },
        { "type": "actuator_led", "message0": "turn LED on pin %1 %2", "args0": [ { "type": "field_dropdown", "name": "PIN", "options": PICO_DIGITAL_PINS }, { "type": "field_dropdown", "name": "STATE", "options": [["ON", "1"], ["OFF", "0"]] } ], "previousStatement": null, "nextStatement": null, "style": "actuator_blocks" },
        { "type": "actuator_led_toggle", "message0": "toggle LED on pin %1", "args0": [{ "type": "field_dropdown", "name": "PIN", "options": PICO_DIGITAL_PINS }], "previousStatement": null, "nextStatement": null, "style": "actuator_blocks" },
        { "type": "actuator_buzzer_note", "message0": "play note %1 on buzzer pin %2 for %3 ms", "args0": [ { "type": "field_dropdown", "name": "NOTE", "options": [ ["C4", "262"], ["D4", "294"], ["E4", "330"], ["F4", "349"], ["G4", "392"], ["A4", "440"], ["B4", "494"], ["C5", "523"] ]}, { "type": "field_dropdown", "name": "PIN", "options": PICO_PWM_PINS }, { "type": "input_value", "name": "DURATION", "check": "Number" } ], "inputsInline": true, "previousStatement": null, "nextStatement": null, "style": "actuator_blocks" },
        { "type": "actuator_servo_positional", "message0": "set servo on pin %1 to angle %2", "args0": [ { "type": "field_dropdown", "name": "PIN", "options": PICO_PWM_PINS }, { "type": "input_value", "name": "ANGLE", "check": "Number" } ], "inputsInline": true, "previousStatement": null, "nextStatement": null, "style": "actuator_blocks" },
{ 
    "type": "actuator_neopixel_fill", 
    "message0": "fill NeoPixel strip with color %1", 
    "args0": [{ "type": "field_colour", "name": "COLOR", "colour": "#ff0000" }], 
    "inputsInline": true, 
    "previousStatement": null, 
    "nextStatement": null, 
    "style": "actuator_blocks", 
    "tooltip": "Sets all pixels to the same color and shows the change." 
},
{
    "type": "actuator_neopixel_set",
    "message0": "set NeoPixel # %1 to color %2",
    "args0": [
        { "type": "input_value", "name": "PIXEL_NUM", "check": "Number" },
        { "type": "field_colour", "name": "COLOR", "colour": "#ff0000" }
    ],
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "style": "actuator_blocks"
},
        { "type": "actuator_neopixel_shift", "message0": "shift pixels by %1 positions", "args0": [{ "type": "input_value", "name": "SHIFT", "check": "Number" }], "inputsInline": true, "previousStatement": null, "nextStatement": null, "style": "actuator_blocks", "tooltip": "Shifts all pixel colors along the strip." },
        { "type": "actuator_neopixel_rainbow", "message0": "advance rainbow effect by one step", "previousStatement": null, "nextStatement": null, "style": "actuator_blocks", "tooltip": "Call this in a loop to create a rainbow animation." },
        { "type": "actuator_neopixel_show", "message0": "show NeoPixel changes", "previousStatement": null, "nextStatement": null, "style": "actuator_blocks" },
        { "type": "actuator_neopixel_clear", "message0": "clear NeoPixel strip", "previousStatement": null, "nextStatement": null, "style": "actuator_blocks" },

        // --- OLED Display Blocks ---
        { "type": "display_oled_setup", "message0": "setup OLED display on I2C pins %1", "args0": [{ "type": "field_dropdown", "name": "PINS", "options": PICO_I2C_PINS }], "previousStatement": null, "nextStatement": null, "style": "display_blocks", "tooltip": "Initializes the 128x64 OLED display. Must be in the 'on start' block." },
        { "type": "display_oled_show", "message0": "show OLED changes", "previousStatement": null, "nextStatement": null, "style": "display_blocks", "tooltip": "Updates the physical screen with any drawings made since the last 'show'." },
        { "type": "display_oled_clear", "message0": "clear OLED display", "previousStatement": null, "nextStatement": null, "style": "display_blocks", "tooltip": "Erases the entire screen content. Does not show automatically." },
        { "type": "display_oled_power", "message0": "turn OLED display %1", "args0": [{ "type": "field_dropdown", "name": "STATE", "options": [["ON", "poweron"], ["OFF", "poweroff"]] }], "previousStatement": null, "nextStatement": null, "style": "display_blocks", "tooltip": "Turns the display panel on or off to save power." },
        { "type": "display_oled_contrast", "message0": "set OLED contrast to %1", "args0": [{ "type": "input_value", "name": "CONTRAST", "check": "Number" }], "inputsInline": true, "previousStatement": null, "nextStatement": null, "style": "display_blocks", "tooltip": "Sets the display contrast (0-255)." },
        { "type": "display_oled_invert", "message0": "invert OLED colors %1", "args0": [{ "type": "field_dropdown", "name": "INVERT", "options": [["ON", "1"], ["OFF", "0"]] }], "inputsInline": true, "previousStatement": null, "nextStatement": null, "style": "display_blocks", "tooltip": "Inverts the display colors (black becomes white)." },
        { "type": "display_oled_text", "message0": "on OLED, print %1 at x %2 y %3", "args0": [ { "type": "input_value", "name": "TEXT" }, { "type": "input_value", "name": "X", "check": "Number" }, { "type": "input_value", "name": "Y", "check": "Number" } ], "inputsInline": true, "previousStatement": null, "nextStatement": null, "style": "display_blocks", "tooltip": "Draws text on the display buffer." },
        { "type": "display_oled_pixel", "message0": "draw pixel at x %1 y %2 color %3", "args0": [ { "type": "input_value", "name": "X", "check": "Number" }, { "type": "input_value", "name": "Y", "check": "Number" }, { "type": "field_dropdown", "name": "COLOR", "options": [["ON", "1"], ["OFF", "0"]] } ], "inputsInline": true, "previousStatement": null, "nextStatement": null, "style": "display_blocks", "tooltip": "Draws a single pixel on the display buffer." },
        { "type": "display_oled_line", "message0": "draw line from x1 %1 y1 %2 to x2 %3 y2 %4", "args0": [ { "type": "input_value", "name": "X1", "check": "Number" }, { "type": "input_value", "name": "Y1", "check": "Number" }, { "type": "input_value", "name": "X2", "check": "Number" }, { "type": "input_value", "name": "Y2", "check": "Number" } ], "inputsInline": false, "previousStatement": null, "nextStatement": null, "style": "display_blocks", "tooltip": "Draws a line between two points." },
        { "type": "display_oled_rect", "message0": "%1 rectangle at x %2 y %3 width %4 height %5", "args0": [ { "type": "field_dropdown", "name": "MODE", "options": [["draw", "rect"], ["fill", "fill_rect"]] }, { "type": "input_value", "name": "X", "check": "Number" }, { "type": "input_value", "name": "Y", "check": "Number" }, { "type": "input_value", "name": "WIDTH", "check": "Number" }, { "type": "input_value", "name": "HEIGHT", "check": "Number" } ], "inputsInline": false, "previousStatement": null, "nextStatement": null, "style": "display_blocks", "tooltip": "Draws or fills a rectangle." },
        { "type": "display_oled_animate_fireworks", "message0": "run fireworks animation for %1 seconds", "args0": [{ "type": "input_value", "name": "DURATION", "check": "Number" }], "inputsInline": true, "previousStatement": null, "nextStatement": null, "style": "display_blocks", "tooltip": "Runs a pre-made fireworks animation. This block will pause the code." },
        { "type": "display_oled_create_image", "message0": "create image width %1 height %2", "message1": "from bytearray data %1", "args0": [ { "type": "input_value", "name": "WIDTH", "check": "Number" }, { "type": "input_value", "name": "HEIGHT", "check": "Number" } ], "args1": [ { "type": "input_value", "name": "DATA", "check": "String" } ], "output": "Image", "style": "display_blocks", "tooltip": "Creates an image from a bytearray. Use an external tool to convert an image file to a bytearray string.", "inputsInline": true },
        { "type": "display_oled_draw_image", "message0": "draw image %1 at x %2 y %3", "args0": [ { "type": "input_value", "name": "IMAGE", "check": "Image" }, { "type": "input_value", "name": "X", "check": "Number" }, { "type": "input_value", "name": "Y", "check": "Number" } ], "inputsInline": true, "previousStatement": null, "nextStatement": null, "style": "display_blocks", "tooltip": "Draws a previously created image onto the display buffer." },
        
        // --- Communication Blocks ---
        { "type": "usb_serial_println", "message0": "USB Serial print line %1", "args0": [{ "type": "input_value", "name": "DATA", "check": ["String", "Number", "Boolean"] }], "inputsInline": true, "previousStatement": null, "nextStatement": null, "style": "communication_blocks" },
        { "type": "usb_serial_print_value", "message0": "USB Serial print value %1 = %2", "args0": [ { "type": "input_value", "name": "NAME", "check": "String" }, { "type": "input_value", "name": "VALUE", "check": ["String", "Number", "Boolean"] } ], "inputsInline": true, "previousStatement": null, "nextStatement": null, "style": "communication_blocks" },
        { "type": "usb_serial_read_line", "message0": "USB Serial read line", "output": "String", "style": "communication_blocks" },
        
        // --- Wi-Fi Blocks (Pico W) ---
        { "type": "wifi_connect", "message0": "connect to Wi-Fi network %1 password %2", "args0": [ { "type": "input_value", "name": "SSID", "check": "String" }, { "type": "input_value", "name": "PASSWORD", "check": "String" } ], "inputsInline": true, "previousStatement": null, "nextStatement": null, "style": "networking_blocks", "tooltip": "Connects the Pico W to a Wi-Fi network. Place in 'on start'." },
        { "type": "wifi_is_connected", "message0": "is Wi-Fi connected?", "output": "Boolean", "style": "networking_blocks" },
        { "type": "wifi_get_ip", "message0": "get Wi-Fi IP address", "output": "String", "style": "networking_blocks" },
        { "type": "http_get_json", "message0": "get JSON data from URL %1", "args0": [{ "type": "input_value", "name": "URL", "check": "String" }], "output": "Dictionary", "style": "networking_blocks", "tooltip": "Fetches data from a web API and prepares it for use." },
        { "type": "json_get_key", "message0": "from JSON data %1 get value of key %2", "args0": [ { "type": "input_value", "name": "JSON", "check": "Dictionary" }, { "type": "input_value", "name": "KEY", "check": "String" } ], "output": null, "style": "networking_blocks", "tooltip": "Extracts a specific value from JSON data." },
        { "type": "http_post_json", "message0": "send data to webhook URL %1", "message1": "value1 %1", "message2": "value2 %1", "message3": "value3 %1", "args0": [{ "type": "input_value", "name": "URL", "check": "String" }], "args1": [{ "type": "input_value", "name": "VALUE1" }], "args2": [{ "type": "input_value", "name": "VALUE2" }], "args3": [{ "type": "input_value", "name": "VALUE3" }], "previousStatement": null, "nextStatement": null, "style": "networking_blocks", "tooltip": "Sends up to three values to a service like IFTTT." },
        { "type": "wifi_start_web_server", "message0": "start web server in background", "previousStatement": null, "nextStatement": null, "style": "networking_blocks", "tooltip": "Initializes a web server on the Pico. Place in 'on start'." },
        { "type": "wifi_on_web_request", "message0": "when a web browser connects", "message1": "do %1", "args1": [{ "type": "input_statement", "name": "DO" }], "style": "networking_blocks", "tooltip": "Runs code when the Pico's IP address is visited in a browser." },
        { "type": "wifi_send_web_response", "message0": "send web response with HTML %1", "args0": [{ "type": "input_value", "name": "HTML", "check": "String" }], "previousStatement": null, "nextStatement": null, "style": "networking_blocks", "tooltip": "Sends a webpage back to the connected browser." },
        { "type": "wifi_get_web_request_path", "message0": "get URL path from web request", "output": "String", "style": "networking_blocks", "tooltip": "Gets the path of the URL requested by the browser (e.g., '/led/on')." },

        // --- Bluetooth Blocks (Pico W) ---
        { "type": "ble_setup", "message0": "setup Bluetooth LE with name %1", "args0": [{ "type": "input_value", "name": "NAME", "check": "String" }], "previousStatement": null, "nextStatement": null, "style": "bluetooth_blocks" },
        { "type": "ble_advertise_data", "message0": "advertise Bluetooth LE data %1", "args0": [{ "type": "input_value", "name": "DATA" }], "inputsInline": true, "previousStatement": null, "nextStatement": null, "style": "bluetooth_blocks" }
    ];
    
    Blockly.defineBlocksWithJsonArray(blockDefinitions);
})();