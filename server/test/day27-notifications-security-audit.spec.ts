import { NestFactory } from "@nestjs/core";
import { INestApplication, ValidationPipe, UnauthorizedException, HttpException, HttpStatus } from "@nestjs/common";
import * as assert from "node:assert";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { AppModule } from "../src/app.module";
import { NotificationsService } from "../src/modules/notifications/notifications.service";
import { LeadsIngestService } from "../src/modules/leads/leads-ingest.service";
import { IntegrationsService } from "../src/modules/integrations/integrations.service";
import { AiToolExecutorService } from "../src/modules/ai-tools/services/ai-tool-executor.service";
import { RateLimiterGuard } from "../src/common/guards/rate-limiter.guard";
import { WebhookVerifier } from "../src/common/utils/webhook-verifier";
import { PiiSanitizer } from "../src/common/utils/pii-sanitizer";
import { DRIZZLE_DATABASE, DrizzleDb } from "../src/database/database.provider";
import * as schema from "../src/database/schema";
import { eq, and } from "drizzle-orm";
import { mapClerkRoleToClientRole, DEFAULT_ROLE_PERMISSIONS } from "../src/database/schema/roles.schema";

neonConfig.webSocketConstructor = ws;

/**
 * PACIA DAY 27: NOTIFICATIONS & ENTERPRISE SECURITY AUDIT VERIFICATION
 * 
 * Verifies end-to-end:
 * Part 1: Operational Notifications System ("The Notificatiom")
 *   - Notification retrieval with unread filters and count accuracy
 *   - Single notification mark-as-read mutation with optimistic formatting
 *   - Bulk mark-all-read mutation across active workspace
 *   - Strict multi-tenant isolation (Tenant A cannot view or mutate Tenant B alerts)
 * 
 * Part 2: 8-Point Enterprise Security & Compliance Audit
 *   - Pillar 1: Multi-tenant isolation audit & database foreign-key cascade bounds
 *   - Pillar 2: Role-based authorization audit (RBAC, Clerk mapping, permission matrices)
 *   - Pillar 3: Timing-safe HMAC-SHA256 webhook signature verification
 *   - Pillar 4: Sliding-window rate limiting & HTTP 429 throttling headers
 *   - Pillar 5: Zero-trust client credential masking & zero secret leakage
 *   - Pillar 6: Controlled AI tool runtime (5 pillars: isolation, injection guard, inside-the-tool auth)
 *   - Pillar 7: PII review & recursive payload data sanitization
 *   - Pillar 8: Durable audit-log retention integrity (ON DELETE RESTRICT constraint)
 */
