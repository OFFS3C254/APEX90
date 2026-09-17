import { db } from "./db";
import { ensureDefaultAdmin } from "./auth";

/**
 * Initializes default system state (Admin credentials only).
 * Mock predictions auto-seeding is disabled so the app starts with a clean slate for real predictions.
 */
export async function seedInitialData() {
  await ensureDefaultAdmin();
}
