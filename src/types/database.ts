// Database type definitions for Supabase

export type Timeframe = 'day' | 'week' | 'month';
export type ProgressStatus = 'on_track' | 'off_track';

export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at?: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  timeframe: Timeframe;
  start_date: string; // ISO date string (YYYY-MM-DD)
  end_date: string; // ISO date string (YYYY-MM-DD)
  created_at: string;
  updated_at?: string;
}

export interface GoalProgress {
  id: string;
  goal_id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  status: ProgressStatus;
  created_at: string;
  updated_at?: string;
}

export interface Metric {
  id: string;
  user_id: string;
  metric_type: string;
  value: number;
  recorded_at: string;
  metadata?: Record<string, any>;
}

// Input types for creating/updating records
export interface CreateGoalInput {
  title: string;
  timeframe: Timeframe;
  start_date: string;
  end_date: string;
}

export interface UpdateGoalInput {
  title?: string;
  timeframe?: Timeframe;
  start_date?: string;
  end_date?: string;
}

export interface RecordProgressInput {
  goal_id: string;
  date: string;
  status: ProgressStatus;
}

export interface RecordMetricInput {
  metric_type: string;
  value: number;
  metadata?: Record<string, any>;
}

// Error types
export class DatabaseError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

