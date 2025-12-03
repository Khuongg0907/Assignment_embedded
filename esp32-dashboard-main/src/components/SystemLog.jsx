import { Clock, Activity } from 'lucide-react';

const SystemLog = ({ logs, darkMode, t }) => {
    const getEventIcon = (type) => {
        return <Activity size={16} className="text-blue-500" />;
    };

    const getEventColor = (type) => {
        switch (type) {
            case 'error': return 'text-red-500';
            case 'warning': return 'text-yellow-500';
            case 'success': return 'text-green-500';
            default: return 'text-blue-500';
        }
    };

    return (
        <div className={`rounded-2xl shadow-sm overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="p-6 border-b border-gray-700/50">
                <h3 className="text-xl font-bold flex items-center gap-2">
                    <Clock size={20} className="text-blue-500" />
                    {t.systemLog || 'System Log'}
                </h3>
                <p className="text-xs opacity-60 mt-1">
                    {t.systemLogDesc || 'Recent system events and activities'}
                </p>
            </div>
            <div className="overflow-x-auto max-h-96">
                <table className={`w-full text-sm text-left ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <thead className={`text-xs uppercase ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-50 text-gray-700'}`}>
                        <tr>
                            <th className="px-6 py-3">{t.time || 'Time'}</th>
                            <th className="px-6 py-3">{t.eventType || 'Type'}</th>
                            <th className="px-6 py-3">{t.message || 'Message'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.slice().reverse().map((log, idx) => (
                            <tr key={log.id || idx} className={`border-b ${darkMode ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-100 hover:bg-gray-50'}`}>
                                <td className="px-6 py-4 font-mono text-xs">{log.timestamp}</td>
                                <td className="px-6 py-4">
                                    <span className={`flex items-center gap-2 ${getEventColor(log.type)}`}>
                                        {getEventIcon(log.type)}
                                        {log.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4">{log.message}</td>
                            </tr>
                        ))}
                        {logs.length === 0 && (
                            <tr>
                                <td colSpan="3" className="px-6 py-8 text-center opacity-50 italic">
                                    {t.noLogs || 'No events logged yet'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SystemLog;
