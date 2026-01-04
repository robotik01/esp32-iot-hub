/**
 * Google Apps Script for ESP32 IoT Control Hub
 * Updated to use 1 sheet per ESP32 device
 * 
 * Deploy this script as a Web App to enable Google Sheets integration
 * 
 * Setup Instructions:
 * 1. Open Google Sheets: https://docs.google.com/spreadsheets/d/1LiAg4kpJA85AXqO1iZKE4Urd8NB12sx49zcrOzXgJv8/edit
 * 2. Go to Extensions > Apps Script
 * 3. Copy this code and paste it
 * 4. Save and Deploy > New deployment > Web app
 * 5. Set "Who has access" to "Anyone"
 * 6. Copy the Web app URL and update ESP32 code & website config
 * 
 * Each ESP32 device gets its own sheet with naming format: ESP32_[DeviceID]
 * Each device sheet contains: Timestamp, SensorType, Value, Unit, RelayStates
 */

// Global sheet names
const AUTOMATION_RULES_SHEET = 'AutomationRules';
const USERS_SHEET = 'Users';
const ACTIVITY_LOG_SHEET = 'ActivityLog';
const DEVICE_LIST_SHEET = 'DeviceList';

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const action = e.parameter.action;
  let result = { success: false, error: 'Unknown action' };
  
  try {
    switch (action) {
      case 'log':
        result = logSensorData(e.parameter);
        break;
      case 'saveSensorData':
        result = saveSensorData(JSON.parse(e.parameter.deviceId), JSON.parse(e.parameter.value), JSON.parse(e.parameter.timestamp));
        break;
      case 'getSensorHistory':
        result = getSensorHistory(JSON.parse(e.parameter.deviceId), JSON.parse(e.parameter.limit));
        break;
      case 'saveDeviceState':
        result = saveDeviceState(JSON.parse(e.parameter.deviceId), JSON.parse(e.parameter.state));
        break;
      case 'getDeviceStates':
        result = getDeviceStates();
        break;
      case 'registerDevice':
        result = registerDevice(JSON.parse(e.parameter.device));
        break;
      case 'getDevices':
        result = getDevices();
        break;
      case 'saveAutomationRule':
        result = saveAutomationRule(JSON.parse(e.parameter.rule));
        break;
      case 'getAutomationRules':
        result = getAutomationRules();
        break;
      case 'deleteAutomationRule':
        result = deleteAutomationRule(JSON.parse(e.parameter.ruleId));
        break;
      case 'saveUser':
        result = saveUser(JSON.parse(e.parameter.user));
        break;
      case 'getUsers':
        result = getUsers();
        break;
      case 'deleteUser':
        result = deleteUser(JSON.parse(e.parameter.userId));
        break;
      case 'logActivity':
        result = logActivity(JSON.parse(e.parameter.activity));
        break;
      case 'getActivityLogs':
        result = getActivityLogs(JSON.parse(e.parameter.limit));
        break;
      default:
        result = { success: false, error: 'Unknown action: ' + action };
    }
  } catch (error) {
    result = { success: false, error: error.toString() };
  }
  
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// Initialize sheets if they don't exist
function initializeSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Device List Sheet
  let sheet = ss.getSheetByName(DEVICE_LIST_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(DEVICE_LIST_SHEET);
    sheet.appendRow(['DeviceId', 'Name', 'Type', 'IPAddress', 'LastSeen', 'Status']);
    sheet.getRange('A1:F1').setFontWeight('bold').setBackground('#4285f4').setFontColor('#ffffff');
  }
  
  // Automation Rules Sheet
  sheet = ss.getSheetByName(AUTOMATION_RULES_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(AUTOMATION_RULES_SHEET);
    sheet.appendRow(['RuleId', 'Name', 'Trigger', 'Condition', 'Value', 'Action', 'ActionState', 'Enabled']);
    sheet.getRange('A1:H1').setFontWeight('bold').setBackground('#4285f4').setFontColor('#ffffff');
  }
  
  // Users Sheet
  sheet = ss.getSheetByName(USERS_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(USERS_SHEET);
    sheet.appendRow(['UserId', 'Email', 'Name', 'Role', 'CreatedAt']);
    sheet.getRange('A1:E1').setFontWeight('bold').setBackground('#4285f4').setFontColor('#ffffff');
  }
  
  // Activity Log Sheet
  sheet = ss.getSheetByName(ACTIVITY_LOG_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(ACTIVITY_LOG_SHEET);
    sheet.appendRow(['Timestamp', 'Action', 'User', 'Details']);
    sheet.getRange('A1:D1').setFontWeight('bold').setBackground('#4285f4').setFontColor('#ffffff');
  }
}

