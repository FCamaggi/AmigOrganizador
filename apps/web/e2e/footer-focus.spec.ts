import { expect, type Page, test } from "@playwright/test";

async function createGroupWithProfile(page: Page): Promise<string> {
  await page.goto("/grupos/nuevo");
  await page.getByLabel("¿Cómo se llama el grupo?").fill("Asado foco");
  await page.getByLabel("Tu nombre").fill("Ana");
  await page.getByRole("button", { name: "Crear y compartir" }).click();
  await page.waitForURL(/\/g\/[A-Za-z0-9_-]+$/);
  const groupPath = new URL(page.url()).pathname;

  await page.getByRole("link", { name: "Armar mi perfil" }).click();
  await page.waitForURL(/\/perfil/);
  await page.getByRole("button", { name: "Guardar perfil" }).click();
  await page.waitForURL(`**${groupPath}`);
  return groupPath;
}

test("at 390x844, keyboard focus on the last option row is not covered by the sticky footer", async ({
  page,
  browser,
}) => {
  const groupPath = await createGroupWithProfile(page);

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const member = await context.newPage();

  // Follow the sign-in/join flow from groups.spec.ts, then save a profile so
  // the group renders several ranked option rows.
  await member.goto(groupPath);
  await member.getByRole("link", { name: "Unirme" }).click();
  await member.getByLabel("Tu nombre").fill("Beto");
  await member.getByRole("button", { name: "Entrar" }).click();
  await member.waitForURL(`**${groupPath}`);
  await member.getByRole("button", { name: "Unirme al grupo" }).click();
  await member.waitForURL(/\/perfil/);
  // Empty profile: pick "Trabajo" and close its sheet, so the profile has a routine.
  await member.getByRole("button", { name: "Trabajo" }).click();
  await member
    .getByRole("dialog")
    .getByRole("button", { name: "Listo" })
    .click();
  await member.getByRole("button", { name: "Guardar perfil" }).click();
  await member.waitForURL(`**${groupPath}`);

  // Expand "Ver más días" so all option rows are reachable and the last option
  // row sits near the bottom of the list above the sticky footer.
  const moreToggle = member.locator("details summary", {
    hasText: "Ver más días",
  });
  await expect(moreToggle).toBeVisible();
  await moreToggle.click();

  const options = member.locator('input[name="option"]');
  const optionCount = await options.count();
  expect(optionCount).toBeGreaterThanOrEqual(4);

  // Tab until the option radio group receives keyboard focus, then ArrowDown
  // to the last option row control.
  let reachedOptions = false;
  for (let i = 0; i < 60; i++) {
    await member.keyboard.press("Tab");
    const onOption = await member.evaluate(
      () =>
        document.activeElement instanceof HTMLInputElement &&
        document.activeElement.name === "option",
    );
    if (onOption) {
      reachedOptions = true;
      break;
    }
  }
  expect(reachedOptions).toBe(true);

  for (let i = 0; i < optionCount - 1; i++) {
    await member.keyboard.press("ArrowDown");
  }

  const lastOption = options.last();
  await expect(lastOption).toBeFocused();

  const optionBox = await lastOption.boundingBox();
  const rowBox = await lastOption.locator("..").boundingBox();
  const footerBox = await member
    .locator("footer.sticky-footer:visible")
    .boundingBox();

  expect(optionBox).not.toBeNull();
  expect(rowBox).not.toBeNull();
  expect(footerBox).not.toBeNull();
  if (!optionBox || !rowBox || !footerBox) return;

  expect(optionBox.y).toBeGreaterThanOrEqual(0);
  expect(optionBox.y + optionBox.height).toBeLessThanOrEqual(footerBox.y);
  expect(rowBox.y + rowBox.height).toBeLessThanOrEqual(footerBox.y);

  await context.close();
});
