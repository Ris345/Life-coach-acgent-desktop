import React from 'react';
import {
    LayoutDashboard,
    Target,
    BarChart2,
    Brain,
    Settings,
    Zap,
    LogOut
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
    currentPath: string;
    onNavigate: (path: string) => void;
}

export function Sidebar({ currentPath, onNavigate }: SidebarProps) {
    const { user, signOut } = useAuth();

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: Target, label: 'Goals', path: '/goals' },
        { icon: BarChart2, label: 'Analytics', path: '/analytics' },
        { icon: Brain, label: 'Coaching', path: '/coaching' },
        { icon: Settings, label: 'Settings', path: '/settings' },
    ];

    return (
        <div className="w-64 h-screen bg-zinc-950 border-r border-white/10 flex flex-col">
            {/* User Profile */}
            <div className="p-6 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                        {user?.email?.[0].toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-white truncate">
                            {user?.name || 'User'}
                        </h3>
                        <span className="text-xs text-emerald-400 font-mono px-1.5 py-0.5 bg-emerald-500/10 rounded">
                            PRO
                        </span>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = currentPath === item.path;
                    return (
                        <button
                            key={item.path}
                            onClick={() => onNavigate(item.path)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                                    ? 'bg-white/10 text-white'
                                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <item.icon size={18} />
                            {item.label}
                        </button>
                    );
                })}
            </nav>

            {/* Flow Mode Toggle Area */}
            <div className="p-4 border-t border-white/5">
                <div className="bg-zinc-900/50 rounded-xl p-4 border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-zinc-400">FLOW MODE</span>
                        <Zap size={14} className="text-yellow-500" />
                    </div>
                    <button className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-medium text-zinc-300 transition-colors">
                        Activate Deep Work
                    </button>
                </div>
            </div>

            {/* Sign Out */}
            <div className="p-4">
                <button
                    onClick={signOut}
                    className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                    <LogOut size={14} />
                    Sign Out
                </button>
            </div>
        </div>
    );
}
