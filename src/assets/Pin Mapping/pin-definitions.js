// This file contains the coordinates for the clickable areas on the board images.
// The capability arrays (digital_input, analog, etc.) have been populated based on
// the standard pinouts for the ESP32 DevKitC and Raspberry Pi Pico.

const PIN_DEFINITIONS = {
    'esp32': {
        'all': [
            { "pin": "EN", "x": 449, "y": 123, "width": 25, "height": 25 },
            { "pin": "36", "x": 447, "y": 173, "width": 25, "height": 25 },
            { "pin": "39", "x": 447, "y": 223, "width": 25, "height": 25 },
            { "pin": "34", "x": 447, "y": 274, "width": 25, "height": 25 },
            { "pin": "35", "x": 447, "y": 324, "width": 25, "height": 25 },
            { "pin": "32", "x": 447, "y": 373, "width": 25, "height": 25 },
            { "pin": "33", "x": 449, "y": 423, "width": 25, "height": 25 },
            { "pin": "25", "x": 447, "y": 475, "width": 25, "height": 25 },
            { "pin": "26", "x": 447, "y": 525, "width": 25, "height": 25 },
            { "pin": "27", "x": 447, "y": 574, "width": 25, "height": 25 },
            { "pin": "14", "x": 447, "y": 626, "width": 25, "height": 25 },
            { "pin": "12", "x": 447, "y": 676, "width": 25, "height": 25 },
            { "pin": "13", "x": 449, "y": 727, "width": 25, "height": 25 },
            { "pin": "GND", "x": 449, "y": 778, "width": 25, "height": 25 },
            { "pin": "VIN", "x": 447, "y": 827, "width": 25, "height": 25 },
            { "pin": "3V3", "x": 902, "y": 830, "width": 25, "height": 25 },
            { "pin": "GND2", "x": 899, "y": 778, "width": 25, "height": 25 },
            { "pin": "15", "x": 902, "y": 726, "width": 25, "height": 25 },
            { "pin": "2", "x": 902, "y": 674, "width": 25, "height": 25 },
            { "pin": "4", "x": 899, "y": 627, "width": 25, "height": 25 },
            { "pin": "16", "x": 902, "y": 573, "width": 25, "height": 25 },
            { "pin": "17", "x": 899, "y": 523, "width": 25, "height": 25 },
            { "pin": "5", "x": 899, "y": 474, "width": 25, "height": 25 },
            { "pin": "18", "x": 902, "y": 424, "width": 25, "height": 25 },
            { "pin": "19", "x": 899, "y": 373, "width": 25, "height": 25 },
            { "pin": "21", "x": 899, "y": 323, "width": 25, "height": 25 },
            { "pin": "3", "x": 899, "y": 273, "width": 25, "height": 25 },
            { "pin": "1", "x": 899, "y": 222, "width": 25, "height": 25 },
            { "pin": "22", "x": 899, "y": 174, "width": 25, "height": 25 },
            { "pin": "23", "x": 899, "y": 125, "width": 25, "height": 25 }
        ],
        'digital_input': [
            {"pin": "36", "x": 447, "y": 173, "width": 25, "height": 25},
            {"pin": "39", "x": 447, "y": 223, "width": 25, "height": 25},
            {"pin": "34", "x": 447, "y": 274, "width": 25, "height": 25},
            {"pin": "35", "x": 447, "y": 324, "width": 25, "height": 25},
            {"pin": "32", "x": 447, "y": 373, "width": 25, "height": 25},
            {"pin": "33", "x": 449, "y": 423, "width": 25, "height": 25},
            {"pin": "25", "x": 447, "y": 475, "width": 25, "height": 25},
            {"pin": "26", "x": 447, "y": 525, "width": 25, "height": 25},
            {"pin": "27", "x": 447, "y": 574, "width": 25, "height": 25},
            {"pin": "14", "x": 447, "y": 626, "width": 25, "height": 25},
            {"pin": "12", "x": 447, "y": 676, "width": 25, "height": 25},
            {"pin": "13", "x": 449, "y": 727, "width": 25, "height": 25},
            {"pin": "15", "x": 902, "y": 726, "width": 25, "height": 25},
            {"pin": "2", "x": 902, "y": 674, "width": 25, "height": 25},
            {"pin": "4", "x": 899, "y": 627, "width": 25, "height": 25},
            {"pin": "16", "x": 902, "y": 573, "width": 25, "height": 25},
            {"pin": "17", "x": 899, "y": 523, "width": 25, "height": 25},
            {"pin": "5", "x": 899, "y": 474, "width": 25, "height": 25},
            {"pin": "18", "x": 902, "y": 424, "width": 25, "height": 25},
            {"pin": "19", "x": 899, "y": 373, "width": 25, "height": 25},
            {"pin": "21", "x": 899, "y": 323, "width": 25, "height": 25},
            {"pin": "3", "x": 899, "y": 273, "width": 25, "height": 25},
            {"pin": "1", "x": 899, "y": 222, "width": 25, "height": 25},
            {"pin": "22", "x": 899, "y": 174, "width": 25, "height": 25},
            {"pin": "23", "x": 899, "y": 125, "width": 25, "height": 25}
        ],
        'digital_output': [
            {"pin": "32", "x": 447, "y": 373, "width": 25, "height": 25},
            {"pin": "33", "x": 449, "y": 423, "width": 25, "height": 25},
            {"pin": "25", "x": 447, "y": 475, "width": 25, "height": 25},
            {"pin": "26", "x": 447, "y": 525, "width": 25, "height": 25},
            {"pin": "27", "x": 447, "y": 574, "width": 25, "height": 25},
            {"pin": "14", "x": 447, "y": 626, "width": 25, "height": 25},
            {"pin": "12", "x": 447, "y": 676, "width": 25, "height": 25},
            {"pin": "13", "x": 449, "y": 727, "width": 25, "height": 25},
            {"pin": "15", "x": 902, "y": 726, "width": 25, "height": 25},
            {"pin": "2", "x": 902, "y": 674, "width": 25, "height": 25},
            {"pin": "4", "x": 899, "y": 627, "width": 25, "height": 25},
            {"pin": "16", "x": 902, "y": 573, "width": 25, "height": 25},
            {"pin": "17", "x": 899, "y": 523, "width": 25, "height": 25},
            {"pin": "5", "x": 899, "y": 474, "width": 25, "height": 25},
            {"pin": "18", "x": 902, "y": 424, "width": 25, "height": 25},
            {"pin": "19", "x": 899, "y": 373, "width": 25, "height": 25},
            {"pin": "21", "x": 899, "y": 323, "width": 25, "height": 25},
            {"pin": "3", "x": 899, "y": 273, "width": 25, "height": 25},
            {"pin": "1", "x": 899, "y": 222, "width": 25, "height": 25},
            {"pin": "22", "x": 899, "y": 174, "width": 25, "height": 25},
            {"pin": "23", "x": 899, "y": 125, "width": 25, "height": 25}
        ],
        'analog': [
            {"pin": "36", "x": 447, "y": 173, "width": 25, "height": 25},
            {"pin": "39", "x": 447, "y": 223, "width": 25, "height": 25},
            {"pin": "34", "x": 447, "y": 274, "width": 25, "height": 25},
            {"pin": "35", "x": 447, "y": 324, "width": 25, "height": 25},
            {"pin": "32", "x": 447, "y": 373, "width": 25, "height": 25},
            {"pin": "33", "x": 449, "y": 423, "width": 25, "height": 25}
        ],
        'pwm': [ // Same as digital_output for ESP32
            {"pin": "32", "x": 447, "y": 373, "width": 25, "height": 25},
            {"pin": "33", "x": 449, "y": 423, "width": 25, "height": 25},
            {"pin": "25", "x": 447, "y": 475, "width": 25, "height": 25},
            {"pin": "26", "x": 447, "y": 525, "width": 25, "height": 25},
            {"pin": "27", "x": 447, "y": 574, "width": 25, "height": 25},
            {"pin": "14", "x": 447, "y": 626, "width": 25, "height": 25},
            {"pin": "12", "x": 447, "y": 676, "width": 25, "height": 25},
            {"pin": "13", "x": 449, "y": 727, "width": 25, "height": 25},
            {"pin": "15", "x": 902, "y": 726, "width": 25, "height": 25},
            {"pin": "2", "x": 902, "y": 674, "width": 25, "height": 25},
            {"pin": "4", "x": 899, "y": 627, "width": 25, "height": 25},
            {"pin": "16", "x": 902, "y": 573, "width": 25, "height": 25},
            {"pin": "17", "x": 899, "y": 523, "width": 25, "height": 25},
            {"pin": "5", "x": 899, "y": 474, "width": 25, "height": 25},
            {"pin": "18", "x": 902, "y": 424, "width": 25, "height": 25},
            {"pin": "19", "x": 899, "y": 373, "width": 25, "height": 25},
            {"pin": "21", "x": 899, "y": 323, "width": 25, "height": 25},
            {"pin": "3", "x": 899, "y": 273, "width": 25, "height": 25},
            {"pin": "1", "x": 899, "y": 222, "width": 25, "height": 25},
            {"pin": "22", "x": 899, "y": 174, "width": 25, "height": 25},
            {"pin": "23", "x": 899, "y": 125, "width": 25, "height": 25}
        ]
    },
    'pico': {
        'all': [
            {"pin": "0", "x": 479, "y": 107, "width": 25, "height": 25},
            {"pin": "1", "x": 481, "y": 138, "width": 25, "height": 25},
            {"pin": "GND", "x": 478, "y": 171, "width": 25, "height": 25},
            {"pin": "2", "x": 478, "y": 200, "width": 25, "height": 25},
            {"pin": "3", "x": 479, "y": 232, "width": 25, "height": 25},
            {"pin": "4", "x": 479, "y": 262, "width": 25, "height": 25},
            {"pin": "5", "x": 479, "y": 294, "width": 25, "height": 25},
            {"pin": "GND1", "x": 479, "y": 326, "width": 25, "height": 25},
            {"pin": "6", "x": 479, "y": 356, "width": 25, "height": 25},
            {"pin": "7", "x": 479, "y": 387, "width": 25, "height": 25},
            {"pin": "8", "x": 478, "y": 419, "width": 25, "height": 25},
            {"pin": "9", "x": 479, "y": 449, "width": 25, "height": 25},
            {"pin": "GND2", "x": 479, "y": 481, "width": 25, "height": 25},
            {"pin": "10", "x": 479, "y": 511, "width": 25, "height": 25},
            {"pin": "11", "x": 478, "y": 542, "width": 25, "height": 25},
            {"pin": "12", "x": 478, "y": 574, "width": 25, "height": 25},
            {"pin": "13", "x": 479, "y": 604, "width": 25, "height": 25},
            {"pin": "GND3", "x": 479, "y": 634, "width": 25, "height": 25},
            {"pin": "14", "x": 479, "y": 668, "width": 25, "height": 25},
            {"pin": "15", "x": 479, "y": 697, "width": 25, "height": 25},
            {"pin": "16", "x": 697, "y": 698, "width": 25, "height": 25},
            {"pin": "17", "x": 697, "y": 666, "width": 25, "height": 25},
            {"pin": "GND4", "x": 697, "y": 636, "width": 25, "height": 25},
            {"pin": "18", "x": 698, "y": 606, "width": 25, "height": 25},
            {"pin": "19", "x": 697, "y": 574, "width": 25, "height": 25},
            {"pin": "20", "x": 698, "y": 545, "width": 25, "height": 25},
            {"pin": "21", "x": 697, "y": 513, "width": 25, "height": 25},
            {"pin": "GND5", "x": 697, "y": 481, "width": 25, "height": 25},
            {"pin": "22", "x": 697, "y": 451, "width": 25, "height": 25},
            {"pin": "RUN", "x": 697, "y": 419, "width": 25, "height": 25},
            {"pin": "26", "x": 697, "y": 388, "width": 25, "height": 25},
            {"pin": "27", "x": 697, "y": 358, "width": 25, "height": 25},
            {"pin": "GND6", "x": 697, "y": 326, "width": 25, "height": 25},
            {"pin": "28", "x": 697, "y": 294, "width": 25, "height": 25},
            {"pin": "ADC_VREF", "x": 697, "y": 264, "width": 25, "height": 25},
            {"pin": "3V3(OUT)", "x": 695, "y": 232, "width": 25, "height": 25},
            {"pin": "3V3_EN", "x": 697, "y": 202, "width": 25, "height": 25},
            {"pin": "GND7", "x": 697, "y": 171, "width": 25, "height": 25},
            {"pin": "VSYS", "x": 697, "y": 139, "width": 25, "height": 25},
            {"pin": "VBUS", "x": 697, "y": 109, "width": 25, "height": 25}
        ],
        'digital_input': [], // Will be populated below
        'digital_output': [],
        'analog': [
            {"pin": "26", "x": 697, "y": 388, "width": 25, "height": 25},
            {"pin": "27", "x": 697, "y": 358, "width": 25, "height": 25},
            {"pin": "28", "x": 697, "y": 294, "width": 25, "height": 25}
        ],
        'pwm': []
    }
};

