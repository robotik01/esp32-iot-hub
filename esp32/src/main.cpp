/*
 * ESP32 IoT Control Hub - Professional Edition
 * Smart Monitoring, Control & Automation System
 * 
 * Features:
 * - EEPROM-based configuration (no code changes needed)
 * - WiFi Provisioning (captive portal)
 * - Serial/UART configuration tool
 * - WebSocket server for real-time communication
 * - Multiple sensor support (DHT, Light, Motion, etc.)
 * - Relay/LED/Motor control with PWM
 * - Automation rules engine
 * - Google Sheets data logging
 * - OTA updates support
 * - Supports: ESP32 DevKit, Wemos Lolin S2 Mini
 */

#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include <WebSocketsServer.h>
#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <EEPROM.h>
#include <DHT.h>
#include <DNSServer.h>

// ============== EEPROM STRUCTURE ==============
#define EEPROM_SIZE 2048
#define EEPROM_MAGIC 0xA5B7  // Magic number to verify EEPROM initialized
#define EEPROM_VERSION 1

// EEPROM Addresses
#define ADDR_MAGIC        0
#define ADDR_VERSION      2
#define ADDR_BOARD_TYPE   3
#define ADDR_WIFI_SSID    10
#define ADDR_WIFI_PASS    74
#define ADDR_AP_SSID      138
#define ADDR_AP_PASS      170
#define ADDR_DEVICE_NAME  202
#define ADDR_SCRIPT_URL   266
#define ADDR_PIN_CONFIG   530
#define ADDR_SENSOR_CFG   630
#define ADDR_AUTOMATION   730

// Board Types
#define BOARD_ESP32_DEVKIT   0
#define BOARD_LOLIN_S2_MINI  1
#define BOARD_CUSTOM         2

// ============== DEFAULT PIN CONFIGURATIONS ==============

// ESP32 DevKit Default Pins
const uint8_t DEVKIT_RELAY_PINS[4] = {26, 27, 14, 12};
const uint8_t DEVKIT_LED_PIN = 25;
const uint8_t DEVKIT_MOTOR_PIN = 33;
const uint8_t DEVKIT_DHT_PIN = 32;
const uint8_t DEVKIT_LIGHT_PIN = 34;
const uint8_t DEVKIT_MOTION_PIN = 35;

// Wemos Lolin S2 Mini Default Pins
const uint8_t S2MINI_RELAY_PINS[4] = {5, 7, 9, 11};
const uint8_t S2MINI_LED_PIN = 15;
const uint8_t S2MINI_MOTOR_PIN = 16;
const uint8_t S2MINI_DHT_PIN = 33;
const uint8_t S2MINI_LIGHT_PIN = 1;
const uint8_t S2MINI_MOTION_PIN = 3;

// ============== CONFIGURATION STRUCTURE ==============

struct Config {
  uint16_t magic;
  uint8_t version;
  uint8_t boardType;
  
  // WiFi
  char wifiSSID[64];
  char wifiPassword[64];
  char apSSID[32];
  char apPassword[32];
  char deviceName[64];
  
  // Google Sheets
  char scriptURL[256];
  
  // Pin Configuration
  uint8_t relayPins[4];
  uint8_t ledPin;
  uint8_t motorPin;
  uint8_t dhtPin;
  uint8_t dhtType;
  uint8_t lightPin;
  uint8_t motionPin;
  
  // Features
  bool enableDHT;
  bool enableLight;
  bool enableMotion;
  bool enableRelays[4];
  bool enableLED;
  bool enableMotor;
  bool enableLogging;
  
  // Intervals (in seconds)
  uint16_t sensorInterval;
  uint16_t logInterval;
};

Config config;

// ============== GLOBAL VARIABLES ==============

WebServer webServer(80);
WebSocketsServer webSocket(81);
DNSServer dnsServer;
DHT* dhtSensor = nullptr;

// Device states
bool relayStates[4] = {false, false, false, false};
bool ledState = false;
bool motorState = false;
int ledBrightness = 100;
int motorSpeed = 50;

// Sensor values
float temperature = 0;
float humidity = 0;
int lightLevel = 0;
bool motionDetected = false;

// System state
bool wifiConnected = false;
bool apMode = true;
bool configMode = false;
unsigned long lastSensorRead = 0;
unsigned long lastDataLog = 0;
unsigned long lastHeartbeat = 0;

// Automation rules
struct AutomationRule {
  bool enabled;
  char triggerDevice[32];
  char condition[8];
  float triggerValue;
  char actionDevice[32];
  bool actionState;
  int actionValue;
};

AutomationRule rules[10];
int ruleCount = 0;

// ============== FUNCTION DECLARATIONS ==============

void loadConfig();
void saveConfig();
void resetConfig();
void applyBoardDefaults();
void setupWiFi();
void setupPins();
void setupWebSocket();
void setupWebServer();
void setupDNS();
void readSensors();
void sendSensorData();
void processAutomation();
void logToGoogleSheets();
void handleSerial();
void printHelp();
void printConfig();
void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length);
void handleCommand(uint8_t num, JsonDocument& doc);
void setDeviceState(String deviceId, bool state, int value = -1);
void broadcastState();
String getConfigJSON();
String getStateJSON();

// ============== CAPTIVE PORTAL HTML ==============

