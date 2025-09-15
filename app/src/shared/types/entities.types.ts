/**
 * Types des entités métier pour remplacer les 'unknown' des route handlers
 * Définitions strictes basées sur le domaine LMS IA
 */

// Types utilisateur et authentification
export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'visitor' | 'member' | 'moderator' | 'admin';
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
  is_active: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
  expires_in: number;
  refresh_token?: string;
}

// Types cours et contenu pédagogique
export interface Course {
  id: string;
  title: string;
  description: string;
  slug: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  duration_hours: number;
  price: number;
  currency: 'EUR';
  is_published: boolean;
  thumbnail_url?: string;
  instructor_id: string;
  created_at: string;
  updated_at: string;
  modules_count: number;
  lessons_count: number;
  enrollment_count: number;
}

export interface Module {
  id: string;
  course_id: string;
  title: string;
  description: string;
  order_index: number;
  duration_minutes: number;
  is_published: boolean;
  lessons_count: number;
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  description: string;
  content_type: 'video' | 'text' | 'quiz' | 'exercise' | 'ai_chat';
  content_url?: string;
  content_text?: string;
  duration_minutes: number;
  order_index: number;
  is_published: boolean;
  prerequisites?: string[];
}

// Types progression et analytics
export interface UserProgress {
  id: string;
  user_id: string;
  course_id: string;
  lesson_id?: string;
  status: 'not_started' | 'in_progress' | 'completed';
  completion_percentage: number;
  time_spent_minutes: number;
  last_accessed: string;
  created_at: string;
  updated_at: string;
}

export interface Certificate {
  id: string;
  user_id: string;
  course_id: string;
  issued_at: string;
  certificate_url: string;
  verification_code: string;
  is_valid: boolean;
}

// Types IA et évaluation
export interface AIConversation {
  id: string;
  user_id: string;
  lesson_id?: string;
  messages: AIMessage[];
  evaluation_score?: number;
  tokens_used: number;
  cost_cents: number;
  created_at: string;
  updated_at: string;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  tokens: number;
}

// Types système et analytics
export interface SystemStats {
  total_users: number;
  active_users_today: number;
  total_courses: number;
  total_enrollments: number;
  ai_conversations_today: number;
  revenue_today_cents: number;
  server_health: 'healthy' | 'warning' | 'critical';
  last_updated: string;
}

export interface SystemSettings {
  ai_model: string;
  max_tokens_per_conversation: number;
  rate_limits: {
    anonymous_per_minute: number;
    user_per_minute: number;
  };
  maintenance_mode: boolean;
  announcement?: string;
}

export interface ActivityLog {
  id: string;
  user_id?: string;
  action: string;
  resource_type: 'course' | 'lesson' | 'user' | 'system';
  resource_id?: string;
  metadata?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// Types recommandations
export interface Recommendation {
  id: string;
  user_id: string;
  course_id: string;
  reason: 'similar_interests' | 'skill_gap' | 'popular' | 'ai_suggested';
  confidence_score: number;
  created_at: string;
}

// Types analytics et usage
export interface UsageAnalytics {
  period: 'day' | 'week' | 'month' | 'year';
  start_date: string;
  end_date: string;
  metrics: {
    active_users: number;
    new_registrations: number;
    course_completions: number;
    ai_interactions: number;
    revenue_cents: number;
    retention_rate: number;
  };
}

export interface AIUsageStats {
  period: 'day' | 'week' | 'month';
  total_conversations: number;
  total_tokens: number;
  total_cost_cents: number;
  average_conversation_length: number;
  most_active_lessons: Array<{
    lesson_id: string;
    lesson_title: string;
    conversation_count: number;
  }>;
}