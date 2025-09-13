// src/renderer/blockly/esp32-generators.js

// Helper to ensure machine-specific imports are added only when needed
function ensureMachineImport() {
    micropythonGenerator.definitions_['import_machine'] = 'from machine import Pin, PWM, ADC, SoftI2C';
}

// --- GPIO Block Generators ---
micropythonGenerator.forBlock['gpio_digital_read'] = function(block) {
    ensureMachineImport();
    const pin = block.getFieldValue('PIN');
    const pinVar = `pin_${pin}`;
    if (!micropythonGenerator.definitions_[pinVar]) {
        micropythonGenerator.definitions_[pinVar] = `${pinVar} = Pin(${pin}, Pin.IN, Pin.PULL_UP)`;
    }
    const code = `${pinVar}.value()`;
    return [code, micropythonGenerator.ORDER_FUNCTION_CALL];
};

micropythonGenerator.forBlock['gpio_digital_write'] = function(block) {
    ensureMachineImport();
    const pin = block.getFieldValue('PIN');
    const state = block.getFieldValue('STATE');
    const pinVar = `pin_${pin}`;
    if (!micropythonGenerator.definitions_[pinVar]) {
        micropythonGenerator.definitions_[pinVar] = `${pinVar} = Pin(${pin}, Pin.OUT)`;
    }
    return `${pinVar}.value(${state})\n`;
};

micropythonGenerator.forBlock['gpio_analog_read'] = function(block) {
    ensureMachineImport();
    const pin = block.getFieldValue('PIN');
    const adcVar = `adc_${pin}`;
    if (!micropythonGenerator.definitions_[adcVar]) {
        micropythonGenerator.definitions_[adcVar] = `${adcVar} = ADC(Pin(${pin}))`;
        micropythonGenerator.definitions_[`${adcVar}_atten`] = `${adcVar}.atten(ADC.ATTN_11DB)`;
    }
    return [`${adcVar}.read()`, micropythonGenerator.ORDER_FUNCTION_CALL];
};

micropythonGenerator.forBlock['gpio_pwm_write'] = function(block) {
    ensureMachineImport();
    const pin = block.getFieldValue('PIN');
    const value = micropythonGenerator.valueToCode(block, 'VALUE', micropythonGenerator.ORDER_ATOMIC) || '0';
    const pwmVar = `pwm_${pin}`;
    if (!micropythonGenerator.definitions_[pwmVar]) {
        micropythonGenerator.definitions_[pwmVar] = `${pwmVar} = PWM(Pin(${pin}), freq=5000, duty=0)`;
    }
    return `${pwmVar}.duty(int((${value}) * 1023 / 255))\n`;
};

// --- Sensor Generators ---
micropythonGenerator.forBlock['sensor_internal_temp'] = function(block) {
    micropythonGenerator.definitions_['import_esp32'] = 'import esp32';
    const unit = block.getFieldValue('UNIT');
    let code = `esp32.raw_temperature()`; // Returns Fahrenheit
    if (unit === 'C') {
        code = `((${code} - 32) * 5/9)`;
    }
    return [code, micropythonGenerator.ORDER_FUNCTION_CALL];
};

micropythonGenerator.forBlock['sensor_dht_measure'] = function(block) {
    ensureMachineImport();
    const pin = block.getFieldValue('PIN');
    const dhtSensorVar = `dht_sensor_${pin}`;
    if (!micropythonGenerator.definitions_[dhtSensorVar]) {
        micropythonGenerator.definitions_['import_dht'] = 'import dht';
        micropythonGenerator.definitions_[dhtSensorVar] = `${dhtSensorVar} = dht.DHT11(Pin(${pin}))`;
    }
    return `try:\n${micropythonGenerator.INDENT}${dhtSensorVar}.measure()\nexcept OSError as e:\n${micropythonGenerator.INDENT}print("DHT read error:", e)\n`;
};

