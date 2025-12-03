import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import CircularGauge from './CircularGauge';
import Sparkline from './Sparkline';

const StatCard = ({ id, title, value, unit, icon: Icon, color, onClick, min, max, darkMode, t, trend, recentData = [] }) => {
    const getTrendIcon = () => {
        if (trend === 'up') return <TrendingUp size={16} className="text-green-500" />;
        if (trend === 'down') return <TrendingDown size={16} className="text-red-500" />;
        return <Minus size={16} className="text-gray-400" />;
    };

    return (
        <div onClick={onClick} className={`relative overflow-hidden p-6 rounded-2xl cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col items-center justify-between ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100 shadow-sm'}`}>
            <div className="flex items-center self-start mb-2 w-full justify-between">
                <div className="flex items-center">
                    <div className={`p-2 rounded-lg mr-3`} style={{ backgroundColor: `${color}20` }}>
                        <Icon size={20} color={color} />
                    </div>
                    <span className={`text-sm font-semibold truncate ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>{title}</span>
                </div>
                {trend && <div className="ml-2">{getTrendIcon()}</div>}
            </div>
            <div className="py-2">
                <CircularGauge value={value} min={min} max={max} unit={unit} color={color} size={140} darkMode={darkMode} />
            </div>
            <div className="w-full mt-3 flex justify-center">
                <Sparkline data={recentData} color={color} height={50} width={180} />
            </div>
            <p className="text-xs text-blue-500 mt-2 flex items-center self-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Activity size={12} className="mr-1" /> {t.viewGraph}
            </p>
        </div>
    );
};

export default StatCard;