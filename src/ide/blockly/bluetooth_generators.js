// src/ide/blockly/bluetooth_generators.js

export function registerBluetoothGenerators(generator) {
    
    generator.forBlock['ble_setup'] = function(block) {
        generator.definitions_['import_bluetooth'] = 'import ubluetooth';
        generator.definitions_['import_struct'] = 'import struct';
        
        const name = generator.valueToCode(block, 'NAME', generator.ORDER_ATOMIC) || '"ESP32"';
        
        // Store name in a global variable so other blocks can access it
        generator.definitions_['ble_name_var'] = `_ble_name = ${name}`;

        const funcName = 'ble_setup_advertising';
        if (!generator.functionNames_[funcName]) {
            generator.functionNames_[funcName] = `
ble = ubluetooth.BLE()
ble.active(True)

def _ble_compose_adv_payload(name, data_str):
    payload = bytearray()
    
    # 1. Flags: General Discoverable, BR/EDR Not Supported
    payload += struct.pack('BB', 2, 0x01) + b'\\x06'
    
    # 2. Name (Complete Local Name)
    name_bytes = name.encode('utf-8')
    if len(name_bytes) > 0:
        payload += struct.pack('B', len(name_bytes) + 1) + b'\\x09' + name_bytes
    
    # 3. Manufacturer Data (Custom Data)
    if data_str:
        data_bytes = str(data_str).encode('utf-8')
        # Ensure payload doesn't exceed 31 bytes total (approx check)
        if len(payload) + len(data_bytes) + 2 <= 31:
            payload += struct.pack('B', len(data_bytes) + 1) + b'\\xff' + data_bytes
            
    return payload

def ${funcName}(name): 
    # Advertise every 100ms
    ble.gap_advertise(100000, adv_data=_ble_compose_adv_payload(name, None))
`;
        }
        
        return `${funcName}(_ble_name)\n`;
    };

    generator.forBlock['ble_advertise_data'] = function(block) {
        const data = generator.valueToCode(block, 'DATA', generator.ORDER_ATOMIC) || '""';
        // Uses the global _ble_name defined in setup
        return `ble.gap_advertise(100000, adv_data=_ble_compose_adv_payload(_ble_name, ${data}))\n`;
    };
}