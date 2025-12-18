# boot.py - Runs on startup to connect to Wi-Fi and start WebREPL

import network
import time
import webrepl

# --- IMPORTANT: CONFIGURE YOUR WI-FI CREDENTIALS ---
WIFI_SSID = "YOUR_WIFI_SSID"
WIFI_PASSWORD = "YOUR_WIFI_PASSWORD"
# ----------------------------------------------------

print("--- Running boot.py ---")

# Start the Wi-Fi station interface
wlan = network.WLAN(network.STA_IF)
wlan.active(True)

# Check if already connected
if not wlan.isconnected():
    print(f"Connecting to Wi-Fi network: {WIFI_SSID}...")
    wlan.connect(WIFI_SSID, WIFI_PASSWORD)

    # Wait for the connection to establish, with a timeout
    max_wait = 15
    while max_wait > 0:
        if wlan.status() < 0 or wlan.status() >= 3:
            break
        max_wait -= 1
        print(".")
        time.sleep(1)

# Check the connection status and start WebREPL
if wlan.isconnected():
    ip_address = wlan.ifconfig()[0]
    print(f"Wi-Fi Connected! Device IP: {ip_address}")
    webrepl.start()
    print("WebREPL started.")
else:
    print("Wi-Fi connection failed.")

print("--- boot.py finished ---")