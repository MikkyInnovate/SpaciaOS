import { fail, getStats, ok } from "@/lib/waitlist/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return ok(await getStats());
  } catch (err) {
    console.error("[waitlist] stats failed", err);
    return fail(503, "Waitlist stats are unavailable right now.");
  }
}