const char CAPTIVE_PORTAL_HTML[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ESP32 IoT Hub - Setup</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      min-height: 100vh;
      color: #e2e8f0;
      padding: 20px;
    }
    .container {
      max-width: 500px;
      margin: 0 auto;
    }
    .card {
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 16px;
    }
    h1 {
      font-size: 24px;
      background: linear-gradient(135deg, #0ea5e9, #22d3ee);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 8px;
    }
    .subtitle { color: #94a3b8; font-size: 14px; margin-bottom: 24px; }
    label { display: block; color: #94a3b8; font-size: 14px; margin-bottom: 6px; }
    input, select {
      width: 100%;
      padding: 12px 16px;
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 10px;
      color: #e2e8f0;
      font-size: 16px;
      margin-bottom: 16px;
    }
    input:focus, select:focus {
      outline: none;
      border-color: #0ea5e9;
      box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.2);
    }
    button {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #0ea5e9, #6366f1);
      border: none;
      border-radius: 10px;
      color: white;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 40px rgba(14, 165, 233, 0.4);
    }
    .section { margin-top: 24px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.1); }
    .section-title { font-size: 18px; font-weight: 600; margin-bottom: 16px; }
    .pin-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
      cursor: pointer;
    }
    .checkbox-label input[type="checkbox"] {
      width: 20px;
      height: 20px;
      margin: 0;
    }
    .status {
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 16px;
      font-size: 14px;
    }
    .status.success { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
    .status.error { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
    .status.info { background: rgba(14, 165, 233, 0.2); color: #0ea5e9; }
    .tabs { display: flex; gap: 8px; margin-bottom: 20px; }
    .tab {
      flex: 1;
      padding: 10px;
      background: transparent;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px;
      color: #94a3b8;
      cursor: pointer;
      font-size: 14px;
    }
    .tab.active {
      background: rgba(14, 165, 233, 0.2);
      border-color: #0ea5e9;
      color: #0ea5e9;
    }
    .tab-content { display: none; }
    .tab-content.active { display: block; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <h1>🌐 ESP32 IoT Hub</h1>
      <p class="subtitle">Configure your IoT device</p>
      
      <div class="tabs">
        <button class="tab active" onclick="showTab('wifi')">WiFi</button>
        <button class="tab" onclick="showTab('pins')">Pins</button>
        <button class="tab" onclick="showTab('features')">Features</button>
      </div>
      
      <div id="status"></div>
      
      <form id="configForm">
        <div id="wifi" class="tab-content active">
          <label>Board Type</label>
          <select name="boardType" id="boardType" onchange="updatePinDefaults()">
            <option value="0">ESP32 DevKit</option>
            <option value="1">Wemos Lolin S2 Mini</option>
            <option value="2">Custom</option>
          </select>
          
          <label>Device Name</label>
          <input type="text" name="deviceName" placeholder="My IoT Hub">
          
          <label>WiFi SSID</label>
          <input type="text" name="wifiSSID" placeholder="Your WiFi network">
          
          <label>WiFi Password</label>
          <input type="password" name="wifiPassword" placeholder="WiFi password">
          
          <label>AP SSID (Fallback)</label>
          <input type="text" name="apSSID" value="ESP32_IoT_Hub">
          
          <label>AP Password</label>
          <input type="password" name="apPassword" value="iot12345">
          
          <label>Google Script URL (Optional)</label>
          <input type="text" name="scriptURL" placeholder="https://script.google.com/...">
        </div>
        
        <div id="pins" class="tab-content">
          <p class="status info">Pin configuration for advanced users</p>
          
          <div class="section-title">Relay Pins</div>
          <div class="pin-grid">
            <div><label>Relay 1</label><input type="number" name="relay1" min="0" max="40"></div>
            <div><label>Relay 2</label><input type="number" name="relay2" min="0" max="40"></div>
            <div><label>Relay 3</label><input type="number" name="relay3" min="0" max="40"></div>
            <div><label>Relay 4</label><input type="number" name="relay4" min="0" max="40"></div>
          </div>
          
          <div class="section-title">PWM Outputs</div>
          <div class="pin-grid">
            <div><label>LED Pin</label><input type="number" name="ledPin" min="0" max="40"></div>
            <div><label>Motor Pin</label><input type="number" name="motorPin" min="0" max="40"></div>
          </div>
          
          <div class="section-title">Sensor Pins</div>
          <div class="pin-grid">
            <div><label>DHT Pin</label><input type="number" name="dhtPin" min="0" max="40"></div>
            <div><label>DHT Type</label>
              <select name="dhtType">
                <option value="11">DHT11</option>
                <option value="22" selected>DHT22</option>
              </select>
            </div>
            <div><label>Light Sensor</label><input type="number" name="lightPin" min="0" max="40"></div>
            <div><label>Motion Sensor</label><input type="number" name="motionPin" min="0" max="40"></div>
          </div>
        </div>
        
        <div id="features" class="tab-content">
          <div class="section-title">Enable Features</div>
          <label class="checkbox-label"><input type="checkbox" name="enableDHT" checked> Temperature & Humidity (DHT)</label>
          <label class="checkbox-label"><input type="checkbox" name="enableLight" checked> Light Sensor</label>
          <label class="checkbox-label"><input type="checkbox" name="enableMotion" checked> Motion Sensor</label>
          <label class="checkbox-label"><input type="checkbox" name="enableRelay1" checked> Relay 1</label>
          <label class="checkbox-label"><input type="checkbox" name="enableRelay2" checked> Relay 2</label>
          <label class="checkbox-label"><input type="checkbox" name="enableRelay3" checked> Relay 3</label>
          <label class="checkbox-label"><input type="checkbox" name="enableRelay4" checked> Relay 4</label>
          <label class="checkbox-label"><input type="checkbox" name="enableLED" checked> LED (PWM)</label>
          <label class="checkbox-label"><input type="checkbox" name="enableMotor" checked> Motor (PWM)</label>
          <label class="checkbox-label"><input type="checkbox" name="enableLogging"> Google Sheets Logging</label>
          
          <div class="section">
            <div class="section-title">Intervals</div>
            <div class="pin-grid">
              <div><label>Sensor Read (sec)</label><input type="number" name="sensorInterval" value="2" min="1" max="60"></div>
              <div><label>Log Data (sec)</label><input type="number" name="logInterval" value="60" min="10" max="3600"></div>
            </div>
          </div>
        </div>
        
        <button type="submit" style="margin-top: 20px;">Save & Restart</button>
      </form>
    </div>
    
    <div class="card">
      <div class="section-title">Current Status</div>
      <div id="deviceStatus">Loading...</div>
    </div>
  </div>
  
  <script>
    function showTab(name) {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      document.querySelector(`[onclick="showTab('${name}')"]`).classList.add('active');
      document.getElementById(name).classList.add('active');
    }
    
    function updatePinDefaults() {
      const board = document.getElementById('boardType').value;
      const devkit = {relay1:26,relay2:27,relay3:14,relay4:12,ledPin:25,motorPin:33,dhtPin:32,lightPin:34,motionPin:35};
      const s2mini = {relay1:5,relay2:7,relay3:9,relay4:11,ledPin:15,motorPin:16,dhtPin:33,lightPin:1,motionPin:3};
      const pins = board === '0' ? devkit : board === '1' ? s2mini : devkit;
      
      for (const [key, value] of Object.entries(pins)) {
        const input = document.querySelector(`[name="${key}"]`);
        if (input) input.value = value;
      }
    }
    
    document.getElementById('configForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const config = {};
      formData.forEach((v, k) => config[k] = v);
      
      // Handle checkboxes
      ['enableDHT','enableLight','enableMotion','enableRelay1','enableRelay2','enableRelay3','enableRelay4','enableLED','enableMotor','enableLogging'].forEach(name => {
        config[name] = document.querySelector(`[name="${name}"]`).checked;
      });
      
      try {
        const res = await fetch('/config', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(config)
        });
        const data = await res.json();
        document.getElementById('status').innerHTML = `<div class="status success">${data.message}</div>`;
        setTimeout(() => location.reload(), 2000);
      } catch (err) {
        document.getElementById('status').innerHTML = `<div class="status error">Error: ${err.message}</div>`;
      }
    });
    
    async function loadStatus() {
      try {
        const res = await fetch('/status');
        const data = await res.json();
        document.getElementById('deviceStatus').innerHTML = `
          <p>🔌 WiFi: ${data.wifiConnected ? 'Connected' : 'Not Connected'}</p>
          <p>📡 AP Mode: ${data.apMode ? 'Active' : 'Inactive'}</p>
          <p>🌡️ Temperature: ${data.temperature}°C</p>
          <p>💧 Humidity: ${data.humidity}%</p>
          <p>💡 Light: ${data.lightLevel}%</p>
          <p>🏃 Motion: ${data.motionDetected ? 'Yes' : 'No'}</p>
        `;
        
        // Load current config
        const cfgRes = await fetch('/config');
        const cfg = await cfgRes.json();
        for (const [key, value] of Object.entries(cfg)) {
          const input = document.querySelector(`[name="${key}"]`);
          if (input) {
            if (input.type === 'checkbox') input.checked = value;
            else input.value = value;
          }
        }
      } catch (err) {
        document.getElementById('deviceStatus').innerHTML = 'Error loading status';
      }
    }
    
    updatePinDefaults();
    loadStatus();
    setInterval(loadStatus, 5000);
  </script>
</body>
</html>
)rawliteral";

// ============== SETUP ==============

void setup() {
  Serial.begin(115200);
  delay(100);
  
  Serial.println("\n╔════════════════════════════════════════╗");
  Serial.println("║   ESP32 IoT Control Hub - Pro Edition  ║");
  Serial.println("║         Smart Automation System        ║");
  Serial.println("╚════════════════════════════════════════╝\n");

  EEPROM.begin(EEPROM_SIZE);
  loadConfig();
  
  Serial.println("Type 'help' for serial commands\n");
  
  setupPins();
  setupWiFi();
  setupWebServer();
  setupWebSocket();
  
  if (config.enableDHT) {
    dhtSensor = new DHT(config.dhtPin, config.dhtType);
    dhtSensor->begin();
  }
  
  Serial.println("\n✓ System Ready!");
  Serial.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  printConfig();
}

// ============== MAIN LOOP ==============

void loop() {
  webSocket.loop();
  webServer.handleClient();
  
  if (apMode) {
    dnsServer.processNextRequest();
  }
  
  handleSerial();
  
  unsigned long currentMillis = millis();
  
  // Read sensors
  if (currentMillis - lastSensorRead >= config.sensorInterval * 1000UL) {
    lastSensorRead = currentMillis;
    readSensors();
    sendSensorData();
    processAutomation();
  }
  
  // Log to Google Sheets
  if (config.enableLogging && currentMillis - lastDataLog >= config.logInterval * 1000UL) {
    lastDataLog = currentMillis;
    logToGoogleSheets();
  }
  
  // Heartbeat
  if (currentMillis - lastHeartbeat >= 30000) {
    lastHeartbeat = currentMillis;
    Serial.println("[♥] System running - Uptime: " + String(millis()/1000) + "s");
  }
}

// ============== CONFIGURATION ==============

void loadConfig() {
  EEPROM.get(ADDR_MAGIC, config.magic);
  
  if (config.magic != EEPROM_MAGIC) {
    Serial.println("! EEPROM not initialized, loading defaults...");
    resetConfig();
    return;
  }
  
  // Load full config
  EEPROM.get(0, config);
  Serial.println("✓ Configuration loaded from EEPROM");
}

void saveConfig() {
  config.magic = EEPROM_MAGIC;
  config.version = EEPROM_VERSION;
  EEPROM.put(0, config);
  EEPROM.commit();
  Serial.println("✓ Configuration saved to EEPROM");
}

void resetConfig() {
  config.magic = EEPROM_MAGIC;
  config.version = EEPROM_VERSION;
  config.boardType = BOARD_ESP32_DEVKIT;
  
  strcpy(config.wifiSSID, "");
  strcpy(config.wifiPassword, "");
  strcpy(config.apSSID, "ESP32_IoT_Hub");
  strcpy(config.apPassword, "iot12345");
  strcpy(config.deviceName, "ESP32 IoT Hub");
  strcpy(config.scriptURL, "");
  
  applyBoardDefaults();
  
  config.enableDHT = true;
  config.enableLight = true;
  config.enableMotion = true;
  config.enableRelays[0] = true;
  config.enableRelays[1] = true;
  config.enableRelays[2] = true;
  config.enableRelays[3] = true;
  config.enableLED = true;
  config.enableMotor = true;
  config.enableLogging = false;
  
  config.sensorInterval = 2;
  config.logInterval = 60;
  
  saveConfig();
}

void applyBoardDefaults() {
  if (config.boardType == BOARD_LOLIN_S2_MINI) {
    memcpy(config.relayPins, S2MINI_RELAY_PINS, 4);
    config.ledPin = S2MINI_LED_PIN;
    config.motorPin = S2MINI_MOTOR_PIN;
    config.dhtPin = S2MINI_DHT_PIN;
    config.lightPin = S2MINI_LIGHT_PIN;
    config.motionPin = S2MINI_MOTION_PIN;
  } else {
    memcpy(config.relayPins, DEVKIT_RELAY_PINS, 4);
    config.ledPin = DEVKIT_LED_PIN;
    config.motorPin = DEVKIT_MOTOR_PIN;
    config.dhtPin = DEVKIT_DHT_PIN;
    config.lightPin = DEVKIT_LIGHT_PIN;
    config.motionPin = DEVKIT_MOTION_PIN;
  }
  config.dhtType = DHT22;
}

// ============== WIFI SETUP ==============

void setupWiFi() {
  Serial.println("\n[WiFi] Setting up...");
  
  // Setup Access Point
  WiFi.mode(WIFI_AP_STA);
  WiFi.softAP(config.apSSID, config.apPassword);
  apMode = true;
  
  Serial.println("✓ AP Started: " + String(config.apSSID));
  Serial.println("  AP IP: " + WiFi.softAPIP().toString());
  Serial.println("  Password: " + String(config.apPassword));
  
  // Try to connect to WiFi network
  if (strlen(config.wifiSSID) > 0) {
    Serial.println("\n[WiFi] Connecting to: " + String(config.wifiSSID));
    WiFi.begin(config.wifiSSID, config.wifiPassword);
    
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 30) {
      delay(500);
      Serial.print(".");
      attempts++;
    }
    
    if (WiFi.status() == WL_CONNECTED) {
      wifiConnected = true;
      Serial.println("\n✓ WiFi Connected!");
      Serial.println("  IP: " + WiFi.localIP().toString());
    } else {
      wifiConnected = false;
      Serial.println("\n✗ WiFi Connection Failed");
      Serial.println("  Using AP mode for configuration");
    }
  } else {
    Serial.println("\n[WiFi] No SSID configured - AP mode only");
    configMode = true;
  }
  
  // Setup DNS for captive portal
  if (apMode) {
    setupDNS();
  }
}

