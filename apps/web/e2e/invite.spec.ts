import { expect, test } from "@playwright/test";

async function createGroup(page: import("@playwright/test").Page) {
  await page.goto("/grupos/nuevo");
  await page.getByLabel("¿Cómo se llama el grupo?").fill("Once e2e");
  await page.getByLabel("Tu nombre").fill("Ana");
  await page.getByRole("button", { name: "Crear y compartir" }).click();
  await page.waitForURL(/\/g\/[A-Za-z0-9_-]+$/);
  return new URL(page.url()).pathname;
}

test("a new group leads with one WhatsApp invite and a quiet copy link", async ({
  page,
}) => {
  await createGroup(page);
  const invite = page.getByRole("link", { name: "Invitar por WhatsApp" });
  await expect(invite).toBeVisible();
  await expect(invite).toHaveAttribute("href", /^https:\/\/wa\.me\/\?text=/);
  await expect(page.getByRole("button", { name: "Copiar link" })).toBeVisible();
  // The invite comes before the profile notice.
  const order = await page.evaluate(() => {
    const a = document.querySelector('a[href^="https://wa.me"]');
    const b = document.getElementById("no-profile");
    return a && b
      ? a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING
      : 0;
  });
  expect(order).toBeTruthy();
});

test("the invite previews the group, confirms what is shared and lands on the group", async ({
  page,
  browser,
}) => {
  const groupPath = await createGroup(page);
  const friend = await (await browser.newContext()).newPage();
  await friend.goto(groupPath);
  await expect(
    friend.getByText(
      "Cuando armen sus perfiles, acá verás qué días les sirven.",
    ),
  ).toBeVisible();

  await friend.getByRole("link", { name: "Unirme" }).click();
  await friend.getByLabel("Tu nombre").fill("Beto");
  await friend.getByRole("button", { name: "Entrar" }).click();
  await friend.waitForURL(`**${groupPath}`);
  await expect(
    friend.getByRole("heading", { name: "¿Te unes a Once e2e?" }),
  ).toBeVisible();
  await expect(
    friend.getByText(
      "Tus amigos verán cuándo estás libre u ocupado, nunca qué haces.",
    ),
  ).toBeVisible();
  await friend.getByRole("button", { name: "Unirme al grupo" }).click();
  await friend.waitForURL(`**${groupPath}`);
  await expect(
    friend.getByRole("heading", { name: "Falta tu perfil" }),
  ).toBeVisible();
});
