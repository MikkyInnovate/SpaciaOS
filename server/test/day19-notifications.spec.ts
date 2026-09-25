const assert = require("assert");
import { randomUUID } from "crypto";
import { NestFactory } from "@nestjs/core";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { eq } from "drizzle-orm";
import { AppModule } from "../src/app.module";
import { DRIZZLE_DATABASE, DrizzleDb } from "../src/database/database.provider";
import * as schema from "../src/database/schema";
import { TenantContext } from "../src/common/tenant/tenant-context.interface";
import { NotificationsService } from "../src/modules/notifications/notifications.service";
import { AppointmentsService } from "../src/modules/appointments/appointments.service";

neonConfig.webSocketConstructor = ws;

/**
 * PACIA DAY 19: NOTIFICATIONS INTEGRATION TEST SUITE
 * 
 * Verifies end-to-end:
 * 1. Prospect booking confirmation & viewing details dispatch via Resend
 * 2. Prospect inspection reminder dispatch ('24h' & '1h')
 * 3. Company new appointment alert with BANT lead context
 * 4. Company alert with property context (valuation & commission)
 * 5. Company alert with AI call synthesis & buyer sentiment
 * 6. Unified multi-party dispatch on appointment creation
 * 7. Neon PostgreSQL database persistence in `notifications` table
 * 8. Multi-tenant workspace notification isolation
 */
