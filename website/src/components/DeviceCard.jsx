import { useDevice } from '../context/DeviceContext';

const DeviceCard = ({ device }) => {
  const { controlDevice } = useDevice();

  const handleToggle = () => {
    controlDevice(device.id, !device.state);
  };

  const getDeviceIcon = () => {
    switch (device.type) {
      case 'relay':
        return '💡';
      case 'led':
        return '🌈';
      case 'motor':
        return '⚙️';
      case 'sensor':
        switch (device.sensorType) {
          case 'temperature':
            return '🌡️';
          case 'humidity':
            return '💧';
          case 'light':
            return '☀️';
          case 'motion':
            return '🚶';
          default:
            return '📊';
        }
      default:
        return '📱';
    }
  };

  const getStatusColor = () => {
    if (device.type === 'sensor') {
      return 'border-cyan-500/30';
    }
    return device.state 
      ? 'border-green-500/30 glow-success' 
      : 'border-slate-600/30';
  };

  const formatValue = () => {
    if (device.type === 'sensor') {
      if (device.sensorType === 'motion') {
        return device.value ? 'Detected' : 'Clear';
      }
      return `${device.value} ${device.unit || ''}`;
    }
    return device.state ? 'ON' : 'OFF';
  };

  return (
    <div className={`glass-card p-5 border ${getStatusColor()} transition-all duration-300 hover:scale-[1.02]`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{getDeviceIcon()}</span>
          <div>
            <h3 className="font-semibold text-white">{device.name}</h3>
            <p className="text-xs text-slate-400 capitalize">{device.type} • Pin {device.pin}</p>
          </div>
        </div>
        
        {device.type !== 'sensor' && (
          <div 
            className={`toggle-switch ${device.state ? 'active' : ''}`}
            onClick={handleToggle}
          />
        )}
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold gradient-text">{formatValue()}</p>
        </div>
        
        {device.type === 'sensor' && device.sensorType !== 'motion' && (
          <div className={`w-3 h-3 rounded-full ${
            device.sensorType === 'motion' && device.value 
              ? 'bg-green-400 animate-pulse' 
              : 'bg-cyan-400'
          }`} />
        )}
        
        {device.type === 'sensor' && device.sensorType === 'motion' && (
          <div className={`w-3 h-3 rounded-full ${
            device.value ? 'bg-green-400 animate-pulse' : 'bg-slate-500'
          }`} />
        )}
      </div>

      {device.type === 'led' && device.state && (
        <div className="mt-4">
          <label className="text-xs text-slate-400 mb-2 block">Brightness</label>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={device.brightness || 100}
            onChange={(e) => controlDevice(device.id, true, { brightness: parseInt(e.target.value) })}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      )}

      {device.type === 'motor' && device.state && (
        <div className="mt-4">
          <label className="text-xs text-slate-400 mb-2 block">Speed</label>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={device.speed || 50}
            onChange={(e) => controlDevice(device.id, true, { speed: parseInt(e.target.value) })}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      )}
    </div>
  );
};

export default DeviceCard;
