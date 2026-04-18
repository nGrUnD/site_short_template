"use client";

import { useState } from "react";

type UploadFieldProps = {
  name: string;
  label: string;
  defaultValue?: string | null;
};

export function UploadField({
  name,
  label,
  defaultValue,
}: UploadFieldProps) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as { error?: string; url?: string };

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Upload failed.");
      }

      setValue(data.url);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Не удалось загрузить файл.",
      );
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <input
        name={name}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="/uploads/avatar.png или https://..."
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-400"
      />

      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex cursor-pointer items-center rounded-2xl border border-dashed border-sky-300 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700 transition hover:bg-sky-100">
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
          {isUploading ? "Загрузка..." : "Загрузить файл"}
        </label>

        {value ? (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            Файл привязан
          </span>
        ) : null}
      </div>

      <p className="text-xs text-slate-500">
        Поддерживаются JPG, PNG и WEBP. Для лучшего превью используйте квадрат.
      </p>

      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
