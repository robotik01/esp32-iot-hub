import { createContext, useContext, useState, useEffect } from 'react';
import { DEFAULT_ADMIN, USER_ROLES } from '../config/constants';
import { sheetsService } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Simple hash function for password (in production, use bcrypt on server)
const hashPassword = async (password) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Check for saved session
    const savedUser = localStorage.getItem('iot_user');
    
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      } catch (e) {
        localStorage.removeItem('iot_user');
      }
    }
    
    // Load users from localStorage (offline fallback)
    const savedUsers = localStorage.getItem('iot_users');
    if (savedUsers) {
      try {
        setUsers(JSON.parse(savedUsers));
      } catch (e) {
        // Initialize with default admin
        initializeDefaultAdmin();
      }
    } else {
      initializeDefaultAdmin();
    }
    
    setLoading(false);
    
    // Online/offline listener
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const initializeDefaultAdmin = async () => {
    const hashedPassword = await hashPassword(DEFAULT_ADMIN.password);
    const defaultUsers = [{
      id: 'admin_1',
      email: DEFAULT_ADMIN.email,
      password: hashedPassword,
      name: 'Administrator',
      role: USER_ROLES.ADMIN,
      createdAt: new Date().toISOString(),
      isActive: true
    }];
    setUsers(defaultUsers);
    localStorage.setItem('iot_users', JSON.stringify(defaultUsers));
  };

  // Sign In with email/password
  const signIn = async (email, password) => {
    try {
      const hashedPassword = await hashPassword(password);
      
      // Check default admin first
      if (email === DEFAULT_ADMIN.email) {
        const defaultHash = await hashPassword(DEFAULT_ADMIN.password);
        if (hashedPassword === defaultHash || password === DEFAULT_ADMIN.password) {
          const userData = {
            id: 'admin_1',
            email: DEFAULT_ADMIN.email,
            name: 'Administrator',
            role: USER_ROLES.ADMIN,
            loginTime: new Date().toISOString()
          };
          setUser(userData);
          localStorage.setItem('iot_user', JSON.stringify(userData));
          
          // Try to sync with Google Sheets if online
          if (isOnline) {
            try {
              await sheetsService.logActivity('login', userData.email, 'User logged in');
            } catch (e) {
              console.log('Failed to sync login to sheets');
            }
          }
          
          return { success: true, user: userData };
        }
      }
      
      // Check local users
      const foundUser = users.find(u => u.email === email && u.password === hashedPassword);
      
      if (foundUser) {
        if (!foundUser.isActive) {
          return { success: false, error: 'Akun dinonaktifkan. Hubungi administrator.' };
        }
        
        const userData = {
          id: foundUser.id,
          email: foundUser.email,
          name: foundUser.name,
          role: foundUser.role,
          loginTime: new Date().toISOString()
        };
        
        setUser(userData);
        localStorage.setItem('iot_user', JSON.stringify(userData));
        
        // Try to sync with Google Sheets
        if (isOnline) {
          try {
            await sheetsService.logActivity('login', userData.email, 'User logged in');
          } catch (e) {
            console.log('Failed to sync login to sheets');
          }
        }
        
        return { success: true, user: userData };
      }
      
      return { success: false, error: 'Email atau password salah' };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: 'Terjadi kesalahan saat login' };
    }
  };

  // Sign Up new user
  const signUp = async (email, password, name, role = USER_ROLES.USER) => {
    try {
      // Check if email already exists
      if (email === DEFAULT_ADMIN.email || users.some(u => u.email === email)) {
        return { success: false, error: 'Email sudah terdaftar' };
      }
      
      const hashedPassword = await hashPassword(password);
      
      const newUser = {
        id: `user_${Date.now()}`,
        email,
        password: hashedPassword,
        name,
        role,
        createdAt: new Date().toISOString(),
        isActive: true
      };
      
      const updatedUsers = [...users, newUser];
      setUsers(updatedUsers);
      localStorage.setItem('iot_users', JSON.stringify(updatedUsers));
      
      // Auto login after signup
      const userData = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        loginTime: new Date().toISOString()
      };
      
      setUser(userData);
      localStorage.setItem('iot_user', JSON.stringify(userData));
      
      // Sync to Google Sheets if online
      if (isOnline) {
        try {
          await sheetsService.registerUser(newUser);
          await sheetsService.logActivity('register', userData.email, 'New user registered');
        } catch (e) {
          console.log('Failed to sync registration to sheets');
        }
      }
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: 'Terjadi kesalahan saat mendaftar' };
    }
  };

  // Add user (by admin/technician)
  const addUser = async (userData) => {
    if (!canManageUsers()) {
      return { success: false, error: 'Anda tidak memiliki izin untuk menambah pengguna' };
    }
    
    return await signUp(userData.email, userData.password, userData.name, userData.role);
  };

  // Update user
  const updateUser = async (userId, updates) => {
    if (!canManageUsers() && user?.id !== userId) {
      return { success: false, error: 'Anda tidak memiliki izin untuk mengubah pengguna ini' };
    }
    
    try {
      const updatedUsers = users.map(u => {
        if (u.id === userId) {
          const updated = { ...u, ...updates, updatedAt: new Date().toISOString() };
          if (updates.password) {
            // Hash new password synchronously for simplicity
            hashPassword(updates.password).then(hash => {
              updated.password = hash;
            });
          }
          return updated;
        }
        return u;
      });
      
      setUsers(updatedUsers);
      localStorage.setItem('iot_users', JSON.stringify(updatedUsers));
      
      // Update current user if they updated themselves
      if (user?.id === userId) {
        const updatedUser = { ...user, ...updates };
        delete updatedUser.password;
        setUser(updatedUser);
        localStorage.setItem('iot_user', JSON.stringify(updatedUser));
      }
      
      return { success: true };
    } catch (error) {
      console.error('Update user error:', error);
      return { success: false, error: 'Gagal memperbarui pengguna' };
    }
  };

  // Delete user
  const deleteUser = async (userId) => {
    if (!isAdmin()) {
      return { success: false, error: 'Hanya admin yang dapat menghapus pengguna' };
    }
    
    if (userId === 'admin_1') {
      return { success: false, error: 'Tidak dapat menghapus akun admin utama' };
    }
    
    try {
      const updatedUsers = users.filter(u => u.id !== userId);
      setUsers(updatedUsers);
      localStorage.setItem('iot_users', JSON.stringify(updatedUsers));
      
      return { success: true };
    } catch (error) {
      console.error('Delete user error:', error);
      return { success: false, error: 'Gagal menghapus pengguna' };
    }
  };

  // Get all users (for admin/technician)
  const getUsers = () => {
    if (!canManageUsers()) return [];
    return users.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      createdAt: u.createdAt,
      isActive: u.isActive
    }));
  };

  // Permission checks
  const isAdmin = () => user?.role === USER_ROLES.ADMIN;
  const isTechnician = () => user?.role === USER_ROLES.TECHNICIAN || isAdmin();
  const canManageDevices = () => isTechnician();
  const canManageUsers = () => isAdmin() || user?.role === USER_ROLES.TECHNICIAN;
  const canViewMonitoring = () => !!user;
  const canControlDevices = () => isTechnician() || user?.role === USER_ROLES.USER;
  const canManageAutomation = () => isTechnician();
  const canAccessSettings = () => isTechnician();

  // Logout
  const logout = () => {
    if (isOnline && user) {
      try {
        sheetsService.logActivity('logout', user.email, 'User logged out');
      } catch (e) {
        console.log('Failed to sync logout to sheets');
      }
    }
    
    setUser(null);
    localStorage.removeItem('iot_user');
  };

  const value = {
    user,
    users: getUsers(),
    loading,
    isOnline,
    // Auth methods
    signIn,
    signUp,
    logout,
    // User management
    addUser,
    updateUser,
    deleteUser,
    getUsers,
    // Permission checks
    isAdmin,
    isTechnician,
    canManageDevices,
    canManageUsers,
    canViewMonitoring,
    canControlDevices,
    canManageAutomation,
    canAccessSettings,
    // Legacy compatibility
    loginTechnician: (username, password) => signIn(username.includes('@') ? username : `${username}@iothub.local`, password)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
