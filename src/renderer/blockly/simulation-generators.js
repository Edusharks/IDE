// src/renderer/blockly/simulation-generators.js
'use strict';

const js = Blockly.JavaScript;
const val = (b, n) => js.valueToCode(b, n, js.ORDER_ATOMIC);
const statement = (b, n) => js.statementToCode(b, n);
const field = (b, n) => b.getFieldValue(n);
const varField = (b, n) => js.nameDB_.getName(b.getFieldValue(n), Blockly.VARIABLE_CATEGORY_NAME);

// --- UTILITY ---
const getSensingMenuValue = (block, fieldName) => `'${block.getFieldValue(fieldName)}'`;

// --- EVENTS GENERATORS ---
js.forBlock['event_when_green_flag_clicked'] = (b) => `runtime.registerGreenFlagScript(async () => {\n${statement(b, 'DO')}});\n`;
js.forBlock['event_when_key_pressed'] = (b) => { const key = field(b, 'KEY_OPTION'); return `runtime.registerKeyPressScript('${key.toLowerCase()}', async () => {\n${statement(b, 'DO')}});\n`; };
js.forBlock['event_when_this_sprite_clicked'] = (b) => `runtime.registerSpriteClickScript(this.target.id, async () => {\n${statement(b, 'DO')}});\n`;
js.forBlock['event_when_backdrop_switches'] = (b) => `runtime.registerBackdropSwitchReceiver(${val(b, 'BACKDROP')}, async () => {\n${statement(b, 'DO')}});\n`;
js.forBlock['event_when_broadcast_received'] = (b) => { const msg = js.nameDB_.getName(b.getFieldValue('BROADCAST_OPTION'), Blockly.VARIABLE_CATEGORY_NAME); return `runtime.registerBroadcastReceiver('${msg}', async () => {\n${statement(b, 'DO')}});\n`; };
js.forBlock['event_broadcast'] = (b) => `await runtime.broadcast(${val(b, 'BROADCAST_INPUT') || '""'});\n`;
js.forBlock['event_broadcast_and_wait'] = (b) => `await runtime.broadcastAndWait(${val(b, 'BROADCAST_INPUT') || '""'});\n`;

// --- MOTION GENERATORS ---
js.forBlock['motion_move_steps'] = (b) => `await runtime.move(this.target, ${val(b, 'STEPS') || 10});\n`;
js.forBlock['motion_turn_right'] = (b) => `await runtime.turn(this.target, ${val(b, 'DEGREES') || 15});\n`;
js.forBlock['motion_turn_left'] = (b) => `await runtime.turn(this.target, -${val(b, 'DEGREES') || 15});\n`;
js.forBlock['motion_go_to_xy'] = (b) => `await runtime.goTo(this.target, ${val(b, 'X') || 0}, ${val(b, 'Y') || 0});\n`;
js.forBlock['motion_point_in_direction'] = (b) => `await runtime.pointInDirection(this.target, ${val(b, 'DIRECTION') || 90});\n`;
js.forBlock['motion_change_x_by'] = (b) => `await runtime.changeXBy(this.target, ${val(b, 'DX') || 10});\n`;
js.forBlock['motion_set_x_to'] = (b) => `await runtime.setXTo(this.target, ${val(b, 'X') || 0});\n`;
js.forBlock['motion_change_y_by'] = (b) => `await runtime.changeYBy(this.target, ${val(b, 'DY') || 10});\n`;
js.forBlock['motion_set_y_to'] = (b) => `await runtime.setYTo(this.target, ${val(b, 'Y') || 0});\n`;
js.forBlock['motion_set_rotation_style'] = (b) => `await runtime.setRotationStyle(this.target, '${field(b, 'STYLE')}');\n`;
js.forBlock['motion_go_to_layer'] = (b) => `await runtime.goToLayer(this.target, '${field(b, 'LAYER')}');\n`;
js.forBlock['motion_go_layer_by'] = (b) => `await runtime.goLayerBy(this.target, '${field(b, 'DIRECTION')}', ${val(b, 'NUM') || 1});\n`;

