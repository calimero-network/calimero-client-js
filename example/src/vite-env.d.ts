/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CALIMERO_CLIENT_APP_ID: string;
  readonly VITE_CALIMERO_APP_PATH: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