// Get or create device-specific sheet
function getDeviceSheet(deviceId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = 'ESP32_' + deviceId;
  let sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(['Timestamp', 'Temperature', 'Humidity', 'Light', 'Motion', 'Relay1', 'Relay2', 'Relay3', 'Relay4', 'Notes']);
    sheet.getRange('A1:J1').setFontWeight('bold').setBackground('#34a853').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
    
    // Register device in device list
    registerDeviceInList(deviceId);
  }
  
  return sheet;
}

// Register device in device list
function registerDeviceInList(deviceId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(DEVICE_LIST_SHEET);
  
  if (!sheet) {
    initializeSheets();
    sheet = ss.getSheetByName(DEVICE_LIST_SHEET);
  }
  
  // Check if device already exists
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === deviceId) {
      // Update last seen
      sheet.getRange(i + 1, 5).setValue(new Date().toISOString());
      sheet.getRange(i + 1, 6).setValue('Active');
      return;
    }
  }
  
  // Add new device
  sheet.appendRow([deviceId, 'ESP32_' + deviceId, 'ESP32', '', new Date().toISOString(), 'Active']);
}

// Register or update device
function registerDevice(device) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(DEVICE_LIST_SHEET);
  
  if (!sheet) {
    initializeSheets();
    sheet = ss.getSheetByName(DEVICE_LIST_SHEET);
  }
  
  const data = sheet.getDataRange().getValues();
  let found = false;
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === device.id) {
      sheet.getRange(i + 1, 2).setValue(device.name || 'ESP32_' + device.id);
      sheet.getRange(i + 1, 3).setValue(device.type || 'ESP32');
      sheet.getRange(i + 1, 4).setValue(device.ip || '');
      sheet.getRange(i + 1, 5).setValue(new Date().toISOString());
      sheet.getRange(i + 1, 6).setValue('Active');
      found = true;
      break;
    }
  }
  
  if (!found) {
    sheet.appendRow([
      device.id,
      device.name || 'ESP32_' + device.id,
      device.type || 'ESP32',
      device.ip || '',
      new Date().toISOString(),
      'Active'
    ]);
    
    // Create device sheet
    getDeviceSheet(device.id);
  }
  
  return { success: true, message: 'Device registered successfully' };
}

// Get all devices
function getDevices() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(DEVICE_LIST_SHEET);
  
  if (!sheet) {
    return { success: true, data: [] };
  }
  
  const data = sheet.getDataRange().getValues();
  const devices = [];
  
  for (let i = 1; i < data.length; i++) {
    devices.push({
      id: data[i][0],
      name: data[i][1],
      type: data[i][2],
      ip: data[i][3],
      lastSeen: data[i][4],
      status: data[i][5]
    });
  }
  
  return { success: true, data: devices };
}

// Log sensor data from ESP32
function logSensorData(params) {
  const deviceId = params.deviceId || 'default';
  const sheet = getDeviceSheet(deviceId);
  
  const timestamp = new Date().toISOString();
  const temp = params.temp || '';
  const humidity = params.humidity || '';
  const light = params.light || '';
  const motion = params.motion || '';
  const relay1 = params.relay1 || '';
  const relay2 = params.relay2 || '';
  const relay3 = params.relay3 || '';
  const relay4 = params.relay4 || '';
  
  sheet.appendRow([timestamp, temp, humidity, light, motion, relay1, relay2, relay3, relay4, '']);
  
  // Update device last seen
  registerDeviceInList(deviceId);
  
  return { success: true, message: 'Data logged successfully to ESP32_' + deviceId };
}

