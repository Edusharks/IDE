// src/ide/blockly/neopixel_generators.js

export function registerNeoPixelGenerators(generator) {

    function ensureImports() {
        generator.definitions_['import_machine'] = 'from machine import Pin';
        generator.definitions_['import_neopixel'] = 'import neopixel';
    }

    // --- 1. Setup (Injects Smart Wrapper) ---
    generator.forBlock['actuator_neopixel_setup'] = function(block) {
        ensureImports();
        const pin = block.getFieldValue('PIN');
        const num = block.getFieldValue('NUM_PIXELS'); 
        
        // This Python class wraps the standard NeoPixel library.
        // It stores the "original" color data so brightness can be changed
        // dynamically without losing color quality or requiring re-filling.
        const wrapperClass = `
class NPWrapper(neopixel.NeoPixel):
    def __init__(self, p, n):
        super().__init__(p, n)
        self.b = 1.0
        self.d = [(0,0,0)] * n
    
    def _parse(self, c):
        if isinstance(c, str):
            c = c.lstrip('#')
            try: return tuple(int(c[i:i+2], 16) for i in (0, 2, 4))
            except: return (0,0,0)
        return c

    def brightness(self, v):
        self.b = max(0.0, min(1.0, v))
        self._refresh()
        self.write()

    def _refresh(self):
        for i, c in enumerate(self.d):
            super().__setitem__(i, tuple(int(x * self.b) for x in c))

    def __setitem__(self, i, c):
        c = self._parse(c)
        self.d[i] = c
        super().__setitem__(i, tuple(int(x * self.b) for x in c))

    def __getitem__(self, i):
        return self.d[i]

    def fill(self, c):
        c = self._parse(c)
        self.d = [c] * len(self.d)
        super().fill(tuple(int(x * self.b) for x in c))
`;
        generator.definitions_['NPWrapper'] = wrapperClass;
        generator.definitions_['neopixel_strip'] = `np = NPWrapper(Pin(${pin}), int(${num}))`;
        generator.definitions_['rainbow_cycle_start'] = 'rainbow_cycle_start = 0';
        
        return '';
    };

    // --- 2. Brightness (Slider) ---
    generator.forBlock['actuator_neopixel_brightness'] = function(block) {
        const val = block.getFieldValue('BRIGHTNESS'); 
        // Automatically updates strip thanks to wrapper
        return `np.brightness(${val} / 100.0)\n`;
    };

    // --- 3. Brightness (Input/Variable) ---
    generator.forBlock['actuator_neopixel_brightness_val'] = function(block) {
        const val = generator.valueToCode(block, 'BRIGHTNESS', generator.ORDER_ATOMIC) || '100';
        // Automatically updates strip thanks to wrapper
        return `np.brightness(${val} / 100.0)\n`;
    };

    // --- 4. Fill Color ---
    generator.forBlock['actuator_neopixel_fill'] = function(block) {
        const color = block.getFieldValue('COLOR'); 
        return `np.fill('${color}')\nnp.write()\n`;
    };

    // --- 5. Set Pixel ---
    generator.forBlock['actuator_neopixel_set'] = function(block) {
        const index = block.getFieldValue('PIXEL_NUM'); 
        const color = block.getFieldValue('COLOR'); 
        return `try:\n  np[int(${index})] = '${color}'\nexcept IndexError: pass\n`;
    };

    // --- 6. Shift ---
    generator.forBlock['actuator_neopixel_shift'] = function(block) {
        const shift = block.getFieldValue('SHIFT'); 
        const funcName = 'neopixel_shift';
        // Uses wrapper's __getitem__ to get original colors, so brightness doesn't degrade
        if (!generator.functionNames_[funcName]) {
            generator.functionNames_[funcName] = `
def ${funcName}(strip, n):
    l = len(strip.d)
    if l == 0: return
    n %= l
    buf = [strip[i] for i in range(l)]
    buf = buf[-n:] + buf[:-n]
    for i in range(l): strip[i] = buf[i]
    strip.write()
`;
        }
        return `${funcName}(np, int(${shift}))\n`;
    };

    // --- 7. Rainbow ---
    generator.forBlock['actuator_neopixel_rainbow'] = function() {
        const wheelFunc = 'neopixel_wheel';
        if (!generator.functionNames_[wheelFunc]) {
            generator.functionNames_[wheelFunc] = `
def ${wheelFunc}(pos):
    pos = 255 - pos
    if pos < 85: return (255 - pos * 3, 0, pos * 3)
    if pos < 170: pos -= 85; return (0, pos * 3, 255 - pos * 3)
    pos -= 170; return (pos * 3, 255 - pos * 3, 0)`;
        }

        const stepFunc = 'neopixel_rainbow_step';
        if (!generator.functionNames_[stepFunc]) {
            generator.functionNames_[stepFunc] = `
def ${stepFunc}(strip):
    global rainbow_cycle_start
    n = len(strip.d)
    for i in range(n):
        idx = (i * 256 // n) + rainbow_cycle_start
        color = ${wheelFunc}(idx & 255)
        strip[i] = color
    strip.write()
    rainbow_cycle_start = (rainbow_cycle_start + 1) % 256`;
        }
        return `${stepFunc}(np)\n`;
    };

    // --- 8. Show/Clear ---
    generator.forBlock['actuator_neopixel_show'] = function() {
        return 'np.write()\n';
    };

    generator.forBlock['actuator_neopixel_clear'] = function() {
        return 'np.fill((0,0,0))\nnp.write()\n';
    };
}