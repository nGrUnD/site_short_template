"use client";

import { useEffect, useRef } from "react";

type TelegramLoginWidgetProps = {
  botUsername: string;
  authUrl: string;
};

export function TelegramLoginWidget({
  botUsername,
  authUrl,
}: TelegramLoginWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", botUsername);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "14");
    script.setAttribute("data-auth-url", authUrl);
    script.setAttribute("data-request-access", "write");
    script.setAttribute("data-userpic", "false");

    containerRef.current.appendChild(script);
  }, [authUrl, botUsername]);

  return <div ref={containerRef} className="min-h-12" />;
}