micropythonGenerator.forBlock['sensor_dht11'] = function(block) {
    ensureMachineImport();
    const pin = block.getFieldValue('PIN');
    const readingType = block.getFieldValue('READING');
    const dhtSensorVar = `dht_sensor_${pin}`;
    if (!micropythonGenerator.definitions_[dhtSensorVar]) {
        micropythonGenerator.definitions_['import_dht'] = 'import dht';
        micropythonGenerator.definitions_[dhtSensorVar] = `${dhtSensorVar} = dht.DHT11(Pin(${pin}))`;
    }
    return [`${dhtSensorVar}.${readingType}()`, micropythonGenerator.ORDER_FUNCTION_CALL];
};

micropythonGenerator.forBlock['sensor_analog_percent'] = function(block) {
    const code = micropythonGenerator.forBlock['gpio_analog_read'](block)[0];
    return [`round((${code} / 4095) * 100)`, micropythonGenerator.ORDER_FUNCTION_CALL];
};

micropythonGenerator.forBlock['sensor_ldr_light'] = micropythonGenerator.forBlock['gpio_analog_read'];
micropythonGenerator.forBlock['sensor_soil_moisture'] = micropythonGenerator.forBlock['gpio_analog_read'];
micropythonGenerator.forBlock['sensor_potentiometer'] = micropythonGenerator.forBlock['gpio_analog_read'];
micropythonGenerator.forBlock['sensor_ir_obstacle'] = function(block) {
    const code = micropythonGenerator.forBlock['gpio_digital_read'](block)[0];
    return [`not ${code}`, micropythonGenerator.ORDER_LOGICAL_NOT];
};
micropythonGenerator.forBlock['sensor_limit_switch'] = micropythonGenerator.forBlock['sensor_ir_obstacle'];

micropythonGenerator.forBlock['sensor_ultrasonic_hcsr04'] = function(block) {
    ensureMachineImport();
    micropythonGenerator.definitions_['import_hcsr04'] = 'from hcsr04 import HCSR04';
    const trigPin = block.getFieldValue('TRIG_PIN');
    const echoPin = block.getFieldValue('ECHO_PIN');
    const unit = block.getFieldValue('UNIT');
    const sensorVar = `ultrasonic_${trigPin}_${echoPin}`;
    if (!micropythonGenerator.definitions_[sensorVar]) {
        micropythonGenerator.definitions_[sensorVar] = `ultrasonic_${trigPin}_${echoPin} = HCSR04(trigger_pin=${trigPin}, echo_pin=${echoPin})`;
    }
    const code = `ultrasonic_${trigPin}_${echoPin}.distance_${unit.toLowerCase()}()`;
    return [code, micropythonGenerator.ORDER_FUNCTION_CALL];
};

// --- Actuator Generators ---
micropythonGenerator.forBlock['actuator_onboard_led'] = function(block) {
    ensureMachineImport();
    const state = block.getFieldValue('STATE');
    micropythonGenerator.definitions_['onboard_led'] = `onboard_led = Pin(2, Pin.OUT)`;
    return `onboard_led.value(${state})\n`;
};

micropythonGenerator.forBlock['actuator_led'] = micropythonGenerator.forBlock['gpio_digital_write'];

micropythonGenerator.forBlock['actuator_led_toggle'] = function(block) {
    ensureMachineImport();
    const pin = block.getFieldValue('PIN');
    const pinVar = `pin_${pin}`;
    if (!micropythonGenerator.definitions_[pinVar]) {
        micropythonGenerator.definitions_[pinVar] = `${pinVar} = Pin(${pin}, Pin.OUT)`;
    }
    return `${pinVar}.toggle()\n`;
};

micropythonGenerator.forBlock['actuator_buzzer_tone'] = function(block) {
    ensureMachineImport();
    const pin = block.getFieldValue('PIN');
    const freq = micropythonGenerator.valueToCode(block, 'FREQ', micropythonGenerator.ORDER_ATOMIC) || '500';
    const duration = micropythonGenerator.valueToCode(block, 'DURATION', micropythonGenerator.ORDER_ATOMIC) || '100';
    const pwmVar = `buzzer_pwm_${pin}`;
    if (!micropythonGenerator.definitions_[pwmVar]) {
        micropythonGenerator.definitions_[pwmVar] = `${pwmVar} = PWM(Pin(${pin}), duty=0)`;
    }
    return `${pwmVar}.freq(int(${freq}))\n${pwmVar}.duty(512)\ntime.sleep_ms(int(${duration}))\n${pwmVar}.duty(0)\n`;
};

