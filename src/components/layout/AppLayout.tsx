import React from 'react';
import { Sidebar } from './Sidebar';

interface AppLayoutProps {
    children: React.ReactNode;
    currentPath: string;
    onNavigate: (path: string) => void;
}

export function AppLayout({ children, currentPath, onNavigate }: AppLayoutProps) {
    // State lifted to App.tsx
    // const [currentPath, setCurrentPath] = useState(window.location.pathname);

    // const handleNavigate = (path: string) => {
    //     window.history.pushState({}, '', path);
    //     setCurrentPath(path);
    // };

    return (
        <div className="flex h-screen bg-zinc-950 text-white font-sans overflow-hidden">
            {/* Left Sidebar */}
            <Sidebar currentPath={currentPath} onNavigate={onNavigate} />

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* Top Header (can be extracted later) */}
                <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-zinc-950/50 backdrop-blur-sm z-10">
                    <h1 className="text-lg font-semibold text-white">Dashboard</h1>
                    <div className="flex items-center gap-4">
                        {/* Status Indicators */}
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xs font-medium text-emerald-400">System Active</span>
                        </div>
                    </div>
                </header>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </div>
            </main>

            {/* Right Sidebar (Optional/Collapsible) */}
            {/* <div className="w-80 border-l border-white/10 bg-zinc-950 hidden xl:block">
        <div className="p-4">
            <h3 className="text-xs font-semibold text-zinc-500 mb-4">LIVE FEED</h3>
             Placeholder 
        </div>
      </div> */}
        </div>
    );
}
