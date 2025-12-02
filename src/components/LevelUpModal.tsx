import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Zap, Crown } from 'lucide-react';
import confetti from 'canvas-confetti';

interface LevelUpModalProps {
    level: number;
    onClose: () => void;
}

export function LevelUpModal({ level, onClose }: LevelUpModalProps) {
    useEffect(() => {
        // Trigger confetti
        const duration = 3000;
        const end = Date.now() + duration;

        const frame = () => {
            confetti({
                particleCount: 2,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#a855f7', '#ec4899', '#3b82f6']
            });
            confetti({
                particleCount: 2,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#a855f7', '#ec4899', '#3b82f6']
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        };
        frame();
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className="relative max-w-md w-full bg-zinc-900 border border-purple-500/50 rounded-2xl p-8 text-center shadow-2xl shadow-purple-500/20 overflow-hidden"
            >
                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/20 rounded-full blur-[100px]" />

                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="relative z-10"
                >
                    <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/40">
                        <Crown className="w-12 h-12 text-white" />
                    </div>

                    <h2 className="text-4xl font-bold text-white mb-2">Level Up!</h2>
                    <p className="text-zinc-400 mb-8">You've reached Level <span className="text-purple-400 font-bold text-xl">{level}</span></p>

                    <div className="space-y-4 mb-8 text-left">
                        <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex items-center gap-4">
                            <div className="p-2 bg-purple-500/20 rounded-lg">
                                <Zap className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-white">XP Multiplier</h4>
                                <p className="text-xs text-zinc-400">Earn 1.1x XP for Flow State</p>
                            </div>
                        </div>

                        <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex items-center gap-4">
                            <div className="p-2 bg-pink-500/20 rounded-lg">
                                <Star className="w-5 h-5 text-pink-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-white">New Badge Unlocked</h4>
                                <p className="text-xs text-zinc-400">"Focus Master" badge added</p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors"
                    >
                        Awesome!
                    </button>
                </motion.div>
            </motion.div>
        </div>
    );
}
