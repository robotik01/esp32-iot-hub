import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { Cpu, Shield, User, Eye, EyeOff } from 'lucide-react';

const LoginPage = () => {
  const { loginWithGoogle, loginTechnician } = useAuth();
  const [loginType, setLoginType] = useState('user'); // 'user' or 'technician'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleTechnicianLogin = (e) => {
    e.preventDefault();
    setError('');
    
    const result = loginTechnician(username, password);
    if (!result.success) {
      setError(result.error);
    }
  };

  const handleGoogleSuccess = (credentialResponse) => {
    const result = loginWithGoogle(credentialResponse);
    if (!result.success) {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <div className="glass-card p-8 w-full max-w-md relative">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center mb-4 glow-primary">
            <Cpu size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">IoT Control Hub</h1>
          <p className="text-slate-400 text-center mt-2">
            Smart Monitoring & Automation System
          </p>
        </div>

        {/* Login Type Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => { setLoginType('user'); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all duration-300 ${
              loginType === 'user'
                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:bg-slate-800/50'
            }`}
          >
            <User size={18} />
            <span>User</span>
          </button>
          <button
            onClick={() => { setLoginType('technician'); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all duration-300 ${
              loginType === 'technician'
                ? 'bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-400 border border-orange-500/30'
                : 'text-slate-400 hover:bg-slate-800/50'
            }`}
          >
            <Shield size={18} />
            <span>Technician</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {loginType === 'user' ? (
          <div className="space-y-4">
            <p className="text-center text-slate-400 text-sm mb-4">
              Sign in with your Google account to access the dashboard
            </p>
            
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google login failed')}
                theme="filled_black"
                size="large"
                width="100%"
                text="signin_with"
                shape="rectangular"
              />
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-[#0f172a] text-slate-400">Demo Mode</span>
              </div>
            </div>

            <button
              onClick={() => {
                // Demo login for testing without Google OAuth
                const demoUser = {
                  id: 'demo_user',
                  email: 'demo@example.com',
                  name: 'Demo User',
                  loginType: 'demo'
                };
                localStorage.setItem('iot_user', JSON.stringify(demoUser));
                localStorage.setItem('iot_role', 'user');
                window.location.reload();
              }}
              className="w-full py-3 rounded-xl border border-slate-600 text-slate-400 hover:bg-slate-800/50 transition-all duration-300"
            >
              Continue as Demo User
            </button>
          </div>
        ) : (
          <form onSubmit={handleTechnicianLogin} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-modern"
                placeholder="Enter username"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-modern pr-12"
                  placeholder="Enter password"
                  required
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

            <button type="submit" className="btn-primary w-full">
              Login as Technician
            </button>

            <p className="text-center text-xs text-slate-500 mt-4">
              Default: admin / admin123
            </p>
          </form>
        )}

        {/* Features */}
        <div className="mt-8 pt-6 border-t border-slate-700">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl mb-1">📊</div>
              <p className="text-xs text-slate-400">Real-time Monitoring</p>
            </div>
            <div>
              <div className="text-2xl mb-1">🎛️</div>
              <p className="text-xs text-slate-400">Device Control</p>
            </div>
            <div>
              <div className="text-2xl mb-1">⚡</div>
              <p className="text-xs text-slate-400">Automation</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
