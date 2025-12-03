import { X } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ChartView = ({ sensorKey, title, color, unit, historyData, onClose, t, darkMode }) => (
    <div className={`p-6 rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
        <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
                <button onClick={onClose} className="mr-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                    <X size={20} className={darkMode ? 'text-white' : 'text-gray-800'} />
                </button>
                <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    {t.liveGraph}: {title}
                </h2>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-mono ${darkMode ? 'bg-gray-700 text-green-400' : 'bg-gray-100 text-green-600'}`}>
                Live
            </div>
        </div>
        <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historyData}>
                    <defs>
                        <linearGradient id={`color${sensorKey}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#e5e7eb"} />
                    <XAxis dataKey="time" stroke={darkMode ? "#9ca3af" : "#6b7280"} />
                    <YAxis stroke={darkMode ? "#9ca3af" : "#6b7280"} domain={['auto', 'auto']} />
                    <Tooltip
                        contentStyle={{ backgroundColor: darkMode ? '#1f2937' : '#fff', borderColor: 'transparent', borderRadius: '8px' }}
                        itemStyle={{ color: color }}
                    />
                    <Area type="monotone" dataKey={sensorKey} stroke={color} fillOpacity={1} fill={`url(#color${sensorKey})`} strokeWidth={3} isAnimationActive={false} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    </div>
);

export default ChartView;
