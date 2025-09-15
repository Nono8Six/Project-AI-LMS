/**
 * Types utilitaires et communs
 * Types génériques réutilisables dans toute l'application
 */

// Types utilitaires de base
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

// Types pour les identifiants
export type ID = string;
export type UUID = string;
export type Slug = string;

// Types pour les dates
export type ISODate = string;
export type Timestamp = number;

// Types pour les couleurs
export type HexColor = `#${string}`;
export type RGBColor = `rgb(${number}, ${number}, ${number})`;
export type HSLColor = `hsl(${number}, ${number}%, ${number}%)`;
export type Color = HexColor | RGBColor | HSLColor;

// Types pour les URLs
export type URL = string;
export type Path = string;
export type QueryParams = Record<
  string,
  string | number | boolean | readonly (string | number | boolean)[]
>;

// Types pour les statuts
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
export type AsyncState<T, E = string> = {
  readonly data: T | null;
  readonly status: LoadingState;
  readonly error: E | null;
};

// Types pour les sélections
export type SelectOption<T = string> = {
  readonly value: T;
  readonly label: string;
  readonly disabled?: boolean;
  readonly icon?: string;
  readonly description?: string;
};

// Types pour les événements
export type EventHandler<T = void> = (event: T) => void;
export type AsyncEventHandler<T = void> = (event: T) => Promise<void>;

// Types pour les validations
export type ValidationResult = {
  readonly isValid: boolean;
  readonly errors: readonly string[];
  readonly warnings?: readonly string[];
};

export type Validator<T> = (value: T) => ValidationResult;

// Types pour les formulaires
export type FormState<T> = {
  readonly values: T;
  readonly errors: Partial<Record<keyof T, string>>;
  readonly touched: Partial<Record<keyof T, boolean>>;
  readonly isSubmitting: boolean;
  readonly isValid: boolean;
  readonly isDirty: boolean;
};

export type FormField<T> = {
  readonly name: keyof T;
  readonly label: string;
  readonly type:
    | 'text'
    | 'email'
    | 'password'
    | 'number'
    | 'textarea'
    | 'select'
    | 'checkbox'
    | 'radio'
    | 'file'
    | 'date';
  readonly placeholder?: string;
  readonly required?: boolean;
  readonly disabled?: boolean;
  readonly options?: readonly SelectOption[];
  readonly validation?: Validator<unknown>;
};

// Types pour les modales et popups
export type ModalProps = {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly title?: string;
  readonly children: React.ReactNode;
};

export type PopoverProps = {
  readonly trigger: React.ReactNode;
  readonly content: React.ReactNode;
  readonly placement?: 'top' | 'bottom' | 'left' | 'right';
  readonly offset?: number;
};

// Types pour les toasts/notifications
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export type Notification = {
  readonly id: ID;
  readonly type: NotificationType;
  readonly title: string;
  readonly message?: string;
  readonly duration?: number;
  readonly dismissible?: boolean;
  readonly actions?: readonly NotificationAction[];
};

export type NotificationAction = {
  readonly label: string;
  readonly action: () => void;
  readonly style?: 'primary' | 'secondary' | 'danger';
};

// Types pour la recherche
export type SearchResult<T> = {
  readonly item: T;
  readonly score: number;
  readonly matches: readonly SearchMatch[];
};

export type SearchMatch = {
  readonly field: string;
  readonly value: string;
  readonly indices: readonly [number, number][];
};

// Types pour les filtres
export type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'in'
  | 'not_in';

export type Filter<T = unknown> = {
  readonly field: string;
  readonly operator: FilterOperator;
  readonly value: T;
};

export type FilterGroup<T = unknown> = {
  readonly operator: 'and' | 'or';
  readonly filters: readonly (Filter<T> | FilterGroup<T>)[];
};

// Types pour le tri
export type SortDirection = 'asc' | 'desc';

export type SortCriterion = {
  readonly field: string;
  readonly direction: SortDirection;
  readonly priority?: number;
};

// Types pour la configuration
export type AppConfig = {
  readonly app: {
    readonly name: string;
    readonly version: string;
    readonly environment: 'development' | 'staging' | 'production';
  };
  readonly api: {
    readonly baseUrl: string;
    readonly timeout: number;
    readonly retries: number;
  };
  readonly features: {
    readonly aiChat: boolean;
    readonly certificates: boolean;
    readonly analytics: boolean;
    readonly social: boolean;
  };
  readonly limits: {
    readonly maxFileSize: number;
    readonly maxUploadCount: number;
    readonly sessionTimeout: number;
  };
  readonly integrations: {
    readonly stripe: {
      readonly publicKey: string;
      readonly webhookSecret: string;
    };
    readonly mux: {
      readonly tokenId: string;
      readonly tokenSecret: string;
    };
    readonly gemini: {
      readonly apiKey: string;
      readonly model: string;
    };
  };
};

