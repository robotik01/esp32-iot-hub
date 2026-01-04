import { useState } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  Shield, 
  UserPlus,
  Eye,
  EyeOff,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const UsersPage = () => {
  const { isTechnician, getTechnicians, addTechnician, deleteTechnician } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isTechnician) {
    return (
      <div className="glass-card p-12 text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-slate-400">Only technicians can access user management</p>
      </div>
    );
  }

  const technicians = getTechnicians();

  const handleAddTechnician = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newUsername.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    const result = addTechnician(newUsername, newPassword);
    
    if (result.success) {
      setSuccess('Technician added successfully!');
      setNewUsername('');
      setNewPassword('');
      setTimeout(() => {
        setShowAddModal(false);
        setSuccess('');
      }, 1500);
    } else {
      setError(result.error);
    }
  };

  const handleDelete = (username) => {
    if (confirm(`Are you sure you want to delete technician "${username}"?`)) {
      const result = deleteTechnician(username);
      if (!result.success) {
        alert(result.error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold gradient-text">User Management</h1>
          <p className="text-slate-400">Manage technician accounts</p>
        </div>
        
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <UserPlus size={20} />
          Add Technician
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <Shield size={24} className="text-orange-400" />
            <span className="text-slate-400">Total Technicians</span>
          </div>
          <p className="text-3xl font-bold">{technicians.length}</p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <Users size={24} className="text-cyan-400" />
            <span className="text-slate-400">Google Users</span>
          </div>
          <p className="text-3xl font-bold text-cyan-400">∞</p>
          <p className="text-xs text-slate-500">Anyone with Google account</p>
        </div>
        <div className="glass-card p-5 col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3 mb-2">
            <Shield size={24} className="text-green-400" />
            <span className="text-slate-400">Access Level</span>
          </div>
          <p className="text-lg font-bold text-green-400">Full Control</p>
          <p className="text-xs text-slate-500">You have technician privileges</p>
        </div>
      </div>

      {/* Technicians List */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Shield size={20} className="text-orange-400" />
          Technician Accounts
        </h2>

        <div className="space-y-3">
          {technicians.map((tech, index) => (
            <div 
              key={tech.username}
              className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {tech.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold">{tech.username}</p>
                  <p className="text-sm text-slate-400">
                    {tech.username === 'admin' ? 'Default Admin' : 'Technician'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {tech.username === 'admin' ? (
                  <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs">
                    Protected
                  </span>
                ) : (
                  <button 
                    onClick={() => handleDelete(tech.username)}
                    className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Access Info */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Users size={20} className="text-cyan-400" />
          User Access
        </h2>

        <div className="p-4 rounded-xl bg-slate-800/50">
          <p className="text-slate-300 mb-2">
            Regular users can login using their <strong>Google Account</strong>.
          </p>
          <p className="text-sm text-slate-400">
            They have read access to monitoring data and can control devices, 
            but cannot add/remove devices or manage users.
          </p>
        </div>
      </div>

      {/* Add Technician Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-card p-6 w-full max-w-md m-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold gradient-text">Add Technician</h2>
              <button 
                onClick={() => { setShowAddModal(false); setError(''); setSuccess(''); }}
                className="text-slate-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
                {success}
              </div>
            )}

            <form onSubmit={handleAddTechnician} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Username</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="input-modern"
                  placeholder="Enter username"
                  required
                  minLength={3}
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input-modern pr-12"
                    placeholder="Enter password"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
                <Plus size={20} />
                Add Technician
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
