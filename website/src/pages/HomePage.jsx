import { 
  Cpu, 
  Thermometer, 
  Droplets, 
  Sun, 
  Zap,
  Activity,
  Power,
  TrendingUp
} from 'lucide-react';
import { useDevice } from '../context/DeviceContext';
import { useAuth } from '../context/AuthContext';

const HomePage = () => {
  const { devices } = useDevice();
  const { user, isTechnician } = useAuth();

  const sensors = devices.filter(d => d.type === 'sensor');
  const actuators = devices.filter(d => d.type !== 'sensor');
  const activeDevices = actuators.filter(d => d.state).length;

  const getSensorValue = (type) => {
    const sensor = sensors.find(s => s.sensorType === type);
    return sensor ? sensor.value : 'N/A';
  };

  const getSensorUnit = (type) => {
    const sensor = sensors.find(s => s.sensorType === type);
    return sensor ? sensor.unit : '';
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="glass-card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              Welcome back, <span className="gradient-text">{user?.name || 'User'}</span>! 👋
            </h1>
            <p className="text-slate-400 mt-1">
              {isTechnician ? '🔧 Technician Dashboard' : 'Your smart home at a glance'}
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/30">
            <div className="status-online" />
            <span className="text-green-400 text-sm">System Online</span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 border border-cyan-500/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <Thermometer size={20} className="text-cyan-400" />
            </div>
            <span className="text-slate-400 text-sm">Temperature</span>
          </div>
          <p className="text-3xl font-bold">
            {getSensorValue('temperature')}
            <span className="text-lg text-slate-400">{getSensorUnit('temperature')}</span>
          </p>
        </div>

        <div className="glass-card p-5 border border-blue-500/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Droplets size={20} className="text-blue-400" />
            </div>
            <span className="text-slate-400 text-sm">Humidity</span>
          </div>
          <p className="text-3xl font-bold">
            {getSensorValue('humidity')}
            <span className="text-lg text-slate-400">{getSensorUnit('humidity')}</span>
          </p>
        </div>

        <div className="glass-card p-5 border border-yellow-500/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <Sun size={20} className="text-yellow-400" />
            </div>
            <span className="text-slate-400 text-sm">Light Level</span>
          </div>
          <p className="text-3xl font-bold">
            {getSensorValue('light')}
            <span className="text-lg text-slate-400">{getSensorUnit('light')}</span>
          </p>
        </div>

        <div className="glass-card p-5 border border-green-500/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <Power size={20} className="text-green-400" />
            </div>
            <span className="text-slate-400 text-sm">Active Devices</span>
          </div>
          <p className="text-3xl font-bold">
            {activeDevices}
            <span className="text-lg text-slate-400">/{actuators.length}</span>
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Device Status */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Cpu size={20} className="text-cyan-400" />
              Device Status
            </h2>
            <span className="text-xs text-slate-400 px-3 py-1 rounded-full bg-slate-800">
              {devices.length} devices
            </span>
          </div>
          
          <div className="space-y-3">
            {actuators.slice(0, 5).map(device => (
              <div 
                key={device.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">
                    {device.type === 'relay' ? '💡' : device.type === 'led' ? '🌈' : '⚙️'}
                  </span>
                  <div>
                    <p className="font-medium">{device.name}</p>
                    <p className="text-xs text-slate-400">Pin {device.pin}</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  device.state 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-slate-700 text-slate-400'
                }`}>
                  {device.state ? 'ON' : 'OFF'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sensor Readings */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Activity size={20} className="text-green-400" />
              Sensor Readings
            </h2>
            <span className="text-xs text-slate-400 px-3 py-1 rounded-full bg-slate-800">
              Live
            </span>
          </div>
          
          <div className="space-y-3">
            {sensors.map(sensor => (
              <div 
                key={sensor.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">
                    {sensor.sensorType === 'temperature' ? '🌡️' : 
                     sensor.sensorType === 'humidity' ? '💧' :
                     sensor.sensorType === 'light' ? '☀️' : '🚶'}
                  </span>
                  <div>
                    <p className="font-medium">{sensor.name}</p>
                    <p className="text-xs text-slate-400 capitalize">{sensor.sensorType}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold gradient-text">
                    {sensor.sensorType === 'motion' 
                      ? (sensor.value ? 'Detected' : 'Clear')
                      : `${sensor.value} ${sensor.unit}`
                    }
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Zap size={20} className="text-yellow-400" />
          Quick Actions
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30 hover:scale-105 transition-all duration-300">
            <div className="text-3xl mb-2">🔴</div>
            <p className="text-sm font-medium">All Off</p>
          </button>
          <button className="p-4 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 hover:scale-105 transition-all duration-300">
            <div className="text-3xl mb-2">🟢</div>
            <p className="text-sm font-medium">All On</p>
          </button>
          <button className="p-4 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 hover:scale-105 transition-all duration-300">
            <div className="text-3xl mb-2">🌙</div>
            <p className="text-sm font-medium">Night Mode</p>
          </button>
          <button className="p-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 hover:scale-105 transition-all duration-300">
            <div className="text-3xl mb-2">🏠</div>
            <p className="text-sm font-medium">Away Mode</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
