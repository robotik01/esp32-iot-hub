// Google Sheets Configuration
export const GOOGLE_SHEETS_CONFIG = {
  SPREADSHEET_ID: '1LiAg4kpJA85AXqO1iZKE4Urd8NB12sx49zcrOzXgJv8',
  // Apps Script Web App URL - Replace with your deployed Apps Script URL
  API_URL: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec'
};

// Google OAuth Client ID - Replace with your Google Cloud Console OAuth Client ID
export const GOOGLE_OAUTH_CLIENT_ID = 'YOUR_GOOGLE_OAUTH_CLIENT_ID.apps.googleusercontent.com';

// Default Technician Credentials
export const DEFAULT_TECHNICIAN = {
  username: 'admin',
  password: 'admin123'
};

// ESP32 WebSocket Configuration
export const ESP32_CONFIG = {
  WS_URL: 'ws://192.168.4.1:81', // Default ESP32 AP mode
  RECONNECT_INTERVAL: 5000
};

// Device Types
export const DEVICE_TYPES = {
  SENSOR: 'sensor',
  ACTUATOR: 'actuator',
  RELAY: 'relay',
  LED: 'led',
  MOTOR: 'motor'
};

// Sensor Types
export const SENSOR_TYPES = {
  TEMPERATURE: 'temperature',
  HUMIDITY: 'humidity',
  PRESSURE: 'pressure',
  LIGHT: 'light',
  MOTION: 'motion',
  GAS: 'gas',
  WATER_LEVEL: 'water_level'
};

// Chart Colors
export const CHART_COLORS = {
  primary: '#0ea5e9',
  secondary: '#6366f1',
  accent: '#22d3ee',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444'
};