micropythonGenerator.forBlock['actuator_buzzer_note'] = function(block) {
    const noteFreq = block.getFieldValue('NOTE');
    // Create a dummy block to reuse the tone generator
    const toneBlock = {
        getFieldValue: (name) => name === 'PIN' ? block.getFieldValue('PIN') : null,
        valueToCode: (name, order) => {
            if (name === 'FREQ') return noteFreq;
            if (name === 'DURATION') return micropythonGenerator.valueToCode(block, 'DURATION', order);
            return null;
        }
    };
    return micropythonGenerator.forBlock['actuator_buzzer_tone'](toneBlock);
};

micropythonGenerator.forBlock['actuator_servo_positional'] = function(block) {
    ensureMachineImport();
    const pin = block.getFieldValue('PIN');
    const angle = micropythonGenerator.valueToCode(block, 'ANGLE', micropythonGenerator.ORDER_ATOMIC) || '90';
    const servoVar = `servo_${pin}`;
    if (!micropythonGenerator.definitions_[servoVar]) {
        micropythonGenerator.definitions_[servoVar] = `${servoVar} = PWM(Pin(${pin}), freq=50)`;
    }
    return `${servoVar}.duty(int(25 + (max(0, min(180, ${angle})) / 180.0) * 100))\n`;
};

micropythonGenerator.forBlock['actuator_servo_continuous'] = function(block) {
    const speed = micropythonGenerator.valueToCode(block, 'SPEED', micropythonGenerator.ORDER_ATOMIC) || '0';
    const mapped_speed = `int(75 + (${speed} / 100) * 50)`;
    // Create a dummy block to reuse the positional servo generator
    const servoBlock = {
        getFieldValue: (name) => name === 'PIN' ? block.getFieldValue('PIN') : null,
        valueToCode: (name, order) => name === 'ANGLE' ? mapped_speed : null
    };
    return micropythonGenerator.forBlock['actuator_servo_positional'](servoBlock);
};

function getRgbHelper() {
    const functionName = 'hex_to_rgb';
    if (!micropythonGenerator.functionNames_[functionName]) {
        const func = `
def ${functionName}(hex_color):
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))`;
        micropythonGenerator.functionNames_[functionName] = func;
    }
    return functionName;
}

micropythonGenerator.forBlock['actuator_rgb_led'] = function(block) {
    ensureMachineImport();
    const pin_r = block.getFieldValue('PIN_R');
    const pin_g = block.getFieldValue('PIN_G');
    const pin_b = block.getFieldValue('PIN_B');
    const color = block.getFieldValue('COLOR');
    const rgbFunc = getRgbHelper();
    
    const pwm_r = `pwm_rgb_${pin_r}`;
    const pwm_g = `pwm_rgb_${pin_g}`;
    const pwm_b = `pwm_rgb_${pin_b}`;

    if (!micropythonGenerator.definitions_[pwm_r]) micropythonGenerator.definitions_[pwm_r] = `${pwm_r} = PWM(Pin(${pin_r}))`;
    if (!micropythonGenerator.definitions_[pwm_g]) micropythonGenerator.definitions_[pwm_g] = `${pwm_g} = PWM(Pin(${pin_g}))`;
    if (!micropythonGenerator.definitions_[pwm_b]) micropythonGenerator.definitions_[pwm_b] = `${pwm_b} = PWM(Pin(${pin_b}))`;
    
    const code = `
r, g, b = ${rgbFunc}('${color}')
${pwm_r}.duty(int(r * 1023 / 255))
${pwm_g}.duty(int(g * 1023 / 255))
${pwm_b}.duty(int(b * 1023 / 255))
`;
    return code;
};

