// src/renderer/utils/modals.js

document.addEventListener('DOMContentLoaded', () => {
    // Inject the modal HTML into the body of any page that includes this script
    const modalHTML = `
        <div id="custom-prompt-modal" class="modal-backdrop" style="display: none;">
            <div class="modal-content">
                <p id="custom-prompt-message"></p>
                <input type="text" id="custom-prompt-input">
                <div class="modal-buttons">
                    <button id="custom-prompt-ok" class="btn primary">OK</button>
                    <button id="custom-prompt-cancel" class="btn">Cancel</button>
                </div>
            </div>
        </div>
        <div id="custom-confirm-modal" class="modal-backdrop" style="display: none;">
            <div class="modal-content">
                <p id="custom-confirm-message"></p>
                <div class="modal-buttons">
                    <button id="custom-confirm-yes" class="btn primary">Yes</button>
                    <button id="custom-confirm-no" class="btn">No</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
});

function showCustomPrompt(message, defaultValue, callback) {
    const modal = document.getElementById('custom-prompt-modal');
    const msgEl = document.getElementById('custom-prompt-message');
    const input = document.getElementById('custom-prompt-input');
    const okBtn = document.getElementById('custom-prompt-ok');
    const cancelBtn = document.getElementById('custom-prompt-cancel');
    
    msgEl.textContent = message;
    input.value = defaultValue;
    modal.style.display = 'flex';
    input.focus();
    input.select();

    const close = (value) => {
        modal.style.display = 'none';
        okBtn.onclick = null;
        cancelBtn.onclick = null;
        input.onkeydown = null;
        if (callback) callback(value);
    };

    okBtn.onclick = () => close(input.value);
    cancelBtn.onclick = () => close(null);
    input.onkeydown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            close(input.value);
        } else if (e.key === 'Escape') {
            close(null);
        }
    };
}

function showCustomConfirm(message, callback) {
    const modal = document.getElementById('custom-confirm-modal');
    const msgEl = document.getElementById('custom-confirm-message');
    const yesBtn = document.getElementById('custom-confirm-yes');
    const noBtn = document.getElementById('custom-confirm-no');

    msgEl.textContent = message;
    modal.style.display = 'flex';

    const close = (value) => {
        modal.style.display = 'none';
        yesBtn.onclick = null;
        noBtn.onclick = null;
        if (callback) callback(value);
    };

    yesBtn.onclick = () => close(true);
    noBtn.onclick = () => close(false);
}