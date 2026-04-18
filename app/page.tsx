import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getAdminSession();

  if (session) {
    redirect("/admin");
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[36px] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur">
          <p className="text-sm uppercase tracking-[0.35em] text-sky-300">
            TG Proxy Gateway
          </p>
          <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">
            Self-hosted прослойка для быстрой раздачи MTProto proxy и коротких
            ссылок.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Сервис создаёт короткие URL на вашем домене, показывает пользователю
            понятный лендинг в 2 шага и пытается добавить Telegram proxy в один
            клик на мобильных и десктопных клиентах.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/admin/login"
              className="inline-flex items-center justify-center rounded-full bg-sky-500 px-6 py-3 text-base font-semibold text-white transition hover:bg-sky-600"
            >
              Войти в админку
            </Link>
            <a
              href="#features"
              className="inline-flex items-center justify-center rounded-full border border-white/15 px-6 py-3 text-base font-semibold text-slate-100 transition hover:bg-white/10"
            >
              Что уже готово
            </a>
          </div>
        </section>

        <aside className="rounded-[36px] border border-sky-200/20 bg-sky-400/10 p-8 shadow-2xl shadow-sky-900/10">
          <h2 className="text-2xl font-semibold">Как это работает</h2>
          <div className="mt-6 space-y-4 text-sm text-slate-200">
            <div className="rounded-3xl bg-white/8 p-5">
              <p className="font-semibold text-sky-200">1. Создаёте прокси</p>
              <p className="mt-2 text-slate-300">
                В админке храните server, port, secret, заметки и активность.
              </p>
            </div>
            <div className="rounded-3xl bg-white/8 p-5">
              <p className="font-semibold text-sky-200">2. Выпускаете slug</p>
              <p className="mt-2 text-slate-300">
                Для каждого канала/бота создаёте отдельную страницу и при
                необходимости внешний short URL.
              </p>
            </div>
            <div className="rounded-3xl bg-white/8 p-5">
              <p className="font-semibold text-sky-200">3. Пользователь кликает</p>
              <p className="mt-2 text-slate-300">
                Лендинг открывает `tg://proxy`, а затем fallback на `t.me/proxy`.
              </p>
            </div>
          </div>
        </aside>
      </div>

      <section
        id="features"
        className="mx-auto mt-8 grid max-w-6xl gap-6 md:grid-cols-3"
      >
        {[
          "Telegram login в админку через allowlist.",
          "CRUD для прокси, страниц и short-link провайдеров.",
          "Сбор базовой аналитики по просмотрам и кликам.",
        ].map((feature) => (
          <div
            key={feature}
            className="rounded-[28px] border border-white/10 bg-white/5 p-6 text-sm text-slate-300"
          >
            {feature}
          </div>
        ))}
      </section>
    </div>
  );
}
