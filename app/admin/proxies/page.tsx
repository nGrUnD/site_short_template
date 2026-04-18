import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { maskSecret } from "@/lib/utils";
import { deleteProxyAction, saveProxyAction } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export default async function AdminProxiesPage() {
  const session = await requireAdminSession();
  const proxies = await prisma.proxyConfig.findMany({
    include: {
      _count: {
        select: {
          landingPages: true,
        },
      },
    },
    orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
  });

  return (
    <AdminShell
      title="Прокси"
      description="Хранилище всех MTProto proxy конфигов. На каждую публичную страницу можно навесить один из сохранённых прокси."
      session={session}
    >
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-semibold text-slate-950">
            Добавить новый прокси
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Для одного сервера можно создать несколько вариантов конфигурации,
            если вы раздаёте разные port/secret.
          </p>

          <form action={saveProxyAction} className="mt-6 grid gap-4">
            <input type="hidden" name="id" value="" />

            <label className="space-y-2 text-sm text-slate-700">
              <span>Label</span>
              <input
                name="label"
                required
                placeholder="RU Main 443"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-700">
                <span>Server / IP</span>
                <input
                  name="server"
                  required
                  placeholder="45.154.229.129"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400"
                />
              </label>

              <label className="space-y-2 text-sm text-slate-700">
                <span>Port</span>
                <input
                  name="port"
                  type="number"
                  min="1"
                  max="65535"
                  required
                  defaultValue="443"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400"
                />
              </label>
            </div>

            <label className="space-y-2 text-sm text-slate-700">
              <span>Secret</span>
              <input
                name="secret"
                required
                placeholder="7u8zC..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400"
              />
            </label>

            <label className="space-y-2 text-sm text-slate-700">
              <span>Заметки</span>
              <textarea
                name="notes"
                rows={4}
                placeholder="Для какого трафика, на каком сервере, кто обслуживает..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400"
              />
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <input type="checkbox" name="isActive" defaultChecked />
              Активный прокси
            </label>

            <button
              type="submit"
              className="rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-600"
            >
              Сохранить прокси
            </button>
          </form>
        </section>

        <section className="space-y-4">
          {proxies.length > 0 ? (
            proxies.map((proxy) => (
              <article
                key={proxy.id}
                className="rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-slate-200"
              >
                <div className="mb-5 flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                    {proxy.label}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      proxy.isActive
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {proxy.isActive ? "Активен" : "Выключен"}
                  </span>
                  <span className="text-xs text-slate-400">
                    Привязан к {proxy._count.landingPages} стр.
                  </span>
                </div>

                <form action={saveProxyAction} className="grid gap-4">
                  <input type="hidden" name="id" value={proxy.id} />

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2 text-sm text-slate-700">
                      <span>Label</span>
                      <input
                        name="label"
                        defaultValue={proxy.label}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400"
                      />
                    </label>

                    <label className="space-y-2 text-sm text-slate-700">
                      <span>Server / IP</span>
                      <input
                        name="server"
                        defaultValue={proxy.server}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400"
                      />
                    </label>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2 text-sm text-slate-700">
                      <span>Port</span>
                      <input
                        name="port"
                        type="number"
                        min="1"
                        max="65535"
                        defaultValue={proxy.port}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400"
                      />
                    </label>

                    <label className="space-y-2 text-sm text-slate-700">
                      <span>Secret</span>
                      <input
                        name="secret"
                        type="password"
                        defaultValue={proxy.secret}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400"
                      />
                      <p className="text-xs text-slate-400">
                        Текущий secret: {maskSecret(proxy.secret)}
                      </p>
                    </label>
                  </div>

                  <label className="space-y-2 text-sm text-slate-700">
                    <span>Заметки</span>
                    <textarea
                      name="notes"
                      rows={4}
                      defaultValue={proxy.notes ?? ""}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400"
                    />
                  </label>

                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        name="isActive"
                        defaultChecked={proxy.isActive}
                      />
                      Активный прокси
                    </label>

                    <button
                      type="submit"
                      className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Обновить
                    </button>
                  </div>
                </form>

                <form action={deleteProxyAction} className="mt-4">
                  <input type="hidden" name="id" value={proxy.id} />
                  <button
                    type="submit"
                    className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                  >
                    Удалить прокси
                  </button>
                </form>
              </article>
            ))
          ) : (
            <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
              Пока нет сохранённых прокси. Добавьте первый конфиг слева.
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
