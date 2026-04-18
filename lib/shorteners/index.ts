import type { ShortLinkProvider, ShortLinkProviderConfig } from "@prisma/client";
import { absoluteUrl } from "@/lib/utils";
import { createKuttShortLink } from "@/lib/shorteners/kutt";
import { createYourlsShortLink } from "@/lib/shorteners/yourls";

export function buildInternalShortUrl(slug: string) {
  return absoluteUrl(`/${slug}`);
}

export function getProviderLabel(provider: ShortLinkProvider) {
  switch (provider) {
    case "INTERNAL":
      return "Внутренний slug";
    case "KUTT":
      return "Kutt";
    case "YOURLS":
      return "YOURLS";
    default:
      return provider;
  }
}

export async function generateExternalShortUrl(
  provider: ShortLinkProviderConfig,
  targetUrl: string,
  slug?: string,
) {
  switch (provider.provider) {
    case "INTERNAL":
      return targetUrl;
    case "KUTT":
      return createKuttShortLink(provider, targetUrl, slug);
    case "YOURLS":
      return createYourlsShortLink(provider, targetUrl, slug);
    default:
      return "";
  }
}
