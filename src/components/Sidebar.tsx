import { LayoutDashboard, Target, BarChart2, Settings, Command, User } from 'lucide-react';

interface SidebarProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
    const menuItems = [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { id: 'goals', icon: Target, label: 'Goals' },
        { id: 'analytics', icon: BarChart2, label: 'Analytics' },
        { id: 'settings', icon: Settings, label: 'Settings' },
    ];

    return (
        <div className="w-64 h-screen fixed left-0 top-0 bg-black/40 backdrop-blur-xl border-r border-white/10 flex flex-col p-6 z-50">
            <div className="flex items-center gap-3 mb-10 px-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                    <Command size={18} />
                </div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 font-serif tracking-tight">
                    LifeOS
                </span>
            </div>

            <nav className="space-y-2 flex-1">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onTabChange(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${activeTab === item.id
                            ? 'bg-white/10 text-white shadow-lg shadow-white/5 border border-white/10'
                            : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                            }`}
                    >
                        <item.icon size={20} className={`transition-transform duration-200 ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
                        <span className="font-medium text-sm">{item.label}</span>
                        {activeTab === item.id && (
                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
                        )}
                    </button>
                ))}

                {/* Flow Mode Toggle Section */}
                <div className="mt-8 px-4">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-white/5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Flow Mode</span>
                            <div className="w-2 h-2 rounded-full bg-zinc-700" />
                        </div>
                        <p className="text-xs text-zinc-500 mb-3">Block distractions & focus</p>
                        <button className="w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-xs font-medium text-zinc-300 transition-colors">
                            Activate
                        </button>
                    </div>
                </div>
            </nav>

            <div className="mt-auto pt-6 border-t border-white/10">
                <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-600 border border-white/10 flex items-center justify-center">
                        <User size={14} className="text-zinc-400 group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">User</div>
                        <div className="text-xs text-zinc-500 truncate">Pro Plan</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
