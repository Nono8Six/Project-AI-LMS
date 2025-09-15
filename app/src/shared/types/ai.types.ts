/**
 * Types pour l'IA et l'évaluation conversationnelle
 * Intégration Gemini Flash 2.5 et gestion des tokens
 */

// Types pour les modèles IA
export type AIProvider = 'gemini' | 'openai' | 'deepseek';
export type AIModel =
  | 'gemini-2.5-flash'
  | 'gemini-2.0-flash'
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'deepseek-chat';

// Types pour les conversations IA
export interface AIConversation {
  readonly id: string;
  readonly userId: string;
  readonly lessonId: string;
  readonly title: string;
  readonly status: ConversationStatus;
  readonly model: AIModel;
  readonly messages: readonly AIMessage[];
  readonly evaluation: ConversationEvaluation | null;
  readonly tokenUsage: TokenUsage;
  readonly startedAt: string;
  readonly completedAt: string | null;
  readonly metadata: ConversationMetadata;
}

export type ConversationStatus = 'active' | 'completed' | 'paused' | 'abandoned' | 'error';

export interface AIMessage {
  readonly id: string;
  readonly role: 'system' | 'user' | 'assistant';
  readonly content: string;
  readonly timestamp: string;
  readonly tokens: number;
  readonly metadata?: MessageMetadata;
}

export interface MessageMetadata {
  readonly type?: 'instruction' | 'question' | 'answer' | 'feedback' | 'evaluation';
  readonly confidence?: number;
  readonly processingTime?: number;
  readonly retryCount?: number;
}

// Types pour l'évaluation
export interface ConversationEvaluation {
  readonly id: string;
  readonly conversationId: string;
  readonly overallScore: number;
  readonly criteria: readonly CriterionEvaluation[];
  readonly feedback: EvaluationFeedback;
  readonly suggestions: readonly string[];
  readonly completionStatus: CompletionStatus;
  readonly evaluatedAt: string;
  readonly evaluatorModel: AIModel;
}

export interface CriterionEvaluation {
  readonly criterionId: string;
  readonly name: string;
  readonly score: number;
  readonly maxScore: number;
  readonly feedback: string;
  readonly evidence: readonly string[];
}

export interface EvaluationFeedback {
  readonly strengths: readonly string[];
  readonly weaknesses: readonly string[];
  readonly recommendations: readonly string[];
  readonly nextSteps: readonly string[];
}

export type CompletionStatus =
  | 'mastered'
  | 'proficient'
  | 'developing'
  | 'needs_improvement'
  | 'not_attempted';

// Types pour l'usage des tokens
export interface TokenUsage {
  readonly prompt: number;
  readonly completion: number;
  readonly total: number;
  readonly cost: number;
  readonly currency: string;
}

export interface ConversationMetadata {
  readonly lessonObjectives: readonly string[];
  readonly difficulty: string;
  readonly estimatedDuration: number;
  readonly language: string;
  readonly adaptationLevel: number;
  readonly context: Record<string, unknown>;
}

