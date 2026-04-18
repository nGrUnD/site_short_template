"use client";

import { useEffect, useMemo, useState } from "react";

type LandingActionsProps = {
  slug: string;
  tgProxyUrl: string;
  fallbackProxyUrl: string;
  rawProxyUrl: string;
  targetUrl: string;
  proxyButtonText: string;
  targetButtonText: string;
};

type EventType = "PAGE_VIEW" | "OPEN_PROXY" | "OPEN_TARGET" | "COPY_PROXY";

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
  rawProxyUrl,
  targetUrl,
  proxyButtonText,
  targetButtonText,
}: LandingActionsProps) {
  const [copyState, setCopyState] = useState<"idle" | "done" | "error">("idle");

  const hasTarget = useMemo(() => Boolean(targetUrl), [targetUrl]);

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
    window.location.href = targetUrl;
  }

  async function handleCopyProxy() {
    try {
      await navigator.clipboard.writeText(rawProxyUrl);
      setCopyState("done");
      void trackEvent(slug, "COPY_PROXY");
    } catch {
      setCopyState("error");
    }
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

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleCopyProxy}
            className="inline-flex flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Скопировать proxy ссылку
          </button>

          <a
            href={fallbackProxyUrl}
            className="inline-flex flex-1 items-center justify-center rounded-2xl border border-sky-200 bg-sky-50 px-5 py-3 text-sm font-medium text-sky-700 transition hover:bg-sky-100"
          >
            Открыть fallback ссылку
          </a>
        </div>

        <p className="mt-4 break-all rounded-2xl bg-slate-950 px-4 py-3 text-xs text-slate-100">
          {rawProxyUrl}
        </p>

        <p className="mt-3 text-xs text-slate-500">
          {copyState === "done"
            ? "Прокси-ссылка скопирована."
            : copyState === "error"
              ? "Не удалось скопировать автоматически, используйте строку выше."
              : "Если Telegram не открылся сам, используйте fallback или вставьте строку вручную в настройках прокси."}
        </p>
      </section>

      <section className="rounded-[28px] border border-sky-100 bg-sky-50 p-6 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-500">
          Шаг 2
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-slate-900">
          Откройте канал или бота
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          После добавления прокси можно перейти к вашему целевому Telegram-ресурсу.
        </p>

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
