import { GOOGLE_SHEETS_CONFIG } from '../config/constants';

// Google Sheets API Service
// Uses Google Apps Script as a proxy to interact with the spreadsheet

class GoogleSheetsService {
  constructor() {
    this.apiUrl = GOOGLE_SHEETS_CONFIG.API_URL;
    this.spreadsheetId = GOOGLE_SHEETS_CONFIG.SPREADSHEET_ID;
  }

  // Generic fetch wrapper
  async fetchData(action, params = {}) {
    try {
      const url = new URL(this.apiUrl);
      url.searchParams.append('action', action);
      url.searchParams.append('spreadsheetId', this.spreadsheetId);
      
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, JSON.stringify(value));
      });

      const response = await fetch(url.toString());
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      return data;
    } catch (error) {
      console.error('Google Sheets API error:', error);
      throw error;
    }
  }

  // Save sensor data
  async saveSensorData(deviceId, value, timestamp = new Date().toISOString()) {
    return this.fetchData('saveSensorData', { deviceId, value, timestamp });
  }

  // Get sensor history
  async getSensorHistory(deviceId, limit = 100) {
    return this.fetchData('getSensorHistory', { deviceId, limit });
  }

  // Save device state
  async saveDeviceState(deviceId, state) {
    return this.fetchData('saveDeviceState', { deviceId, state });
  }

  // Get all device states
  async getDeviceStates() {
    return this.fetchData('getDeviceStates', {});
  }

  // Save automation rule
  async saveAutomationRule(rule) {
    return this.fetchData('saveAutomationRule', { rule });
  }

  // Get automation rules
  async getAutomationRules() {
    return this.fetchData('getAutomationRules', {});
  }

  // Delete automation rule
  async deleteAutomationRule(ruleId) {
    return this.fetchData('deleteAutomationRule', { ruleId });
  }

  // Save user
  async saveUser(user) {
    return this.fetchData('saveUser', { user });
  }

  // Get users
  async getUsers() {
    return this.fetchData('getUsers', {});
  }

  // Delete user
  async deleteUser(userId) {
    return this.fetchData('deleteUser', { userId });
  }

  // Log activity
  async logActivity(activity) {
    return this.fetchData('logActivity', { activity });
  }

  // Get activity logs
  async getActivityLogs(limit = 50) {
    return this.fetchData('getActivityLogs', { limit });
  }
}

export const sheetsService = new GoogleSheetsService();
export default sheetsService;
