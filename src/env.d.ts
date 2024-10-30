interface ImportMetaEnv {
  readonly VITE_EMAILJS_SERVICE_ID: string;
  readonly VITE_EMAILJS_TEMPLATE_ID: string;
  readonly VITE_EMAILJS_PUBLIC_KEY: string;
  readonly VITE_RECIPIENT_NAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