// --- LOOKS GENERATORS ---
js.forBlock['looks_say_for_seconds'] = (b) => `await runtime.sayForSeconds(this.target, ${val(b, 'MESSAGE') || '""'}, ${val(b, 'SECS') || 2});\n`;
js.forBlock['looks_say'] = (b) => `await runtime.say(this.target, ${val(b, 'MESSAGE') || '""'});\n`;
js.forBlock['looks_think_for_seconds'] = (b) => `await runtime.thinkForSeconds(this.target, ${val(b, 'MESSAGE') || '""'}, ${val(b, 'SECS') || 2});\n`;
js.forBlock['looks_think'] = (b) => `await runtime.think(this.target, ${val(b, 'MESSAGE') || '""'});\n`;
js.forBlock['looks_switch_costume_to'] = (b) => `await runtime.switchCostumeTo(this.target, ${val(b, 'COSTUME') || '""'});\n`;
js.forBlock['looks_next_costume'] = () => `await runtime.nextCostume(this.target);\n`;
js.forBlock['looks_switch_backdrop_to'] = (b) => `await runtime.switchBackdropTo(${val(b, 'BACKDROP') || '""'});\n`;
js.forBlock['looks_next_backdrop'] = () => `await runtime.nextBackdrop();\n`;
js.forBlock['looks_costume_number_name'] = (b) => [`runtime.getCostumeInfo(this.target, '${field(b, 'NUMBER_NAME')}')`, js.ORDER_FUNCTION_CALL];
js.forBlock['looks_backdrop_number_name'] = (b) => [`runtime.getBackdropInfo('${field(b, 'NUMBER_NAME')}')`, js.ORDER_FUNCTION_CALL];
js.forBlock['looks_show'] = () => `await runtime.show(this.target);\n`;
js.forBlock['looks_hide'] = () => `await runtime.hide(this.target);\n`;
js.forBlock['looks_change_size_by'] = (b) => `await runtime.changeSizeBy(this.target, ${val(b, 'CHANGE') || 10});\n`;
js.forBlock['looks_set_size_to'] = (b) => `await runtime.setSizeTo(this.target, ${val(b, 'SIZE') || 100});\n`;
js.forBlock['looks_change_effect_by'] = (b) => `await runtime.changeEffectBy(this.target, '${field(b, 'EFFECT')}', ${val(b, 'CHANGE') || 25});\n`;
js.forBlock['looks_set_effect_to'] = (b) => `await runtime.setEffectTo(this.target, '${field(b, 'EFFECT')}', ${val(b, 'VALUE') || 0});\n`;
js.forBlock['looks_clear_graphic_effects'] = () => `await runtime.clearGraphicEffects(this.target);\n`;

// --- SOUND GENERATORS ---
js.forBlock['sound_play_until_done'] = (b) => `await runtime.playSound('${field(b, 'SOUND')}');\n`;
js.forBlock['sound_start_sound'] = (b) => `await runtime.startSound('${field(b, 'SOUND')}');\n`;
js.forBlock['sound_stop_all_sounds'] = () => `await runtime.stopAllSounds();\n`;

// --- CONTROL GENERATORS ---
js.forBlock['control_wait'] = (b) => `await runtime.wait(${val(b, 'DURATION') || 1});\n`;
js.forBlock['controls_forever'] = (b) => `while (!runtime.getStopFlag()) {\n${statement(b, 'DO')}\n await runtime.wait(0.01);\n}\n`;
js.forBlock['control_stop'] = () => `return;\n`;
js.forBlock['control_when_i_start_as_a_clone'] = (b) => `runtime.registerCloneStartScript(this.target.id, async () => {\n${statement(b, 'DO')}});\n`;
js.forBlock['control_create_clone_of'] = (b) => {
    let cloneTarget = val(b, 'CLONE_OPTION') || "'_myself_'";
    if (cloneTarget === "'_myself_'") {
        cloneTarget = "'_myself_'"; // Keep it as the special string
    }
    return `await runtime.createCloneOf(this.target, ${cloneTarget});\n`;
};
js.forBlock['control_delete_this_clone'] = () => `await runtime.deleteThisClone(this.target);\n`;

