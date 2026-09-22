import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC_KEY = "isPublic";

/**
 * Marks an endpoint as public, bypassing Clerk session token verification and tenant resolution.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
