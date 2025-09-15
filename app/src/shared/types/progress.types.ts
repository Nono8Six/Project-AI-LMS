/**
 * Types pour le suivi des progrès et analytics utilisateur
 * Tracking détaillé de l'apprentissage et performances
 */

import type { ContentType } from './content.types';

export type AnalyticsPeriod = 'hour' | 'day' | 'week' | 'month' | 'year';

// Types pour le progrès utilisateur
export interface UserProgress {
  readonly id: string;
  readonly userId: string;
  readonly courseId: string;
  readonly enrolledAt: string;
  readonly lastAccessedAt: string;
  readonly completedAt: string | null;
  readonly overallProgress: ProgressStats;
  readonly moduleProgress: readonly ModuleProgress[];
  readonly achievements: readonly Achievement[];
  readonly learningPath: LearningPath;
  readonly streaks: StreakStats;
  readonly timeSpent: TimeSpentStats;
}

export interface ProgressStats {
  readonly percentage: number;
  readonly completedLessons: number;
  readonly totalLessons: number;
  readonly completedModules: number;
  readonly totalModules: number;
  readonly averageScore: number;
  readonly masteryLevel: MasteryLevel;
}

export type MasteryLevel = 'novice' | 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface ModuleProgress {
  readonly moduleId: string;
  readonly status: ModuleStatus;
  readonly completedAt: string | null;
  readonly progress: ProgressStats;
  readonly lessonProgress: readonly LessonProgress[];
  readonly estimatedTimeRemaining: number;
}

export type ModuleStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'mastered'
  | 'requires_review';

export interface LessonProgress {
  readonly lessonId: string;
  readonly status: LessonStatus;
  readonly startedAt: string | null;
  readonly completedAt: string | null;
  readonly timeSpent: number;
  readonly attempts: number;
  readonly bestScore: number;
  readonly lastScore: number;
  readonly interactions: readonly LessonInteraction[];
  readonly notes: readonly UserNote[];
}

export type LessonStatus = 'locked' | 'available' | 'started' | 'completed' | 'mastered' | 'failed';

export interface LessonInteraction {
  readonly id: string;
  readonly type: InteractionType;
  readonly timestamp: string;
  readonly duration: number;
  readonly score: number | null;
  readonly metadata: Record<string, unknown>;
}

export type InteractionType =
  | 'video_watched'
  | 'text_read'
  | 'quiz_completed'
  | 'exercise_submitted'
  | 'ai_conversation'
  | 'resource_downloaded'
  | 'note_taken'
  | 'bookmark_added';

