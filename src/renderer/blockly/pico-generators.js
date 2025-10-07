
// src/renderer/blockly/pico-generators.js

console.log("PICO GENERATOR FILE - LATEST VERSION LOADED AT:", new Date().toLocaleTimeString());

// Helper to ensure machine-specific imports are added only when needed
function ensureMachineImport() {
    micropythonGenerator.definitions_['import_machine'] = 'from machine import Pin, PWM, ADC, I2C, SoftI2C';
}

// --- GPIO Block Generators (REVISED FOR PERFORMANCE) ---

micropythonGenerator.forBlock['gpio_digital_read'] = function(block) {
    ensureMachineImport();
    const pin = block.getFieldValue('PIN');
    const pinVar = `pin_${pin}`;
    // Define the pin object once, if not already defined.
    if (!micropythonGenerator.definitions_[pinVar]) {
        micropythonGenerator.definitions_[pinVar] = `${pinVar} = Pin(${pin}, Pin.IN, Pin.PULL_UP)`;
    }
    // Use the existing object for the operation.
    const code = `${pinVar}.value()`;
    return [code, micropythonGenerator.ORDER_FUNCTION_CALL];
};

micropythonGenerator.forBlock['gpio_digital_write'] = function(block) {
    ensureMachineImport();
    const pin = block.getFieldValue('PIN');
    const state = block.getFieldValue('STATE');
    const pinVar = `pin_${pin}`;
    // Define the pin object once, if not already defined.
    if (!micropythonGenerator.definitions_[pinVar]) {
        micropythonGenerator.definitions_[pinVar] = `${pinVar} = Pin(${pin}, Pin.OUT)`;
    }
    // Use the existing object for the operation.
    return `${pinVar}.value(${state})\n`;
};


// PICO-SPECIFIC OVERRIDE: The Pico's ADC is simpler than the ESP32's.
micropythonGenerator.forBlock['gpio_analog_read'] = function(block) {
    ensureMachineImport();
    const pin = block.getFieldValue('PIN');
    const adcVar = `adc_${pin}`;
    if (!micropythonGenerator.definitions_[adcVar]) {
        micropythonGenerator.definitions_[adcVar] = `${adcVar} = ADC(Pin(${pin}))`;
    }
    return [`${adcVar}.read_u16()`, micropythonGenerator.ORDER_FUNCTION_CALL];
};

micropythonGenerator.forBlock['gpio_pwm_write'] = function(block) {
    ensureMachineImport();
    const pin = block.getFieldValue('PIN');
    const value = micropythonGenerator.valueToCode(block, 'VALUE', micropythonGenerator.ORDER_ATOMIC) || '0';
    const pwmVar = `pwm_${pin}`;
    if (!micropythonGenerator.definitions_[pwmVar]) {
        micropythonGenerator.definitions_[pwmVar] = `${pwmVar} = PWM(Pin(${pin}))`;
        micropythonGenerator.definitions_[`${pwmVar}_freq`] = `${pwmVar}.freq(1000)`;
    }
    return `${pwmVar}.duty_u16(int((${value}) * 65535 / 100))\n`;
};

