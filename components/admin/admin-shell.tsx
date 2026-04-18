import Link from "next/link";
import type { ReactNode } from "react";
import type { AdminSessionView } from "@/lib/auth";
import { cn, formatDateTime } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Дашборд" },
  { href: "/admin/proxies", label: "Прокси" },
  { href: "/admin/pages", label: "Страницы" },
];

type AdminShellProps = {
  title: string;
  description: string;
  session: AdminSessionView;
  children: ReactNode;
};

export function AdminShell({
  title,
  description,
  session,
  children,
}: AdminShellProps) {
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-[32px] bg-slate-950 px-6 py-5 text-white shadow-lg">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-sm text-sky-200">TG Proxy Gateway</p>
              <h1 className="text-2xl font-semibold">{title}</h1>
              <p className="max-w-2xl text-sm text-slate-300">{description}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
              <div className="font-medium">{session.displayName}</div>
              <div className="text-slate-400">
                {session.username ? `@${session.username}` : `ID ${session.telegramId}`}
              </div>
              <div className="mt-2 text-xs text-slate-400">
                Сессия до {formatDateTime(session.expiresAt)}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full border border-white/10 px-4 py-2 text-sm font-medium transition hover:border-sky-300/60 hover:bg-white/10",
                )}
              >
                {item.label}
              </Link>
            ))}

            <form action="/api/auth/logout" method="post" className="ml-auto">
              <button
                type="submit"
                className="rounded-full border border-rose-300/30 bg-rose-400/10 px-4 py-2 text-sm font-medium text-rose-100 transition hover:bg-rose-400/20"
              >
                Выйти
              </button>
            </form>
          </div>
        </header>

        <main>{children}</main>
      </div>
    </div>
  );
}
