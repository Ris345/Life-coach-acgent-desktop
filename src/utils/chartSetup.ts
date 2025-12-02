import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

// Global Defaults
ChartJS.defaults.color = '#71717a'; // zinc-500
ChartJS.defaults.borderColor = '#27272a'; // zinc-800
ChartJS.defaults.font.family = 'Inter, sans-serif';