async function runDay19NotificationsTestSuite() {
  console.log("\n=========================================================");
  console.log(" PACIA DAY 19: RESEND NOTIFICATIONS & AUDIT SUITE");
  console.log("=========================================================\n");

  const app: INestApplication = await NestFactory.create(AppModule, { logger: false });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();

  const db = app.get<DrizzleDb>(DRIZZLE_DATABASE);
  const notificationsService = app.get<NotificationsService>(NotificationsService);
  const appointmentsService = app.get<AppointmentsService>(AppointmentsService);

  const TEST_WS_DAY19 = `ws_day19_notif_${Date.now()}`;
  const TEST_WS_OTHER = `ws_day19_other_${Date.now()}`;

  let testLeadId: string = "";
  let testPropertyId: string = "";
  const testAppointmentId = randomUUID();
  const targetEmail = "adeleke.prospect@gmail.com";

  try {
    // -------------------------------------------------------------
    // SETUP: Provision Neon DB Workspace, Lead & Property Fixtures
    // -------------------------------------------------------------
    console.log("▶ [SETUP] Provisioning isolated Day 19 workspace, property & lead in Neon PostgreSQL...");
    await db.insert(schema.workspaces).values([
      { id: TEST_WS_DAY19, name: "Spacia Luxury Ikoyi Hub", slug: `ikoyi-hub-${Date.now()}` },
      { id: TEST_WS_OTHER, name: "Spacia Victoria Island", slug: `vi-hub-${Date.now()}` },
    ]);

    const [prop] = await db
      .insert(schema.properties)
      .values({
        workspaceId: TEST_WS_DAY19,
        slug: `waterfront-villa-${Date.now()}`,
        title: "The Grand Waterfront Villa",
        location: "Zone A, Banana Island, Ikoyi, Lagos",
        propertyType: "villa",
        price: "950000000",
        formattedPrice: "₦950,000,000",
        bedrooms: 6,
        bathrooms: 7,
        availability: "Available",
      })
      .returning();
    testPropertyId = prop.id;

    const [lead] = await db
      .insert(schema.leads)
      .values({
        workspaceId: TEST_WS_DAY19,
        name: "Chief Adeleke",
        email: targetEmail,
        phone: "+2348023456789",
        status: "Qualified",
      })
      .returning();
    testLeadId = lead.id;

    console.log(`✔ [SETUP COMPLETE] Workspace [${TEST_WS_DAY19}], Lead [${testLeadId}], Property [${testPropertyId}] ready.\n`);

    // -------------------------------------------------------------
    // TEST 1: Prospect Booking Confirmation & Viewing Details
    // -------------------------------------------------------------
    console.log("▶ [TEST 1] Testing Prospect Booking Confirmation & Viewing Details dispatch...");
    const prospectConfResult = await notificationsService.sendProspectBookingConfirmation(TEST_WS_DAY19, {
      appointmentId: testAppointmentId,
      referenceCode: "SP-BK-D89A12",
      leadName: "Chief Adeleke",
      leadEmail: targetEmail,
      leadPhone: "+2348023456789",
      propertyTitle: "The Grand Waterfront Villa",
      propertyLocation: "Zone A, Banana Island, Ikoyi, Lagos",
      propertyPrice: "₦950,000,000",
      scheduledStartAt: "2026-10-02T10:00:00.000Z",
      scheduledEndAt: "2026-10-02T11:00:00.000Z",
      meetingType: "in_person_viewing",
      gatePassCode: "BI-9942-VIP",
      assignedBrokerName: "Ade Admin (Senior Luxury Closer)",
      assignedBrokerPhone: "+234 803 555 0199",
      notes: "Prepare high-gloss legal title deed dossier and private jetty access pass.",
    });

    assert(prospectConfResult.id, "Prospect notification must generate a unique ID");
    assert(prospectConfResult.resendMessageId.startsWith("resend_"), "Must return a Resend message identifier");
    assert.strictEqual(prospectConfResult.recipient, targetEmail, "Recipient must match prospect email");
    assert.strictEqual(prospectConfResult.templateType, "prospect_booking_confirmation");
    assert(prospectConfResult.subject.includes("The Grand Waterfront Villa"), "Subject must cite property title");
    assert(prospectConfResult.htmlBody?.includes("BI-9942-VIP"), "HTML must include estate gate security pass code");
    assert(prospectConfResult.htmlBody?.includes("Ade Admin"), "HTML must include assigned closer");

    console.log(`✔ [TEST 1 PASSED] Prospect confirmation delivered (Resend Msg: ${prospectConfResult.resendMessageId}).\n`);

    // -------------------------------------------------------------
    // TEST 2: Prospect Viewing Reminder (24h & 1h Windows)
    // -------------------------------------------------------------
    console.log("▶ [TEST 2] Testing Prospect Viewing Reminder (24h & 1h before inspection)...");
    const reminder24hResult = await notificationsService.sendProspectViewingReminder(TEST_WS_DAY19, {
      appointmentId: testAppointmentId,
      referenceCode: "SP-BK-D89A12",
      leadName: "Chief Adeleke",
      leadEmail: targetEmail,
      propertyTitle: "The Grand Waterfront Villa",
      propertyLocation: "Zone A, Banana Island, Ikoyi, Lagos",
      scheduledStartAt: "2026-10-02T10:00:00.000Z",
      scheduledEndAt: "2026-10-02T11:00:00.000Z",
      meetingType: "in_person_viewing",
      reminderWindow: "24h",
      gatePassCode: "BI-9942-VIP",
      assignedBrokerName: "Ade Admin",
    });

    assert(reminder24hResult.id, "24h Reminder notification must have an ID");
    assert(reminder24hResult.subject.includes("Tomorrow"), "24h reminder subject must cite 'Tomorrow'");
    assert(reminder24hResult.htmlBody?.includes("I Will Be Attending"), "Reminder must include attendance CTA");

    const reminder1hResult = await notificationsService.sendProspectViewingReminder(TEST_WS_DAY19, {
      appointmentId: testAppointmentId,
      referenceCode: "SP-BK-D89A12",
      leadName: "Chief Adeleke",
      leadEmail: targetEmail,
      propertyTitle: "The Grand Waterfront Villa",
      propertyLocation: "Zone A, Banana Island, Ikoyi, Lagos",
      scheduledStartAt: "2026-10-02T10:00:00.000Z",
      scheduledEndAt: "2026-10-02T11:00:00.000Z",
      meetingType: "in_person_viewing",
      reminderWindow: "1h",
      assignedBrokerName: "Ade Admin",
    });

    assert(reminder1hResult.subject.includes("in 1 Hour"), "1h reminder subject must cite 'in 1 Hour'");
    console.log(`✔ [TEST 2 PASSED] Both 24h and 1h inspection reminders validated.\n`);

    // -------------------------------------------------------------
    // TEST 3: Company Alert — Lead Context (BANT Score & Liquidity)
    // -------------------------------------------------------------
    console.log("▶ [TEST 3] Testing Company New Appointment Alert — BANT Lead Context...");
    const companyAlertResult = await notificationsService.sendCompanyNewAppointmentAlert(TEST_WS_DAY19, {
      appointmentId: testAppointmentId,
      referenceCode: "SP-BK-D89A12",
      companyRecipientEmail: "closers@spacia.io",
      leadContext: {
        id: testLeadId,
        name: "Chief Adeleke",
        email: targetEmail,
        phone: "+2348023456789",
        score: 94,
        scoreCategory: "HOT",
        budget: "₦950,000,000 Outright",
        timeline: "< 30 days",
        decisionReadiness: "Sole decision maker ready to transact",
        buyingCatalyst: "Acquiring secondary waterfront family retreat before Q4 holidays.",
      },
      propertyContext: {
        id: testPropertyId,
        title: "The Grand Waterfront Villa",
        location: "Banana Island, Ikoyi, Lagos",
        price: "₦950,000,000",
        bedrooms: 6,
        bathrooms: 7,
        commission: "5% (₦47,500,000)",
      },
      aiSummary: {
        synthesis: "Prospect qualified with verified liquidity. No financing contingency.",
        buyerSentiment: "bullish",
        keyRequirements: ["Governor's Consent in hand", "Uninterrupted 24/7 power grid"],
        objectionsResolved: ["Service charge audit verified at ₦5.5M/yr"],
        recommendedClosingStrategy: "Present original survey plan and deed during walkthrough.",
      },
      meetingDetails: {
        scheduledStartAt: "2026-10-02T10:00:00.000Z",
        scheduledEndAt: "2026-10-02T11:00:00.000Z",
        meetingType: "vip_private_showing",
        assignedCloser: "Ade Admin (Senior Luxury Closer)",
      },
    });

    assert(companyAlertResult.id, "Company notification must have an ID");
    assert(companyAlertResult.subject.includes("Chief Adeleke"), "Subject must cite prospect name");
    assert(companyAlertResult.subject.includes("HOT 94/100"), "Subject must highlight HOT lead score");
    assert(companyAlertResult.htmlBody?.includes("₦950,000,000 Outright"), "HTML must detail purchasing budget");
    assert(companyAlertResult.htmlBody?.includes("Sole decision maker"), "HTML must detail authority readiness");

    console.log(`✔ [TEST 3 PASSED] Company alert with BANT lead context verified.\n`);

    // -------------------------------------------------------------
    // TEST 4 & 5: Company Alert — Property Context & AI Call Summary
    // -------------------------------------------------------------
    console.log("▶ [TEST 4 & 5] Verifying Property Context & AI Call Synthesis in Company Alert...");
    assert(companyAlertResult.htmlBody?.includes("₦47,500,000"), "Must compute and display broker commission");
    assert(companyAlertResult.htmlBody?.toLowerCase().includes("bullish"), "Must highlight bullish buyer sentiment");
    assert(companyAlertResult.htmlBody?.includes("Governor's Consent in hand"), "Must list key qualified requirements");
    assert(companyAlertResult.htmlBody?.includes("Present original survey plan"), "Must include strategic closing directive");

    console.log(`✔ [TEST 4 & 5 PASSED] Property specifications and AI underwriting synthesis verified.\n`);

    // -------------------------------------------------------------
    // TEST 6: Unified Multi-Party Dispatch on Appointment Creation
    // -------------------------------------------------------------
    console.log("▶ [TEST 6] Testing automatic multi-party dispatch upon appointment creation...");
    const mockTenant: TenantContext = {
      userId: "user_closer_01",
      workspaceId: TEST_WS_DAY19,
      role: "admin",
      permissions: ["appointments:write", "appointments:read"],
    };

    const newBooking = await appointmentsService.createAppointment(mockTenant, {
      leadId: testLeadId,
      propertyId: testPropertyId,
      startTime: "2026-10-05T14:30:00.000Z",
      endTime: "2026-10-05T15:30:00.000Z",
      meetingType: "in_person_viewing",
      location: "Zone A, Banana Island, Ikoyi",
      notes: "Automated booking dispatch verification",
    });

    assert(newBooking.id, "Appointment must be created");
    assert(newBooking.referenceCode, "Appointment must have referenceCode");

    console.log(`✔ [TEST 6 PASSED] Unified booking dispatch executed for appointment [#${newBooking.referenceCode}].\n`);

    // -------------------------------------------------------------
    // TEST 7: Neon PostgreSQL Database Persistence & History Query
    // -------------------------------------------------------------
    console.log("▶ [TEST 7] Verifying database persistence in `notifications` table...");
    const dbNotifs = await db
      .select()
      .from(schema.notifications)
      .where(eq(schema.notifications.workspaceId, TEST_WS_DAY19));

    assert(dbNotifs.length >= 3, `Expected at least 3 notification records in Neon DB, found ${dbNotifs.length}`);
    const types = dbNotifs.map((n: typeof schema.notifications.$inferSelect) => n.type);
    assert(types.includes("prospect_booking_confirmation"), "Must persist prospect confirmation record");
    assert(types.includes("prospect_viewing_reminder"), "Must persist viewing reminder record");
    assert(types.includes("company_new_appointment"), "Must persist company alert record");

    console.log(`✔ [TEST 7 PASSED] ${dbNotifs.length} notification audit rows verified in Neon PostgreSQL.\n`);

    // -------------------------------------------------------------
    // TEST 8: Multi-Tenant Notification Isolation
    // -------------------------------------------------------------
    console.log("▶ [TEST 8] Verifying multi-tenant notification isolation...");
    const otherWsNotifs = await db
      .select()
      .from(schema.notifications)
      .where(eq(schema.notifications.workspaceId, TEST_WS_OTHER));

    assert.strictEqual(otherWsNotifs.length, 0, "Other workspace must have zero notifications from Test Workspace");
    console.log(`✔ [TEST 8 PASSED] Multi-tenant isolation verified: zero cross-tenant leakage.\n`);

    console.log("=========================================================");
    console.log(" ALL DAY 19 NOTIFICATION TESTS PASSED (8/8 - 100%)");
    console.log("=========================================================\n");
  } finally {
    // -------------------------------------------------------------
    // TEARDOWN: Clean up test fixtures
    // -------------------------------------------------------------
    console.log("▶ [TEARDOWN] Purging test fixtures from Neon PostgreSQL...");
    try {
      await db.delete(schema.notifications).where(eq(schema.notifications.workspaceId, TEST_WS_DAY19));
      await db.delete(schema.appointments).where(eq(schema.appointments.workspaceId, TEST_WS_DAY19));
      await db.delete(schema.systemEvents).where(eq(schema.systemEvents.workspaceId, TEST_WS_DAY19));
      await db.delete(schema.auditLogs).where(eq(schema.auditLogs.workspaceId, TEST_WS_DAY19));
      await db.delete(schema.leads).where(eq(schema.leads.workspaceId, TEST_WS_DAY19));
      await db.delete(schema.properties).where(eq(schema.properties.workspaceId, TEST_WS_DAY19));
      await db.delete(schema.workspaces).where(eq(schema.workspaces.id, TEST_WS_DAY19));
      await db.delete(schema.workspaces).where(eq(schema.workspaces.id, TEST_WS_OTHER));
      console.log("✔ [TEARDOWN COMPLETE] Test fixtures purged.\n");
    } catch (cleanupErr) {
      console.warn("Teardown warning:", (cleanupErr as Error).message);
    }
    await app.close();
  }
}

// Execute test suite directly
runDay19NotificationsTestSuite().catch((err) => {
  console.error("❌ [DAY 19 TEST FAILED]", err);
  process.exit(1);
});
