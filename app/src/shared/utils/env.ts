import { z } from "zod";

export const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_ENABLE_AUTH_MIDDLEWARE: z.string().optional(),
  NEXT_PUBLIC_ENABLE_TEST_NAV: z.string().optional(),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

export function getClientEnv(): ClientEnv {
  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_ENABLE_AUTH_MIDDLEWARE: process.env.NEXT_PUBLIC_ENABLE_AUTH_MIDDLEWARE,
    NEXT_PUBLIC_ENABLE_TEST_NAV: process.env.NEXT_PUBLIC_ENABLE_TEST_NAV,
  });
  if (!parsed.success) {
    throw new Error(`Invalid client environment: ${parsed.error.message}`);
  }
  return parsed.data;
}

export function boolFromEnv(value: string | undefined): boolean | undefined {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

