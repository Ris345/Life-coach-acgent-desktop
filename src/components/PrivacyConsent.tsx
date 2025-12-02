import { useState } from 'react';
import { Shield, Lock, Eye, Check, X } from 'lucide-react';
import { GlassCard } from './GlassCard';

interface PrivacyConsentProps {
    onConsent: (consented: boolean, analyticsOptIn: boolean) => void;
}

export function PrivacyConsent({ onConsent }: PrivacyConsentProps) {
    const [analyticsOptIn, setAnalyticsOptIn] = useState(true);
    const [showPolicy, setShowPolicy] = useState(false);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <GlassCard className="max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 animate-fade-in-up">
                {!showPolicy ? (
                    <div className="space-y-6">
                        <div className="text-center space-y-2">
                            <div className="inline-flex p-3 rounded-full bg-violet-500/20 text-violet-400 mb-2">
                                <Shield className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Your Privacy is Our Priority</h2>
                            <p className="text-zinc-400">
                                LifeOS is designed to be a private, local-first life coach. We believe your data belongs to you.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                                <Lock className="w-6 h-6 text-emerald-400" />
                                <h3 className="font-medium text-white">Local First</h3>
                                <p className="text-xs text-zinc-400">Your activity data is stored locally on your device (SQLite).</p>
                            </div>
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                                <Eye className="w-6 h-6 text-blue-400" />
                                <h3 className="font-medium text-white">Transparent</h3>
                                <p className="text-xs text-zinc-400">We only track active windows to measure focus. No keystrokes.</p>
                            </div>
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                                <Shield className="w-6 h-6 text-purple-400" />
                                <h3 className="font-medium text-white">No Selling</h3>
                                <p className="text-xs text-zinc-400">We never sell your data. Cloud sync is optional and encrypted.</p>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-white/10">
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        className="peer sr-only"
                                        checked={true}
                                        readOnly
                                    />
                                    <div className="w-5 h-5 border-2 border-violet-500 rounded bg-violet-500 flex items-center justify-center">
                                        <Check className="w-3 h-3 text-white" />
                                    </div>
                                </div>
                                <div className="text-sm text-zinc-300">
                                    I agree to the <button onClick={() => setShowPolicy(true)} className="text-violet-400 hover:underline">Privacy Policy</button> and allow LifeOS to process my app usage data locally to provide coaching features.
                                </div>
                            </label>

                            <label className="flex items-start gap-3 cursor-pointer group">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        className="peer sr-only"
                                        checked={analyticsOptIn}
                                        onChange={(e) => setAnalyticsOptIn(e.target.checked)}
                                    />
                                    <div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-colors ${analyticsOptIn ? 'bg-violet-500 border-violet-500' : 'border-zinc-600 bg-transparent'}`}>
                                        {analyticsOptIn && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                </div>
                                <div className="text-sm text-zinc-300">
                                    (Optional) Allow anonymous usage statistics to help improve LifeOS.
                                </div>
                            </label>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={() => onConsent(false, false)}
                                className="flex-1 px-4 py-3 rounded-xl bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors font-medium"
                            >
                                Decline
                            </button>
                            <button
                                onClick={() => onConsent(true, analyticsOptIn)}
                                className="flex-[2] px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 text-white font-bold hover:opacity-90 transition-opacity shadow-lg shadow-violet-500/20"
                            >
                                Accept & Continue
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">Privacy Policy</h2>
                            <button onClick={() => setShowPolicy(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                <X className="w-5 h-5 text-zinc-400" />
                            </button>
                        </div>

                        <div className="prose prose-invert prose-sm max-w-none h-96 overflow-y-auto pr-2 custom-scrollbar">
                            <h3>1. Data Collection</h3>
                            <p>LifeOS collects data about your active applications and browser tabs ("Usage Data") to provide coaching features. This data is processed and stored <strong>locally on your device</strong>.</p>

                            <h3>2. Data Usage</h3>
                            <p>We use Usage Data to:</p>
                            <ul>
                                <li>Calculate focus scores.</li>
                                <li>Detect distractions.</li>
                                <li>Generate local AI insights.</li>
                            </ul>

                            <h3>3. Data Sharing</h3>
                            <p>We do <strong>not</strong> sell your data. We do not transmit your Usage Data to any cloud servers unless you explicitly enable "Cloud Sync" in the Pro tier.</p>

                            <h3>4. User Rights</h3>
                            <p>You may export or delete your data at any time via the Settings menu.</p>

                            <h3>5. AI Processing</h3>
                            <p>AI processing is performed locally via Ollama. No personal data is sent to third-party LLM providers by default.</p>
                        </div>

                        <button
                            onClick={() => setShowPolicy(false)}
                            className="w-full px-4 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors font-medium"
                        >
                            Back to Consent
                        </button>
                    </div>
                )}
            </GlassCard>
        </div>
    );
}