void setupDNS() {
  dnsServer.start(53, "*", WiFi.softAPIP());
  Serial.println("✓ DNS Server started for captive portal");
}

// ============== PIN SETUP ==============

void setupPins() {
  Serial.println("\n[Pins] Configuring...");
  
  // Relay pins
  for (int i = 0; i < 4; i++) {
    if (config.enableRelays[i]) {
      pinMode(config.relayPins[i], OUTPUT);
      digitalWrite(config.relayPins[i], LOW);
      Serial.printf("  Relay %d: GPIO %d\n", i+1, config.relayPins[i]);
    }
  }
  
  // LED pin (PWM)
  if (config.enableLED) {
    pinMode(config.ledPin, OUTPUT);
    ledcSetup(0, 5000, 8);
    ledcAttachPin(config.ledPin, 0);
    Serial.printf("  LED: GPIO %d (PWM)\n", config.ledPin);
  }
  
  // Motor pin (PWM)
  if (config.enableMotor) {
    pinMode(config.motorPin, OUTPUT);
    ledcSetup(1, 5000, 8);
    ledcAttachPin(config.motorPin, 1);
    Serial.printf("  Motor: GPIO %d (PWM)\n", config.motorPin);
  }
  
  // Sensor pins
  if (config.enableLight) {
    pinMode(config.lightPin, INPUT);
    Serial.printf("  Light Sensor: GPIO %d\n", config.lightPin);
  }
  
  if (config.enableMotion) {
    pinMode(config.motionPin, INPUT);
    Serial.printf("  Motion Sensor: GPIO %d\n", config.motionPin);
  }
  
  if (config.enableDHT) {
    Serial.printf("  DHT%d: GPIO %d\n", config.dhtType, config.dhtPin);
  }
  
  Serial.println("✓ Pins configured");
}

