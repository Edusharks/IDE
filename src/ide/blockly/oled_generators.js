// src/ide/blockly/oled_generators.js

export function registerOledGenerators(generator) {

    function wrap(code) {
        return `if 'display' in globals() and display:\n${generator.prefixLines(code, generator.INDENT)}`;
    }

    // --- 1. Setup ---
    generator.forBlock['display_oled_setup'] = function(block) {
        generator.definitions_['import_machine'] = 'from machine import Pin, PWM, ADC, SoftI2C';
        generator.definitions_['import_time'] = 'import time';
        generator.definitions_['import_ssd1306'] = 'import ssd1306';

        const pins = block.getFieldValue('PINS');
        const addr = block.getFieldValue('ADDR') || '0x3C';
        
        const sdaPin = pins;
        const sclPin = parseInt(pins) + 1;

        const setupCode = `
try:
    i2c = SoftI2C(sda=Pin(${sdaPin}), scl=Pin(${sclPin}))
    display = ssd1306.SSD1306_I2C(128, 64, i2c, addr=${addr})
    display.fill(0)
    display.show()
    print("OLED display initialized at ${addr}")
except Exception as e:
    print("OLED Setup Failed:", e)
    display = None
`;
        generator.definitions_['oled_setup'] = setupCode;
        return '';
    };

    // --- 2. Basic Drawing ---
    generator.forBlock['display_oled_clear'] = () => wrap('display.fill(0)\n');
    generator.forBlock['display_oled_show'] = () => wrap('display.show()\n');

    generator.forBlock['display_oled_pixel'] = function(block) {
        const x = block.getFieldValue('X');
        const y = block.getFieldValue('Y');
        const color = block.getFieldValue('COLOR');
        return wrap(`display.pixel(${x}, ${y}, ${color})\n`);
    };

    generator.forBlock['display_oled_text'] = function(block) {
        const text = generator.valueToCode(block, 'TEXT', 0) || "''";
        const x = block.getFieldValue('X');
        const y = block.getFieldValue('Y');
        return wrap(`display.text(str(${text}), ${x}, ${y}, 1)\n`);
    };

    generator.forBlock['display_oled_line'] = function(block) {
        const x1 = block.getFieldValue('X1');
        const y1 = block.getFieldValue('Y1');
        const x2 = block.getFieldValue('X2');
        const y2 = block.getFieldValue('Y2');
        return wrap(`display.line(${x1}, ${y1}, ${x2}, ${y2}, 1)\n`);
    };

    generator.forBlock['display_oled_rect'] = function(block) {
        const mode = block.getFieldValue('MODE');
        const x = block.getFieldValue('X');
        const y = block.getFieldValue('Y');
        const w = block.getFieldValue('WIDTH');
        const h = block.getFieldValue('HEIGHT');
        return wrap(`display.${mode}(${x}, ${y}, ${w}, ${h}, 1)\n`);
    };

    // --- 3. Images ---
    generator.forBlock['display_oled_draw_bitmap'] = function(block) {
        const x = block.getFieldValue('X');
        const y = block.getFieldValue('Y');
        const bitmapData = block.getFieldValue('BITMAP'); // 2D Array
        
        const functionName = 'draw_raw_bitmap';
        if (!generator.functionNames_[functionName]) {
            generator.functionNames_[functionName] = `
def ${functionName}(x_pos, y_pos, bitmap):
    if 'display' in globals() and display:
        for r, row in enumerate(bitmap):
            for c, pixel in enumerate(row):
                if pixel:
                    display.pixel(x_pos + c, y_pos + r, 1)
`;
        }
        const pythonList = JSON.stringify(bitmapData);
        // The helper now contains the safety check, so we don't need wrap() here
        return `${functionName}(${x}, ${y}, ${pythonList})\n`;
    };

    generator.forBlock['display_oled_create_image'] = function(block) {
        generator.definitions_['import_framebuf'] = 'import framebuf';
        const width = block.getFieldValue('WIDTH');
        const height = block.getFieldValue('HEIGHT');
        const data = block.getFieldValue('DATA'); 
        const code = `framebuf.FrameBuffer(bytearray(b'${data}'), int(${width}), int(${height}), framebuf.MONO_HLSB)`;
        return [code, generator.ORDER_FUNCTION_CALL];
    };

    generator.forBlock['display_oled_draw_image'] = function(block) {
        const img = generator.valueToCode(block, 'IMAGE', 0) || 'None';
        const x = block.getFieldValue('X');
        const y = block.getFieldValue('Y');
        return wrap(`if ${img}: display.blit(${img}, int(${x}), int(${y}))\n`);
    };

    // --- 4. Controls ---
    generator.forBlock['display_oled_power'] = (block) => wrap(`display.${block.getFieldValue('STATE')}()\n`);
    generator.forBlock['display_oled_contrast'] = (block) => wrap(`display.contrast(${block.getFieldValue('CONTRAST')})\n`);
    generator.forBlock['display_oled_invert'] = (block) => wrap(`display.invert(${block.getFieldValue('INVERT')})\n`);
    
    generator.forBlock['display_oled_animate_fireworks'] = function(block) {
        generator.definitions_['import_random'] = 'import random';
        generator.definitions_['import_math'] = 'import math';
        const duration = block.getFieldValue('DURATION');

        const functionName = 'run_fireworks';
        if (!generator.functionNames_[functionName]) {
            const func = `
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
                for _ in range(20 + random.randint(0, 20)):
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
    fw = [Firework(disp.width, disp.height), Firework(disp.width, disp.height)]
    start_t = time.time()
    while time.time() - start_t < total_duration:
        disp.fill(0)
        for f in fw: f.update(); f.draw(disp)
        disp.show()
        yield  # Yield control to allow external sleep (Async compatible)
`;
            generator.functionNames_[functionName] = func;
        }
        
        // The loop here handles the sleep. 
        // In Sim: time.sleep_ms becomes await _sim_sleep_ms (valid in top-level for loop)
        // In Real: time.sleep_ms blocks (valid)
        return wrap(`for _ in ${functionName}(display, ${duration}):\n${generator.INDENT}time.sleep_ms(20)\n`);
    };
}