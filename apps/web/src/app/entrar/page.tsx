import Link from "next/link";
import { Suspense } from "react";
import { TopBar } from "@/components/top-bar";
import { type MessageKey, t } from "@/i18n/t";
import { buttonClasses, shellClasses } from "@/lib/ui";
import { signInWithGoogle } from "@/server/actions";
import { authMode, googleEnabled, safeNext } from "@/server/auth/config";
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
  const back = next === "/grupos/nuevo" ? "/" : next;
  const intro = signInIntro(next);
  return (
    <>
      <TopBar backHref={back} backLabel={t("answer.back")} />
      <h1 className="mt-4 font-extrabold text-[1.75rem] leading-tight">
        {t(intro.title)}
      </h1>
      <p className="mt-1.5 text-mute">{t(intro.body)}</p>

      {callbackError ? (
        <p className="mt-3 font-bold text-danger text-sm" role="alert">
          {t("signin.callbackError")}
        </p>
      ) : null}

      {authMode() === "supabase" ? (
        <div className="mt-5">
          {googleEnabled() ? (
            <>
              <form action={signInWithGoogle}>
                <input type="hidden" name="next" value={next} />
                <button
                  type="submit"
                  className={`${buttonClasses.secondary} min-h-12 w-full gap-2.5`}
                >
                  <GoogleMark />
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
          className="mt-5 rounded-cloth border border-rule-strong bg-surface p-4"
          aria-labelledby="local-mode"
        >
          <h2 id="local-mode" className="font-extrabold text-lg">
            {t("signin.local.title")}
          </h2>
          <p className="mt-1 text-mute text-sm">{t("signin.local.body")}</p>
          <SignInForm next={next} />
        </section>
      )}
      <Link
        href="/privacidad"
        className="mt-4 flex min-h-11 items-center justify-center font-bold text-mute text-sm underline"
      >
        {t("privacy.link")}
      </Link>
    </>
  );
}

/**
 * Says why sign-in is asked for: someone who tapped "Crear grupo" or opened
 * an invite should not land on a generic login with no context.
 */
function signInIntro(next: string): {
  readonly title: MessageKey;
  readonly body: MessageKey;
} {
  if (next === "/grupos/nuevo")
    return { title: "signin.create.title", body: "signin.create.body" };
  if (next.startsWith("/g/"))
    return { title: "signin.join.title", body: "signin.join.body" };
  return { title: "signin.title", body: "signin.body" };
}

/** Google's "G", required on Google sign-in buttons by its branding rules. */
function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="size-5 flex-none">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}
