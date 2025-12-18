// src/ide/blockly/wifi_generators.js

export function registerWifiGenerators(generator) {

    // --- 1. Wi-Fi Connection ---
    
    generator.forBlock['wifi_connect'] = function(block) {
        const ssid = generator.valueToCode(block, 'SSID', 0) || '""';
        const password = generator.valueToCode(block, 'PASSWORD', 0) || '""';
        
        generator.definitions_['import_network'] = 'import network';
        generator.definitions_['import_time'] = 'import time';

        // Global WLAN object to check status later
        generator.definitions_['wlan_global'] = '_wlan = None';

        const funcName = 'connect_to_wifi';
        if (!generator.functionNames_[funcName]) {
            generator.functionNames_[funcName] = `
def ${funcName}(ssid, password):
    global _wlan
    _wlan = network.WLAN(network.STA_IF)
    _wlan.active(True)
    if _wlan.isconnected():
        return True
    print('Connecting to Wi-Fi...')
    _wlan.connect(ssid, password)
    # Wait for connection with timeout
    for _ in range(15):
        if _wlan.isconnected():
            break
        print('.')
        time.sleep(1)
    
    if _wlan.isconnected():
        print('Connected! IP:', _wlan.ifconfig()[0])
        return True
    else:
        print('Connection failed.')
        return False
`;
        }
        return `${funcName}(${ssid}, ${password})\n`;
    };

    generator.forBlock['wifi_is_connected'] = function(block) {
        // Safe check
        return ['(_wlan is not None and _wlan.isconnected())', generator.ORDER_CONDITIONAL];
    };

    generator.forBlock['wifi_get_ip'] = function(block) {
        return ["(_wlan.ifconfig()[0] if (_wlan and _wlan.isconnected()) else '0.0.0.0')", generator.ORDER_CONDITIONAL];
    };

    // --- 2. HTTP Client ---

    generator.forBlock['http_get_json'] = function(block) { 
        generator.definitions_['import_urequests'] = 'import urequests';
        generator.definitions_['import_ujson'] = 'import ujson';
        const url = generator.valueToCode(block, 'URL', 0) || "''";
        
        // One-liner safe fetch
        const code = `(ujson.loads(urequests.get(${url}).text) if (_wlan and _wlan.isconnected()) else {})`;
        return [code, generator.ORDER_FUNCTION_CALL];
    };

    generator.forBlock['json_get_key'] = function(block) {
        const json = generator.valueToCode(block, 'JSON', 0) || "{}";
        const key = generator.valueToCode(block, 'KEY', 0) || "''";
        return [`${json}.get(${key}, '')`, generator.ORDER_FUNCTION_CALL];
    };

    generator.forBlock['http_post_json'] = function(block) {
        generator.definitions_['import_urequests'] = 'import urequests';
        const url = generator.valueToCode(block, 'URL', 0) || '""';
        
        // Construct Python dict from inputs
        let data_dict = [];
        const v1 = generator.valueToCode(block, 'VALUE1', 0);
        const v2 = generator.valueToCode(block, 'VALUE2', 0);
        const v3 = generator.valueToCode(block, 'VALUE3', 0);

        if(v1 && v1 !== "''") data_dict.push(`"value1": ${v1}`);
        if(v2 && v2 !== "''") data_dict.push(`"value2": ${v2}`);
        if(v3 && v3 !== "''") data_dict.push(`"value3": ${v3}`);

        return `if _wlan and _wlan.isconnected():\n  try:\n    urequests.post(${url}, json={${data_dict.join(', ')}})\n  except Exception as e:\n    print("HTTP POST Error:", e)\n`;
    };

    // --- 3. Web Server (The Complex Part) ---

    generator.forBlock['wifi_start_web_server'] = function(block) {
        // Imports required for the server
        generator.definitions_['import_socket'] = 'import socket';
        generator.definitions_['import_thread'] = 'import _thread';
        generator.definitions_['import_ujson_ws'] = 'import ujson';
        generator.definitions_['import_ws_server'] = 'import websocket_server'; 

        // Global state variables
        generator.definitions_['web_server_globals'] = `
# --- Web Server & WebSocket Globals ---
_ws_clients = []
_dashboard_state = {}
_web_request_handler = None
_web_html_content = "<h1>Server Running</h1><p>Use blocks to define content.</p>"
`;

        const funcName = 'start_web_and_ws_server';
        
        if (!generator.functionNames_[funcName]) {
            
            // 1. Helper for WebSocket Messages
            generator.functionNames_['ws_helpers'] = `
def _ws_callback(client, msg):
    global _dashboard_state
    try:
        data = ujson.loads(msg)
        if 'id' in data:
            comp_id = data['id']
            # Handle generic value
            if 'value' in data:
                try:
                    val = int(data['value'])
                except:
                    val = data['value']
                _dashboard_state[comp_id] = val
                
            # Handle Joystick Y
            if 'y' in data:
                 _dashboard_state[comp_id + '_y'] = int(data['y'])
            
            # --- TRIGGER EVENTS ---
            if '_dashboard_event_registry' in globals() and comp_id in _dashboard_event_registry:
                for handler in _dashboard_event_registry[comp_id]:
                    try: handler()
                    except Exception as e: print(f"Handler Error: {e}")

            # Broadcast update to other clients (Sync)
            for c in _ws_clients:
                if c is not client:
                    try: c.send(msg)
                    except: pass
    except Exception as e:
        print(f"WS Error: {e}")

def send_to_dashboard(component_id, prop, value):
    msg = ujson.dumps({"id": component_id, "prop": prop, "value": value})
    for client in _ws_clients:
        try: client.send(msg)
        except: pass
`;

            // 2. The Main Server Thread Function (UPDATED FOR PICO W)
            generator.functionNames_[funcName] = `
def _web_server_thread():
    try:
        addr = socket.getaddrinfo('0.0.0.0', 80)[0][-1]
        s = socket.socket()
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        s.bind(addr)
        s.listen(5)
        print('Web server listening on port 80')
        
        def _ws_client_thread(ws):
            try:
                ws.serve_forever()
            finally:
                if ws in _ws_clients: _ws_clients.remove(ws)

        while True:
            cl = None
            try:
                cl, addr = s.accept()
                cl.settimeout(2.0) # Set timeout for the handshake request
                try:
                    request_bytes = cl.recv(1024)
                except OSError:
                    cl.close()
                    continue # Timeout waiting for data, ignore ghost connection
                
                cl.settimeout(None) # Reset timeout for normal operation
                
                if not request_bytes:
                    cl.close()
                    continue
                
                request_str = request_bytes.decode('utf-8', 'ignore')
                
                if "Upgrade: websocket" in request_str:
                    ws_server = websocket_server.WsServer(cl, on_message=_ws_callback, request_str=request_str)
                    _ws_clients.append(ws_server)
                    
                    # --- THREADING FIX FOR PICO ---
                    # ESP32 can spawn nested threads. Pico cannot (Core 1 is busy here).
                    try:
                        _thread.start_new_thread(_ws_client_thread, (ws_server,))
                    except OSError:
                        # Fallback: Run blocking on this thread (Pico W)
                        # Server pauses accepting new connections until this WS closes
                        _ws_client_thread(ws_server)
                    continue

                if callable(_web_request_handler):
                    _web_request_handler()
                
                response = 'HTTP/1.1 200 OK\\r\\nContent-Type: text/html\\r\\nConnection: close\\r\\n\\r\\n' + str(_web_html_content)
                cl.sendall(response.encode('utf-8'))
                cl.close()
            except Exception as e:
                if cl: cl.close()
                print('Server Error:', e)
    except Exception as e:
        print('Fatal Server Error:', e)

def ${funcName}():
    if _wlan and _wlan.isconnected():
        try:
            _thread.start_new_thread(_web_server_thread, ())
            print("Server thread started.")
        except Exception as e:
            print("Failed to start thread:", e)
    else:
        print("Wi-Fi not connected. Server aborted.")
`;
        }
        
        return `${funcName}()\n`;
    };

    // --- 4. Event Handlers ---

    generator.forBlock['wifi_on_web_request'] = function(block) {
        const statements_do = generator.statementToCode(block, 'DO') || `${generator.INDENT}pass\n`;
        const funcName = generator.nameDB_.getDistinctName('on_web_request', 'PROCEDURE');
        const func = `def ${funcName}():\n${generator.INDENT}global _web_html_content\n${statements_do}\n` + 
                     `# Register handler\n` +
                     `_web_request_handler = ${funcName}`;
                     
        generator.functionNames_[funcName] = func;
        
        return ''; 
    };

    generator.forBlock['wifi_send_web_response'] = function(block) {
        const html = generator.valueToCode(block, 'HTML', 0) || '""';
        return `_web_html_content = str(${html})\n`;
    };

    generator.forBlock['wifi_get_web_request_path'] = function(block) {
        return ['"/"', generator.ORDER_ATOMIC];
    };
}