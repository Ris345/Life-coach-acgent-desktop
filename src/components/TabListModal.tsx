import { useEffect, useState } from 'react';

interface Tab {
    title: string;
    url: string;
    windowId: number;
    total_time?: number;
    visits?: number;
}

interface TabListModalProps {
    isOpen: boolean;
    onClose: () => void;
    appName: string;
}

export function TabListModal({ isOpen, onClose, appName }: TabListModalProps) {
    const [tabs, setTabs] = useState<Tab[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isOpen && appName === 'Google Chrome') {
            fetchTabs();
            // Poll for updates every 1 second while modal is open
            interval = setInterval(fetchTabs, 1000);
        }
        return () => clearInterval(interval);
    }, [isOpen, appName]);

    async function fetchTabs() {
        try {
            // Only show loading on first fetch to avoid flickering
            if (tabs.length === 0) setIsLoading(true);
            setError(null);
            const response = await fetch('http://127.0.0.1:14200/api/chrome/tabs');
            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            setTabs(data.tabs || []);
        } catch (err) {
            console.error('Failed to fetch tabs:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch tabs');
        } finally {
            setIsLoading(false);
        }
    }

    function formatTime(seconds: number = 0): string {
        if (seconds < 60) return `${Math.round(seconds)}s`;
        if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
        return `${(seconds / 3600).toFixed(1)}h`;
    }

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)'
        }} onClick={onClose}>
            <div style={{
                background: '#1f2937',
                width: '800px', // Wider to accommodate stats
                maxHeight: '80vh',
                borderRadius: '0.75rem',
                border: '1px solid #374151',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={{
                    padding: '1.5rem',
                    borderBottom: '1px solid #374151',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#111827'
                }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#f3f4f6' }}>
                            {appName} Tabs
                        </h3>
                        <p style={{ margin: '0.25rem 0 0 0', color: '#9ca3af', fontSize: '0.875rem' }}>
                            Real-time usage tracking per tab
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#9ca3af',
                            cursor: 'pointer',
                            fontSize: '1.5rem',
                            padding: '0.5rem',
                            lineHeight: 1
                        }}
                    >
                        ×
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: '0', overflowY: 'auto', flex: 1 }}>
                    {isLoading && tabs.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>
                            Loading tabs...
                        </div>
                    ) : error ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
                            {error}
                        </div>
                    ) : tabs.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>
                            No open tabs found.
                        </div>
                    ) : (
                        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                            {tabs.map((tab, index) => (
                                <li key={index} style={{
                                    padding: '1rem 1.5rem',
                                    borderBottom: '1px solid #374151',
                                    display: 'flex',
                                    gap: '1rem',
                                    alignItems: 'center'
                                }}>
                                    <div style={{
                                        background: '#374151',
                                        color: '#f3f4f6',
                                        width: '1.5rem',
                                        height: '1.5rem',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.75rem',
                                        flexShrink: 0
                                    }}>
                                        {index + 1}
                                    </div>
                                    <div style={{ minWidth: 0, flex: 1 }}>
                                        <div style={{
                                            color: '#f3f4f6',
                                            fontWeight: 500,
                                            marginBottom: '0.25rem',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                        }}>
                                            {tab.title}
                                        </div>
                                        <div style={{
                                            color: '#6b7280',
                                            fontSize: '0.875rem',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                        }}>
                                            {tab.url}
                                        </div>
                                    </div>

                                    {/* Stats Badges */}
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <div style={{ textAlign: 'right', minWidth: '80px' }}>
                                            <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.125rem' }}>Time</div>
                                            <div style={{
                                                color: '#60a5fa',
                                                fontWeight: 600,
                                                background: 'rgba(59, 130, 246, 0.1)',
                                                padding: '0.125rem 0.5rem',
                                                borderRadius: '999px',
                                                display: 'inline-block'
                                            }}>
                                                {formatTime(tab.total_time)}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right', minWidth: '60px' }}>
                                            <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.125rem' }}>Visits</div>
                                            <div style={{
                                                color: '#34d399',
                                                fontWeight: 600,
                                                background: 'rgba(52, 211, 153, 0.1)',
                                                padding: '0.125rem 0.5rem',
                                                borderRadius: '999px',
                                                display: 'inline-block'
                                            }}>
                                                {tab.visits || 0}
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '1rem 1.5rem',
                    borderTop: '1px solid #374151',
                    background: '#111827',
                    textAlign: 'right'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '0.5rem 1rem',
                            background: '#374151',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: 500
                        }}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
