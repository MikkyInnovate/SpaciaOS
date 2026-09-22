import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { createClerkClient, verifyToken } from "@clerk/backend";
import { EnvService } from "../../config/env.service";

export interface VerifiedClerkSession {
  userId: string;
  orgId?: string | null;
  orgRole?: string | null;
  orgSlug?: string | null;
  orgPermissions?: string[];
  claims: Record<string, any>;
}

@Injectable()
export class ClerkService {
  private readonly logger = new Logger(ClerkService.name);
  private readonly clerkClient: ReturnType<typeof createClerkClient>;

  constructor(private readonly envService: EnvService) {
    this.clerkClient = createClerkClient({
      secretKey: this.envService.clerkSecretKey,
      publishableKey: this.envService.clerkPublishableKey,
    });
  }

  getClient(): ReturnType<typeof createClerkClient> {
    return this.clerkClient;
  }

  /**
   * Verifies a Clerk session JWT token and extracts tenant & identity claims.
   */
  async verifySessionToken(token: string): Promise<VerifiedClerkSession> {
    // Check for mock token in test / development mode only
    if (
      process.env.NODE_ENV === "test" ||
      process.env.ALLOW_MOCK_AUTH === "true"
    ) {
      if (token.startsWith("mock_token_")) {
        return this.parseMockToken(token);
      }
    }

    try {
      const claims = await verifyToken(token, {
        secretKey: this.envService.clerkSecretKey,
      });

      const userId = (claims.sub as string) || (claims.userId as string);
      if (!userId) {
        throw new UnauthorizedException({
          code: "INVALID_TOKEN",
          message: "Token missing required 'sub' (userId) claim.",
        });
      }

      // Clerk JWT session claims
      const orgId = (claims.org_id as string) || (claims.orgId as string) || null;
      const orgRole = (claims.org_role as string) || (claims.orgRole as string) || null;
      const orgSlug = (claims.org_slug as string) || (claims.orgSlug as string) || null;
      const orgPermissions =
        (claims.org_permissions as string[]) || (claims.orgPermissions as string[]) || [];

      return {
        userId,
        orgId,
        orgRole,
        orgSlug,
        orgPermissions,
        claims,
      };
    } catch (err: any) {
      this.logger.warn(`Clerk token verification failed: ${err?.message || err}`);
      throw new UnauthorizedException({
        code: "UNAUTHORIZED",
        message: err?.message || "Invalid or expired Clerk session token.",
      });
    }
  }

  /**
   * Mock token parser for deterministic isolation and auth testing in test/dev environments.
   * Format: mock_token_{userId}:{orgId}:{orgRole}:{orgSlug}
   * Example: mock_token_user_123:org_abc:admin:pacia-corp
   */
  private parseMockToken(token: string): VerifiedClerkSession {
    const raw = token.replace("mock_token_", "");
    let parts: string[];
    if (raw.includes("|")) {
      parts = raw.split("|");
    } else {
      parts = raw.split(":");
      if (parts[2] === "org" && parts.length >= 4) {
        parts = [parts[0], parts[1], `org:${parts[3]}`, parts[4]];
      }
    }
    const [userId, orgId, orgRole, orgSlug] = parts;

    return {
      userId: userId || "user_test",
      orgId: orgId && orgId !== "none" ? orgId : null,
      orgRole: orgRole && orgRole !== "none" ? orgRole : null,
      orgSlug: orgSlug && orgSlug !== "none" ? orgSlug : null,
      orgPermissions: [],
      claims: { sub: userId, org_id: orgId, org_role: orgRole, mock: true },
    };
  }
}
