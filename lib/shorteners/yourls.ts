import type { ShortLinkProviderConfig } from "@prisma/client";

export async function createYourlsShortLink(
  provider: ShortLinkProviderConfig,
  targetUrl: string,
  slug?: string,
) {
  if (!provider.apiUrl || !provider.apiKey) {
    throw new Error("YOURLS provider is missing apiUrl or apiKey.");
  }

  const formData = new URLSearchParams({
    signature: provider.apiKey,
    action: "shorturl",
    format: "json",
    url: targetUrl,
  });

  if (slug) {
    formData.set("keyword", slug);
  }

  const response = await fetch(provider.apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData.toString(),
  });

  if (!response.ok) {
    throw new Error(`YOURLS request failed with status ${response.status}.`);
  }

  const data = (await response.json()) as {
    shorturl?: string;
    shortUrl?: string;
  };

  return data.shorturl ?? data.shortUrl ?? "";
}
