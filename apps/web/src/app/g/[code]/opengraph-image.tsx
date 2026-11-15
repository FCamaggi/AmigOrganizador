import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { connection } from "next/server";
import { t } from "@/i18n/t";
import { initialOf } from "@/lib/format";
import { groups, profiles } from "@/server/repository";

export const alt = t("app.tagline");
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#1d1d1b";
const MUTE = "#555552";
const RULE = "#e4e4e1";
const LINES = [
  { color: "#e1251b", outlined: false },
  { color: "#0065bd", outlined: false },
  { color: "#ffc20e", outlined: true },
];
/** Where the decorative station sits on the lines, in px from the left. */
const STATION = { left: 640, width: 260 };

const fontsDir = join(process.cwd(), "src/assets/fonts");

/**
 * The link preview WhatsApp shows when a group invite is shared (S6): the
 * group's sign with its head count, three metro lines meeting at a station,
 * and the next step. Counts only, never member names: chat apps cache the
 * image and show it to everyone in the chat.
 */
export default async function Image({
  params,
}: {
  readonly params: Promise<{ code: string }>;
}) {
  await connection();
  const { code } = await params;
  const [group, medium, heavy] = await Promise.all([
    groups().findByInviteCode(code),
    readFile(join(fontsDir, "RobotoCondensed-500.ttf")),
    readFile(join(fontsDir, "RobotoCondensed-800.ttf")),
  ]);
  const withProfile = group
    ? (await profiles().findByAccounts(group.members.map((m) => m.accountId)))
        .length
    : 0;
  const preview = group
    ? {
        title: group.name,
        meta: t("group.meta", {
          members:
            group.members.length === 1
              ? t("plan.people.one")
              : t("plan.people.other", { count: group.members.length }),
          withProfile,
        }),
      }
    : null;
  const title = preview?.title ?? t("app.name");
  const titleSize = title.length > 34 ? 60 : 76;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#ffffff",
        color: INK,
        fontFamily: "Roboto Condensed",
        padding: "56px 64px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          fontSize: 30,
          fontWeight: 800,
        }}
      >
        {t("app.name")}
        <span
          style={{
            border: `2px solid ${INK}`,
            borderRadius: 4,
            padding: "0 8px",
            fontSize: 20,
            textTransform: "uppercase",
          }}
        >
          {t("app.beta")}
        </span>
      </div>

      <div
        style={{
          marginTop: 28,
          display: "flex",
          alignItems: "center",
          gap: 28,
          background: INK,
          color: "#ffffff",
          borderRadius: 14,
          padding: "28px 34px",
        }}
      >
        <div
          style={{
            width: 88,
            height: 88,
            flex: "none",
            borderRadius: 44,
            background: "#e1251b",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 48,
            fontWeight: 800,
          }}
        >
          {initialOf(title)}
        </div>
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          <div
            style={{
              fontSize: titleSize,
              fontWeight: 800,
              lineHeight: 1.05,
              display: "flex",
            }}
          >
            {title}
          </div>
          {preview ? (
            <div
              style={{
                marginTop: 8,
                fontSize: 30,
                fontWeight: 500,
                color: "#d6d6d3",
              }}
            >
              {preview.meta}
            </div>
          ) : null}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: titleSize > 60 ? 22 : 16,
        }}
      >
        {LINES.map((line) => (
          <div
            key={line.color}
            style={{
              position: "relative",
              height: 22,
              display: "flex",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: "100%",
                height: 12,
                borderRadius: 6,
                background: line.color,
                border: line.outlined ? `2px solid ${INK}` : "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: STATION.left,
                width: STATION.width,
                height: 26,
                borderRadius: 13,
                background: "#ffffff",
                border: `4px solid ${INK}`,
              }}
            />
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: `2px solid ${RULE}`,
          paddingTop: 22,
        }}
      >
        <div style={{ fontSize: 32, fontWeight: 800, display: "flex" }}>
          {preview ? t("og.invite") : t("app.tagline")}
        </div>
        {preview ? (
          <div
            style={{
              display: "flex",
              background: "#0065bd",
              color: "#ffffff",
              borderRadius: 10,
              padding: "12px 26px",
              fontSize: 32,
              fontWeight: 800,
            }}
          >
            {t("group.invite.join")}
          </div>
        ) : (
          <div style={{ fontSize: 28, color: MUTE, display: "flex" }} />
        )}
      </div>
    </div>,
    {
      ...size,
      fonts: [
        {
          name: "Roboto Condensed",
          data: medium,
          weight: 500,
          style: "normal",
        },
        { name: "Roboto Condensed", data: heavy, weight: 800, style: "normal" },
      ],
    },
  );
}
