
const CircularGauge = ({ value, min, max, unit, color, size = 120, darkMode }) => {
    const radius = size * 0.4;
    const strokeWidth = size * 0.1;
    const center = size / 2;
    const circumference = 2 * Math.PI * radius;

    const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center">
            <svg width={size} height={size} className="transform -rotate-90">
                <circle cx={center} cy={center} r={radius} fill="transparent" stroke={darkMode ? "#374151" : "#e5e7eb"} strokeWidth={strokeWidth} strokeLinecap="round" />
                <circle cx={center} cy={center} r={radius} fill="transparent" stroke={color} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
                <span className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{Number(value).toFixed(1)}</span>
                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{unit}</span>
            </div>
        </div>
    );
};

export default CircularGauge;