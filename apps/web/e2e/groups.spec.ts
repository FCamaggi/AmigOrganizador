import { expect, type Page, test } from "@playwright/test";

const GROUP = "Asado e2e";

async function createGroup(page: Page): Promise<string> {
  await page.goto("/grupos/nuevo");
  await page.getByLabel("¿Cómo se llama el grupo?").fill(GROUP);
  await page.getByLabel("Tu nombre").fill("Ana");
  await page.getByRole("button", { name: "Crear y compartir" }).click();
  await page.waitForURL(/\/g\/[A-Za-z0-9_-]+$/);
  return new URL(page.url()).pathname;
}

async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
}

test("a friend opens the invite, sees the group first, signs in and joins", async ({
  page,
  browser,
}) => {
  const groupPath = await createGroup(page);
  await expect(page.getByText(GROUP).first()).toBeVisible();

  const friend = await (await browser.newContext()).newPage();
  await friend.goto(groupPath);
  await expect(
    friend.getByRole("heading", { name: `Te invitaron a ${GROUP}` }),
  ).toBeVisible();
  await expect(friend.getByText("Ana")).toBeVisible();

  await friend.getByRole("link", { name: "Unirme" }).click();
  await friend.getByLabel("Tu nombre").fill("Beto");
  await friend.getByRole("button", { name: "Entrar" }).click();
  await friend.waitForURL(`**${groupPath}`);
  await friend.getByRole("button", { name: "Unirme al grupo" }).click();
  await expect(friend.getByText("Falta el perfil de Ana y Beto")).toBeHidden();
  await expect(
    friend.getByRole("heading", { name: `Te invitaron a ${GROUP}` }),
  ).toBeHidden();
});

test("the invite link has a link preview image", async ({ page, request }) => {
  const groupPath = await createGroup(page);
  const image = await request.get(`${groupPath}/opengraph-image`);
  expect(image.status()).toBe(200);
  expect(image.headers()["content-type"]).toBe("image/png");
  const html = await (await request.get(groupPath)).text();
  expect(html).toContain('property="og:image"');
});

for (const width of [390, 820, 1440]) {
  test(`screens fit a ${width}px wide window without sideways scroll`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const groupPath = await createGroup(page);
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
    for (const path of ["/", "/perfil", "/grupos/nuevo", groupPath]) {
      await page.goto(path);
      expect(await horizontalOverflow(page), path).toBeLessThanOrEqual(0);
    }
  });
}
