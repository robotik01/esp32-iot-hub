import { useState } from 'react';
import { Plus, Grid, List, Search, Filter } from 'lucide-react';
import { useDevice } from '../context/DeviceContext';
import { useAuth } from '../context/AuthContext';
import DeviceCard from '../components/DeviceCard';
import AddDeviceModal from '../components/AddDeviceModal';

const DevicesPage = () => {
  const { devices, removeDevice } = useDevice();
  const { isTechnician } = useAuth();
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredDevices = devices.filter(device => {
    const matchesSearch = device.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || device.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const actuators = filteredDevices.filter(d => d.type !== 'sensor');
  const sensors = filteredDevices.filter(d => d.type === 'sensor');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold gradient-text">Devices</h1>
          <p className="text-slate-400">Manage your IoT devices</p>
        </div>
        
        {isTechnician && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            Add Device
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="glass-card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search devices..."
              className="input-modern pl-12"
            />
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-slate-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="input-modern w-40"
            >
              <option value="all">All Types</option>
              <option value="relay">Relay</option>
              <option value="led">LED</option>
              <option value="motor">Motor</option>
              <option value="sensor">Sensor</option>
            </select>
          </div>

          {/* View Mode */}
          <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-800">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'grid' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400'
              }`}
            >
              <Grid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'list' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400'
              }`}
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Actuators Section */}
      {actuators.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span>🎛️</span> Control Devices
            <span className="text-sm font-normal text-slate-400">({actuators.length})</span>
          </h2>
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'space-y-4'
          }>
            {actuators.map(device => (
              <DeviceCard key={device.id} device={device} />
            ))}
          </div>
        </div>
      )}

      {/* Sensors Section */}
      {sensors.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span>📊</span> Sensors
            <span className="text-sm font-normal text-slate-400">({sensors.length})</span>
          </h2>
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'space-y-4'
          }>
            {sensors.map(device => (
              <DeviceCard key={device.id} device={device} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredDevices.length === 0 && (
        <div className="glass-card p-12 text-center">
          <div className="text-6xl mb-4">🔌</div>
          <h3 className="text-xl font-semibold mb-2">No devices found</h3>
          <p className="text-slate-400 mb-4">
            {searchTerm || filterType !== 'all' 
              ? 'Try adjusting your search or filter'
              : 'Add your first device to get started'
            }
          </p>
          {isTechnician && !searchTerm && filterType === 'all' && (
            <button 
              onClick={() => setShowAddModal(true)}
              className="btn-primary"
            >
              <Plus size={20} className="inline mr-2" />
              Add Device
            </button>
          )}
        </div>
      )}

      {/* Add Device Modal */}
      <AddDeviceModal 
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
    </div>
  );
};

export default DevicesPage;
