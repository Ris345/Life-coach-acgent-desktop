import { create } from 'zustand';

export type AnalysisStepStatus = 'pending' | 'in_progress' | 'done';

export interface AnalysisStep {
    id: string;
    label: string;
    status: AnalysisStepStatus;
}

interface GoalSessionState {
    activeGoalText: string | null;
    parsedGoal: any | null;
    strategy: any | null;
    probability: number | null;
    trackingProfile: any | null;
    isAnalyzing: boolean;
    analysisSteps: AnalysisStep[];

    setGoalText: (text: string) => void;
    startAnalysis: () => void;
    updateStep: (id: string, status: AnalysisStepStatus) => void;
    completeAnalysis: (payload: { parsedGoal: any; strategy: any; probability: number; trackingProfile: any }) => void;
    failAnalysis: (error: string) => void;
    reset: () => void;
}

const INITIAL_STEPS: AnalysisStep[] = [
    { id: 'understand', label: 'Understanding your goal', status: 'pending' },
    { id: 'skills', label: 'Mapping skills & milestones', status: 'pending' },
    { id: 'plan', label: 'Building your weekly plan', status: 'pending' },
    { id: 'rules', label: 'Configuring focus & distraction rules', status: 'pending' },
    { id: 'dashboard', label: 'Updating success probability', status: 'pending' },
];

export const useGoalSessionStore = create<GoalSessionState>((set) => ({
    activeGoalText: null,
    parsedGoal: null,
    strategy: null,
    probability: null,
    trackingProfile: null,
    isAnalyzing: false,
    analysisSteps: INITIAL_STEPS,

    setGoalText: (text) => set({ activeGoalText: text }),

    startAnalysis: () => set({
        isAnalyzing: true,
        analysisSteps: INITIAL_STEPS.map(s => ({ ...s, status: 'pending' })),
        parsedGoal: null,
        strategy: null,
        probability: null,
        trackingProfile: null
    }),

    updateStep: (id, status) => set((state) => ({
        analysisSteps: state.analysisSteps.map((step) =>
            step.id === id ? { ...step, status } : step
        )
    })),

    completeAnalysis: ({ parsedGoal, strategy, probability, trackingProfile }) => set({
        isAnalyzing: false,
        parsedGoal,
        strategy,
        probability,
        trackingProfile,
        analysisSteps: INITIAL_STEPS.map(s => ({ ...s, status: 'done' }))
    }),

    failAnalysis: (error) => set({
        isAnalyzing: false,
        // Keep steps as is to show where it failed? Or reset?
        // For now, just stop analyzing.
    }),

    reset: () => set({
        activeGoalText: null,
        parsedGoal: null,
        strategy: null,
        probability: null,
        trackingProfile: null,
        isAnalyzing: false,
        analysisSteps: INITIAL_STEPS
    })
}));
