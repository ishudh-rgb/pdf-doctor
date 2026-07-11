"use client";

import Link from "next/link";
import { FileQuestion, ArrowLeft, Home } from "lucide-react";
import { useTranslation } from "@/i18n";
import { useLocaleHref } from "@/hooks/use-locale-href";

export default function NotFound() {
  const { t } = useTranslation();
  const localeHref = useLocaleHref();

  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-20 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-red-50">
        <FileQuestion className="h-10 w-10 text-red-500" />
      </div>
      <h1 className="mt-6 text-3xl font-bold text-gray-900">{t("notFound.title")}</h1>
      <p className="mt-3 max-w-md text-gray-500">{t("notFound.description")}</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href={localeHref("/")}
          className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
        >
          <Home className="h-4 w-4" />
          {t("notFound.goHome")}
        </Link>
        <Link
          href={localeHref("/all-tools")}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("notFound.browseTools")}
        </Link>
      </div>
    </section>
  );
}
