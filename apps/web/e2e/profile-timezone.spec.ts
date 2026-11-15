import { expect, test } from "@playwright/test";

test("a person saves the zone they write their times in", async ({ page }) => {
  await page.goto("/entrar?next=/perfil");
  await page.getByLabel("Tu nombre").fill("Inés");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL("**/perfil");

  const zone = page.getByLabel("Tu zona horaria");
  await expect(zone).toHaveValue("America/Santiago");
  await zone.selectOption("Europe/Madrid");
  await page.getByRole("button", { name: "Guardar perfil" }).click();
  await expect(page.getByText("Perfil guardado")).toBeVisible();

  await page.reload();
  await expect(page.getByLabel("Tu zona horaria")).toHaveValue("Europe/Madrid");
});
