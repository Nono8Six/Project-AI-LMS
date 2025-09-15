import { z } from 'zod';

export const NoInput = z.union([z.undefined(), z.object({}).strict()]).optional();

export const MeOutput = z.object({
  id: z.string().uuid(),
  email: z.string().email().nullable().optional(),
  role: z.string().nullable().optional(),
});

export const authContractSchemas = {
  me: { input: NoInput, output: MeOutput.nullable() },
} as const;

export type MeResponse = z.infer<typeof MeOutput> | null;

// Optional endpoint that enforces authentication and returns 401 otherwise.
// Reuses the same payload shape as MeOutput but never null.
export const MeRequiredOutput = MeOutput;
