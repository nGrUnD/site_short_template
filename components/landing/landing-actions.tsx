"use client";

import { useEffect, useMemo } from "react";

type LandingActionsProps = {
  slug: string;
  tgProxyUrl: string;
  fallbackProxyUrl: string;
  targetUrl: string;
  proxyButtonText: string;
  targetButtonText: string;
};

type EventType = "PAGE_VIEW" | "OPEN_PROXY" | "OPEN_TARGET" | "COPY_PROXY";

function buildTelegramTargetUrls(targetUrl: string) {
  if (targetUrl.startsWith("tg://")) {
    return {
      appUrl: targetUrl,
      webUrl: targetUrl,
    };
  }

  try {
    const parsed = new URL(targetUrl);
    const hostname = parsed.hostname.replace(/^www\./i, "").toLowerCase();

    if (hostname === "t.me" || hostname === "telegram.me") {
      const pathSegments = parsed.pathname.split("/").filter(Boolean);

      if (pathSegments.length === 1) {
        if (pathSegments[0].startsWith("+")) {
          return {
            appUrl: `tg://join?invite=${pathSegments[0].slice(1)}`,
            webUrl: targetUrl,
          };
        }

        return {
          appUrl: `tg://resolve?domain=${pathSegments[0]}`,
          webUrl: targetUrl,
        };
      }

      if (pathSegments.length === 2 && pathSegments[0] === "joinchat") {
        return {
          appUrl: `tg://join?invite=${pathSegments[1]}`,
          webUrl: targetUrl,
        };
      }
    }
  } catch {
    return {
      appUrl: targetUrl,
      webUrl: targetUrl,
    };
  }

  return {
    appUrl: targetUrl,
    webUrl: targetUrl,
  };
}

async function trackEvent(slug: string, eventType: EventType) {
  const payload = JSON.stringify({ slug, eventType });

  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/events", new Blob([payload], { type: "application/json" }));
    return;
  }

  await fetch("/api/events", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: payload,
    keepalive: true,
  });
}

export function LandingActions({
  slug,
  tgProxyUrl,
  fallbackProxyUrl,
  targetUrl,
  proxyButtonText,
  targetButtonText,
}: LandingActionsProps) {
  const hasTarget = useMemo(() => Boolean(targetUrl), [targetUrl]);
  const targetUrls = useMemo(() => buildTelegramTargetUrls(targetUrl), [targetUrl]);

  useEffect(() => {
    void trackEvent(slug, "PAGE_VIEW");
  }, [slug]);

  function handleOpenProxy() {
    void trackEvent(slug, "OPEN_PROXY");
    window.location.href = tgProxyUrl;
    window.setTimeout(() => {
      window.location.href = fallbackProxyUrl;
    }, 900);
  }

  function handleOpenTarget() {
    void trackEvent(slug, "OPEN_TARGET");
    window.location.href = targetUrls.appUrl;
    window.setTimeout(() => {
      window.location.href = targetUrls.webUrl;
    }, 900);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-sky-100 bg-sky-50 p-6 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-500">
          Шаг 1
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-slate-900">
          Подключите прокси
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Нажмите кнопку ниже, чтобы быстро подключить прокси для Telegram.
        </p>

        <button
          type="button"
          onClick={handleOpenProxy}
          className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-emerald-500 px-6 py-4 text-lg font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-600"
        >
          {proxyButtonText}
        </button>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500">
          <span>1 клик</span>
          <span>Бесплатно</span>
          <span>Безопасно</span>
        </div>
      </section>

      <section className="rounded-[28px] border border-sky-100 bg-sky-50 p-6 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-500">
          Шаг 2
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-slate-900">
          Открывай бота и подключайся к VPN!
        </h2>

        {hasTarget ? (
          <button
            type="button"
            onClick={handleOpenTarget}
            className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-sky-500 px-6 py-4 text-lg font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-600"
          >
            {targetButtonText}
          </button>
        ) : (
          <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Целевой канал или бот ещё не настроен.
          </p>
        )}
      </section>
    </div>
  );
}