micropythonGenerator.forBlock['actuator_rgb_led_rgb'] = function(block) {
    ensureMachineImport();
    const pin_r = block.getFieldValue('PIN_R');
    const pin_g = block.getFieldValue('PIN_G');
    const pin_b = block.getFieldValue('PIN_B');
    const r_val = micropythonGenerator.valueToCode(block, 'R_VAL', micropythonGenerator.ORDER_ATOMIC) || '0';
    const g_val = micropythonGenerator.valueToCode(block, 'G_VAL', micropythonGenerator.ORDER_ATOMIC) || '0';
    const b_val = micropythonGenerator.valueToCode(block, 'B_VAL', micropythonGenerator.ORDER_ATOMIC) || '0';
    
    const pwm_r = `pwm_rgb_${pin_r}`;
    const pwm_g = `pwm_rgb_${pin_g}`;
    const pwm_b = `pwm_rgb_${pin_b}`;

    if (!micropythonGenerator.definitions_[pwm_r]) micropythonGenerator.definitions_[pwm_r] = `${pwm_r} = PWM(Pin(${pin_r}))`;
    if (!micropythonGenerator.definitions_[pwm_g]) micropythonGenerator.definitions_[pwm_g] = `${pwm_g} = PWM(Pin(${pin_g}))`;
    if (!micropythonGenerator.definitions_[pwm_b]) micropythonGenerator.definitions_[pwm_b] = `${pwm_b} = PWM(Pin(${pin_b}))`;

    const code = `
${pwm_r}.duty(int(${r_val} * 1023 / 255))
${pwm_g}.duty(int(${g_val} * 1023 / 255))
${pwm_b}.duty(int(${b_val} * 1023 / 255))
`;
    return code;
};

// --- NeoPixel Generators ---

function getBrightnessHelper() {
    const functionName = '_apply_brightness';
    if (!micropythonGenerator.functionNames_[functionName]) {
        const func = `
_neopixel_brightness = 1.0
def ${functionName}(color_tuple):
    global _neopixel_brightness
    r, g, b = color_tuple
    return (int(r * _neopixel_brightness), int(g * _neopixel_brightness), int(b * _neopixel_brightness))`;
        micropythonGenerator.functionNames_[functionName] = func;
    }
    return functionName;
}

micropythonGenerator.forBlock['actuator_neopixel_setup'] = function(block) {
    ensureMachineImport();
    const pin = block.getFieldValue('PIN');
    const num_pixels = micropythonGenerator.valueToCode(block, 'NUM_PIXELS', micropythonGenerator.ORDER_ATOMIC) || '8';
    micropythonGenerator.definitions_['import_neopixel'] = 'import neopixel';
    micropythonGenerator.definitions_['neopixel_strip'] = `np = neopixel.NeoPixel(Pin(${pin}), int(${num_pixels}))`;
    micropythonGenerator.definitions_['rainbow_cycle_start'] = 'rainbow_cycle_start = 0';
    getBrightnessHelper(); 
    return '';
};

micropythonGenerator.forBlock['actuator_neopixel_brightness'] = function(block) {
    const brightness = micropythonGenerator.valueToCode(block, 'BRIGHTNESS', micropythonGenerator.ORDER_ATOMIC) || '50';
    getBrightnessHelper();
    return `_neopixel_brightness = (max(0, min(100, int(${brightness}))) / 100)\n`;
};

micropythonGenerator.forBlock['actuator_neopixel_fill'] = function(block) {
    const color = block.getFieldValue('COLOR');
    const rgbFunc = getRgbHelper();
    const brightnessFunc = getBrightnessHelper();
    return `np.fill(${brightnessFunc}(${rgbFunc}('${color}')))\nnp.write()\n`;
};

micropythonGenerator.forBlock['actuator_neopixel_set'] = function(block) {
    const pixel_num = micropythonGenerator.valueToCode(block, 'PIXEL_NUM', micropythonGenerator.ORDER_ATOMIC) || '0';
    const color = block.getFieldValue('COLOR');
    const rgbFunc = getRgbHelper();
    const brightnessFunc = getBrightnessHelper();
    return `np[int(${pixel_num})] = ${brightnessFunc}(${rgbFunc}('${color}'))\n`;
};

