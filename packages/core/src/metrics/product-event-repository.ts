import type { ProductEvent } from "./product-event";

/** Port for recording product events in our own store (no third-party analytics). */
export interface ProductEventRepository {
  record(event: ProductEvent): Promise<void>;
}
