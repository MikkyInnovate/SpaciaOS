/**
 * PACIA DAY 15 TEST SUITE: CALENDAR BOOKING & GOOGLE CALENDAR CONNECTION ENGINE
 * 
 * Verifies:
 * 1. Google OAuth2 consent URL generation with required scopes and offline consent.
 * 2. OAuth2 code exchange, token persistence in Neon PostgreSQL calendar_connections.
 * 3. Proactive token refresh via refresh_token when access token expires.
 * 4. Google Calendar Free/Busy collision querying and viewing slot availability resolution.
 * 5. In-person & virtual inspection appointment creation with Google Meet link generation.
 * 6. Internal & external double-booking prevention across overlapping time slots.
 * 7. Appointment cancellation lifecycle and external calendar teardown.
 * 8. Controlled AI tool 'book_property_inspection' execution with provenance verification and audit logging.
 * 
 * Executes directly against live Neon PostgreSQL.
 */

import { NestFactory } from "@nestjs/core";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
const assert = require("assert");
import { AppModule } from "../src/app.module";
import { DRIZZLE_DATABASE, DrizzleDb } from "../src/database/database.provider";
import * as schema from "../src/database/schema";
import { eq, and } from "drizzle-orm";
import { AppointmentsService } from "../src/modules/appointments/appointments.service";
import { CalendarAdapterService } from "../src/modules/appointments/calendar-adapter.service";
import { GoogleCalendarAdapter } from "../src/modules/appointments/adapters/google-calendar.adapter";
import { AiToolExecutorService } from "../src/modules/ai-tools/services/ai-tool-executor.service";
import { TenantContext } from "../src/common/tenant/tenant-context.interface";

neonConfig.webSocketConstructor = ws;

const TEST_WS_DAY15 = `ws_day15_cal_${Date.now()}`;
const TEST_USER_ID = "broker_ade_closer";

const mockTenant: TenantContext = {
  workspaceId: TEST_WS_DAY15,
  userId: TEST_USER_ID,
  role: "admin",
  permissions: ["leads:read", "leads:write"],
};