// Save sensor data
function saveSensorData(deviceId, value, timestamp) {
  const sheet = getDeviceSheet(deviceId);
  
  // Get last row to update or create new row
  const lastRow = sheet.getLastRow();
  const lastTimestamp = lastRow > 1 ? sheet.getRange(lastRow, 1).getValue() : null;
  
  // If last entry is within 1 minute, update it; otherwise create new row
  const currentTime = new Date(timestamp);
  const shouldUpdate = lastTimestamp && (currentTime - new Date(lastTimestamp)) < 60000;
  
  if (shouldUpdate && lastRow > 1) {
    // Update existing row with new sensor data
    if (value.temperature !== undefined) sheet.getRange(lastRow, 2).setValue(value.temperature);
    if (value.humidity !== undefined) sheet.getRange(lastRow, 3).setValue(value.humidity);
    if (value.light !== undefined) sheet.getRange(lastRow, 4).setValue(value.light);
    if (value.motion !== undefined) sheet.getRange(lastRow, 5).setValue(value.motion);
  } else {
    // Create new row
    sheet.appendRow([
      timestamp,
      value.temperature || '',
      value.humidity || '',
      value.light || '',
      value.motion || '',
      value.relay1 || '',
      value.relay2 || '',
      value.relay3 || '',
      value.relay4 || '',
      ''
    ]);
  }
  
  registerDeviceInList(deviceId);
  
  return { success: true };
}

// Get sensor history
function getSensorHistory(deviceId, limit) {
  const sheet = getDeviceSheet(deviceId);
  
  if (!sheet) {
    return { success: true, data: [] };
  }
  
  const data = sheet.getDataRange().getValues();
  const history = [];
  
  // Start from row 2 (skip header) and get last 'limit' rows
  const startRow = Math.max(2, data.length - limit + 1);
  
  for (let i = startRow; i < data.length; i++) {
    history.push({
      timestamp: data[i][0],
      temperature: data[i][1],
      humidity: data[i][2],
      light: data[i][3],
      motion: data[i][4],
      relay1: data[i][5],
      relay2: data[i][6],
      relay3: data[i][7],
      relay4: data[i][8]
    });
  }
  
  return { success: true, data: history };
}

// Save device state (relay states)
function saveDeviceState(deviceId, state) {
  const sheet = getDeviceSheet(deviceId);
  const lastRow = sheet.getLastRow();
  
  if (lastRow > 1) {
    // Update relay states in the last row
    if (state.relay1 !== undefined) sheet.getRange(lastRow, 6).setValue(state.relay1);
    if (state.relay2 !== undefined) sheet.getRange(lastRow, 7).setValue(state.relay2);
    if (state.relay3 !== undefined) sheet.getRange(lastRow, 8).setValue(state.relay3);
    if (state.relay4 !== undefined) sheet.getRange(lastRow, 9).setValue(state.relay4);
  }
  
  registerDeviceInList(deviceId);
  
  return { success: true };
}

// Get all device states (from last row of each device sheet)
function getDeviceStates() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const deviceListSheet = ss.getSheetByName(DEVICE_LIST_SHEET);
  
  if (!deviceListSheet) {
    return { success: true, data: [] };
  }
  
  const deviceData = deviceListSheet.getDataRange().getValues();
  const states = [];
  
  for (let i = 1; i < deviceData.length; i++) {
    const deviceId = deviceData[i][0];
    const deviceSheet = ss.getSheetByName('ESP32_' + deviceId);
    
    if (deviceSheet) {
      const lastRow = deviceSheet.getLastRow();
      if (lastRow > 1) {
        const data = deviceSheet.getRange(lastRow, 1, 1, 10).getValues()[0];
        states.push({
          deviceId: deviceId,
          timestamp: data[0],
          temperature: data[1],
          humidity: data[2],
          light: data[3],
          motion: data[4],
          relay1: data[5],
          relay2: data[6],
          relay3: data[7],
          relay4: data[8]
        });
      }
    }
  }
  
  return { success: true, data: states };
}