// --- Auto-populate Pico digital and PWM pins ---
PIN_DEFINITIONS.pico.all.forEach(pinDef => {
    // Check if the pin name starts with a number (e.g., "0", "1", "15")
    if (/^\d/.test(pinDef.pin)) {
        PIN_DEFINITIONS.pico.digital_input.push(pinDef);
        PIN_DEFINITIONS.pico.digital_output.push(pinDef);
        PIN_DEFINITIONS.pico.pwm.push(pinDef);
    }
});


// This function will be called by our custom field
function showPinSelectorModal(boardId, pinType, callback) {
    const modal = document.getElementById('pin-selector-modal');
    const title = document.getElementById('pin-selector-title');
    const closeBtn = document.getElementById('pin-selector-close');
    const boardImg = document.getElementById('pin-selector-board-img');
    const overlay = document.getElementById('pin-selector-overlay');

    // Configure the modal
    const friendlyPinType = pinType.replace(/_/g, ' ');
    title.textContent = `Select a Pin (${friendlyPinType})`;
    boardImg.src = window.esp32IDE.boardImageMap[boardId];
    overlay.innerHTML = ''; // Clear previous pins

    const allPinsForBoard = PIN_DEFINITIONS[boardId]?.['all'] || [];
    const validPinsForType = PIN_DEFINITIONS[boardId]?.[pinType] || [];
    const validPinNumbers = new Set(validPinsForType.map(p => p.pin));

    // Create SVG shapes for each pin
    allPinsForBoard.forEach(pinDef => {
        // We only create clickable areas for GPIO pins (those with numbers)
        if (!/^\d+$/.test(pinDef.pin)) return;

        const pinShape = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        pinShape.setAttribute('x', pinDef.x);
        pinShape.setAttribute('y', pinDef.y);
        pinShape.setAttribute('width', pinDef.width);
        pinShape.setAttribute('height', pinDef.height);
        pinShape.setAttribute('rx', 4); // Rounded corners
        
        if (validPinNumbers.has(pinDef.pin)) {
            pinShape.classList.add('pin-area');
            pinShape.dataset.pin = pinDef.pin;
            const titleEl = document.createElementNS('http://www.w3.org/2000/svg', 'title');
            titleEl.textContent = `GPIO ${pinDef.pin}`;
            pinShape.appendChild(titleEl);
        } else {
            pinShape.classList.add('pin-area', 'disabled');
        }
        overlay.appendChild(pinShape);
    });

    // Event handling
    const close = (value) => {
        modal.style.display = 'none';
        overlay.onclick = null;
        closeBtn.onclick = null;
        if (callback) { // Ensure callback exists before calling
            callback(value);
        }
    };
    
    overlay.onclick = (e) => {
        if (e.target.classList.contains('pin-area') && !e.target.classList.contains('disabled')) {
            close(e.target.dataset.pin);
        }
    };

    closeBtn.onclick = () => close(null);
    modal.style.display = 'flex';
}