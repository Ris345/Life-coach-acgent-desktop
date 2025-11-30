import { useState } from 'react';

interface SmartNudgeToggleProps {
    enabled: boolean;
    onToggle: (enabled: boolean) => void;
}

export function SmartNudgeToggle({ enabled, onToggle }: SmartNudgeToggleProps) {
    const [isHovered, setIsHovered] = useState(false);

    const handleToggle = () => {
        onToggle(!enabled);
    };

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                background: enabled
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                boxShadow: isHovered
                    ? '0 8px 16px rgba(0, 0, 0, 0.2)'
                    : '0 4px 8px rgba(0, 0, 0, 0.1)',
            }}
            onClick={handleToggle}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div style={{ flex: 1 }}>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.25rem',
                    }}
                >
                    <span style={{ fontSize: '1.25rem' }}>🤖</span>
                    <span
                        style={{
                            fontSize: '1rem',
                            fontWeight: '600',
                            color: '#fff',
                        }}
                    >
                        Smart Nudge
                    </span>
                    {enabled && (
                        <span
                            style={{
                                fontSize: '0.7rem',
                                padding: '0.15rem 0.5rem',
                                background: 'rgba(255, 255, 255, 0.2)',
                                borderRadius: '12px',
                                color: '#fff',
                                fontWeight: '500',
                            }}
                        >
                            ACTIVE
                        </span>
                    )}
                </div>
                <p
                    style={{
                        fontSize: '0.85rem',
                        color: enabled ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.6)',
                        margin: 0,
                        lineHeight: '1.4',
                    }}
                >
                    {enabled
                        ? 'AI will help you stay focused by closing distractions'
                        : 'Enable AI to help you stay on track with your goals'}
                </p>
            </div>

            {/* Toggle Switch */}
            <div
                style={{
                    position: 'relative',
                    width: '52px',
                    height: '28px',
                    background: enabled ? '#4ade80' : 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '14px',
                    transition: 'background 0.3s ease',
                    marginLeft: '1rem',
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        top: '2px',
                        left: enabled ? '26px' : '2px',
                        width: '24px',
                        height: '24px',
                        background: '#fff',
                        borderRadius: '50%',
                        transition: 'left 0.3s ease',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                    }}
                />
            </div>
        </div>
    );
}
