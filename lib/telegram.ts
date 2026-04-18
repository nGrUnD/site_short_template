import { createHash, createHmac } from "node:crypto";
import { z } from "zod";

const telegramAuthSchema = z.object({
  id: z.union([z.string(), z.number()]).transform((value) => String(value)),
  first_name: z.string(),
  last_name: z.string().optional(),
  username: z.string().optional(),
  photo_url: z.string().optional(),
  auth_date: z
    .union([z.string(), z.number()])
    .transform((value) => Number(value)),
  hash: z.string(),
});

export type TelegramAuthPayload = z.infer<typeof telegramAuthSchema>;

export function parseTelegramAuthPayload(input: Record<string, unknown>) {
  return telegramAuthSchema.parse(input);
}

export function getTelegramDisplayName(payload: TelegramAuthPayload) {
  return [payload.first_name, payload.last_name].filter(Boolean).join(" ").trim();
}

export function verifyTelegramAuthPayload(
  payload: TelegramAuthPayload,
  botToken: string,
  maxAgeSeconds = 60 * 60 * 24,
) {
  const authAgeSeconds = Math.floor(Date.now() / 1000) - payload.auth_date;

  if (authAgeSeconds > maxAgeSeconds) {
    return false;
  }

  const dataCheckString = Object.entries(payload)
    .filter(([key]) => key !== "hash")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value ?? ""}`)
    .join("\n");

  const secret = createHash("sha256").update(botToken).digest();
  const calculatedHash = createHmac("sha256", secret)
    .update(dataCheckString)
    .digest("hex");

  return calculatedHash === payload.hash;
}

export function createProxyUrls(config: {
  server: string;
  port: number;
  secret: string;
}) {
  const params = new URLSearchParams({
    server: config.server,
    port: String(config.port),
    secret: config.secret,
  });

  return {
    tg: `tg://proxy?${params.toString()}`,
    https: `https://t.me/proxy?${params.toString()}`,
    raw: `tg://proxy?server=${config.server}&port=${config.port}&secret=${config.secret}`,
  };
}
