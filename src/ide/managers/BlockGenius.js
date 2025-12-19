// src/renderer/managers/BlockGenius.js
'use strict';

export class BlockGenius {
    constructor() {
        this.ui = {
            geniusToast: document.getElementById('block-genius-toast'),
            geniusTitle: document.getElementById('genius-title'),
            geniusDescription: document.getElementById('genius-description'),
            geniusImage: document.getElementById('genius-image'),
            geniusCloseBtn: document.getElementById('genius-close-btn'),
        };

this.tips = {
    'sensor_dht11': {
        title: 'DHT11 Sensor',
        description: 'This sensor measures temperature and humidity. Here is a common way to wire it.',
        image: new URL('../assets/wiring/dht11.svg', import.meta.url).href
    },
    'display_oled_setup': {
        title: 'OLED Display',
        description: 'This block sets up a 128x64 OLED screen. Ensure the I2C pins match your wiring.',
        image: new URL('../assets/wiring/oled.svg', import.meta.url).href
    },
    'sensor_ultrasonic_hcsr04': {
        title: 'Ultrasonic Sensor',
        description: 'The HC-SR04 measures distance. Make sure Trig and Echo pins are correct.',
        image: new URL('../assets/wiring/hcsr04.svg', import.meta.url).href
    }
    // Add more tips here
};

        this.toastTimeout = null;
        this.seenBlocksKey = 'blockGeniusSeen';
    }

    /**
     * Initializes the Block Genius manager by setting up event listeners.
     */
    init() {
        this.ui.geniusCloseBtn.addEventListener('click', () => this.hide());
    }

    /**
     * Checks if a newly created block has an unseen tip and shows it.
     * @param {string} blockType The type of the block that was created.
     */
    handleBlockCreate(blockType) {
        const seenBlocks = JSON.parse(localStorage.getItem(this.seenBlocksKey) || '[]');
        if (this.tips[blockType] && !seenBlocks.includes(blockType)) {
            this.show(blockType);
            seenBlocks.push(blockType);
            localStorage.setItem(this.seenBlocksKey, JSON.stringify(seenBlocks));
        }
    }

    /**
     * Displays and populates the toast notification for a specific block type.
     * @param {string} blockType The type of the block to show the tip for.
     */
    show(blockType) {
        clearTimeout(this.toastTimeout);
        const tip = this.tips[blockType];
        if (!tip) return;

        this.ui.geniusTitle.textContent = tip.title;
        this.ui.geniusDescription.textContent = tip.description;
        this.ui.geniusImage.src = tip.image;

        this.ui.geniusToast.classList.add('show');

        // Auto-hide after 12 seconds
        this.toastTimeout = setTimeout(() => this.hide(), 12000);
    }

    /**
     * Hides the toast notification.
     */
    hide() {
        clearTimeout(this.toastTimeout);
        this.ui.geniusToast.classList.remove('show');
    }
}