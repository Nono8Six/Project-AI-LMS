/**
 * Types pour les APIs et communication avec Supabase
 * Requests, responses, et types de base de données
 */

// Types de base pour les APIs
export interface ApiResponse<T = unknown> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: ApiError;
  readonly meta?: ResponseMeta;
}

export interface ApiError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
  readonly stack?: string;
}

export interface ResponseMeta {
  readonly timestamp: string;
  readonly requestId: string;
  readonly version: string;
  readonly pagination?: PaginationMeta;
  readonly rateLimit?: RateLimitMeta;
}

export interface PaginationMeta {
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
  readonly hasNext: boolean;
  readonly hasPrevious: boolean;
}

export interface RateLimitMeta {
  readonly limit: number;
  readonly remaining: number;
  readonly resetAt: string;
}

// Types pour les requêtes paginées
export interface PaginatedRequest {
  readonly page?: number;
  readonly limit?: number;
  readonly sortBy?: string;
  readonly sortOrder?: 'asc' | 'desc';
  readonly filters?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  readonly items: readonly T[];
  readonly meta: PaginationMeta;
}

// Types pour Supabase Database - Importés depuis génération automatique
import type { Database, Json } from './database.generated';

// Re-export pour utilisation externe
export type { Database, Json };

// Types d'entités de base de données - Extraits de Database générée
export type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
export type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert'];
export type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update'];

export type Product = Database['public']['Tables']['products']['Row'];
export type ProductInsert = Database['public']['Tables']['products']['Insert'];
export type ProductUpdate = Database['public']['Tables']['products']['Update'];

export type Purchase = Database['public']['Tables']['purchases']['Row'];
export type PurchaseInsert = Database['public']['Tables']['purchases']['Insert'];
export type PurchaseUpdate = Database['public']['Tables']['purchases']['Update'];

export type ReferralConversion = Database['public']['Tables']['referral_conversions']['Row'];
export type ReferralConversionInsert = Database['public']['Tables']['referral_conversions']['Insert'];
export type ReferralConversionUpdate = Database['public']['Tables']['referral_conversions']['Update'];

export type SystemSetting = Database['public']['Tables']['system_settings']['Row'];
export type SystemSettingInsert = Database['public']['Tables']['system_settings']['Insert'];
export type SystemSettingUpdate = Database['public']['Tables']['system_settings']['Update'];

export type AuditLog = Database['public']['Tables']['audit_logs']['Row'];
export type AuditLogInsert = Database['public']['Tables']['audit_logs']['Insert'];
export type AuditLogUpdate = Database['public']['Tables']['audit_logs']['Update'];

// Enums business ultra-stricts
export const ProductStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive', 
  ARCHIVED: 'archived'
} as const;

export const ProductCategory = {
  COURSE: 'course',
  BUNDLE: 'bundle',
  PREMIUM: 'premium'
} as const;

export const PurchaseStatus = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  PARTIALLY_REFUNDED: 'partially_refunded'
} as const;

export const CommissionStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  PAID: 'paid',
  CANCELLED: 'cancelled'
} as const;

export const ConversionType = {
  FIRST_PURCHASE: 'first_purchase',
  ADDITIONAL_PURCHASE: 'additional_purchase'
} as const;

export const SupportedCurrency = {
  EUR: 'EUR',
  USD: 'USD'  
} as const;

export const SystemSettingValueType = {
  STRING: 'string',
  NUMBER: 'number', 
  BOOLEAN: 'boolean',
  OBJECT: 'object',
  ARRAY: 'array'
} as const;

// Types dérivés des enums (pour compatibilité)
export type ProductStatusType = typeof ProductStatus[keyof typeof ProductStatus];
export type ProductCategoryType = typeof ProductCategory[keyof typeof ProductCategory];
export type PurchaseStatusType = typeof PurchaseStatus[keyof typeof PurchaseStatus];
export type CommissionStatusType = typeof CommissionStatus[keyof typeof CommissionStatus];
export type ConversionTypeType = typeof ConversionType[keyof typeof ConversionType];
export type SupportedCurrencyType = typeof SupportedCurrency[keyof typeof SupportedCurrency];
export type SystemSettingValueTypeType = typeof SystemSettingValueType[keyof typeof SystemSettingValueType];