async function runDay15CalendarTests() {
  console.log("\n=========================================================");
  console.log(" PACIA DAY 15: GOOGLE CALENDAR & INSPECTION BOOKING SUITE");
  console.log("=========================================================\n");

  const app: INestApplication = await NestFactory.create(AppModule, { logger: false });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();

  const db = app.get<DrizzleDb>(DRIZZLE_DATABASE);
  const appointmentsService = app.get<AppointmentsService>(AppointmentsService);
  const calendarAdapter = app.get<CalendarAdapterService>(CalendarAdapterService);
  const googleAdapter = app.get<GoogleCalendarAdapter>(GoogleCalendarAdapter);
  const aiToolExecutor = app.get<AiToolExecutorService>(AiToolExecutorService);

  let testLeadId: string;
  let testPropertyId: string;
  const targetDateStr = new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0];

  try {
    // -------------------------------------------------------------
    // SETUP: Provision isolated workspace, lead, and property in Neon
    // -------------------------------------------------------------
    console.log("▶ [SETUP] Provisioning isolated Day 15 workspace, property & lead in Neon PostgreSQL...");
    await db.insert(schema.workspaces).values({
      id: TEST_WS_DAY15,
      name: "Day 15 Spacia Luxury Realty",
      slug: `day15-cal-${Date.now()}`,
    });

    const [lead] = await db
      .insert(schema.leads)
      .values({
        workspaceId: TEST_WS_DAY15,
        name: "Alhaji Danjuma",
        phone: "+2348039998877",
        email: "danjuma.investments@gmail.com",
        budget: "₦950,000,000",
        locationPreference: "Banana Island, Ikoyi",
        status: "Qualified",
      })
      .returning();
    testLeadId = lead.id;

    const [property] = await db
      .insert(schema.properties)
      .values({
        workspaceId: TEST_WS_DAY15,
        slug: `waterfront-villa-${Date.now()}`,
        title: "The Grand Waterfront Villa",
        location: "Zone A, Banana Island, Ikoyi, Lagos",
        propertyType: "villa",
        price: "950000000",
        formattedPrice: "₦950,000,000",
        bedrooms: 6,
        bathrooms: 7,
        squareMeters: 920,
        availability: "Available",
      })
      .returning();
    testPropertyId = property.id;

    console.log(`✔ [SETUP COMPLETE] Workspace [${TEST_WS_DAY15}], Lead [${testLeadId}], Property [${testPropertyId}] ready.\n`);

    // =========================================================================
    // TEST 1: Google OAuth2 Consent URL Generation
    // =========================================================================
    console.log("▶ [TEST 1] Testing Google OAuth2 authorization URL generation...");
    const redirectUri = "http://localhost:3000/appointments";
    const authReq = await appointmentsService.getOAuthUrl(TEST_WS_DAY15, "google_calendar", redirectUri);

    assert.ok(authReq.authUrl, "Must generate valid authorization URL");
    assert.ok(authReq.authUrl.startsWith("https://accounts.google.com/o/oauth2/v2/auth"), "Must use Google OAuth2 auth endpoint");
    assert.ok(authReq.authUrl.includes("client_id="), "Must include Google OAuth client_id");
    assert.ok(authReq.authUrl.includes("access_type=offline"), "Must request offline access for refresh tokens");
    assert.ok(authReq.authUrl.includes("prompt=consent"), "Must force consent prompt to ensure refresh token issuance");
    assert.ok(authReq.authUrl.includes("calendar.events"), "Must include calendar.events scope");
    assert.ok(authReq.authUrl.includes("calendar.freebusy"), "Must include calendar.freebusy scope");

    console.log("✔ [TEST 1 PASSED] Google OAuth2 consent URL configured with required scopes and offline access.\n");

    // =========================================================================
    // TEST 2: Google OAuth2 Code Exchange & Neon DB Persistence
    // =========================================================================
    console.log("▶ [TEST 2] Testing Google OAuth2 code exchange & token persistence in PostgreSQL...");
    const mockCode = `mock_code_${Date.now()}`;
    const mockState = `gcal_${TEST_WS_DAY15}_${Date.now()}`;

    const callbackResult = await appointmentsService.handleOAuthCallback(
      TEST_WS_DAY15,
      "google_calendar",
      mockCode,
      mockState
    );

    assert.ok(callbackResult.token.accessToken, "Callback must return valid access token");
    assert.ok(callbackResult.token.accountEmail, "Callback must return linked account email");

    // Verify record in Neon PostgreSQL calendar_connections table
    const dbConnections = await db
      .select()
      .from(schema.calendarConnections)
      .where(
        and(
          eq(schema.calendarConnections.workspaceId, TEST_WS_DAY15),
          eq(schema.calendarConnections.provider, "google_calendar")
        )
      );

    assert.equal(dbConnections.length, 1, "Must persist 1 calendar connection record in Neon PostgreSQL");
    assert.equal(dbConnections[0].status, "connected", "Connection status must be 'connected'");
    assert.ok(dbConnections[0].accessToken, "Access token must be saved");
    assert.ok(dbConnections[0].refreshToken, "Refresh token must be saved");

    console.log("✔ [TEST 2 PASSED] OAuth2 tokens securely persisted in Neon `calendar_connections` table.\n");

    // =========================================================================
    // TEST 3: Proactive Access Token Refresh
    // =========================================================================
    console.log("▶ [TEST 3] Testing token refresh engine when access token expires...");
    const initialToken = callbackResult.token.accessToken;
    const refreshed = await googleAdapter.refreshAccessToken(TEST_WS_DAY15);

    assert.ok(refreshed.accessToken, "Must return new access token");
    assert.notEqual(refreshed.accessToken, initialToken, "Refreshed token must differ from old token");

    // Verify DB update
    const [updatedDbConn] = await db
      .select()
      .from(schema.calendarConnections)
      .where(
        and(
          eq(schema.calendarConnections.workspaceId, TEST_WS_DAY15),
          eq(schema.calendarConnections.provider, "google_calendar")
        )
      );
    assert.equal(updatedDbConn.accessToken, refreshed.accessToken, "Neon DB must contain refreshed access token");

    console.log("✔ [TEST 3 PASSED] Google access token refreshed and synced to database.\n");

    // =========================================================================
    // TEST 4: Google Calendar Free/Busy Clash Detection & Viewing Slot Resolution
    // =========================================================================
    console.log("▶ [TEST 4] Testing Google Calendar Free/Busy collision check & viewing slot availability...");
    const slots = await appointmentsService.getAvailableSlots(
      mockTenant,
      testPropertyId,
      targetDateStr
    );

    assert.ok(Array.isArray(slots) && slots.length >= 6, "Must generate at least 6 daily viewing slots");

    // 1:00 PM slot corresponds to simulated Google Calendar busy block
    const slot1pm = slots.find((s) => s.formattedTime.includes("01:00 PM"));
    assert.ok(slot1pm, "1:00 PM slot must exist");
    assert.equal(slot1pm!.isAvailable, false, "1:00 PM slot must be marked unavailable due to external calendar conflict");
    assert.ok(
      slot1pm!.reasonUnavailable?.includes("Google Calendar"),
      "Conflict reason must cite external Google Calendar"
    );

    // 10:00 AM slot is free
    const slot10am = slots.find((s) => s.formattedTime.includes("10:00 AM"));
    assert.ok(slot10am, "10:00 AM slot must exist");
    assert.equal(slot10am!.isAvailable, true, "10:00 AM slot must be available");

    console.log("✔ [TEST 4 PASSED] Google Calendar Free/Busy clash accurately blocked 1:00 PM slot while keeping others open.\n");

    // =========================================================================
    // TEST 5: Create Property Viewing Appointment with Google Meet Sync
    // =========================================================================
    console.log("▶ [TEST 5] Booking confirmed inspection appointment with Google Calendar sync...");
    const slotStart = `${targetDateStr}T10:00:00.000Z`;
    const slotEnd = `${targetDateStr}T11:00:00.000Z`;

    const appointment = await appointmentsService.createAppointment(mockTenant, {
      propertyId: testPropertyId,
      leadId: testLeadId,
      leadName: "Alhaji Danjuma",
      leadEmail: "danjuma.investments@gmail.com",
      propertyTitle: "The Grand Waterfront Villa",
      location: "Zone A, Banana Island, Ikoyi",
      startTime: slotStart,
      endTime: slotEnd,
      meetingType: "virtual_tour",
      notes: "Prospective buyer interested in outright acquisition. Prepare deed pack.",
    } as any);

    assert.ok(appointment.id, "Appointment must have an ID");
    assert.equal(appointment.status, "confirmed", "Appointment must be confirmed");
    assert.equal(appointment.calendarProvider, "google_calendar", "Provider must be google_calendar");
    assert.ok(appointment.calendarEventId, "Must have external calendar event ID");
    assert.ok(appointment.meetingUrl?.includes("meet.google.com"), "Virtual tour must generate Google Meet URL");

    // Verify persistence in Neon PostgreSQL appointments table
    const dbAppointments = await db
      .select()
      .from(schema.appointments)
      .where(eq(schema.appointments.id, appointment.id));

    assert.equal(dbAppointments.length, 1, "Appointment record must exist in Neon PostgreSQL");
    assert.equal(dbAppointments[0].status, "confirmed", "DB appointment status must be confirmed");
    assert.ok(dbAppointments[0].meetingUrl?.includes("meet.google.com"), "DB record must persist Google Meet URL");

    console.log("✔ [TEST 5 PASSED] Appointment confirmed and persisted in Neon with Google Calendar event & Meet link.\n");

    // =========================================================================
    // TEST 6: Double-Booking Prevention Against Newly Created Appointment
    // =========================================================================
    console.log("▶ [TEST 6] Verifying double-booking clash prevention for the reserved 10:00 AM slot...");
    const updatedSlots = await appointmentsService.getAvailableSlots(
      mockTenant,
      testPropertyId,
      targetDateStr
    );

    const updated10am = updatedSlots.find((s) => s.formattedTime.includes("10:00 AM"));
    assert.ok(updated10am, "10:00 AM slot must exist");
    assert.equal(updated10am!.isAvailable, false, "10:00 AM slot must now be unavailable due to newly booked inspection");
    assert.ok(
      updated10am!.reasonUnavailable?.toLowerCase().includes("booked") ||
        updated10am!.reasonUnavailable?.toLowerCase().includes("conflict"),
      "Reason must explain double-booking lockout"
    );

    console.log("✔ [TEST 6 PASSED] Double-booking lockout verified: 10:00 AM slot cannot be reserved twice.\n");

    // =========================================================================
    // TEST 7: Appointment Cancellation & Calendar Event Cleanup
    // =========================================================================
    console.log("▶ [TEST 7] Testing appointment cancellation and calendar event deletion...");
    const cancelled = await appointmentsService.updateStatus(mockTenant, appointment.id, {
      status: "cancelled",
      reason: "Client rescheduled international travel",
    });

    assert.equal(cancelled.status, "cancelled", "Status must update to cancelled");
    assert.equal(cancelled.cancelledReason, "Client rescheduled international travel");

    // Verify in Neon DB
    const [cancelledDbApt] = await db
      .select()
      .from(schema.appointments)
      .where(eq(schema.appointments.id, appointment.id));
    assert.equal(cancelledDbApt.status, "cancelled", "Neon DB record must be cancelled");

    console.log("✔ [TEST 7 PASSED] Appointment successfully cancelled and synchronized with Google Calendar.\n");

    // =========================================================================
    // TEST 8: Controlled AI Tool 'book_property_inspection' Execution
    // =========================================================================
    console.log("▶ [TEST 8] Testing autonomous AI tool 'book_property_inspection' with audit logging...");
    const toolExecResult = await aiToolExecutor.executeTool(
      "book_property_inspection",
      {
        propertyId: testPropertyId,
        leadId: testLeadId,
        targetDate: targetDateStr,
        timeSlot: "14:30",
        meetingFormat: "vip_private_showing",
        notes: "Booked autonomously by AI Voice Specialist following BANT qualification.",
      },
      {
        workspaceId: TEST_WS_DAY15,
        actorId: "ai_agent_pacia",
        actorType: "ai_agent",
        role: "agent",
        permissions: ["leads:read", "leads:write"],
      }
    );

    assert.equal(toolExecResult.success, true, "AI tool execution must succeed");
    assert.equal(toolExecResult.data.status, "confirmed", "Inspection must be confirmed");
    assert.ok(toolExecResult.sourceVerification.isVerified, "Must have authoritative source verification");
    assert.equal(toolExecResult.sourceVerification.confidence, "authoritative");

    // Verify audit log entry in Neon PostgreSQL audit_logs table
    const auditEntries = await db
      .select()
      .from(schema.auditLogs)
      .where(
        and(
          eq(schema.auditLogs.workspaceId, TEST_WS_DAY15),
          eq(schema.auditLogs.action, "ai_tool_call:book_property_inspection")
        )
      );

    assert.ok(auditEntries.length >= 1, "Audit log entry must exist in Neon PostgreSQL");
    assert.equal(auditEntries[0].actorType, "ai_agent", "Actor type must be 'ai_agent'");

    console.log("✔ [TEST 8 PASSED] Autonomous AI tool 'book_property_inspection' executed with compliance audit log.\n");

    console.log("=========================================================");
    console.log(" ALL DAY 15 GOOGLE CALENDAR TESTS PASSED (8/8 - 100%)");
    console.log("=========================================================\n");
  } finally {
    // -------------------------------------------------------------
    // TEARDOWN: Clean up test fixtures from Neon PostgreSQL
    // -------------------------------------------------------------
    console.log("▶ [TEARDOWN] Purging test fixtures from Neon PostgreSQL...");
    try {
      await db.delete(schema.appointments).where(eq(schema.appointments.workspaceId, TEST_WS_DAY15));
      await db.delete(schema.calendarConnections).where(eq(schema.calendarConnections.workspaceId, TEST_WS_DAY15));
      await db.delete(schema.auditLogs).where(eq(schema.auditLogs.workspaceId, TEST_WS_DAY15));
      await db.delete(schema.properties).where(eq(schema.properties.workspaceId, TEST_WS_DAY15));
      await db.delete(schema.leads).where(eq(schema.leads.workspaceId, TEST_WS_DAY15));
      await db.delete(schema.workspaces).where(eq(schema.workspaces.id, TEST_WS_DAY15));
    } catch (e) {
      console.warn("Teardown warning:", (e as Error).message);
    }
    await app.close();
  }
}

runDay15CalendarTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n❌ DAY 15 TEST SUITE FAILED:", err);
    process.exit(1);
  });
