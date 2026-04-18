import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildInternalShortUrl, generateExternalShortUrl } from "@/lib/shorteners";

const requestSchema = z.object({
  providerConfigId: z.string().min(1),
  slug: z.string().min(1),
  targetUrl: z.string().url().optional(),
});

export async function POST(request: Request) {
  await requireAdminSession();

  try {
    const body = requestSchema.parse(await request.json());
    const provider = await prisma.shortLinkProviderConfig.findUnique({
      where: { id: body.providerConfigId },
    });

    if (!provider) {
      return NextResponse.json(
        { error: "Provider config not found." },
        { status: 404 },
      );
    }

    const internalUrl = body.targetUrl ?? buildInternalShortUrl(body.slug);
    const shortUrl = await generateExternalShortUrl(
      provider,
      internalUrl,
      body.slug,
    );

    return NextResponse.json({
      ok: true,
      shortUrl,
      internalUrl,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate short link.",
      },
      { status: 400 },
    );
  }
}
