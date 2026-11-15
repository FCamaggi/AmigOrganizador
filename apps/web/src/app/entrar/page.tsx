import { Suspense } from "react";
import { TopBar } from "@/components/top-bar";
import { t } from "@/i18n/t";
import { shellClasses } from "@/lib/ui";
import { signInWithGoogle } from "@/server/actions";
import { googleEnabled, safeNext, supabaseConfig } from "@/server/auth/config";
import { MagicLinkForm } from "./magic-link-form";
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
  const params = await searchParams;
  const next = safeNext(typeof params.next === "string" ? params.next : null);
  const callbackError = params.error !== undefined;
  const back = next;
  return (
    <>
      <TopBar backHref={back} backLabel={t("answer.back")} />
      <h1 className="mt-4 font-extrabold text-[1.75rem] leading-tight">
        {t("signin.title")}
      </h1>
      <p className="mt-1.5 text-mute">{t("signin.body")}</p>

      {callbackError ? (
        <p className="mt-3 font-bold text-danger text-sm" role="alert">
          {t("signin.callbackError")}
        </p>
      ) : null}

      {supabaseConfig() ? (
        <div className="mt-5">
          {googleEnabled() ? (
            <>
              <form action={signInWithGoogle}>
                <input type="hidden" name="next" value={next} />
                <button
                  type="submit"
                  className="flex min-h-12 w-full items-center justify-center rounded-sign border-[1.5px] border-ink bg-white font-bold text-ink"
                >
                  {t("signin.google")}
                </button>
              </form>
              <p className="my-3 text-center font-bold text-mute text-sm">
                {t("signin.or")}
              </p>
            </>
          ) : null}
          <MagicLinkForm next={next} />
        </div>
      ) : (
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
      )}
    </>
  );
}