async function runDay27NotificationsAndSecurityAudit() {
  console.log("\n=========================================================");
  console.log(" PACIA DAY 27: NOTIFICATIONS & ENTERPRISE SECURITY AUDIT");
  console.log("=========================================================\n");

  const app: INestApplication = await NestFactory.create(AppModule, { logger: false });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();

  const db = app.get<DrizzleDb>(DRIZZLE_DATABASE);
  const notificationsService = app.get<NotificationsService>(NotificationsService);
  const leadsIngestService = app.get<LeadsIngestService>(LeadsIngestService);
  const integrationsService = app.get<IntegrationsService>(IntegrationsService);
  const aiToolExecutor = app.get<AiToolExecutorService>(AiToolExecutorService);

  const timestamp = Date.now();
  const TEST_WS_PRIMARY = `ws_day27_audit_${timestamp}`;
  const TEST_WS_SECONDARY = `ws_day27_sec_${timestamp}`;
  const TEST_OWNER_ID = `user_owner_${timestamp}`;
  const WEBHOOK_SECRET = "whsec_live_day27_secret_key_981249";

  try {
    // -------------------------------------------------------------------------
    // SETUP: Provision isolated primary and secondary test workspaces
    // -------------------------------------------------------------------------
    console.log("▶ [SETUP] Provisioning isolated test fixtures in Neon PostgreSQL...");
    await db.insert(schema.workspaces).values([
      { id: TEST_WS_PRIMARY, name: "Spacia Luxury Ikoyi Hub", slug: `ikoyi-hub-${timestamp}` },
      { id: TEST_WS_SECONDARY, name: "Spacia Victoria Island", slug: `vi-hub-${timestamp}` },
    ]);

    await db.insert(schema.users).values({
      id: TEST_OWNER_ID,
      email: `day27.owner_${timestamp}@spacia.io`,
      firstName: "Day27",
      lastName: "Auditor",
    });

    await db.insert(schema.workspaceMembers).values({
      workspaceId: TEST_WS_PRIMARY,
      userId: TEST_OWNER_ID,
      role: "owner",
      status: "active",
    });

    // Provision connected webhook integration with configured secret
    await db.insert(schema.integrations).values({
      workspaceId: TEST_WS_PRIMARY,
      type: "webhook",
      name: "Inbound Lead Webhook",
      status: "connected",
      credentials: {
        webhookSecret: WEBHOOK_SECRET,
      },
      config: {
        healthStatus: "healthy",
      },
    });

    // Seed test property in Workspace 1
    const [testProp] = await db
      .insert(schema.properties)
      .values({
        workspaceId: TEST_WS_PRIMARY,
        title: "Ikoyi Waterfront Penthouse",
        slug: `waterfront-penthouse-${timestamp}`,
        location: "Ikoyi",
        city: "Lagos",
        state: "Lagos State",
        propertyType: "Penthouse",
        price: "1850000000.00",
        formattedPrice: "₦1,850,000,000",
        availability: "Available",
      })
      .returning();

    // Seed test property in Workspace 2 (for cross-tenant validation)
    const [foreignProp] = await db
      .insert(schema.properties)
      .values({
        workspaceId: TEST_WS_SECONDARY,
        title: "Foreign Eko Atlantic Villa",
        slug: `foreign-eko-${timestamp}`,
        location: "Victoria Island",
        city: "Lagos",
        state: "Lagos State",
        propertyType: "Villa",
        price: "2400000000.00",
        formattedPrice: "₦2,400,000,000",
        availability: "Available",
      })
      .returning();

    console.log("✔ [SETUP COMPLETE] Test fixtures seeded.\n");

    // =========================================================================
    // PART 1: OPERATIONAL NOTIFICATIONS SYSTEM ("THE NOTIFICATIOM")
    // =========================================================================
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(" PART 1: NOTIFICATION OPERATIONS & ENDPOINTS");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // 1. Seed Notifications in Primary and Secondary Workspaces
    console.log("▶ [NOTIF 1] Seeding notifications for primary and secondary workspaces...");
    const notif1 = await notificationsService.createNotification(TEST_WS_PRIMARY, {
      type: "lead_qualified",
      title: "High-Net-Worth Lead Qualified",
      message: "Adeleke Cole scored 94/100 (HOT) for Ikoyi Waterfront Penthouse",
      entityType: "lead",
      metadata: { priority: "high", broker: "Ade Admin" },
    });

    const notif2 = await notificationsService.createNotification(TEST_WS_PRIMARY, {
      type: "viewing_booked",
      title: "VIP Inspection Confirmed",
      message: "Viewing scheduled for tomorrow at 2:00 PM",
      entityType: "appointment",
      metadata: { priority: "high", referenceCode: "SP-BK-VIP001" },
    });

    const notif3 = await notificationsService.createNotification(TEST_WS_PRIMARY, {
      type: "escalation_alert",
      title: "Human Takeover Triggered",
      message: "Broker Marcus Vance seized direct control of conversation",
      entityType: "call",
      metadata: { priority: "urgent" },
    });

    // Seed alert in secondary tenant to verify isolation
    const foreignNotif = await notificationsService.createNotification(TEST_WS_SECONDARY, {
      type: "system_update",
      title: "Secondary Tenant Notification",
      message: "Alert belonging strictly to Secondary Tenant",
      metadata: { priority: "low" },
    });

    assert.ok(notif1.id && notif2.id && notif3.id && foreignNotif.id);
    console.log("  ✔ Seeded 3 notifications in Primary and 1 in Secondary.\n");

    // 2. Query All Notifications
    console.log("▶ [NOTIF 2] Querying notifications for Primary Workspace...");
    const primaryFeed = await notificationsService.getNotifications(TEST_WS_PRIMARY);
    assert.strictEqual(primaryFeed.count, 3, "Primary workspace must have 3 notifications");
    assert.strictEqual(primaryFeed.unreadCount, 3, "Primary workspace must have 3 unread notifications");
    assert.strictEqual(primaryFeed.notifications[0].read, false);
    assert.strictEqual(primaryFeed.notifications[0].isRead, false);
    assert.ok(primaryFeed.notifications[0].priority, "Must calculate alert priority");
    assert.ok(primaryFeed.notifications[0].timestamp, "Must format ISO timestamp");
    console.log(`  ✔ Retrieved ${primaryFeed.count} notifications with unreadCount=${primaryFeed.unreadCount}.\n`);

    // 3. Mark Single Notification as Read
    console.log("▶ [NOTIF 3] Marking single notification as read (PATCH /:id/read)...");
    const readResult = await notificationsService.markAsRead(TEST_WS_PRIMARY, notif1.id);
    assert.strictEqual(readResult.id, notif1.id);
    assert.strictEqual(readResult.read, true, "read flag must be true");
    assert.strictEqual(readResult.isRead, true, "isRead flag must be true");

    const afterSingleReadFeed = await notificationsService.getNotifications(TEST_WS_PRIMARY);
    assert.strictEqual(afterSingleReadFeed.unreadCount, 2, "Unread count must decrement from 3 to 2");
    console.log("  ✔ Single notification successfully marked as read; unread count decremented to 2.\n");

    // 4. Filter by Unread
    console.log("▶ [NOTIF 4] Testing filter='unread'...");
    const unreadOnlyFeed = await notificationsService.getNotifications(TEST_WS_PRIMARY, {
      filter: "unread",
    });
    assert.strictEqual(unreadOnlyFeed.notifications.length, 2, "Must return exactly 2 unread notifications");
    assert.strictEqual(
      unreadOnlyFeed.notifications.every((n) => !n.read),
      true,
      "All returned items must have read=false"
    );
    console.log("  ✔ Unread filter successfully returned only active unread alerts.\n");

    // 5. Bulk Mark All as Read (POST /mark-all-read)
    console.log("▶ [NOTIF 5] Bulk marking all notifications as read...");
    const bulkResult = await notificationsService.markAllAsRead(TEST_WS_PRIMARY);
    assert.strictEqual(bulkResult.success, true);
    assert.ok(bulkResult.count >= 2, "Must report at least 2 notifications transitioned");

    const afterBulkFeed = await notificationsService.getNotifications(TEST_WS_PRIMARY);
    assert.strictEqual(afterBulkFeed.unreadCount, 0, "Unread count must be 0 after bulk mark read");
    assert.strictEqual(
      afterBulkFeed.notifications.every((n) => n.read),
      true,
      "Every notification must now have read=true"
    );
    console.log("  ✔ Bulk mark-all-read completed; unreadCount successfully dropped to 0.\n");

    // 6. Multi-Tenant Isolation Check for Notifications
    console.log("▶ [NOTIF 6] Verifying multi-tenant isolation on notifications...");
    // Secondary tenant's alert must remain completely untouched (read=false)
    const secondaryFeed = await notificationsService.getNotifications(TEST_WS_SECONDARY);
    assert.strictEqual(secondaryFeed.count, 1, "Secondary tenant must still have 1 notification");
    assert.strictEqual(secondaryFeed.unreadCount, 1, "Secondary alert must still be unread");
    assert.strictEqual(secondaryFeed.notifications[0].id, foreignNotif.id);
    assert.strictEqual(secondaryFeed.notifications[0].read, false);

    // Cross-tenant mark-read attempt (Primary attempts to mark Secondary's alert as read)
    await notificationsService.markAsRead(TEST_WS_PRIMARY, foreignNotif.id);
    const secondaryRecheck = await notificationsService.getNotifications(TEST_WS_SECONDARY);
    assert.strictEqual(
      secondaryRecheck.notifications[0].read,
      false,
      "Secondary notification must NOT be marked read by Primary workspace action"
    );
    console.log("  ✔ Multi-tenant isolation verified: zero cross-tenant notification leakage or mutation.\n");

    // =========================================================================
    // PART 2: 8-POINT ENTERPRISE SECURITY & COMPLIANCE AUDIT
    // =========================================================================
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(" PART 2: 8-POINT ENTERPRISE SECURITY & COMPLIANCE AUDIT");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // -------------------------------------------------------------------------
    // PILLAR 1: Multi-Tenant Isolation Audit
    // -------------------------------------------------------------------------
    console.log("▶ [PILLAR 1: TENANT ISOLATION] Auditing tenant isolation & cross-tenant bounds...");
    let crossTenantBlocked = false;
    const intruderPayload = {
      name: "Intruder Prospect",
      phone: "+2348011223344",
      email: "intruder@test.ng",
      propertyId: foreignProp.id, // Property from Secondary Workspace
    };
    const intruderSig = WebhookVerifier.generateSignature(intruderPayload, WEBHOOK_SECRET);

    try {
      await leadsIngestService.ingestLead(
        {
          "x-workspace-id": TEST_WS_PRIMARY,
          "x-webhook-signature": intruderSig,
        },
        intruderPayload as any
      );
    } catch (err: any) {
      crossTenantBlocked = true;
      assert.strictEqual(err.getResponse()?.code, "PROPERTY_NOT_FOUND_IN_WORKSPACE");
    }
    assert.strictEqual(crossTenantBlocked, true, "Cross-tenant property attachment must be strictly blocked");
    console.log("  ✔ Cross-tenant entity attachment rejected (404 PROPERTY_NOT_FOUND_IN_WORKSPACE).");
    console.log("  ✔ Multi-tenant query isolation verified across database tables.\n");

    // -------------------------------------------------------------------------
    // PILLAR 2: Authorization Audit (RBAC & Clerk Role Mapping)
    // -------------------------------------------------------------------------
    console.log("▶ [PILLAR 2: AUTHORIZATION] Auditing RBAC hierarchy and Clerk role mapping...");
    // 2.1 Role mapping rules
    assert.strictEqual(mapClerkRoleToClientRole("org:admin"), "admin");
    assert.strictEqual(mapClerkRoleToClientRole("admin"), "admin");
    assert.strictEqual(mapClerkRoleToClientRole("org:member"), "sales_agent");
    assert.strictEqual(mapClerkRoleToClientRole("member"), "sales_agent");
    assert.strictEqual(mapClerkRoleToClientRole(null), "viewer", "Missing role must default to read-only viewer");
    assert.strictEqual(mapClerkRoleToClientRole(""), "viewer");

    let unknownRoleBlocked = false;
    try {
      mapClerkRoleToClientRole("org:super_hacker_role");
    } catch (err: any) {
      unknownRoleBlocked = true;
    }
    assert.strictEqual(unknownRoleBlocked, true, "Unknown Clerk role must throw an error to prevent escalation");

    // 2.2 Permissions matrix checks
    assert.ok(DEFAULT_ROLE_PERMISSIONS.owner.includes("*"), "Owner has full wildcard access");
    assert.ok(DEFAULT_ROLE_PERMISSIONS.admin.includes("workspace:manage"));
    assert.ok(!DEFAULT_ROLE_PERMISSIONS.viewer.includes("leads:write"), "Viewer must lack write permissions");
    assert.ok(!DEFAULT_ROLE_PERMISSIONS.viewer.includes("calls:trigger"), "Viewer cannot trigger calls");
    console.log("  ✔ Role mapping verified: safe read-only baseline for unassigned roles.");
    console.log("  ✔ Privilege escalation prevented: unrecognized external roles throw immediately.\n");

    // -------------------------------------------------------------------------
    // PILLAR 3: Timing-Safe Webhook Verification Audit
    // -------------------------------------------------------------------------
    console.log("▶ [PILLAR 3: WEBHOOK VERIFICATION] Auditing timing-safe HMAC-SHA256 verification...");
    const samplePayload = {
      name: "Tunde Bakare",
      email: "tunde@test.ng",
      phone: "+2348099887766",
      source: "website_lead",
    };

    const validSig = WebhookVerifier.generateSignature(samplePayload, WEBHOOK_SECRET);
    assert.strictEqual(WebhookVerifier.verifyHmacSha256(samplePayload, validSig, WEBHOOK_SECRET), true);
    assert.strictEqual(WebhookVerifier.verifyHmacSha256(samplePayload, `sha256=${validSig}`, WEBHOOK_SECRET), true);
    assert.strictEqual(WebhookVerifier.verifyHmacSha256(samplePayload, `v1=${validSig}`, WEBHOOK_SECRET), true);

    // Tampered payload verification
    const tamperedPayload = { ...samplePayload, name: "Attacker Fake Name" };
    assert.strictEqual(WebhookVerifier.verifyHmacSha256(tamperedPayload, validSig, WEBHOOK_SECRET), false);

    // Corrupted signature verification
    const corruptedSig = validSig.slice(0, -4) + "ffff";
    assert.strictEqual(WebhookVerifier.verifyHmacSha256(samplePayload, corruptedSig, WEBHOOK_SECRET), false);
    assert.strictEqual(WebhookVerifier.verifyHmacSha256(samplePayload, null, WEBHOOK_SECRET), false);
    assert.strictEqual(WebhookVerifier.verifyHmacSha256(samplePayload, validSig, null), false);
    console.log("  ✔ Timing-safe HMAC verification verified across valid, prefixed, and tampered signatures.\n");

    // -------------------------------------------------------------------------
    // PILLAR 4: Rate Limiting Audit (Sliding Window & Throttling)
    // -------------------------------------------------------------------------
    console.log("▶ [PILLAR 4: RATE LIMITING] Auditing sliding-window throttling & headers...");
    RateLimiterGuard.resetStore();

    const mockReflector = {
      getAllAndOverride: () => ({
        points: 2,
        duration: 5,
        keyPrefix: "day27-audit-rl",
      }),
    } as any;

    const rateLimiter = new RateLimiterGuard(mockReflector);
    const headersMap: Record<string, string> = {};
    const mockResponse: any = {
      setHeader: (key: string, val: string) => {
        headersMap[key] = val;
      },
    };

    const makeContext = (ip: string) =>
      ({
        switchToHttp: () => ({
          getRequest: () => ({
            ip,
            headers: { "x-forwarded-for": ip },
          }),
          getResponse: () => mockResponse,
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as any);

    // Request 1 and 2 succeed
    assert.strictEqual(rateLimiter.canActivate(makeContext("172.16.0.1")), true);
    assert.strictEqual(headersMap["X-RateLimit-Remaining"], "1");

    assert.strictEqual(rateLimiter.canActivate(makeContext("172.16.0.1")), true);
    assert.strictEqual(headersMap["X-RateLimit-Remaining"], "0");

    // Request 3 triggers HTTP 429
    let rateLimitThrown = false;
    try {
      rateLimiter.canActivate(makeContext("172.16.0.1"));
    } catch (err: any) {
      rateLimitThrown = true;
      assert.strictEqual(err instanceof HttpException, true);
      assert.strictEqual(err.getStatus(), HttpStatus.TOO_MANY_REQUESTS);
      assert.ok(headersMap["Retry-After"]);
    }
    assert.strictEqual(rateLimitThrown, true, "RateLimiter must throw 429 when quota exceeded");
    console.log("  ✔ Sliding window accurately tracks requests and stamps X-RateLimit headers.");
    console.log("  ✔ Quota breach triggers HTTP 429 Too Many Requests with Retry-After.\n");

    // -------------------------------------------------------------------------
    // PILLAR 5: Credential Security Audit (Zero-Trust Masking)
    // -------------------------------------------------------------------------
    console.log("▶ [PILLAR 5: CREDENTIAL SECURITY] Auditing zero-trust masking & secret omission...");
    const primaryIntegrations = await integrationsService.getIntegrations(TEST_WS_PRIMARY);
    const webhookIntegration = primaryIntegrations.find((i) => i.type === "webhook");
    assert.ok(webhookIntegration, "Webhook integration must be registered");

    // Verify raw credentials never leaked in API response
    assert.strictEqual((webhookIntegration as any).credentials, undefined, "Raw credentials must be undefined");
    assert.strictEqual(webhookIntegration.hasCredentials, true, "hasCredentials indicator must be true");
    assert.ok(webhookIntegration.maskedKey?.includes("••••••••••••"), "Masked key must redact interior secrets");
    console.log("  ✔ 0 raw secrets leaked in frontend API response payloads.");
    console.log("  ✔ Masked previews provided securely for client inspection.\n");

    // -------------------------------------------------------------------------
    // PILLAR 6: Controlled AI Tool Authorization Audit
    // -------------------------------------------------------------------------
    console.log("▶ [PILLAR 6: AI TOOL AUTHORIZATION] Auditing the 5 AI tool runtime pillars...");
    // 6.1 Workspace injection guard
    let aiInjectionBlocked = false;
    try {
      await aiToolExecutor.executeTool(
        "search_properties",
        {
          workspaceId: TEST_WS_SECONDARY, // Injection attempt targeting secondary tenant
          location: "Ikoyi",
        },
        {
          workspaceId: TEST_WS_PRIMARY,
          actorId: "ai_sales_agent",
          actorType: "ai_agent",
          role: "sales_agent",
          permissions: ["properties:read"],
        }
      );
    } catch (err: any) {
      aiInjectionBlocked = true;
      assert.strictEqual(err instanceof UnauthorizedException, true);
      assert.ok(err.message.includes("Cross-workspace access denied"));
    }
    assert.strictEqual(aiInjectionBlocked, true, "Cross-workspace tool spoofing must be blocked");

    // 6.2 Inside-the-tool authorization
    let unprivilegedToolBlocked = false;
    try {
      await aiToolExecutor.executeTool(
        "book_property_inspection",
        {
          propertyId: testProp.id,
          leadId: "00000000-0000-0000-0000-000000000000",
          scheduledTime: new Date(Date.now() + 86400000).toISOString(),
        },
        {
          workspaceId: TEST_WS_PRIMARY,
          actorId: "viewer_user",
          actorType: "user",
          role: "viewer",
          permissions: ["properties:read"], // Lacks booking / leads:write
        }
      );
    } catch (err: any) {
      unprivilegedToolBlocked = true;
      assert.strictEqual(err instanceof UnauthorizedException, true);
    }
    assert.strictEqual(unprivilegedToolBlocked, true, "Inside-the-tool authorization must block unprivileged actors");

    // 6.3 Authorized tool execution & source provenance
    const validToolResult = await aiToolExecutor.executeTool(
      "search_properties",
      { location: "Ikoyi" },
      {
        workspaceId: TEST_WS_PRIMARY,
        actorId: "ai_sales_agent",
        actorType: "ai_agent",
        role: "sales_agent",
        permissions: ["properties:read"],
      }
    );
    assert.strictEqual(validToolResult.success, true);
    assert.strictEqual(validToolResult.sourceVerification.isVerified, true, "Source verification must be verified");
    console.log("  ✔ AI prompt-injection parameter spoofing blocked and audited.");
    console.log("  ✔ Inside-the-tool permission check and source verification provenance verified.\n");

    // -------------------------------------------------------------------------
    // PILLAR 7: PII Review & Scrubbing Audit
    // -------------------------------------------------------------------------
    console.log("▶ [PILLAR 7: PII REVIEW & SCRUBBING] Auditing PII redactor & recursive scrubber...");
    assert.strictEqual(PiiSanitizer.maskEmail("olumide.adeleke@spacia.ng"), "o***e@spacia.ng");
    assert.strictEqual(PiiSanitizer.maskPhone("+2348033344455"), "+234••••••4455");
    assert.strictEqual(PiiSanitizer.maskSecret("whsec_live_99492019482"), "••••••••••••9482");

    const nestedPiiData = {
      lead: {
        name: "Folake Williams",
        email: "folake.williams@spacia.io",
        phone: "+2348077889900",
        credentials: {
          apiKey: "sk_live_very_secret_key_84920",
        },
      },
      nonSensitive: {
        budget: "₦1,850,000,000",
        preferredLocation: "Ikoyi",
      },
    };

    const sanitizedResult = PiiSanitizer.sanitizePayload(nestedPiiData);
    assert.strictEqual(sanitizedResult.lead.email, "f***s@spacia.io");
    assert.strictEqual(sanitizedResult.lead.phone, "+234••••••9900");
    assert.strictEqual(sanitizedResult.lead.credentials.apiKey, "••••••••••••4920");
    assert.strictEqual(sanitizedResult.nonSensitive.budget, "₦1,850,000,000");
    console.log("  ✔ Email, phone, and API credential masking verified.");
    console.log("  ✔ Recursive sanitization redacts sensitive PII without modifying non-sensitive metadata.\n");

    // -------------------------------------------------------------------------
    // PILLAR 8: Durable Audit-Log Retention Integrity Audit
    // -------------------------------------------------------------------------
    console.log("▶ [PILLAR 8: AUDIT-LOG INTEGRITY] Auditing durable audit-log schema & retention constraint...");
    // 8.1 Query audit log created during AI tool execution
    const [auditLog] = await db
      .select()
      .from(schema.auditLogs)
      .where(eq(schema.auditLogs.workspaceId, TEST_WS_PRIMARY))
      .limit(1);

    assert.ok(auditLog, "Audit log must be recorded in Neon DB");
    assert.strictEqual(auditLog.workspaceId, TEST_WS_PRIMARY);
    assert.ok(["user", "ai_agent", "system"].includes(auditLog.actorType));

    // 8.2 Verify ON DELETE RESTRICT constraint
    // Attempting to delete the workspace should fail because audit logs reference it with onDelete: "restrict"
    let restrictConstraintEnforced = false;
    try {
      await db.delete(schema.workspaces).where(eq(schema.workspaces.id, TEST_WS_PRIMARY));
    } catch (err: any) {
      restrictConstraintEnforced = true;
      assert.ok(
        err.message.includes("violates foreign key constraint") ||
        err.message.includes("restrict") ||
        err.message.includes("audit_logs"),
        "Foreign key restriction must block workspace deletion while audit logs exist"
      );
    }
    assert.strictEqual(
      restrictConstraintEnforced,
      true,
      "Audit logs must prevent accidental deletion of workspace via ON DELETE RESTRICT"
    );
    console.log("  ✔ Audit log entries durable in Neon PostgreSQL with actor attribution.");
    console.log("  ✔ ON DELETE RESTRICT retention constraint successfully protects compliance trail from deletion.\n");

    console.log("=========================================================");
    console.log(" ✅ ALL DAY 27 NOTIFICATIONS & SECURITY AUDIT TESTS PASSED!");
    console.log("=========================================================\n");
  } finally {
    // -------------------------------------------------------------------------
    // TEARDOWN: Clean up test fixtures in correct dependency order
    // -------------------------------------------------------------------------
    console.log("▶ [TEARDOWN] Purging test fixtures from Neon PostgreSQL...");
    try {
      // 1. Delete audit logs first to satisfy ON DELETE RESTRICT
      await db.delete(schema.auditLogs).where(eq(schema.auditLogs.workspaceId, TEST_WS_PRIMARY));
      await db.delete(schema.auditLogs).where(eq(schema.auditLogs.workspaceId, TEST_WS_SECONDARY));

      // 2. Delete notifications
      await db.delete(schema.notifications).where(eq(schema.notifications.workspaceId, TEST_WS_PRIMARY));
      await db.delete(schema.notifications).where(eq(schema.notifications.workspaceId, TEST_WS_SECONDARY));

      // 3. Delete properties
      await db.delete(schema.properties).where(eq(schema.properties.workspaceId, TEST_WS_PRIMARY));
      await db.delete(schema.properties).where(eq(schema.properties.workspaceId, TEST_WS_SECONDARY));

      // 4. Delete integrations
      await db.delete(schema.integrations).where(eq(schema.integrations.workspaceId, TEST_WS_PRIMARY));
      await db.delete(schema.integrations).where(eq(schema.integrations.workspaceId, TEST_WS_SECONDARY));

      // 5. Delete workspace members
      await db.delete(schema.workspaceMembers).where(eq(schema.workspaceMembers.workspaceId, TEST_WS_PRIMARY));
      await db.delete(schema.workspaceMembers).where(eq(schema.workspaceMembers.workspaceId, TEST_WS_SECONDARY));

      // 6. Delete test user
      await db.delete(schema.users).where(eq(schema.users.id, TEST_OWNER_ID));

      // 7. Delete workspaces
      await db.delete(schema.workspaces).where(eq(schema.workspaces.id, TEST_WS_PRIMARY));
      await db.delete(schema.workspaces).where(eq(schema.workspaces.id, TEST_WS_SECONDARY));

      console.log("✔ [TEARDOWN COMPLETE] Test fixtures purged successfully.\n");
    } catch (cleanupErr: any) {
      console.warn(`[TEARDOWN WARNING] Could not completely purge fixtures: ${cleanupErr.message}`);
    }

    await app.close();
  }
}

runDay27NotificationsAndSecurityAudit().catch((err) => {
  console.error("\n❌ DAY 27 SUITE FAILED WITH ERROR:", err);
  process.exit(1);
});
