import { z } from 'zod';

// Schema pour consents RGPD (selon contrainte user_profiles_consents_structure)
export const ConsentsSchema = z.object({
  marketing: z.boolean(),
  analytics: z.boolean(),
  cookies: z.boolean(),
});

// Schema complet pour profil utilisateur (toutes colonnes user_profiles)
export const ProfileSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().min(1),
  role: z.enum(['member', 'admin']),
  status: z.enum(['active', 'suspended', 'pending_verification']),
  referral_code: z.string().nullable(),
  referrer_id: z.string().uuid().nullable(),
  onboarding_completed: z.boolean(),
  onboarding_completed_at: z.string().nullable(), // ISO date string
  consents: ConsentsSchema,
  created_at: z.string(), // ISO date string
  updated_at: z.string(), // ISO date string
});

// Schema pour création profil (champs requis + optionnels selon contraintes DB)
export const ProfileCreateSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().min(1).max(200),
  // Optionnels avec valeurs par défaut en DB
  role: z.enum(['member', 'admin']).default('member').optional(),
  status: z.enum(['active', 'suspended', 'pending_verification']).default('active').optional(),
  referrer_id: z.string().uuid().nullable().optional(),
  onboarding_completed: z.boolean().default(false).optional(),
  consents: ConsentsSchema.default({
    marketing: false,
    analytics: false,
    cookies: true
  }).optional(),
});

// Schema pour mise à jour profil (tous champs optionnels sauf id)
export const ProfileUpdateSchema = z.object({
  full_name: z.string().min(1).max(200).optional(),
  role: z.enum(['member', 'admin']).optional(),
  status: z.enum(['active', 'suspended', 'pending_verification']).optional(),
  referrer_id: z.string().uuid().nullable().optional(),
  onboarding_completed: z.boolean().optional(),
  onboarding_completed_at: z.string().nullable().optional(),
  consents: ConsentsSchema.optional(),
});

// Input schemas exportés directement (comme system.contract.ts)
export const ProfileGetInput = z.object({ id: z.string().uuid() });
export const ProfileCreateInput = ProfileCreateSchema;
export const ProfileUpdateInput = z.object({
  id: z.string().uuid(),
  updates: ProfileUpdateSchema
});

// Output schemas
export const ProfileGetOutput = ProfileSchema.nullable();
export const ProfileCreateOutput = ProfileSchema;
export const ProfileUpdateOutput = ProfileSchema;

// Pour rétrocompatibilité si besoin
export const profileContractSchemas = {
  get: {
    input: ProfileGetInput,
    output: ProfileGetOutput
  },
  create: {
    input: ProfileCreateInput,
    output: ProfileCreateOutput
  },
  update: {
    input: ProfileUpdateInput,
    output: ProfileUpdateOutput
  },
} as const;

// Types exportés pour utilisation dans les handlers
export type Consents = z.infer<typeof ConsentsSchema>;
export type Profile = z.infer<typeof ProfileSchema>;
export type ProfileCreateRequest = z.infer<typeof ProfileCreateSchema>;
export type ProfileUpdateRequest = z.infer<typeof ProfileUpdateSchema>;

// Alias pour rétrocompatibilité
export type ProfileResponse = Profile;