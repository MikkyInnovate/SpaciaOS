import { z } from "zod";

/**
 * Client-safe environment schema.
 * All variables MUST be prefixed with NEXT_PUBLIC_.
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_NAME: z.string().default("Spacia"),
  NEXT_PUBLIC_API_BASE_URL: z.string().default("http://localhost:3000/api"),
  NEXT_PUBLIC_DEFAULT_WORKSPACE_ID: z.string().default("ws_default_spacia"),
});

/**
 * Server-only environment schema.
 * Secrets that MUST NEVER be bundled into client-side code.
 */
const serverEnvSchema = clientEnvSchema.extend({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  BACKEND_API_URL: z.string().url().optional(),
  BACKEND_API_KEY: z.string().min(1).optional(),
  WEBHOOK_SIGNING_SECRET: z.string().min(1).optional(),
});

const isServer = typeof window === "undefined";

function parseEnv() {
  if (isServer) {
    const parsed = serverEnvSchema.safeParse(process.env);
    if (!parsed.success) {
      console.warn("Invalid server environment configuration:", parsed.error.format());
      // In production or development fallback to sensible defaults
    }
    return (parsed.success ? parsed.data : serverEnvSchema.parse({})) as z.infer<typeof serverEnvSchema>;
  }

  // Client environment access
  const clientData = {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_DEFAULT_WORKSPACE_ID: process.env.NEXT_PUBLIC_DEFAULT_WORKSPACE_ID,
  };

  const parsed = clientEnvSchema.safeParse(clientData);
  if (!parsed.success) {
    console.warn("Invalid client environment configuration:", parsed.error.format());
  }
  return (parsed.success ? parsed.data : clientEnvSchema.parse({})) as z.infer<typeof clientEnvSchema>;
}

export const env = parseEnv();
