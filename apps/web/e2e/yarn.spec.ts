import { expect, test } from "@playwright/test";

test("threads on the signed-out home are spun yarn, not flat colour", async ({
  page,
}) => {
  await page.goto("/");
  const yarn = page.locator("main .yarn");
  await expect(yarn.first()).toBeVisible();
  const images = await yarn.evaluateAll((nodes) =>
    nodes.map((node) => getComputedStyle(node).backgroundImage),
  );
  expect(images.length).toBeGreaterThan(0);
  for (const image of images) expect(image).toContain("/yarn/");
});

test("sticky footers lie on the cloth, not on a flat band", async ({
  page,
}) => {
  await page.goto("/grupos/nuevo");
  const footer = page.locator(".sticky-footer").first();
  await expect(footer).toBeVisible();
  expect(
    await footer.evaluate((node) => getComputedStyle(node).backgroundImage),
  ).toContain("/yarn/cloth-");
});

test("titles speak in Knot Rope and section headings in Bricolage", async ({
  page,
}) => {
  await page.goto("/grupos/nuevo");
  const families = await page.evaluate(async () => {
    await document.fonts.ready;
    const h1 = document.querySelector("h1");
    return {
      h1: h1 ? getComputedStyle(h1).fontFamily : "",
      ropeLoaded: [...document.fonts].some(
        (font) => /rope/i.test(font.family) && font.status === "loaded",
      ),
    };
  });
  expect(families.h1.toLowerCase()).toContain("rope");
  expect(families.ropeLoaded).toBe(true);
});

test("the primary action is a madder sewn label in the rope face", async ({
  page,
}) => {
  await page.goto("/");
  const button = page.getByRole("link", { name: "Crear un grupo" });
  const style = await button.evaluate((node) => {
    const css = getComputedStyle(node);
    const stitch = getComputedStyle(node, "::after");
    return {
      font: css.fontFamily.toLowerCase(),
      color: css.color,
      border: css.borderTopColor,
      weave: css.backgroundImage,
      stitch: stitch.borderTopStyle,
      shadow: css.textShadow,
    };
  });
  expect(style.font).toContain("rope");
  expect(style.color).toBe("rgb(184, 50, 42)");
  expect(style.border).toBe("rgb(184, 50, 42)");
  expect(style.weave).toContain("/yarn/cloth-surface.webp");
  expect(style.stitch).toBe("dashed");
  expect(style.shadow).toBe("none");
});