// Types pour les réponses Supabase avec relations
export type PurchaseWithRelations = {
  id: string;
  amount_paid: number;
  currency: string;
  status: string;
  completed_at: string | null;
  refunded_at: string | null;
  created_at: string;
  commission_rate: number | null;
  commission_amount: number | null;
  stripe_session_id: string;
  products: {
    id: string;
    name: string;
    description: string | null;
    price_amount: number;
    price_currency: string;
    category: string;
  } | null;
  referrer: {
    id: string;
    full_name: string;
  } | null;
};

export type ReferralConversionWithRelations = {
  id: string;
  conversion_type: string;
  commission_rate: number;
  commission_amount: number;
  commission_status: string;
  purchase_amount: number;
  paid_at: string | null;
  approved_at: string | null;
  created_at: string;
  referred_user: {
    id: string;
    full_name: string;
  } | null;
  purchase: {
    id: string;
    amount_paid: number;
    completed_at: string | null;
    stripe_session_id: string;
  } | null;
};

// Types pour les réponses de service avec gestion d'erreur
export type SupabaseServiceResult<T> = Promise<{
  data: T | null;
  error: {
    message: string;
    details?: string;
    hint?: string;
    code?: string;
  } | null;
}>;

// Types pour les services API
export type SupabaseClient = import('@supabase/supabase-js').SupabaseClient<Database>;

export interface ApiConfig {
  readonly baseUrl: string;
  readonly timeout: number;
  readonly retryAttempts: number;
  readonly retryDelay: number;
  readonly headers: Record<string, string>;
}

// Types pour les webhooks
export interface WebhookPayload<T = unknown> {
  readonly event: string;
  readonly timestamp: string;
  readonly data: T;
  readonly metadata?: Record<string, unknown>;
}

export interface StripeWebhookPayload extends WebhookPayload {
  readonly event: string;
  readonly data: {
    readonly object: Record<string, unknown>;
  };
}

// Types pour les utilitaires d'API
export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions {
  readonly method: ApiMethod;
  readonly headers?: Record<string, string>;
  readonly body?: unknown;
  readonly params?: Record<string, string | number>;
  readonly timeout?: number;
}

// Type guards ultra-stricts pour validation runtime
export const isApiError = (error: unknown): error is ApiError => {
  return typeof error === 'object' && error !== null && 'code' in error && 'message' in error;
};

export const isValidApiResponse = <T>(response: unknown): response is ApiResponse<T> => {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    typeof response.success === 'boolean'
  );
};

export const isValidProductStatus = (status: unknown): status is ProductStatusType => {
  return typeof status === 'string' && Object.values(ProductStatus).includes(status as ProductStatusType);
};

export const isValidProductCategory = (category: unknown): category is ProductCategoryType => {
  return typeof category === 'string' && Object.values(ProductCategory).includes(category as ProductCategoryType);
};

export const isValidPurchaseStatus = (status: unknown): status is PurchaseStatusType => {
  return typeof status === 'string' && Object.values(PurchaseStatus).includes(status as PurchaseStatusType);
};

export const isValidCommissionStatus = (status: unknown): status is CommissionStatusType => {
  return typeof status === 'string' && Object.values(CommissionStatus).includes(status as CommissionStatusType);
};

export const isValidCurrency = (currency: unknown): currency is SupportedCurrencyType => {
  return typeof currency === 'string' && Object.values(SupportedCurrency).includes(currency as SupportedCurrencyType);
};

export const isPositiveInteger = (value: unknown): value is number => {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
};

export const isValidCommissionRate = (rate: unknown): rate is number => {
  return typeof rate === 'number' && rate >= 0 && rate <= 0.5;
};

export const isUUID = (value: unknown): value is string => {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
};

export const isStripeProductId = (value: unknown): value is string => {
  return typeof value === 'string' && /^prod_[a-zA-Z0-9]+$/.test(value);
};

export const isStripePriceId = (value: unknown): value is string => {
  return typeof value === 'string' && /^price_[a-zA-Z0-9]+$/.test(value);
};

export const isStripeSessionId = (value: unknown): value is string => {
  return typeof value === 'string' && /^cs_[a-zA-Z0-9_]+$/.test(value);
};

export const isStripeCustomerId = (value: unknown): value is string => {
  return typeof value === 'string' && /^cus_[a-zA-Z0-9_]+$/.test(value);
};
