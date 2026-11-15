import { Suspense } from "react";
import { TopBar } from "@/components/top-bar";
import { t } from "@/i18n/t";
import { getSession } from "@/server/session";
import { CreateGroupForm } from "./create-group-form";

export default function NewGroupPage() {
  return (
    <main className="mx-auto min-h-dvh max-w-md px-4 pt-1">
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
  return <CreateGroupForm needsName={!session} />;
}
