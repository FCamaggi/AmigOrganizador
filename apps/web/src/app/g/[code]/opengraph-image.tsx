import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { connection } from "next/server";
import { t } from "@/i18n/t";
import { initialOf } from "@/lib/format";
import { groups, memberSchedules } from "@/server/repository";

export const alt = t("app.tagline");
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const GROUND = "#e9ebe8";
const SURFACE = "#fbfbfa";
const INK = "#23263a";
const INK_SUB = "#c9ccd8";
const MADDER = "#b8322a";
const UNDER = "#c4c7c1";

/**
 * Decorative cloth: four threads over twelve columns. 1 = the thread rides on
 * top (free), 0 = it dives under (busy). Column 7 is on top for everyone, the
 * closed band. Illustrative only: it never encodes real members' time.
 */
const THREADS = [
  { color: "#2f4fa2", weave: [1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 0] },
  { color: "#9a6a0a", weave: [0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1] },
  { color: "#3e7d5a", weave: [1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1] },
  { color: "#a8406e", weave: [1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0] },
];
const BAND = 6;
const CELL = 88;

const fontsDir = join(process.cwd(), "src/assets/fonts");

/**
 * The link preview WhatsApp shows when a group invite is shared (S6): the
 * group's name with its head count, a woven cloth whose threads close into a
 * band, and the next step. Counts only, never member names: chat apps cache
 * the image and show it to everyone in the chat.
 */
export default async function Image({
  params,
}: {
  readonly params: Promise<{ code: string }>;
}) {
  await connection();
  const { code } = await params;
  const [group, ui, display] = await Promise.all([
    groups().findByInviteCode(code),
    readFile(join(fontsDir, "Figtree-600.ttf")),
    readFile(join(fontsDir, "BricolageGrotesque-800.ttf")),
  ]);
  const withProfile = group ? (await memberSchedules(group)).length : 0;
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
  const titleSize = title.length > 30 ? 58 : 72;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: GROUND,
        color: INK,
        fontFamily: "Figtree",
        padding: "48px 64px",
      }}
    >
      <div style={{ display: "flex", fontSize: 30, fontFamily: "Bricolage" }}>
        {t("app.name")}
      </div>
      <div
        style={{
          marginTop: 24,
          display: "flex",
          alignItems: "center",
          gap: 28,
          background: INK,
          color: SURFACE,
          borderRadius: 24,
          padding: "26px 32px",
        }}
      >
        <div
          style={{
            width: 88,
            height: 88,
            flex: "none",
            borderRadius: 44,
            background: MADDER,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 48,
            fontFamily: "Bricolage",
          }}
        >
          {initialOf(title)}
        </div>
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          <div
            style={{
              fontSize: titleSize,
              fontFamily: "Bricolage",
              lineHeight: 1.02,
              display: "flex",
            }}
          >
            {title}
          </div>
          {preview ? (
            <div style={{ marginTop: 8, fontSize: 30, color: INK_SUB }}>
              {preview.meta}
            </div>
          ) : null}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {THREADS.map((thread) => (
            <div
              key={thread.color}
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                height: 26,
                width: CELL * thread.weave.length,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 10,
                  height: 6,
                  borderRadius: 3,
                  background: UNDER,
                }}
              />
              {thread.weave.map((on, i) => (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: fixed decorative pattern
                  key={i}
                  style={{
                    position: "absolute",
                    left: i * CELL + 4,
                    width: CELL - 8,
                    height: 26,
                    borderRadius: 13,
                    background: on ? thread.color : "transparent",
                  }}
                />
              ))}
            </div>
          ))}
          <div
            style={{
              position: "absolute",
              left: BAND * CELL - 8,
              top: -16,
              width: CELL + 16,
              height: 4 * 26 + 3 * 14 + 32,
              borderRadius: 22,
              border: `6px solid ${INK}`,
            }}
          />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ fontSize: 32, display: "flex" }}>
          {preview ? t("og.invite") : t("app.tagline")}
        </div>
        {preview ? (
          <div
            style={{
              display: "flex",
              background: MADDER,
              color: "#ffffff",
              borderRadius: 18,
              padding: "14px 28px",
              fontSize: 32,
            }}
          >
            {t("group.invite.join")}
          </div>
        ) : null}
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: "Figtree", data: ui, weight: 600, style: "normal" },
        { name: "Bricolage", data: display, weight: 800, style: "normal" },
      ],
    },
  );
}
