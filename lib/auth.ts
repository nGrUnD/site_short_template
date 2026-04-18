import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { appConfig, getAdminTelegramIds, requireEnvValue } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import type { TelegramAuthPayload } from "@/lib/telegram";

const SESSION_COOKIE_NAME = "tg_admin_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

type SessionClaims = {
  sid: string;
  telegramId: string;
  username?: string;
  displayName: string;
};

export type AdminSessionView = {
  id: string;
  telegramId: string;
  username: string | null;
  displayName: string;
  photoUrl: string | null;
  expiresAt: Date;
};

function getSessionSecret() {
  const secret = requireEnvValue(appConfig.sessionSecret, "SESSION_SECRET");

  if (secret.length < 32) {
    throw new Error("SESSION_SECRET must be at least 32 characters long.");
  }

  return new TextEncoder().encode(secret);
}

export function isAllowedTelegramAdmin(telegramId: string | number | bigint) {
  const allowlist = getAdminTelegramIds();
  return allowlist.includes(String(telegramId));
}

async function signSessionToken(claims: SessionClaims) {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSessionSecret());
}

async function verifySessionToken(token: string) {
  const { payload } = await jwtVerify(token, getSessionSecret());
  return payload as unknown as SessionClaims;
}

export async function createAdminSession(payload: TelegramAuthPayload) {
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  const displayName =
    [payload.first_name, payload.last_name].filter(Boolean).join(" ").trim() ||
    payload.username ||
    payload.id;

  const session = await prisma.adminSession.create({
    data: {
      telegramId: BigInt(payload.id),
      username: payload.username ?? null,
      displayName,
      photoUrl: payload.photo_url ?? null,
      expiresAt,
    },
  });

  const token = await signSessionToken({
    sid: session.id,
    telegramId: payload.id,
    username: payload.username,
    displayName,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return session;
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    try {
      const claims = await verifySessionToken(token);
      await prisma.adminSession.deleteMany({
        where: {
          id: claims.sid,
        },
      });
    } catch {
      // Ignore malformed or expired cookies on logout.
    }
  }

  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });
}

export async function getAdminSession(): Promise<AdminSessionView | null> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const claims = await verifySessionToken(token);
    const session = await prisma.adminSession.findUnique({
      where: {
        id: claims.sid,
      },
    });

    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    return {
      id: session.id,
      telegramId: session.telegramId.toString(),
      username: session.username,
      displayName: session.displayName,
      photoUrl: session.photoUrl,
      expiresAt: session.expiresAt,
    };
  } catch {
    return null;
  }
}

export async function requireAdminSession() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  return session;
}
