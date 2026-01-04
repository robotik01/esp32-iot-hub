import { createContext, useContext, useState, useEffect } from 'react';
import { DEFAULT_TECHNICIAN } from '../config/constants';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isTechnician, setIsTechnician] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for saved session
    const savedUser = localStorage.getItem('iot_user');
    const savedRole = localStorage.getItem('iot_role');
    
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setIsTechnician(savedRole === 'technician');
    }
    setLoading(false);
  }, []);

  // Google OAuth Login
  const loginWithGoogle = (credentialResponse) => {
    try {
      // Decode JWT token from Google
      const token = credentialResponse.credential;
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      const userData = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        loginType: 'google'
      };
      
      setUser(userData);
      setIsTechnician(false);
      localStorage.setItem('iot_user', JSON.stringify(userData));
      localStorage.setItem('iot_role', 'user');
      
      return { success: true };
    } catch (error) {
      console.error('Google login error:', error);
      return { success: false, error: 'Failed to process Google login' };
    }
  };

  // Technician Login
  const loginTechnician = (username, password) => {
    // Get stored technicians from localStorage or use default
    const storedTechnicians = JSON.parse(localStorage.getItem('iot_technicians') || '[]');
    const allTechnicians = [DEFAULT_TECHNICIAN, ...storedTechnicians];
    
    const technician = allTechnicians.find(
      t => t.username === username && t.password === password
    );
    
    if (technician) {
      const userData = {
        id: `tech_${username}`,
        name: username,
        loginType: 'technician'
      };
      
      setUser(userData);
      setIsTechnician(true);
      localStorage.setItem('iot_user', JSON.stringify(userData));
      localStorage.setItem('iot_role', 'technician');
      
      return { success: true };
    }
    
    return { success: false, error: 'Invalid username or password' };
  };

  // Add new technician (only accessible by existing technicians)
  const addTechnician = (username, password) => {
    if (!isTechnician) {
      return { success: false, error: 'Only technicians can add new technicians' };
    }
    
    const storedTechnicians = JSON.parse(localStorage.getItem('iot_technicians') || '[]');
    
    // Check if username already exists
    if (storedTechnicians.some(t => t.username === username) || 
        username === DEFAULT_TECHNICIAN.username) {
      return { success: false, error: 'Username already exists' };
    }
    
    storedTechnicians.push({ username, password });
    localStorage.setItem('iot_technicians', JSON.stringify(storedTechnicians));
    
    return { success: true };
  };

  // Get all technicians (only accessible by technicians)
  const getTechnicians = () => {
    if (!isTechnician) return [];
    
    const storedTechnicians = JSON.parse(localStorage.getItem('iot_technicians') || '[]');
    return [{ username: DEFAULT_TECHNICIAN.username }, ...storedTechnicians.map(t => ({ username: t.username }))];
  };

  // Delete technician
  const deleteTechnician = (username) => {
    if (!isTechnician) {
      return { success: false, error: 'Only technicians can delete technicians' };
    }
    
    if (username === DEFAULT_TECHNICIAN.username) {
      return { success: false, error: 'Cannot delete default admin account' };
    }
    
    const storedTechnicians = JSON.parse(localStorage.getItem('iot_technicians') || '[]');
    const filtered = storedTechnicians.filter(t => t.username !== username);
    localStorage.setItem('iot_technicians', JSON.stringify(filtered));
    
    return { success: true };
  };

  // Logout
  const logout = () => {
    setUser(null);
    setIsTechnician(false);
    localStorage.removeItem('iot_user');
    localStorage.removeItem('iot_role');
  };

  const value = {
    user,
    isTechnician,
    loading,
    loginWithGoogle,
    loginTechnician,
    addTechnician,
    getTechnicians,
    deleteTechnician,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
