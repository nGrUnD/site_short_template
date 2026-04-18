import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildInternalShortUrl, getProviderLabel } from "@/lib/shorteners";
import { formatDateTime } from "@/lib/utils";
import {
  deleteProviderAction,
  saveProviderAction,
} from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await requireAdminSession();
  const [proxyCount, landingCount, providerConfigs, recentLandingPages, clickStats] =
    await Promise.all([
      prisma.proxyConfig.count(),
      prisma.landingPage.count(),
      prisma.shortLinkProviderConfig.findMany({
        orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
      }),
      prisma.landingPage.findMany({
        include: {
          proxyConfig: true,
          providerConfig: true,
        },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
      prisma.clickEvent.groupBy({
        by: ["eventType"],
        _count: {
          eventType: true,
        },
      }),
    ]);

  const statMap = new Map(
    clickStats.map((stat) => [stat.eventType, stat._count.eventType]),
  );

  return (
    <AdminShell
      title="Дашборд"
      description="Базовый обзор: сколько прокси и лендингов уже создано, какие short-link провайдеры активны и как пользователи проходят шаги на публичных страницах."
      session={session}
    >
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Прокси", value: proxyCount },
            { label: "Лендинги", value: landingCount },
            { label: "Открытия proxy", value: statMap.get("OPEN_PROXY") ?? 0 },
            { label: "Переходы к боту", value: statMap.get("OPEN_TARGET") ?? 0 },
          ].map((item) => (
            <article
              key={item.label}
              className="rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-slate-200"
            >
              <p className="text-sm text-slate-500">{item.label}</p>
              <p className="mt-3 text-4xl font-semibold text-slate-950">
                {item.value}
              </p>
            </article>
          ))}
        </section>

        <section className="rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">
                Последние страницы
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Быстрый доступ к свежим slug-страницам и связанным прокси.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {recentLandingPages.length > 0 ? (
              recentLandingPages.map((page) => (
                <div
                  key={page.id}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-lg font-semibold text-slate-900">
                        {page.title}
                      </p>
                      <p className="text-sm text-slate-500">
                        /{page.slug} · {page.proxyConfig.label}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs">
                      <a
                        href={buildInternalShortUrl(page.slug)}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full bg-slate-950 px-3 py-1.5 font-medium text-white"
                      >
                        Открыть внутренний URL
                      </a>
                      {page.externalShortUrl ? (
                        <a
                          href={page.externalShortUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-full bg-sky-100 px-3 py-1.5 font-medium text-sky-700"
                        >
                          Внешний short URL
                        </a>
                      ) : null}
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-slate-400">
                    Обновлено {formatDateTime(page.updatedAt)}
                    {page.providerConfig
                      ? ` · provider: ${getProviderLabel(page.providerConfig.provider)}`
                      : ""}
                  </p>
                </div>
              ))
            ) : (
              <p className="rounded-3xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
                Пока нет ни одной публичной страницы. Создайте первую на вкладке
                `Страницы`.
              </p>
            )}
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="max-w-3xl">
          <h2 className="text-xl font-semibold text-slate-950">
            Short-link провайдеры
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Внутренний slug работает всегда. Внешние провайдеры можно подключать
            по API и выбирать в каждой публичной странице отдельно.
          </p>
        </div>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-lg font-semibold text-slate-950">
            Добавить новый провайдер
          </h3>
          <form action={saveProviderAction} className="mt-4 grid gap-4 md:grid-cols-2">
            <input type="hidden" name="id" value="" />

            <label className="space-y-2 text-sm text-slate-700">
              <span>Название</span>
              <input
                name="label"
                required
                placeholder="Основной Kutt"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-sky-400"
              />
            </label>

            <label className="space-y-2 text-sm text-slate-700">
              <span>Тип провайдера</span>
              <select
                name="provider"
                defaultValue="INTERNAL"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-sky-400"
              >
                <option value="INTERNAL">Internal slug</option>
                <option value="KUTT">Kutt</option>
                <option value="YOURLS">YOURLS</option>
              </select>
            </label>

            <label className="space-y-2 text-sm text-slate-700">
              <span>API URL</span>
              <input
                name="apiUrl"
                placeholder="https://kutt.example.com"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-sky-400"
              />
            </label>

            <label className="space-y-2 text-sm text-slate-700">
              <span>API key / signature</span>
              <input
                name="apiKey"
                placeholder="secret-token"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-sky-400"
              />
            </label>

            <label className="space-y-2 text-sm text-slate-700">
              <span>Custom domain</span>
              <input
                name="domain"
                placeholder="go.example.com"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-sky-400"
              />
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
              <input type="checkbox" name="isActive" defaultChecked />
              Активен
            </label>

            <button
              type="submit"
              className="md:col-span-2 rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-600"
            >
              Сохранить провайдер
            </button>
          </form>
        </div>

        <div className="mt-6 space-y-4">
          {providerConfigs.length > 0 ? (
            providerConfigs.map((provider) => (
              <article
                key={provider.id}
                className="rounded-3xl border border-slate-200 bg-white p-5"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <form action={saveProviderAction} className="grid flex-1 gap-4 md:grid-cols-2">
                    <input type="hidden" name="id" value={provider.id} />

                    <label className="space-y-2 text-sm text-slate-700">
                      <span>Название</span>
                      <input
                        name="label"
                        defaultValue={provider.label}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400"
                      />
                    </label>

                    <label className="space-y-2 text-sm text-slate-700">
                      <span>Тип</span>
                      <select
                        name="provider"
                        defaultValue={provider.provider}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400"
                      >
                        <option value="INTERNAL">Internal slug</option>
                        <option value="KUTT">Kutt</option>
                        <option value="YOURLS">YOURLS</option>
                      </select>
                    </label>

                    <label className="space-y-2 text-sm text-slate-700">
                      <span>API URL</span>
                      <input
                        name="apiUrl"
                        defaultValue={provider.apiUrl ?? ""}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400"
                      />
                    </label>

                    <label className="space-y-2 text-sm text-slate-700">
                      <span>API key / signature</span>
                      <input
                        name="apiKey"
                        defaultValue={provider.apiKey ?? ""}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400"
                      />
                    </label>

                    <label className="space-y-2 text-sm text-slate-700">
                      <span>Custom domain</span>
                      <input
                        name="domain"
                        defaultValue={provider.domain ?? ""}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400"
                      />
                    </label>

                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        name="isActive"
                        defaultChecked={provider.isActive}
                      />
                      Активен
                    </label>

                    <button
                      type="submit"
                      className="md:col-span-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Обновить провайдер
                    </button>
                  </form>

                  <form action={deleteProviderAction}>
                    <input type="hidden" name="id" value={provider.id} />
                    <button
                      type="submit"
                      className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                    >
                      Удалить
                    </button>
                  </form>
                </div>
              </article>
            ))
          ) : (
            <p className="rounded-3xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
              Пока нет внешних провайдеров. Внутренние ссылки уже работают даже
              без этой настройки.
            </p>
          )}
        </div>
      </section>
    </AdminShell>
  );
}
