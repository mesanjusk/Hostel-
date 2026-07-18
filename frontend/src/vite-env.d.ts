/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // MSG91 "Login with OTP" widget — PUBLIC values (safe in the frontend bundle), used by
  // lib/msg91.ts. Same widget/account as the WhatsLocal project. When unset, OTP login shows
  // a "not configured" message.
  readonly VITE_MSG91_WIDGET_ID?: string;
  readonly VITE_MSG91_TOKEN_AUTH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Injected by vite.config.ts's `define` at build time — see readAppVersion() there.
declare const __APP_VERSION__: string;
