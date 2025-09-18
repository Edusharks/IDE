// src/renderer/blockly/esp32-blocks.js
'use strict';

(() => {
    // === 1. DEFINE ESP32-SPECIFIC PIN LISTS ===
    const DIGITAL_PINS_INPUT = [
        ["2", "2"], ["4", "4"], ["5", "5"], ["12", "12"], ["13", "13"], ["14", "14"],
        ["15", "15"], ["16", "16"], ["17", "17"], ["18", "18"], ["19", "19"], ["21", "21"],
        ["22", "22"], ["23", "23"], ["25", "25"], ["26", "26"], ["27", "27"], ["32", "32"],
        ["33", "33"], ["34", "34"], ["35", "35"], ["36", "36"], ["39", "39"]
    ];
    const DIGITAL_PINS_OUTPUT = [
        ["2", "2"], ["4", "4"], ["5", "5"], ["12", "12"], ["13", "13"], ["14", "14"],
        ["15", "15"], ["16", "16"], ["17", "17"], ["18", "18"], ["19", "19"], ["21", "21"],
        ["22", "22"], ["23", "23"], ["25", "25"], ["26", "26"], ["27", "27"]
    ];
    const ADC_PINS = [
        ["32", "32"], ["33", "33"], ["34", "34"], ["35", "35"], ["36", "36"], ["39", "39"]
    ];
    const PWM_PINS = DIGITAL_PINS_OUTPUT;
    const ESP32_I2C_PINS = [
        ["SDA:GP21, SCL:GP22", "21"],
        ["SDA:GP25, SCL:GP26", "25"],
        ["SDA:GP32, SCL:GP33", "32"],
        ["SDA:GP18, SCL:GP19", "18"],
        ["SDA:GP4, SCL:GP5", "4"]
    ];
    
    // === 2. DEFINE ALL ESP32 BLOCKS ===
    const blockDefinitions = [
        // GPIO Blocks
        { "type": "gpio_digital_read", "message0": "digital read pin %1", "args0": [{ "type": "field_dropdown", "name": "PIN", "options": DIGITAL_PINS_INPUT }], "output": "Boolean", "style": "gpio_blocks" },
        { "type": "gpio_digital_write", "message0": "digital write to pin %1 state %2", "args0": [ { "type": "field_dropdown", "name": "PIN", "options": DIGITAL_PINS_OUTPUT }, { "type": "field_dropdown", "name": "STATE", "options": [["HIGH", "1"], ["LOW", "0"]] } ], "previousStatement": null, "nextStatement": null, "style": "gpio_blocks" },
        { "type": "gpio_analog_read", "message0": "analog read pin %1", "args0": [{ "type": "field_dropdown", "name": "PIN", "options": ADC_PINS }], "output": "Number", "style": "gpio_blocks" },
        { "type": "gpio_pwm_write", "message0": "analog write (PWM) to pin %1 with value %2", "args0": [ { "type": "field_dropdown", "name": "PIN", "options": PWM_PINS }, { "type": "input_value", "name": "VALUE", "check": "Number" } ], "inputsInline": true, "previousStatement": null, "nextStatement": null, "style": "gpio_blocks" },
    
        // Sensor Blocks
        { "type": "sensor_internal_temp", "message0": "read internal temperature in %1", "args0": [{ "type": "field_dropdown", "name": "UNIT", "options": [["°C", "C"], ["°F", "F"]] }], "output": "Number", "style": "sensor_blocks" },
        { "type": "sensor_dht11", "message0": "read %1 from DHT11 pin %2", "args0": [ { "type": "field_dropdown", "name": "READING", "options": [["temperature", "temperature"], ["humidity", "humidity"]] }, { "type": "field_dropdown", "name": "PIN", "options": DIGITAL_PINS_OUTPUT } ], "output": "Number", "style": "sensor_blocks" },
        { "type": "sensor_dht_measure", "message0": "measure temperature and humidity from DHT11 pin %1", "args0": [{ "type": "field_dropdown", "name": "PIN", "options": DIGITAL_PINS_OUTPUT }], "previousStatement": null, "nextStatement": null, "style": "sensor_blocks" },
        { "type": "sensor_ultrasonic_hcsr04", "message0": "ultrasonic distance in %1 trig pin %2 echo pin %3", "args0": [ { "type": "field_dropdown", "name": "UNIT", "options": [["cm", "CM"], ["inches", "INCHES"]] }, { "type": "field_dropdown", "name": "TRIG_PIN", "options": DIGITAL_PINS_OUTPUT }, { "type": "field_dropdown", "name": "ECHO_PIN", "options": DIGITAL_PINS_INPUT } ], "output": "Number", "style": "sensor_blocks" },
        { "type": "sensor_pir_motion", "message0": "motion detected on PIR pin %1", "args0": [{ "type": "field_dropdown", "name": "PIN", "options": DIGITAL_PINS_INPUT }], "output": "Boolean", "style": "sensor_blocks" },
        { "type": "sensor_limit_switch", "message0": "button/switch on pin %1 is pressed", "args0": [{ "type": "field_dropdown", "name": "PIN", "options": DIGITAL_PINS_INPUT }], "output": "Boolean", "style": "sensor_blocks" },
        { "type": "sensor_analog_percent", "message0": "read %1 value (%%) from pin %2", "args0": [ { "type": "field_dropdown", "name": "SENSOR_TYPE", "options": [ ["light level", "LDR"], ["soil moisture", "SOIL"], ["potentiometer", "POT"] ]}, { "type": "field_dropdown", "name": "PIN", "options": ADC_PINS } ], "output": "Number", "style": "sensor_blocks" },
        { "type": "sensor_ldr_light", "message0": "read raw light value (0-4095) from pin %1", "args0": [{ "type": "field_dropdown", "name": "PIN", "options": ADC_PINS }], "output": "Number", "style": "sensor_blocks" },
        { "type": "sensor_soil_moisture", "message0": "read raw soil moisture value (0-4095) from pin %1", "args0": [{ "type": "field_dropdown", "name": "PIN", "options": ADC_PINS }], "output": "Number", "style": "sensor_blocks" },
        { "type": "sensor_potentiometer", "message0": "read raw potentiometer value (0-4095) from pin %1", "args0": [{ "type": "field_dropdown", "name": "PIN", "options": ADC_PINS }], "output": "Number", "style": "sensor_blocks" },
        { "type": "sensor_ir_obstacle", "message0": "obstacle detected on IR pin %1", "args0": [{ "type": "field_dropdown", "name": "PIN", "options": DIGITAL_PINS_INPUT }], "output": "Boolean", "style": "sensor_blocks" },

        // Actuator Blocks
        { "type": "actuator_onboard_led", "message0": "turn onboard LED (pin 2) %1", "args0": [{ "type": "field_dropdown", "name": "STATE", "options": [["ON", "1"], ["OFF", "0"]] }], "previousStatement": null, "nextStatement": null, "style": "actuator_blocks" },
        { "type": "actuator_led", "message0": "turn LED on pin %1 %2", "args0": [ { "type": "field_dropdown", "name": "PIN", "options": DIGITAL_PINS_OUTPUT }, { "type": "field_dropdown", "name": "STATE", "options": [["ON", "1"], ["OFF", "0"]] } ], "previousStatement": null, "nextStatement": null, "style": "actuator_blocks" },
        { "type": "actuator_led_toggle", "message0": "toggle LED on pin %1", "args0": [{ "type": "field_dropdown", "name": "PIN", "options": DIGITAL_PINS_OUTPUT }], "previousStatement": null, "nextStatement": null, "style": "actuator_blocks" },
        { "type": "actuator_buzzer_note", "message0": "play note %1 on buzzer pin %2 for %3 ms", "args0": [ { "type": "field_dropdown", "name": "NOTE", "options": [ ["C4", "262"], ["D4", "294"], ["E4", "330"], ["F4", "349"], ["G4", "392"], ["A4", "440"], ["B4", "494"], ["C5", "523"] ]}, { "type": "field_dropdown", "name": "PIN", "options": PWM_PINS }, { "type": "input_value", "name": "DURATION", "check": "Number" } ], "inputsInline": true, "previousStatement": null, "nextStatement": null, "style": "actuator_blocks" },
        { "type": "actuator_buzzer_tone", "message0": "play tone at %1 Hz on buzzer pin %2 for %3 ms", "args0": [ { "type": "input_value", "name": "FREQ", "check": "Number" }, { "type": "field_dropdown", "name": "PIN", "options": PWM_PINS }, { "type": "input_value", "name": "DURATION", "check": "Number" } ], "inputsInline": true, "previousStatement": null, "nextStatement": null, "style": "actuator_blocks" },
        { "type": "actuator_servo_positional", "message0": "set servo on pin %1 to angle %2", "args0": [ { "type": "field_dropdown", "name": "PIN", "options": PWM_PINS }, { "type": "input_value", "name": "ANGLE", "check": "Number" } ], "inputsInline": true, "previousStatement": null, "nextStatement": null, "style": "actuator_blocks" },
        { "type": "actuator_servo_continuous", "message0": "run continuous servo on pin %1 at speed %2 %%", "args0": [ { "type": "field_dropdown", "name": "PIN", "options": PWM_PINS }, { "type": "input_value", "name": "SPEED", "check": "Number" } ], "inputsInline": true, "previousStatement": null, "nextStatement": null, "style": "actuator_blocks" },
        { "type": "actuator_neopixel_set", "message0": "set NeoPixel # %1 to color %2", "args0": [ { "type": "input_value", "name": "PIXEL_NUM", "check": "Number" }, { "type": "field_colour", "name": "COLOR", "colour": "#ff0000" } ], "inputsInline": true, "previousStatement": null, "nextStatement": null, "style": "actuator_blocks" },
        { "type": "actuator_rgb_led_rgb", "message0": "set RGB LED R:%1 G:%2 B:%3 to R %4 G %5 B %6", "args0": [ { "type": "field_dropdown", "name": "PIN_R", "options": PWM_PINS }, { "type": "field_dropdown", "name": "PIN_G", "options": PWM_PINS }, { "type": "field_dropdown", "name": "PIN_B", "options": PWM_PINS }, { "type": "input_value", "name": "R_VAL", "check": "Number" }, { "type": "input_value", "name": "G_VAL", "check": "Number" }, { "type": "input_value", "name": "B_VAL", "check": "Number" } ], "inputsInline": true, "previousStatement": null, "nextStatement": null, "style": "actuator_blocks" },
        { "type": "actuator_neopixel_setup", "message0": "setup NeoPixel strip on pin %1 with %2 pixels", "args0": [ { "type": "field_dropdown", "name": "PIN", "options": DIGITAL_PINS_OUTPUT }, { "type": "input_value", "name": "NUM_PIXELS", "check": "Number" } ], "inputsInline": true, "previousStatement": null, "nextStatement": null, "style": "actuator_blocks" },
        { "type": "actuator_neopixel_brightness", "message0": "set NeoPixel brightness to %1 %%", "args0": [{ "type": "input_value", "name": "BRIGHTNESS", "check": "Number" }], "previousStatement": null, "nextStatement": null, "style": "actuator_blocks" },
        
        { 
            "type": "actuator_neopixel_fill", 
            "message0": "fill NeoPixel strip with color %1", 
            "args0": [{ "type": "field_colour", "name": "COLOR", "colour": "#ff0000" }], 
            "inputsInline": true, 
            "previousStatement": null, 
            "nextStatement": null, 
            "style": "actuator_blocks" 
        },
        
        { "type": "actuator_neopixel_set", "message0": "set NeoPixel # %1 to color %2", "args0": [ { "type": "input_value", "name": "PIXEL_NUM", "check": "Number" }, { "type": "field_colour", "name": "COLOR", "colour": "#ff0000" } ], "inputsInline": true, "previousStatement": null, "nextStatement": null, "style": "actuator_blocks" },
        { "type": "actuator_neopixel_shift", "message0": "shift pixels by %1 positions", "args0": [{ "type": "input_value", "name": "SHIFT", "check": "Number" }], "inputsInline": true, "previousStatement": null, "nextStatement": null, "style": "actuator_blocks", "tooltip": "Shifts all pixel colors along the strip." },
        { "type": "actuator_neopixel_rainbow", "message0": "advance rainbow effect by one step", "previousStatement": null, "nextStatement": null, "style": "actuator_blocks", "tooltip": "Call this in a loop to create a rainbow animation." },
        { "type": "actuator_neopixel_show", "message0": "show NeoPixel changes", "previousStatement": null, "nextStatement": null, "style": "actuator_blocks" },
        { "type": "actuator_neopixel_clear", "message0": "clear NeoPixel strip", "previousStatement": null, "nextStatement": null, "style": "actuator_blocks" },

        // Display Blocks
        { "type": "display_oled_setup", "message0": "setup OLED display on I2C pins %1", "args0": [{ "type": "field_dropdown", "name": "PINS", "options": ESP32_I2C_PINS }], "previousStatement": null, "nextStatement": null, "style": "display_blocks", "tooltip": "Initializes the 128x64 OLED display. Must be in the 'on start' block." },
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
        { "type": "display_oled_create_image", "message0": "create image width %1 height %2", "message1": "from bytearray data %1", "args0": [ { "type": "input_value", "name": "WIDTH", "check": "Number" }, { "type": "input_value", "name": "HEIGHT", "check": "Number" } ], "args1": [{ "type": "input_value", "name": "DATA", "check": "String" }], "output": "Image", "style": "display_blocks", "tooltip": "Creates an image from a bytearray. Use an external tool to convert an image file to a bytearray string.", "inputsInline": true },
        { "type": "display_oled_draw_image", "message0": "draw image %1 at x %2 y %3", "args0": [ { "type": "input_value", "name": "IMAGE", "check": "Image" }, { "type": "input_value", "name": "X", "check": "Number" }, { "type": "input_value", "name": "Y", "check": "Number" } ], "inputsInline": true, "previousStatement": null, "nextStatement": null, "style": "display_blocks", "tooltip": "Draws a previously created image onto the display buffer." },

        // Communication Blocks
        { "type": "usb_serial_println", "message0": "USB Serial print line %1", "args0": [{ "type": "input_value", "name": "DATA", "check": ["String", "Number", "Boolean"] }], "inputsInline": true, "previousStatement": null, "nextStatement": null, "style": "communication_blocks" },
        { "type": "usb_serial_print_value", "message0": "USB Serial print value %1 = %2", "args0": [ { "type": "input_value", "name": "NAME", "check": "String" }, { "type": "input_value", "name": "VALUE", "check": ["String", "Number", "Boolean"] } ], "inputsInline": true, "previousStatement": null, "nextStatement": null, "style": "communication_blocks" },
        { "type": "usb_serial_read_line", "message0": "USB Serial read line", "output": "String", "style": "communication_blocks" },
        
        // Wi-Fi Blocks
        { "type": "wifi_connect", "message0": "connect to Wi-Fi network %1 password %2", "args0": [ { "type": "input_value", "name": "SSID", "check": "String" }, { "type": "input_value", "name": "PASSWORD", "check": "String" } ], "inputsInline": true, "previousStatement": null, "nextStatement": null, "style": "networking_blocks", "tooltip": "Connects the ESP32 to a Wi-Fi network. Place in 'on start'." },
        { "type": "wifi_is_connected", "message0": "is Wi-Fi connected?", "output": "Boolean", "style": "networking_blocks" },
        { "type": "wifi_get_ip", "message0": "get Wi-Fi IP address", "output": "String", "style": "networking_blocks" },
        { "type": "http_get_json", "message0": "get JSON data from URL %1", "args0": [{ "type": "input_value", "name": "URL", "check": "String" }], "output": "Dictionary", "style": "networking_blocks", "tooltip": "Fetches data from a web API and prepares it for use." },
        { "type": "json_get_key", "message0": "from JSON data %1 get value of key %2", "args0": [ { "type": "input_value", "name": "JSON", "check": "Dictionary" }, { "type": "input_value", "name": "KEY", "check": "String" } ], "output": null, "style": "networking_blocks", "tooltip": "Extracts a specific value from JSON data." },
        { "type": "http_post_json", "message0": "send data to webhook URL %1", "message1": "value1 %1", "message2": "value2 %1", "message3": "value3 %1", "args0": [{ "type": "input_value", "name": "URL", "check": "String" }], "args1": [{ "type": "input_value", "name": "VALUE1" }], "args2": [{ "type": "input_value", "name": "VALUE2" }], "args3": [{ "type": "input_value", "name": "VALUE3" }], "previousStatement": null, "nextStatement": null, "style": "networking_blocks", "tooltip": "Sends up to three values to a service like IFTTT." },
        { "type": "wifi_start_web_server", "message0": "start web server in background", "previousStatement": null, "nextStatement": null, "style": "networking_blocks", "tooltip": "Initializes a web server on the ESP32. Place in 'on start'." },
        { "type": "wifi_on_web_request", "message0": "when a web browser connects", "message1": "do %1", "args1": [{ "type": "input_statement", "name": "DO" }], "style": "networking_blocks", "tooltip": "Runs code when the ESP32's IP address is visited in a browser." },
        { "type": "wifi_send_web_response", "message0": "send web response with HTML %1", "args0": [{ "type": "input_value", "name": "HTML", "check": "String" }], "previousStatement": null, "nextStatement": null, "style": "networking_blocks", "tooltip": "Sends a webpage back to the connected browser." },
        { "type": "wifi_get_web_request_path", "message0": "get URL path from web request", "output": "String", "style": "networking_blocks", "tooltip": "Gets the path of the URL requested by the browser (e.g., '/led/on')." },

        // Bluetooth Blocks
        { "type": "ble_setup", "message0": "setup Bluetooth LE with name %1", "args0": [{ "type": "input_value", "name": "NAME", "check": "String" }], "previousStatement": null, "nextStatement": null, "style": "bluetooth_blocks" },
        { "type": "ble_advertise_data", "message0": "advertise Bluetooth LE data %1", "args0": [{ "type": "input_value", "name": "DATA" }], "inputsInline": true, "previousStatement": null, "nextStatement": null, "style": "bluetooth_blocks" }
    ];
    
    Blockly.defineBlocksWithJsonArray(blockDefinitions);
})();