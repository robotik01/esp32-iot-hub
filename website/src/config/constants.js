// Google Sheets Configuration
export const GOOGLE_SHEETS_CONFIG = {
  SPREADSHEET_ID: '1LiAg4kpJA85AXqO1iZKE4Urd8NB12sx49zcrOzXgJv8',
  // Apps Script Web App URL - Deploy the google-apps-script.js and paste URL here
  API_URL: 'https://script.google.com/macros/s/AKfycbxExample/exec'
};

// Default Admin Credentials
export const DEFAULT_ADMIN = {
  email: 'admin@iothub.local',
  password: 'admin123',
  name: 'Administrator',
  role: 'admin'
};

// ESP32 WebSocket Configuration
export const ESP32_CONFIG = {
  WS_URL: 'ws://192.168.4.1:81', // Default ESP32 AP mode
  RECONNECT_INTERVAL: 5000,
  SERIAL_BAUD_RATES: [9600, 19200, 38400, 57600, 115200],
  DEFAULT_BAUD: 115200
};

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  TECHNICIAN: 'technician',
  USER: 'user'
};

// Device Types
export const DEVICE_TYPES = {
  SENSOR: 'sensor',
  ACTUATOR: 'actuator',
  RELAY: 'relay',
  LED: 'led',
  MOTOR: 'motor',
  SERVO: 'servo',
  BUZZER: 'buzzer',
  FAN: 'fan',
  PUMP: 'pump',
  VALVE: 'valve'
};

// Sensor Types
export const SENSOR_TYPES = {
  TEMPERATURE: 'temperature',
  HUMIDITY: 'humidity',
  PRESSURE: 'pressure',
  LIGHT: 'light',
  MOTION: 'motion',
  GAS: 'gas',
  WATER_LEVEL: 'water_level',
  SOIL_MOISTURE: 'soil_moisture',
  DISTANCE: 'distance',
  CURRENT: 'current',
  VOLTAGE: 'voltage',
  POWER: 'power',
  PH: 'ph',
  TDS: 'tds',
  FLOW: 'flow'
};

// ESP32 GPIO Pins
export const ESP32_PINS = {
  ESP32_DEVKIT: [0, 2, 4, 5, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33, 34, 35, 36, 39],
  LOLIN_S2_MINI: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 21, 33, 34, 35, 36, 37, 38, 39, 40]
};

// Chart Colors
export const CHART_COLORS = {
  primary: '#0ea5e9',
  secondary: '#6366f1',
  accent: '#22d3ee',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#a855f7',
  pink: '#ec4899'
};
