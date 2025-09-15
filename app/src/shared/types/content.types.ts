/**
 * Types pour le contenu pédagogique
 * Courses, Modules, Lessons et contenus multimédias
 */

// Types de base pour le contenu
export type ContentType = 'video' | 'text' | 'quiz' | 'exercise' | 'ai_chat' | 'resource';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type ContentStatus = 'draft' | 'review' | 'published' | 'archived';

// Types pour les cours
export interface Course {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly shortDescription: string;
  readonly thumbnail: string;
  readonly banner: string | null;
  readonly difficulty: DifficultyLevel;
  readonly status: ContentStatus;
  readonly isPremium: boolean;
  readonly price: number | null;
  readonly estimatedDuration: number; // en minutes
  readonly prerequisites: readonly string[];
  readonly learningObjectives: readonly string[];
  readonly tags: readonly string[];
  readonly category: CourseCategory;
  readonly instructor: Instructor;
  readonly modules: readonly Module[];
  readonly totalLessons: number;
  readonly totalDuration: number;
  readonly enrollmentCount: number;
  readonly rating: CourseRating;
  readonly seo: SEOMetadata;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CourseCategory {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly description: string;
  readonly icon: string;
  readonly color: string;
}

export interface Instructor {
  readonly id: string;
  readonly name: string;
  readonly avatar: string;
  readonly bio: string;
  readonly expertise: readonly string[];
  readonly socialLinks: readonly SocialLink[];
}

export interface SocialLink {
  readonly platform: string;
  readonly url: string;
}

export interface CourseRating {
  readonly average: number;
  readonly count: number;
  readonly distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

// Types pour les modules
export interface Module {
  readonly id: string;
  readonly courseId: string;
  readonly title: string;
  readonly description: string;
  readonly order: number;
  readonly isRequired: boolean;
  readonly estimatedDuration: number;
  readonly lessons: readonly Lesson[];
  readonly status: ContentStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
}

// Types pour les leçons
export interface Lesson {
  readonly id: string;
  readonly moduleId: string;
  readonly title: string;
  readonly description: string;
  readonly order: number;
  readonly type: ContentType;
  readonly content: LessonContent;
  readonly estimatedDuration: number;
  readonly isRequired: boolean;
  readonly hasAiEvaluation: boolean;
  readonly resources: readonly Resource[];
  readonly status: ContentStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
}

// Union type pour le contenu des leçons
export type LessonContent =
  | VideoContent
  | TextContent
  | QuizContent
  | ExerciseContent
  | AIChatContent
  | ResourceContent;

export interface VideoContent {
  readonly type: 'video';
  readonly videoId: string; // Mux video ID
  readonly thumbnail: string;
  readonly duration: number;
  readonly chapters: readonly VideoChapter[];
  readonly captions: readonly Caption[];
  readonly quality: readonly VideoQuality[];
}

export interface VideoChapter {
  readonly title: string;
  readonly startTime: number;
  readonly endTime: number;
}

export interface Caption {
  readonly language: string;
  readonly url: string;
  readonly isDefault: boolean;
}

export interface VideoQuality {
  readonly resolution: string;
  readonly bitrate: number;
  readonly url: string;
}

export interface TextContent {
  readonly type: 'text';
  readonly content: string; // MDX content
  readonly tableOfContents: readonly TOCItem[];
  readonly estimatedReadTime: number;
}

export interface TOCItem {
  readonly title: string;
  readonly level: number;
  readonly anchor: string;
  readonly children?: readonly TOCItem[];
}

export interface QuizContent {
  readonly type: 'quiz';
  readonly questions: readonly Question[];
  readonly passingScore: number;
  readonly allowMultipleAttempts: boolean;
  readonly timeLimit: number | null;
  readonly shuffleQuestions: boolean;
}

export interface Question {
  readonly id: string;
  readonly type: 'multiple_choice' | 'single_choice' | 'true_false' | 'fill_blank' | 'essay';
  readonly question: string;
  readonly options?: readonly QuestionOption[];
  readonly correctAnswer: string | readonly string[];
  readonly explanation: string;
  readonly points: number;
}

export interface QuestionOption {
  readonly id: string;
  readonly text: string;
  readonly isCorrect: boolean;
}

export interface ExerciseContent {
  readonly type: 'exercise';
  readonly instructions: string;
  readonly template: string;
  readonly solution: string;
  readonly hints: readonly string[];
  readonly testCases: readonly TestCase[];
  readonly allowedLanguages: readonly string[];
}

export interface TestCase {
  readonly input: string;
  readonly expectedOutput: string;
  readonly isHidden: boolean;
}

export interface AIChatContent {
  readonly type: 'ai_chat';
  readonly systemPrompt: string;
  readonly initialMessage: string;
  readonly objectives: readonly string[];
  readonly evaluationCriteria: readonly EvaluationCriterion[];
  readonly maxTokens: number;
  readonly temperature: number;
}

export interface EvaluationCriterion {
  readonly name: string;
  readonly description: string;
  readonly weight: number;
  readonly rubric: readonly RubricLevel[];
}

export interface RubricLevel {
  readonly level: number;
  readonly description: string;
  readonly points: number;
}

export interface ResourceContent {
  readonly type: 'resource';
  readonly resources: readonly Resource[];
}

// Types pour les ressources
export interface Resource {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly type: 'pdf' | 'image' | 'link' | 'code' | 'dataset';
  readonly url: string;
  readonly fileSize: number | null;
  readonly downloadable: boolean;
}

// Types pour le SEO
export interface SEOMetadata {
  readonly title: string;
  readonly description: string;
  readonly keywords: readonly string[];
  readonly canonicalUrl: string | null;
  readonly openGraph: {
    readonly title: string;
    readonly description: string;
    readonly image: string;
    readonly type: string;
  };
  readonly structuredData: Record<string, unknown>;
}

// Types pour les filtres et recherche
export interface ContentFilters {
  readonly category?: string;
  readonly difficulty?: DifficultyLevel;
  readonly duration?: {
    readonly min: number;
    readonly max: number;
  };
  readonly isPremium?: boolean;
  readonly tags?: readonly string[];
  readonly rating?: {
    readonly min: number;
    readonly max: number;
  };
}

export interface ContentSearchParams {
  readonly query: string;
  readonly filters: ContentFilters;
  readonly sortBy: 'relevance' | 'popularity' | 'rating' | 'duration' | 'recent';
  readonly sortOrder: 'asc' | 'desc';
  readonly page: number;
  readonly limit: number;
}

export interface ContentSearchResult {
  readonly items: readonly Course[];
  readonly total: number;
  readonly page: number;
  readonly totalPages: number;
  readonly hasNextPage: boolean;
  readonly hasPreviousPage: boolean;
}

// Type guards
export const isValidContentType = (type: unknown): type is ContentType => {
  return (
    typeof type === 'string' &&
    ['video', 'text', 'quiz', 'exercise', 'ai_chat', 'resource'].includes(type)
  );
};

export const isValidDifficultyLevel = (level: unknown): level is DifficultyLevel => {
  return (
    typeof level === 'string' && ['beginner', 'intermediate', 'advanced', 'expert'].includes(level)
  );
};

export const isVideoContent = (content: LessonContent): content is VideoContent => {
  return content.type === 'video';
};

export const isTextContent = (content: LessonContent): content is TextContent => {
  return content.type === 'text';
};

export const isQuizContent = (content: LessonContent): content is QuizContent => {
  return content.type === 'quiz';
};
