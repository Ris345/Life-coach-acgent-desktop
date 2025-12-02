import { useState } from 'react';
import { PrivacyConsent } from './PrivacyConsent';
import { PermissionRequest } from './PermissionRequest';
import { useAuth } from '../contexts/AuthContext';

interface OnboardingFlowProps {
    onComplete: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
    const [step, setStep] = useState<'welcome' | 'permissions' | 'consent'>('welcome');
    const { user } = useAuth();

    const handleConsent = async (consented: boolean, analyticsOptIn: boolean) => {
        if (!consented) {
            // Handle decline (maybe show limited mode warning or exit)
            alert("LifeOS requires these permissions to function. The app will run in limited mode.");
            onComplete();
            return;
        }

        // Save consent to backend
        if (user?.id) {
            try {
                await fetch('http://127.0.0.1:14200/api/user/consent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_id: user.id,
                        version: '1.0',
                        consented: true,
                        analytics_opt_in: analyticsOptIn
                    })
                });
            } catch (e) {
                console.error("Failed to save consent", e);
            }
        }

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
                        onClick={() => setStep('permissions')}
                        className="px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:scale-105 transition-transform"
                    >
                        Get Started
                    </button>
                </div>
            </div>
        );
    }

    if (step === 'permissions') {
        return <PermissionRequest onComplete={() => setStep('consent')} />;
    }

    if (step === 'consent') {
        return <PrivacyConsent onConsent={handleConsent} />;
    }

    return null;
}
