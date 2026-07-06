import { env } from "@/config/env";

export const siteConfig = {
  name: env.VITE_APP_NAME,
  environment: env.VITE_APP_ENV,
  description: "The operating system for modern academies.",
  api: {
    baseUrl: env.VITE_API_URL,
  },
  realtime: {
    appKey: env.VITE_REVERB_APP_KEY,
    host: env.VITE_REVERB_HOST,
    port: env.VITE_REVERB_PORT,
    scheme: env.VITE_REVERB_SCHEME,
  },
  links: {
    github: "https://github.com/academorix",
    /** Public marketing site (apps/landing-page). Used by outbound CTAs. */
    marketing: env.VITE_MARKETING_URL,
    /** Deep-link into the marketing pricing catalog. */
    marketingPricing: `${env.VITE_MARKETING_URL}/pricing`,
  },
} as const;
