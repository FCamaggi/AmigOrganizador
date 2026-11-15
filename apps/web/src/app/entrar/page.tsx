import { Suspense } from "react";
import { TopBar } from "@/components/top-bar";
import { t } from "@/i18n/t";
import { shellClasses } from "@/lib/ui";
import { SignInForm } from "./sign-in-form";

export default function SignInPage({ searchParams }: PageProps<"/entrar">) {
  return (
    <main className={shellClasses.narrow}>
      <Suspense fallback={null}>
        <SignInScreen searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function SignInScreen({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = (await searchParams).next;
  const next =
    typeof raw === "string" && raw.startsWith("/") && !raw.startsWith("//")
      ? raw
      : "/";
  const back = next.replace(/\/disponibilidad$/, "");
  return (
    <>
      <TopBar backHref={back} backLabel={t("answer.back")} />
      <h1 className="mt-4 font-extrabold text-[1.75rem] leading-tight">
        {t("signin.title")}
      </h1>
      <p className="mt-1.5 text-mute">{t("signin.body")}</p>

      <div className="mt-5 space-y-2 opacity-100">
        <button
          type="button"
          disabled
          aria-describedby="local-mode"
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-sign border-[1.5px] border-rule-strong bg-white font-bold text-mute"
        >
          {t("signin.google")}
        </button>
        <button
          type="button"
          disabled
          aria-describedby="local-mode"
          className="flex min-h-12 w-full items-center justify-center rounded-sign border-[1.5px] border-rule-strong bg-white font-bold text-mute"
        >
          {t("signin.magic")}
        </button>
      </div>

      <section
        className="mt-5 rounded-sign border-2 border-ink px-3 py-3"
        aria-labelledby="local-mode"
      >
        <h2
          id="local-mode"
          className="font-extrabold text-xs uppercase tracking-[0.06em]"
        >
          {t("signin.local.title")}
        </h2>
        <p className="mt-1 text-mute text-sm">{t("signin.local.body")}</p>
        <SignInForm next={next} />
      </section>
    </>
  );
}
