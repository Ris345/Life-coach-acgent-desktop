import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, AlertTriangle, Zap, X } from 'lucide-react';

export interface Nudge {
    id: string;
    level: 1 | 2 | 3;
    title: string;
    message: string;
    action?: 'notify' | 'intervene';
}

interface NudgeToastProps {
    nudge: Nudge | null;
    onDismiss: () => void;
}

export function NudgeToast({ nudge, onDismiss }: NudgeToastProps) {
    // Auto-dismiss after 5 seconds for level 1 & 2
    useEffect(() => {
        if (nudge && nudge.level < 3) {
            const timer = setTimeout(onDismiss, 8000);
            return () => clearTimeout(timer);
        }
    }, [nudge, onDismiss]);

    if (!nudge) return null;

    const getIcon = () => {
        switch (nudge.level) {
            case 1: return <Bell className="w-5 h-5 text-blue-400" />;
            case 2: return <AlertTriangle className="w-5 h-5 text-amber-400" />;
            case 3: return <Zap className="w-5 h-5 text-red-400" />;
            default: return <Bell className="w-5 h-5" />;
        }
    };

    const getBorderColor = () => {
        switch (nudge.level) {
            case 1: return 'border-blue-500/30';
            case 2: return 'border-amber-500/30';
            case 3: return 'border-red-500/50';
            default: return 'border-white/10';
        }
    };

    const getGlowColor = () => {
        switch (nudge.level) {
            case 1: return 'shadow-blue-500/20';
            case 2: return 'shadow-amber-500/20';
            case 3: return 'shadow-red-500/30';
            default: return 'shadow-white/10';
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                className="fixed bottom-8 right-8 z-50"
            >
                <div className={`
          relative overflow-hidden
          w-80 p-4 rounded-xl 
          bg-zinc-900/90 backdrop-blur-xl 
          border ${getBorderColor()}
          shadow-lg ${getGlowColor()}
        `}>
                    {/* Progress bar for auto-dismiss */}
                    {nudge.level < 3 && (
                        <motion.div
                            initial={{ width: "100%" }}
                            animate={{ width: "0%" }}
                            transition={{ duration: 8, ease: "linear" }}
                            className="absolute bottom-0 left-0 h-1 bg-white/10"
                        />
                    )}

                    <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg bg-white/5 ${getBorderColor()} border`}>
                            {getIcon()}
                        </div>

                        <div className="flex-1">
                            <h4 className="font-bold text-white text-sm mb-1">{nudge.title}</h4>
                            <p className="text-xs text-zinc-400 leading-relaxed">{nudge.message}</p>
                        </div>

                        <button
                            onClick={onDismiss}
                            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <X className="w-4 h-4 text-zinc-500" />
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
