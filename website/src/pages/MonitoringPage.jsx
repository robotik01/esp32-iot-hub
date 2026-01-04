import { useState } from 'react';
import { Activity, RefreshCw } from 'lucide-react';
import { useDevice } from '../context/DeviceContext';
import SensorChart from '../components/SensorChart';
import { CHART_COLORS } from '../config/constants';

const MonitoringPage = () => {
  const { devices, sensorData } = useDevice();
  const [selectedSensor, setSelectedSensor] = useState('all');

  const sensors = devices.filter(d => d.type === 'sensor');

  const getSensorIcon = (type) => {
    switch (type) {
      case 'temperature': return '🌡️';
      case 'humidity': return '💧';
      case 'light': return '☀️';
      case 'motion': return '🚶';
      case 'pressure': return '📊';
      case 'gas': return '💨';
      default: return '📈';
    }
  };

  const getSensorColor = (type) => {
    switch (type) {
      case 'temperature': return CHART_COLORS.danger;
      case 'humidity': return CHART_COLORS.primary;
      case 'light': return CHART_COLORS.warning;
      case 'motion': return CHART_COLORS.success;
      default: return CHART_COLORS.secondary;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold gradient-text">Monitoring</h1>
          <p className="text-slate-400">Real-time sensor data and analytics</p>
        </div>
        
        <button className="btn-primary flex items-center gap-2">
          <RefreshCw size={18} />
          Refresh Data
        </button>
      </div>

      {/* Live Sensor Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {sensors.map(sensor => (
          <div 
            key={sensor.id}
            onClick={() => setSelectedSensor(sensor.sensorType)}
            className={`glass-card p-5 cursor-pointer transition-all duration-300 hover:scale-105 ${
              selectedSensor === sensor.sensorType ? 'border-cyan-500/50 glow-primary' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-3xl">{getSensorIcon(sensor.sensorType)}</span>
              <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
            </div>
            <p className="text-sm text-slate-400 capitalize">{sensor.sensorType}</p>
            <p className="text-2xl font-bold gradient-text mt-1">
              {sensor.sensorType === 'motion' 
                ? (sensor.value ? 'Detected' : 'Clear')
                : `${sensor.value} ${sensor.unit}`
              }
            </p>
            <p className="text-xs text-slate-500 mt-2">{sensor.name}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedSensor('all')}
          className={`px-4 py-2 rounded-xl transition-all ${
            selectedSensor === 'all'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
          }`}
        >
          All Sensors
        </button>
        {['temperature', 'humidity', 'light'].map(type => (
          <button
            key={type}
            onClick={() => setSelectedSensor(type)}
            className={`px-4 py-2 rounded-xl transition-all capitalize ${
              selectedSensor === type
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
            }`}
          >
            {getSensorIcon(type)} {type}
          </button>
        ))}
      </div>

      {/* Charts */}
      <div className="space-y-6">
        {(selectedSensor === 'all' || selectedSensor === 'temperature') && (
          <SensorChart 
            data={sensorData.temperature || []}
            dataKey="temperature"
            title="🌡️ Temperature Over Time"
            color={CHART_COLORS.danger}
            unit="°C"
          />
        )}
        
        {(selectedSensor === 'all' || selectedSensor === 'humidity') && (
          <SensorChart 
            data={sensorData.humidity || []}
            dataKey="humidity"
            title="💧 Humidity Over Time"
            color={CHART_COLORS.primary}
            unit="%"
          />
        )}
        
        {(selectedSensor === 'all' || selectedSensor === 'light') && (
          <SensorChart 
            data={sensorData.light || []}
            dataKey="light"
            title="☀️ Light Level Over Time"
            color={CHART_COLORS.warning}
            unit=" lux"
          />
        )}
      </div>

      {/* Stats Summary */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Activity size={20} className="text-cyan-400" />
          Statistics Summary
        </h3>
        
        <div className="grid md:grid-cols-3 gap-6">
          {['temperature', 'humidity', 'light'].map(type => {
            const data = sensorData[type] || [];
            const values = data.map(d => d.value);
            const min = values.length ? Math.min(...values).toFixed(1) : 'N/A';
            const max = values.length ? Math.max(...values).toFixed(1) : 'N/A';
            const avg = values.length ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : 'N/A';
            
            const sensor = sensors.find(s => s.sensorType === type);
            const unit = sensor?.unit || '';

            return (
              <div key={type} className="p-4 rounded-xl bg-slate-800/50">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{getSensorIcon(type)}</span>
                  <span className="font-medium capitalize">{type}</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-slate-400">Min</p>
                    <p className="text-lg font-bold text-blue-400">{min}{unit}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Avg</p>
                    <p className="text-lg font-bold text-cyan-400">{avg}{unit}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Max</p>
                    <p className="text-lg font-bold text-red-400">{max}{unit}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MonitoringPage;
