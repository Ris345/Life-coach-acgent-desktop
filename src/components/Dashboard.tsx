import { useState } from 'react';
import { GoalInput, Timeframe } from './GoalInput';
import { MetricsOverview } from './MetricsOverview';
import { GoalTracker } from './GoalTracker';
import { useAgent } from '../hooks/useAgent';

export function Dashboard() {
  const [currentGoal, setCurrentGoal] = useState<string | null>(null);
  const [currentTimeframe, setCurrentTimeframe] = useState<Timeframe>('week');
  const [trackedDays, setTrackedDays] = useState<Set<number>>(new Set());
  const [dismissedNudge, setDismissedNudge] = useState<string | null>(null);
  
  // Get real behavior data from backend (pass current goal for goal-aware tracking)
  const { context, stats, summary, weeklyReport, isLoading } = useAgent({ goal: currentGoal });
  
  // Extract metrics from stats (with fallbacks)
  const focusTime = (context?.focus_time_seconds ?? ((stats?.total_focus_minutes ?? 0) * 60)) / 60;
  const activityCount = stats?.app_switches ?? 0;
  const currentStreakMinutes = (context?.current_streak_seconds ?? stats?.current_streak_seconds ?? 0) / 60;
  const longestStreakMinutes = (context?.longest_streak_seconds ?? stats?.longest_focus_streak_seconds ?? 0) / 60;
  const currentCategory = context?.category ?? stats?.current_category ?? null;
  const activeWindow = context?.active_window ?? null;
  const nudge = context?.nudge && context.nudge !== dismissedNudge ? context.nudge : null;
  const dailyComplete = context?.daily_complete ?? false;
  const weeklyProgress = context?.weekly_progress ?? 0;

  const handleGoalSubmit = async (goal: string, timeframe: Timeframe) => {
    setCurrentGoal(goal);
    setCurrentTimeframe(timeframe);
    setTrackedDays(new Set());
    
    // Send goal to backend to set profile
    try {
      const response = await fetch("http://127.0.0.1:14200/goal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ goal, daily_goal_minutes: 60 }),
      });
      if (response.ok) {
        const data = await response.json();
        console.log("Goal set with profile:", data.profile);
      }
    } catch (err) {
      console.warn("Failed to set goal:", err);
    }
  };

  const handleTrackDay = (dayIndex: number) => {
    setTrackedDays((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(dayIndex)) {
        newSet.delete(dayIndex);
      } else {
        newSet.add(dayIndex);
      }
      return newSet;
    });
  };

  const getCategoryColor = (category: string | null) => {
    if (!category) return '#888';
    switch (category) {
      case 'focus': return '#3b82f6';
      case 'distraction': return '#ef4444';
      case 'neutral': return '#888';
      default: return '#888';
    }
  };

  const getCategoryLabel = (category: string | null) => {
    if (!category) return 'Unknown';
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0e27 0%, #1a1d3a 50%, #0f1419 100%)',
      padding: '2rem 1.5rem',
    }}>
      <div style={{
        maxWidth: '1600px',
        margin: '0 auto',
      }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
      }}>
        <div>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #60a5fa 0%, #34d399 50%, #a78bfa 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '0.25rem',
            letterSpacing: '-0.02em',
          }}>
            LifeOS
          </h1>
          <p style={{
            fontSize: '0.9rem',
            color: '#9ca3af',
            fontWeight: '400',
          }}>
            AI-Powered Productivity Coach
          </p>
        </div>
        {currentGoal && (
          <div style={{
            padding: '0.75rem 1.5rem',
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '0.75rem',
            backdropFilter: 'blur(10px)',
          }}>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem' }}>
              Active Goal
            </div>
            <div style={{ fontSize: '0.95rem', color: '#fff', fontWeight: '600' }}>
              {currentGoal}
            </div>
          </div>
        )}
      </div>

      {/* Nudge Banner - Top Priority */}
      {nudge && (
        <div style={{
          background: nudge.toLowerCase().includes('drift') || nudge.toLowerCase().includes('distraction')
            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.2) 100%)'
            : 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.2) 100%)',
          border: nudge.toLowerCase().includes('drift') || nudge.toLowerCase().includes('distraction')
            ? '1px solid rgba(239, 68, 68, 0.4)'
            : '1px solid rgba(16, 185, 129, 0.4)',
          padding: '1.25rem 1.5rem',
          borderRadius: '1rem',
          marginBottom: '2rem',
          color: '#fff',
          fontSize: '1rem',
          fontWeight: '500',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          backdropFilter: 'blur(10px)',
          animation: 'slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          <span style={{ flex: 1, lineHeight: '1.5' }}>
            {nudge.replace(/[🎯🤖🎉💡💪🚀🔥⚠️⏰✓○]/g, '').trim()}
          </span>
          <button
            onClick={() => setDismissedNudge(nudge)}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '0.5rem',
              color: '#fff',
              padding: '0.5rem',
              cursor: 'pointer',
              fontSize: '1rem',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Hero Section: Goal + Live Status */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: currentGoal ? '1fr 1fr' : '1fr',
        gap: '1.5rem',
        marginBottom: '2rem',
      }}>
        {/* Goal Section */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(37, 41, 54, 0.8) 0%, rgba(42, 45, 58, 0.8) 100%)',
          padding: '2rem',
          borderRadius: '1.25rem',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        }}>
          {!currentGoal ? (
            <>
              <div>
                <h2 style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: '700', 
                  marginBottom: '0.5rem',
                  color: '#fff',
                  letterSpacing: '-0.02em',
                }}>
                  Get Started
                </h2>
                <p style={{ fontSize: '0.95rem', color: '#9ca3af', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                  Set your first goal to start tracking your productivity and receive AI-powered coaching insights.
                </p>
              </div>
              <GoalInput onGoalSubmit={handleGoalSubmit} />
            </>
          ) : (
            <>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1.5rem',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: '#9ca3af', 
                    marginBottom: '0.5rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: '600',
                  }}>
                    Current Goal
                  </div>
                  <div style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: '#fff',
                    marginBottom: '0.75rem',
                    lineHeight: '1.3',
                    letterSpacing: '-0.02em',
                  }}>
                    {currentGoal}
                  </div>
                  {context?.profile && (
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '0.5rem 1rem',
                      background: 'rgba(59, 130, 246, 0.1)',
                      borderRadius: '0.75rem',
                      fontSize: '0.85rem',
                      color: '#60a5fa',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      fontWeight: '500',
                    }}>
                      {context.profile.profile_name || 'Custom Profile'}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    setCurrentGoal(null);
                    setTrackedDays(new Set());
                  }}
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '0.75rem',
                    color: '#ef4444',
                    padding: '0.75rem 1.25rem',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                    e.currentTarget.style.borderColor = '#ef4444';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  Change Goal
                </button>
              </div>
              
              {/* Quick Stats in Goal Card */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '1rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid rgba(59, 130, 246, 0.2)',
              }}>
                <div style={{
                  padding: '1rem',
                  background: 'rgba(59, 130, 246, 0.1)',
                  borderRadius: '0.75rem',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                }}>
                  <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>
                    Focus Time
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#60a5fa', lineHeight: '1' }}>
                    {isLoading ? '...' : `${Math.round(focusTime)}m`}
                  </div>
                  {context?.goal_alignment && (
                    <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                      {context.goal_alignment.goal_minutes_today.toFixed(0)}m toward goal
                    </div>
                  )}
                </div>
                <div style={{
                  padding: '1rem',
                  background: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: '0.75rem',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                }}>
                  <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>
                    Goal Progress
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#10b981', lineHeight: '1' }}>
                    {context?.goal_alignment ? `${Math.round(context.goal_alignment.goal_progress_percent)}%` : (isLoading ? '...' : '0%')}
                  </div>
                  {context?.goal_alignment && (
                    <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                      {context.goal_alignment.goal_minutes_today.toFixed(0)}/{context.goal_alignment.required_minutes_today}m
                    </div>
                  )}
                </div>
                <div style={{
                  padding: '1rem',
                  background: dailyComplete ? 'rgba(16, 185, 129, 0.1)' : 'rgba(156, 163, 175, 0.1)',
                  borderRadius: '0.75rem',
                  border: dailyComplete ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(156, 163, 175, 0.2)',
                }}>
                  <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>
                    Daily Goal
                  </div>
                  <div style={{ 
                    fontSize: '1.75rem', 
                    fontWeight: '700', 
                    color: dailyComplete ? '#10b981' : '#9ca3af',
                    lineHeight: '1',
                  }}>
                    {dailyComplete ? 'Complete' : 'In Progress'}
                  </div>
                </div>
              </div>
              
              {/* Goal Alignment Indicator */}
              {context?.goal_alignment && (
                <div style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  background: 'rgba(167, 139, 250, 0.1)',
                  borderRadius: '0.75rem',
                  border: '1px solid rgba(167, 139, 250, 0.3)',
                }}>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: '#a78bfa', 
                    marginBottom: '0.5rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: '600',
                  }}>
                    Goal Alignment
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                  }}>
                    <div style={{
                      flex: 1,
                      height: '8px',
                      background: 'rgba(167, 139, 250, 0.2)',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${context.goal_alignment.goal_alignment}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #a78bfa 0%, #8b5cf6 100%)',
                        borderRadius: '4px',
                        transition: 'width 0.3s ease',
                      }} />
                    </div>
                    <div style={{
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      color: '#a78bfa',
                      minWidth: '50px',
                      textAlign: 'right',
                    }}>
                      {context.goal_alignment.goal_alignment.toFixed(0)}%
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Live Activity Status */}
        {currentGoal && activeWindow && (
          <div style={{
            background: `linear-gradient(135deg, rgba(37, 41, 54, 0.8) 0%, rgba(42, 45, 58, 0.8) 100%)`,
            padding: '2rem',
            borderRadius: '1.25rem',
            border: `2px solid ${getCategoryColor(currentCategory)}40`,
            position: 'relative',
            overflow: 'hidden',
            backdropFilter: 'blur(20px)',
            boxShadow: `0 8px 32px ${getCategoryColor(currentCategory)}20`,
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: `linear-gradient(90deg, ${getCategoryColor(currentCategory)} 0%, transparent 100%)`,
            }} />
            <div style={{ 
              fontSize: '0.75rem', 
              color: '#9ca3af', 
              marginBottom: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontWeight: '600',
            }}>
              Live Activity
            </div>
            <div style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              color: '#fff',
              marginBottom: '1rem',
              wordBreak: 'break-word',
              lineHeight: '1.4',
              letterSpacing: '-0.02em',
            }}>
              {activeWindow}
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              flexWrap: 'wrap',
            }}>
              <div style={{
                padding: '0.75rem 1.25rem',
                background: `${getCategoryColor(currentCategory)}20`,
                borderRadius: '0.75rem',
                fontSize: '0.9rem',
                fontWeight: '600',
                color: getCategoryColor(currentCategory),
                border: `1px solid ${getCategoryColor(currentCategory)}40`,
              }}>
                {getCategoryLabel(currentCategory)}
              </div>
              {currentStreakMinutes > 0 && currentCategory === 'focus' && (
                <div style={{
                  padding: '0.75rem 1.25rem',
                  background: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: '0.75rem',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                }}>
                  {Math.round(currentStreakMinutes)}m Focus Streak
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Dashboard: Metrics + Progress */}
      {currentGoal ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '2rem',
          marginBottom: '2rem',
        }}>
          {/* Left: Metrics Overview */}
          <MetricsOverview
            currentGoal={currentGoal}
            focusTime={focusTime}
            activityCount={activityCount}
            currentStreakMinutes={currentStreakMinutes}
            longestStreakMinutes={longestStreakMinutes}
            currentCategory={currentCategory}
            activeWindow={activeWindow}
            summary={summary}
            isLoading={isLoading}
          />

          {/* Right: Progress Tracker */}
          <GoalTracker
            timeframe={currentTimeframe}
            onTrackDay={handleTrackDay}
            trackedDays={trackedDays}
            dailyComplete={dailyComplete}
            weeklyProgress={weeklyProgress}
          />
        </div>
      ) : null}

      {/* AI Life Coach - Always Visible When Goal is Set */}
      {currentGoal && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(37, 41, 54, 0.9) 0%, rgba(42, 45, 58, 0.9) 100%)',
          padding: '2.5rem',
          borderRadius: '1.5rem',
          border: '2px solid rgba(167, 139, 250, 0.3)',
          marginTop: '2rem',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Gradient overlay */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '6px',
            background: 'linear-gradient(90deg, #60a5fa 0%, #34d399 50%, #a78bfa 100%)',
          }} />
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '2rem',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '1rem',
                background: 'linear-gradient(135deg, #60a5fa 0%, #34d399 50%, #a78bfa 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#fff',
                boxShadow: '0 8px 24px rgba(96, 165, 250, 0.3)',
              }}>
                AI
              </div>
              <div>
                <h3 style={{ 
                  fontSize: '1.75rem', 
                  fontWeight: '700',
                  color: '#fff',
                  marginBottom: '0.25rem',
                  letterSpacing: '-0.02em',
                }}>
                  AI Coaching Report
                </h3>
                <p style={{
                  fontSize: '0.9rem',
                  color: '#9ca3af',
                  margin: 0,
                }}>
                  Personalized insights and recommendations
                </p>
              </div>
            </div>
            {weeklyReport?.ollama_available && (
              <div style={{
                fontSize: '0.85rem',
                color: '#10b981',
                padding: '0.75rem 1.25rem',
                background: 'rgba(16, 185, 129, 0.1)',
                borderRadius: '0.75rem',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                fontWeight: '600',
              }}>
                AI Powered
              </div>
            )}
          </div>
          
          {weeklyReport?.report ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '1.5rem',
            }}>
              <div style={{
                padding: '1.5rem',
                background: 'rgba(16, 185, 129, 0.1)',
                borderRadius: '1rem',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                gridColumn: 'span 2',
              }}>
                <div style={{ 
                  fontSize: '0.85rem', 
                  color: '#10b981', 
                  marginBottom: '0.75rem',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  Wins & Achievements
                </div>
                <div style={{ fontSize: '1.05rem', color: '#fff', lineHeight: '1.6', fontWeight: '500' }}>
                  {weeklyReport.report.celebration.replace(/[🎯🤖🎉💡💪🚀🔥⚠️⏰✓○]/g, '').trim()}
                </div>
              </div>
              
              <div style={{
                padding: '1.5rem',
                background: 'rgba(59, 130, 246, 0.1)',
                borderRadius: '1rem',
                border: '1px solid rgba(59, 130, 246, 0.3)',
              }}>
                <div style={{ 
                  fontSize: '0.85rem', 
                  color: '#60a5fa', 
                  marginBottom: '0.75rem',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  Key Insights
                </div>
                <div style={{ fontSize: '0.95rem', color: '#fff', lineHeight: '1.6' }}>
                  {weeklyReport.report.insights.replace(/[🎯🤖🎉💡💪🚀🔥⚠️⏰✓○]/g, '').trim()}
                </div>
              </div>
              
              <div style={{
                padding: '1.5rem',
                background: 'rgba(167, 139, 250, 0.1)',
                borderRadius: '1rem',
                border: '1px solid rgba(167, 139, 250, 0.3)',
              }}>
                <div style={{ 
                  fontSize: '0.85rem', 
                  color: '#a78bfa', 
                  marginBottom: '0.75rem',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  Recommendation
                </div>
                <div style={{ fontSize: '0.95rem', color: '#fff', lineHeight: '1.6' }}>
                  {weeklyReport.report.recommendation.replace(/[🎯🤖🎉💡💪🚀🔥⚠️⏰✓○]/g, '').trim()}
                </div>
              </div>
              
              <div style={{
                padding: '1.5rem',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.15) 100%)',
                borderRadius: '1rem',
                border: '2px solid rgba(16, 185, 129, 0.4)',
                gridColumn: 'span 2',
              }}>
                <div style={{ 
                  fontSize: '0.85rem', 
                  color: '#10b981', 
                  marginBottom: '0.75rem',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  Next Steps
                </div>
                <div style={{ fontSize: '1.1rem', color: '#fff', fontWeight: '600', lineHeight: '1.6' }}>
                  {weeklyReport.report.motivation.replace(/[🎯🤖🎉💡💪🚀🔥⚠️⏰✓○]/g, '').trim()}
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              padding: '3rem 2rem',
              textAlign: 'center',
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                margin: '0 auto 1.5rem',
                borderRadius: '1rem',
                background: 'linear-gradient(135deg, #60a5fa 0%, #34d399 50%, #a78bfa 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#fff',
                boxShadow: '0 8px 24px rgba(96, 165, 250, 0.3)',
              }}>
                AI
              </div>
              <div style={{
                fontSize: '1.1rem',
                color: '#fff',
                fontWeight: '600',
                marginBottom: '0.5rem',
              }}>
                AI Coach is Analyzing Your Progress
              </div>
              <div style={{
                fontSize: '0.9rem',
                color: '#9ca3af',
                lineHeight: '1.6',
                maxWidth: '500px',
                margin: '0 auto',
              }}>
                {isLoading 
                  ? 'Gathering your activity data and generating personalized insights...'
                  : 'Your AI coach will provide personalized insights, recommendations, and motivation based on your progress. Check back soon!'}
              </div>
              {!weeklyReport?.ollama_available && (
                <div style={{
                  marginTop: '1.5rem',
                  padding: '1rem',
                  background: 'rgba(167, 139, 250, 0.1)',
                  borderRadius: '0.75rem',
                  border: '1px solid rgba(167, 139, 250, 0.3)',
                  fontSize: '0.85rem',
                  color: '#a78bfa',
                }}>
                  <strong>Tip:</strong> Install Ollama for AI-powered insights. Otherwise, you'll get rule-based coaching.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!currentGoal && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(37, 41, 54, 0.6) 0%, rgba(42, 45, 58, 0.6) 100%)',
          padding: '4rem 3rem',
          borderRadius: '1.5rem',
          textAlign: 'center',
          border: '2px dashed rgba(59, 130, 246, 0.3)',
          backdropFilter: 'blur(20px)',
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 1.5rem',
            borderRadius: '1.5rem',
            background: 'linear-gradient(135deg, #60a5fa 0%, #34d399 50%, #a78bfa 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            fontWeight: '700',
            color: '#fff',
            boxShadow: '0 12px 32px rgba(96, 165, 250, 0.4)',
          }}>
            LifeOS
          </div>
          <h3 style={{ 
            fontSize: '1.75rem', 
            fontWeight: '700', 
            marginBottom: '0.75rem',
            color: '#fff',
            letterSpacing: '-0.02em',
          }}>
            Ready to Transform Your Productivity?
          </h3>
          <p style={{ 
            color: '#9ca3af', 
            fontSize: '1.05rem', 
            maxWidth: '600px', 
            margin: '0 auto',
            lineHeight: '1.6',
          }}>
            Set your first goal above to start tracking your focus time, build streaks, and achieve your objectives with AI-powered coaching.
          </p>
        </div>
      )}
      </div>
    </div>
  );
}
