/**
 * Supabase Backend Module
 * 
 * Provides typed functions for interacting with Supabase database.
 * Handles goals, goal progress, and metrics.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  User,
  Goal,
  GoalProgress,
  Metric,
  CreateGoalInput,
  UpdateGoalInput,
  RecordProgressInput,
  RecordMetricInput,
  DatabaseError,
  ValidationError,
} from '../types/database';

// Initialize Supabase client
let supabaseClient: SupabaseClient | null = null;

/**
 * Initialize Supabase client with environment variables
 * Call this once at app startup
 */
export function initSupabase(accessToken?: string): SupabaseClient {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new DatabaseError(
      'Missing Supabase credentials. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.',
      'MISSING_CREDENTIALS'
    );
  }

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false, // We'll handle auth separately
      autoRefreshToken: false,
    },
  });

  // Set access token if provided (from auth session)
  if (accessToken) {
    client.auth.setSession({
      access_token: accessToken,
      refresh_token: '',
    } as any);
  }

  supabaseClient = client;
  return client;
}

/**
 * Get the current Supabase client instance
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    return initSupabase();
  }
  return supabaseClient;
}

/**
 * Update the Supabase client with a new access token
 */
export function updateSupabaseAuth(accessToken: string): void {
  if (supabaseClient) {
    supabaseClient.auth.setSession({
      access_token: accessToken,
      refresh_token: '',
    } as any);
  } else {
    initSupabase(accessToken);
  }
}

// ============================================================================
// GOAL FUNCTIONS
// ============================================================================

/**
 * Create a new goal for a user
 */
