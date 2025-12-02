import { useState } from 'react';
import { Zap } from 'lucide-react';

interface SmartNudgeToggleProps {
    enabled: boolean;
    onToggle: (enabled: boolean) => void;
}

export function SmartNudgeToggle({ enabled, onToggle }: SmartNudgeToggleProps) {
    const [isHovered, setIsHovered] = useState(false);

    const handleToggle = () => {
        onToggle(!enabled);
    };

    return (

        <div
            className={`
                flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all duration-300 transform
                ${enabled
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 border-transparent shadow-lg shadow-indigo-500/30'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'}
                ${isHovered ? '-translate-y-0.5 shadow-xl' : 'translate-y-0'}
            `}
            onClick={handleToggle}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                    <Zap size={20} className={enabled ? 'text-white' : 'text-zinc-400'} />
                    <span className="text-base font-semibold text-white">
                        Smart Nudge
                    </span>
                    {enabled && (
                        <span className="text-[10px] px-2 py-0.5 bg-white/20 rounded-full text-white font-medium">
                            ACTIVE
                        </span>
                    )}
                </div>
                <p className={`text-sm m-0 leading-snug ${enabled ? 'text-white/90' : 'text-white/60'}`}>
                    {enabled
                        ? 'AI will help you stay focused by closing distractions'
                        : 'Enable AI to help you stay on track with your goals'}
                </p>
            </div>

            {/* Toggle Switch */}
            <div className={`
                relative w-[52px] h-[28px] rounded-full transition-colors duration-300 ml-4
                ${enabled ? 'bg-green-400' : 'bg-white/20'}
            `}>
                <div className={`
                    absolute top-[2px] w-[24px] h-[24px] bg-white rounded-full transition-all duration-300 shadow-sm
                    ${enabled ? 'left-[26px]' : 'left-[2px]'}
                `} />
            </div>
        </div>
    );
}
