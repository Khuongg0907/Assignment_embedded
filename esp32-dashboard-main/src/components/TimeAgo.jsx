import { useState, useEffect } from 'react';

const TimeAgo = ({ timestamp, t }) => {
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            const diff = Math.floor((now.getTime() - timestamp.getTime()) / 1000);
            setSeconds(diff >= 0 ? diff : 0);
        };

        updateTime();
        const interval = setInterval(updateTime, 1000);

        return () => clearInterval(interval);
    }, [timestamp]);

    return (
        <span>{seconds} {t.secondsAgo}</span>
    );
};

export default TimeAgo;
