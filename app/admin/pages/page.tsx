import { AdminShell } from "@/components/admin/admin-shell";
import { UploadField } from "@/components/admin/upload-field";
import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildInternalShortUrl, getProviderLabel } from "@/lib/shorteners";
import { formatDateTime } from "@/lib/utils";
import {
  deleteLandingPageAction,
  saveLandingPageAction,
} from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export default async function AdminPagesPage() {
  const session = await requireAdminSession();
  const [proxies, providers, landingPages] = await Promise.all([
    prisma.proxyConfig.findMany({
      where: { isActive: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.shortLinkProviderConfig.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.landingPage.findMany({
      include: {
        proxyConfig: true,
        providerConfig: true,
        _count: {
          select: {
            clickEvents: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return (
    <AdminShell
      title="Страницы"
      description="Генерация коротких slug-страниц под конкретный канал или бота, с отдельным proxy-конфигом, CTA-текстами и внешним short-link при необходимости."
      session={session}
    >
      <div className="space-y-6">
        <section className="rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-semibold text-slate-950">
            Создать новую страницу
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Под каждую кампанию или Telegram-бота лучше делать отдельный slug, чтобы
            видеть аналитику по просмотрам и кликам отдельно.
          </p>

          {proxies.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
              Сначала создайте хотя бы один прокси на вкладке `Прокси`.
            </div>
          ) : (
            <form action={saveLandingPageAction} className="mt-6 grid gap-4 lg:grid-cols-2">
              <input type="hidden" name="id" value="" />

              <label className="space-y-2 text-sm text-slate-700">
                <span>Название страницы</span>
                <input
                  name="title"
                  required
                  placeholder="Tuz_kazirniy"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400"
                />
              </label>

              <label className="space-y-2 text-sm text-slate-700">
                <span>Slug</span>
                <input
                  name="slug"
                  placeholder="tuz-kazirniy"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400"
                />
              </label>

              <label className="space-y-2 text-sm text-slate-700 lg:col-span-2">
                <span>Описание</span>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Краткий текст для превью над шагами."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400"
                />
              </label>

              <div className="lg:col-span-2">
                <UploadField name="avatarUrl" label="Аватарка" />
              </div>

              <label className="space-y-2 text-sm text-slate-700">
                <span>Заголовок предупреждения</span>
                <input
                  name="warningTitle"
                  defaultValue="TELEGRAM СЕЙЧАС ЗАМЕДЛЯЮТ"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400"
                />
              </label>

              <label className="space-y-2 text-sm text-slate-700">
                <span>Текст предупреждения</span>
                <input
                  name="warningText"
                  defaultValue="Без прокси бот может не открыться."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400"
                />
              </label>

              <label className="space-y-2 text-sm text-slate-700">
                <span>Текст кнопки proxy</span>
                <input
                  name="proxyButtonText"
                  defaultValue="Ускорить Telegram"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400"
                />
              </label>

              <label className="space-y-2 text-sm text-slate-700">
                <span>Текст кнопки шага 2</span>
                <input
                  name="targetButtonText"
                  defaultValue="Открыть в Telegram"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400"
                />
              </label>

              <label className="space-y-2 text-sm text-slate-700">
                <span>Канал / бот</span>
                <input
                  name="targetUrl"
                  required
                  placeholder="@username или https://t.me/..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400"
                />
              </label>

              <label className="space-y-2 text-sm text-slate-700">
                <span>Proxy config</span>
                <select
                  name="proxyConfigId"
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400"
                >
                  {proxies.map((proxy) => (
                    <option key={proxy.id} value={proxy.id}>
                      {proxy.label} · {proxy.server}:{proxy.port}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 text-sm text-slate-700">
                <span>Внешний short-link провайдер</span>
                <select
                  name="providerConfigId"
                  defaultValue=""
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400"
                >
                  <option value="">Только внутренний slug</option>
                  {providers.map((provider) => (
                    <option key={provider.id} value={provider.id}>
                      {provider.label} · {getProviderLabel(provider.provider)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 text-sm text-slate-700">
                <span>Внешний short URL</span>
                <input
                  name="externalShortUrl"
                  placeholder="Оставьте пустым или сгенерируйте автоматически"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400"
                />
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <input type="checkbox" name="generateExternalShortUrl" />
                Сгенерировать внешний short URL при сохранении
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <input type="checkbox" name="isActive" defaultChecked />
                Страница активна
              </label>

              <button
                type="submit"
                className="lg:col-span-2 rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-600"
              >
                Создать страницу
              </button>
            </form>
          )}
        </section>

        <section className="space-y-4">
          {landingPages.length > 0 ? (
            landingPages.map((page) => (
              <article
                key={page.id}
                className="rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-slate-200"
              >
                <div className="mb-5 flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                    /{page.slug}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      page.isActive
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {page.isActive ? "Активна" : "Выключена"}
                  </span>
                  <span className="text-xs text-slate-400">
                    {page._count.clickEvents} событий
                  </span>
                  <a
                    href={buildInternalShortUrl(page.slug)}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700"
                  >
                    Открыть публичную страницу
                  </a>
                  {page.externalShortUrl ? (
                    <a
                      href={page.externalShortUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700"
                    >
                      Внешний short URL
                    </a>
                  ) : null}
                </div>

                <form action={saveLandingPageAction} className="grid gap-4 lg:grid-cols-2">
                  <input type="hidden" name="id" value={page.id} />

                  <label className="space-y-2 text-sm text-slate-700">
                    <span>Название страницы</span>
                    <input
                      name="title"
                      defaultValue={page.title}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400"
                    />
                  </label>

                  <label className="space-y-2 text-sm text-slate-700">
                    <span>Slug</span>
                    <input
                      name="slug"
                      defaultValue={page.slug}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400"
                    />
                  </label>

                  <label className="space-y-2 text-sm text-slate-700 lg:col-span-2">
                    <span>Описание</span>
                    <textarea
                      name="description"
                      rows={3}
                      defaultValue={page.description ?? ""}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400"
                    />
                  </label>

                  <div className="lg:col-span-2">
                    <UploadField
                      name="avatarUrl"
                      label="Аватарка"
                      defaultValue={page.avatarUrl}
                    />
                  </div>

                  <label className="space-y-2 text-sm text-slate-700">
                    <span>Заголовок предупреждения</span>
                    <input
                      name="warningTitle"
                      defaultValue={page.warningTitle ?? ""}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400"
                    />
                  </label>

                  <label className="space-y-2 text-sm text-slate-700">
                    <span>Текст предупреждения</span>
                    <input
                      name="warningText"
                      defaultValue={page.warningText ?? ""}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400"
                    />
                  </label>

                  <label className="space-y-2 text-sm text-slate-700">
                    <span>Текст кнопки proxy</span>
                    <input
                      name="proxyButtonText"
                      defaultValue={page.proxyButtonText}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400"
                    />
                  </label>

                  <label className="space-y-2 text-sm text-slate-700">
                    <span>Текст кнопки шага 2</span>
                    <input
                      name="targetButtonText"
                      defaultValue={page.targetButtonText}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400"
                    />
                  </label>

                  <label className="space-y-2 text-sm text-slate-700">
                    <span>Канал / бот</span>
                    <input
                      name="targetUrl"
                      defaultValue={page.targetUrl}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400"
                    />
                  </label>

                  <label className="space-y-2 text-sm text-slate-700">
                    <span>Proxy config</span>
                    <select
                      name="proxyConfigId"
                      defaultValue={page.proxyConfigId}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400"
                    >
                      {proxies.map((proxy) => (
                        <option key={proxy.id} value={proxy.id}>
                          {proxy.label} · {proxy.server}:{proxy.port}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2 text-sm text-slate-700">
                    <span>Внешний short-link провайдер</span>
                    <select
                      name="providerConfigId"
                      defaultValue={page.providerConfigId ?? ""}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400"
                    >
                      <option value="">Только внутренний slug</option>
                      {providers.map((provider) => (
                        <option key={provider.id} value={provider.id}>
                          {provider.label} · {getProviderLabel(provider.provider)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2 text-sm text-slate-700">
                    <span>Внешний short URL</span>
                    <input
                      name="externalShortUrl"
                      defaultValue={page.externalShortUrl ?? ""}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400"
                    />
                  </label>

                  <div className="grid gap-4 lg:col-span-2 md:grid-cols-2">
                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        name="generateExternalShortUrl"
                        defaultChecked={Boolean(page.providerConfigId)}
                      />
                      Перегенерировать внешний short URL
                    </label>

                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        name="isActive"
                        defaultChecked={page.isActive}
                      />
                      Страница активна
                    </label>
                  </div>

                  <div className="lg:col-span-2 flex flex-wrap items-center gap-3">
                    <button
                      type="submit"
                      className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Обновить страницу
                    </button>

                    <span className="text-xs text-slate-400">
                      Последнее обновление: {formatDateTime(page.updatedAt)} ·
                      proxy: {page.proxyConfig.label}
                    </span>
                  </div>
                </form>

                <form action={deleteLandingPageAction} className="mt-4">
                  <input type="hidden" name="id" value={page.id} />
                  <button
                    type="submit"
                    className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                  >
                    Удалить страницу
                  </button>
                </form>
              </article>
            ))
          ) : (
            <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
              Пока нет ни одной slug-страницы. Создайте первую форму выше.
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