export async function createGoal(
  userId: string,
  data: CreateGoalInput
): Promise<Goal> {
  try {
    // Validate input
    if (!data.title || !data.title.trim()) {
      throw new ValidationError('Goal title is required', 'title');
    }
    if (!data.timeframe || !['day', 'week', 'month'].includes(data.timeframe)) {
      throw new ValidationError('Valid timeframe is required (day/week/month)', 'timeframe');
    }
    if (!data.start_date || !data.end_date) {
      throw new ValidationError('Start date and end date are required', 'dates');
    }

    const startDate = new Date(data.start_date);
    const endDate = new Date(data.end_date);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new ValidationError('Invalid date format', 'dates');
    }
    
    if (endDate < startDate) {
      throw new ValidationError('End date must be after start date', 'end_date');
    }

    const client = getSupabaseClient();
    
    const { data: goal, error } = await client
      .from('goals')
      .insert({
        user_id: userId,
        title: data.title.trim(),
        timeframe: data.timeframe,
        start_date: data.start_date,
        end_date: data.end_date,
      })
      .select()
      .single();

    if (error) {
      throw new DatabaseError(
        `Failed to create goal: ${error.message}`,
        error.code,
        error
      );
    }

    if (!goal) {
      throw new DatabaseError('Goal creation returned no data');
    }

    return goal as Goal;
  } catch (error) {
    if (error instanceof ValidationError || error instanceof DatabaseError) {
      throw error;
    }
    throw new DatabaseError(
      `Unexpected error creating goal: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get all goals for a user
 */
export async function getGoals(userId: string): Promise<Goal[]> {
  try {
    const client = getSupabaseClient();
    
    const { data: goals, error } = await client
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new DatabaseError(
        `Failed to fetch goals: ${error.message}`,
        error.code,
        error
      );
    }

    return (goals || []) as Goal[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    throw new DatabaseError(
      `Unexpected error fetching goals: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get a single goal by ID
 */
export async function getGoal(goalId: string, userId: string): Promise<Goal | null> {
  try {
    const client = getSupabaseClient();
    
    const { data: goal, error } = await client
      .from('goals')
      .select('*')
      .eq('id', goalId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      throw new DatabaseError(
        `Failed to fetch goal: ${error.message}`,
        error.code,
        error
      );
    }

    return goal as Goal;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    throw new DatabaseError(
      `Unexpected error fetching goal: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Update a goal
 */
export async function updateGoal(
  goalId: string,
  userId: string,
  data: UpdateGoalInput
): Promise<Goal> {
  try {
    // Validate that at least one field is being updated
    if (Object.keys(data).length === 0) {
      throw new ValidationError('At least one field must be provided for update');
    }

    // Validate dates if provided
    if (data.start_date || data.end_date) {
      const startDate = data.start_date ? new Date(data.start_date) : null;
      const endDate = data.end_date ? new Date(data.end_date) : null;
      
      if (startDate && isNaN(startDate.getTime())) {
        throw new ValidationError('Invalid start date format', 'start_date');
      }
      if (endDate && isNaN(endDate.getTime())) {
        throw new ValidationError('Invalid end date format', 'end_date');
      }
      
      // If both dates are provided, validate range
      if (startDate && endDate && endDate < startDate) {
        throw new ValidationError('End date must be after start date', 'end_date');
      }
    }

    // Validate timeframe if provided
    if (data.timeframe && !['day', 'week', 'month'].includes(data.timeframe)) {
      throw new ValidationError('Valid timeframe is required (day/week/month)', 'timeframe');
    }

    const client = getSupabaseClient();
    
    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title.trim();
    if (data.timeframe !== undefined) updateData.timeframe = data.timeframe;
    if (data.start_date !== undefined) updateData.start_date = data.start_date;
    if (data.end_date !== undefined) updateData.end_date = data.end_date;

    const { data: goal, error } = await client
      .from('goals')
      .update(updateData)
      .eq('id', goalId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new DatabaseError('Goal not found or access denied', 'NOT_FOUND');
      }
      throw new DatabaseError(
        `Failed to update goal: ${error.message}`,
        error.code,
        error
      );
    }

    if (!goal) {
      throw new DatabaseError('Goal update returned no data');
    }

    return goal as Goal;
  } catch (error) {
    if (error instanceof ValidationError || error instanceof DatabaseError) {
      throw error;
    }
    throw new DatabaseError(
      `Unexpected error updating goal: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Delete a goal
 */
export async function deleteGoal(goalId: string, userId: string): Promise<void> {
  try {
    const client = getSupabaseClient();
    
    const { error } = await client
      .from('goals')
      .delete()
      .eq('id', goalId)
      .eq('user_id', userId);

    if (error) {
      throw new DatabaseError(
        `Failed to delete goal: ${error.message}`,
        error.code,
        error
      );
    }
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    throw new DatabaseError(
      `Unexpected error deleting goal: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// ============================================================================
// GOAL PROGRESS FUNCTIONS
// ============================================================================

/**
 * Record progress for a goal on a specific date
 */
export async function recordProgress(
  goalId: string,
  userId: string,
  data: RecordProgressInput
): Promise<GoalProgress> {
  try {
    // Validate input
    if (!data.date) {
      throw new ValidationError('Date is required', 'date');
    }
    if (!data.status || !['on_track', 'off_track'].includes(data.status)) {
      throw new ValidationError('Valid status is required (on_track/off_track)', 'status');
    }

    // Verify the goal exists and belongs to the user
    const goal = await getGoal(goalId, userId);
    if (!goal) {
      throw new DatabaseError('Goal not found or access denied', 'NOT_FOUND');
    }

    // Validate date is within goal date range
    const progressDate = new Date(data.date);
    const startDate = new Date(goal.start_date);
    const endDate = new Date(goal.end_date);
    
    if (progressDate < startDate || progressDate > endDate) {
      throw new ValidationError(
        `Date must be within goal date range (${goal.start_date} to ${goal.end_date})`,
        'date'
      );
    }

    const client = getSupabaseClient();
    
    // Use upsert to update if exists, insert if not
    const { data: progress, error } = await client
      .from('goal_progress')
      .upsert({
        goal_id: goalId,
        date: data.date,
        status: data.status,
      }, {
        onConflict: 'goal_id,date',
      })
      .select()
      .single();

    if (error) {
      throw new DatabaseError(
        `Failed to record progress: ${error.message}`,
        error.code,
        error
      );
    }

    if (!progress) {
      throw new DatabaseError('Progress recording returned no data');
    }

    return progress as GoalProgress;
  } catch (error) {
    if (error instanceof ValidationError || error instanceof DatabaseError) {
      throw error;
    }
    throw new DatabaseError(
      `Unexpected error recording progress: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get all progress entries for a goal
 */
export async function getGoalProgress(
  goalId: string,
  userId: string
): Promise<GoalProgress[]> {
  try {
    // Verify the goal exists and belongs to the user
    const goal = await getGoal(goalId, userId);
    if (!goal) {
      throw new DatabaseError('Goal not found or access denied', 'NOT_FOUND');
    }

    const client = getSupabaseClient();
    
    const { data: progress, error } = await client
      .from('goal_progress')
      .select('*')
      .eq('goal_id', goalId)
      .order('date', { ascending: true });

    if (error) {
      throw new DatabaseError(
        `Failed to fetch progress: ${error.message}`,
        error.code,
        error
      );
    }

    return (progress || []) as GoalProgress[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    throw new DatabaseError(
      `Unexpected error fetching progress: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Delete progress entry for a specific date
 */
export async function deleteProgress(
  goalId: string,
  userId: string,
  date: string
): Promise<void> {
  try {
    // Verify the goal exists and belongs to the user
    const goal = await getGoal(goalId, userId);
    if (!goal) {
      throw new DatabaseError('Goal not found or access denied', 'NOT_FOUND');
    }

    const client = getSupabaseClient();
    
    const { error } = await client
      .from('goal_progress')
      .delete()
      .eq('goal_id', goalId)
      .eq('date', date);

    if (error) {
      throw new DatabaseError(
        `Failed to delete progress: ${error.message}`,
        error.code,
        error
      );
    }
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    throw new DatabaseError(
      `Unexpected error deleting progress: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// ============================================================================
// METRICS FUNCTIONS
// ============================================================================

/**
 * Record a metric for a user
 */
export async function recordMetric(
  userId: string,
  data: RecordMetricInput
): Promise<Metric> {
  try {
    // Validate input
    if (!data.metric_type || !data.metric_type.trim()) {
      throw new ValidationError('Metric type is required', 'metric_type');
    }
    if (data.value === undefined || data.value === null || isNaN(Number(data.value))) {
      throw new ValidationError('Valid numeric value is required', 'value');
    }

    const client = getSupabaseClient();
    
    const { data: metric, error } = await client
      .from('metrics')
      .insert({
        user_id: userId,
        metric_type: data.metric_type.trim(),
        value: Number(data.value),
        metadata: data.metadata || {},
      })
      .select()
      .single();

    if (error) {
      throw new DatabaseError(
        `Failed to record metric: ${error.message}`,
        error.code,
        error
      );
    }

    if (!metric) {
      throw new DatabaseError('Metric recording returned no data');
    }

    return metric as Metric;
  } catch (error) {
    if (error instanceof ValidationError || error instanceof DatabaseError) {
      throw error;
    }
    throw new DatabaseError(
      `Unexpected error recording metric: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get metrics for a user, optionally filtered by type and date range
 */
export async function getMetrics(
  userId: string,
  options?: {
    metric_type?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
  }
): Promise<Metric[]> {
  try {
    const client = getSupabaseClient();
    
    let query = client
      .from('metrics')
      .select('*')
      .eq('user_id', userId);

    if (options?.metric_type) {
      query = query.eq('metric_type', options.metric_type);
    }

    if (options?.start_date) {
      query = query.gte('recorded_at', options.start_date);
    }

    if (options?.end_date) {
      query = query.lte('recorded_at', options.end_date);
    }

    query = query.order('recorded_at', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data: metrics, error } = await query;

    if (error) {
      throw new DatabaseError(
        `Failed to fetch metrics: ${error.message}`,
        error.code,
        error
      );
    }

    return (metrics || []) as Metric[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    throw new DatabaseError(
      `Unexpected error fetching metrics: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get the latest metric value for a specific type
 */
export async function getLatestMetric(
  userId: string,
  metricType: string
): Promise<Metric | null> {
  try {
    const metrics = await getMetrics(userId, {
      metric_type: metricType,
      limit: 1,
    });

    return metrics.length > 0 ? metrics[0] : null;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    throw new DatabaseError(
      `Unexpected error fetching latest metric: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// ============================================================================
// USER FUNCTIONS
// ============================================================================

/**
 * Get or create a user record in the public.users table
 * This should be called after Supabase Auth creates the auth user
 */
export async function getOrCreateUser(
  userId: string,
  email: string
): Promise<User> {
  try {
    const client = getSupabaseClient();
    
    // Try to get existing user
    const { data: existingUser, error: fetchError } = await client
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (existingUser && !fetchError) {
      return existingUser as User;
    }

    // Create new user if doesn't exist
    const { data: newUser, error: createError } = await client
      .from('users')
      .insert({
        id: userId,
        email: email,
      })
      .select()
      .single();

    if (createError) {
      throw new DatabaseError(
        `Failed to create user: ${createError.message}`,
        createError.code,
        createError
      );
    }

    if (!newUser) {
      throw new DatabaseError('User creation returned no data');
    }

    return newUser as User;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    throw new DatabaseError(
      `Unexpected error getting/creating user: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

