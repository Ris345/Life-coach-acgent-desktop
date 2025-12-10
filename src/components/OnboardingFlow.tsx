import { useState } from 'react';
import { PrivacyConsent } from './PrivacyConsent';
import { Login } from './Login';

interface OnboardingFlowProps {
    onComplete: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
    const [step, setStep] = useState<'welcome' | 'consent' | 'permissions' | 'login'>('welcome');

    const handleConsent = async (consented: boolean, analyticsOptIn: boolean) => {
        if (!consented) {
            alert("LifeOS requires these permissions to function. The app will run in limited mode.");
            // Still proceed but maybe track refusal?
        }

        // Save consent locally or prepare to send after login
        if (consented) {
            localStorage.setItem('privacy_consent', JSON.stringify({
                version: '1.0',
                consented: true,
                analytics_opt_in: analyticsOptIn,
                timestamp: new Date().toISOString()
            }));
        }

        setStep('login');
        onComplete();
    };

    if (step === 'welcome') {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black text-white">
                <div className="max-w-2xl w-full text-center space-y-8 p-8 animate-fade-in-up">
                    <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-pink-400">
                        Welcome to LifeOS
                    </h1>
                    <p className="text-xl text-zinc-400 max-w-lg mx-auto">
                        Your intelligent, privacy-first companion for deep work and meaningful progress.
                    </p>
                    <button
                        onClick={() => setStep('consent')}
                        className="px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:scale-105 transition-transform"
                    >
                        Get Started
                    </button>
                </div>
            </div>
        );
    }

    if (step === 'consent') {
        return <PrivacyConsent onConsent={handleConsent} />;
    }

    if (step === 'login') {
        return <Login />;
    }

    return null;
}
