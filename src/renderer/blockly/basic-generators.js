// src/renderer/blockly/basic-generators.js
const micropythonGenerator = Blockly.Python;

function ensureAiDataProcessor() {
    const functionName = 'process_ai_data';
    if (micropythonGenerator.functionNames_[functionName]) {
        return;
    }
    micropythonGenerator.definitions_['import_sys'] = 'import sys';
    micropythonGenerator.definitions_['import_ujson'] = 'import ujson as json';
    micropythonGenerator.definitions_['import_uselect'] = 'import uselect';
    micropythonGenerator.definitions_['ai_data_poller'] = 'poller = uselect.poll()\npoller.register(sys.stdin, uselect.POLLIN)';
    if (!micropythonGenerator.definitions_['ai_data_dict']) {
        micropythonGenerator.definitions_['ai_data_dict'] = 'ai_data = {}';
    }
    const func = `
def ${functionName}():
    global ai_data
    if poller.poll(0):
        line = sys.stdin.readline()
        if line:
            line = line.strip()
            try:
                data = json.loads(line)
                if isinstance(data, dict):
                    ai_data = data
                    # Call all registered event handlers
                    for handler in ai_event_handlers:
                        handler()
            except (ValueError, KeyError) as e:
                pass
`;
    micropythonGenerator.functionNames_[functionName] = func;
}

micropythonGenerator.init = function(workspace) {
    Object.getPrototypeOf(this).init.call(this, workspace);
    this.definitions_ = Object.create(null);
    this.functionNames_ = Object.create(null);
    this.aiEventHandlers = new Set();
    this.dashboardEventHandlers = {};
    this.definitions_['import_time'] = 'import time';
    this.isLiveMode = false;
};

micropythonGenerator.finish = function(code) {
    return code;
};


micropythonGenerator.workspaceToCode = function(workspace) {
    this.init(workspace); 
    const allBlocks = workspace.getAllBlocks(false);

    for (const block of allBlocks) {
        delete block.generatedFuncName;
    }

    for (const block of allBlocks) {
        if (block.isEnabled()) {
            this.blockToCode(block);
        }
    }

    const topBlocks = workspace.getTopBlocks(true);
    const onStartBlock = topBlocks.find(b => b.type === 'on_start');
    const foreverBlock = topBlocks.find(b => b.type === 'forever');
    const everyXmsBlock = topBlocks.find(b => b.type === 'every_x_ms');
    const otherSetupBlocks = topBlocks.filter(b => !['on_start', 'forever', 'every_x_ms'].includes(b.type));

    let setupCode = '';
    if (onStartBlock) {
        let firstBlock = onStartBlock.getInput('DO').connection.targetBlock();
        setupCode = this.blockToCode(firstBlock) || '';
    }
    setupCode += otherSetupBlocks.map(block => this.blockToCode(block)).join('\n');
    setupCode = setupCode.trim() || 'pass';
    
    let loopCode = '';
    if (foreverBlock) {
        loopCode = this.statementToCode(foreverBlock, 'DO') || this.INDENT + 'pass\n';
    } else if (everyXmsBlock) {
        loopCode = this.statementToCode(everyXmsBlock, 'DO') || this.INDENT + 'pass\n';
    }
    const everyXmsDelay = everyXmsBlock ? everyXmsBlock.getFieldValue('TIME') || '500' : '500';

    if (this.aiEventHandlers.size > 0) {
        this.definitions_['ai_event_handlers_list'] = `ai_event_handlers = [${Array.from(this.aiEventHandlers).join(', ')}]`;
    }

let dashboardPollingCode = '';
if (this.dashboardEventHandlers && Object.keys(this.dashboardEventHandlers).length > 0) {
    this.definitions_['dashboard_prev_state'] = '_dashboard_prev_state = {}';

    const handlerChecks = Object.entries(this.dashboardEventHandlers).map(([id, funcNameList]) => {
        const uniqueFuncNames = [...new Set(Array.isArray(funcNameList) ? funcNameList : [funcNameList])];
        
        const calls = uniqueFuncNames.map(funcName => `${this.INDENT}${this.INDENT}${funcName}()`).join('\n');
        
        return [
            `${this.INDENT}# Polling for component: ${id}`,
            `${this.INDENT}current_val_${id} = _dashboard_state.get('${id}')`,
            `${this.INDENT}prev_val_${id} = _dashboard_prev_state.get('${id}')`,
            `${this.INDENT}if current_val_${id} is not None and current_val_${id} != prev_val_${id}:`,
            calls,
            `${this.INDENT}${this.INDENT}_dashboard_prev_state['${id}'] = current_val_${id}`
        ].join('\n');
    }).join('\n');

    const pollingFuncName = 'poll_dashboard_events';
    this.functionNames_[pollingFuncName] = `def ${pollingFuncName}():\n${this.INDENT}global _dashboard_prev_state\n${handlerChecks}`;
    dashboardPollingCode = `${this.INDENT}${pollingFuncName}()\n`;
}

    let definitions = Object.values(this.definitions_);
    definitions = definitions.filter((def, i) => definitions.indexOf(def) === i); 
    const functions = Object.values(this.functionNames_);
    
    const preamble = definitions.join('\n') + '\n\n' + functions.join('\n\n');
    const startupMessage = "print('--- Starting Program ---')\ntime.sleep(1)\n";
    
    let finalCode = preamble + '\n\n' + startupMessage + '# Code that runs once at the start\n' + setupCode;
    finalCode += '\n\n# Main loop that runs forever\n';
    
    const aiProcessorCode = this.functionNames_['process_ai_data'] ? this.INDENT + 'process_ai_data()\n' : '';
    let mainLoopCode = '';
    const hasUserLoopCode = loopCode.trim() && loopCode.trim() !== 'pass';
    const hasPollingCode = aiProcessorCode || dashboardPollingCode;

    if (hasUserLoopCode || hasPollingCode) {
        const sleepTime = everyXmsBlock ? `int(${everyXmsDelay})` : 20;
        mainLoopCode = `while True:\n${aiProcessorCode}${dashboardPollingCode}${loopCode}${this.INDENT}time.sleep_ms(${sleepTime})\n`;
    } else {
        mainLoopCode = `while True:\n${this.INDENT}time.sleep_ms(20)\n`;
    }

    finalCode += mainLoopCode;
    return finalCode.trim();
};


