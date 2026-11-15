import { redirect } from "next/navigation";
import { Suspense } from "react";
import { TopBar } from "@/components/top-bar";
import { t } from "@/i18n/t";
import { shellClasses } from "@/lib/ui";
import { supabaseConfig } from "@/server/auth/config";
import { getSession } from "@/server/session";
import { CreateGroupForm } from "./create-group-form";

export default function NewGroupPage() {
  return (
    <main className={shellClasses.narrow}>
      <TopBar backHref="/" backLabel={t("group.back")} />
      <h1 className="mt-2 font-extrabold text-[1.75rem] leading-tight">
        {t("groupNew.title")}
      </h1>
      <Suspense fallback={<CreateGroupForm needsName={false} />}>
        <SessionAwareForm />
      </Suspense>
    </main>
  );
}

async function SessionAwareForm() {
  const session = await getSession();
  // With real accounts, sign in first (one tap, ADR 0003) and come back.
  if (!session && supabaseConfig())
    redirect(`/entrar?next=${encodeURIComponent("/grupos/nuevo")}`);
  return <CreateGroupForm needsName={!session} />;
}
