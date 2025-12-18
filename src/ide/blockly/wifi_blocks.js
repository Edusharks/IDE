// src/ide/blockly/wifi_blocks.js
import * as Blockly from 'blockly/core';

export function registerWifiBlocks() {
    const WIFI_BLOCK_STYLE = 'networking_blocks'; // Green style

    const blocks = [
        // --- 1. Connection ---
        {
            "type": "wifi_connect",
            "message0": "connect to Wi-Fi network %1 password %2",
            "args0": [
                {
                    "type": "input_value",
                    "name": "SSID",
                    "check": "String",
                    // DEFAULT INPUT: "Wokwi-GUEST"
                    "shadow": { "type": "text", "fields": { "TEXT": "Wokwi-GUEST" } }
                },
                {
                    "type": "input_value",
                    "name": "PASSWORD",
                    "check": "String",
                    // DEFAULT INPUT: Empty String
                    "shadow": { "type": "text", "fields": { "TEXT": "" } }
                }
            ],
            "inputsInline": true,
            "previousStatement": null,
            "nextStatement": null,
            "style": WIFI_BLOCK_STYLE,
            "tooltip": "Connects to a Wi-Fi network. Blocks until connected or times out."
        },
        {
            "type": "wifi_is_connected",
            "message0": "is Wi-Fi connected?",
            "output": "Boolean",
            "style": WIFI_BLOCK_STYLE,
            "tooltip": "Returns true if the device has an active Wi-Fi connection."
        },
        {
            "type": "wifi_get_ip",
            "message0": "get Wi-Fi IP address",
            "output": "String",
            "style": WIFI_BLOCK_STYLE,
            "tooltip": "Returns the local IP address as a string (e.g., '192.168.1.5')."
        },

        // --- 2. HTTP Client (GET/POST) ---
        {
            "type": "http_get_json",
            "message0": "get JSON data from URL %1",
            "args0": [
                {
                    "type": "input_value",
                    "name": "URL",
                    "check": "String",
                    // DEFAULT INPUT: API URL
                    "shadow": { "type": "text", "fields": { "TEXT": "https://api.example.com/data" } }
                }
            ],
            "output": "Dictionary", 
            "style": WIFI_BLOCK_STYLE,
            "tooltip": "Performs an HTTP GET request and parses the response as JSON."
        },
        {
            "type": "json_get_key",
            "message0": "from JSON data %1 get value of key %2",
            "args0": [
                { "type": "input_value", "name": "JSON", "check": ["Dictionary", "Object"] },
                {
                    "type": "input_value",
                    "name": "KEY",
                    "check": "String",
                    // DEFAULT INPUT: "key_name"
                    "shadow": { "type": "text", "fields": { "TEXT": "key_name" } }
                }
            ],
            "output": null,
            "style": WIFI_BLOCK_STYLE,
            "tooltip": "Extracts a specific value from a JSON object."
        },
        {
            "type": "http_post_json",
            "message0": "send data to webhook URL %1",
            "message1": "value1 %1",
            "message2": "value2 %1",
            "message3": "value3 %1",
            "args0": [
                {
                    "type": "input_value",
                    "name": "URL",
                    "check": "String",
                    // DEFAULT INPUT: IFTTT/Webhook URL
                    "shadow": { "type": "text", "fields": { "TEXT": "https://maker.ifttt.com/trigger/..." } }
                }
            ],
            "args1": [{ "type": "input_value", "name": "VALUE1", "shadow": { "type": "text", "fields": { "TEXT": "" } } }],
            "args2": [{ "type": "input_value", "name": "VALUE2", "shadow": { "type": "text", "fields": { "TEXT": "" } } }],
            "args3": [{ "type": "input_value", "name": "VALUE3", "shadow": { "type": "text", "fields": { "TEXT": "" } } }],
            "previousStatement": null,
            "nextStatement": null,
            "style": WIFI_BLOCK_STYLE,
            "tooltip": "Sends a JSON POST request with up to 3 values (useful for IFTTT/Zapier)."
        },

        // --- 3. Web Server ---
        {
            "type": "wifi_start_web_server",
            "message0": "start web server in background",
            "previousStatement": null,
            "nextStatement": null,
            "style": WIFI_BLOCK_STYLE,
            "tooltip": "Starts a multi-threaded web server on port 80. Handles both HTTP and WebSocket."
        },
        {
            "type": "wifi_on_web_request",
            "message0": "when a web browser connects",
            "message1": "do %1",
            "args1": [{ "type": "input_statement", "name": "DO" }],
            "style": WIFI_BLOCK_STYLE,
            "tooltip": "Event that runs when a device accesses the web server via browser."
        },
        {
            "type": "wifi_send_web_response",
            "message0": "send web response with HTML %1",
            "args0": [
                {
                    "type": "input_value",
                    "name": "HTML",
                    "check": "String",
                    // DEFAULT INPUT: Multiline HTML
                    "shadow": { "type": "text_multiline", "fields": { "TEXT": "<h1>Hello World</h1>" } }
                }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "style": WIFI_BLOCK_STYLE,
            "tooltip": "Sends HTML back to the browser. Must be used inside the 'when browser connects' block."
        },
        {
            "type": "wifi_get_web_request_path",
            "message0": "get URL path from web request",
            "output": "String",
            "style": WIFI_BLOCK_STYLE,
            "tooltip": "Returns the path requested (e.g., '/status' or '/toggle')."
        }
    ];

    Blockly.defineBlocksWithJsonArray(blocks);
}