micropythonGenerator.forBlock['on_start'] = (b) => '';
micropythonGenerator.forBlock['forever'] = (b) => ''; 
micropythonGenerator.forBlock['every_x_ms'] = (b) => ''; 

micropythonGenerator.forBlock['control_delay_seconds'] = (b) => `time.sleep(float(${micropythonGenerator.valueToCode(b, 'DELAY_SEC', 0) || '1'}))\n`;
micropythonGenerator.forBlock['math_map'] = (b) => { const v=micropythonGenerator.valueToCode; const fN='math_map_func'; if(!micropythonGenerator.functionNames_[fN]){micropythonGenerator.functionNames_[fN]=`def ${fN}(x,i,a,o,u):\n    return (x-i)*(u-o)//(a-i)+o`} return[`${fN}(${v(b,'VALUE',0)},${v(b,'FROM_LOW',0)},${v(b,'FROM_HIGH',0)},${v(b,'TO_LOW',0)},${v(b,'TO_HIGH',0)})`,1];};
micropythonGenerator.forBlock['text_parse_to_number'] = (b) => [`int(${micropythonGenerator.valueToCode(b, 'TEXT', 0) || '0'})`, 1];
micropythonGenerator.forBlock['text_convert_to_text'] = (b) => [`str(${micropythonGenerator.valueToCode(b, 'VALUE', 0) || '""'})`, 1];
micropythonGenerator.forBlock['text_from_char_code'] = (b) => [`chr(int(${micropythonGenerator.valueToCode(b, 'CODE', 0) || '0'}))`, 1];
micropythonGenerator.forBlock['text_char_code_at'] = (b) => [`ord(${micropythonGenerator.valueToCode(b, 'TEXT', 4) || "''"}[int(${micropythonGenerator.valueToCode(b, 'AT', 0) || '0'})])`, 1];
micropythonGenerator.forBlock['lists_get_random_item'] = (b) => { micropythonGenerator.definitions_['import_random']='import random'; return[`random.choice(${micropythonGenerator.valueToCode(b, 'LIST', 0) || '[]'})`, 1];};
micropythonGenerator.forBlock['colour_from_hex'] = function(block) {
    const hex = micropythonGenerator.valueToCode(block, 'HEX', micropythonGenerator.ORDER_ATOMIC) || "'#000000'";
    const functionName = 'hex_to_rgb';
    if (!micropythonGenerator.functionNames_[functionName]) {
        const func = `
def ${functionName}(hex_color):
    hex_color = hex_color.lstrip('#')
    try: return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
    except (ValueError, IndexError): return (0, 0, 0)`;
        micropythonGenerator.functionNames_[functionName] = func;
    }
    return [`${functionName}(${hex})`, micropythonGenerator.ORDER_FUNCTION_CALL];
};
micropythonGenerator.forBlock['colour_blend'] = function(block) {
    const c1 = micropythonGenerator.valueToCode(block, 'COLOUR1', micropythonGenerator.ORDER_ATOMIC) || '(0,0,0)';
    const c2 = micropythonGenerator.valueToCode(block, 'COLOUR2', micropythonGenerator.ORDER_ATOMIC) || '(255,255,255)';
    const ratio = micropythonGenerator.valueToCode(block, 'RATIO', micropythonGenerator.ORDER_ATOMIC) || '0.5';
    const functionName = 'blend_colors';
    if (!micropythonGenerator.functionNames_[functionName]) {
        const func = `
def ${functionName}(c1, c2, ratio):
    ratio = max(0, min(1, ratio))
    r = int(c1[0] * (1 - ratio) + c2[0] * ratio)
    g = int(c1[1] * (1 - ratio) + c2[1] * ratio)
    b = int(c1[2] * (1 - ratio) + c2[2] * ratio)
    return (r, g, b)`;
        micropythonGenerator.functionNames_[functionName] = func;
    }
    return [`${functionName}(${c1}, ${c2}, ${ratio})`, micropythonGenerator.ORDER_FUNCTION_CALL];
};
micropythonGenerator.forBlock['colour_get_component'] = function(block) {
    const component = block.getFieldValue('COMPONENT');
    const colour = micropythonGenerator.valueToCode(block, 'COLOUR', micropythonGenerator.ORDER_ATOMIC) || '(0,0,0)';
    return [`${colour}[${component}]`, micropythonGenerator.ORDER_MEMBER];
};

micropythonGenerator.forBlock['colour_rgb_value'] = function(block) {
    const red = micropythonGenerator.valueToCode(block, 'RED', micropythonGenerator.ORDER_ATOMIC) || '0';
    const green = micropythonGenerator.valueToCode(block, 'GREEN', micropythonGenerator.ORDER_ATOMIC) || '0';
    const blue = micropythonGenerator.valueToCode(block, 'BLUE', micropythonGenerator.ORDER_ATOMIC) || '0';
    
    // Rationale: We create a robust tuple, ensuring values are integers and clamped between 0-255.
    const code = `(max(0, min(255, int(${red}))), max(0, min(255, int(${green}))), max(0, min(255, int(${blue}))))`;
    
    return [code, micropythonGenerator.ORDER_ATOMIC];
};