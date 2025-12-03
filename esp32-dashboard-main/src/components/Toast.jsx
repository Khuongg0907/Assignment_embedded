import { useEffect } from 'react';
import { X, AlertTriangle, Info, CheckCircle } from 'lucide-react';

const Toast = ({ message, type = 'info', onClose, duration = 5000 }) => {
    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(onClose, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    const getIcon = () => {
        switch (type) {
            case 'danger': return <AlertTriangle size={20} />;
            case 'success': return <CheckCircle size={20} />;
            default: return <Info size={20} />;
        }
    };

    const getStyles = () => {
        switch (type) {
            case 'danger': return 'bg-red-500 text-white';
            case 'warning': return 'bg-yellow-500 text-white';
            case 'success': return 'bg-green-500 text-white';
            default: return 'bg-blue-500 text-white';
        }
    };

    return (
        <div className="max-w-sm w-full animate-in slide-in-from-top-5 duration-300">
            <div className={`${getStyles()} rounded-lg shadow-lg p-4 flex items-center gap-3`}>
                <div className="flex-shrink-0">{getIcon()}</div>
                <p className="flex-1 text-sm font-medium">{message}</p>
                <button onClick={onClose} className="flex-shrink-0 hover:opacity-80 transition">
                    <X size={18} />
                </button>
            </div>
        </div>
    );
};

export default Toast;