micropythonGenerator.forBlock['actuator_neopixel_shift'] = function(block) {
    const shift = micropythonGenerator.valueToCode(block, 'SHIFT', micropythonGenerator.ORDER_ATOMIC) || '1';
    const functionName = 'neopixel_shift';
    if (!micropythonGenerator.functionNames_[functionName]) {
        const func = `
def ${functionName}(strip, amount):
    num_pixels = len(strip)
    if num_pixels == 0 or amount == 0: return
    amount %= num_pixels
    if amount > 0:
        last_pixels = [strip[i] for i in range(num_pixels - amount, num_pixels)]
        for i in range(num_pixels - 1, amount - 1, -1): strip[i] = strip[i - amount]
        for i in range(amount): strip[i] = last_pixels[i]
    else:
        amount = -amount
        first_pixels = [strip[i] for i in range(amount)]
        for i in range(num_pixels - amount): strip[i] = strip[i + amount]
        for i in range(amount): strip[num_pixels - amount + i] = first_pixels[i]
`;
        micropythonGenerator.functionNames_[functionName] = func;
    }
    return `${functionName}(np, int(${shift}))\n`;
};

micropythonGenerator.forBlock['actuator_neopixel_rainbow'] = function(block) {
    const wheelFuncName = 'neopixel_wheel';
    const brightnessFunc = getBrightnessHelper();
    if (!micropythonGenerator.functionNames_[wheelFuncName]) {
        const func = `
def ${wheelFuncName}(pos):
    pos = 255 - pos
    if pos < 85: return (255 - pos * 3, 0, pos * 3)
    if pos < 170: pos -= 85; return (0, pos * 3, 255 - pos * 3)
    pos -= 170; return (pos * 3, 255 - pos * 3, 0)
`;
        micropythonGenerator.functionNames_[wheelFuncName] = func;
    }
    const rainbowFuncName = 'neopixel_rainbow_step';
    if (!micropythonGenerator.functionNames_[rainbowFuncName]) {
        const func = `
def ${rainbowFuncName}(strip):
    global rainbow_cycle_start
    num_pixels = len(strip)
    for i in range(num_pixels):
        pixel_index = (i * 256 // num_pixels) + rainbow_cycle_start
        strip[i] = ${brightnessFunc}(${wheelFuncName}(pixel_index & 255))
    strip.write()
    rainbow_cycle_start = (rainbow_cycle_start + 1) % 256
`;
        micropythonGenerator.functionNames_[rainbowFuncName] = func;
    }
    return `${rainbowFuncName}(np)\n`;
};

micropythonGenerator.forBlock['actuator_neopixel_show'] = () => 'np.write()\n';
micropythonGenerator.forBlock['actuator_neopixel_clear'] = () => `np.fill((0, 0, 0))\nnp.write()\n`;

// --- OLED Display Generators ---
micropythonGenerator.forBlock['display_oled_setup'] = function(block) {
    micropythonGenerator.definitions_['import_machine'] = 'from machine import Pin, PWM, ADC, SoftI2C';
    micropythonGenerator.definitions_['import_ssd1306'] = 'import ssd1306';
    const pins = block.getFieldValue('PINS');
    const sdaPin = pins;
    const sclPin = parseInt(pins) + 1;
    const setupCode = `
try:
    time.sleep(1)
    i2c = SoftI2C(sda=Pin(${sdaPin}), scl=Pin(${sclPin}))
    display = ssd1306.SSD1306_I2C(128, 64, i2c)
    display.fill(0)
    display.show()
    print("OLED display initialized.")
except Exception as e:
    print("Failed to initialize OLED display:", e)
    display = None
`;
    micropythonGenerator.definitions_['oled_setup'] = setupCode;
    return '';
};

