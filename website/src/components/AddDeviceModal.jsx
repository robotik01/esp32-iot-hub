import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { useDevice } from '../context/DeviceContext';

const AddDeviceModal = ({ isOpen, onClose }) => {
  const { addDevice } = useDevice();
  const [formData, setFormData] = useState({
    name: '',
    type: 'relay',
    sensorType: 'temperature',
    pin: '',
    unit: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const device = {
      name: formData.name,
      type: formData.type,
      pin: parseInt(formData.pin),
      state: false
    };

    if (formData.type === 'sensor') {
      device.sensorType = formData.sensorType;
      device.value = 0;
      device.unit = formData.unit || getDefaultUnit(formData.sensorType);
    }

    if (formData.type === 'led') {
      device.brightness = 100;
    }

    if (formData.type === 'motor') {
      device.speed = 50;
    }

    addDevice(device);
    onClose();
    setFormData({ name: '', type: 'relay', sensorType: 'temperature', pin: '', unit: '' });
  };

  const getDefaultUnit = (sensorType) => {
    switch (sensorType) {
      case 'temperature': return '°C';
      case 'humidity': return '%';
      case 'light': return 'lux';
      case 'pressure': return 'hPa';
      default: return '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="glass-card p-6 w-full max-w-md m-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold gradient-text">Add New Device</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Device Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-modern"
              placeholder="e.g., Living Room Light"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Device Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="input-modern"
            >
              <option value="relay">Relay</option>
              <option value="led">LED</option>
              <option value="motor">Motor</option>
              <option value="sensor">Sensor</option>
            </select>
          </div>

          {formData.type === 'sensor' && (
            <>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Sensor Type</label>
                <select
                  value={formData.sensorType}
                  onChange={(e) => setFormData({ ...formData, sensorType: e.target.value })}
                  className="input-modern"
                >
                  <option value="temperature">Temperature</option>
                  <option value="humidity">Humidity</option>
                  <option value="light">Light</option>
                  <option value="motion">Motion</option>
                  <option value="pressure">Pressure</option>
                  <option value="gas">Gas</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Unit (optional)</label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="input-modern"
                  placeholder={getDefaultUnit(formData.sensorType)}
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm text-slate-400 mb-2">GPIO Pin</label>
            <input
              type="number"
              value={formData.pin}
              onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
              className="input-modern"
              placeholder="e.g., 26"
              min="0"
              max="39"
              required
            />
          </div>

          <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
            <Plus size={20} />
            Add Device
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddDeviceModal;
