import { expect, test } from "@playwright/test";

test("the app can be installed to the home screen and opens standalone", async ({
  page,
  request,
}) => {
  await page.goto("/");
  const href = await page.locator('link[rel="manifest"]').getAttribute("href");
  expect(href).toBeTruthy();

  const manifest = await (await request.get(href as string)).json();
  expect(manifest).toMatchObject({
    name: "Knot",
    start_url: "/",
    scope: "/",
    display: "standalone",
    lang: "es-CL",
  });
  const sizes = manifest.icons.map((icon: { sizes: string }) => icon.sizes);
  expect(sizes).toEqual(expect.arrayContaining(["192x192", "512x512"]));
  expect(
    manifest.icons.some((icon: { purpose?: string }) =>
      icon.purpose?.includes("maskable"),
    ),
  ).toBe(true);
  for (const icon of manifest.icons) {
    const response = await request.get(icon.src);
    expect(response.status(), icon.src).toBe(200);
    expect(response.headers()["content-type"]).toBe("image/png");
  }

  // iOS reads its own tags, not the manifest.
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);
  await expect(
    page.locator('meta[name="mobile-web-app-capable"]'),
  ).toHaveAttribute("content", "yes");
});

test("the service worker installs and shows the offline page without a network", async ({
  page,
  context,
}) => {
  const sw = await page.request.get("/sw.js");
  expect(sw.status()).toBe(200);
  expect(sw.headers()["cache-control"]).toContain("no-cache");

  await page.goto("/");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  // The first load is not controlled yet; reload so the worker handles it.
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);

  await context.setOffline(true);
  await page.goto("/perfil");
  await expect(
    page.getByRole("heading", { name: "Sin conexión" }),
  ).toBeVisible();
  // Styled offline too: the worker kept the CSS, the cloth and the logo.
  expect(
    await page.evaluate(() => getComputedStyle(document.body).backgroundImage),
  ).toContain("/yarn/cloth-ground.webp");
  await expect
    .poll(() =>
      page
        .getByRole("img", { name: "Knot" })
        .evaluate((img: HTMLImageElement) => img.naturalWidth),
    )
    .toBeGreaterThan(0);
  await context.setOffline(false);
});

test("the offline page works as a normal page too", async ({ page }) => {
  await page.goto("/sin-conexion");
  await expect(
    page.getByRole("heading", { name: "Sin conexión" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Reintentar" })).toHaveAttribute(
    "href",
    "/",
  );
});
