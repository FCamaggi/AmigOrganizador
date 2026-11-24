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

  // S4: change name inline and see it updated in the group
  await page.getByRole("button", { name: "Editar tu nombre: Ana" }).click();
  const nameInput = page.getByRole("textbox", { name: "Tu nombre" });
  await expect(nameInput).toHaveValue("Ana");
  await nameInput.fill("Ana María");
  await page.getByRole("button", { name: "Guardar nombre" }).click();
  await expect(page.getByText("Nombre guardado")).toBeVisible();

  // S5: refusing to delete the default schedule inside the schedules sheet
  await page.getByRole("button", { name: /Mi horario/ }).click();
  const schedulesDialog = page.getByRole("dialog", {
    name: "Gestionar horarios",
  });
  await expect(schedulesDialog).toBeVisible();
  await schedulesDialog.getByRole("button", { name: "Borrar horario" }).click();
  await expect(
    schedulesDialog.getByText(
      "No puedes borrar tu horario principal. Deja otro como principal primero.",
    ),
  ).toBeVisible();

  await page.goto(groupPath);
  await expect(page.getByText("Ana María")).toBeVisible();

  // S5: create a second schedule
  await page.goto(`/perfil?next=${encodeURIComponent(groupPath)}`);
  await expect(page.getByRole("heading", { name: "Tu perfil" })).toBeVisible();
  await page.getByRole("button", { name: /Mi horario/ }).click();
  const createDialog = page.getByRole("dialog", { name: "Gestionar horarios" });
  await createDialog.getByLabel("Nuevo horario").fill("Semana intensa");
  await createDialog.getByRole("button", { name: "Crear horario" }).click();
  await page.waitForURL(/\/perfil\?horario=/);

  // S2, S3, S6: pick Trabajo from the empty state, set 08:30-17:15, and see sentence before saving
  await expect(page.getByText("¿Qué ocupa tu semana?")).toBeVisible();
  await page.getByRole("button", { name: "Trabajo" }).click();
  const editDialog = page.getByRole("dialog", { name: "Editar rutina" });
  await expect(editDialog).toBeVisible();
  await expect(
    editDialog.getByText("Semanal: se repite los mismos días de la semana"),
  ).toBeVisible();
  await editDialog.getByLabel("Hora de inicio").fill("08:30");
  await editDialog.getByLabel("Hora de término").fill("17:15");
  await expect(
    editDialog.getByText(
      "Vas a marcar ocupado: lunes a viernes, de 08:30 a 17:15",
    ),
  ).toBeVisible();
  await editDialog.getByRole("button", { name: "Listo" }).click();
  await expect(editDialog).toBeHidden();
  await expect(page.getByText("Lun–Vie 08:30–17:15")).toBeVisible();

  // S7, S8: add a cycle routine with custom shift hours via "+ Agregar rutina"
  await page.getByRole("button", { name: "+ Agregar rutina" }).click();
  const newDialog = page.getByRole("dialog", { name: "Nueva rutina" });
  await expect(newDialog).toBeVisible();
  await newDialog.getByRole("button", { name: "Turnos" }).click();
  await expect(
    newDialog.getByText("Ciclo: se repite cada N días, sin importar el día"),
  ).toBeVisible();
  await newDialog.getByLabel("Día 1 Hora de inicio").fill("07:30");
  await newDialog.getByLabel("Día 1 Hora de término").fill("19:30");
  await expect(
    newDialog.getByText(
      /Ciclo de 4 días desde el .*: día 1 07:30–19:30, día 2 20:00–08:00 \(\+1\), días 3–4 libre/,
    ),
  ).toBeVisible();
  await newDialog.getByRole("button", { name: "Listo" }).click();
  await expect(newDialog).toBeHidden();

  // S1: toggle "Por hora" granularity and back to "Por bloques" in Días puntuales sheet
  await page.getByRole("button", { name: "Días puntuales" }).click();
  const daysDialog = page.getByRole("dialog", { name: "Días puntuales" });
  await expect(daysDialog).toBeVisible();
  await daysDialog.getByRole("button", { name: "Por hora" }).click();
  await expect(
    daysDialog.getByRole("button", { name: "Agregar hora ocupada" }).first(),
  ).toBeVisible();
  await daysDialog.getByRole("button", { name: "Por bloques" }).click();
  await daysDialog.getByRole("button", { name: "Listo" }).click();
  await expect(daysDialog).toBeHidden();

  // Pager between week 1 and week 2 works on Tu semana
  await page.getByRole("button", { name: "Semana siguiente" }).click();
  await page.getByRole("button", { name: "Semana anterior" }).click();

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
