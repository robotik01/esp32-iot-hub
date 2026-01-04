import { useState, useEffect, useRef } from 'react';
import { 
  Usb, 
  RefreshCw, 
  Send, 
  Terminal, 
  Settings, 
  Wifi, 
  Cpu, 
  Trash2,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { ESP32_PINS } from '../config/constants';

const SerialConfigPage = () => {
  const [port, setPort] = useState(null);
  const [reader, setReader] = useState(null);
  const [writer, setWriter] = useState(null);
  const [connected, setConnected] = useState(false);
  const [logs, setLogs] = useState([]);
  const [command, setCommand] = useState('');
  const [boardType, setBoardType] = useState('0');
  const [deviceName, setDeviceName] = useState('ESP32 IoT Hub');
  const [wifiSSID, setWifiSSID] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [apSSID, setApSSID] = useState('ESP32_IoT_Hub');
  const [apPassword, setApPassword] = useState('iot12345');
  const [currentConfig, setCurrentConfig] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [pins, setPins] = useState({
    relay1: 26, relay2: 27, relay3: 14, relay4: 12,
    led: 25, motor: 33, dht: 32, light: 34, motion: 35
  });
  
  const logContainerRef = useRef(null);
  const inputBuffer = useRef('');

  // Check if Web Serial is supported
  const isSupported = 'serial' in navigator;

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Update pin defaults when board type changes
  useEffect(() => {
    const pinConfig = boardType === '1' ? ESP32_PINS.LOLIN_S2_MINI : ESP32_PINS.DEVKIT;
    setPins({
      relay1: pinConfig.RELAY[0],
      relay2: pinConfig.RELAY[1],
      relay3: pinConfig.RELAY[2],
      relay4: pinConfig.RELAY[3],
      led: pinConfig.LED,
      motor: pinConfig.MOTOR,
      dht: pinConfig.DHT,
      light: pinConfig.LIGHT,
      motion: pinConfig.MOTION
    });
  }, [boardType]);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-200), { timestamp, message, type }]);
  };

  const connect = async () => {
    if (!isSupported) {
      addLog('Web Serial API not supported in this browser', 'error');
      return;
    }

    try {
      const selectedPort = await navigator.serial.requestPort();
      await selectedPort.open({ baudRate: 115200 });
      
      setPort(selectedPort);
      setConnected(true);
      
      const textDecoder = new TextDecoderStream();
      selectedPort.readable.pipeTo(textDecoder.writable);
      const newReader = textDecoder.readable.getReader();
      setReader(newReader);
      
      const textEncoder = new TextEncoderStream();
      textEncoder.readable.pipeTo(selectedPort.writable);
      const newWriter = textEncoder.writable.getWriter();
      setWriter(newWriter);
      
      addLog('Connected to ESP32', 'success');
      
      // Start reading
      readLoop(newReader);
      
      // Request current config
      setTimeout(() => {
        sendCommand('config');
      }, 1000);
      
    } catch (error) {
      addLog(`Connection failed: ${error.message}`, 'error');
    }
  };

  const disconnect = async () => {
    try {
      if (reader) {
        await reader.cancel();
        setReader(null);
      }
      if (writer) {
        await writer.close();
        setWriter(null);
      }
      if (port) {
        await port.close();
        setPort(null);
      }
      setConnected(false);
      addLog('Disconnected', 'info');
    } catch (error) {
      addLog(`Disconnect error: ${error.message}`, 'error');
    }
  };

  const readLoop = async (reader) => {
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        inputBuffer.current += value;
        
        // Process complete lines
        let newlineIndex;
        while ((newlineIndex = inputBuffer.current.indexOf('\n')) !== -1) {
          const line = inputBuffer.current.substring(0, newlineIndex).trim();
          inputBuffer.current = inputBuffer.current.substring(newlineIndex + 1);
          
          if (line) {
            // Detect message type
            let type = 'info';
            if (line.includes('✓') || line.includes('success')) type = 'success';
            else if (line.includes('✗') || line.includes('error') || line.includes('fail')) type = 'error';
            else if (line.includes('!') || line.includes('warning')) type = 'warning';
            
            addLog(line, type);
            
            // Try to parse config info
            parseConfigLine(line);
          }
        }
      }
    } catch (error) {
      if (error.name !== 'TypeError') {
        addLog(`Read error: ${error.message}`, 'error');
      }
    }
  };

  const parseConfigLine = (line) => {
    // Parse config output from ESP32
    if (line.includes('Device Name:')) {
      const name = line.split(':')[1]?.trim();
      if (name) setDeviceName(name);
    }
    if (line.includes('SSID:') && !line.includes('AP')) {
      const ssid = line.split(':')[1]?.trim();
      if (ssid && ssid !== '(not set)') setWifiSSID(ssid);
    }
    if (line.includes('AP SSID:')) {
      const ssid = line.split(':')[1]?.trim();
      if (ssid) setApSSID(ssid);
    }
    if (line.includes('Board Type:')) {
      if (line.includes('S2 Mini')) setBoardType('1');
      else if (line.includes('Custom')) setBoardType('2');
      else setBoardType('0');
    }
  };

  const sendCommand = async (cmd) => {
    if (!writer) {
      addLog('Not connected', 'error');
      return;
    }
    
    try {
      await writer.write(cmd + '\n');
      addLog(`> ${cmd}`, 'command');
    } catch (error) {
      addLog(`Send error: ${error.message}`, 'error');
    }
  };

  const handleSubmitCommand = (e) => {
    e.preventDefault();
    if (command.trim()) {
      sendCommand(command);
      setCommand('');
    }
  };

  const applyWifiConfig = async () => {
    if (!wifiSSID) {
      addLog('WiFi SSID is required', 'error');
      return;
    }
    await sendCommand(`wifi ${wifiSSID} ${wifiPassword}`);
    await new Promise(r => setTimeout(r, 500));
    await sendCommand(`ap ${apSSID} ${apPassword}`);
    await new Promise(r => setTimeout(r, 500));
    await sendCommand(`name ${deviceName}`);
    addLog('WiFi configuration applied. Type "restart" to apply changes.', 'success');
  };

  const applyBoardConfig = async () => {
    await sendCommand(`board ${boardType}`);
    addLog('Board type set. Restart to apply default pins.', 'success');
  };

  const applyPinConfig = async () => {
    const pinCommands = [
      `pin relay1 ${pins.relay1}`,
      `pin relay2 ${pins.relay2}`,
      `pin relay3 ${pins.relay3}`,
      `pin relay4 ${pins.relay4}`,
      `pin led ${pins.led}`,
      `pin motor ${pins.motor}`,
      `pin dht ${pins.dht}`,
      `pin light ${pins.light}`,
      `pin motion ${pins.motion}`
    ];
    
    for (const cmd of pinCommands) {
      await sendCommand(cmd);
      await new Promise(r => setTimeout(r, 200));
    }
    
    addLog('Pin configuration applied.', 'success');
  };

  const clearLogs = () => {
    setLogs([]);
  };

  if (!isSupported) {
    return (
      <div className="space-y-6">
        <div className="page-header">
          <h1 className="page-title gradient-text">Serial Configuration</h1>
          <p className="page-subtitle">Configure ESP32 via USB Serial</p>
        </div>
        
        <div className="glass-card section-padding">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle size={64} className="text-amber-400 mb-4" />
            <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Browser Not Supported</h2>
            <p className="text-slate-400 max-w-md mb-4">
              Web Serial API is not available in this browser. Please use a Chromium-based browser 
              like Google Chrome, Microsoft Edge, or Brave.
            </p>
            <a 
              href="https://caniuse.com/web-serial" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 underline"
            >
              Check browser compatibility
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title gradient-text">Serial Configuration</h1>
        <p className="page-subtitle">Configure ESP32 via USB Serial (UART)</p>
      </div>

      {/* Connection Panel */}
      <div className="glass-card section-padding">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              connected ? 'bg-emerald-500/20' : 'bg-slate-700'
            }`}>
              <Usb size={24} className={connected ? 'text-emerald-400' : 'text-slate-400'} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">USB Connection</h3>
              <p className={`text-sm ${connected ? 'text-emerald-400' : 'text-slate-400'}`}>
                {connected ? 'Connected to ESP32' : 'Not connected'}
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            {!connected ? (
              <button
                onClick={connect}
                className="btn-primary flex items-center gap-2"
              >
                <Usb size={18} />
                <span>Connect</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => sendCommand('config')}
                  className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white flex items-center gap-2"
                >
                  <RefreshCw size={18} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
                <button
                  onClick={() => sendCommand('restart')}
                  className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 flex items-center gap-2"
                >
                  <RefreshCw size={18} />
                  <span className="hidden sm:inline">Restart ESP</span>
                </button>
                <button
                  onClick={disconnect}
                  className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 flex items-center gap-2"
                >
                  <XCircle size={18} />
                  <span>Disconnect</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <div className="space-y-6">
          {/* WiFi Settings */}
          <div className="glass-card section-padding">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Wifi size={20} className="text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">WiFi Settings</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Device Name</label>
                <input
                  type="text"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  className="input-modern"
                  placeholder="My IoT Hub"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">WiFi SSID</label>
                  <input
                    type="text"
                    value={wifiSSID}
                    onChange={(e) => setWifiSSID(e.target.value)}
                    className="input-modern"
                    placeholder="Your WiFi network"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">WiFi Password</label>
                  <input
                    type="password"
                    value={wifiPassword}
                    onChange={(e) => setWifiPassword(e.target.value)}
                    className="input-modern"
                    placeholder="WiFi password"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">AP SSID</label>
                  <input
                    type="text"
                    value={apSSID}
                    onChange={(e) => setApSSID(e.target.value)}
                    className="input-modern"
                    placeholder="ESP32_IoT_Hub"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">AP Password</label>
                  <input
                    type="password"
                    value={apPassword}
                    onChange={(e) => setApPassword(e.target.value)}
                    className="input-modern"
                    placeholder="AP password"
                  />
                </div>
              </div>
              
              <button
                onClick={applyWifiConfig}
                disabled={!connected}
                className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload size={18} />
                <span>Apply WiFi Config</span>
              </button>
            </div>
          </div>

          {/* Board Settings */}
          <div className="glass-card section-padding">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Cpu size={20} className="text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Board Settings</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Board Type</label>
                <select
                  value={boardType}
                  onChange={(e) => setBoardType(e.target.value)}
                  className="input-modern"
                >
                  <option value="0">ESP32 DevKit</option>
                  <option value="1">Wemos Lolin S2 Mini</option>
                  <option value="2">Custom</option>
                </select>
              </div>
              
              <button
                onClick={applyBoardConfig}
                disabled={!connected}
                className="w-full px-4 py-3 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Upload size={18} />
                <span>Apply Board Type</span>
              </button>
              
              {/* Advanced Pin Config */}
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 text-slate-300"
              >
                <span className="flex items-center gap-2">
                  <Settings size={18} />
                  <span>Advanced Pin Configuration</span>
                </span>
                {showAdvanced ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              
              {showAdvanced && (
                <div className="space-y-4 p-4 rounded-xl bg-slate-800/30 border border-slate-700">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Object.entries(pins).map(([key, value]) => (
                      <div key={key}>
                        <label className="block text-xs text-slate-400 mb-1 capitalize">
                          {key.replace(/(\d)/, ' $1')}
                        </label>
                        <input
                          type="number"
                          value={value}
                          onChange={(e) => setPins(p => ({ ...p, [key]: parseInt(e.target.value) || 0 }))}
                          className="input-modern text-sm py-2"
                          min="0"
                          max="40"
                        />
                      </div>
                    ))}
                  </div>
                  
                  <button
                    onClick={applyPinConfig}
                    disabled={!connected}
                    className="w-full px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Upload size={18} />
                    <span>Apply Pin Config</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Commands */}
          <div className="glass-card section-padding">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Commands</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { cmd: 'help', label: 'Help' },
                { cmd: 'status', label: 'Status' },
                { cmd: 'config', label: 'Config' },
                { cmd: 'relay1 on', label: 'Relay 1 ON' },
                { cmd: 'relay1 off', label: 'Relay 1 OFF' },
                { cmd: 'led 50', label: 'LED 50%' }
              ].map(({ cmd, label }) => (
                <button
                  key={cmd}
                  onClick={() => sendCommand(cmd)}
                  disabled={!connected}
                  className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm text-slate-300 disabled:opacity-50"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Terminal Panel */}
        <div className="glass-card section-padding flex flex-col h-[600px]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center">
                <Terminal size={20} className="text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Serial Monitor</h3>
            </div>
            <button
              onClick={clearLogs}
              className="p-2 rounded-lg hover:bg-slate-700 text-slate-400"
              title="Clear logs"
            >
              <Trash2 size={18} />
            </button>
          </div>
          
          {/* Log Output */}
          <div
            ref={logContainerRef}
            className="flex-1 rounded-xl bg-slate-900 p-4 overflow-y-auto font-mono text-sm"
          >
            {logs.length === 0 ? (
              <p className="text-slate-500 text-center py-8">
                Connect to ESP32 to see serial output
              </p>
            ) : (
              logs.map((log, idx) => (
                <div key={idx} className="flex gap-2 mb-1">
                  <span className="text-slate-600 text-xs">{log.timestamp}</span>
                  <span className={
                    log.type === 'success' ? 'text-emerald-400' :
                    log.type === 'error' ? 'text-red-400' :
                    log.type === 'warning' ? 'text-amber-400' :
                    log.type === 'command' ? 'text-cyan-400' :
                    'text-slate-300'
                  }>
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
          
          {/* Command Input */}
          <form onSubmit={handleSubmitCommand} className="mt-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                className="input-modern flex-1 font-mono"
                placeholder="Enter command..."
                disabled={!connected}
              />
              <button
                type="submit"
                disabled={!connected || !command.trim()}
                className="px-4 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={18} />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Instructions */}
      <div className="glass-card section-padding">
        <h3 className="text-lg font-semibold text-white mb-4">📖 Instructions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-slate-400">
          <div className="p-4 rounded-xl bg-slate-800/30">
            <h4 className="font-semibold text-white mb-2">1. Connect ESP32</h4>
            <p>Connect your ESP32 to your computer via USB cable. Make sure the correct driver is installed.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-800/30">
            <h4 className="font-semibold text-white mb-2">2. Click Connect</h4>
            <p>Click the "Connect" button and select the ESP32's serial port from the browser dialog.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-800/30">
            <h4 className="font-semibold text-white mb-2">3. Configure</h4>
            <p>Enter WiFi credentials and other settings, then click Apply. Use "restart" to apply changes.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SerialConfigPage;
