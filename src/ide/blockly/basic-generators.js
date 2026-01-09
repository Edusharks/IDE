// src/ide/blockly/basic-generators.js

export function registerBasicGenerators(generator) {

    generator.ensureAiDataProcessor = function() {
        const functionName = 'process_ai_data';
        if (this.functionNames_[functionName]) return;
        this.definitions_['ai_event_handlers_list'] = 'ai_event_handlers = []';
        this.definitions_['import_sys'] = 'import sys';
        this.definitions_['import_ujson'] = 'import ujson as json';
        this.definitions_['import_uselect'] = 'import uselect';
        this.definitions_['ai_data_poller'] = 'poller = uselect.poll()\npoller.register(sys.stdin, uselect.POLLIN)';
        if (!this.definitions_['ai_data_dict']) this.definitions_['ai_data_dict'] = 'ai_data = {}';
        const func = `def ${functionName}():
    global ai_data
    if poller.poll(0):
        line = sys.stdin.readline()
        if line:
            line = line.strip()
            try:
                data = json.loads(line)
                if isinstance(data, dict):
                    ai_data = data
                    for handler in ai_event_handlers:
                        handler()
            except (ValueError, KeyError):
                pass`;
        this.functionNames_[functionName] = func;
    };

    generator.init = function(workspace) {
        Object.getPrototypeOf(this).init.call(this, workspace);
        this.connectionType = null;
        this.definitions_ = Object.create(null);
        this.functionNames_ = Object.create(null);
        this.aiEventHandlers = new Set();
        this.dashboardEventHandlers = {};
        this.definitions_['import_time'] = 'import time';
        this.isLiveMode = false;
        this.definitions_['mock_number'] = 'try:\n    from numbers import Number\nexcept ImportError:\n    Number = (int, float)';
    };

    generator.finish = function(code) { return code; };

    // Helper to check if a block is a valid start point
    function isValidRoot(block) {
        const type = block.type;
        return (
            type === 'on_start' ||
            type === 'forever' ||
            type === 'every_x_ms' ||
            type === 'procedures_defnoreturn' ||
            type === 'procedures_defreturn' ||
            type.startsWith('gpio_on_') ||
            type.startsWith('wifi_on_') ||
            type.startsWith('face_landmark_on_') ||
            type.startsWith('hand_gesture_on_') ||
            type.startsWith('image_classification_on_') ||
            type.startsWith('object_detection_on_') ||
            type.startsWith('custom_model_when_') ||
            type.startsWith('dashboard_on_') ||
            type.startsWith('dashboard_when_')
        );
    }

    generator.workspaceToCode = function(workspace) {
        this.init(workspace);

        const topBlocks = workspace.getTopBlocks(true); 
        
        for (const block of topBlocks) {
            if (block.isEnabled() && isValidRoot(block)) {
                this.blockToCode(block);
            }
        }
        
        const onStartBlock = topBlocks.find(b => b.type === 'on_start' && b.isEnabled());
        const foreverBlock = topBlocks.find(b => b.type === 'forever' && b.isEnabled());
        const everyXmsBlock = topBlocks.find(b => b.type === 'every_x_ms' && b.isEnabled());

        let setupCode = 'pass';
        if (onStartBlock) {
            const rawSetup = this.statementToCode(onStartBlock, 'DO') || 'pass';
            const lines = rawSetup.split('\n');
            const dedentedLines = lines.map(line => {
                if (line.startsWith(this.INDENT)) return line.substring(this.INDENT.length);
                return line;
            });
            setupCode = dedentedLines.join('\n').trim();
        }
        if (setupCode === '') setupCode = 'pass';

        let loopCode = 'pass\n';
        let loopDelay = 20;
        if (foreverBlock) {
            loopCode = this.statementToCode(foreverBlock, 'DO') || 'pass\n';
        } else if (everyXmsBlock) {
            loopCode = this.statementToCode(everyXmsBlock, 'DO') || 'pass\n';
            loopDelay = parseInt(everyXmsBlock.getFieldValue('TIME'), 10) || 500;
        }

        let definitions = Object.values(this.definitions_);
        definitions = [...new Set(definitions)];
        const functions = Object.values(this.functionNames_);
        
        let eventHandlerListCode = '';
        if (this.aiEventHandlers && this.aiEventHandlers.size > 0) {
            eventHandlerListCode += `ai_event_handlers = [${Array.from(this.aiEventHandlers).join(', ')}]\n`;
        }

        let dashboardRegistryCode = '_dashboard_event_registry = {}\n';
        if (this.dashboardEventHandlers && Object.keys(this.dashboardEventHandlers).length > 0) {
            dashboardRegistryCode = '_dashboard_event_registry = {\n';
            for (const [id, handlers] of Object.entries(this.dashboardEventHandlers)) {
                dashboardRegistryCode += `    '${id}': [${handlers.join(', ')}],\n`;
            }
            dashboardRegistryCode += '}\n';
        }
        
        const preamble = definitions.join('\n') + '\n\n' + functions.join('\n\n');
        const startupMessage = "print('--- Starting Program ---')\ntime.sleep(1)\n";
        const aiProcessorCode = this.functionNames_['process_ai_data'] ? this.INDENT + 'process_ai_data()\n' : '';
        
        const hasUserLoopCode = loopCode.trim() && loopCode.trim() !== 'pass';
        const hasPollingCode = !!aiProcessorCode;
        const needsKeepAlive = Object.values(this.functionNames_).some(func => func.includes('start_web_and_ws_server'));

        let mainLoopCode = '';
        if (hasUserLoopCode || hasPollingCode || needsKeepAlive) {
            const innerLoop = (hasUserLoopCode || hasPollingCode) ? `${aiProcessorCode}${loopCode}` : `${this.INDENT}pass`;
            mainLoopCode = `while True:\n${innerLoop}\n${this.INDENT}time.sleep_ms(${loopDelay})\n`;
        }

        const fullScriptForUpload = (preamble + '\n\n' + eventHandlerListCode + dashboardRegistryCode + '\n' + startupMessage + '# Code that runs once\n' + setupCode + '\n\n' + mainLoopCode).trim();
        
        const fullSetupCodeForSim = [
            preamble,
            eventHandlerListCode,
            dashboardRegistryCode,
            startupMessage,
            "# --- User's ON START code ---",
            setupCode
        ].join('\n\n');

        return {
            setupCode: fullSetupCodeForSim,
            loopCode: loopCode,
            fullScript: fullScriptForUpload,
            loopDelay: loopDelay
        };
    };

    // --- GENERATOR DEFINITIONS ---

    generator.forBlock['on_start'] = (b) => '';
    generator.forBlock['forever'] = (b) => ''; 
    generator.forBlock['every_x_ms'] = (b) => ''; 

    generator.forBlock['control_delay_seconds'] = (b) => {
        const sec = generator.valueToCode(b, 'DELAY_SEC', 0) || '1';
        return `time.sleep(float(${sec}))\n`; 
    };
    
    // ASYNC GENERATORS (Added)
    generator.forBlock['async_sleep_ms'] = function(block) {
        generator.definitions_['import_uasyncio'] = 'import uasyncio as asyncio';
        const ms = generator.valueToCode(block, 'MS', generator.ORDER_ATOMIC) || '100';
        return `await asyncio.sleep_ms(${ms})\n`;
    };

    generator.forBlock['async_run_main_loop'] = function(block) {
        return ''; // Handled by loop structure
    };

    generator.forBlock['math_map'] = (block) => {
        const value = generator.valueToCode(block, 'VALUE', generator.ORDER_NONE) || '0';
        const fromLow = generator.valueToCode(block, 'FROM_LOW', generator.ORDER_NONE) || '0';
        const fromHigh = generator.valueToCode(block, 'FROM_HIGH', generator.ORDER_NONE) || '1023';
        const toLow = generator.valueToCode(block, 'TO_LOW', generator.ORDER_NONE) || '0';
        const toHigh = generator.valueToCode(block, 'TO_HIGH', generator.ORDER_NONE) || '100';
    
        const functionName = 'math_map_func';
        if (!generator.functionNames_[functionName]) {
            const func = `
def ${functionName}(x, in_min, in_max, out_min, out_max):
    # Avoid division by zero
    if in_max - in_min == 0:
        return out_min
    # Use floating point division for accuracy, then convert to int
    return int((x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min)
`;
            generator.functionNames_[functionName] = func;
        }
        const code = `${functionName}(${value}, ${fromLow}, ${fromHigh}, ${toLow}, ${toHigh})`;
        return [code, generator.ORDER_FUNCTION_CALL];
    };
    
    generator.forBlock['math_round'] = function(block) {
        const value = generator.valueToCode(block, 'NUM', generator.ORDER_NONE) || '0';
        const code = `round(${value})`;
        return [code, generator.ORDER_FUNCTION_CALL];
    };

    generator.forBlock['text_parse_to_number'] = (b) => [`int(${generator.valueToCode(b, 'TEXT', 0) || '0'})`, 1];
    generator.forBlock['text_convert_to_text'] = (b) => [`str(${generator.valueToCode(b, 'VALUE', 0) || '""'})`, 1];
    generator.forBlock['text_from_char_code'] = (b) => [`chr(int(${generator.valueToCode(b, 'CODE', 0) || '0'}))`, 1];
    generator.forBlock['text_char_code_at'] = (b) => [`ord(${generator.valueToCode(b, 'TEXT', 4) || "''"}[int(${generator.valueToCode(b, 'AT', 0) || '0'})])`, 1];
    
    generator.forBlock['lists_get_random_item'] = (b) => { generator.definitions_['import_random']='import random'; return[`random.choice(${generator.valueToCode(b, 'LIST', 0) || '[]'})`, 1];};

    generator.forBlock['colour_from_hex'] = function(block) {
        const hex = generator.valueToCode(block, 'HEX', generator.ORDER_ATOMIC) || "'#000000'";
        const functionName = 'hex_to_rgb';
        if (!generator.functionNames_[functionName]) {
            const func = `
def ${functionName}(hex_color):
    hex_color = hex_color.lstrip('#')
    try: return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
    except (ValueError, IndexError): return (0, 0, 0)`;
            generator.functionNames_[functionName] = func;
        }
        return [`${functionName}(${hex})`, generator.ORDER_FUNCTION_CALL];
    };

    generator.forBlock['colour_get_component'] = function(block) {
        const component = block.getFieldValue('COMPONENT');
        const colour = generator.valueToCode(block, 'COLOUR', generator.ORDER_ATOMIC) || '(0,0,0)';
        return [`${colour}[${component}]`, generator.ORDER_MEMBER];
    };

    generator.forBlock['colour_rgb_value'] = function(block) {
        const red = generator.valueToCode(block, 'RED', generator.ORDER_ATOMIC) || '0';
        const green = generator.valueToCode(block, 'GREEN', generator.ORDER_ATOMIC) || '0';
        const blue = generator.valueToCode(block, 'BLUE', generator.ORDER_ATOMIC) || '0';
        const code = `(max(0, min(255, int(${red}))), max(0, min(255, int(${green}))), max(0, min(255, int(${blue}))))`;
        return [code, generator.ORDER_ATOMIC];
    };

    generator.forBlock['colour_hsv_sliders_picker'] = function(block) {
        const code = generator.quote_(block.getFieldValue('COLOUR'));
        return [code, generator.ORDER_ATOMIC];
    };





    // ID injection helper (preserved)
    const originalBlockToCode = generator.blockToCode;
    generator.blockToCode = function(block) {
        if (!block) return '';
        const code = originalBlockToCode.call(this, block);
        if (block.id && Array.isArray(code) === false && typeof code === 'string' && code.includes('\n')) {
            return `# block_id=${block.id}\n${code}`;
        }
        return code;
    };
}