// Types pour les métadonnées
export type Metadata = Record<string, unknown>;

export type WithMetadata<T> = T & {
  readonly metadata: Metadata;
};

export type WithTimestamps<T> = T & {
  readonly createdAt: ISODate;
  readonly updatedAt: ISODate;
};

export type WithOptionalTimestamps<T> = T & {
  readonly createdAt?: ISODate;
  readonly updatedAt?: ISODate;
};

// Types pour l'internationalisation
export type LocaleCode = 'en' | 'fr' | 'es' | 'de' | 'it' | 'pt' | 'ja' | 'zh' | 'ar';

export type TranslationKey = string;

export type TranslationValues = Record<string, string | number>;

export type Translation = {
  readonly key: TranslationKey;
  readonly values?: TranslationValues;
};

// Types pour l'accessibilité
export type AriaLabel = string;
export type AriaDescribedBy = string;
export type AriaLive = 'off' | 'polite' | 'assertive';

export type AccessibilityProps = {
  readonly 'aria-label'?: AriaLabel;
  readonly 'aria-describedby'?: AriaDescribedBy;
  readonly 'aria-live'?: AriaLive;
  readonly role?: string;
  readonly tabIndex?: number;
};

// Types pour les analytics
export type AnalyticsEvent = {
  readonly name: string;
  readonly properties?: Record<string, unknown>;
  readonly timestamp?: ISODate;
  readonly userId?: ID;
  readonly sessionId?: ID;
};

export type AnalyticsIdentity = {
  readonly userId: ID;
  readonly traits: Record<string, unknown>;
  readonly timestamp?: ISODate;
};

// Types pour la performance
export type PerformanceMetric = {
  readonly name: string;
  readonly value: number;
  readonly unit: 'ms' | 'bytes' | 'count' | 'percentage';
  readonly timestamp: ISODate;
  readonly tags?: Record<string, string>;
};

// Types pour les erreurs
export type ErrorInfo = {
  readonly message: string;
  readonly stack?: string;
  readonly code?: string;
  readonly timestamp: ISODate;
  readonly userId?: ID;
  readonly url?: string;
  readonly userAgent?: string;
  readonly additional?: Metadata;
};

// Types pour les hooks React
export type UseAsyncOptions = {
  readonly immediate?: boolean;
  readonly onSuccess?: (data: unknown) => void;
  readonly onError?: (error: Error) => void;
};

export type UseAsyncReturn<T, E = Error> = AsyncState<T, E> & {
  readonly execute: (...args: unknown[]) => Promise<T>;
  readonly reset: () => void;
};

// Types pour les utilitaires de manipulation d'objets
export type DeepPartial<T> = {
  readonly [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type DeepRequired<T> = {
  readonly [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

export type Pick<T, K extends keyof T> = {
  readonly [P in K]: T[P];
};

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

// Types pour les constantes
export type ConstantValues<T> = T[keyof T];

export type StringLiteralUnion<T extends string> = T | (string & {});

// Types pour les fonctions utilitaires
export type Predicate<T> = (value: T) => boolean;
export type Comparator<T> = (a: T, b: T) => number;
export type Mapper<T, U> = (value: T) => U;
export type Reducer<T, U> = (accumulator: U, value: T) => U;

// Types pour les promesses
export type PromiseType<T> = T extends Promise<infer U> ? U : T;
export type AsyncReturnType<T extends (...args: unknown[]) => Promise<unknown>> = PromiseType<
  ReturnType<T>
>;

// Types pour les composants React
export type ComponentProps<
  T extends keyof React.JSX.IntrinsicElements | React.JSXElementConstructor<unknown>,
> = T extends keyof React.JSX.IntrinsicElements
  ? React.JSX.IntrinsicElements[T]
  : T extends React.JSXElementConstructor<infer P>
    ? P
    : {};

export type PropsWithChildren<P = {}> = P & { readonly children?: React.ReactNode };

export type ForwardedRef<T> =
  | React.MutableRefObject<T | null>
  | ((instance: T | null) => void)
  | null;

// Tous les types sont déjà exportés individuellement ci-dessus
