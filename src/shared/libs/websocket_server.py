# A lightweight WebSocket server library for MicroPython.
# Based on the work by "aaugustin" and tailored for this IDE.
# MODIFIED: To accept a pre-read request string to prevent double-reading.

import usocket as socket
import ustruct as struct
import uhashlib as hashlib
import ubinascii as binascii

class WsServer:
    def __init__(self, conn, on_message=None, request_str=None):
        self.conn = conn
        self.on_message = on_message
        self._key = None
        # Store the pre-read request string
        self._request_str = request_str

    def _parse_key_from_string(self, request):
        # Find the WebSocket key from the provided request string
        lines = request.split('\r\n')
        for line in lines:
            if line.lower().startswith("sec-websocket-key:"):
                return line.split(':', 1)[1].strip().encode()
        return None

    def _handshake(self):
        try:
            # If we were given the request string, parse it directly.
            if self._request_str:
                self._key = self._parse_key_from_string(self._request_str)
            # Otherwise, fall back to reading from the connection (old behavior).
            else:
                line = self.conn.readline()
                while line and line.strip():
                    if line.startswith(b'Sec-WebSocket-Key:'):
                        self._key = line.split(b':', 1)[1].strip()
                    line = self.conn.readline()
            
            if not self._key:
                print("WebSocket handshake failed: Key not found.")
                return False
            
            resp_key = binascii.b2a_base64(hashlib.sha1(self._key + b'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest()).strip()
            
            self.conn.write(b'HTTP/1.1 101 Switching Protocols\r\n')
            self.conn.write(b'Upgrade: websocket\r\n')
            self.conn.write(b'Connection: Upgrade\r\n')
            self.conn.write(b'Sec-WebSocket-Accept: ' + resp_key + b'\r\n\r\n')
            
            return True
        except Exception as e:
            print("Handshake exception:", e)
            return False

    def serve_forever(self):
        if not self._handshake():
            # A failed handshake means the connection should close.
            # The client thread will terminate, and it will be removed from the list.
            return
        
        # If handshake is successful, enter the listening loop.
        while True:
            try:
                fin, opcode, payload = self._read_frame()
                if opcode == 0x8: # Connection close
                    break
                if opcode == 0x1 and self.on_message and payload: # Text frame with content
                    # Pass self (the client instance) and the message to the callback
                    self.on_message(self, payload.decode('utf-8'))
            except (OSError, ValueError):
                # An error here (like a client disconnecting improperly) breaks the loop.
                break
        self.conn.close()

    def _read_frame(self):
        hdr = self.conn.read(2)
        if len(hdr) != 2: raise ValueError("Invalid header")
        fin, opcode = hdr[0] & 0x80, hdr[0] & 0x0f
        
        mask, length = hdr[1] & 0x80, hdr[1] & 0x7f
        if length == 126:
            length = struct.unpack('>H', self.conn.read(2))[0]
        elif length == 127:
            length = struct.unpack('>Q', self.conn.read(8))[0]
        
        if mask:
            masking_key = self.conn.read(4)
        
        payload = self.conn.read(length)
        
        if mask:
            payload = bytes(p ^ masking_key[i % 4] for i, p in enumerate(payload))
            
        return fin, opcode, payload

    def send(self, data):
        try:
            data = data.encode('utf-8')
            length = len(data)
            self.conn.write(b'\x81') # FIN + Text Frame
            if length < 126:
                self.conn.write(struct.pack('B', length))
            elif length < 65536:
                self.conn.write(struct.pack('!BH', 126, length))
            else:
                self.conn.write(struct.pack('!BQ', 127, length))
            self.conn.write(data)
        except OSError:
            pass # Client likely disconnected