/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  readonly VITE_GEMINI_API_KEY: string;
  readonly VITE_API_URL: string;
  readonly VITE_ENABLE_ANALYTICS: string;
  readonly VITE_ENABLE_CLOUD_SYNC: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

