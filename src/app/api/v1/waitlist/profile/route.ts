import { fail, fromZod, ok, profileSchema, updateProfile } from "@/lib/waitlist/server";

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = profileSchema.safeParse(body ?? {});
  if (!parsed.success) return fromZod(parsed.error);

  try {
    const result = await updateProfile(parsed.data);
    if (!result) return fail(404, "We couldn't find your waitlist spot. Please join again with your email.");
    return ok(result);
  } catch (err) {
    console.error("[waitlist] profile update failed", err);
    return fail(500, "We couldn't save your details. Please try again.");
  }
}
