import { GOOGLE_SHEETS_CONFIG } from '../config/constants';

// Google Sheets API Service via Apps Script
class GoogleSheetsService {
  constructor() {
    this.apiUrl = GOOGLE_SHEETS_CONFIG.API_URL;
    this.spreadsheetId = GOOGLE_SHEETS_CONFIG.SPREADSHEET_ID;
  }

  async request(action, params = {}) {
    try {
      const url = new URL(this.apiUrl);
      url.searchParams.append('action', action);
      url.searchParams.append('spreadsheetId', this.spreadsheetId);
      
      Object.entries(params).forEach(([key, value]) => {
        if (typeof value === 'object') {
          url.searchParams.append(key, JSON.stringify(value));
        } else {
          url.searchParams.append(key, value);
        }
      });

      const response = await fetch(url.toString(), {
        method: 'GET',
        redirect: 'follow'
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Error:', error);
      // Return mock data for demo mode
      return this.getMockResponse(action, params);
    }
  }

  // Mock responses for demo mode when Apps Script is not configured
  getMockResponse(action, params) {
    switch (action) {
      case 'login':
        return { success: false, error: 'Demo mode - use local storage' };
      case 'register':
        return { success: true, message: 'Registered in demo mode' };
      default:
        return { success: true, data: [] };
    }
  }

  // ============ AUTH ============
  async login(email, password) {
    return this.request('login', { email, password });
  }

  async register(userData) {
    return this.request('register', { user: userData });
  }

  async getUsers() {
    return this.request('getUsers');
  }

  async updateUser(userId, updates) {
    return this.request('updateUser', { userId, updates });
  }

  async deleteUser(userId) {
    return this.request('deleteUser', { userId });
  }

  // ============ DEVICES ============
  async getDevices() {
    return this.request('getDevices');
  }

  async saveDevice(device) {
    return this.request('saveDevice', { device });
  }

  async updateDevice(deviceId, updates) {
    return this.request('updateDevice', { deviceId, updates });
  }

  async deleteDevice(deviceId) {
    return this.request('deleteDevice', { deviceId });
  }

  // ============ SENSOR DATA ============
  async saveSensorData(deviceId, value, timestamp) {
    return this.request('saveSensorData', { deviceId, value, timestamp });
  }

  async getSensorHistory(deviceId, limit = 100) {
    return this.request('getSensorHistory', { deviceId, limit });
  }

  // ============ AUTOMATION ============
  async getAutomationRules() {
    return this.request('getAutomationRules');
  }

  async saveAutomationRule(rule) {
    return this.request('saveAutomationRule', { rule });
  }

  async updateAutomationRule(ruleId, updates) {
    return this.request('updateAutomationRule', { ruleId, updates });
  }

  async deleteAutomationRule(ruleId) {
    return this.request('deleteAutomationRule', { ruleId });
  }

  // ============ ESP32 DEVICES ============
  async getESP32Devices() {
    return this.request('getESP32Devices');
  }

  async saveESP32Device(device) {
    return this.request('saveESP32Device', { device });
  }

  async updateESP32Config(deviceId, config) {
    return this.request('updateESP32Config', { deviceId, config });
  }

  // ============ ACTIVITY LOG ============
  async logActivity(activity) {
    return this.request('logActivity', { activity });
  }

  async getActivityLogs(limit = 50) {
    return this.request('getActivityLogs', { limit });
  }

  // ============ NOTIFICATIONS ============
  async getNotifications(userId) {
    return this.request('getNotifications', { userId });
  }

  async markNotificationRead(notificationId) {
    return this.request('markNotificationRead', { notificationId });
  }

  // ============ SCHEDULES ============
  async getSchedules() {
    return this.request('getSchedules');
  }

  async saveSchedule(schedule) {
    return this.request('saveSchedule', { schedule });
  }

  async deleteSchedule(scheduleId) {
    return this.request('deleteSchedule', { scheduleId });
  }
}

export const sheetsService = new GoogleSheetsService();
export default sheetsService;
