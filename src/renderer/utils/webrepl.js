class WebREPLCommunication {
constructor() {
this.ws = null;
this.isConnected = false;
this.password = '';
this.onMessageCallback = null;
}
async connect(host, port = 8266, password = '') {
return new Promise((resolve, reject) => {
try {
this.ws = new WebSocket(`ws://${host}:${port}/`);
this.password = password;
this.ws.onopen = () => {
console.log('WebREPL connected');
// Send password if required
if (password) {
setTimeout(() => {
this.ws.send(password + '\n');
}, 1000);
}
};
this.ws.onmessage = (event) => {
const data = event.data;
console.log('WebREPL received:', data);
if (data.includes('Password:')) {
// Send password
this.ws.send(this.password + '\n');
} else if (data.includes('WebREPL connected')) {
this.isConnected = true;
resolve(true);
}
if (this.onMessageCallback) {
this.onMessageCallback(data);
}
};
this.ws.onerror = (error) => {
console.error('WebREPL error:', error);
reject(error);
};
this.ws.onclose = () => {
console.log('WebREPL disconnected');
this.isConnected = false;
};
// Timeout after 10 seconds
setTimeout(() => {
if (!this.isConnected) {
this.ws.close();
reject(new Error('Connection timeout'));
}
}, 10000);
} catch (error) {
reject(error);
}
});
}
disconnect() {
if (this.ws && this.isConnected) {
this.ws.close();
this.isConnected = false;
}
}
sendCommand(command) {
if (!this.isConnected) {
throw new Error('Not connected to WebREPL');
}
this.ws.send(command + '\n');
}
async uploadCode(code) {
if (!this.isConnected) {
throw new Error('Not connected to WebREPL');
}
try {
// Send Ctrl+C to stop any running program
this.ws.send('\x03');
await new Promise(resolve => setTimeout(resolve, 200));
// Enter paste mode
this.ws.send('\x05');
await new Promise(resolve => setTimeout(resolve, 200));
// Send code line by line
const lines = code.split('\n');
for (const line of lines) {
this.ws.send(line + '\n');
await new Promise(resolve => setTimeout(resolve, 50));
}
// Exit paste mode and execute
this.ws.send('\x04');
return { success: true, message: 'Code uploaded via WebREPL' };
} catch (error) {
return { success: false, message: error.message };
}
}
onMessage(callback) {
this.onMessageCallback = callback;
}
}