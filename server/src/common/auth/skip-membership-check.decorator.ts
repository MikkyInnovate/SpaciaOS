import { SetMetadata } from "@nestjs/common";

export const SKIP_MEMBERSHIP_CHECK_KEY = "skipMembershipCheck";

/**
 * Decorator to bypass WorkspaceMemberGuard while still requiring ClerkAuthGuard.
 * Used for onboarding and initial sync endpoints where the DB membership record
 * does not yet exist.
 */
export const SkipMembershipCheck = () =>
  SetMetadata(SKIP_MEMBERSHIP_CHECK_KEY, true);
