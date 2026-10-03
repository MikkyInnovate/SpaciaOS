import { after, type NextRequest } from "next/server";
import { fail, fromZod, joinSchema, joinWaitlist, ok, sendWelcomeEmail } from "@/lib/waitlist/server";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = joinSchema.safeParse(body ?? {});
  if (!parsed.success) return fromZod(parsed.error);

  try {
    const ip =
      request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      undefined;
    const { created, result } = await joinWaitlist(parsed.data, {
      ip,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });
    if (created) {
      const origin = request.nextUrl.origin;
      after(() =>
        sendWelcomeEmail(parsed.data.email, result.position, result.referralCode, origin).catch((err) =>
          console.error("[waitlist] welcome email failed", err)
        )
      );
    }
    return ok(result);
  } catch (err) {
    console.error("[waitlist] join failed", err);
    return fail(500, "We couldn't save your spot. Please try again.");
  }
}
