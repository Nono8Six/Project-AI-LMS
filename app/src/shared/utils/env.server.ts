import { z } from "zod";

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).optional(),
  NEXT_PUBLIC_APP_URL: z.string().url({ message: "NEXT_PUBLIC_APP_URL must be a valid URL" }),

  // Optional but supported integrations (used in config and CSP)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_API_BASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  MUX_DOMAIN: z.string().optional(),
  MUX_STREAM_DOMAIN: z.string().optional(),
  RATE_LIMIT_PROVIDER: z.enum(["memory", "redis"]).optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  // API/oRPC related (optional; validated in prod via assertEnv)
  ORPC_PREFIX: z.string().regex(/^\//, { message: "ORPC_PREFIX must start with '/'" }).optional(),
  API_MAX_BODY: z.string().regex(/^[1-9]\d*$/, { message: "API_MAX_BODY must be a positive integer" }).optional(),
  API_RATE_LIMIT_ANON_PER_MIN: z.string().regex(/^[1-9]\d*$/, { message: "API_RATE_LIMIT_ANON_PER_MIN must be a positive integer" }).optional(),
  API_RATE_LIMIT_USER_PER_MIN: z.string().regex(/^[1-9]\d*$/, { message: "API_RATE_LIMIT_USER_PER_MIN must be a positive integer" }).optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function getServerEnv(): ServerEnv {
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid server environment: ${parsed.error.message}`);
  }
  return parsed.data;
}

export function validateServerEnv(): void {
  // In production, enforce presence/format strictly
  if (process.env.NODE_ENV === "production") {
    const env = getServerEnv();
    // Conditional requirements: if using Redis rate-limit provider, require Upstash creds
    if (env.RATE_LIMIT_PROVIDER === "redis") {
      if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
        throw new Error("Invalid server environment: RATE_LIMIT_PROVIDER=redis requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN");
      }
    }
  }
}