micropythonGenerator.forBlock['display_oled_clear'] = () => 'if display: display.fill(0)\n';
micropythonGenerator.forBlock['display_oled_show'] = () => 'if display: display.show()\n';
micropythonGenerator.forBlock['display_oled_power'] = (b) => `if display: display.${b.getFieldValue('STATE')}()\n`;
micropythonGenerator.forBlock['display_oled_contrast'] = (b) => `if display: display.contrast(max(0, min(255, int(${micropythonGenerator.valueToCode(b, 'CONTRAST', 0) || '255'}))))\n`;
micropythonGenerator.forBlock['display_oled_invert'] = (b) => `if display: display.invert(${b.getFieldValue('INVERT')})\n`;
micropythonGenerator.forBlock['display_oled_text'] = (b) => `if display: display.text(str(${micropythonGenerator.valueToCode(b, 'TEXT', 0) || '""'}), int(${micropythonGenerator.valueToCode(b, 'X', 0) || '0'}), int(${micropythonGenerator.valueToCode(b, 'Y', 0) || '0'}))\n`;
micropythonGenerator.forBlock['display_oled_pixel'] = (b) => `if display: display.pixel(int(${micropythonGenerator.valueToCode(b, 'X', 0) || '0'}), int(${micropythonGenerator.valueToCode(b, 'Y', 0) || '0'}), ${b.getFieldValue('COLOR')})\n`;
micropythonGenerator.forBlock['display_oled_line'] = (b) => `if display: display.line(int(${micropythonGenerator.valueToCode(b, 'X1', 0) || '0'}), int(${micropythonGenerator.valueToCode(b, 'Y1', 0) || '0'}), int(${micropythonGenerator.valueToCode(b, 'X2', 0) || '0'}), int(${micropythonGenerator.valueToCode(b, 'Y2', 0) || '0'}), 1)\n`;
micropythonGenerator.forBlock['display_oled_rect'] = (b) => `if display: display.${b.getFieldValue('MODE')}(int(${micropythonGenerator.valueToCode(b, 'X', 0) || '0'}), int(${micropythonGenerator.valueToCode(b, 'Y', 0) || '0'}), int(${micropythonGenerator.valueToCode(b, 'WIDTH', 0) || '0'}), int(${micropythonGenerator.valueToCode(b, 'HEIGHT', 0) || '0'}), 1)\n`;

micropythonGenerator.forBlock['display_oled_animate_fireworks'] = function(block) {
    micropythonGenerator.definitions_['import_random_fw'] = 'import random';
    micropythonGenerator.definitions_['import_math_fw'] = 'import math';
    const duration = micropythonGenerator.valueToCode(block, 'DURATION', 0) || '5';
    const functionName = 'run_fireworks';
    if (!micropythonGenerator.functionNames_[functionName]) {
        micropythonGenerator.functionNames_[functionName] = `
class Particle:
    def __init__(self, x, y, vx, vy, gravity): self.x, self.y, self.vx, self.vy, self.gravity = x, y, vx, vy, gravity
    def update(self): self.x += self.vx; self.y += self.vy; self.vy += self.gravity
class Firework:
    def __init__(self, width, height): self.width, self.height, self.gravity = width, height, 0.08; self.reset()
    def reset(self): self.fuse = Particle(self.width//2, self.height-1, 0, -(2+random.random()*1), self.gravity/3); self.particles, self.exploded = [], False
    def update(self):
        if not self.exploded:
            self.fuse.update()
            if self.fuse.vy >= 0:
                self.exploded = True
                for _ in range(30 + random.randint(0, 30)):
                    angle, speed = random.random()*2*math.pi, random.random()*2
                    self.particles.append(Particle(self.fuse.x, self.fuse.y, math.cos(angle)*speed, math.sin(angle)*speed, self.gravity))
        else:
            for p in self.particles: p.update()
            self.particles = [p for p in self.particles if 0 <= p.x < self.width and 0 <= p.y < self.height]
            if not self.particles: self.reset()
    def draw(self, display):
        if not self.exploded: display.pixel(int(self.fuse.x), int(self.fuse.y), 1)
        else:
            for p in self.particles: display.pixel(int(p.x), int(p.y), 1)
def ${functionName}(disp, total_duration):
    if not disp: return
    fireworks = [Firework(disp.width, disp.height)]
    start_time = time.time()
    while time.time() - start_time < total_duration:
        disp.fill(0)
        if len(fireworks) < 3 and random.random() < 0.05: fireworks.append(Firework(disp.width, disp.height))
        for fw in fireworks: fw.update(); fw.draw(disp)
        disp.show(); time.sleep_ms(10)
`;
    }
    return `${functionName}(display, ${duration})\n`;
};

