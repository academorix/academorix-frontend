import { z } from "zod";

/**
 * Schema for the browser-exposed (`VITE_*`) environment.
 * Every value has a safe local default so the app boots even without an
 * env file; malformed values still fail fast at startup.
 */
const envSchema = z.object({
  VITE_APP_NAME: z.string().min(1).default("Academorix"),
  VITE_APP_ENV: z.enum(["local", "staging", "production"]).default("local"),
  VITE_API_URL: z.url().default("http://localhost:8000"),
  VITE_REVERB_APP_KEY: z.string().min(1).default("academorix-local-key"),
  VITE_REVERB_HOST: z.string().min(1).default("localhost"),
  VITE_REVERB_PORT: z.coerce.number().int().positive().default(8080),
  VITE_REVERB_SCHEME: z.enum(["http", "https"]).default("http"),
});

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(import.meta.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error(
    "Invalid frontend environment variables:\n",
    z.prettifyError(parsed.error),
  );

  throw new Error(
    "Invalid environment variables. Check apps/web/environments/.env",
  );
}

export const env: Env = parsed.data;
