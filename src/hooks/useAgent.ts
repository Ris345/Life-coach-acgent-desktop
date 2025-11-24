import { useEffect, useState } from "react";

interface ContextResponse {
  active_window: string | null;
  platform: string;
  status: string;
}

export function useAgent() {
  const [context, setContext] = useState<ContextResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContext = async () => {
      try {
        console.log("Fetching activity from http://127.0.0.1:14200/activity");
        const response = await fetch("http://127.0.0.1:14200/activity", {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data: ContextResponse = await response.json();
        console.log("Activity data received:", data);
        setContext(data);
        setError(null);
        setIsLoading(false);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        console.error("Failed to fetch context:", err);
        setError(errorMessage);
        setIsLoading(false);
        // Don't fail the whole app if backend is down
      }
    };

    // Initial fetch
    fetchContext();

    // Poll every 2 seconds as specified
    const interval = setInterval(fetchContext, 2000);

    return () => clearInterval(interval);
  }, []);

  return { context, isLoading, error };
}

