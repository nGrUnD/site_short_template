import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingActions } from "@/components/landing/landing-actions";
import { prisma } from "@/lib/prisma";
import { createProxyUrls } from "@/lib/telegram";

export const dynamic = "force-dynamic";

type LandingPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

async function getLandingPage(slug: string) {
  return prisma.landingPage.findUnique({
    where: { slug },
    include: {
      proxyConfig: true,
    },
  });
}

export async function generateMetadata({
  params,
}: LandingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const landingPage = await getLandingPage(slug);

  if (!landingPage || !landingPage.isActive) {
    return {
      title: "Страница не найдена",
    };
  }

  return {
    title: landingPage.title,
    description:
      landingPage.description ??
      "Подключите proxy для Telegram и откройте целевой канал или бота.",
  };
}

export default async function LandingPage({ params }: LandingPageProps) {
  const { slug } = await params;
  const landingPage = await getLandingPage(slug);

  if (!landingPage || !landingPage.isActive || !landingPage.proxyConfig.isActive) {
    notFound();
  }

  const proxyUrls = createProxyUrls({
    server: landingPage.proxyConfig.server,
    port: landingPage.proxyConfig.port,
    secret: landingPage.proxyConfig.secret,
  });

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-5">
        <section className="rounded-[36px] bg-white p-6 shadow-lg shadow-slate-200/70">
          <div className="flex items-center gap-4 rounded-[28px] bg-slate-50 p-4">
            {landingPage.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={landingPage.avatarUrl}
                alt={landingPage.title}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-950 text-xl font-semibold text-white">
                {landingPage.title.slice(0, 1).toUpperCase()}
              </div>
            )}

            <div>
              <h1 className="text-2xl font-semibold text-slate-950">
                {landingPage.title}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {landingPage.description ??
                  "Подключите proxy, затем откройте бота или канал в Telegram."}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[36px] border border-rose-200 bg-rose-50 p-6 text-center shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-rose-500">
            Важно
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-rose-700">
            {landingPage.warningTitle ?? "Telegram сейчас может работать медленно"}
          </h2>
          <p className="mt-2 text-sm text-rose-600">
            {landingPage.warningText ??
              "Без прокси бот или канал могут открываться нестабильно."}
          </p>
        </section>

        <LandingActions
          slug={landingPage.slug}
          tgProxyUrl={proxyUrls.tg}
          fallbackProxyUrl={proxyUrls.https}
          rawProxyUrl={proxyUrls.raw}
          targetUrl={landingPage.targetUrl}
          proxyButtonText={landingPage.proxyButtonText}
          targetButtonText={landingPage.targetButtonText}
        />
      </div>
    </div>
  );
}
