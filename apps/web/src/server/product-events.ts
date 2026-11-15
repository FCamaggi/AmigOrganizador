import type { ProductEvent } from "@amigo/core";
import { productEvents } from "./repository";

/**
 * Records a product event for the exit test. Measuring must never break
 * what the person was doing, so a failure is logged and swallowed.
 */
export async function track(event: ProductEvent): Promise<void> {
  try {
    await productEvents().record(event);
  } catch (error) {
    console.error(
      `product event ${event.kind} not recorded:`,
      error instanceof Error ? error.message : "unknown error",
    );
  }
}
