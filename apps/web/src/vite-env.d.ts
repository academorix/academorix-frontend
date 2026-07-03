/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_ENV: "local" | "staging" | "production";
  readonly VITE_API_URL: string;
  /** `"true"` → JSON-file mock backend · `"false"` → real REST API. */
  readonly VITE_API_MOCK: "true" | "false";
  readonly VITE_REVERB_APP_KEY: string;
  readonly VITE_REVERB_HOST: string;
  readonly VITE_REVERB_PORT: string;
  readonly VITE_REVERB_SCHEME: "http" | "https";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
