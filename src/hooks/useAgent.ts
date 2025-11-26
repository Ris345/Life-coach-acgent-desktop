import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

interface ContextResponse {
  active_window: string | null;
  platform: string;
  status: string;
  category?: string | null;
  focus_time_seconds?: number;
  distraction_time_seconds?: number;
  current_streak_seconds?: number;
  longest_streak_seconds?: number;
  total_polls?: number;
  productive_apps?: Record<string, number>;
  nudge?: string | null;
  current_goal?: string | null;
  profile?: any;
  drift?: boolean;
  daily_complete?: boolean;
  weekly_progress?: number;
  goal_alignment?: {
    goal_alignment: number;
    goal_minutes_today: number;
    required_minutes_today: number;
    goal_progress_percent: number;
  } | null;
  last_tracked_app?: string | null;
  last_tracked_category?: string | null;
}

interface BehaviorStats {
  total_focus_minutes: number;
  total_distraction_minutes: number;
  total_neutral_minutes: number;
  total_polls: number;
  longest_focus_streak_seconds: number;
  current_streak_seconds: number;
  current_category: string | null;
  app_switches: number;
  session_start: string | null;
  total_session_time_seconds: number;
  productive_app_time_map: Record<string, number>;
}

interface DailySummary {
  date: string;
  total_focus_minutes: number;
  total_distraction_minutes: number;
  total_neutral_minutes: number;
  longest_focus_streak_minutes: number;
  top_distracting_apps: Array<{
    app_name: string;
    total_minutes: number;
    category: string;
    usage_count: number;
  }>;
  top_productive_apps: Array<{
    app_name: string;
    total_minutes: number;
    category: string;
    usage_count: number;
  }>;
  total_app_switches: number;
  focus_percentage: number;
}

interface WeeklyReport {
  status: string;
  report?: {
    celebration: string;
    insights: string;
    recommendation: string;
    motivation: string;
  };
  ollama_available?: boolean;
  error?: string;
}

interface UseAgentOptions {
  goal?: string | null;
}

export function useAgent(options: UseAgentOptions = {}) {
  const [context, setContext] = useState<ContextResponse | null>(null);
  const [stats, setStats] = useState<BehaviorStats | null>(null);
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let summaryFetchCounter = 0;
    
    const fetchData = async () => {
      try {
        // Fetch activity (this also records in tracker)
        // Include goal in query params if provided
        const activityUrl = options.goal 
          ? `http://127.0.0.1:14200/activity?goal=${encodeURIComponent(options.goal)}`
          : "http://127.0.0.1:14200/activity";
        
        const activityResponse = await fetch(activityUrl, {
          method: 'GET',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (activityResponse.ok) {
          const activityData: ContextResponse = await activityResponse.json();
          setContext(activityData);
          
          // Send notification if nudge is present (prevent duplicates)
          // This will show as a system notification banner even when app is in background
          if (activityData.nudge && activityData.nudge !== context?.nudge) {
            try {
              await invoke("notify_user", {
                title: "LifeOS",
                body: activityData.nudge,
              });
              console.log("📬 Notification sent:", activityData.nudge);
            } catch (err) {
              console.warn("Failed to send notification:", err);
            }
          }
          console.log("✅ Activity:", activityData.active_window, "Category:", activityData.status);
        } else {
          console.warn("⚠️ Activity endpoint returned:", activityResponse.status);
        }

        // Fetch stats (every poll)
        try {
          const statsResponse = await fetch("http://127.0.0.1:14200/stats", {
            method: 'GET',
            mode: 'cors',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (statsResponse.ok) {
            const statsData: BehaviorStats = await statsResponse.json();
            setStats(statsData);
            console.log("📊 Stats:", {
              polls: statsData.total_polls,
              focus: statsData.total_focus_minutes.toFixed(1) + "m",
              streak: (statsData.current_streak_seconds / 60).toFixed(1) + "m",
              category: statsData.current_category
            });
          } else {
            console.warn("⚠️ Stats endpoint returned:", statsResponse.status);
          }
        } catch (statsErr) {
          console.warn("❌ Failed to fetch stats:", statsErr);
        }

        // Fetch summary (every 5 polls = ~10 seconds)
        summaryFetchCounter++;
        if (summaryFetchCounter >= 5) {
          summaryFetchCounter = 0;
          try {
            const summaryResponse = await fetch("http://127.0.0.1:14200/summary", {
              method: 'GET',
              mode: 'cors',
              headers: {
                'Content-Type': 'application/json',
              },
            });
            
            if (summaryResponse.ok) {
              const summaryData: DailySummary = await summaryResponse.json();
              setSummary(summaryData);
            }
          } catch (summaryErr) {
            console.warn("❌ Failed to fetch summary:", summaryErr);
          }
          
          // Fetch weekly report periodically (every ~30 seconds, or every 30 polls)
          if (summaryFetchCounter === 0) {
            try {
              const reportResponse = await fetch("http://127.0.0.1:14200/weekly_report", {
                method: 'GET',
                mode: 'cors',
                headers: {
                  'Content-Type': 'application/json',
                },
              });
              if (reportResponse.ok) {
                const reportData: WeeklyReport = await reportResponse.json();
                setWeeklyReport(reportData);
              }
            } catch (err) {
              console.warn("Failed to fetch weekly report:", err);
            }
          }
        }

        setError(null);
        setIsLoading(false);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        console.error("❌ Failed to fetch data:", err);
        setError(errorMessage);
        setIsLoading(false);
        // Don't fail the whole app if backend is down
      }
    };

    // Initial fetch
    fetchData();

    // Poll every 2 seconds
    const interval = setInterval(fetchData, 2000);

    return () => clearInterval(interval);
  }, [options.goal]); // Re-run when goal changes

  return { context, stats, summary, weeklyReport, isLoading, error };
}

