import { GlassCard } from './GlassCard';
import { Sun, Quote, CheckCircle } from 'lucide-react';

interface MorningBriefingProps {
    data: {
        greeting: string;
        summary: string;
        focus_areas: string[];
        quote: string;
    } | null;
}

export function MorningBriefing({ data }: MorningBriefingProps) {
    if (!data) return null;

    return (
        <GlassCard className="p-8 relative overflow-hidden animate-fade-in mb-8 bg-gradient-to-br from-orange-500/5 to-purple-500/5">
            <div className="absolute top-0 right-0 p-8 opacity-10">
                <Sun size={120} className="text-orange-400" />
            </div>

            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-orange-500/20 rounded-lg text-orange-400">
                        <Sun size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-white">Morning Briefing</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-6">
                        <div>
                            <h3 className="text-2xl font-bold text-white mb-2">{data.greeting}</h3>
                            <p className="text-zinc-400 leading-relaxed">{data.summary}</p>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Today's Focus</h4>
                            <div className="grid gap-3">
                                {data.focus_areas.map((area, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
                                        <CheckCircle size={18} className="text-green-400" />
                                        <span className="text-zinc-200">{area}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col justify-center">
                        <div className="p-6 rounded-xl bg-white/5 border border-white/10 relative">
                            <Quote size={24} className="text-zinc-600 absolute top-4 left-4 opacity-50" />
                            <p className="text-zinc-300 italic text-center pt-6 pb-2 px-2 font-serif text-lg">
                                "{data.quote}"
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </GlassCard>
    );
}
