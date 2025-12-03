const Sparkline = ({ data = [], color = "#3b82f6", height = 60, width = 200 }) => {
    if (!data || data.length < 2) {
        return <div style={{ height, width }} className="opacity-30 text-xs text-center flex items-center justify-center">No data</div>;
    }

    const values = data.map(d => typeof d === 'number' ? d : d.value || 0);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;

    const points = values.map((value, index) => {
        const x = (index / (values.length - 1)) * width;
        const y = height - ((value - min) / range) * (height - 10) - 5;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width={width} height={height} className="sparkline">
            <polyline
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
                opacity="0.8"
            />
            <polyline
                fill={color}
                fillOpacity="0.1"
                stroke="none"
                points={`0,${height} ${points} ${width},${height}`}
            />
        </svg>
    );
};

export default Sparkline;
