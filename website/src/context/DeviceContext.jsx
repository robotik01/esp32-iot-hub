import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ESP32_CONFIG } from '../config/constants';

const DeviceContext = createContext(null);

export const useDevice = () => {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error('useDevice must be used within DeviceProvider');
  }
  return context;
};

export const DeviceProvider = ({ children }) => {
  const [devices, setDevices] = useState([]);
  const [sensorData, setSensorData] = useState({});
  const [automationRules, setAutomationRules] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [ws, setWs] = useState(null);

  // Initialize demo data
  useEffect(() => {
    // Demo devices
    const demoDevices = [
      { id: 'relay1', name: 'Living Room Light', type: 'relay', pin: 26, state: false },
      { id: 'relay2', name: 'Kitchen Light', type: 'relay', pin: 27, state: false },
      { id: 'relay3', name: 'AC Unit', type: 'relay', pin: 14, state: false },
      { id: 'relay4', name: 'Water Pump', type: 'relay', pin: 12, state: false },
      { id: 'led1', name: 'RGB LED Strip', type: 'led', pin: 25, state: false, brightness: 100 },
      { id: 'motor1', name: 'Curtain Motor', type: 'motor', pin: 33, state: false, speed: 50 },
      { id: 'temp1', name: 'Temperature Sensor', type: 'sensor', sensorType: 'temperature', pin: 32, value: 25.5, unit: '°C' },
      { id: 'hum1', name: 'Humidity Sensor', type: 'sensor', sensorType: 'humidity', pin: 32, value: 65, unit: '%' },
      { id: 'light1', name: 'Light Sensor', type: 'sensor', sensorType: 'light', pin: 34, value: 750, unit: 'lux' },
      { id: 'motion1', name: 'Motion Sensor', type: 'sensor', sensorType: 'motion', pin: 35, value: false }
    ];

    // Demo automation rules
    const demoRules = [
      { id: 'rule1', name: 'Auto Light Off', trigger: 'light1', condition: '>', value: 500, action: 'relay1', actionState: false, enabled: true },
      { id: 'rule2', name: 'AC Auto On', trigger: 'temp1', condition: '>', value: 28, action: 'relay3', actionState: true, enabled: true },
      { id: 'rule3', name: 'Motion Light', trigger: 'motion1', condition: '==', value: true, action: 'relay2', actionState: true, enabled: false }
    ];

    setDevices(demoDevices);
    setAutomationRules(demoRules);

    // Generate demo historical data
    generateDemoSensorData();
  }, []);

  // Generate demo sensor data for charts
  const generateDemoSensorData = () => {
    const now = Date.now();
    const data = {
      temperature: [],
      humidity: [],
      light: []
    };

    for (let i = 23; i >= 0; i--) {
      const timestamp = now - (i * 3600000); // hourly data
      data.temperature.push({
        timestamp,
        value: 22 + Math.random() * 8 + Math.sin(i / 4) * 3
      });
      data.humidity.push({
        timestamp,
        value: 50 + Math.random() * 20 + Math.cos(i / 4) * 10
      });
      data.light.push({
        timestamp,
        value: Math.max(0, 500 + Math.sin((i - 6) / 3.8) * 400 + Math.random() * 100)
      });
    }

    setSensorData(data);
  };

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setDevices(prev => prev.map(device => {
        if (device.type === 'sensor') {
          let newValue = device.value;
          if (device.sensorType === 'temperature') {
            newValue = Math.max(15, Math.min(40, device.value + (Math.random() - 0.5) * 0.5));
          } else if (device.sensorType === 'humidity') {
            newValue = Math.max(20, Math.min(90, device.value + (Math.random() - 0.5) * 2));
          } else if (device.sensorType === 'light') {
            newValue = Math.max(0, Math.min(1500, device.value + (Math.random() - 0.5) * 50));
          } else if (device.sensorType === 'motion') {
            newValue = Math.random() > 0.9;
          }
          return { ...device, value: device.sensorType === 'motion' ? newValue : Number(newValue.toFixed(1)) };
        }
        return device;
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // WebSocket connection
  const connectToESP32 = useCallback((wsUrl = ESP32_CONFIG.WS_URL) => {
    try {
      const socket = new WebSocket(wsUrl);
      
      socket.onopen = () => {
        setConnectionStatus('connected');
        console.log('Connected to ESP32');
      };

      socket.onclose = () => {
        setConnectionStatus('disconnected');
        console.log('Disconnected from ESP32');
        // Auto reconnect
        setTimeout(() => connectToESP32(wsUrl), ESP32_CONFIG.RECONNECT_INTERVAL);
      };

      socket.onerror = (error) => {
        setConnectionStatus('error');
        console.error('WebSocket error:', error);
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleESP32Message(data);
        } catch (e) {
          console.error('Failed to parse message:', e);
        }
      };

      setWs(socket);
    } catch (error) {
      setConnectionStatus('error');
      console.error('Failed to connect:', error);
    }
  }, []);

  // Handle messages from ESP32
  const handleESP32Message = (data) => {
    if (data.type === 'sensor_update') {
      setDevices(prev => prev.map(device => 
        device.id === data.id ? { ...device, value: data.value } : device
      ));
    } else if (data.type === 'device_state') {
      setDevices(prev => prev.map(device =>
        device.id === data.id ? { ...device, state: data.state } : device
      ));
    }
  };

  // Control device
  const controlDevice = (deviceId, state, options = {}) => {
    setDevices(prev => prev.map(device => 
      device.id === deviceId ? { ...device, state, ...options } : device
    ));

    // Send to ESP32 if connected
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'control',
        id: deviceId,
        state,
        ...options
      }));
    }
  };

  // Add device
  const addDevice = (device) => {
    const newDevice = {
      ...device,
      id: `device_${Date.now()}`
    };
    setDevices(prev => [...prev, newDevice]);
    return newDevice;
  };

  // Remove device
  const removeDevice = (deviceId) => {
    setDevices(prev => prev.filter(d => d.id !== deviceId));
  };

  // Update device
  const updateDevice = (deviceId, updates) => {
    setDevices(prev => prev.map(device =>
      device.id === deviceId ? { ...device, ...updates } : device
    ));
  };

  // Automation rules
  const addAutomationRule = (rule) => {
    const newRule = {
      ...rule,
      id: `rule_${Date.now()}`,
      enabled: true
    };
    setAutomationRules(prev => [...prev, newRule]);
    return newRule;
  };

  const updateAutomationRule = (ruleId, updates) => {
    setAutomationRules(prev => prev.map(rule =>
      rule.id === ruleId ? { ...rule, ...updates } : rule
    ));
  };

  const removeAutomationRule = (ruleId) => {
    setAutomationRules(prev => prev.filter(r => r.id !== ruleId));
  };

  const value = {
    devices,
    sensorData,
    automationRules,
    connectionStatus,
    connectToESP32,
    controlDevice,
    addDevice,
    removeDevice,
    updateDevice,
    addAutomationRule,
    updateAutomationRule,
    removeAutomationRule
  };

  return (
    <DeviceContext.Provider value={value}>
      {children}
    </DeviceContext.Provider>
  );
};
