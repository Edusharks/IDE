'use strict';

class FieldPinSelector extends Blockly.Field {
    constructor(pinType = 'digital', options) {
        super(Blockly.Field.SKIP_SETUP); // We'll do our own setup
        this.pinType = pinType;
        this.SERIALIZABLE = true;
    }

    initView() {
        this.size_ = new Blockly.utils.Size(40, 25); // Set a default size
        this.textElement_ = Blockly.utils.dom.createSvgElement('text', {
            'class': 'blocklyText',
            'y': this.size_.height / 2,
            'dominant-baseline': 'middle'
        }, this.fieldGroup_);

        this.box_ = Blockly.utils.dom.createSvgElement('rect', {
            'class': 'blocklyFieldRect',
            'rx': 4, 'ry': 4,
            'x': 0, 'y': 0,
            'width': this.size_.width,
            'height': this.size_.height,
        }, this.fieldGroup_, true);
    }

    showEditor_() {
        // This is where the magic happens - we show our custom modal
        const ide = window.esp32IDE;
        if (!ide) return;

        showPinSelectorModal(ide.boardId, this.pinType, (selectedPin) => {
            if (selectedPin !== null) {
                this.setValue(selectedPin);
            }
        });
    }

    // fromJson is used to instantiate the field from block definitions
    static fromJson(options) {
        return new FieldPinSelector(options['pinType']);
    }
}

// Register the custom field with Blockly
Blockly.fieldRegistry.register('field_pin_selector', FieldPinSelector);