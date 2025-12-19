// src/ide/managers/ToastManager.js
'use strict';

export class ToastManager {
    constructor() {
        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        document.body.appendChild(this.container);
    }

    show(message, type = 'info', duration = 2000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let icon = '';
        if(type === 'success') icon = '✅ ';
        if(type === 'error') icon = '❌ ';
        if(type === 'warning') icon = '⚠️ ';
        if(type === 'info') icon = 'ℹ️ ';

        toast.innerHTML = `
            <div class="toast-message">${icon}${message}</div>
            <button class="toast-close">&times;</button>
        `;

        // Close button logic
        const closeBtn = toast.querySelector('.toast-close');
        if (closeBtn) {
            closeBtn.onclick = (e) => {
                e.stopPropagation();
                this.dismiss(toast);
            };
        }

        this.container.appendChild(toast);

        // Auto dismiss
        if (duration > 0) {
            const timer = setTimeout(() => {
                this.dismiss(toast);
            }, duration);
            
            // Optional: Pause on hover could be added here by clearing 'timer'
            // For now, we attach the timer ID to the element just in case
            toast.dataset.timerId = timer;
        }
    }

    dismiss(toast) {
        // Prevent double-dismissal
        if (!toast || toast.classList.contains('dismissing')) return;
        toast.classList.add('dismissing');

        // Apply exit animation manually to ensure it triggers
        toast.style.animation = 'fadeOut 0.3s ease-out forwards';

        const removeNode = () => {
            if (toast && toast.parentElement) {
                toast.remove();
            }
        };

        // 1. Listen for the CSS animation to finish
        toast.addEventListener('animationend', removeNode, { once: true });

        // 2. CRITICAL FALLBACK: Force removal after 350ms 
        // This handles cases where animations are disabled or the tab is hidden
        setTimeout(removeNode, 350);
    }
}