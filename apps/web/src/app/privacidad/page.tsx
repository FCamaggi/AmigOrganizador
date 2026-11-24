import type { Metadata } from "next";
import { TopBar } from "@/components/top-bar";
import { type MessageKey, t } from "@/i18n/t";
import { shellClasses } from "@/lib/ui";

export const metadata: Metadata = {
  title: `${t("privacy.title")} · ${t("app.name")}`,
};

const SECTIONS: readonly {
  readonly title: MessageKey;
  readonly body: readonly MessageKey[];
}[] = [
  {
    title: "privacy.collect.title",
    body: [
      "privacy.collect.account",
      "privacy.collect.profile",
      "privacy.collect.calendar",
      "privacy.collect.groups",
      "privacy.collect.usage",
    ],
  },
  { title: "privacy.use.title", body: ["privacy.use.body"] },
  { title: "privacy.share.title", body: ["privacy.share.body"] },
  { title: "privacy.delete.title", body: ["privacy.delete.body"] },
];

/**
 * Public privacy policy (Google requires one to publish the OAuth app). It
 * must describe what the code actually stores; update it with the code.
 */
export default function PrivacyPage() {
  const contact = process.env.CONTACT_EMAIL;
  return (
    <main className={`${shellClasses.narrow} pb-12`}>
      <TopBar backHref="/" backLabel={t("app.name")} />
      <h1 className="mt-2 font-extrabold text-[1.75rem] leading-tight">
        {t("privacy.title")}
      </h1>
      <p className="mt-1 text-mute text-sm">{t("privacy.updated")}</p>
      <p className="mt-4">{t("privacy.intro")}</p>
      {SECTIONS.map((section) => (
        <section key={section.title} className="mt-6">
          <h2 className="font-extrabold text-lg">{t(section.title)}</h2>
          {section.body.map((key) => (
            <p key={key} className="mt-2">
              {t(key)}
            </p>
          ))}
        </section>
      ))}
      {contact ? (
        <p className="mt-6 font-bold">
          {t("privacy.contact", { email: contact })}
        </p>
      ) : null}
    </main>
  );
}