// Types pour les notes utilisateur
export interface UserNote {
  readonly id: string;
  readonly userId: string;
  readonly lessonId: string;
  readonly content: string;
  readonly timestamp: string;
  readonly position?: VideoTimestamp | TextPosition;
  readonly tags: readonly string[];
  readonly isPrivate: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface VideoTimestamp {
  readonly type: 'video';
  readonly time: number;
}

export interface TextPosition {
  readonly type: 'text';
  readonly selector: string;
  readonly offset: number;
}

// Types pour les achievements
export interface Achievement {
  readonly id: string;
  readonly type: AchievementType;
  readonly title: string;
  readonly description: string;
  readonly icon: string;
  readonly rarity: AchievementRarity;
  readonly points: number;
  readonly unlockedAt: string;
  readonly progress: AchievementProgress;
}

export type AchievementType =
  | 'course_completion'
  | 'streak'
  | 'score'
  | 'time_spent'
  | 'interaction'
  | 'social'
  | 'milestone';

export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface AchievementProgress {
  readonly current: number;
  readonly target: number;
  readonly percentage: number;
}

// Types pour les learning paths
export interface LearningPath {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly courses: readonly string[];
  readonly currentCourse: string;
  readonly adaptiveRecommendations: readonly Recommendation[];
  readonly personalizedOrder: readonly string[];
  readonly difficultyAdjustments: readonly DifficultyAdjustment[];
}

export interface Recommendation {
  readonly type: RecommendationType;
  readonly contentId: string;
  readonly reason: string;
  readonly confidence: number;
  readonly priority: number;
  readonly validUntil: string;
}

export type RecommendationType =
  | 'next_lesson'
  | 'review_lesson'
  | 'practice_exercise'
  | 'related_course'
  | 'skill_gap';

export interface DifficultyAdjustment {
  readonly lessonId: string;
  readonly originalDifficulty: string;
  readonly adjustedDifficulty: string;
  readonly reason: string;
  readonly appliedAt: string;
}

// Types pour les streaks
export interface StreakStats {
  readonly current: number;
  readonly longest: number;
  readonly total: number;
  readonly lastActivityDate: string;
  readonly milestones: readonly StreakMilestone[];
}

export interface StreakMilestone {
  readonly days: number;
  readonly achievedAt: string;
  readonly reward: string | null;
}

// Types pour le temps passé
export interface TimeSpentStats {
  readonly total: number;
  readonly thisWeek: number;
  readonly thisMonth: number;
  readonly averagePerSession: number;
  readonly peakHours: readonly number[];
  readonly breakdown: TimeBreakdown;
}

export interface TimeBreakdown {
  readonly video: number;
  readonly reading: number;
  readonly quiz: number;
  readonly exercise: number;
  readonly aiChat: number;
  readonly other: number;
}

// Types pour les certifications
export interface Certificate {
  readonly id: string;
  readonly userId: string;
  readonly courseId: string;
  readonly type: CertificateType;
  readonly title: string;
  readonly description: string;
  readonly issueDate: string;
  readonly expiryDate: string | null;
  readonly verificationId: string;
  readonly pdfUrl: string;
  readonly metadata: CertificateMetadata;
}

export type CertificateType = 'completion' | 'mastery' | 'participation';

export interface CertificateMetadata {
  readonly finalScore: number;
  readonly completionTime: number;
  readonly instructor: string;
  readonly credentialHash: string;
  readonly blockchainTxId: string | null;
}

// Types pour les analytics
export interface LearningAnalytics {
  readonly userId: string;
  readonly period: AnalyticsPeriod;
  readonly engagement: EngagementMetrics;
  readonly performance: PerformanceMetrics;
  readonly behavior: BehaviorMetrics;
  readonly predictions: readonly LearningPrediction[];
}

export interface EngagementMetrics {
  readonly sessionCount: number;
  readonly averageSessionDuration: number;
  readonly totalTimeSpent: number;
  readonly completionRate: number;
  readonly returnRate: number;
  readonly interactionCount: number;
}

export interface PerformanceMetrics {
  readonly averageScore: number;
  readonly improvementRate: number;
  readonly masteryRate: number;
  readonly retentionRate: number;
  readonly strugglingAreas: readonly string[];
  readonly strongAreas: readonly string[];
}

export interface BehaviorMetrics {
  readonly preferredLearningTime: readonly number[];
  readonly preferredContentType: ContentType[];
  readonly averageAttemptsPerLesson: number;
  readonly helpSeekingFrequency: number;
  readonly notesTakingFrequency: number;
  readonly socialInteractionLevel: number;
}

export interface LearningPrediction {
  readonly type: PredictionType;
  readonly confidence: number;
  readonly prediction: string;
  readonly recommendedAction: string;
  readonly timeline: string;
}

export type PredictionType =
  | 'completion_likelihood'
  | 'dropout_risk'
  | 'performance_forecast'
  | 'engagement_decline'
  | 'mastery_timeline';

// Types pour les hooks de progress
export interface UseProgressOptions {
  readonly userId: string;
  readonly courseId?: string;
  readonly includeAnalytics?: boolean;
  readonly realtime?: boolean;
}

export interface UseProgressReturn {
  readonly progress: UserProgress | null;
  readonly analytics: LearningAnalytics | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly updateProgress: (lessonId: string, interaction: LessonInteraction) => Promise<void>;
  readonly markLessonComplete: (lessonId: string, score: number) => Promise<void>;
  readonly addNote: (
    lessonId: string,
    content: string,
    position?: VideoTimestamp | TextPosition,
  ) => Promise<void>;
  readonly getRecommendations: () => readonly Recommendation[];
  readonly exportProgress: () => Promise<string>;
}

// Type guards et utilitaires
export const isValidMasteryLevel = (level: unknown): level is MasteryLevel => {
  const validLevels: MasteryLevel[] = ['novice', 'beginner', 'intermediate', 'advanced', 'expert'];
  return typeof level === 'string' && validLevels.includes(level as MasteryLevel);
};

export const isValidLessonStatus = (status: unknown): status is LessonStatus => {
  const validStatuses: LessonStatus[] = [
    'locked',
    'available',
    'started',
    'completed',
    'mastered',
    'failed',
  ];
  return typeof status === 'string' && validStatuses.includes(status as LessonStatus);
};

export const calculateOverallProgress = (
  moduleProgress: readonly ModuleProgress[],
): ProgressStats => {
  const totalLessons = moduleProgress.reduce(
    (sum, module) => sum + module.progress.totalLessons,
    0,
  );
  const completedLessons = moduleProgress.reduce(
    (sum, module) => sum + module.progress.completedLessons,
    0,
  );
  const totalModules = moduleProgress.length;
  const completedModules = moduleProgress.filter(
    (module) => module.status === 'completed' || module.status === 'mastered',
  ).length;

  const percentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
  const averageScore =
    moduleProgress.reduce((sum, module) => sum + module.progress.averageScore, 0) / totalModules ||
    0;

  return {
    percentage,
    completedLessons,
    totalLessons,
    completedModules,
    totalModules,
    averageScore,
    masteryLevel: getMasteryLevelFromScore(averageScore),
  };
};

export const getMasteryLevelFromScore = (score: number): MasteryLevel => {
  if (score >= 95) return 'expert';
  if (score >= 85) return 'advanced';
  if (score >= 70) return 'intermediate';
  if (score >= 50) return 'beginner';
  return 'novice';
};
