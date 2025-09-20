import { z } from 'zod';

export const NoInput = z.union([z.undefined(), z.object({}).strict()]).optional();

export const MeOutput = z.object({
  id: z.string().uuid(),
  email: z.string().email().nullable().optional(),
  role: z.string().nullable().optional(),
});

// Logout input et output
export const LogoutInput = z.object({
  allDevices: z.boolean().optional().default(false)
}).optional();

export const LogoutOutput = z.object({
  success: z.boolean(),
  message: z.string()
});

// Refresh session input et output
export const RefreshInput = NoInput;

export const RefreshOutput = z.object({
  success: z.boolean(),
  needsRefresh: z.boolean(),
  expiresAt: z.number().optional(),
  message: z.string()
});

export const authContractSchemas = {
  me: { input: NoInput, output: MeOutput.nullable() },
  logout: { input: LogoutInput, output: LogoutOutput },
  refresh: { input: RefreshInput, output: RefreshOutput },
} as const;

export type MeResponse = z.infer<typeof MeOutput> | null;
export type LogoutResponse = z.infer<typeof LogoutOutput>;
export type RefreshResponse = z.infer<typeof RefreshOutput>;

// Optional endpoint that enforces authentication and returns 401 otherwise.
// Reuses the same payload shape as MeOutput but never null.
export const MeRequiredOutput = MeOutput;
