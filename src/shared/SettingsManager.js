// src/shared/SettingsManager.js

export const SettingsManager = {
    // 1. Defaults matching your CSS variables
    DEFAULTS: {
        theme: 'light',
        color: '#5A67D8',
        density: 'normal',
        fontSize: 'normal',
        animations: 'enabled'
    },

    // 2. Class mappings for CSS
    CLASS_PREFIXES: {
        theme: ['light-mode', 'dark-mode', 'contrast-mode'],
        density: ['density-compact', 'density-normal', 'density-spacious'],
        fontSize: ['font-small', 'font-normal', 'font-large']
    },

    // 3. Helper: Get setting
    get(key) {
        return localStorage.getItem(`app_setting_${key}`) || this.DEFAULTS[key];
    },

    // 4. Helper: Save setting
    set(key, value) {
        localStorage.setItem(`app_setting_${key}`, value);
        this.apply(); // Apply immediately
        
        // Dispatch custom event so UI components can react immediately (e.g. Monaco Editor)
        window.dispatchEvent(new CustomEvent('app-settings-changed', { detail: { key, value } }));
    },

    // 5. CORE: Apply settings to DOM
    apply() {
        const body = document.body;
        const root = document.documentElement;

        // --- Theme ---
        const theme = this.get('theme');
        body.classList.remove(...this.CLASS_PREFIXES.theme);
        body.classList.add(`${theme}-mode`);
        
        // Critical: Set data-theme for legacy code (Monaco Editor check)
        root.setAttribute('data-theme', theme);
        // Legacy support for theme-loader.js if still used anywhere
        localStorage.setItem('blockIdeTheme', theme);

        // --- Accent Color ---
        const color = this.get('color');
        root.style.setProperty('--primary-color', color);
        // Ensure buttons using --accent-primary update
        root.style.setProperty('--accent-primary', color);

        // --- Density ---
        const density = this.get('density');
        body.classList.remove(...this.CLASS_PREFIXES.density);
        body.classList.add(`density-${density}`);

        // --- Font Size ---
        const fontSize = this.get('fontSize');
        body.classList.remove(...this.CLASS_PREFIXES.fontSize);
        body.classList.add(`font-${fontSize}`);

        // --- Animations ---
        const animations = this.get('animations');
        if (animations === 'enabled') {
            body.classList.add('animations-enabled');
        } else {
            body.classList.remove('animations-enabled');
        }
    },

    // 6. Init Listener
    init() {
        this.apply();
        
        // Listen for changes from other tabs/windows
        window.addEventListener('storage', (e) => {
            if (e.key.startsWith('app_setting_')) {
                this.apply();
            }
        });
    }
};