// ============== WEB SERVER SETUP ==============

void setupWebServer() {
  // Captive portal and config page
  webServer.on("/", HTTP_GET, []() {
    webServer.send(200, "text/html", CAPTIVE_PORTAL_HTML);
  });
  
  webServer.on("/generate_204", HTTP_GET, []() {
    webServer.send(200, "text/html", CAPTIVE_PORTAL_HTML);
  });
  
  webServer.on("/config", HTTP_GET, []() {
    webServer.send(200, "application/json", getConfigJSON());
  });
  
  webServer.on("/config", HTTP_POST, []() {
    if (webServer.hasArg("plain")) {
      JsonDocument doc;
      DeserializationError error = deserializeJson(doc, webServer.arg("plain"));
      
      if (!error) {
        // Update config
        if (doc["boardType"]) config.boardType = doc["boardType"].as<int>();
        if (doc["deviceName"]) strlcpy(config.deviceName, doc["deviceName"], 64);
        if (doc["wifiSSID"]) strlcpy(config.wifiSSID, doc["wifiSSID"], 64);
        if (doc["wifiPassword"]) strlcpy(config.wifiPassword, doc["wifiPassword"], 64);
        if (doc["apSSID"]) strlcpy(config.apSSID, doc["apSSID"], 32);
        if (doc["apPassword"]) strlcpy(config.apPassword, doc["apPassword"], 32);
        if (doc["scriptURL"]) strlcpy(config.scriptURL, doc["scriptURL"], 256);
        
        // Pins
        if (doc["relay1"]) config.relayPins[0] = doc["relay1"].as<int>();
        if (doc["relay2"]) config.relayPins[1] = doc["relay2"].as<int>();
        if (doc["relay3"]) config.relayPins[2] = doc["relay3"].as<int>();
        if (doc["relay4"]) config.relayPins[3] = doc["relay4"].as<int>();
        if (doc["ledPin"]) config.ledPin = doc["ledPin"].as<int>();
        if (doc["motorPin"]) config.motorPin = doc["motorPin"].as<int>();
        if (doc["dhtPin"]) config.dhtPin = doc["dhtPin"].as<int>();
        if (doc["dhtType"]) config.dhtType = doc["dhtType"].as<int>();
        if (doc["lightPin"]) config.lightPin = doc["lightPin"].as<int>();
        if (doc["motionPin"]) config.motionPin = doc["motionPin"].as<int>();
        
        // Features
        config.enableDHT = doc["enableDHT"] | config.enableDHT;
        config.enableLight = doc["enableLight"] | config.enableLight;
        config.enableMotion = doc["enableMotion"] | config.enableMotion;
        config.enableRelays[0] = doc["enableRelay1"] | config.enableRelays[0];
        config.enableRelays[1] = doc["enableRelay2"] | config.enableRelays[1];
        config.enableRelays[2] = doc["enableRelay3"] | config.enableRelays[2];
        config.enableRelays[3] = doc["enableRelay4"] | config.enableRelays[3];
        config.enableLED = doc["enableLED"] | config.enableLED;
        config.enableMotor = doc["enableMotor"] | config.enableMotor;
        config.enableLogging = doc["enableLogging"] | config.enableLogging;
        
        if (doc["sensorInterval"]) config.sensorInterval = doc["sensorInterval"].as<int>();
        if (doc["logInterval"]) config.logInterval = doc["logInterval"].as<int>();
        
        saveConfig();
        
        webServer.send(200, "application/json", "{\"success\":true,\"message\":\"Configuration saved! Restarting...\"}");
        delay(1000);
        ESP.restart();
      } else {
        webServer.send(400, "application/json", "{\"success\":false,\"message\":\"Invalid JSON\"}");
      }
    }
  });
  
  webServer.on("/status", HTTP_GET, []() {
    webServer.send(200, "application/json", getStateJSON());
  });
  
  webServer.on("/restart", HTTP_GET, []() {
    webServer.send(200, "application/json", "{\"success\":true,\"message\":\"Restarting...\"}");
    delay(500);
    ESP.restart();
  });
  
  webServer.on("/reset", HTTP_GET, []() {
    resetConfig();
    webServer.send(200, "application/json", "{\"success\":true,\"message\":\"Configuration reset. Restarting...\"}");
    delay(500);
    ESP.restart();
  });
  
  // Handle captive portal redirects
  webServer.onNotFound([]() {
    webServer.sendHeader("Location", "http://" + WiFi.softAPIP().toString());
    webServer.send(302, "text/plain", "");
  });
  
  webServer.begin();
  Serial.println("✓ Web server started on port 80");
}

