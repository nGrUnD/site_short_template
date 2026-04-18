import { ClickEventType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashValue } from "@/lib/utils";

const eventSchema = z.object({
  slug: z.string().min(1),
  eventType: z.nativeEnum(ClickEventType),
});

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (!forwardedFor) {
    return "";
  }

  return forwardedFor.split(",")[0]?.trim() ?? "";
}

export async function POST(request: NextRequest) {
  try {
    const body = eventSchema.parse(await request.json());
    const landingPage = await prisma.landingPage.findUnique({
      where: { slug: body.slug },
      select: { id: true },
    });

    await prisma.clickEvent.create({
      data: {
        slug: body.slug,
        eventType: body.eventType,
        landingPageId: landingPage?.id,
        userAgent: request.headers.get("user-agent"),
        referrer: request.headers.get("referer"),
        ipHash: hashValue(getClientIp(request)),
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
