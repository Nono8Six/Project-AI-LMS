import { z } from 'zod';

// No input schema helper (allow undefined or empty object)
export const NoInput = z.union([z.undefined(), z.object({}).strict()]).optional();

export const HealthOutput = z.object({
  status: z.literal('ok'),
  version: z.string(),
  time: z.string(), // ISO timestamp
});

export const TimeOutput = z.object({
  now: z.string(), // ISO timestamp
});

export const VersionOutput = z.object({
  version: z.string(),
});

export const systemContractSchemas = {
  health: { input: NoInput, output: HealthOutput },
  time: { input: NoInput, output: TimeOutput },
  version: { input: NoInput, output: VersionOutput },
} as const;

export type HealthResponse = z.infer<typeof HealthOutput>;
export type TimeResponse = z.infer<typeof TimeOutput>;
export type VersionResponse = z.infer<typeof VersionOutput>;

