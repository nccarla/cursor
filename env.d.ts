interface ImportMetaEnv {
  readonly VITE_WEBHOOK_URL?: string;
  readonly VITE_CASES_WEBHOOK_URL?: string;
  readonly VITE_WEBHOOK_AGENTES_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

