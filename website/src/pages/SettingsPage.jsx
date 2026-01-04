import { useState } from 'react';
import { 
  Settings, 
  Wifi, 
  Bell, 
  Moon, 
  Sun, 
  Save,
  RefreshCw,
  Database,
  Shield,
  Globe
} from 'lucide-react';
import { useDevice } from '../context/DeviceContext';
import { ESP32_CONFIG } from '../config/constants';

const SettingsPage = () => {
  const { connectToESP32, connectionStatus } = useDevice();
  const [wsUrl, setWsUrl] = useState(ESP32_CONFIG.WS_URL);
  const [settings, setSettings] = useState({
    darkMode: true,
    notifications: true,
    autoConnect: true,
    dataInterval: 5,
    retentionDays: 30
  });

  const handleConnect = () => {
    connectToESP32(wsUrl);
  };

  const handleSave = () => {
    localStorage.setItem('iot_settings', JSON.stringify(settings));
    alert('Settings saved successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold gradient-text">Settings</h1>
        <p className="text-slate-400">Configure your IoT system</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Connection Settings */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <Wifi size={20} className="text-cyan-400" />
            </div>
            <div>
              <h2 className="font-semibold">ESP32 Connection</h2>
              <p className="text-sm text-slate-400">WebSocket configuration</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">WebSocket URL</label>
              <input
                type="text"
                value={wsUrl}
                onChange={(e) => setWsUrl(e.target.value)}
                className="input-modern"
                placeholder="ws://192.168.4.1:81"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50">
              <span className="text-sm">Connection Status</span>
              <div className="flex items-center gap-2">
                <div className={connectionStatus === 'connected' ? 'status-online' : 'status-offline'} />
                <span className={connectionStatus === 'connected' ? 'text-green-400' : 'text-red-400'}>
                  {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>

            <button 
              onClick={handleConnect}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} />
              {connectionStatus === 'connected' ? 'Reconnect' : 'Connect'}
            </button>
          </div>
        </div>

        {/* Appearance Settings */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Moon size={20} className="text-purple-400" />
            </div>
            <div>
              <h2 className="font-semibold">Appearance</h2>
              <p className="text-sm text-slate-400">UI preferences</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50">
              <div className="flex items-center gap-3">
                {settings.darkMode ? <Moon size={18} /> : <Sun size={18} />}
                <span>Dark Mode</span>
              </div>
              <div 
                className={`toggle-switch ${settings.darkMode ? 'active' : ''}`}
                onClick={() => setSettings({ ...settings, darkMode: !settings.darkMode })}
              />
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <Bell size={20} className="text-yellow-400" />
            </div>
            <div>
              <h2 className="font-semibold">Notifications</h2>
              <p className="text-sm text-slate-400">Alert preferences</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50">
              <span>Push Notifications</span>
              <div 
                className={`toggle-switch ${settings.notifications ? 'active' : ''}`}
                onClick={() => setSettings({ ...settings, notifications: !settings.notifications })}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50">
              <span>Auto Connect on Load</span>
              <div 
                className={`toggle-switch ${settings.autoConnect ? 'active' : ''}`}
                onClick={() => setSettings({ ...settings, autoConnect: !settings.autoConnect })}
              />
            </div>
          </div>
        </div>

        {/* Data Settings */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <Database size={20} className="text-green-400" />
            </div>
            <div>
              <h2 className="font-semibold">Data Management</h2>
              <p className="text-sm text-slate-400">Sensor data settings</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Data Collection Interval (seconds)
              </label>
              <select
                value={settings.dataInterval}
                onChange={(e) => setSettings({ ...settings, dataInterval: parseInt(e.target.value) })}
                className="input-modern"
              >
                <option value={1}>1 second</option>
                <option value={5}>5 seconds</option>
                <option value={10}>10 seconds</option>
                <option value={30}>30 seconds</option>
                <option value={60}>1 minute</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Data Retention (days)
              </label>
              <select
                value={settings.retentionDays}
                onChange={(e) => setSettings({ ...settings, retentionDays: parseInt(e.target.value) })}
                className="input-modern"
              >
                <option value={7}>7 days</option>
                <option value={30}>30 days</option>
                <option value={90}>90 days</option>
                <option value={365}>1 year</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Google Sheets Integration */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <Globe size={20} className="text-blue-400" />
          </div>
          <div>
            <h2 className="font-semibold">Google Sheets Integration</h2>
            <p className="text-sm text-slate-400">Cloud data storage</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-800/50 mb-4">
          <p className="text-sm text-slate-400 mb-2">Connected Spreadsheet:</p>
          <a 
            href="https://docs.google.com/spreadsheets/d/1LiAg4kpJA85AXqO1iZKE4Urd8NB12sx49zcrOzXgJv8/edit"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:underline break-all"
          >
            https://docs.google.com/spreadsheets/d/1LiAg4kpJA85AXqO1iZKE4Urd8NB12sx49zcrOzXgJv8
          </a>
        </div>

        <div className="flex items-center gap-2 text-sm text-green-400">
          <Shield size={16} />
          <span>Data is synced to Google Sheets</span>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button onClick={handleSave} className="btn-primary flex items-center gap-2">
          <Save size={18} />
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
