/*
 * ESP32 IoT Control Hub
 * Smart Monitoring, Control & Automation System
 * 
 * Features:
 * - WiFi AP + Station mode
 * - WebSocket server for real-time communication
 * - Multiple sensor support (DHT, Light, Motion)
 * - Relay/LED/Motor control
 * - Automation rules
 * - Google Sheets data logging
 */

#include <Arduino.h>
#include <WiFi.h>
#include <WebSocketsServer.h>
#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <DHT.h>

// ============== CONFIGURATION ==============

// WiFi Credentials (Station Mode)
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// WiFi Access Point Configuration
const char* AP_SSID = "ESP32_IoT_Hub";
const char* AP_PASSWORD = "iot12345";

// Google Apps Script URL for data logging
const char* GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec";

// WebSocket Server Port
const int WS_PORT = 81;

// ============== PIN DEFINITIONS ==============

// Relay Pins
#define RELAY_1 26  // Living Room Light
#define RELAY_2 27  // Kitchen Light
#define RELAY_3 14  // AC Unit
#define RELAY_4 12  // Water Pump

// LED Pin (PWM)
#define LED_PIN 25

// Motor Pin (PWM)
#define MOTOR_PIN 33

// Sensor Pins
#define DHT_PIN 32
#define DHT_TYPE DHT22
#define LIGHT_SENSOR_PIN 34
#define MOTION_SENSOR_PIN 35

// ============== GLOBAL VARIABLES ==============

WebSocketsServer webSocket(WS_PORT);
DHT dht(DHT_PIN, DHT_TYPE);

// Device states
bool relay1State = false;
bool relay2State = false;
bool relay3State = false;
bool relay4State = false;
bool ledState = false;
bool motorState = false;
int ledBrightness = 100;
int motorSpeed = 50;

// Sensor values
float temperature = 0;
float humidity = 0;
int lightLevel = 0;
bool motionDetected = false;

// Timing
unsigned long lastSensorRead = 0;
unsigned long lastDataLog = 0;
const unsigned long SENSOR_INTERVAL = 2000;  // 2 seconds
const unsigned long LOG_INTERVAL = 60000;    // 1 minute

// Automation rules
struct AutomationRule {
  bool enabled;
  String triggerDevice;
  String condition;
  float triggerValue;
  String actionDevice;
  bool actionState;
};

AutomationRule rules[10];
int ruleCount = 0;

// ============== FUNCTION DECLARATIONS ==============

void setupWiFi();
void setupPins();
void setupWebSocket();
void readSensors();
void sendSensorData();
void processAutomation();
void logToGoogleSheets();
void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length);
void handleCommand(uint8_t num, JsonDocument& doc);
void setDeviceState(String deviceId, bool state, int value = -1);
void broadcastState();

// ============== SETUP ==============

void setup() {
  Serial.begin(115200);
  Serial.println("\n=================================");
  Serial.println("ESP32 IoT Control Hub Starting...");
  Serial.println("=================================\n");

  setupPins();
  setupWiFi();
  setupWebSocket();
  
  dht.begin();
  
  Serial.println("\n✓ System Ready!");
  Serial.println("WebSocket Server: ws://" + WiFi.softAPIP().toString() + ":" + String(WS_PORT));
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("Station IP: " + WiFi.localIP().toString());
  }
}

// ============== MAIN LOOP ==============

void loop() {
  webSocket.loop();
  
  unsigned long currentMillis = millis();
  
  // Read sensors periodically
  if (currentMillis - lastSensorRead >= SENSOR_INTERVAL) {
    lastSensorRead = currentMillis;
    readSensors();
    sendSensorData();
    processAutomation();
  }
  
  // Log data to Google Sheets periodically
  if (currentMillis - lastDataLog >= LOG_INTERVAL) {
    lastDataLog = currentMillis;
    logToGoogleSheets();
  }
}

// ============== WIFI SETUP ==============

void setupWiFi() {
  // Setup Access Point
  Serial.println("Setting up Access Point...");
  WiFi.mode(WIFI_AP_STA);
  WiFi.softAP(AP_SSID, AP_PASSWORD);
  Serial.println("✓ AP Started: " + String(AP_SSID));
  Serial.println("  IP: " + WiFi.softAPIP().toString());
  
  // Connect to WiFi network (optional)
  if (strlen(WIFI_SSID) > 0) {
    Serial.println("\nConnecting to WiFi: " + String(WIFI_SSID));
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
      delay(500);
      Serial.print(".");
      attempts++;
    }
    
    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("\n✓ WiFi Connected!");
      Serial.println("  IP: " + WiFi.localIP().toString());
    } else {
      Serial.println("\n✗ WiFi Connection Failed (AP mode only)");
    }
  }
}

// ============== PIN SETUP ==============