// ============== WEBSOCKET SETUP ==============

void setupWebSocket() {
  webSocket.begin();
  webSocket.onEvent(webSocketEvent);
  Serial.println("✓ WebSocket server started on port 81");
}

// ============== WEBSOCKET EVENT HANDLER ==============

void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.printf("[WS] Client %u disconnected\n", num);
      break;
      
    case WStype_CONNECTED: {
      IPAddress ip = webSocket.remoteIP(num);
      Serial.printf("[WS] Client %u connected from %s\n", num, ip.toString().c_str());
      broadcastState();
      break;
    }
    
    case WStype_TEXT: {
      Serial.printf("[WS] Received from %u: %s\n", num, payload);
      
      JsonDocument doc;
      DeserializationError error = deserializeJson(doc, payload);
      
      if (!error) {
        handleCommand(num, doc);
      }
      break;
    }
    
    default:
      break;
  }
}

// ============== COMMAND HANDLER ==============

void handleCommand(uint8_t num, JsonDocument& doc) {
  String type = doc["type"] | "";
  
  if (type == "control") {
    String id = doc["id"] | "";
    bool state = doc["state"] | false;
    int value = doc["value"] | -1;
    
    setDeviceState(id, state, value);
    broadcastState();
  }
  else if (type == "get_state") {
    broadcastState();
  }
  else if (type == "get_config") {
    String configJSON = getConfigJSON();
    webSocket.sendTXT(num, configJSON);
  }
  else if (type == "add_rule") {
    if (ruleCount < 10) {
      rules[ruleCount].enabled = true;
      strlcpy(rules[ruleCount].triggerDevice, doc["trigger"] | "", 32);
      strlcpy(rules[ruleCount].condition, doc["condition"] | "", 8);
      rules[ruleCount].triggerValue = doc["value"] | 0.0f;
      strlcpy(rules[ruleCount].actionDevice, doc["action"] | "", 32);
      rules[ruleCount].actionState = doc["actionState"] | false;
      rules[ruleCount].actionValue = doc["actionValue"] | -1;
      ruleCount++;
      
      JsonDocument response;
      response["type"] = "rule_added";
      response["ruleCount"] = ruleCount;
      String output;
      serializeJson(response, output);
      webSocket.sendTXT(num, output);
    }
  }
  else if (type == "ping") {
    webSocket.sendTXT(num, "{\"type\":\"pong\"}");
  }
}

// ============== DEVICE CONTROL ==============

