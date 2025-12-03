import { useState, useEffect } from 'react';
import {
    LayoutDashboard, Settings, Activity, Wifi, Sun, Moon,
    Languages, Thermometer, Droplets, Wind,
    RefreshCw, Save, Menu, X, Router, Eye, EyeOff,
    Download, Info, RotateCcw, Database, Trash2, FileSpreadsheet
} from 'lucide-react';

// Import Components
import StatCard from './components/StatCard';
import ChartView from './components/ChartView';
import SidebarItem from './components/SidebarItem';
import TimeAgo from './components/TimeAgo';
import Toast from './components/Toast';
import SystemLog from './components/SystemLog';
import { TRANSLATIONS } from './constants/translations';

// --- CONFIGURATION ---
const DEFAULT_DEMO_MODE = true;
const MAX_HISTORY_LENGTH = 1000;
const MOCK_WIFI_NETWORKS = [
    { ssid: "Viettel_Home_5G", rssi: -50 },
    { ssid: "Coffee_Free_WiFi", rssi: -65 },
    { ssid: "IoT_Center_Guest", rssi: -70 },
    { ssid: "My_iPhone_Hotspot", rssi: -45 },
];

const App = () => {
    // --- STATE ---
    const [demoMode, setDemoMode] = useState(() => {
        const saved = localStorage.getItem('esp32_demo_mode');
        return saved !== null ? JSON.parse(saved) : DEFAULT_DEMO_MODE;
    });
    const [lang, setLang] = useState('vi');
    const [darkMode, setDarkMode] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [selectedSensor, setSelectedSensor] = useState(null);

    // Data States
    const [sensorData, setSensorData] = useState(() => {
        const saved = localStorage.getItem('esp32_sensor_data');
        return saved ? JSON.parse(saved) : { temp: 30, hum: 60, gas: 100, light: 500 };
    });
    const [historyData, setHistoryData] = useState(() => {
        const saved = localStorage.getItem('esp32_history_data');
        try { return saved ? JSON.parse(saved) : []; } catch (e) { return []; }
    });
    const [lastUpdate, setLastUpdate] = useState(new Date());

    // Config States
    const [wifiList, setWifiList] = useState([]);
    const [isScanning, setIsScanning] = useState(false);
    const [isLoadingConfig, setIsLoadingConfig] = useState(false);
    const [configForm, setConfigForm] = useState({
        deviceId: '', wifiSSID: '', wifiPass: '', token: '', server: '', port: '', sendInterval: 5
    });

    // New Feature States
    const [prevSensorData, setPrevSensorData] = useState(sensorData);
    const [toasts, setToasts] = useState([]);
    const [showWifiPass, setShowWifiPass] = useState(false);
    const [showToken, setShowToken] = useState(false);
    const [systemLogs, setSystemLogs] = useState(() => {
        const saved = localStorage.getItem('esp32_system_logs');
        try {
            const logs = saved ? JSON.parse(saved) : [];
            // Regenerate IDs to ensure uniqueness
            return logs.map((log, index) => ({
                ...log,
                id: Date.now() + Math.random() + index
            }));
        } catch (e) {
            return [];
        }
    });
    const [dateFilter, setDateFilter] = useState({ from: '', to: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    const t = TRANSLATIONS[lang];

    // --- PERSISTENCE ---
    useEffect(() => {
        localStorage.setItem('esp32_history_data', JSON.stringify(historyData));
    }, [historyData]);

    useEffect(() => {
        localStorage.setItem('esp32_sensor_data', JSON.stringify(sensorData));
    }, [sensorData]);

    useEffect(() => {
        localStorage.setItem('esp32_demo_mode', JSON.stringify(demoMode));
    }, [demoMode]);

    useEffect(() => {
        localStorage.setItem('esp32_system_logs', JSON.stringify(systemLogs));
    }, [systemLogs]);

    // --- HELPER FUNCTIONS ---
    const addSystemLog = (type, message) => {
        const log = {
            id: Date.now() + Math.random(), // Ensure unique ID
            timestamp: new Date().toLocaleString(),
            type,
            message
        };
        setSystemLogs(prev => [log, ...prev].slice(0, 100)); // Keep last 100 logs
    };

    const showToast = (message, type = 'info') => {
        const id = Date.now() + Math.random(); // Ensure unique ID
        setToasts(prev => {
            // Prevent duplicate messages
            if (prev.some(t => t.message === message)) return prev;
            return [...prev, { id, message, type }];
        });
        // Auto remove after 5 seconds
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 5000);
    };

    const getTrend = (key) => {
        const current = sensorData[key];
        const previous = prevSensorData[key];
        if (current > previous) return 'up';
        if (current < previous) return 'down';
        return 'neutral';
    };

    const getFilteredData = () => {
        let filtered = historyData;
        if (dateFilter.from) {
            const fromTime = new Date(dateFilter.from).getTime();
            filtered = filtered.filter(item => item.id >= fromTime);
        }
        if (dateFilter.to) {
            const toTime = new Date(dateFilter.to).getTime();
            filtered = filtered.filter(item => item.id <= toTime);
        }
        return filtered;
    };

    const getPaginatedData = () => {
        const filtered = getFilteredData();
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        return filtered.slice().reverse().slice(start, end);
    };

    const totalPages = Math.ceil(getFilteredData().length / itemsPerPage);

    const getCellStyle = (key, value) => {
        if (key === 'temp') {
            if (value > 45) return 'bg-red-500/20 text-red-500 font-bold';
            if (value > 35) return 'bg-yellow-500/20 text-yellow-500 font-bold';
        }
        if (key === 'hum' && value > 90) return 'bg-red-500/20 text-red-500 font-bold';
        if (key === 'gas' && value > 150) return 'bg-red-500/20 text-red-500 font-bold';
        return '';
    };

    const getRecentData = (sensorKey) => {
        return historyData.slice(-15).map(item => item[sensorKey] || 0);
    };

    // --- API HANDLERS ---
    const fetchRealData = async () => {
        try {
            if (window.location.protocol === 'blob:' || window.location.protocol === 'about:') throw new Error('Preview Mode');
            const response = await fetch('/api/data');
            if (!response.ok) throw new Error('Network error');
            const data = await response.json();

            const now = new Date();
            setLastUpdate(now);
            setSensorData({
                temp: Number(data.sensors.temp).toFixed(1),
                hum: Number(data.sensors.hum).toFixed(1),
                gas: Math.round(Number(data.sensors.gas)),
                light: Math.round(Number(data.sensors.light))
            });

            const newDataPoint = {
                id: Date.now(),
                time: now.toLocaleTimeString('en-US', { hour12: false }),
                fullTime: now.toLocaleString(),
                ...data.sensors
            };

            setHistoryData(prev => {
                const newHistory = [...prev, newDataPoint];
                if (newHistory.length > MAX_HISTORY_LENGTH) return newHistory.slice(newHistory.length - MAX_HISTORY_LENGTH);
                return newHistory;
            });
        } catch (error) {
            if (error.message.includes('Preview') || error.name === 'TypeError') {
                setDemoMode(true);
                return;
            }
            console.warn("Fetch failed:", error);
            // Auto-revert to Demo Mode with toast and log
            setTimeout(() => {
                setDemoMode(prev => {
                    if (!prev) {
                        showToast(t.toastConnectionLost, 'danger');
                        addSystemLog('error', t.eventConnectionLost);
                        return true;
                    }
                    return prev;
                });
            }, 3000);
        }
    };

    // --- EFFECTS ---
    // Auto-detect ESP32 on startup
    useEffect(() => {
        const checkESP32Connection = async () => {
            try {
                const response = await fetch('/api/data', {
                    method: 'GET',
                    signal: AbortSignal.timeout(3000) // 3s timeout
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.sensors) {
                        // ESP32 detected, switch to Real mode
                        setDemoMode(false);
                        addSystemLog('success', 'Đã phát hiện ESP32, tự động chuyển sang chế độ thực');
                        showToast('ESP32 đã kết nối!', 'success');
                    }
                }
            } catch (error) {
                // ESP32 not available, stay in Demo mode
                console.log('ESP32 not detected, staying in Demo mode');
                addSystemLog('info', 'Không tìm thấy ESP32, chạy ở chế độ Demo');
            }
        };

        checkESP32Connection();
    }, []); // Run once on mount

    // Polling effect for both Demo and Real modes
    useEffect(() => {
        if (!demoMode) fetchRealData(); // Fetch immediately when switching to Real Mode

        const pollInterval = Math.max(1000, (configForm.sendInterval || 2) * 1000);
        const interval = setInterval(() => {
            if (demoMode) {
                const now = new Date();

                // Save old values BEFORE update
                const oldTemp = sensorData.temp;
                const oldGas = sensorData.gas;

                const newData = {
                    temp: Math.min(100, Math.max(0, parseFloat((sensorData.temp + (Math.random() * 6 - 3)).toFixed(1)))) || 28,
                    hum: Math.min(100, Math.max(0, parseInt(sensorData.hum + (Math.random() * 12 - 6)))) || 60,
                    gas: Math.min(500, Math.max(0, parseInt(sensorData.gas + (Math.random() * 40 - 20)))) || 100,
                    light: Math.min(1000, Math.max(0, parseInt(sensorData.light + (Math.random() * 80 - 40)))) || 500,
                };

                setSensorData(newData);
                setLastUpdate(now);

                const newDataPoint = {
                    id: Date.now(),
                    time: now.toLocaleTimeString('en-US', { hour12: false }),
                    fullTime: now.toLocaleString(),
                    ...newData
                };

                setHistoryData(prev => {
                    const newHistory = [...prev, newDataPoint];
                    if (newHistory.length > MAX_HISTORY_LENGTH) return newHistory.slice(newHistory.length - MAX_HISTORY_LENGTH);
                    return newHistory;
                });

                // Check for warnings
                // Gas warning - trigger when gas > 150 AND increasing
                if (newData.gas > 150 && newData.gas > oldGas) {
                    showToast(t.toastGasWarning, 'danger');
                    addSystemLog('warning', `${t.eventThresholdWarning}: Gas = ${newData.gas} PPM`);
                }

                // Temperature warnings - trigger when temp INCREASES above threshold
                if (newData.temp > oldTemp) {  // Only when temp is increasing
                    if (newData.temp > 45) {
                        showToast(t.toastTempDanger, 'danger');
                        addSystemLog('warning', `${t.eventThresholdWarning}: Nhiệt độ = ${newData.temp}°C (Nguy hiểm!)`);
                    } else if (newData.temp > 35) {
                        showToast(t.toastTempWarning, 'warning');
                        addSystemLog('warning', `${t.eventThresholdWarning}: Nhiệt độ = ${newData.temp}°C`);
                    }
                }

                // Update previous sensor data for trend
                setPrevSensorData(sensorData);
            } else {
                fetchRealData();
            }
        }, pollInterval);
        return () => clearInterval(interval);
    }, [demoMode, sensorData, configForm.sendInterval]);

    // --- HANDLERS ---
    const handleExportCSV = () => {
        const headers = ["Time", "Temperature", "Humidity", "Gas", "Light"];
        const rows = historyData.map(row => [row.fullTime, row.temp, row.hum, row.gas, row.light]);
        let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", `esp32_log_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
    };

    const handleClearData = () => {
        if (confirm(t.confirmClear)) { setHistoryData([]); localStorage.removeItem('esp32_history_data'); }
    };

    const handleScanWifi = async () => {
        setIsScanning(true);
        try {
            const response = await fetch('/api/scan');
            if (!response.ok) throw new Error('Scan failed');
            const data = await response.json();
            setWifiList(data.networks || []);
        } catch (error) {
            console.error('WiFi scan error:', error);
            // Fallback to mock data in demo mode
            setWifiList(MOCK_WIFI_NETWORKS);
        } finally {
            setIsScanning(false);
        }
    };

    const handleSaveConfig = async () => {
        try {
            const response = await fetch('/api/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(configForm)
            });
            if (!response.ok) throw new Error('Save failed');
            const data = await response.json();
            alert(data.message || t.saved);
            // ESP32 might reboot, so we wait and check connection
            setTimeout(() => {
                addSystemLog('info', 'ESP32 đang khởi động lại với cấu hình mới...');
            }, 1000);
        } catch (error) {
            console.error('Save config error:', error);
            alert('Lỗi: Không thể lưu cấu hình. Kiểm tra kết nối ESP32.');
        }
    };

    const handleLoadConfig = async () => {
        setIsLoadingConfig(true);
        try {
            const response = await fetch('/api/config');
            if (!response.ok) throw new Error('Load failed');
            const data = await response.json();
            setConfigForm({
                deviceId: data.deviceId || '',
                wifiSSID: data.wifiSSID || '',
                wifiPass: '', // Don't load password for security
                token: data.token || '',
                server: data.server || '',
                port: data.port || '',
                sendInterval: data.sendInterval || 5
            });
            alert(t.loaded);
        } catch (error) {
            console.error('Load config error:', error);
            alert('Lỗi: Không thể tải cấu hình. Kiểm tra kết nối ESP32.');
        } finally {
            setIsLoadingConfig(false);
        }
    };

    const handleRefreshConfig = () => {
        alert(t.refreshed);
    };

    // --- RENDER ---
    return (
        <div className={`min-h-screen flex transition-colors duration-300 ${darkMode ? 'bg-gray-950 text-gray-100' : 'bg-gray-100 text-gray-900'}`}>
            {/* Toast Notifications */}
            <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
                {toasts.map(toast => (
                    <Toast
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                    />
                ))}
            </div>

            {/* Sidebar & Overlay */}
            {isSidebarOpen && (<div className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden" onClick={() => setIsSidebarOpen(false)} />)}
            <aside className={`fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 ${darkMode ? 'bg-gray-900 border-r border-gray-800' : 'bg-white border-r border-gray-200'}`}>
                <div className="p-6 flex items-center justify-between">
                    <button
                        onClick={() => { setActiveTab('dashboard'); setSelectedSensor(null); setIsSidebarOpen(false); }}
                        className="flex items-center gap-3 hover:opacity-80 transition cursor-pointer"
                    >
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white"><Wifi size={24} /></div>
                        <h1 className="text-xl font-bold tracking-tight">ESP32 Core</h1>
                    </button>
                    <button className="lg:hidden" onClick={() => setIsSidebarOpen(false)}><X size={24} /></button>
                </div>
                <nav className="px-4 mt-6">
                    <SidebarItem id="dashboard" icon={LayoutDashboard} label={t.dashboard} active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setSelectedSensor(null); setIsSidebarOpen(false); }} />
                    <SidebarItem id="database" icon={Database} label={t.database} active={activeTab === 'database'} onClick={() => { setActiveTab('database'); setIsSidebarOpen(false); }} />
                    <SidebarItem id="logs" icon={Activity} label={t.systemLog} active={activeTab === 'logs'} onClick={() => { setActiveTab('logs'); setIsSidebarOpen(false); }} />
                    <SidebarItem id="config" icon={Settings} label={t.config} active={activeTab === 'config'} onClick={() => { setActiveTab('config'); setIsSidebarOpen(false); }} />
                </nav>
                <div className="px-6 mt-4"><button onClick={() => setDemoMode(!demoMode)} className={`w-full text-xs font-mono py-1 rounded border ${demoMode ? 'border-yellow-500 text-yellow-500' : 'border-green-500 text-green-500'}`}>{demoMode ? t.demoMode : t.realMode}</button></div>
                <div className="absolute bottom-0 w-full p-6"><div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-blue-50'}`}><h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${demoMode ? 'bg-yellow-500' : 'bg-green-500'} animate-pulse`}></div>{t.systemStatus}</h4><p className="text-xs opacity-70 mb-1">{t.connected}: {demoMode ? 'Simulation' : 'ESP32_Physical'}</p><p className="text-xs opacity-70 text-blue-500">IP: {demoMode ? 'Localhost' : '192.168.4.1'}</p></div></div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <header className={`px-6 py-4 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md ${darkMode ? 'bg-gray-900/80' : 'bg-white/80'}`}>
                    <div className="flex items-center gap-4">
                        <button className="lg:hidden p-2" onClick={() => setIsSidebarOpen(true)}><Menu size={24} /></button>
                        <div><h2 className="text-lg font-bold hidden md:block">{t.dashboard}</h2><p className="text-xs text-gray-500 font-mono flex items-center gap-1">{t.lastUpdate} <TimeAgo timestamp={lastUpdate} t={t} /></p></div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')} className={`p-2 rounded-lg flex items-center gap-2 text-sm font-medium transition ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}><Languages size={18} /> {lang.toUpperCase()}</button>
                        <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-lg transition ${darkMode ? 'hover:bg-gray-800 text-yellow-400' : 'hover:bg-gray-100 text-gray-600'}`}>{darkMode ? <Sun size={20} /> : <Moon size={20} />}</button>
                    </div>
                </header>

                <div className="p-6 max-w-7xl mx-auto">
                    {activeTab === 'dashboard' && (
                        <>
                            {selectedSensor ? (
                                <div className="animate-in fade-in zoom-in duration-300">
                                    <button onClick={() => setSelectedSensor(null)} className="mb-4 flex items-center text-sm font-medium text-blue-500 hover:text-blue-400"><Activity size={16} className="mr-1" /> {t.back}</button>
                                    {selectedSensor === 'temp' && <ChartView sensorKey="temp" title={t.temp} color="#ef4444" unit="°C" historyData={historyData} onClose={() => setSelectedSensor(null)} t={t} darkMode={darkMode} />}
                                    {selectedSensor === 'hum' && <ChartView sensorKey="hum" title={t.hum} color="#3b82f6" unit="%" historyData={historyData} onClose={() => setSelectedSensor(null)} t={t} darkMode={darkMode} />}
                                    {selectedSensor === 'gas' && <ChartView sensorKey="gas" title={t.gas} color="#a855f7" unit="PPM" historyData={historyData} onClose={() => setSelectedSensor(null)} t={t} darkMode={darkMode} />}
                                    {selectedSensor === 'light' && <ChartView sensorKey="light" title={t.light} color="#eab308" unit="Lux" historyData={historyData} onClose={() => setSelectedSensor(null)} t={t} darkMode={darkMode} />}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <StatCard id="temp" title={t.temp} value={sensorData.temp} unit="°C" icon={Thermometer} color="#ef4444" min={0} max={100} onClick={() => setSelectedSensor('temp')} t={t} darkMode={darkMode} trend={getTrend('temp')} recentData={getRecentData('temp')} />
                                    <StatCard id="hum" title={t.hum} value={sensorData.hum} unit="%" icon={Droplets} color="#3b82f6" min={0} max={100} onClick={() => setSelectedSensor('hum')} t={t} darkMode={darkMode} trend={getTrend('hum')} recentData={getRecentData('hum')} />
                                    <StatCard id="gas" title={t.gas} value={sensorData.gas} unit="PPM" icon={Wind} color="#a855f7" min={0} max={500} onClick={() => setSelectedSensor('gas')} t={t} darkMode={darkMode} trend={getTrend('gas')} recentData={getRecentData('gas')} />
                                    <StatCard id="light" title={t.light} value={sensorData.light} unit="Lux" icon={Sun} color="#eab308" min={0} max={1000} onClick={() => setSelectedSensor('light')} t={t} darkMode={darkMode} trend={getTrend('light')} recentData={getRecentData('light')} />
                                </div>
                            )}
                        </>
                    )}

                    {activeTab === 'logs' && (
                        <SystemLog logs={systemLogs} darkMode={darkMode} t={t} />
                    )}

                    {activeTab === 'database' && (
                        <div className={`rounded-2xl shadow-md overflow-hidden border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                            <div className="p-6 border-b border-gray-700/50 flex flex-col gap-4">
                                <div>
                                    <h3 className="text-xl font-bold flex items-center gap-2"><Database size={20} className="text-blue-500" /> {t.database}</h3>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm">{t.fromDate}:</label>
                                        <input type="datetime-local" value={dateFilter.from} onChange={(e) => setDateFilter({ ...dateFilter, from: e.target.value })} className={`px-3 py-1 rounded border text-sm ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`} />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm">{t.toDate}:</label>
                                        <input type="datetime-local" value={dateFilter.to} onChange={(e) => setDateFilter({ ...dateFilter, to: e.target.value })} className={`px-3 py-1 rounded border text-sm ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`} />
                                    </div>
                                    <button onClick={() => { setDateFilter({ from: '', to: '' }); setCurrentPage(1); }} className="px-4 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm">{t.reset}</button>
                                </div>
                                <div className="flex flex-wrap gap-2 items-center justify-between">
                                    <div className="flex gap-2">
                                        <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition"><FileSpreadsheet size={16} /> {t.exportCSV}</button>
                                        <button onClick={handleClearData} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition"><Trash2 size={16} /> {t.clearData}</button>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <span>{t.page} {currentPage} {t.of} {totalPages || 1}</span>
                                        <div className="flex gap-1">
                                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-2 py-1 rounded bg-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">&larr;</button>
                                            <button onClick={() => setCurrentPage(p => Math.min(totalPages || 1, p + 1))} disabled={currentPage >= totalPages} className="px-2 py-1 rounded bg-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">&rarr;</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className={`w-full text-sm text-left ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                    <thead className={`text-xs uppercase ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-50 text-gray-700'}`}>
                                        <tr><th className="px-6 py-3">{t.time}</th><th className="px-6 py-3">{t.temp} (°C)</th><th className="px-6 py-3">{t.hum} (%)</th><th className="px-6 py-3">{t.gas} (PPM)</th><th className="px-6 py-3">{t.light} (Lux)</th></tr>
                                    </thead>
                                    <tbody>
                                        {getPaginatedData().map((row, idx) => (
                                            <tr key={row.id || idx} className={`border-b ${darkMode ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-100 hover:bg-gray-50'}`}>
                                                <td className="px-6 py-4 font-mono">{row.fullTime}</td>
                                                <td className={`px-6 py-4 font-medium ${getCellStyle('temp', row.temp)}`}>{row.temp}</td>
                                                <td className={`px-6 py-4 font-medium ${getCellStyle('hum', row.hum)}`}>{row.hum}</td>
                                                <td className={`px-6 py-4 font-medium ${getCellStyle('gas', row.gas)}`}>{row.gas}</td>
                                                <td className="px-6 py-4 font-medium">{row.light}</td>
                                            </tr>
                                        ))}
                                        {getFilteredData().length === 0 && (<tr><td colSpan="5" className="px-6 py-8 text-center opacity-50 italic">{t.noData}</td></tr>)}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'config' && (
                        <div className="space-y-6">
                            <div className={`p-6 rounded-2xl border-l-4 border-blue-500 ${darkMode ? 'bg-gray-800/50' : 'bg-blue-50'}`}>
                                <div className="flex items-center gap-3 mb-4"><Info className="text-blue-500" /><h3 className="font-bold text-lg">{t.quickGuide}</h3></div>
                                <ul className="space-y-3">
                                    <li className="flex gap-3 text-sm items-start"><div className="min-w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">1</div><span>{t.step1}</span></li>
                                    <li className="flex gap-3 text-sm items-start"><div className="min-w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">2</div><span>{t.step2}</span></li>
                                    <li className="flex gap-3 text-sm items-start"><div className="min-w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">3</div><span>{t.step3}</span></li>
                                    <li className="flex gap-3 text-sm items-start"><div className="min-w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">4</div><span className="font-semibold">{t.step4}</span></li>
                                    <li className="flex gap-3 text-sm items-start"><div className="min-w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">5</div><span>{t.step5}</span></li>
                                </ul>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className={`p-8 rounded-2xl border shadow-md ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-700/50"><Wifi className="text-blue-500" /><h3 className="text-xl font-bold">{t.wifiConfig}</h3></div>
                                    <div className="space-y-4">
                                        <div><label className="block text-sm font-medium mb-1">{t.deviceId}</label><input type="text" value={configForm.deviceId} onChange={(e) => setConfigForm({ ...configForm, deviceId: e.target.value })} className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none transition ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`} /></div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">WiFi SSID</label>
                                            <input
                                                type="text"
                                                value={configForm.wifiSSID}
                                                onChange={(e) => setConfigForm({ ...configForm, wifiSSID: e.target.value })}
                                                placeholder="Nhập tên WiFi..."
                                                className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none transition ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                                            />
                                            <p className="text-xs text-yellow-500 mt-1 flex items-center gap-1">
                                                <Info size={12} /> Nhập thủ công để tránh mất kết nối
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">{t.wifiPass}</label>
                                            <div className="relative">
                                                <input
                                                    type={showWifiPass ? "text" : "password"}
                                                    value={configForm.wifiPass}
                                                    onChange={(e) => setConfigForm({ ...configForm, wifiPass: e.target.value })}
                                                    placeholder="********"
                                                    className={`w-full p-3 pr-10 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none transition ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowWifiPass(!showWifiPass)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                                >
                                                    {showWifiPass ? <Eye size={18} /> : <EyeOff size={18} />}
                                                </button>
                                            </div>
                                        </div>
                                        <button onClick={handleSaveConfig} className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2">
                                            <Save size={20} /> {t.save}
                                        </button>
                                    </div>
                                </div>
                                <div className={`p-8 rounded-2xl border shadow-md ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-700/50"><Router className="text-purple-500" /><h3 className="text-xl font-bold">{t.mqttConfig}</h3></div>
                                    <div className="space-y-4">
                                        <div><label className="block text-sm font-medium mb-1">{t.server}</label><input type="text" value={configForm.server} onChange={(e) => setConfigForm({ ...configForm, server: e.target.value })} className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-purple-500 outline-none transition ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`} /></div>
                                        <div><label className="block text-sm font-medium mb-1">{t.port}</label><input type="number" value={configForm.port} onChange={(e) => setConfigForm({ ...configForm, port: e.target.value })} className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-purple-500 outline-none transition ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`} /></div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">{t.token}</label>
                                            <div className="relative">
                                                <input
                                                    type={showToken ? "text" : "password"}
                                                    value={configForm.token}
                                                    onChange={(e) => setConfigForm({ ...configForm, token: e.target.value })}
                                                    className={`w-full p-3 pr-10 rounded-lg border focus:ring-2 focus:ring-purple-500 outline-none transition ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowToken(!showToken)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                                >
                                                    {showToken ? <Eye size={18} /> : <EyeOff size={18} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div><label className="block text-sm font-medium mb-1">{t.sendInterval}</label><input type="number" min="1" value={configForm.sendInterval} onChange={(e) => setConfigForm({ ...configForm, sendInterval: e.target.value })} className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-purple-500 outline-none transition ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`} /></div>
                                    </div>
                                    <div className="mt-8 flex gap-3">
                                        <button onClick={handleLoadConfig} className={`flex-1 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} text-current font-bold py-3 rounded-xl transition flex items-center justify-center gap-2`}>{isLoadingConfig ? <RefreshCw className="animate-spin" size={20} /> : <Download size={20} />}{t.load}</button>
                                        <button onClick={handleRefreshConfig} className={`flex-1 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} text-current font-bold py-3 rounded-xl transition flex items-center justify-center gap-2`}><RotateCcw size={20} />{t.refresh}</button>
                                        <button onClick={handleSaveConfig} className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 rounded-xl shadow-lg transform transition active:scale-95 flex items-center justify-center gap-2"><Save size={20} />{t.save}</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default App;

