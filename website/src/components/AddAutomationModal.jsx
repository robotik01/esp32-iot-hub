import { useState } from 'react';
import { X, Zap } from 'lucide-react';
import { useDevice } from '../context/DeviceContext';

const AddAutomationModal = ({ isOpen, onClose }) => {
  const { devices, addAutomationRule } = useDevice();
  const [formData, setFormData] = useState({
    name: '',
    trigger: '',
    condition: '>',
    value: '',
    action: '',
    actionState: true
  });

  const sensors = devices.filter(d => d.type === 'sensor');
  const actuators = devices.filter(d => d.type !== 'sensor');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    addAutomationRule({
      name: formData.name,
      trigger: formData.trigger,
      condition: formData.condition,
      value: parseFloat(formData.value),
      action: formData.action,
      actionState: formData.actionState
    });

    onClose();
    setFormData({ name: '', trigger: '', condition: '>', value: '', action: '', actionState: true });
  };

  if (!isOpen) return null;

  const selectedSensor = sensors.find(s => s.id === formData.trigger);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="glass-card p-6 w-full max-w-md m-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold gradient-text">Create Automation Rule</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Rule Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-modern"
              placeholder="e.g., Auto Light Off"
              required
            />
          </div>

          <div className="p-4 rounded-xl bg-slate-800/50">
            <p className="text-sm text-cyan-400 mb-3">IF (Trigger Condition)</p>
            
            <div className="space-y-3">
              <select
                value={formData.trigger}
                onChange={(e) => setFormData({ ...formData, trigger: e.target.value })}
                className="input-modern"
                required
              >
                <option value="">Select Sensor</option>
                {sensors.map(sensor => (
                  <option key={sensor.id} value={sensor.id}>{sensor.name}</option>
                ))}
              </select>

              <div className="flex gap-2">
                <select
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                  className="input-modern w-24"
                >
                  <option value=">">{'>'}</option>
                  <option value="<">{'<'}</option>
                  <option value="==">{'=='}</option>
                  <option value=">=">{'>='}</option>
                  <option value="<=">{'<='}</option>
                </select>

                <input
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  className="input-modern flex-1"
                  placeholder="Value"
                  required
                />
                
                {selectedSensor && (
                  <span className="input-modern w-16 text-center bg-slate-700">
                    {selectedSensor.unit}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/50">
            <p className="text-sm text-green-400 mb-3">THEN (Action)</p>
            
            <div className="space-y-3">
              <select
                value={formData.action}
                onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                className="input-modern"
                required
              >
                <option value="">Select Device</option>
                {actuators.map(device => (
                  <option key={device.id} value={device.id}>{device.name}</option>
                ))}
              </select>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="actionState"
                    checked={formData.actionState === true}
                    onChange={() => setFormData({ ...formData, actionState: true })}
                    className="w-4 h-4 accent-cyan-500"
                  />
                  <span className="text-green-400">Turn ON</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="actionState"
                    checked={formData.actionState === false}
                    onChange={() => setFormData({ ...formData, actionState: false })}
                    className="w-4 h-4 accent-cyan-500"
                  />
                  <span className="text-red-400">Turn OFF</span>
                </label>
              </div>
            </div>
          </div>

          <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
            <Zap size={20} />
            Create Rule
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddAutomationModal;