// --- Sensor Generators ---
micropythonGenerator.forBlock['sensor_internal_temp'] = function(block) {
    ensureMachineImport();
    const unit = block.getFieldValue('UNIT');
    micropythonGenerator.definitions_['internal_temp_sensor'] = 'sensor_temp = ADC(4)';
    const formula = `27 - (sensor_temp.read_u16() * 3.3 / 65535 - 0.706) / 0.001721`;
    let code = `(${formula})`;
    if (unit === 'F') {
        code = `(${code} * 9/5 + 32)`;
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
    return [`round((${code} / 65535) * 100)`, micropythonGenerator.ORDER_FUNCTION_CALL];
};

micropythonGenerator.forBlock['sensor_ultrasonic_hcsr04'] = function(block) {
    ensureMachineImport();
    micropythonGenerator.definitions_['import_time_pulse_us'] = 'from machine import time_pulse_us';
    const trigPin = block.getFieldValue('TRIG_PIN');
    const echoPin = block.getFieldValue('ECHO_PIN');
    const unit = block.getFieldValue('UNIT');
    const functionName = `hcsr04_get_distance_${trigPin}_${echoPin}`;

    if (!micropythonGenerator.functionNames_[functionName]) {
        const trigVar = `hcsr04_trig_${trigPin}`;
        const echoVar = `hcsr04_echo_${echoPin}`;
        micropythonGenerator.definitions_['import_time_us'] = 'from time import sleep_us';
        micropythonGenerator.definitions_[trigVar] = `${trigVar} = Pin(${trigPin}, Pin.OUT)`;
        micropythonGenerator.definitions_[echoVar] = `${echoVar} = Pin(${echoPin}, Pin.IN)`;
        const func = `
def ${functionName}():
    ${trigVar}.value(0)
    sleep_us(2)
    ${trigVar}.value(1)
    sleep_us(5)
    ${trigVar}.value(0)
    try:
        duration = time_pulse_us(${echoVar}, 1, 30000)
        return (duration / 2) / 29.1
    except OSError:
        return -1
`;
        micropythonGenerator.functionNames_[functionName] = func;
    }
    
    let code = `${functionName}()`;
    if (unit === 'INCHES') {
        code = `(${code} * 0.393701)`;
    }
    return [code, micropythonGenerator.ORDER_FUNCTION_CALL];
};

micropythonGenerator.forBlock['sensor_pir_motion'] = micropythonGenerator.forBlock['gpio_digital_read'];
micropythonGenerator.forBlock['sensor_limit_switch'] = function(block) {
    const code = micropythonGenerator.forBlock['gpio_digital_read'](block)[0];
    return [`not ${code}`, micropythonGenerator.ORDER_LOGICAL_NOT];
};

// --- Actuator Generators ---

micropythonGenerator.forBlock['actuator_onboard_led_blink'] = function(block) {
    ensureMachineImport();
    micropythonGenerator.definitions_['onboard_led'] = `onboard_led = Pin("LED", Pin.OUT)`;
    const functionName = 'blink_onboard_led';
    if (!micropythonGenerator.functionNames_[functionName]) {
        const func = `
def ${functionName}():
    onboard_led.toggle()
    time.sleep_ms(100)
    onboard_led.toggle()
`;
        micropythonGenerator.functionNames_[functionName] = func;
    }
    return `${functionName}()\n`;
};


micropythonGenerator.forBlock['actuator_onboard_led'] = function(block) {
    ensureMachineImport();
    const state = block.getFieldValue('STATE');
    micropythonGenerator.definitions_['onboard_led'] = `onboard_led = Pin("LED", Pin.OUT)`;
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

micropythonGenerator.forBlock['actuator_buzzer_note'] = function(block) {
    ensureMachineImport();
    const pin = block.getFieldValue('PIN');
    const noteFreq = block.getFieldValue('NOTE');
    const duration = micropythonGenerator.valueToCode(block, 'DURATION', micropythonGenerator.ORDER_ATOMIC) || '100';
    const pwmVar = `buzzer_pwm_${pin}`;
    if (!micropythonGenerator.definitions_[pwmVar]) {
        micropythonGenerator.definitions_[pwmVar] = `${pwmVar} = PWM(Pin(${pin}))`;
    }
    return `${pwmVar}.freq(int(${noteFreq}))\n${pwmVar}.duty_u16(32768)\ntime.sleep_ms(int(${duration}))\n${pwmVar}.duty_u16(0)\n`;
};

micropythonGenerator.forBlock['actuator_servo_positional'] = function(block) {
    ensureMachineImport();
    const pin = block.getFieldValue('PIN');
    const angle = micropythonGenerator.valueToCode(block, 'ANGLE', micropythonGenerator.ORDER_ATOMIC) || '90';
    const servoVar = `servo_${pin}`;
    const functionName = 'set_servo_angle';
    if (!micropythonGenerator.functionNames_[functionName]) {
        const func = `
def ${functionName}(pwm_obj, angle):
    duty = int(1638 + (max(0, min(180, angle)) / 180) * 6553)
    pwm_obj.duty_u16(duty)`;
        micropythonGenerator.functionNames_[functionName] = func;
    }
    if (!micropythonGenerator.definitions_[servoVar]) {
        micropythonGenerator.definitions_[servoVar] = `${servoVar} = PWM(Pin(${pin}), freq=50)`;
    }
    return `${functionName}(${servoVar}, int(${angle}))\n`;
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
    if num_pixels == 0 or amount == 0:
        return
    
    amount = amount % num_pixels
    
    if amount > 0: # Shift Right
        last_pixels = [strip[i] for i in range(num_pixels - amount, num_pixels)]
        for i in range(num_pixels - 1, amount - 1, -1):
            strip[i] = strip[i - amount]
        for i in range(amount):
            strip[i] = last_pixels[i]
    else: # Shift Left
        amount = -amount
        first_pixels = [strip[i] for i in range(amount)]
        for i in range(num_pixels - amount):
            strip[i] = strip[i + amount]
        for i in range(amount):
            strip[num_pixels - amount + i] = first_pixels[i]
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
    if pos < 85:
        return (255 - pos * 3, 0, pos * 3)
    if pos < 170:
        pos -= 85
        return (0, pos * 3, 255 - pos * 3)
    pos -= 170
    return (pos * 3, 255 - pos * 3, 0)
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
    rainbow_cycle_start += 1
    if rainbow_cycle_start >= 256:
        rainbow_cycle_start = 0
`;
        micropythonGenerator.functionNames_[rainbowFuncName] = func;
    }
    return `${rainbowFuncName}(np)\n`;
};

micropythonGenerator.forBlock['actuator_neopixel_show'] = function(block) {
    return 'np.write()\n';
};

micropythonGenerator.forBlock['actuator_neopixel_clear'] = function(block) {
    return `np.fill((0, 0, 0))\nnp.write()\n`;
};


// --- OLED Display Generators ---
micropythonGenerator.forBlock['display_oled_setup'] = function(block) {
    micropythonGenerator.definitions_['import_machine'] = 'from machine import Pin, PWM, ADC, I2C, SoftI2C';
    micropythonGenerator.definitions_['import_ssd1306'] = 'import ssd1306 # Note: ssd1306.py must be on your Pico';
    const pins = block.getFieldValue('PINS');
    const sdaPin = pins;
    const sclPin = parseInt(pins) + 1;
    const setupCode = `
try:
    time.sleep(1)
    i2c = SoftI2C(sda=Pin(${sdaPin}), scl=Pin(${sclPin}), freq=400000)
    devices = i2c.scan()
    if 0x3c in devices:
        display = ssd1306.SSD1306_I2C(128, 64, i2c)
        display.fill(0)
        display.show()
        print("OLED display initialized successfully.")
    else:
        print("OLED display not found on I2C bus.")
        display = None
except Exception as e:
    print("Failed to initialize OLED display:", e)
    display = None
`;
    micropythonGenerator.definitions_['oled_setup'] = setupCode;
    return '';
};

micropythonGenerator.forBlock['display_oled_clear'] = () => 'if display: display.fill(0)\n';
micropythonGenerator.forBlock['display_oled_show'] = () => 'if display: display.show()\n';
micropythonGenerator.forBlock['display_oled_power'] = function(block) {
    const state = block.getFieldValue('STATE');
    return `if display: display.${state}()\n`;
};
micropythonGenerator.forBlock['display_oled_contrast'] = function(block) {
    const contrast = micropythonGenerator.valueToCode(block, 'CONTRAST', micropythonGenerator.ORDER_ATOMIC) || '255';
    return `if display: display.contrast(max(0, min(255, int(${contrast}))))\n`;
};
micropythonGenerator.forBlock['display_oled_invert'] = function(block) {
    const invert = block.getFieldValue('INVERT');
    return `if display: display.invert(${invert})\n`;
};
micropythonGenerator.forBlock['display_oled_text'] = function(block) {
    const text = micropythonGenerator.valueToCode(block, 'TEXT', micropythonGenerator.ORDER_ATOMIC) || '""';
    const x = micropythonGenerator.valueToCode(block, 'X', micropythonGenerator.ORDER_ATOMIC) || '0';
    const y = micropythonGenerator.valueToCode(block, 'Y', micropythonGenerator.ORDER_ATOMIC) || '0';
    return `if display: display.text(str(${text}), int(${x}), int(${y}))\n`;
};
micropythonGenerator.forBlock['display_oled_pixel'] = function(block) {
    const x = micropythonGenerator.valueToCode(block, 'X', micropythonGenerator.ORDER_ATOMIC) || '0';
    const y = micropythonGenerator.valueToCode(block, 'Y', micropythonGenerator.ORDER_ATOMIC) || '0';
    const color = block.getFieldValue('COLOR');
    return `if display: display.pixel(int(${x}), int(${y}), ${color})\n`;
};
micropythonGenerator.forBlock['display_oled_line'] = function(block) {
    const x1 = micropythonGenerator.valueToCode(block, 'X1', micropythonGenerator.ORDER_ATOMIC) || '0';
    const y1 = micropythonGenerator.valueToCode(block, 'Y1', micropythonGenerator.ORDER_ATOMIC) || '0';
    const x2 = micropythonGenerator.valueToCode(block, 'X2', micropythonGenerator.ORDER_ATOMIC) || '0';
    const y2 = micropythonGenerator.valueToCode(block, 'Y2', micropythonGenerator.ORDER_ATOMIC) || '0';
    return `if display: display.line(int(${x1}), int(${y1}), int(${x2}), int(${y2}), 1)\n`;
};
micropythonGenerator.forBlock['display_oled_rect'] = function(block) {
    const mode = block.getFieldValue('MODE');
    const x = micropythonGenerator.valueToCode(block, 'X', micropythonGenerator.ORDER_ATOMIC) || '0';
    const y = micropythonGenerator.valueToCode(block, 'Y', micropythonGenerator.ORDER_ATOMIC) || '0';
    const width = micropythonGenerator.valueToCode(block, 'WIDTH', micropythonGenerator.ORDER_ATOMIC) || '0';
    const height = micropythonGenerator.valueToCode(block, 'HEIGHT', micropythonGenerator.ORDER_ATOMIC) || '0';
    return `if display: display.${mode}(int(${x}), int(${y}), int(${width}), int(${height}), 1)\n`;
};

micropythonGenerator.forBlock['display_oled_animate_fireworks'] = function(block) {
    micropythonGenerator.definitions_['import_random_fw'] = 'import random';
    micropythonGenerator.definitions_['import_math_fw'] = 'import math';
    const duration = micropythonGenerator.valueToCode(block, 'DURATION', micropythonGenerator.ORDER_ATOMIC) || '5';
    const functionName = 'run_fireworks';
    if (!micropythonGenerator.functionNames_[functionName]) {
        const func = `
class Particle:
    def __init__(self, x, y, vx, vy, gravity):
        self.x, self.y, self.vx, self.vy, self.gravity = x, y, vx, vy, gravity
    def update(self):
        self.x += self.vx
        self.y += self.vy
        self.vy += self.gravity
class Firework:
    def __init__(self, width, height):
        self.width, self.height = width, height
        self.gravity = 0.08
        self.reset()
    def reset(self):
        start_x = self.width // 2
        start_vy = - (2 + random.random() * 1)
        self.fuse = Particle(start_x, self.height - 1, 0, start_vy, self.gravity / 3)
        self.particles = []
        self.exploded = False
    def update(self):
        if not self.exploded:
            self.fuse.update()
            if self.fuse.vy >= 0:
                self.exploded = True
                num_particles = 30 + random.randint(0, 30)
                for _ in range(num_particles):
                    angle = random.random() * 2 * math.pi
                    speed = random.random() * 2
                    vx = math.cos(angle) * speed
                    vy = math.sin(angle) * speed
                    self.particles.append(Particle(self.fuse.x, self.fuse.y, vx, vy, self.gravity))
        else:
            for p in self.particles:
                p.update()
            self.particles = [p for p in self.particles if 0 <= p.x < self.width and 0 <= p.y < self.height]
            if not self.particles:
                self.reset()
    def draw(self, display):
        if not self.exploded:
            display.pixel(int(self.fuse.x), int(self.fuse.y), 1)
        else:
            for p in self.particles:
                display.pixel(int(p.x), int(p.y), 1)
def ${functionName}(disp, total_duration):
    if not disp: return
    fireworks = [Firework(disp.width, disp.height)]
    start_time = time.time()
    while time.time() - start_time < total_duration:
        disp.fill(0)
        if len(fireworks) < 3 and random.random() < 0.05:
             fireworks.append(Firework(disp.width, disp.height))
        for fw in fireworks:
            fw.update()
            fw.draw(disp)
        disp.show()
        time.sleep_ms(10)
`;
        micropythonGenerator.functionNames_[functionName] = func;
    }
    return `${functionName}(display, ${duration})\n`;
};

micropythonGenerator.forBlock['display_oled_create_image'] = function(block) {
    micropythonGenerator.definitions_['import_framebuf'] = 'import framebuf';
    const width = micropythonGenerator.valueToCode(block, 'WIDTH', micropythonGenerator.ORDER_ATOMIC) || '0';
    const height = micropythonGenerator.valueToCode(block, 'HEIGHT', micropythonGenerator.ORDER_ATOMIC) || '0';
    
    let data = micropythonGenerator.valueToCode(block, 'DATA', micropythonGenerator.ORDER_ATOMIC) || "''";
    
    data = `b${data}`;
    
    const code = `framebuf.FrameBuffer(bytearray(${data}), int(${width}), int(${height}), framebuf.MONO_HLSB)`;
    
    return [code, micropythonGenerator.ORDER_FUNCTION_CALL];
};

micropythonGenerator.forBlock['display_oled_draw_image'] = function(block) {
    const image = micropythonGenerator.valueToCode(block, 'IMAGE', micropythonGenerator.ORDER_ATOMIC) || 'None';
    const x = micropythonGenerator.valueToCode(block, 'X', micropythonGenerator.ORDER_ATOMIC) || '0';
    const y = micropythonGenerator.valueToCode(block, 'Y', micropythonGenerator.ORDER_ATOMIC) || '0';
    
    return `if display and ${image}: display.blit(${image}, int(${x}), int(${y}))\n`;
};



// --- Communication Generators ---
micropythonGenerator.forBlock['usb_serial_println'] = function(block) {
    const data = micropythonGenerator.valueToCode(block, 'DATA', micropythonGenerator.ORDER_ATOMIC) || '""';
    return `print(str(${data}))\n`;
};

micropythonGenerator.forBlock['usb_serial_print_value'] = function(block) {
    const name = micropythonGenerator.valueToCode(block, 'NAME', micropythonGenerator.ORDER_ATOMIC) || '""';
    const value = micropythonGenerator.valueToCode(block, 'VALUE', micropythonGenerator.ORDER_ATOMIC) || '""';
    return `print(str(${name}) + ' = ' + str(${value}))\n`;
};

micropythonGenerator.forBlock['usb_serial_read_line'] = () => ['input()', micropythonGenerator.ORDER_FUNCTION_CALL];

// --- Wi-Fi Generators ---
micropythonGenerator.forBlock['wifi_connect'] = function(block) {
    const ssid = micropythonGenerator.valueToCode(block, 'SSID', micropythonGenerator.ORDER_ATOMIC) || '""';
    const password = micropythonGenerator.valueToCode(block, 'PASSWORD', micropythonGenerator.ORDER_ATOMIC) || '""';
    micropythonGenerator.definitions_['import_network'] = 'import network';
    
    const functionName = 'connect_to_wifi';
    if (!micropythonGenerator.functionNames_[functionName]) {
        const func = `
wlan = network.WLAN(network.STA_IF)
wlan.active(True)

def ${functionName}(ssid, password):
    if wlan.isconnected():
        return
    print('Connecting to Wi-Fi...')
    wlan.connect(ssid, password)
    max_wait = 10
    while max_wait > 0:
        if wlan.status() < 0 or wlan.status() >= 3:
            break
        max_wait -= 1
        print('.')
        time.sleep(1)
    if wlan.isconnected():
        print('Connected! IP:', wlan.ifconfig()[0])
    else:
        print('Connection failed.')
`;
        micropythonGenerator.functionNames_[functionName] = func;
    }
    return `${functionName}(${ssid}, ${password})\n`;
};

micropythonGenerator.forBlock['wifi_is_connected'] = () => ['wlan.isconnected()', micropythonGenerator.ORDER_FUNCTION_CALL];
micropythonGenerator.forBlock['wifi_get_ip'] = () => ["(wlan.ifconfig()[0] if wlan.isconnected() else 'Not Connected')", micropythonGenerator.ORDER_CONDITIONAL];

micropythonGenerator.forBlock['http_get_json'] = function(block) {
    micropythonGenerator.definitions_['import_urequests'] = 'import urequests';
    micropythonGenerator.definitions_['import_ujson'] = 'import ujson';
    const url = micropythonGenerator.valueToCode(block, 'URL', micropythonGenerator.ORDER_ATOMIC) || '""';
    const code = `ujson.loads(urequests.get(${url}).text)`;
    return [`(${code} if wlan.isconnected() else {})`, micropythonGenerator.ORDER_FUNCTION_CALL];
};

micropythonGenerator.forBlock['json_get_key'] = function(block) {
    const json_data = micropythonGenerator.valueToCode(block, 'JSON', micropythonGenerator.ORDER_MEMBER) || '{}';
    const key = micropythonGenerator.valueToCode(block, 'KEY', micropythonGenerator.ORDER_ATOMIC) || '""';
    return [`${json_data}.get(${key}, '')`, micropythonGenerator.ORDER_FUNCTION_CALL];
};

micropythonGenerator.forBlock['http_post_json'] = function(block) {
    micropythonGenerator.definitions_['import_urequests'] = 'import urequests';
    const url = micropythonGenerator.valueToCode(block, 'URL', micropythonGenerator.ORDER_ATOMIC) || '""';
    const value1 = micropythonGenerator.valueToCode(block, 'VALUE1', micropythonGenerator.ORDER_ATOMIC) || 'None';
    const value2 = micropythonGenerator.valueToCode(block, 'VALUE2', micropythonGenerator.ORDER_ATOMIC) || 'None';
    const value3 = micropythonGenerator.valueToCode(block, 'VALUE3', micropythonGenerator.ORDER_ATOMIC) || 'None';
    
    // Create a dictionary of values, filtering out any that were not provided.
    let data_dict = [];
    if (value1 !== 'None') data_dict.push(`"value1": ${value1}`);
    if (value2 !== 'None') data_dict.push(`"value2": ${value2}`);
    if (value3 !== 'None') data_dict.push(`"value3": ${value3}`);
    
    const data_string = `{${data_dict.join(', ')}}`;

    return `if wlan.isconnected():\n${micropythonGenerator.INDENT}try:\n${micropythonGenerator.INDENT}${micropythonGenerator.INDENT}urequests.post(${url}, json=${data_string})\n${micropythonGenerator.INDENT}except Exception as e:\n${micropythonGenerator.INDENT}${micropythonGenerator.INDENT}print("HTTP POST failed:", e)\n`;
};

// --- Web Server Generators (CORRECTED AND REFACTORED) ---
micropythonGenerator.forBlock['wifi_start_web_server'] = function(block) {
    micropythonGenerator.definitions_['import_socket'] = 'import socket';
    micropythonGenerator.definitions_['import_thread'] = 'import _thread';
    micropythonGenerator.definitions_['import_ws_server'] = 'import websocket_server';
    micropythonGenerator.definitions_['import_ujson_ws'] = 'import ujson';

    micropythonGenerator.definitions_['web_server_globals'] = `
# --- Global Web Server & WebSocket State ---
_ws_clients = []
_dashboard_state = {}
_web_request_handler = None
_web_html_content = "<h1>Pico W Server</h1><p>Connect via WebSocket to control.</p>"
`;

    const funcName = 'start_web_and_ws_server';
    if (!micropythonGenerator.functionNames_[funcName]) {

micropythonGenerator.functionNames_['ws_helpers'] = `
def _ws_callback(client, msg):
    global _dashboard_state
    try:
        data = ujson.loads(msg)
        if 'id' in data and 'value' in data:
            component_id = data['id']
            value = data['value']

            # Try to convert to a number, but keep as string if it fails
            try:
                parsed_value = int(value)
            except (ValueError, TypeError):
                parsed_value = value # Keep original value
            
            _dashboard_state[component_id] = parsed_value

            # Special handling for joystick on Pico
            if component_id.endswith('_x'):
                 _dashboard_state[component_id.replace('_x', '_y')] = data.get('y', 0)

            # Broadcast change to all other clients
            for c in _ws_clients:
                if c is not client:
                    try: c.send(msg)
                    except Exception: pass
    except (ValueError, KeyError):
        print("Invalid ws msg")

def send_to_dashboard(component_id, prop, value):
    msg = ujson.dumps({"id": component_id, "prop": prop, "value": value})
    for client in _ws_clients:
        try:
            client.send(msg)
        except Exception:
            # Client is likely disconnected, will be removed later
            pass
`;
        micropythonGenerator.functionNames_[funcName] = `
def _web_server_thread():
    try:
        addr = socket.getaddrinfo('0.0.0.0', 80)[0][-1]
        s = socket.socket()
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        s.bind(addr)
        s.listen(5)
        print('Web server listening on port 80')
        
        while True:
            cl = None
            try:
                cl, addr = s.accept()
                request_bytes = cl.recv(1024)
                if not request_bytes:
                    cl.close()
                    continue
                
                request_str = request_bytes.decode('utf-8')
                
                if "Upgrade: websocket" in request_str:
                    print("Accepting WebSocket connection...")
                    ws_server = websocket_server.WsServer(cl, on_message=_ws_callback)
                    _ws_clients.append(ws_server)
                    ws_server.serve_forever()
                    _ws_clients.remove(ws_server)
                    print("WebSocket client disconnected.")
                    continue

                if callable(_web_request_handler):
                    _web_request_handler()
                
                response = 'HTTP/1.1 200 OK\\\\r\\\\nContent-Type: text/html\\\\r\\\\nConnection: close\\\\r\\\\n\\\\r\\\\n' + str(_web_html_content)
                cl.sendall(response.encode('utf-8'))
                cl.close()
            except OSError as e:
                if cl: cl.close()
            except Exception as e:
                if cl: cl.close()
                print('Web server error:', e)
    except Exception as e:
        print('Web server fatal error:', e)

def ${funcName}():
    if wlan and wlan.isconnected():
        try:
            _thread.start_new_thread(_web_server_thread, ())
            print("Web server thread started.")
        except Exception as e:
            print("Failed to start web server thread:", e)
    else:
        print("Wi-Fi not connected. Web server not started.")
`;
    }
    return `${funcName}()\n`;
};

micropythonGenerator.forBlock['wifi_on_web_request'] = function(block) {
    const statements_do = micropythonGenerator.statementToCode(block, 'DO') || `${micropythonGenerator.INDENT}pass\n`;
    const funcName = micropythonGenerator.nameDB_.getDistinctName('on_web_request', 'PROCEDURE');
    const func = `def ${funcName}():\n${micropythonGenerator.INDENT}global _web_html_content\n${statements_do}`;
    micropythonGenerator.functionNames_[funcName] = func;
    return `_web_request_handler = ${funcName}\n`;
};

micropythonGenerator.forBlock['wifi_send_web_response'] = function(block) {
    const html = micropythonGenerator.valueToCode(block, 'HTML', 0) || '""';
    return `_web_html_content = str(${html})\n`;
};

micropythonGenerator.forBlock['wifi_get_web_request_path'] = function(block) {
    return ['"/"', micropythonGenerator.ORDER_ATOMIC];
};

// --- Bluetooth LE Generators ---
micropythonGenerator.forBlock['ble_setup'] = function(block) {
    micropythonGenerator.definitions_['import_bluetooth'] = 'import ubluetooth';
    micropythonGenerator.definitions_['import_struct'] = 'import struct';
    const name = micropythonGenerator.valueToCode(block, 'NAME', micropythonGenerator.ORDER_ATOMIC) || '"Pico"';
    
    const functionName = 'ble_setup_advertising';
    if (!micropythonGenerator.functionNames_[functionName]) {
        const func = `
ble = ubluetooth.BLE()
ble.active(True)
_adv_name = ""

def _ble_compose_adv_payload(name, data_str):
    global _adv_name
    if name:
        _adv_name = name
    
    name_bytes = _adv_name.encode()
    
    payload = bytearray()
    payload += b'\\x02\\x01\\x06' # Flags
    payload += struct.pack('B', len(name_bytes) + 1) + b'\\t' + name_bytes
    
    if data_str:
        data_bytes = str(data_str).encode()
        payload += struct.pack('B', len(data_bytes) + 1) + b'\\xff' + data_bytes
        
    return payload

def ${functionName}(name):
    ble.gap_advertise(100000, adv_data=_ble_compose_adv_payload(name, None))

${functionName}(${name})
`;
        micropythonGenerator.functionNames_[functionName] = func;
    }
    return '';
};

micropythonGenerator.forBlock['ble_advertise_data'] = function(block) {
    const data = micropythonGenerator.valueToCode(block, 'DATA', micropythonGenerator.ORDER_ATOMIC) || '""';
    return `ble.gap_advertise(100000, adv_data=_ble_compose_adv_payload(None, ${data}))\n`;
};