// --- SENSING GENERATORS ---
js.forBlock['sensing_touching'] = (b) => [`runtime.isTouching(this.target, ${val(b, 'TOUCHINGOBJECTMENU') || '""'})`, js.ORDER_FUNCTION_CALL];
js.forBlock['sensing_touchingobjectmenu'] = (b) => [getSensingMenuValue(b, 'TOUCHINGOBJECTMENU'), js.ORDER_ATOMIC];
js.forBlock['sensing_distance_to'] = (b) => [`runtime.distanceTo(this.target, ${val(b, 'DISTANCETOMENU') || '""'})`, js.ORDER_FUNCTION_CALL];
js.forBlock['sensing_distancetomenu'] = (b) => [getSensingMenuValue(b, 'DISTANCETOMENU'), js.ORDER_ATOMIC];
js.forBlock['sensing_ask_and_wait'] = (b) => `await runtime.ask(${val(b, 'QUESTION') || '"What is your name?"'});\n`;
js.forBlock['sensing_answer'] = () => ['runtime.getAnswer()', js.ORDER_FUNCTION_CALL];
js.forBlock['sensing_key_pressed'] = (b) => [`runtime.isKeyPressed(${val(b, 'KEY_OPTION') || '""'})`, js.ORDER_FUNCTION_CALL];
js.forBlock['sensing_keyoptions'] = (b) => [getSensingMenuValue(b, 'KEY_OPTION'), js.ORDER_ATOMIC];
js.forBlock['sensing_mouse_x'] = () => ['runtime.getMouseX()', js.ORDER_FUNCTION_CALL];
js.forBlock['sensing_mouse_y'] = () => ['runtime.getMouseY()', js.ORDER_FUNCTION_CALL];
js.forBlock['sensing_mouse_down'] = () => ['runtime.getIsMouseDown()', js.ORDER_FUNCTION_CALL];
js.forBlock['sensing_timer'] = () => ['runtime.getTimer()', js.ORDER_FUNCTION_CALL];
js.forBlock['sensing_resettimer'] = () => `await runtime.resetTimer();\n`;

