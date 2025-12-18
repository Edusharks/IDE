// src/ide/blockly/bluetooth_blocks.js
import * as Blockly from 'blockly/core';

export function registerBluetoothBlocks() {
    const BLE_STYLE = 'bluetooth_blocks'; // Blue style

    const blocks = [
        {
            "type": "ble_setup",
            "message0": "setup Bluetooth LE with name %1",
            "args0": [{ 
                "type": "input_value", 
                "name": "NAME", 
                "check": "String", 
                "shadow": { "type": "text", "fields": { "TEXT": "MyDevice" } } 
            }],
            "previousStatement": null,
            "nextStatement": null,
            "style": BLE_STYLE,
            "tooltip": "Initializes Bluetooth Low Energy and starts advertising the device name."
        },
        {
            "type": "ble_advertise_data",
            "message0": "advertise Bluetooth LE data %1",
            "args0": [{ 
                "type": "input_value", 
                "name": "DATA", 
                "check": "String", 
                "shadow": { "type": "text", "fields": { "TEXT": "Hello" } } 
            }],
            "inputsInline": true,
            "previousStatement": null,
            "nextStatement": null,
            "style": BLE_STYLE,
            "tooltip": "Updates the advertising payload with new data."
        }
    ];

    Blockly.defineBlocksWithJsonArray(blocks);
}