const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

export const appConfig = {
  appUrl: trimTrailingSlash(process.env.APP_URL ?? "http://localhost:3000"),
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN ?? "",
  telegramBotUsername: process.env.TELEGRAM_BOT_USERNAME ?? "",
  sessionSecret: process.env.SESSION_SECRET ?? "",
};

export function getAdminTelegramIds() {
  return (process.env.ADMIN_TELEGRAM_IDS ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function isAdminAllowlistConfigured() {
  return getAdminTelegramIds().length > 0;
}

export function requireEnvValue(
  value: string | undefined,
  variableName: string,
) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${variableName}`);
  }

  return value;
}