// --- OPERATORS GENERATORS ---
js.forBlock['operator_add'] = (b) => [`${val(b, 'NUM1') || 0} + ${val(b, 'NUM2') || 0}`, js.ORDER_ADDITION];
js.forBlock['operator_subtract'] = (b) => [`${val(b, 'NUM1') || 0} - ${val(b, 'NUM2') || 0}`, js.ORDER_SUBTRACTION];
js.forBlock['operator_multiply'] = (b) => [`${val(b, 'NUM1') || 0} * ${val(b, 'NUM2') || 0}`, js.ORDER_MULTIPLICATION];
js.forBlock['operator_divide'] = (b) => [`${val(b, 'NUM1') || 0} / ${val(b, 'NUM2') || 0}`, js.ORDER_DIVISION];
js.forBlock['operator_random'] = (b) => [`runtime.pickRandom(${val(b, 'FROM') || 1}, ${val(b, 'TO') || 10})`, js.ORDER_FUNCTION_CALL];
js.forBlock['operator_lt'] = (b) => [`${val(b, 'OPERAND1') || 0} < ${val(b, 'OPERAND2') || 0}`, js.ORDER_RELATIONAL];
js.forBlock['operator_equals'] = (b) => [`${val(b, 'OPERAND1') || 0} == ${val(b, 'OPERAND2') || 0}`, js.ORDER_EQUALITY];
js.forBlock['operator_gt'] = (b) => [`${val(b, 'OPERAND1') || 0} > ${val(b, 'OPERAND2') || 0}`, js.ORDER_RELATIONAL];
js.forBlock['operator_and'] = (b) => [`${val(b, 'OPERAND1') || false} && ${val(b, 'OPERAND2') || false}`, js.ORDER_LOGICAL_AND];
js.forBlock['operator_or'] = (b) => [`${val(b, 'OPERAND1') || false} || ${val(b, 'OPERAND2') || false}`, js.ORDER_LOGICAL_OR];
js.forBlock['operator_not'] = (b) => [`!${val(b, 'OPERAND') || false}`, js.ORDER_LOGICAL_NOT];
js.forBlock['operator_join'] = (b) => [`String(${val(b, 'STRING1') || '""'}) + String(${val(b, 'STRING2') || '""'})`, js.ORDER_ADDITION];
js.forBlock['operator_letter_of'] = (b) => [`(String(${val(b, 'STRING') || '""'})[${val(b, 'LETTER') || 1} - 1] || '')`, js.ORDER_FUNCTION_CALL];
js.forBlock['operator_length'] = (b) => [`String(${val(b, 'STRING') || '""'}).length`, js.ORDER_MEMBER];
js.forBlock['operator_contains'] = (b) => [`String(${val(b, 'STRING1') || '""'}).includes(String(${val(b, 'STRING2') || '""'}))`, js.ORDER_MEMBER];
js.forBlock['operator_mod'] = (b) => [`${val(b, 'NUM1') || 0} % ${val(b, 'NUM2') || 0}`, js.ORDER_MODULUS];
js.forBlock['operator_round'] = (b) => [`Math.round(${val(b, 'NUM') || 0})`, js.ORDER_FUNCTION_CALL];
js.forBlock['operator_mathop'] = (b) => [`Math.${field(b, 'OPERATOR').toLowerCase()}(${val(b, 'NUM') || 0})`, js.ORDER_FUNCTION_CALL];

// --- VARIABLES & LISTS GENERATORS ---
js.forBlock['variables_set'] = (b) => {
    const variable = b.workspace.getVariableMap().getVariableById(b.getFieldValue('VAR'));
    const isLocal = variable.type === 'local';
    const varName = varField(b, 'VAR');
    const value = val(b, 'VALUE') || 0;
    return `runtime.setVariable('${varName}', ${value}, ${isLocal}, this.target);\n`;
};
js.forBlock['variables_get'] = (b) => {
    const variable = b.workspace.getVariableMap().getVariableById(b.getFieldValue('VAR'));
    const isLocal = variable.type === 'local';
    const varName = varField(b, 'VAR');
    return [`runtime.getVariable('${varName}', ${isLocal}, this.target)`, js.ORDER_FUNCTION_CALL];
};
js.forBlock['math_change'] = (b) => {
    const variable = b.workspace.getVariableMap().getVariableById(b.getFieldValue('VAR'));
    const isLocal = variable.type === 'local';
    const varName = varField(b, 'VAR');
    const delta = val(b, 'DELTA') || 1;
    return `runtime.changeVariableBy('${varName}', ${delta}, ${isLocal}, this.target);\n`;
};
js.forBlock['lists_add_to'] = (b) => `runtime.addToList('${varField(b, 'LIST')}', ${val(b, 'ITEM') || '""'});\n`;
js.forBlock['lists_delete_of'] = (b) => `runtime.deleteOfList('${varField(b, 'LIST')}', ${val(b, 'INDEX') || 1});\n`;
js.forBlock['lists_delete_all_of'] = (b) => `runtime.deleteAllOfList('${varField(b, 'LIST')}');\n`;
js.forBlock['lists_insert_at'] = (b) => `runtime.insertAtList('${varField(b, 'LIST')}', ${val(b, 'INDEX') || 1}, ${val(b, 'ITEM') || '""'});\n`;
js.forBlock['lists_replace_item_of'] = (b) => `runtime.replaceItemOfList('${varField(b, 'LIST')}', ${val(b, 'INDEX') || 1}, ${val(b, 'ITEM') || '""'});\n`;
js.forBlock['lists_item_of'] = (b) => [`runtime.getItemOfList('${varField(b, 'LIST')}', ${val(b, 'INDEX') || 1})`, js.ORDER_FUNCTION_CALL];
js.forBlock['lists_item_num_of'] = (b) => [`runtime.getIndexOfItemInList('${varField(b, 'LIST')}', ${val(b, 'ITEM') || '""'})`, js.ORDER_FUNCTION_CALL];
js.forBlock['lists_length'] = (b) => [`runtime.getLengthOfList('${varField(b, 'LIST')}')`, js.ORDER_FUNCTION_CALL];
js.forBlock['lists_contains'] = (b) => [`runtime.listContainsItem('${varField(b, 'LIST')}', ${val(b, 'ITEM') || '""'})`, js.ORDER_FUNCTION_CALL];

