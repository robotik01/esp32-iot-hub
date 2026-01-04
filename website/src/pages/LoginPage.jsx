import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Cpu, Shield, User, Eye, EyeOff, Mail, Lock, UserPlus, LogIn, Loader2, CheckCircle, AlertCircle, Wifi, WifiOff } from 'lucide-react';

const LoginPage = () => {
  const { signIn, signUp, isOnline } = useAuth();
  const [mode, setMode] = useState('signin'); // 'signin' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      const result = await signIn(email, password);
      if (!result.success) {
        setError(result.error);
      } else {
        setSuccess('Login berhasil! Mengalihkan...');
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (password !== confirmPassword) {
      setError('Password tidak cocok');
      return;
    }
    
    if (password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await signUp(email, password, name);
      if (!result.success) {
        setError(result.error);
      } else {
        setSuccess('Pendaftaran berhasil!');
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail('admin@iothub.local');
    setPassword('admin123');
    setLoading(true);
    
    try {
      const result = await signIn('admin@iothub.local', 'admin123');
      if (!result.success) {
        setError(result.error);
      }
    } catch (err) {
      setError('Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-6 lg:p-8">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-72 md:w-96 h-72 md:h-96 bg-cyan-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-72 md:w-96 h-72 md:h-96 bg-blue-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-48 md:w-64 h-48 md:h-64 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      {/* Online/Offline Indicator */}
      <div className={`fixed top-4 right-4 flex items-center gap-2 px-4 py-2 rounded-full text-sm ${
        isOnline 
          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
      }`}>
        {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
        <span>{isOnline ? 'Online' : 'Offline Mode'}</span>
      </div>

      <div className="glass-card p-6 md:p-8 lg:p-10 w-full max-w-md lg:max-w-lg relative">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6 md:mb-8">
          <div className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center mb-4 glow-primary">
            <Cpu size={32} className="text-white md:w-10 md:h-10 lg:w-12 lg:h-12" />
          </div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold gradient-text text-center">IoT Control Hub</h1>
          <p className="text-slate-400 text-center mt-2 text-sm md:text-base lg:text-lg">
            Smart Monitoring & Automation System
          </p>
        </div>

        {/* Mode Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => { setMode('signin'); setError(''); setSuccess(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 md:py-4 rounded-xl transition-all duration-300 text-sm md:text-base ${
              mode === 'signin'
                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:bg-slate-800/50'
            }`}
          >
            <LogIn size={18} />
            <span>Masuk</span>
          </button>
          <button
            onClick={() => { setMode('signup'); setError(''); setSuccess(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 md:py-4 rounded-xl transition-all duration-300 text-sm md:text-base ${
              mode === 'signup'
                ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:bg-slate-800/50'
            }`}
          >
            <UserPlus size={18} />
            <span>Daftar</span>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 md:p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm md:text-base flex items-center gap-2">
            <AlertCircle size={18} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-3 md:p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm md:text-base flex items-center gap-2">
            <CheckCircle size={18} className="flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {mode === 'signin' ? (
          <form onSubmit={handleSignIn} className="space-y-4 md:space-y-5">
            <div>
              <label className="block text-sm md:text-base text-slate-400 mb-2">Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-modern pl-12 text-base md:text-lg py-3 md:py-4"
                  placeholder="nama@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm md:text-base text-slate-400 mb-2">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-modern pl-12 pr-12 text-base md:text-lg py-3 md:py-4"
                  placeholder="Masukkan password"
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

            <button 
              type="submit" 
              className="btn-primary w-full py-3 md:py-4 text-base md:text-lg flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <LogIn size={20} />
                  <span>Masuk</span>
                </>
              )}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-[#0f172a] text-slate-400">atau</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full py-3 md:py-4 rounded-xl border border-slate-600 text-slate-400 hover:bg-slate-800/50 hover:text-white transition-all duration-300 flex items-center justify-center gap-2 text-sm md:text-base"
            >
              <Shield size={18} />
              <span>Login sebagai Admin Demo</span>
            </button>

            <p className="text-center text-xs md:text-sm text-slate-500 mt-4">
              Demo: admin@iothub.local / admin123
            </p>
          </form>
        ) : (
          <form onSubmit={handleSignUp} className="space-y-4 md:space-y-5">
            <div>
              <label className="block text-sm md:text-base text-slate-400 mb-2">Nama Lengkap</label>
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-modern pl-12 text-base md:text-lg py-3 md:py-4"
                  placeholder="Nama Anda"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm md:text-base text-slate-400 mb-2">Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-modern pl-12 text-base md:text-lg py-3 md:py-4"
                  placeholder="nama@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm md:text-base text-slate-400 mb-2">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-modern pl-12 pr-12 text-base md:text-lg py-3 md:py-4"
                  placeholder="Minimal 6 karakter"
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

            <div>
              <label className="block text-sm md:text-base text-slate-400 mb-2">Konfirmasi Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-modern pl-12 text-base md:text-lg py-3 md:py-4"
                  placeholder="Ulangi password"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full py-3 md:py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold transition-all duration-300 shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 text-base md:text-lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <UserPlus size={20} />
                  <span>Daftar Sekarang</span>
                </>
              )}
            </button>

            <p className="text-center text-xs md:text-sm text-slate-500 mt-4">
              Dengan mendaftar, Anda menyetujui ketentuan layanan kami
            </p>
          </form>
        )}

        {/* Features */}
        <div className="mt-6 md:mt-8 pt-6 border-t border-slate-700">
          <div className="grid grid-cols-3 gap-2 md:gap-4 text-center">
            <div className="p-2 md:p-3">
              <div className="text-2xl md:text-3xl mb-1">📊</div>
              <p className="text-xs md:text-sm text-slate-400">Real-time Monitoring</p>
            </div>
            <div className="p-2 md:p-3">
              <div className="text-2xl md:text-3xl mb-1">🎛️</div>
              <p className="text-xs md:text-sm text-slate-400">Device Control</p>
            </div>
            <div className="p-2 md:p-3">
              <div className="text-2xl md:text-3xl mb-1">⚡</div>
              <p className="text-xs md:text-sm text-slate-400">Automation</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