// Types pour les prompts système
export interface AIPrompt {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly content: string;
  readonly variables: readonly PromptVariable[];
  readonly model: AIModel;
  readonly parameters: PromptParameters;
  readonly tags: readonly string[];
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface PromptVariable {
  readonly name: string;
  readonly type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  readonly required: boolean;
  readonly description: string;
  readonly defaultValue?: unknown;
  readonly validation?: ValidationRule[];
}

export interface ValidationRule {
  readonly type: 'min' | 'max' | 'pattern' | 'enum';
  readonly value: unknown;
  readonly message: string;
}

export interface PromptParameters {
  readonly temperature: number;
  readonly maxTokens: number;
  readonly topP: number;
  readonly frequencyPenalty: number;
  readonly presencePenalty: number;
  readonly stopSequences: readonly string[];
}

// Types pour le monitoring et analytics IA
export interface AIAnalytics {
  readonly period: AIAnalyticsPeriod;
  readonly totalConversations: number;
  readonly totalTokens: TokenUsage;
  readonly averageSessionDuration: number;
  readonly completionRates: CompletionRates;
  readonly modelUsage: readonly ModelUsageStats[];
  readonly errorRate: number;
  readonly costBreakdown: CostBreakdown;
}

export type AIAnalyticsPeriod = 'hour' | 'day' | 'week' | 'month' | 'year';

export interface CompletionRates {
  readonly mastered: number;
  readonly proficient: number;
  readonly developing: number;
  readonly needsImprovement: number;
  readonly abandoned: number;
}

export interface ModelUsageStats {
  readonly model: AIModel;
  readonly conversationCount: number;
  readonly tokenUsage: TokenUsage;
  readonly averageScore: number;
  readonly errorRate: number;
}

export interface CostBreakdown {
  readonly total: number;
  readonly byModel: Record<AIModel, number>;
  readonly byFeature: Record<string, number>;
  readonly trend: readonly { date: string; cost: number }[];
}

// Types pour la configuration IA
export interface AIConfig {
  readonly defaultModel: AIModel;
  readonly fallbackModel: AIModel;
  readonly maxTokensPerConversation: number;
  readonly maxConversationDuration: number; // en minutes
  readonly retryAttempts: number;
  readonly timeoutSeconds: number;
  readonly costLimits: CostLimits;
  readonly modelConfigs: Record<AIModel, ModelConfig>;
}

export interface CostLimits {
  readonly dailyLimit: number;
  readonly monthlyLimit: number;
  readonly perUserLimit: number;
  readonly alertThreshold: number;
}

export interface ModelConfig {
  readonly enabled: boolean;
  readonly priority: number;
  readonly defaultParameters: PromptParameters;
  readonly rateLimit: RateLimit;
  readonly costPerToken: {
    readonly input: number;
    readonly output: number;
  };
}

export interface RateLimit {
  readonly requestsPerMinute: number;
  readonly tokensPerMinute: number;
  readonly concurrentRequests: number;
}

// Types pour les événements IA
export type AIEvent =
  | 'conversation_started'
  | 'message_sent'
  | 'message_received'
  | 'conversation_completed'
  | 'evaluation_generated'
  | 'error_occurred'
  | 'token_limit_reached'
  | 'cost_threshold_exceeded';

export interface AIEventPayload {
  readonly event: AIEvent;
  readonly conversationId: string;
  readonly userId: string;
  readonly timestamp: string;
  readonly data: Record<string, unknown>;
  readonly metadata?: Record<string, unknown>;
}

// Types pour les hooks d'IA
export interface UseAIChatOptions {
  readonly lessonId: string;
  readonly model?: AIModel;
  readonly systemPrompt?: string;
  readonly maxTokens?: number;
  readonly temperature?: number;
  readonly autoSave?: boolean;
}

export interface UseAIChatReturn {
  readonly conversation: AIConversation | null;
  readonly messages: readonly AIMessage[];
  readonly isLoading: boolean;
  readonly isEvaluating: boolean;
  readonly error: string | null;
  readonly tokenUsage: TokenUsage;
  readonly sendMessage: (content: string) => Promise<void>;
  readonly endConversation: () => Promise<ConversationEvaluation | null>;
  readonly resetConversation: () => void;
  readonly exportConversation: () => string;
}

// Type guards et utilitaires
export const isValidAIModel = (model: unknown): model is AIModel => {
  const validModels: AIModel[] = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gpt-4o',
    'gpt-4o-mini',
    'deepseek-chat',
  ];
  return typeof model === 'string' && validModels.includes(model as AIModel);
};

export const isValidConversationStatus = (status: unknown): status is ConversationStatus => {
  const validStatuses: ConversationStatus[] = [
    'active',
    'completed',
    'paused',
    'abandoned',
    'error',
  ];
  return typeof status === 'string' && validStatuses.includes(status as ConversationStatus);
};

export const calculateTokenCost = (
  usage: TokenUsage,
  model: AIModel,
  config: ModelConfig,
): number => {
  const inputCost = usage.prompt * config.costPerToken.input;
  const outputCost = usage.completion * config.costPerToken.output;
  return inputCost + outputCost;
};
