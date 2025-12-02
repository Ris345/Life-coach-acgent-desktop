import { useGoalSessionStore } from '../stores/useGoalSessionStore';

export function useGoalAnalysis() {
    const store = useGoalSessionStore();

    const runAnalysis = async (goalText: string, userId: string) => {
        store.setGoalText(goalText);
        store.startAnalysis();

        // Simulate progress for steps 1-3
        store.updateStep('understand', 'in_progress');
        await new Promise(r => setTimeout(r, 1500));
        store.updateStep('understand', 'done');

        store.updateStep('skills', 'in_progress');
        await new Promise(r => setTimeout(r, 1500));
        store.updateStep('skills', 'done');

        store.updateStep('plan', 'in_progress');

        try {
            // Real API Call
            const response = await fetch('http://127.0.0.1:14200/api/goals/set', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    goal: goalText
                })
            });

            if (!response.ok) {
                throw new Error('Failed to analyze goal');
            }

            const data = await response.json();

            // Complete remaining steps
            store.updateStep('plan', 'done');

            store.updateStep('rules', 'in_progress');
            await new Promise(r => setTimeout(r, 800));
            store.updateStep('rules', 'done');

            store.updateStep('dashboard', 'in_progress');
            await new Promise(r => setTimeout(r, 800));

            // Finalize
            store.completeAnalysis({
                parsedGoal: data.parsed_goal,
                strategy: data.strategy,
                probability: data.success_probability,
                trackingProfile: data.tracking_profile
            });

        } catch (error) {
            console.error("Analysis failed:", error);
            store.failAnalysis(error instanceof Error ? error.message : 'Unknown error');
        }
    };

    return {
        runAnalysis,
        isAnalyzing: store.isAnalyzing
    };
}
