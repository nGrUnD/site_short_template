import Link from "next/link";
import { redirect } from "next/navigation";
import { TelegramLoginWidget } from "@/components/admin/login-widget";
import { getAdminSession } from "@/lib/auth";
import {
  appConfig,
  getAdminTelegramIds,
  isAdminAllowlistConfigured,
} from "@/lib/env";
import { absoluteUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getAdminSession();

  if (session) {
    redirect("/admin");
  }

  const params = await searchParams;
  const botReady =
    Boolean(appConfig.telegramBotUsername) && Boolean(appConfig.telegramBotToken);
  const allowlistReady = isAdminAllowlistConfigured();
  const authUrl = absoluteUrl("/api/auth/telegram");

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[36px] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20">
          <p className="text-sm uppercase tracking-[0.35em] text-sky-300">
            Защищённый вход
          </p>
          <h1 className="mt-4 text-4xl font-semibold">
            Вход в админку через Telegram
          </h1>
          <p className="mt-4 text-lg leading-8 text-slate-300">
            Только Telegram ID из allowlist смогут открыть дашборд и управлять
            прокси-ссылками.
          </p>

          <div className="mt-8 rounded-[28px] border border-slate-800 bg-slate-950/60 p-6">
            <h2 className="text-lg font-semibold">Статус конфигурации</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li>
                Telegram bot username:{" "}
                <span className={botReady ? "text-emerald-300" : "text-rose-300"}>
                  {appConfig.telegramBotUsername || "не задан"}
                </span>
              </li>
              <li>
                Bot token:{" "}
                <span className={botReady ? "text-emerald-300" : "text-rose-300"}>
                  {appConfig.telegramBotToken ? "задан" : "не задан"}
                </span>
              </li>
              <li>
                Admin allowlist:{" "}
                <span
                  className={allowlistReady ? "text-emerald-300" : "text-rose-300"}
                >
                  {allowlistReady
                    ? `${getAdminTelegramIds().length} id в белом списке`
                    : "список пуст"}
                </span>
              </li>
            </ul>
          </div>

          <div className="mt-8">
            <Link
              href="/"
              className="inline-flex rounded-full border border-white/10 px-5 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10"
            >
              На главную
            </Link>
          </div>
        </section>

        <section className="rounded-[36px] border border-sky-300/20 bg-white p-8 text-slate-900 shadow-2xl shadow-sky-950/10">
          <h2 className="text-2xl font-semibold">Вход администратора</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Виджет Telegram выполняет аутентификацию, а сервер дополнительно
            проверяет подпись и allowlist.
          </p>

          {params.error ? (
            <div className="mt-6 rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
              {params.error}
            </div>
          ) : null}

          {botReady && allowlistReady ? (
            <div className="mt-8 rounded-[28px] border border-slate-200 bg-slate-50 p-6">
              <TelegramLoginWidget
                botUsername={appConfig.telegramBotUsername}
                authUrl={authUrl}
              />
            </div>
          ) : (
            <div className="mt-8 rounded-[28px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
              Заполните `TELEGRAM_BOT_USERNAME`, `TELEGRAM_BOT_TOKEN` и
              `ADMIN_TELEGRAM_IDS`, чтобы включить вход.
            </div>
          )}

          <div className="mt-8 space-y-4 text-sm text-slate-600">
            <p>
              `data-auth-url`: <span className="font-medium">{authUrl}</span>
            </p>
            <p>
              Сессия хранится в HTTP-only cookie и живёт 7 дней, пока не истечёт
              или пока вы не выйдете вручную.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
