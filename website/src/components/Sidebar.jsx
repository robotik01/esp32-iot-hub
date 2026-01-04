import { 
  Home, 
  LayoutDashboard, 
  Cpu, 
  Activity, 
  Settings, 
  Zap, 
  Users,
  LogOut,
  Menu,
  X,
  Wifi,
  WifiOff
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDevice } from '../context/DeviceContext';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, isTechnician, logout } = useAuth();
  const { connectionStatus } = useDevice();

  const userMenuItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/devices', icon: Cpu, label: 'Devices' },
    { path: '/monitoring', icon: Activity, label: 'Monitoring' },
    { path: '/automation', icon: Zap, label: 'Automation' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  const technicianMenuItems = [
    ...userMenuItems,
    { path: '/users', icon: Users, label: 'User Management' },
  ];

  const menuItems = isTechnician ? technicianMenuItems : userMenuItems;

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile Menu Button */}
      <button 
        className="lg:hidden fixed top-4 left-4 z-50 p-2 glass-card"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-72 glass-card m-4 p-6
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
            <Cpu size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold gradient-text">IoT Control</h1>
            <p className="text-xs text-slate-400">Smart Automation</p>
          </div>
        </div>

        {/* Connection Status */}
        <div className="mb-6 p-3 rounded-xl bg-slate-800/50">
          <div className="flex items-center gap-2">
            {connectionStatus === 'connected' ? (
              <>
                <Wifi size={18} className="text-green-400" />
                <span className="text-sm text-green-400">Connected to ESP32</span>
              </>
            ) : (
              <>
                <WifiOff size={18} className="text-red-400" />
                <span className="text-sm text-red-400">Disconnected</span>
              </>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl
                transition-all duration-300
                ${isActive(item.path) 
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}
              `}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* User Info */}
        <div className="absolute bottom-6 left-6 right-6">
          <div className="p-4 rounded-xl bg-slate-800/50 mb-4">
            <div className="flex items-center gap-3">
              {user?.picture ? (
                <img 
                  src={user.picture} 
                  alt={user.name}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
                  <span className="text-white font-bold">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-slate-400 truncate">
                  {isTechnician ? '🔧 Technician' : '👤 User'}
                </p>
              </div>
            </div>
          </div>
          
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl
              bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all duration-300"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
