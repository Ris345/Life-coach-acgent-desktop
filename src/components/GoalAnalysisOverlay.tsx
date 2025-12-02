import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { useGoalSessionStore, AnalysisStep } from '../stores/useGoalSessionStore';

export function GoalAnalysisOverlay() {
    const { isAnalyzing, analysisSteps } = useGoalSessionStore();

    if (!isAnalyzing) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
            >
                <div className="w-full max-w-2xl p-8 flex flex-col items-center">

                    {/* AI Orb Animation */}
                    <div className="relative w-32 h-32 mb-12 flex items-center justify-center">
                        <motion.div
                            animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.5, 0.8, 0.5],
                                rotate: [0, 180, 360],
                            }}
                            transition={{
                                duration: 4,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                            className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 blur-xl opacity-50"
                        />
                        <motion.div
                            animate={{
                                scale: [1, 1.1, 1],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                            className="relative w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 shadow-[0_0_30px_rgba(168,85,247,0.5)]"
                        />
                    </div>

                    {/* Text */}
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-3xl font-light text-white mb-2 text-center"
                    >
                        Analyzing your goal...
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-zinc-400 text-center mb-12 max-w-md"
                    >
                        We're breaking this down into a roadmap, focus profile, and live tracking rules.
                    </motion.p>

                    {/* Steps */}
                    <div className="w-full max-w-md space-y-4">
                        {analysisSteps.map((step, index) => (
                            <StepItem key={step.id} step={step} index={index} />
                        ))}
                    </div>

                </div>
            </motion.div>
        </AnimatePresence>
    );
}

function StepItem({ step, index }: { step: AnalysisStep; index: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            className="flex items-center gap-4"
        >
            <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                {step.status === 'done' && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-emerald-400"
                    >
                        <CheckCircle2 size={20} />
                    </motion.div>
                )}
                {step.status === 'in_progress' && (
                    <Loader2 size={20} className="text-indigo-400 animate-spin" />
                )}
                {step.status === 'pending' && (
                    <Circle size={20} className="text-zinc-700" />
                )}
            </div>

            <span className={`text-sm font-medium transition-colors duration-300 ${step.status === 'pending' ? 'text-zinc-600' :
                    step.status === 'in_progress' ? 'text-indigo-300' : 'text-zinc-200'
                }`}>
                {step.label}
            </span>
        </motion.div>
    );
}