micropythonGenerator.forBlock['display_oled_create_image'] = function(block) {
    micropythonGenerator.definitions_['import_framebuf'] = 'import framebuf';
    const width = micropythonGenerator.valueToCode(block, 'WIDTH', 0) || '0';
    const height = micropythonGenerator.valueToCode(block, 'HEIGHT', 0) || '0';
    let data = micropythonGenerator.valueToCode(block, 'DATA', 0) || "''";
    data = `b${data}`;
    const code = `framebuf.FrameBuffer(bytearray(${data}), int(${width}), int(${height}), framebuf.MONO_HLSB)`;
    return [code, micropythonGenerator.ORDER_FUNCTION_CALL];
};

micropythonGenerator.forBlock['display_oled_draw_image'] = (b) => `if display and ${micropythonGenerator.valueToCode(b, 'IMAGE', 0) || 'None'}: display.blit(${micropythonGenerator.valueToCode(b, 'IMAGE', 0) || 'None'}, int(${micropythonGenerator.valueToCode(b, 'X', 0) || '0'}), int(${micropythonGenerator.valueToCode(b, 'Y', 0) || '0'}))\n`;

// --- Communication Generators ---
micropythonGenerator.forBlock['usb_serial_println'] = (b) => `print(str(${micropythonGenerator.valueToCode(b, 'DATA', 0) || '""'}))\n`;
micropythonGenerator.forBlock['usb_serial_print_value'] = (b) => `print(str(${micropythonGenerator.valueToCode(b, 'NAME', 0) || '""'}) + ' = ' + str(${micropythonGenerator.valueToCode(b, 'VALUE', 0) || '""'}))\n`;
micropythonGenerator.forBlock['usb_serial_read_line'] = () => ['input()', micropythonGenerator.ORDER_FUNCTION_CALL];

// --- Wi-Fi Generators ---
micropythonGenerator.forBlock['wifi_connect'] = function(block) {
    const ssid = micropythonGenerator.valueToCode(block, 'SSID', 0) || '""';
    const password = micropythonGenerator.valueToCode(block, 'PASSWORD', 0) || '""';
    micropythonGenerator.definitions_['import_network'] = 'import network';
    const funcName = 'connect_to_wifi';
    if (!micropythonGenerator.functionNames_[funcName]) {
        micropythonGenerator.functionNames_[funcName] = `
wlan = network.WLAN(network.STA_IF)
wlan.active(True)
def ${funcName}(ssid, password):
    if wlan.isconnected(): return
    print('Connecting to Wi-Fi...'); wlan.connect(ssid, password)
    for _ in range(10):
        if wlan.isconnected(): break
        print('.'); time.sleep(1)
    print('Connected! IP:', wlan.ifconfig()[0]) if wlan.isconnected() else print('Connection failed.')
`;
    }
    return `${funcName}(${ssid}, ${password})\n`;
};

micropythonGenerator.forBlock['wifi_is_connected'] = () => ['wlan.isconnected()', 1];
micropythonGenerator.forBlock['wifi_get_ip'] = () => ["(wlan.ifconfig()[0] if wlan.isconnected() else 'Not Connected')", 2];
micropythonGenerator.forBlock['http_get_json'] = (b) => { micropythonGenerator.definitions_['import_urequests']='import urequests'; micropythonGenerator.definitions_['import_ujson']='import ujson'; return [`(ujson.loads(urequests.get(${micropythonGenerator.valueToCode(b,'URL',0)||"''"}).text) if wlan.isconnected() else {})`, 1]; };
micropythonGenerator.forBlock['json_get_key'] = (b) => [`${micropythonGenerator.valueToCode(b,'JSON',2)||"''"}.get(${micropythonGenerator.valueToCode(b,'KEY',0)||"''"}, '')`, 1];

