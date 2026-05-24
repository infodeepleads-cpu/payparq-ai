import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://57690d9f5aa2c9cf91e53bab30ed5d15@o4511225818120192.ingest.de.sentry.io/4511443844071504",
  environment: process.env.NODE_ENV ?? "production",
  tracesSampleRate: 0.2,
});
