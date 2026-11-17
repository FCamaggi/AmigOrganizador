import { expect, test } from "@playwright/test";

test("sets your name, creates a second schedule with weekly 08:30-17:15 and custom cycle hours, and chooses it in a group", async ({
  page,
}) => {
  await page.goto("/grupos/nuevo");
  await page.getByLabel("¿Cómo se llama el grupo?").fill("Grupo Turnos");
  await page.getByLabel("Tu nombre").fill("Ana");
  await page.getByRole("button", { name: "Crear y compartir" }).click();
  await page.waitForURL(/\/g\/[A-Za-z0-9_-]+$/);
  const groupPath = new URL(page.url()).pathname;

  await expect(
    page.getByText("Este grupo ve tu horario: Mi horario"),
  ).toBeVisible();
  await page.getByRole("link", { name: "Crear otro horario" }).click();
  await expect(page.getByRole("heading", { name: "Tu perfil" })).toBeVisible();

  // S4: change name and see it updated in the group
  const nameInput = page.getByRole("textbox", { name: "Tu nombre" });
  await expect(nameInput).toHaveValue("Ana");
  await nameInput.fill("Ana María");
  await page.getByRole("button", { name: "Guardar nombre" }).click();
  await expect(page.getByText("Nombre guardado")).toBeVisible();

  // S5: refusing to delete the default schedule
  await page.getByRole("button", { name: "Borrar horario" }).click();
  await expect(
    page.getByText(
      "No puedes borrar tu horario principal. Deja otro como principal primero.",
    ),
  ).toBeVisible();

  await page.goto(groupPath);
  await expect(page.getByText("Ana María")).toBeVisible();

  // S5: create a second schedule
  await page.goto(`/perfil?next=${encodeURIComponent(groupPath)}`);
  await expect(page.getByRole("heading", { name: "Tu perfil" })).toBeVisible();
  await page.getByLabel("Nuevo horario").fill("Semana intensa");
  await page.getByRole("button", { name: "Crear horario" }).click();
  await page.waitForURL(/\/perfil\?horario=/);

  // S2, S3, S6: add a weekly routine with 08:30-17:15 and see sentence before saving
  await page.getByRole("button", { name: "Agregar rutina semanal" }).click();
  await expect(
    page.getByText("Semanal: se repite los mismos días de la semana"),
  ).toBeVisible();
  await page.getByLabel("Hora de inicio").fill("08:30");
  await page.getByLabel("Hora de término").fill("17:15");
  await expect(
    page.getByText("Vas a marcar ocupado: lunes a viernes, de 08:30 a 17:15"),
  ).toBeVisible();

  // S7, S8: add a cycle routine with custom shift hours
  await page.getByRole("button", { name: "Agregar ciclo de turnos" }).click();
  await expect(
    page.getByText("Ciclo: se repite cada N días, sin importar el día"),
  ).toBeVisible();
  await page.getByLabel("Día 1 Hora de inicio").fill("07:30");
  await page.getByLabel("Día 1 Hora de término").fill("19:30");
  await expect(
    page.getByText(
      /Ciclo de 4 días desde el .*: día 1 07:30–19:30, día 2 20:00–08:00 \(\+1\), días 3–4 libre/,
    ),
  ).toBeVisible();

  // S1: toggle "Por hora" granularity and back to "Por bloques"
  await page.getByRole("button", { name: "Por hora" }).click();
  await expect(
    page.getByRole("button", { name: "Agregar hora ocupada" }).first(),
  ).toBeVisible();
  await page.getByRole("button", { name: "Por bloques" }).click();

  await page.getByRole("button", { name: "Guardar perfil" }).click();
  await page.waitForURL(`**${groupPath}`);

  // T6: choose the second schedule in the group
  const scheduleSelect = page.getByLabel("Este grupo ve tu horario:");
  await expect(scheduleSelect).toBeVisible();
  await scheduleSelect.selectOption({ label: "Semana intensa" });
  await page.getByRole("button", { name: "Cambiar horario" }).click();

  await page.reload();
  const selectedText = await page
    .getByLabel("Este grupo ve tu horario:")
    .locator("option:checked")
    .textContent();
  expect(selectedText).toBe("Semana intensa");
});