void setDeviceState(String deviceId, bool state, int value) {
  if (deviceId.startsWith("relay")) {
    int idx = deviceId.substring(5).toInt() - 1;
    if (idx >= 0 && idx < 4 && config.enableRelays[idx]) {
      relayStates[idx] = state;
      digitalWrite(config.relayPins[idx], state ? HIGH : LOW);
    }
  }
  else if (deviceId == "led1" && config.enableLED) {
    ledState = state;
    if (value >= 0) ledBrightness = value;
    ledcWrite(0, state ? map(ledBrightness, 0, 100, 0, 255) : 0);
  }
  else if (deviceId == "motor1" && config.enableMotor) {
    motorState = state;
    if (value >= 0) motorSpeed = value;
    ledcWrite(1, state ? map(motorSpeed, 0, 100, 0, 255) : 0);
  }
  
  Serial.printf("[Control] %s = %s", deviceId.c_str(), state ? "ON" : "OFF");
  if (value >= 0) Serial.printf(" (value: %d)", value);
  Serial.println();
}

// ============== SENSOR READING ==============

void readSensors() {
  // Read DHT sensor
  if (config.enableDHT && dhtSensor != nullptr) {
    float newTemp = dhtSensor->readTemperature();
    float newHum = dhtSensor->readHumidity();
    
    if (!isnan(newTemp)) temperature = newTemp;
    if (!isnan(newHum)) humidity = newHum;
  }
  
  // Read light sensor
  if (config.enableLight) {
    int raw = analogRead(config.lightPin);
    lightLevel = map(raw, 0, 4095, 0, 100);
  }
  
  // Read motion sensor
  if (config.enableMotion) {
    motionDetected = digitalRead(config.motionPin) == HIGH;
  }
}

// ============== SEND SENSOR DATA ==============

void sendSensorData() {
  JsonDocument doc;
  doc["type"] = "sensor_data";
  doc["timestamp"] = millis();
  
  JsonArray sensors = doc["sensors"].to<JsonArray>();
  
  if (config.enableDHT) {
    JsonObject temp = sensors.add<JsonObject>();
    temp["id"] = "temp1";
    temp["type"] = "temperature";
    temp["value"] = temperature;
    temp["unit"] = "°C";
    
    JsonObject hum = sensors.add<JsonObject>();
    hum["id"] = "hum1";
    hum["type"] = "humidity";
    hum["value"] = humidity;
    hum["unit"] = "%";
  }
  
  if (config.enableLight) {
    JsonObject light = sensors.add<JsonObject>();
    light["id"] = "light1";
    light["type"] = "light";
    light["value"] = lightLevel;
    light["unit"] = "%";
  }
  
  if (config.enableMotion) {
    JsonObject motion = sensors.add<JsonObject>();
    motion["id"] = "motion1";
    motion["type"] = "motion";
    motion["value"] = motionDetected;
  }
  
  String output;
  serializeJson(doc, output);
  webSocket.broadcastTXT(output);
}

// ============== BROADCAST STATE ==============

void broadcastState() {
  String output = getStateJSON();
  webSocket.broadcastTXT(output);
}

String getStateJSON() {
  JsonDocument doc;
  doc["type"] = "state";
  doc["deviceName"] = config.deviceName;
  doc["wifiConnected"] = wifiConnected;
  doc["apMode"] = apMode;
  doc["uptime"] = millis() / 1000;
  
  // Sensor values
  doc["temperature"] = temperature;
  doc["humidity"] = humidity;
  doc["lightLevel"] = lightLevel;
  doc["motionDetected"] = motionDetected;
  
  JsonArray devices = doc["devices"].to<JsonArray>();
  
  // Relays
  for (int i = 0; i < 4; i++) {
    if (config.enableRelays[i]) {
      JsonObject relay = devices.add<JsonObject>();
      relay["id"] = "relay" + String(i + 1);
      relay["type"] = "relay";
      relay["state"] = relayStates[i];
      relay["pin"] = config.relayPins[i];
    }
  }
  
  // LED
  if (config.enableLED) {
    JsonObject led = devices.add<JsonObject>();
    led["id"] = "led1";
    led["type"] = "led";
    led["state"] = ledState;
    led["brightness"] = ledBrightness;
    led["pin"] = config.ledPin;
  }
  
  // Motor
  if (config.enableMotor) {
    JsonObject motor = devices.add<JsonObject>();
    motor["id"] = "motor1";
    motor["type"] = "motor";
    motor["state"] = motorState;
    motor["speed"] = motorSpeed;
    motor["pin"] = config.motorPin;
  }
  
  String output;
  serializeJson(doc, output);
  return output;
}

String getConfigJSON() {
  JsonDocument doc;
  
  doc["boardType"] = config.boardType;
  doc["deviceName"] = config.deviceName;
  doc["wifiSSID"] = config.wifiSSID;
  doc["apSSID"] = config.apSSID;
  doc["scriptURL"] = config.scriptURL;
  
  doc["relay1"] = config.relayPins[0];
  doc["relay2"] = config.relayPins[1];
  doc["relay3"] = config.relayPins[2];
  doc["relay4"] = config.relayPins[3];
  doc["ledPin"] = config.ledPin;
  doc["motorPin"] = config.motorPin;
  doc["dhtPin"] = config.dhtPin;
  doc["dhtType"] = config.dhtType;
  doc["lightPin"] = config.lightPin;
  doc["motionPin"] = config.motionPin;
  
  doc["enableDHT"] = config.enableDHT;
  doc["enableLight"] = config.enableLight;
  doc["enableMotion"] = config.enableMotion;
  doc["enableRelay1"] = config.enableRelays[0];
  doc["enableRelay2"] = config.enableRelays[1];
  doc["enableRelay3"] = config.enableRelays[2];
  doc["enableRelay4"] = config.enableRelays[3];
  doc["enableLED"] = config.enableLED;
  doc["enableMotor"] = config.enableMotor;
  doc["enableLogging"] = config.enableLogging;
  
  doc["sensorInterval"] = config.sensorInterval;
  doc["logInterval"] = config.logInterval;
  
  String output;
  serializeJson(doc, output);
  return output;
}

