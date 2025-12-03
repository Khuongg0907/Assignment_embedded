
const SidebarItem = ({ id, icon: Icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center w-full p-4 mb-2 transition-all rounded-lg ${active
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
            : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
            }`}
    >
        <Icon size={20} className="mr-3" />
        <span className="font-medium">{label}</span>
    </button>
);

export default SidebarItem;
