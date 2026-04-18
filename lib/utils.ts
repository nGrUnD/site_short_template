import { randomBytes, createHash } from "node:crypto";
import { clsx, type ClassValue } from "clsx";
import { appConfig } from "@/lib/env";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function absoluteUrl(pathname: string) {
  if (/^https?:\/\//i.test(pathname)) {
    return pathname;
  }

  return new URL(pathname, `${appConfig.appUrl}/`).toString();
}

export function normalizeTargetUrl(input: string) {
  const trimmed = input.trim();

  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("tg://")) {
    return trimmed;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/^http:\/\//i, "https://");
  }

  if (/^(t\.me|telegram\.me)\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }

  if (trimmed.startsWith("@")) {
    return `https://t.me/${trimmed.slice(1)}`;
  }

  return `https://t.me/${trimmed.replace(/^\/+/, "")}`;
}

export function normalizeSlug(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function generateShortSlug(seed: string) {
  const normalized = normalizeSlug(seed);
  const suffix = randomBytes(3).toString("hex");

  if (!normalized) {
    return suffix;
  }

  const base = normalized.slice(0, 18);
  return `${base}-${suffix}`;
}

export function maskSecret(secret: string) {
  if (secret.length <= 8) {
    return "********";
  }

  return `${secret.slice(0, 4)}...${secret.slice(-4)}`;
}

export function hashValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}
