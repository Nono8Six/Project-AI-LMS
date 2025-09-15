/**
 * Export central de tous les types TypeScript
 * Point d'entrée principal pour l'importation des types
 */ 

// Imports spécifiques pour les type guards
import type { UserRole } from './auth.types';
import type { ContentType, DifficultyLevel } from './content.types';
import type { AIModel } from './ai.types';
import type { NotificationType } from './common.types';

// Types de navigation et routes
export * from './navigation.types';

// Types d'authentification
export * from './auth.types';

// Types de contenu pédagogique
export * from './content.types';

// Types IA et évaluation
export * from './ai.types';

// Types de progrès et analytics
export * from './progress.types';

// Types API et base de données
export * from './api.types';

// Types pour les route handlers Next.js
export * from './route-handlers.types';

// Types utilitaires et communs
export * from './common.types';

// Note: Les types spécifiques peuvent être importés directement depuis leurs fichiers respectifs
// pour éviter les références circulaires

// Constants utilitaires
export const TYPE_CONSTANTS = {
  USER_ROLES: ['visitor', 'member', 'moderator', 'admin'] as const,
  ROUTE_GROUPS: ['public', 'member', 'admin'] as const,
  CONTENT_TYPES: ['video', 'text', 'quiz', 'exercise', 'ai_chat', 'resource'] as const,
  DIFFICULTY_LEVELS: ['beginner', 'intermediate', 'advanced', 'expert'] as const,
  AI_MODELS: [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gpt-4o',
    'gpt-4o-mini',
    'deepseek-chat',
  ] as const,
  NOTIFICATION_TYPES: ['info', 'success', 'warning', 'error'] as const,
} as const;

// Type guards centralisés avec types stricts
export const TypeGuards = {
  isUserRole: (value: unknown): value is UserRole => {
    return typeof value === 'string' && 
           (TYPE_CONSTANTS.USER_ROLES as readonly string[]).includes(value);
  },

  isContentType: (value: unknown): value is ContentType => {
    return typeof value === 'string' && 
           (TYPE_CONSTANTS.CONTENT_TYPES as readonly string[]).includes(value);
  },

  isDifficultyLevel: (value: unknown): value is DifficultyLevel => {
    return typeof value === 'string' && 
           (TYPE_CONSTANTS.DIFFICULTY_LEVELS as readonly string[]).includes(value);
  },

  isAIModel: (value: unknown): value is AIModel => {
    return typeof value === 'string' && 
           (TYPE_CONSTANTS.AI_MODELS as readonly string[]).includes(value);
  },

  isNotificationTypes: (value: unknown): value is NotificationType => {
    return typeof value === 'string' && 
           (TYPE_CONSTANTS.NOTIFICATION_TYPES as readonly string[]).includes(value);
  },
} as const;

// Types React ré-exportés pour faciliter l'accès
export type { ReactNode } from 'react';
