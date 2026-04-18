import { NextRequest, NextResponse } from "next/server";
import { createAdminSession, isAllowedTelegramAdmin } from "@/lib/auth";
import { appConfig, requireEnvValue } from "@/lib/env";
import {
  parseTelegramAuthPayload,
  verifyTelegramAuthPayload,
} from "@/lib/telegram";

async function handleTelegramAuth(
  request: NextRequest,
  payloadSource: Record<string, unknown>,
  shouldRedirect: boolean,
) {
  try {
    const botToken = requireEnvValue(
      appConfig.telegramBotToken,
      "TELEGRAM_BOT_TOKEN",
    );
    const payload = parseTelegramAuthPayload(payloadSource);

    if (!verifyTelegramAuthPayload(payload, botToken)) {
      throw new Error("Invalid Telegram auth payload.");
    }

    if (!isAllowedTelegramAdmin(payload.id)) {
      throw new Error("Telegram user is not in the admin allowlist.");
    }

    await createAdminSession(payload);

    if (shouldRedirect) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (shouldRedirect) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set(
        "error",
        error instanceof Error ? error.message : "Telegram login failed.",
      );
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Telegram login failed.",
      },
      { status: 400 },
    );
  }
}

export async function GET(request: NextRequest) {
  const payload = Object.fromEntries(request.nextUrl.searchParams.entries());
  return handleTelegramAuth(request, payload, true);
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const payload = (await request.json()) as Record<string, unknown>;
    return handleTelegramAuth(request, payload, false);
  }

  const formData = await request.formData();
  return handleTelegramAuth(request, Object.fromEntries(formData.entries()), false);
}
