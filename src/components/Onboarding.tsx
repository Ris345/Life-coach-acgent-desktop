import { useState } from 'react';
import { getSupabaseClient } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { OnboardingFlow } from './OnboardingFlow';

export function Onboarding() {
    const { refreshUser } = useAuth();
    const [isCompleting, setIsCompleting] = useState(false);

    const handleOnboardingComplete = async () => {
        setIsCompleting(true);
        try {
            const supabase = getSupabaseClient();
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) throw new Error('Not authenticated');

            // Mark onboarding as completed in Supabase
            const { error: updateError } = await supabase.auth.updateUser({
                data: { onboarding_completed: true }
            });

            if (updateError) throw updateError;

            // Refresh user state to trigger navigation to Dashboard
            await refreshUser();

        } catch (error) {
            console.error('Error completing onboarding:', error);
            setIsCompleting(false);
        }
    };

    if (isCompleting) {
        return (
            <div className="fixed inset-0 bg-black flex items-center justify-center text-white">
                <div className="animate-pulse">Setting up your workspace...</div>
            </div>
        );
    }

    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
}
