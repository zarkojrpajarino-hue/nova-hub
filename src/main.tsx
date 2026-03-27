import * as Sentry from "@sentry/react";
import posthog from "posthog-js";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";

// Global fallback: prevent "t is not defined" crashes from module-level t() calls
// This is a safety net — the real fix is to not use t() at module level.
// When a file evaluates t('key') before React renders, this returns the key as-is.
if (typeof window !== 'undefined' && !(window as unknown as Record<string, unknown>).t) {
  (window as unknown as Record<string, unknown>).t = (key: string) => key;
}

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  enabled: import.meta.env.PROD,
  environment: import.meta.env.MODE,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
  ],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.05,
  replaysOnErrorSampleRate: 1.0,
});

// PostHog: no-op si VITE_POSTHOG_KEY no está definido.
if (import.meta.env.VITE_POSTHOG_KEY) {
  posthog.init(import.meta.env.VITE_POSTHOG_KEY as string, {
    api_host: "https://eu.i.posthog.com",
    capture_pageview: false,
  });
}

createRoot(document.getElementById("root")!).render(<App />);
