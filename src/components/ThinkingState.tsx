import { useEffect, useState } from 'react';

interface ThinkingStateProps {
    isAnalyzing: boolean;
}

const STEPS = [
    "Analyzing your goal...",
    "Reviewing your browsing history...",
    "Calculating success probability...",
    "Identifying potential distractions...",
    "Generating personalized strategy...",
    "Finalizing action plan..."
];

export function ThinkingState({ isAnalyzing }: ThinkingStateProps) {
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        if (!isAnalyzing) {
            setCurrentStep(0);
            return;
        }

        const interval = setInterval(() => {
            setCurrentStep((prev) => {
                if (prev < STEPS.length - 1) {
                    return prev + 1;
                }
                return prev;
            });
        }, 2000);

        return () => clearInterval(interval);
    }, [isAnalyzing]);

    if (!isAnalyzing) return null;

    return (
        <div className="relative overflow-hidden bg-black/40 p-8 rounded-2xl mb-8 border border-purple-500/20 shadow-[0_0_50px_-12px_rgba(168,85,247,0.2)]">
            {/* Background Animation */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-blue-500/5 to-purple-500/5 animate-pulse" />

            <div className="relative z-10 flex flex-col items-center justify-center text-center">
                {/* Central Orb */}
                <div className="relative w-20 h-20 mb-6">
                    <div className="absolute inset-0 bg-purple-500 rounded-full blur-xl animate-pulse opacity-50"></div>
                    <div className="absolute inset-0 border-2 border-purple-400 rounded-full animate-spin-slow opacity-70"></div>
                    <div className="absolute inset-2 border-2 border-blue-400 rounded-full animate-reverse-spin opacity-70"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-3 h-3 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)] animate-ping"></div>
                    </div>
                </div>

                <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 mb-2">
                    Constructing Your Success Plan
                </h3>

                <div className="h-8 flex items-center justify-center">
                    <p className="text-zinc-400 font-mono text-sm animate-fade-in key={currentStep}">
                        {">"} {STEPS[currentStep]}
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="mt-8 w-full max-w-md h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500 ease-out relative"
                        style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
                    >
                        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-r from-transparent to-white/50"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