micropythonGenerator.forBlock['http_post_json'] = function(block) {
    micropythonGenerator.definitions_['import_urequests'] = 'import urequests';
    const url = micropythonGenerator.valueToCode(block, 'URL', 0) || '""';
    let data_dict = ['"value1": ' + (micropythonGenerator.valueToCode(block, 'VALUE1', 0) || 'None'), '"value2": ' + (micropythonGenerator.valueToCode(block, 'VALUE2', 0) || 'None'), '"value3": ' + (micropythonGenerator.valueToCode(block, 'VALUE3', 0) || 'None')];
    data_dict = data_dict.filter(item => !item.endsWith('None'));
    return `if wlan.isconnected():\n  try:\n    urequests.post(${url}, json={${data_dict.join(', ')}})\n  except Exception as e:\n    print("HTTP POST failed:", e)\n`;
};

micropythonGenerator.forBlock['wifi_start_web_server'] = function(block) {
    micropythonGenerator.definitions_['import_socket'] = 'import socket';
    micropythonGenerator.definitions_['import_thread'] = 'import _thread';
    const funcName = 'start_web_server';
    if (!micropythonGenerator.functionNames_[funcName]) {
        micropythonGenerator.functionNames_[funcName] = `
_web_request_handler = None
_web_response_content = "<h1>ESP32 Not Programmed</h1>"
_web_request_path = "/"
def _web_server_thread():
    s = socket.socket(); s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1); s.bind(('', 80)); s.listen(1)
    print('Web server listening on port 80')
    while True:
        try:
            cl, _ = s.accept(); req = cl.recv(1024).decode('utf-8')
            if not req: cl.close(); continue
            global _web_request_path
            _web_request_path = req.split(' ')[1] if len(req.split(' ')) > 1 else "/"
            if callable(_web_request_handler): _web_request_handler()
            cl.send('HTTP/1.0 200 OK\\r\\nContent-type: text/html\\r\\n\\r\\n'); cl.send(_web_response_content); cl.close()
        except Exception as e: print('Web server error:', e)
def ${funcName}():
    if wlan.isconnected(): _thread.start_new_thread(_web_server_thread, ())
    else: print("Wi-Fi not connected. Web server not started.")
`;
    }
    return `${funcName}()\n`;
};

micropythonGenerator.forBlock['wifi_on_web_request'] = function(block) {
    const statements_do = micropythonGenerator.statementToCode(block, 'DO') || '  pass';
    const funcName = micropythonGenerator.nameDB_.getDistinctName('on_web_request', 'PROCEDURE');
    micropythonGenerator.functionNames_[funcName] = `def ${funcName}():\n${statements_do}`;
    return `_web_request_handler = ${funcName}\n`;
};

micropythonGenerator.forBlock['wifi_send_web_response'] = (b) => `_web_response_content = str(${micropythonGenerator.valueToCode(b, 'HTML', 0) || '""'})\n`;
micropythonGenerator.forBlock['wifi_get_web_request_path'] = () => ['_web_request_path', 0];

// --- Bluetooth LE Generators ---
micropythonGenerator.forBlock['ble_setup'] = function(block) {
    micropythonGenerator.definitions_['import_bluetooth'] = 'import ubluetooth';
    micropythonGenerator.definitions_['import_struct'] = 'import struct';
    const name = micropythonGenerator.valueToCode(block, 'NAME', 0) || '"ESP32"';
    const funcName = 'ble_setup_advertising';
    if (!micropythonGenerator.functionNames_[funcName]) {
        micropythonGenerator.functionNames_[funcName] = `
ble = ubluetooth.BLE()
ble.active(True)
_adv_name = ""
def _ble_compose_adv_payload(name, data_str):
    global _adv_name
    if name: _adv_name = name
    payload = bytearray(b'\\x02\\x01\\x06')
    name_bytes = _adv_name.encode()
    payload += struct.pack('B', len(name_bytes) + 1) + b'\\t' + name_bytes
    if data_str: payload += struct.pack('B', len(str(data_str)) + 1) + b'\\xff' + str(data_str).encode()
    return payload
def ${funcName}(name): ble.gap_advertise(100000, adv_data=_ble_compose_adv_payload(name, None))
${funcName}(${name})
`;
    }
    return '';
};

micropythonGenerator.forBlock['ble_advertise_data'] = (b) => `ble.gap_advertise(100000, adv_data=_ble_compose_adv_payload(None, ${micropythonGenerator.valueToCode(b, 'DATA', 0) || '""'}))\n`;