// Save automation rule
function saveAutomationRule(rule) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(AUTOMATION_RULES_SHEET);
  
  if (!sheet) {
    initializeSheets();
    sheet = ss.getSheetByName(AUTOMATION_RULES_SHEET);
  }
  
  const ruleId = 'rule_' + Date.now();
  sheet.appendRow([
    ruleId,
    rule.name,
    rule.trigger,
    rule.condition,
    rule.value,
    rule.action,
    rule.actionState,
    true
  ]);
  
  return { success: true, ruleId: ruleId };
}

// Get automation rules
function getAutomationRules() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(AUTOMATION_RULES_SHEET);
  
  if (!sheet) {
    return { success: true, data: [] };
  }
  
  const data = sheet.getDataRange().getValues();
  const rules = [];
  
  for (let i = 1; i < data.length; i++) {
    rules.push({
      id: data[i][0],
      name: data[i][1],
      trigger: data[i][2],
      condition: data[i][3],
      value: data[i][4],
      action: data[i][5],
      actionState: data[i][6],
      enabled: data[i][7]
    });
  }
  
  return { success: true, data: rules };
}

// Delete automation rule
function deleteAutomationRule(ruleId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(AUTOMATION_RULES_SHEET);
  
  if (!sheet) {
    return { success: false, error: 'Sheet not found' };
  }
  
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === ruleId) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  
  return { success: false, error: 'Rule not found' };
}

// Save user
function saveUser(user) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(USERS_SHEET);
  
  if (!sheet) {
    initializeSheets();
    sheet = ss.getSheetByName(USERS_SHEET);
  }
  
  sheet.appendRow([
    user.id,
    user.email,
    user.name,
    user.role || 'user',
    new Date().toISOString()
  ]);
  
  return { success: true };
}

// Get users
function getUsers() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(USERS_SHEET);
  
  if (!sheet) {
    return { success: true, data: [] };
  }
  
  const data = sheet.getDataRange().getValues();
  const users = [];
  
  for (let i = 1; i < data.length; i++) {
    users.push({
      id: data[i][0],
      email: data[i][1],
      name: data[i][2],
      role: data[i][3],
      createdAt: data[i][4]
    });
  }
  
  return { success: true, data: users };
}

// Delete user
function deleteUser(userId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(USERS_SHEET);
  
  if (!sheet) {
    return { success: false, error: 'Sheet not found' };
  }
  
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userId) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  
  return { success: false, error: 'User not found' };
}

// Log activity
function logActivity(activity) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(ACTIVITY_LOG_SHEET);
  
  if (!sheet) {
    initializeSheets();
    sheet = ss.getSheetByName(ACTIVITY_LOG_SHEET);
  }
  
  sheet.appendRow([
    new Date().toISOString(),
    activity.action,
    activity.user,
    activity.details
  ]);
  
  return { success: true };
}

// Get activity logs
function getActivityLogs(limit) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(ACTIVITY_LOG_SHEET);
  
  if (!sheet) {
    return { success: true, data: [] };
  }
  
  const data = sheet.getDataRange().getValues();
  const logs = [];
  
  for (let i = data.length - 1; i > 0 && logs.length < limit; i--) {
    logs.push({
      timestamp: data[i][0],
      action: data[i][1],
      user: data[i][2],
      details: data[i][3]
    });
  }
  
  return { success: true, data: logs };
}

// Run this function once to initialize sheets
function setup() {
  initializeSheets();
  Logger.log('Sheets initialized successfully!');
}
