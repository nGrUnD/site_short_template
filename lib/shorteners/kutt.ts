import type { ShortLinkProviderConfig } from "@prisma/client";

function buildKuttEndpoint(apiUrl: string) {
  return new URL("/api/v2/links", apiUrl).toString();
}

export async function createKuttShortLink(
  provider: ShortLinkProviderConfig,
  targetUrl: string,
  slug?: string,
) {
  if (!provider.apiUrl || !provider.apiKey) {
    throw new Error("Kutt provider is missing apiUrl or apiKey.");
  }

  const response = await fetch(buildKuttEndpoint(provider.apiUrl), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": provider.apiKey,
    },
    body: JSON.stringify({
      target: targetUrl,
      customurl: slug,
      domain: provider.domain || undefined,
      reuse: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Kutt request failed with status ${response.status}.`);
  }

  const data = (await response.json()) as {
    link?: string;
    shortLink?: string;
    address?: string;
  };

  return data.link ?? data.shortLink ?? data.address ?? "";
}