// --- PEN GENERATORS ---
js.forBlock['pen_clear'] = () => `await runtime.clearPen();\n`;
js.forBlock['pen_pen_down'] = () => `await runtime.penDown(this.target);\n`;
js.forBlock['pen_pen_up'] = () => `await runtime.penUp(this.target);\n`;
js.forBlock['pen_set_pen_color_to_color'] = (b) => `await runtime.setPenColor(this.target, '${field(b, 'COLOR')}');\n`;
js.forBlock['pen_change_pen_size_by'] = (b) => `await runtime.changePenSizeBy(this.target, ${val(b, 'SIZE') || 1});\n`;
js.forBlock['pen_set_pen_size_to'] = (b) => `await runtime.setPenSizeTo(this.target, ${val(b, 'SIZE') || 1});\n`;

// --- SPEAK -----
js.forBlock['tts_speak'] = (b) => `await runtime.speak(${val(b, 'TEXT') || '""'});\n`;
js.forBlock['tts_set_voice'] = (b) => `await runtime.setVoice(${val(b, 'VOICE') || '""'});\n`;
js.forBlock['tts_get_voice'] = (b) => [`runtime.getCurrentVoice()`, js.ORDER_FUNCTION_CALL];

//--- Video Sensing ----
js.forBlock['video_turn_on_off'] = (b) => `await runtime.${field(b, 'STATE') === 'ON' ? 'turnVideoOn' : 'turnVideoOff'}();\n`;
js.forBlock['video_motion'] = () => [`runtime.getVideoMotion()`, js.ORDER_FUNCTION_CALL];

// --- FACE DETECTION GENERATORS ---
js.forBlock['face_detection_num_faces'] = () => [`runtime.getNumberOfFaces()`, js.ORDER_FUNCTION_CALL];
js.forBlock['face_detection_property'] = (b) => [`runtime.getFaceProperty('${field(b, 'PROP')}', ${val(b, 'INDEX') || 1})`, js.ORDER_FUNCTION_CALL];

js.forBlock['face_is_smiling'] = (b) => [`runtime.isSmiling(${val(b, 'INDEX') || 1})`, js.ORDER_FUNCTION_CALL];
js.forBlock['face_is_eye_open'] = (b) => [`runtime.isEyeOpen(${val(b, 'INDEX') || 1}, '${field(b, 'SIDE')}')`, js.ORDER_FUNCTION_CALL];
// Special logic for mouth smile, as it combines two blendshapes
js.forBlock['face_expression_amount'] = (b) => {
    const expr = field(b, 'EXPRESSION');
    if (expr === 'mouthSmile') {
        return [`(runtime.getFaceExpression(${val(b, 'INDEX') || 1}, 'mouthSmileLeft') + runtime.getFaceExpression(${val(b, 'INDEX') || 1}, 'mouthSmileRight')) / 2`, js.ORDER_FUNCTION_CALL];
    }
    return [`runtime.getFaceExpression(${val(b, 'INDEX') || 1}, '${expr}')`, js.ORDER_FUNCTION_CALL];
};