import { z } from "zod";

const positiveInteger = (name: string) =>
  z
    .string()
    .regex(/^[1-9]\d*$/, { message: `${name} must be a positive integer` });

const secretString = (name: string, minLength: number) =>
  z
    .string()
    .min(minLength, { message: `${name} must be at least ${minLength} characters long` })
    .refine((value) => value === value.trim(), {
      message: `${name} must not include leading or trailing whitespace`,
    });

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).optional(),
  NEXT_PUBLIC_APP_URL: z.string().url({ message: "NEXT_PUBLIC_APP_URL must be a valid URL" }),

  // Optional but supported integrations (used in config and CSP)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  NEXT_PUBLIC_API_BASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: secretString("SUPABASE_SERVICE_ROLE_KEY", 32).optional(),
  SUPABASE_JWT_SECRET: secretString("SUPABASE_JWT_SECRET", 32).optional(),
  SUPABASE_DATABASE_PASSWORD: secretString("SUPABASE_DATABASE_PASSWORD", 12).optional(),
  SUPABASE_ACCESS_TOKEN: secretString("SUPABASE_ACCESS_TOKEN", 24).optional(),
  SUPABASE_PROJECT_REF: z
    .string()
    .regex(/^[a-z][a-z0-9]{19}$/, {
      message: "SUPABASE_PROJECT_REF must be a 20 character lowercase project reference",
    })
    .optional(),
  MUX_DOMAIN: z.string().optional(),
  MUX_STREAM_DOMAIN: z.string().optional(),
  RATE_LIMIT_PROVIDER: z.enum(["memory", "redis"]).optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  // API/oRPC related (optional; validated in prod via assertEnv)
  ORPC_PREFIX: z.string().regex(/^\//, { message: "ORPC_PREFIX must start with '/'" }).optional(),
  API_MAX_BODY: positiveInteger("API_MAX_BODY").optional(),
  API_RATE_LIMIT_ANON_PER_MIN: positiveInteger("API_RATE_LIMIT_ANON_PER_MIN").optional(),
  API_RATE_LIMIT_USER_PER_MIN: positiveInteger("API_RATE_LIMIT_USER_PER_MIN").optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function getServerEnv(env: NodeJS.ProcessEnv = process.env): ServerEnv {
  const parsed = serverEnvSchema.safeParse(env);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => {
        const path = issue.path.join(".") || "root";
        return `${path}: ${issue.message}`;
      })
      .join("; ");
    throw new Error(`Invalid server environment: ${details}`);
  }
  return parsed.data;
}

export function validateServerEnv(): void {
  // In production, enforce presence/format strictly
  const env = getServerEnv();

  if (process.env.NODE_ENV === "production") {
    if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('Invalid server environment: production requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
    }
    if (!env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Invalid server environment: production requires SUPABASE_SERVICE_ROLE_KEY');
    }
    if (!env.SUPABASE_JWT_SECRET) {
      throw new Error('Invalid server environment: production requires SUPABASE_JWT_SECRET');
    }
    if (!env.SUPABASE_PROJECT_REF) {
      throw new Error('Invalid server environment: production requires SUPABASE_PROJECT_REF');
    }
    if (!env.SUPABASE_DATABASE_PASSWORD) {
      throw new Error('Invalid server environment: production requires SUPABASE_DATABASE_PASSWORD');
    }

    if (env.RATE_LIMIT_PROVIDER === "redis") {
      if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
        throw new Error("Invalid server environment: RATE_LIMIT_PROVIDER=redis requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN");
      }
    }
  }
}
