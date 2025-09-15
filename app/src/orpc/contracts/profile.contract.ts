import { z } from 'zod';

// Schema pour profil utilisateur
export const ProfileSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().min(1),
  created_at: z.string(),
  updated_at: z.string(),
});

export const ProfileCreateSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().min(1).max(200),
});

export const profileContractSchemas = {
  get: { 
    input: z.object({ id: z.string().uuid() }), 
    output: ProfileSchema.nullable() 
  },
  create: { 
    input: ProfileCreateSchema, 
    output: ProfileSchema 
  },
} as const;

export type ProfileResponse = z.infer<typeof ProfileSchema>;
export type ProfileCreateRequest = z.infer<typeof ProfileCreateSchema>;