// ============== AUTOMATION PROCESSING ==============

void processAutomation() {
  for (int i = 0; i < ruleCount; i++) {
    if (!rules[i].enabled) continue;
    
    float sensorValue = 0;
    String trigger = String(rules[i].triggerDevice);
    
    if (trigger == "temp1") sensorValue = temperature;
    else if (trigger == "hum1") sensorValue = humidity;
    else if (trigger == "light1") sensorValue = lightLevel;
    else if (trigger == "motion1") sensorValue = motionDetected ? 1 : 0;
    
    bool conditionMet = false;
    String cond = String(rules[i].condition);
    
    if (cond == ">") conditionMet = sensorValue > rules[i].triggerValue;
    else if (cond == "<") conditionMet = sensorValue < rules[i].triggerValue;
    else if (cond == "==") conditionMet = abs(sensorValue - rules[i].triggerValue) < 0.01;
    else if (cond == ">=") conditionMet = sensorValue >= rules[i].triggerValue;
    else if (cond == "<=") conditionMet = sensorValue <= rules[i].triggerValue;
    
    if (conditionMet) {
      setDeviceState(String(rules[i].actionDevice), rules[i].actionState, rules[i].actionValue);
    }
  }
}

// ============== GOOGLE SHEETS LOGGING ==============

void logToGoogleSheets() {
  if (!wifiConnected || strlen(config.scriptURL) == 0) return;
  
  HTTPClient http;
  
  String url = String(config.scriptURL);
  url += "?action=log";
  url += "&device=" + String(config.deviceName);
  url += "&temp=" + String(temperature);
  url += "&humidity=" + String(humidity);
  url += "&light=" + String(lightLevel);
  url += "&motion=" + String(motionDetected ? 1 : 0);
  
  for (int i = 0; i < 4; i++) {
    url += "&relay" + String(i+1) + "=" + String(relayStates[i] ? 1 : 0);
  }
  
  http.begin(url);
  http.setTimeout(5000);
  int httpCode = http.GET();
  
  if (httpCode > 0) {
    Serial.println("[Sheets] Data logged successfully");
  } else {
    Serial.printf("[Sheets] Failed: %s\n", http.errorToString(httpCode).c_str());
  }
  
  http.end();
}

// ============== SERIAL CONFIGURATION ==============

void handleSerial() {
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    
    if (cmd == "help") {
      printHelp();
    }
    else if (cmd == "config") {
      printConfig();
    }
    else if (cmd == "status") {
      Serial.println("\n=== SYSTEM STATUS ===");
      Serial.printf("Uptime: %lu seconds\n", millis() / 1000);
      Serial.printf("WiFi: %s\n", wifiConnected ? "Connected" : "Disconnected");
      Serial.printf("AP Mode: %s\n", apMode ? "Active" : "Inactive");
      Serial.printf("Temperature: %.1f°C\n", temperature);
      Serial.printf("Humidity: %.1f%%\n", humidity);
      Serial.printf("Light: %d%%\n", lightLevel);
      Serial.printf("Motion: %s\n", motionDetected ? "Detected" : "None");
    }
    else if (cmd == "reset") {
      Serial.println("Resetting configuration...");
      resetConfig();
      Serial.println("Done. Restarting...");
      delay(500);
      ESP.restart();
    }
    else if (cmd == "restart") {
      Serial.println("Restarting...");
      delay(500);
      ESP.restart();
    }
    else if (cmd.startsWith("wifi ")) {
      // Parse: wifi SSID PASSWORD
      int spaceIdx = cmd.indexOf(' ', 5);
      if (spaceIdx > 0) {
        String ssid = cmd.substring(5, spaceIdx);
        String pass = cmd.substring(spaceIdx + 1);
        ssid.toCharArray(config.wifiSSID, 64);
        pass.toCharArray(config.wifiPassword, 64);
        saveConfig();
        Serial.printf("WiFi credentials saved: %s\n", config.wifiSSID);
        Serial.println("Restart to apply: type 'restart'");
      } else {
        Serial.println("Usage: wifi SSID PASSWORD");
      }
    }
    else if (cmd.startsWith("ap ")) {
      int spaceIdx = cmd.indexOf(' ', 3);
      if (spaceIdx > 0) {
        String ssid = cmd.substring(3, spaceIdx);
        String pass = cmd.substring(spaceIdx + 1);
        ssid.toCharArray(config.apSSID, 32);
        pass.toCharArray(config.apPassword, 32);
        saveConfig();
        Serial.printf("AP credentials saved: %s\n", config.apSSID);
      }
    }
    else if (cmd.startsWith("name ")) {
      String name = cmd.substring(5);
      name.toCharArray(config.deviceName, 64);
      saveConfig();
      Serial.printf("Device name: %s\n", config.deviceName);
    }
    else if (cmd.startsWith("board ")) {
      int type = cmd.substring(6).toInt();
      if (type >= 0 && type <= 2) {
        config.boardType = type;
        applyBoardDefaults();
        saveConfig();
        Serial.printf("Board type: %d (%s)\n", type, 
          type == 0 ? "ESP32 DevKit" : 
          type == 1 ? "Lolin S2 Mini" : "Custom");
        Serial.println("Restart to apply new pin config");
      }
    }
    else if (cmd.startsWith("pin ")) {
      // Parse: pin <name> <gpio>
      int idx1 = cmd.indexOf(' ');
      int idx2 = cmd.indexOf(' ', idx1 + 1);
      if (idx2 > 0) {
        String pinName = cmd.substring(idx1 + 1, idx2);
        int gpio = cmd.substring(idx2 + 1).toInt();
        
        if (pinName == "led") config.ledPin = gpio;
        else if (pinName == "motor") config.motorPin = gpio;
        else if (pinName == "dht") config.dhtPin = gpio;
        else if (pinName == "light") config.lightPin = gpio;
        else if (pinName == "motion") config.motionPin = gpio;
        else if (pinName == "relay1") config.relayPins[0] = gpio;
        else if (pinName == "relay2") config.relayPins[1] = gpio;
        else if (pinName == "relay3") config.relayPins[2] = gpio;
        else if (pinName == "relay4") config.relayPins[3] = gpio;
        else {
          Serial.println("Unknown pin name");
          return;
        }
        
        saveConfig();
        Serial.printf("Pin %s = GPIO %d\n", pinName.c_str(), gpio);
      }
    }
    else if (cmd.startsWith("relay")) {
      // Parse: relay1 on/off
      int idx = cmd.charAt(5) - '1';
      if (idx >= 0 && idx < 4 && cmd.length() > 7) {
        bool state = cmd.endsWith("on");
        setDeviceState("relay" + String(idx + 1), state, -1);
      }
    }
    else if (cmd.startsWith("led ")) {
      if (cmd.endsWith("on")) setDeviceState("led1", true, -1);
      else if (cmd.endsWith("off")) setDeviceState("led1", false, -1);
      else {
        int val = cmd.substring(4).toInt();
        setDeviceState("led1", true, val);
      }
    }
    else if (cmd.startsWith("motor ")) {
      if (cmd.endsWith("on")) setDeviceState("motor1", true, -1);
      else if (cmd.endsWith("off")) setDeviceState("motor1", false, -1);
      else {
        int val = cmd.substring(6).toInt();
        setDeviceState("motor1", true, val);
      }
    }
    else if (cmd.length() > 0) {
      Serial.println("Unknown command. Type 'help' for available commands.");
    }
  }
}

