import type { AvailabilityState } from "@amigo/core";

// Placeholder until Phase 1; proves the web app consumes the pure core package.
const states: readonly AvailabilityState[] = ["free", "busy", "unknown"];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-4">
      <h1 className="font-semibold text-3xl">AmigOrganizador</h1>
      <p>Fase 0: base del proyecto lista.</p>
      <p className="text-sm opacity-70">
        Estados de disponibilidad: {states.join(" · ")}
      </p>
    </main>
  );
}
