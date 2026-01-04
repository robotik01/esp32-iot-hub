import { useState } from 'react';
import { Plus, Zap, Trash2, ToggleLeft, ToggleRight, Edit } from 'lucide-react';
import { useDevice } from '../context/DeviceContext';
import { useAuth } from '../context/AuthContext';
import AddAutomationModal from '../components/AddAutomationModal';

const AutomationPage = () => {
  const { devices, automationRules, updateAutomationRule, removeAutomationRule } = useDevice();
  const { isTechnician } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);

  const getDeviceName = (id) => {
    const device = devices.find(d => d.id === id);
    return device?.name || id;
  };

  const getConditionText = (condition) => {
    switch (condition) {
      case '>': return 'greater than';
      case '<': return 'less than';
      case '==': return 'equals';
      case '>=': return 'greater or equal';
      case '<=': return 'less or equal';
      default: return condition;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold gradient-text">Automation</h1>
          <p className="text-slate-400">Create smart rules for automatic control</p>
        </div>
        
        {isTechnician && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            Create Rule
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <Zap size={24} className="text-yellow-400" />
            <span className="text-slate-400">Total Rules</span>
          </div>
          <p className="text-3xl font-bold">{automationRules.length}</p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <ToggleRight size={24} className="text-green-400" />
            <span className="text-slate-400">Active</span>
          </div>
          <p className="text-3xl font-bold text-green-400">
            {automationRules.filter(r => r.enabled).length}
          </p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <ToggleLeft size={24} className="text-slate-400" />
            <span className="text-slate-400">Inactive</span>
          </div>
          <p className="text-3xl font-bold text-slate-400">
            {automationRules.filter(r => !r.enabled).length}
          </p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <Zap size={24} className="text-cyan-400" />
            <span className="text-slate-400">Triggered Today</span>
          </div>
          <p className="text-3xl font-bold text-cyan-400">12</p>
        </div>
      </div>

      {/* Automation Rules List */}
      <div className="space-y-4">
        {automationRules.map(rule => (
          <div 
            key={rule.id}
            className={`glass-card p-5 border transition-all duration-300 ${
              rule.enabled ? 'border-cyan-500/30' : 'border-slate-600/30 opacity-60'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    rule.enabled 
                      ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20' 
                      : 'bg-slate-800'
                  }`}>
                    <Zap size={20} className={rule.enabled ? 'text-cyan-400' : 'text-slate-500'} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{rule.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      rule.enabled 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-slate-700 text-slate-400'
                    }`}>
                      {rule.enabled ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* Rule Logic */}
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="px-3 py-1 rounded-lg bg-cyan-500/10 text-cyan-400">
                    IF
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-slate-800">
                    {getDeviceName(rule.trigger)}
                  </span>
                  <span className="text-slate-400">
                    is {getConditionText(rule.condition)}
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-slate-800 font-mono">
                    {rule.value}
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-green-500/10 text-green-400">
                    THEN
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-slate-800">
                    {getDeviceName(rule.action)}
                  </span>
                  <span className={`px-3 py-1 rounded-lg ${
                    rule.actionState 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {rule.actionState ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateAutomationRule(rule.id, { enabled: !rule.enabled })}
                  className={`p-2 rounded-xl transition-all ${
                    rule.enabled 
                      ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {rule.enabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                </button>
                
                {isTechnician && (
                  <>
                    <button className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-all">
                      <Edit size={20} />
                    </button>
                    <button 
                      onClick={() => removeAutomationRule(rule.id)}
                      className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                    >
                      <Trash2 size={20} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {automationRules.length === 0 && (
        <div className="glass-card p-12 text-center">
          <div className="text-6xl mb-4">⚡</div>
          <h3 className="text-xl font-semibold mb-2">No automation rules</h3>
          <p className="text-slate-400 mb-4">
            Create your first automation rule to control devices automatically
          </p>
          {isTechnician && (
            <button 
              onClick={() => setShowAddModal(true)}
              className="btn-primary"
            >
              <Plus size={20} className="inline mr-2" />
              Create Rule
            </button>
          )}
        </div>
      )}

      {/* Add Automation Modal */}
      <AddAutomationModal 
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
    </div>
  );
};

export default AutomationPage;
