import { expect, type Page, test } from "@playwright/test";

async function pickThread(page: Page, color: string): Promise<void> {
  await page.goto("/perfil");
  await page
    .getByRole("button", { name: /Cambiar el color de tu hilo/ })
    .click();
  await page.getByRole("radio", { name: color }).check({ force: true });
  await page.getByRole("button", { name: "Guardar color" }).click();
  await expect(
    page.getByRole("button", {
      name: `Cambiar el color de tu hilo: ${color.toLowerCase()}`,
    }),
  ).toBeVisible();
}

test("each person picks a thread colour; on a clash whoever joined first keeps it", async ({
  page,
  browser,
}) => {
  await page.goto("/grupos/nuevo");
  await page.getByLabel("¿Cómo se llama el grupo?").fill("Hilos e2e");
  await page.getByLabel("Tu nombre").fill("Ana");
  await page.getByRole("button", { name: "Crear y compartir" }).click();
  await page.waitForURL(/\/g\/[A-Za-z0-9_-]+$/);
  const groupPath = new URL(page.url()).pathname;
  await pickThread(page, "ciruela");

  const friend = await (await browser.newContext()).newPage();
  await friend.goto(groupPath);
  await friend.getByRole("link", { name: "Unirme" }).click();
  await friend.getByLabel("Tu nombre").fill("Beto");
  await friend.getByRole("button", { name: "Entrar" }).click();
  await friend.waitForURL(`**${groupPath}`);
  await friend.getByRole("button", { name: "Unirme al grupo" }).click();
  await pickThread(friend, "ciruela");

  await friend.goto(groupPath);
  await expect(
    friend.getByText(
      "En este grupo tu hilo se ve turquesa: Ana llegó antes con ciruela.",
    ),
  ).toBeVisible();
  const chips = friend
    .getByRole("list", { name: /persona/ })
    .getByRole("listitem");
  const chipColor = (name: string) =>
    chips
      .filter({ hasText: name })
      .locator(".yarn")
      .first()
      .getAttribute("style");
  expect(await chipColor("Ana")).toContain("thread-plum");
  expect(await chipColor("Beto")).toContain("thread-teal");

  // Ana kept her colour, so she gets no note.
  await page.goto(groupPath);
  await expect(page.getByText(/En este grupo tu hilo se ve/)).toBeHidden();
});
