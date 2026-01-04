# ESP32 IoT Control Hub

Sistem monitoring, kontrol, dan otomasi IoT berbasis ESP32 dengan tampilan web profesional.

## 🌟 Fitur Utama

### Website Dashboard
- **Login User**: Login dengan Google Account
- **Login Teknisi**: Username/password (default: admin/admin123)
- **Dashboard Real-time**: Monitoring sensor dan status device
- **Kontrol Device**: On/Off relay, LED brightness, motor speed
- **Monitoring**: Grafik sensor temperature, humidity, light
- **Automation**: Buat aturan otomatis (IF sensor > value THEN device ON/OFF)
- **User Management**: Teknisi dapat menambah user baru

### ESP32 Features
- WiFi AP + Station mode
- WebSocket real-time communication
- Sensor support: DHT22 (temp/humidity), Light sensor, Motion sensor
- Aktuator: 4x Relay, PWM LED, PWM Motor
- Automation rules processing
- Google Sheets data logging

## 📁 Struktur Project

```
esp32/
├── website/           # React Web Application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React Context (Auth, Device)
│   │   ├── services/      # API services
│   │   └── config/        # Configuration
│   └── google-apps-script.js  # Google Sheets integration
│
└── esp32/             # PlatformIO ESP32 Project
    └── src/
        └── main.cpp   # Main ESP32 program
```

## 🚀 Getting Started

### Website Setup

1. Install dependencies:
```bash
cd website
npm install
```

2. Configure Google OAuth:
   - Buka [Google Cloud Console](https://console.cloud.google.com)
   - Buat OAuth 2.0 Client ID
   - Update `src/config/constants.js` dengan Client ID

3. Setup Google Sheets:
   - Buka spreadsheet: https://docs.google.com/spreadsheets/d/1LiAg4kpJA85AXqO1iZKE4Urd8NB12sx49zcrOzXgJv8/edit
   - Extensions > Apps Script
   - Copy code dari `google-apps-script.js`
   - Deploy as Web App
   - Update URL di `src/config/constants.js`

4. Run development server:
```bash
npm run dev
```

### ESP32 Setup

1. Configure WiFi credentials di `src/main.cpp`:
```cpp
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
```

2. Build dan upload:
```bash
cd esp32
pio run --target upload
```

## 🔌 Pin Mapping ESP32

| Component | GPIO Pin | Description |
|-----------|----------|-------------|
| Relay 1 | 26 | Living Room Light |
| Relay 2 | 27 | Kitchen Light |
| Relay 3 | 14 | AC Unit |
| Relay 4 | 12 | Water Pump |
| LED | 25 | RGB LED Strip (PWM) |
| Motor | 33 | Curtain Motor (PWM) |
| DHT22 | 32 | Temperature & Humidity |
| Light Sensor | 34 | Analog light sensor |
| Motion Sensor | 35 | PIR Motion sensor |

## 👥 User Roles

### User (Google Login)
- View dashboard & monitoring
- Control devices
- View automation rules

### Technician (Username/Password)
- All user features
- Add/remove devices
- Create/edit automation rules
- Manage users

**Default Technician:**
- Username: `admin`
- Password: `admin123`

## 📱 Screenshots

### Login Page
![Login](./screenshots/login.png)

### Dashboard
![Dashboard](./screenshots/dashboard.png)

### Devices
![Devices](./screenshots/devices.png)

### Monitoring
![Monitoring](./screenshots/monitoring.png)

## 🔧 API Endpoints

### WebSocket Commands

```json
// Control device
{"type": "control", "id": "relay1", "state": true}

// Control LED with brightness
{"type": "control", "id": "led1", "state": true, "brightness": 75}

// Get current state
{"type": "get_state"}

// Add automation rule
{"type": "add_rule", "trigger": "temp1", "condition": ">", "value": 28, "action": "relay3", "actionState": true}
```

### WebSocket Messages from ESP32

```json
// Sensor data
{"type": "sensor_data", "sensors": [...]}

// Device state
{"type": "state", "devices": [...]}
```

## 📊 Google Sheets Structure

| Sheet | Columns |
|-------|---------|
| SensorData | Timestamp, DeviceId, SensorType, Value, Unit |
| DeviceStates | DeviceId, Name, Type, State, Value, LastUpdated |
| AutomationRules | RuleId, Name, Trigger, Condition, Value, Action, ActionState, Enabled |
| Users | UserId, Email, Name, Role, CreatedAt |
| ActivityLog | Timestamp, Action, User, Details |

## 📄 License

MIT License