void setupPins() {
  // Relay pins
  pinMode(RELAY_1, OUTPUT);
  pinMode(RELAY_2, OUTPUT);
  pinMode(RELAY_3, OUTPUT);
  pinMode(RELAY_4, OUTPUT);
  
  // LED pin (PWM)
  pinMode(LED_PIN, OUTPUT);
  ledcSetup(0, 5000, 8);  // Channel 0, 5kHz, 8-bit
  ledcAttachPin(LED_PIN, 0);
  
  // Motor pin (PWM)
  pinMode(MOTOR_PIN, OUTPUT);
  ledcSetup(1, 5000, 8);  // Channel 1, 5kHz, 8-bit
  ledcAttachPin(MOTOR_PIN, 1);
  
  // Sensor pins
  pinMode(LIGHT_SENSOR_PIN, INPUT);
  pinMode(MOTION_SENSOR_PIN, INPUT);
  
  // Initialize all relays to OFF
  digitalWrite(RELAY_1, LOW);
  digitalWrite(RELAY_2, LOW);
  digitalWrite(RELAY_3, LOW);
  digitalWrite(RELAY_4, LOW);
  
  Serial.println("✓ Pins configured");
}

// ============== WEBSOCKET SETUP ==============

void setupWebSocket() {
  webSocket.begin();
  webSocket.onEvent(webSocketEvent);
  Serial.println("✓ WebSocket server started on port " + String(WS_PORT));
}

// ============== WEBSOCKET EVENT HANDLER ==============

void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.printf("[%u] Disconnected!\n", num);
      break;
      
    case WStype_CONNECTED: {
      IPAddress ip = webSocket.remoteIP(num);
      Serial.printf("[%u] Connected from %s\n", num, ip.toString().c_str());
      
      // Send current state to newly connected client
      broadcastState();
      break;
    }
    
    case WStype_TEXT: {
      Serial.printf("[%u] Received: %s\n", num, payload);
      
      JsonDocument doc;
      DeserializationError error = deserializeJson(doc, payload);
      
      if (!error) {
        handleCommand(num, doc);
      } else {
        Serial.println("JSON parse error!");
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
    int brightness = doc["brightness"] | -1;
    int speed = doc["speed"] | -1;
    
    setDeviceState(id, state, brightness != -1 ? brightness : speed);
    broadcastState();
  }
  else if (type == "get_state") {
    broadcastState();
  }
  else if (type == "add_rule") {
    if (ruleCount < 10) {
      rules[ruleCount].enabled = true;
      rules[ruleCount].triggerDevice = doc["trigger"].as<String>();
      rules[ruleCount].condition = doc["condition"].as<String>();
      rules[ruleCount].triggerValue = doc["value"] | 0.0f;
      rules[ruleCount].actionDevice = doc["action"].as<String>();
      rules[ruleCount].actionState = doc["actionState"] | false;
      ruleCount++;
      Serial.println("Automation rule added!");
    }
  }
}

// ============== DEVICE CONTROL ==============

void setDeviceState(String deviceId, bool state, int value) {
  if (deviceId == "relay1") {
    relay1State = state;
    digitalWrite(RELAY_1, state ? HIGH : LOW);
  }
  else if (deviceId == "relay2") {
    relay2State = state;
    digitalWrite(RELAY_2, state ? HIGH : LOW);
  }
  else if (deviceId == "relay3") {
    relay3State = state;
    digitalWrite(RELAY_3, state ? HIGH : LOW);
  }
  else if (deviceId == "relay4") {
    relay4State = state;
    digitalWrite(RELAY_4, state ? HIGH : LOW);
  }
  else if (deviceId == "led1") {
    ledState = state;
    if (value >= 0) ledBrightness = value;
    ledcWrite(0, state ? map(ledBrightness, 0, 100, 0, 255) : 0);
  }
  else if (deviceId == "motor1") {
    motorState = state;
    if (value >= 0) motorSpeed = value;
    ledcWrite(1, state ? map(motorSpeed, 0, 100, 0, 255) : 0);
  }
  
  Serial.printf("Device %s set to %s\n", deviceId.c_str(), state ? "ON" : "OFF");
}

// ============== SENSOR READING ==============

void readSensors() {
  // Read DHT sensor
  float newTemp = dht.readTemperature();
  float newHum = dht.readHumidity();
  
  if (!isnan(newTemp)) temperature = newTemp;
  if (!isnan(newHum)) humidity = newHum;
  
  // Read light sensor (analog)
  lightLevel = analogRead(LIGHT_SENSOR_PIN);
  lightLevel = map(lightLevel, 0, 4095, 0, 1500);  // Map to lux approximation
  
  // Read motion sensor
  motionDetected = digitalRead(MOTION_SENSOR_PIN) == HIGH;
}

