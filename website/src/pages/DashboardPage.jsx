import { 
  Cpu, 
  Activity, 
  Zap, 
  Clock,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { useDevice } from '../context/DeviceContext';
import SensorChart from '../components/SensorChart';
import { CHART_COLORS } from '../config/constants';

const DashboardPage = () => {
  const { devices, sensorData, automationRules, connectionStatus } = useDevice();

  const sensors = devices.filter(d => d.type === 'sensor');
  const actuators = devices.filter(d => d.type !== 'sensor');
  const activeDevices = actuators.filter(d => d.state).length;
  const enabledRules = automationRules.filter(r => r.enabled).length;

  // Get current time
  const now = new Date();
  const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const dateString = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold gradient-text">Dashboard</h1>
          <p className="text-slate-400">{dateString}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="glass-card px-4 py-2 flex items-center gap-2">
            <Clock size={18} className="text-cyan-400" />
            <span className="font-mono text-lg">{timeString}</span>
          </div>
          <div className={`glass-card px-4 py-2 flex items-center gap-2 ${
            connectionStatus === 'connected' ? 'border-green-500/30' : 'border-red-500/30'
          }`}>
            <div className={connectionStatus === 'connected' ? 'status-online' : 'status-offline'} />
            <span className={connectionStatus === 'connected' ? 'text-green-400' : 'text-red-400'}>
              {connectionStatus === 'connected' ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
              <Cpu size={24} className="text-cyan-400" />
            </div>
            <TrendingUp size={18} className="text-green-400" />
          </div>
          <p className="text-3xl font-bold">{devices.length}</p>
          <p className="text-sm text-slate-400">Total Devices</p>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
              <Activity size={24} className="text-green-400" />
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">Live</span>
          </div>
          <p className="text-3xl font-bold">{activeDevices}</p>
          <p className="text-sm text-slate-400">Active Devices</p>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center">
              <Zap size={24} className="text-yellow-400" />
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400">Auto</span>
          </div>
          <p className="text-3xl font-bold">{enabledRules}</p>
          <p className="text-sm text-slate-400">Active Rules</p>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <AlertTriangle size={24} className="text-purple-400" />
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">OK</span>
          </div>
          <p className="text-3xl font-bold">0</p>
          <p className="text-sm text-slate-400">Alerts</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <SensorChart 
          data={sensorData.temperature || []}
          dataKey="temperature"
          title="🌡️ Temperature History"
          color={CHART_COLORS.danger}
          unit="°C"
        />
        <SensorChart 
          data={sensorData.humidity || []}
          dataKey="humidity"
          title="💧 Humidity History"
          color={CHART_COLORS.primary}
          unit="%"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <SensorChart 
          data={sensorData.light || []}
          dataKey="light"
          title="☀️ Light Level History"
          color={CHART_COLORS.warning}
          unit=" lux"
        />

        {/* Recent Activity */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4">📋 Recent Activity</h3>
          <div className="space-y-3">
            {[
              { time: '2 min ago', action: 'Living Room Light turned ON', type: 'success' },
              { time: '5 min ago', action: 'Temperature reached 28°C', type: 'warning' },
              { time: '12 min ago', action: 'AC Unit activated by automation', type: 'info' },
              { time: '25 min ago', action: 'Motion detected in Kitchen', type: 'default' },
              { time: '1 hour ago', action: 'System connected to ESP32', type: 'success' },
            ].map((activity, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50">
                <div className={`w-2 h-2 rounded-full ${
                  activity.type === 'success' ? 'bg-green-400' :
                  activity.type === 'warning' ? 'bg-yellow-400' :
                  activity.type === 'info' ? 'bg-cyan-400' : 'bg-slate-400'
                }`} />
                <div className="flex-1">
                  <p className="text-sm">{activity.action}</p>
                  <p className="text-xs text-slate-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
