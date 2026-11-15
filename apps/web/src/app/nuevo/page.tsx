import { Suspense } from "react";
import { TopBar } from "@/components/top-bar";
import { t } from "@/i18n/t";
import { getSession } from "@/server/session";
import { CreatePlanForm } from "./create-plan-form";

export default function NewPlanPage() {
  return (
    <main className="mx-auto min-h-dvh max-w-md px-4 pt-1">
      <TopBar backHref="/" backLabel={t("create.back")} />
      <h1 className="mt-2 font-extrabold text-[1.75rem] leading-tight">
        {t("create.title")}
      </h1>
      <Suspense fallback={<CreatePlanForm needsName={false} />}>
        <SessionAwareForm />
      </Suspense>
    </main>
  );
}

async function SessionAwareForm() {
  const session = await getSession();
  return <CreatePlanForm needsName={!session} />;
}