// ============== SEND SENSOR DATA ==============

void sendSensorData() {
  JsonDocument doc;
  doc["type"] = "sensor_data";
  
  JsonArray sensors = doc["sensors"].to<JsonArray>();
  
  // Temperature
  JsonObject temp = sensors.add<JsonObject>();
  temp["id"] = "temp1";
  temp["type"] = "temperature";
  temp["value"] = temperature;
  temp["unit"] = "°C";
  
  // Humidity
  JsonObject hum = sensors.add<JsonObject>();
  hum["id"] = "hum1";
  hum["type"] = "humidity";
  hum["value"] = humidity;
  hum["unit"] = "%";
  
  // Light
  JsonObject light = sensors.add<JsonObject>();
  light["id"] = "light1";
  light["type"] = "light";
  light["value"] = lightLevel;
  light["unit"] = "lux";
  
  // Motion
  JsonObject motion = sensors.add<JsonObject>();
  motion["id"] = "motion1";
  motion["type"] = "motion";
  motion["value"] = motionDetected;
  
  String output;
  serializeJson(doc, output);
  webSocket.broadcastTXT(output);
}

// ============== BROADCAST STATE ==============

void broadcastState() {
  JsonDocument doc;
  doc["type"] = "state";
  
  JsonArray devices = doc["devices"].to<JsonArray>();
  
  // Relay 1
  JsonObject r1 = devices.add<JsonObject>();
  r1["id"] = "relay1";
  r1["state"] = relay1State;
  
  // Relay 2
  JsonObject r2 = devices.add<JsonObject>();
  r2["id"] = "relay2";
  r2["state"] = relay2State;
  
  // Relay 3
  JsonObject r3 = devices.add<JsonObject>();
  r3["id"] = "relay3";
  r3["state"] = relay3State;
  
  // Relay 4
  JsonObject r4 = devices.add<JsonObject>();
  r4["id"] = "relay4";
  r4["state"] = relay4State;
  
  // LED
  JsonObject led = devices.add<JsonObject>();
  led["id"] = "led1";
  led["state"] = ledState;
  led["brightness"] = ledBrightness;
  
  // Motor
  JsonObject motor = devices.add<JsonObject>();
  motor["id"] = "motor1";
  motor["state"] = motorState;
  motor["speed"] = motorSpeed;
  
  String output;
  serializeJson(doc, output);
  webSocket.broadcastTXT(output);
}

// ============== AUTOMATION PROCESSING ==============

void processAutomation() {
  for (int i = 0; i < ruleCount; i++) {
    if (!rules[i].enabled) continue;
    
    float sensorValue = 0;
    
    // Get sensor value based on trigger device
    if (rules[i].triggerDevice == "temp1") {
      sensorValue = temperature;
    } else if (rules[i].triggerDevice == "hum1") {
      sensorValue = humidity;
    } else if (rules[i].triggerDevice == "light1") {
      sensorValue = lightLevel;
    } else if (rules[i].triggerDevice == "motion1") {
      sensorValue = motionDetected ? 1 : 0;
    }
    
    // Check condition
    bool conditionMet = false;
    if (rules[i].condition == ">") {
      conditionMet = sensorValue > rules[i].triggerValue;
    } else if (rules[i].condition == "<") {
      conditionMet = sensorValue < rules[i].triggerValue;
    } else if (rules[i].condition == "==") {
      conditionMet = sensorValue == rules[i].triggerValue;
    } else if (rules[i].condition == ">=") {
      conditionMet = sensorValue >= rules[i].triggerValue;
    } else if (rules[i].condition == "<=") {
      conditionMet = sensorValue <= rules[i].triggerValue;
    }
    
    // Execute action if condition is met
    if (conditionMet) {
      setDeviceState(rules[i].actionDevice, rules[i].actionState, -1);
    }
  }
}

// ============== GOOGLE SHEETS LOGGING ==============

void logToGoogleSheets() {
  if (WiFi.status() != WL_CONNECTED) return;
  
  HTTPClient http;
  
  String url = String(GOOGLE_SCRIPT_URL);
  url += "?action=log";
  url += "&temp=" + String(temperature);
  url += "&humidity=" + String(humidity);
  url += "&light=" + String(lightLevel);
  url += "&motion=" + String(motionDetected ? 1 : 0);
  url += "&relay1=" + String(relay1State ? 1 : 0);
  url += "&relay2=" + String(relay2State ? 1 : 0);
  url += "&relay3=" + String(relay3State ? 1 : 0);
  url += "&relay4=" + String(relay4State ? 1 : 0);
  
  http.begin(url);
  int httpCode = http.GET();
  
  if (httpCode > 0) {
    Serial.println("Data logged to Google Sheets");
  } else {
    Serial.println("Google Sheets logging failed");
  }
  
  http.end();
}