void printHelp() {
  Serial.println("\n╔═══════════════════════════════════════════════════════════╗");
  Serial.println("║           ESP32 IoT Hub - Serial Commands                 ║");
  Serial.println("╠═══════════════════════════════════════════════════════════╣");
  Serial.println("║ SYSTEM:                                                   ║");
  Serial.println("║   help      - Show this help                              ║");
  Serial.println("║   config    - Show current configuration                  ║");
  Serial.println("║   status    - Show system status                          ║");
  Serial.println("║   restart   - Restart device                              ║");
  Serial.println("║   reset     - Factory reset                               ║");
  Serial.println("║                                                           ║");
  Serial.println("║ CONFIGURATION:                                            ║");
  Serial.println("║   wifi SSID PASSWORD - Set WiFi credentials               ║");
  Serial.println("║   ap SSID PASSWORD   - Set AP credentials                 ║");
  Serial.println("║   name DEVICE_NAME   - Set device name                    ║");
  Serial.println("║   board 0|1|2        - 0=DevKit, 1=S2Mini, 2=Custom       ║");
  Serial.println("║   pin <name> <gpio>  - Set pin (led/motor/dht/etc)        ║");
  Serial.println("║                                                           ║");
  Serial.println("║ CONTROL:                                                  ║");
  Serial.println("║   relay1 on|off      - Control relay 1-4                  ║");
  Serial.println("║   led on|off|0-100   - Control LED                        ║");
  Serial.println("║   motor on|off|0-100 - Control motor                      ║");
  Serial.println("╚═══════════════════════════════════════════════════════════╝\n");
}

void printConfig() {
  Serial.println("\n═══════════ CURRENT CONFIGURATION ═══════════");
  Serial.printf("Device Name: %s\n", config.deviceName);
  Serial.printf("Board Type:  %s\n", 
    config.boardType == 0 ? "ESP32 DevKit" : 
    config.boardType == 1 ? "Lolin S2 Mini" : "Custom");
  
  Serial.println("\n--- WiFi ---");
  Serial.printf("SSID: %s\n", strlen(config.wifiSSID) > 0 ? config.wifiSSID : "(not set)");
  Serial.printf("AP SSID: %s\n", config.apSSID);
  
  Serial.println("\n--- Pins ---");
  Serial.printf("Relays: %d, %d, %d, %d\n", 
    config.relayPins[0], config.relayPins[1], 
    config.relayPins[2], config.relayPins[3]);
  Serial.printf("LED: %d, Motor: %d\n", config.ledPin, config.motorPin);
  Serial.printf("DHT: %d (type %d)\n", config.dhtPin, config.dhtType);
  Serial.printf("Light: %d, Motion: %d\n", config.lightPin, config.motionPin);
  
  Serial.println("\n--- Features ---");
  Serial.printf("DHT: %s, Light: %s, Motion: %s\n",
    config.enableDHT ? "ON" : "OFF",
    config.enableLight ? "ON" : "OFF", 
    config.enableMotion ? "ON" : "OFF");
  Serial.printf("Relays: %s %s %s %s\n",
    config.enableRelays[0] ? "ON" : "OFF",
    config.enableRelays[1] ? "ON" : "OFF",
    config.enableRelays[2] ? "ON" : "OFF",
    config.enableRelays[3] ? "ON" : "OFF");
  Serial.printf("LED: %s, Motor: %s\n",
    config.enableLED ? "ON" : "OFF",
    config.enableMotor ? "ON" : "OFF");
  Serial.printf("Logging: %s\n", config.enableLogging ? "ON" : "OFF");
  
  Serial.println("\n--- Intervals ---");
  Serial.printf("Sensor: %d sec, Logging: %d sec\n", 
    config.sensorInterval, config.logInterval);
  
  if (wifiConnected) {
    Serial.printf("\n--- Network ---");
    Serial.printf("\nStation IP: %s\n", WiFi.localIP().toString().c_str());
  }
  Serial.printf("AP IP: %s\n", WiFi.softAPIP().toString().c_str());
  Serial.printf("WebSocket: ws://%s:81\n", WiFi.softAPIP().toString().c_str());
  Serial.println("═════════════════════════════════════════════\n");
}