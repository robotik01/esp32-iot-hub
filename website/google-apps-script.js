/**
 * Google Apps Script for ESP32 IoT Control Hub
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
 */

// Sheet names
const SENSOR_DATA_SHEET = 'SensorData';
const DEVICE_STATES_SHEET = 'DeviceStates';
const AUTOMATION_RULES_SHEET = 'AutomationRules';
const USERS_SHEET = 'Users';
const ACTIVITY_LOG_SHEET = 'ActivityLog';

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
  
  // Sensor Data Sheet
  let sheet = ss.getSheetByName(SENSOR_DATA_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(SENSOR_DATA_SHEET);
    sheet.appendRow(['Timestamp', 'DeviceId', 'SensorType', 'Value', 'Unit']);
  }
  
  // Device States Sheet
  sheet = ss.getSheetByName(DEVICE_STATES_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(DEVICE_STATES_SHEET);
    sheet.appendRow(['DeviceId', 'Name', 'Type', 'State', 'Value', 'LastUpdated']);
  }
  
  // Automation Rules Sheet
  sheet = ss.getSheetByName(AUTOMATION_RULES_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(AUTOMATION_RULES_SHEET);
    sheet.appendRow(['RuleId', 'Name', 'Trigger', 'Condition', 'Value', 'Action', 'ActionState', 'Enabled']);
  }
  
  // Users Sheet
  sheet = ss.getSheetByName(USERS_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(USERS_SHEET);
    sheet.appendRow(['UserId', 'Email', 'Name', 'Role', 'CreatedAt']);
  }
  
  // Activity Log Sheet
  sheet = ss.getSheetByName(ACTIVITY_LOG_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(ACTIVITY_LOG_SHEET);
    sheet.appendRow(['Timestamp', 'Action', 'User', 'Details']);
  }
}

// Log sensor data from ESP32
function logSensorData(params) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SENSOR_DATA_SHEET);
  
  if (!sheet) {
    initializeSheets();
    sheet = ss.getSheetByName(SENSOR_DATA_SHEET);
  }
  
  const timestamp = new Date().toISOString();
  
  // Log each sensor value
  if (params.temp) {
    sheet.appendRow([timestamp, 'temp1', 'temperature', parseFloat(params.temp), '°C']);
  }
  if (params.humidity) {
    sheet.appendRow([timestamp, 'hum1', 'humidity', parseFloat(params.humidity), '%']);
  }
  if (params.light) {
    sheet.appendRow([timestamp, 'light1', 'light', parseInt(params.light), 'lux']);
  }
  if (params.motion !== undefined) {
    sheet.appendRow([timestamp, 'motion1', 'motion', params.motion === '1', '']);
  }
  
  // Update device states
  updateDeviceStatesFromLog(params);
  
  return { success: true, message: 'Data logged successfully' };
}

function updateDeviceStatesFromLog(params) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(DEVICE_STATES_SHEET);
  
  if (!sheet) return;
  
  const timestamp = new Date().toISOString();
  const relays = ['relay1', 'relay2', 'relay3', 'relay4'];
  
  relays.forEach((relayId, index) => {
    const paramKey = relayId;
    if (params[paramKey] !== undefined) {
      updateOrInsertDeviceState(sheet, relayId, params[paramKey] === '1', timestamp);
    }
  });
}

function updateOrInsertDeviceState(sheet, deviceId, state, timestamp) {
  const data = sheet.getDataRange().getValues();
  let rowIndex = -1;
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === deviceId) {
      rowIndex = i + 1;
      break;
    }
  }
  
  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 4).setValue(state);
    sheet.getRange(rowIndex, 6).setValue(timestamp);
  } else {
    sheet.appendRow([deviceId, deviceId, 'relay', state, '', timestamp]);
  }
}

// Save sensor data
function saveSensorData(deviceId, value, timestamp) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SENSOR_DATA_SHEET);
  
  if (!sheet) {
    initializeSheets();
    sheet = ss.getSheetByName(SENSOR_DATA_SHEET);
  }
  
  sheet.appendRow([timestamp, deviceId, '', value, '']);
  
  return { success: true };
}

// Get sensor history
function getSensorHistory(deviceId, limit) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SENSOR_DATA_SHEET);
  
  if (!sheet) {
    return { success: true, data: [] };
  }
  
  const data = sheet.getDataRange().getValues();
  const history = [];
  
  for (let i = data.length - 1; i > 0 && history.length < limit; i--) {
    if (data[i][1] === deviceId) {
      history.push({
        timestamp: data[i][0],
        value: data[i][3],
        unit: data[i][4]
      });
    }
  }
  
  return { success: true, data: history.reverse() };
}

// Save device state
function saveDeviceState(deviceId, state) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(DEVICE_STATES_SHEET);
  
  if (!sheet) {
    initializeSheets();
    sheet = ss.getSheetByName(DEVICE_STATES_SHEET);
  }
  
  updateOrInsertDeviceState(sheet, deviceId, state, new Date().toISOString());
  
  return { success: true };
}

// Get all device states
function getDeviceStates() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(DEVICE_STATES_SHEET);
  
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
      state: data[i][3],
      value: data[i][4],
      lastUpdated: data[i][5]
    });
  }
  
  return { success: true, data: devices };
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
