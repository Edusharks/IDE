// src/ide/utils/micropython-definitions.js

export const MICROPYTHON_SUGGESTIONS = {
    // Top-level keywords
    'import': ['machine', 'time', 'neopixel', 'network', 'urequests', 'ujson', 'dht', 'ssd1306', 'framebuf'],
    
    // Modules
    'machine': [
        { label: 'Pin', insertText: 'Pin', detail: 'Class: Control I/O pins' },
        { label: 'ADC', insertText: 'ADC', detail: 'Class: Analog to Digital Converter' },
        { label: 'PWM', insertText: 'PWM', detail: 'Class: Pulse Width Modulation' },
        { label: 'I2C', insertText: 'I2C', detail: 'Class: Hardware I2C' },
        { label: 'SoftI2C', insertText: 'SoftI2C', detail: 'Class: Software I2C' },
        { label: 'reset', insertText: 'reset()', detail: 'Function: Reset the device' },
        { label: 'freq', insertText: 'freq()', detail: 'Function: Get/Set CPU frequency' }
    ],
    
    'time': [
        { label: 'sleep', insertText: 'sleep(${1:seconds})', insertTextRules: 4, detail: 'Sleep for N seconds' },
        { label: 'sleep_ms', insertText: 'sleep_ms(${1:milliseconds})', insertTextRules: 4, detail: 'Sleep for N milliseconds' },
        { label: 'ticks_ms', insertText: 'ticks_ms()', detail: 'Get millisecond counter' }
    ],

    'neopixel': [
        { label: 'NeoPixel', insertText: 'NeoPixel(${1:pin}, ${2:n})', insertTextRules: 4, detail: 'Class: Control WS2812 LEDs' }
    ],

    // Instance Methods (Heuristic based)
    '.': [
        // Pin methods
        { label: 'value', insertText: 'value(${1})', insertTextRules: 4, detail: 'Pin: Get/Set value (0 or 1)' },
        { label: 'on', insertText: 'on()', detail: 'Pin: Turn High' },
        { label: 'off', insertText: 'off()', detail: 'Pin: Turn Low' },
        { label: 'irq', insertText: 'irq(trigger=${1:Pin.IRQ_RISING}, handler=${2:func})', insertTextRules: 4, detail: 'Pin: Attach interrupt' },
        
        // PWM methods
        { label: 'duty', insertText: 'duty(${1:0-1023})', insertTextRules: 4, detail: 'PWM: Set duty cycle (ESP32)' },
        { label: 'duty_u16', insertText: 'duty_u16(${1:0-65535})', insertTextRules: 4, detail: 'PWM: Set duty cycle (Pico)' },
        { label: 'freq', insertText: 'freq(${1:1000})', insertTextRules: 4, detail: 'PWM: Set frequency' },

        // ADC methods
        { label: 'read', insertText: 'read()', detail: 'ADC: Read raw value' },
        { label: 'read_u16', insertText: 'read_u16()', detail: 'ADC: Read 16-bit value' },
        { label: 'atten', insertText: 'atten(ADC.ATTN_11DB)', detail: 'ADC: Set attenuation (ESP32)' },

        // NeoPixel methods
        { label: 'write', insertText: 'write()', detail: 'NeoPixel: Send data to strip' },
        { label: 'fill', insertText: 'fill((${1:r}, ${2:g}, ${3:b}))', insertTextRules: 4, detail: 'NeoPixel: Fill all pixels' },

        // Network
        { label: 'connect', insertText: 'connect("${1:ssid}", "${2:pass}")', insertTextRules: 4, detail: 'WLAN: Connect to Wi-Fi' },
        { label: 'isconnected', insertText: 'isconnected()', detail: 'WLAN: Check status' },
        { label: 'ifconfig', insertText: 'ifconfig()', detail: 'WLAN: Get IP info' }
    ]
};