"use server";

import { ShortLinkProvider } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  buildInternalShortUrl,
  generateExternalShortUrl,
} from "@/lib/shorteners";
import {
  generateShortSlug,
  normalizeSlug,
  normalizeTargetUrl,
} from "@/lib/utils";

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getOptionalString(formData: FormData, key: string) {
  const value = getString(formData, key);
  return value || null;
}

function isChecked(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

async function ensureUniqueSlug(rawSlug: string, excludeId?: string) {
  const normalized = normalizeSlug(rawSlug) || generateShortSlug(rawSlug);
  let candidate = normalized;
  let suffix = 1;

  while (true) {
    const existing = await prisma.landingPage.findFirst({
      where: {
        slug: candidate,
        ...(excludeId
          ? {
              NOT: {
                id: excludeId,
              },
            }
          : {}),
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      return candidate;
    }

    candidate = `${normalized}-${suffix}`;
    suffix += 1;
  }
}

export async function saveProxyAction(formData: FormData) {
  await requireAdminSession();

  const id = getOptionalString(formData, "id");
  const label = getString(formData, "label");
  const server = getString(formData, "server");
  const port = Number(getString(formData, "port"));
  const secret = getString(formData, "secret");
  const notes = getOptionalString(formData, "notes");
  const isActive = isChecked(formData, "isActive");

  if (!label || !server || !secret || !Number.isInteger(port)) {
    throw new Error("Заполните label, server, port и secret.");
  }

  const data = {
    label,
    server,
    port,
    secret,
    notes,
    isActive,
  };

  if (id) {
    await prisma.proxyConfig.update({
      where: { id },
      data,
    });
  } else {
    await prisma.proxyConfig.create({
      data,
    });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/proxies");
  revalidatePath("/admin/pages");
}

export async function deleteProxyAction(formData: FormData) {
  await requireAdminSession();

  const id = getString(formData, "id");

  if (!id) {
    throw new Error("Proxy id is required.");
  }

  await prisma.proxyConfig.delete({
    where: { id },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/proxies");
  revalidatePath("/admin/pages");
}

export async function saveProviderAction(formData: FormData) {
  await requireAdminSession();

  const id = getOptionalString(formData, "id");
  const label = getString(formData, "label");
  const provider = getString(formData, "provider") as ShortLinkProvider;
  const apiUrl = getOptionalString(formData, "apiUrl");
  const apiKey = getOptionalString(formData, "apiKey");
  const domain = getOptionalString(formData, "domain");
  const isActive = isChecked(formData, "isActive");

  if (!label || !Object.values(ShortLinkProvider).includes(provider)) {
    throw new Error("Provider label and type are required.");
  }

  const data = {
    label,
    provider,
    apiUrl,
    apiKey,
    domain,
    isActive,
  };

  if (id) {
    await prisma.shortLinkProviderConfig.update({
      where: { id },
      data,
    });
  } else {
    await prisma.shortLinkProviderConfig.create({
      data,
    });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/pages");
}

export async function deleteProviderAction(formData: FormData) {
  await requireAdminSession();

  const id = getString(formData, "id");

  if (!id) {
    throw new Error("Provider id is required.");
  }

  await prisma.shortLinkProviderConfig.delete({
    where: { id },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/pages");
}

export async function saveLandingPageAction(formData: FormData) {
  await requireAdminSession();

  const id = getOptionalString(formData, "id");
  const title = getString(formData, "title");
  const rawSlug = getString(formData, "slug") || title;
  const description = getOptionalString(formData, "description");
  const avatarUrl = getOptionalString(formData, "avatarUrl");
  const warningTitle = getOptionalString(formData, "warningTitle");
  const warningText = getOptionalString(formData, "warningText");
  const proxyButtonText =
    getOptionalString(formData, "proxyButtonText") ?? "Ускорить Telegram";
  const targetButtonText =
    getOptionalString(formData, "targetButtonText") ?? "Открыть в Telegram";
  const targetUrl = normalizeTargetUrl(getString(formData, "targetUrl"));
  const proxyConfigId = getString(formData, "proxyConfigId");
  const providerConfigId = getOptionalString(formData, "providerConfigId");
  const isActive = isChecked(formData, "isActive");
  const shouldGenerateExternal = isChecked(formData, "generateExternalShortUrl");

  if (!title || !targetUrl || !proxyConfigId) {
    throw new Error("Нужны title, targetUrl и выбранный proxy.");
  }

  const slug = await ensureUniqueSlug(rawSlug, id ?? undefined);
  let externalShortUrl = getOptionalString(formData, "externalShortUrl");

  if (providerConfigId && shouldGenerateExternal) {
    const provider = await prisma.shortLinkProviderConfig.findUnique({
      where: { id: providerConfigId },
    });

    if (provider?.isActive) {
      try {
        externalShortUrl = await generateExternalShortUrl(
          provider,
          buildInternalShortUrl(slug),
          slug,
        );
      } catch {
        externalShortUrl = null;
      }
    }
  }

  const data = {
    slug,
    title,
    description,
    avatarUrl,
    warningTitle,
    warningText,
    proxyButtonText,
    targetButtonText,
    targetUrl,
    proxyConfigId,
    providerConfigId,
    externalShortUrl,
    isActive,
  };

  if (id) {
    await prisma.landingPage.update({
      where: { id },
      data,
    });
  } else {
    await prisma.landingPage.create({
      data,
    });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/pages");
  revalidatePath(`/${slug}`);
}

export async function deleteLandingPageAction(formData: FormData) {
  await requireAdminSession();

  const id = getString(formData, "id");

  if (!id) {
    throw new Error("Landing page id is required.");
  }

  await prisma.landingPage.delete({
    where: { id },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/pages");
}
