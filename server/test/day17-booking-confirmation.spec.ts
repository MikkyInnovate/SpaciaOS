/**
 * PACIA DAY 17 TEST SUITE: BOOKING CONFIRMATION FLOW & DOMAIN EVENT CREATION
 * 
 * Verifies:
 * 1. Slot availability resolution with clash prevention.
 * 2. Property viewing booking execution with reference code (#SP-BK-...) and confirmation summary.
 * 3. External calendar event synchronization & Google Meet video link generation for virtual tours.
 * 4. Transactional outbox domain event emission ('BookingConfirmed') into Neon PostgreSQL `system_events`.
 * 5. Immutable compliance audit log recording ('appointment:confirmed') in Neon PostgreSQL `audit_logs`.
 * 6. Inviolable double-booking collision lockout for already-booked viewing slots.
 * 7. Viewing confirmation retrieval across tenant appointments list.
 * 8. Booked lead moves to Viewing Booked and the AI agent is stopped.
 * 
 * Executes directly against live Neon PostgreSQL.
 */

import { NestFactory } from "@nestjs/core";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
const assert = require("assert");
import { AppModule } from "../src/app.module";
import { DRIZZLE_DATABASE, DrizzleDb } from "../src/database/database.provider";
import * as schema from "../src/database/schema";
import { eq, and } from "drizzle-orm";
import { AppointmentsService } from "../src/modules/appointments/appointments.service";
import { TenantContext } from "../src/common/tenant/tenant-context.interface";

neonConfig.webSocketConstructor = ws;

const TEST_WS_DAY17 = `ws_day17_book_${Date.now()}`;
const TEST_USER_ID = "broker_victoria_closer";

const mockTenant: TenantContext = {
  workspaceId: TEST_WS_DAY17,
  userId: TEST_USER_ID,
  role: "admin",
  permissions: ["leads:read", "leads:write"],
};

async function runDay17BookingConfirmationTests() {
  console.log("\n=========================================================");
  console.log(" PACIA DAY 17: BOOKING CONFIRMATION & EVENT CREATION SUITE");
  console.log("=========================================================\n");

  const app: INestApplication = await NestFactory.create(AppModule, { logger: false });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();

  const db = app.get<DrizzleDb>(DRIZZLE_DATABASE);
  const appointmentsService = app.get<AppointmentsService>(AppointmentsService);

  let testLeadId: string = "";
  let testPropertyId: string = "";
  let confirmedAppointmentId: string = "";
  const targetDay = new Date();
  targetDay.setDate(targetDay.getDate() + 3);
  if (targetDay.getDay() === 0) targetDay.setDate(targetDay.getDate() + 1);
  const targetDateStr = `${targetDay.getFullYear()}-${String(targetDay.getMonth() + 1).padStart(2, "0")}-${String(targetDay.getDate()).padStart(2, "0")}`;

  try {
    // -------------------------------------------------------------
    // SETUP: Provision isolated workspace, lead, and property in Neon
    // -------------------------------------------------------------
    console.log("▶ [SETUP] Provisioning isolated Day 17 workspace, property & lead in Neon PostgreSQL...");
    await db.insert(schema.workspaces).values({
      id: TEST_WS_DAY17,
      name: "Day 17 Spacia Luxury Estates",
      slug: `day17-book-${Date.now()}`,
    });

    const [lead] = await db
      .insert(schema.leads)
      .values({
        workspaceId: TEST_WS_DAY17,
        name: "Senator Kalu",
        phone: "+2348021112233",
        email: "kalu.investments@outlook.com",
        budget: "₦1,500,000,000",
        locationPreference: "Ikoyi, Lagos",
        status: "Qualified",
      })
      .returning();
    testLeadId = lead.id;

    const [prop] = await db
      .insert(schema.properties)
      .values({
        workspaceId: TEST_WS_DAY17,
        slug: `waterfront-mansion-${Date.now()}`,
        title: "The Royal Banana Island Waterfront Mansion",
        location: "Zone A, Banana Island, Ikoyi, Lagos",
        propertyType: "villa",
        price: "1500000000",
        formattedPrice: "₦1,500,000,000",
        bedrooms: 6,
        bathrooms: 7,
        squareMeters: 1200,
        availability: "Available",
      })
      .returning();
    testPropertyId = prop.id;

    console.log(`✔ [SETUP COMPLETE] Workspace [${TEST_WS_DAY17}], Lead [${testLeadId}], Property [${testPropertyId}] ready.\n`);

    // -------------------------------------------------------------
    // TEST 1: Availability Resolution
    // -------------------------------------------------------------
    console.log("▶ [TEST 1] Testing viewing slot availability resolution...");
    const availableSlots = await appointmentsService.getAvailableSlots(
      mockTenant,
      testPropertyId,
      targetDateStr
    );

    assert(Array.isArray(availableSlots), "availableSlots must be an array");
    assert(availableSlots.length > 0, "Must return at least one time slot");
    const openSlot = availableSlots.find((s) => s.isAvailable);
    assert(openSlot, "Must have an available slot for booking");
    console.log(`✔ [TEST 1 PASSED] Resolved ${availableSlots.length} viewing slots (${availableSlots.filter((s) => s.isAvailable).length} open).\n`);

    // -------------------------------------------------------------
    // TEST 2: Booking Execution & Confirmation Payload
    // -------------------------------------------------------------
    console.log("▶ [TEST 2] Testing appointment booking execution & confirmation metadata...");
    const booking = await appointmentsService.createAppointment(mockTenant, {
      leadId: testLeadId,
      propertyId: testPropertyId,
      startTime: openSlot!.startTime,
      endTime: openSlot!.endTime,
      meetingType: "virtual_tour",
      location: "Private Ocean Gate, Banana Island, Lagos",
      notes: "VIP Virtual Tour. High net-worth prospect acquiring waterfront asset.",
    });

    confirmedAppointmentId = booking.id;
    assert(booking.id, "Booking must have an id");
    assert.strictEqual(booking.status, "confirmed", "Booking status must be 'confirmed'");
    assert(booking.referenceCode, "Booking must generate a referenceCode");
    assert(booking.referenceCode!.startsWith("SP-BK-"), "referenceCode must follow '#SP-BK-...' convention");
    assert(booking.shareableSummary, "Booking must include a shareableSummary");
    assert(booking.meetingUrl, "Virtual tour booking must include a Google Meet video URL");

    console.log(`✔ [TEST 2 PASSED] Appointment [${booking.id}] confirmed with Ref: #${booking.referenceCode} and Meet URL.\n`);

    // -------------------------------------------------------------
    // TEST 3: Neon PostgreSQL Database Persistence Verification
    // -------------------------------------------------------------
    console.log("▶ [TEST 3] Verifying appointment record persistence in Neon PostgreSQL `appointments` table...");
    const [dbApt] = await db
      .select()
      .from(schema.appointments)
      .where(and(eq(schema.appointments.id, confirmedAppointmentId), eq(schema.appointments.workspaceId, TEST_WS_DAY17)));

    assert(dbApt, "Appointment must exist in Neon PostgreSQL appointments table");
    assert.strictEqual(dbApt.status, "confirmed", "Database status must be 'confirmed'");
    assert.strictEqual(dbApt.type, "virtual_tour", "Database type must be 'virtual_tour'");
    assert(dbApt.meetingUrl, "Database record must store meetingUrl");
    console.log(`✔ [TEST 3 PASSED] Confirmed appointment properly persisted in Neon PostgreSQL.\n`);

    // -------------------------------------------------------------
    // TEST 4: Transactional Outbox Event Emission ('BookingConfirmed')
    // -------------------------------------------------------------
    console.log("▶ [TEST 4] Verifying transactional outbox domain event 'BookingConfirmed' in `system_events` table...");
    const events = await db
      .select()
      .from(schema.systemEvents)
      .where(
        and(
          eq(schema.systemEvents.workspaceId, TEST_WS_DAY17),
          eq(schema.systemEvents.aggregateId, confirmedAppointmentId)
        )
      );

    assert(events.length > 0, "At least one system event must be emitted for the appointment");
    const bookingEvent = events.find((e) => e.eventName === "BookingConfirmed");
    assert(bookingEvent, "Must have an emitted 'BookingConfirmed' event");
    assert.strictEqual(bookingEvent!.status, "emitted", "Event status must be 'emitted'");
    assert.strictEqual(bookingEvent!.aggregateType, "appointment", "aggregateType must be 'appointment'");
    
    const payload = bookingEvent!.payload as Record<string, any>;
    assert.strictEqual(payload.appointmentId, confirmedAppointmentId, "Payload must include appointmentId");
    assert.strictEqual(payload.leadId, testLeadId, "Payload must include leadId");
    assert.strictEqual(payload.propertyId, testPropertyId, "Payload must include propertyId");
    assert(payload.referenceCode, "Payload must include referenceCode");
    console.log(`✔ [TEST 4 PASSED] Domain event 'BookingConfirmed' verified in outbox (Event ID: ${bookingEvent!.id}).\n`);

    // -------------------------------------------------------------
    // TEST 5: Compliance Audit Log Recording ('appointment:confirmed')
    // -------------------------------------------------------------
    console.log("▶ [TEST 5] Verifying compliance audit log in `audit_logs` table...");
    const auditEntries = await db
      .select()
      .from(schema.auditLogs)
      .where(
        and(
          eq(schema.auditLogs.workspaceId, TEST_WS_DAY17),
          eq(schema.auditLogs.action, "appointment:confirmed")
        )
      );

    assert(auditEntries.length > 0, "Must have recorded an audit log entry for confirmed appointment");
    const entry = auditEntries[0];
    assert.strictEqual(entry.resource, "appointment", "Audit resource must be 'appointment'");
    const metadata = entry.metadata as Record<string, any>;
    assert.strictEqual(metadata.appointmentId, confirmedAppointmentId, "Audit metadata must include appointmentId");
    console.log(`✔ [TEST 5 PASSED] Audit log entry confirmed in Neon PostgreSQL (Audit ID: ${entry.id}).\n`);

    // -------------------------------------------------------------
    // TEST 6: Double-Booking Conflict Prevention
    // -------------------------------------------------------------
    console.log("▶ [TEST 6] Testing double-booking conflict prevention for the confirmed slot...");
    let conflictCaught = false;
    try {
      await appointmentsService.createAppointment(mockTenant, {
        leadId: testLeadId,
        propertyId: testPropertyId,
        startTime: openSlot!.startTime,
        endTime: openSlot!.endTime,
        meetingType: "in_person_viewing",
        location: "Same address",
      });
    } catch (err: any) {
      conflictCaught = true;
      assert(
        err.message.includes("already booked") || err.status === 409,
        `Expected conflict error, got: ${err.message}`
      );
    }
    assert(conflictCaught, "Must reject double-booking attempt on already-confirmed slot");
    console.log("✔ [TEST 6 PASSED] Double-booking lockout verified: reserved slot cannot be booked twice.\n");

    // -------------------------------------------------------------
    // TEST 7: Viewing Confirmation Retrieval in Tenant Appointments List
    // -------------------------------------------------------------
    console.log("▶ [TEST 7] Testing retrieval of confirmed viewing in tenant appointments list...");
    const allAppointments = await appointmentsService.getAppointments(mockTenant, { status: "confirmed" });
    const found = allAppointments.find((a) => a.id === confirmedAppointmentId);
    assert(found, "Confirmed appointment must be present in tenant appointment list");
    assert.strictEqual(found!.status, "confirmed", "Retrieved appointment status must be 'confirmed'");
    console.log(`✔ [TEST 7 PASSED] Viewing confirmed and retrieved in tenant schedule.\n`);

    // -------------------------------------------------------------
    // TEST 8: Confirmed viewing stops the AI agent on that lead
    // -------------------------------------------------------------
    console.log("▶ [TEST 8] Verifying the booked lead is Viewing Booked and the AI agent is stopped...");
    const [bookedLead] = await db
      .select()
      .from(schema.leads)
      .where(and(eq(schema.leads.id, testLeadId), eq(schema.leads.workspaceId, TEST_WS_DAY17)));

    assert(bookedLead, "Booked lead must still exist");
    assert.strictEqual(bookedLead.status, "Viewing Booked", "Lead status must be 'Viewing Booked'");
    assert.strictEqual(bookedLead.isAiStopped, true, "AI agent must be stopped after the viewing is booked");
    assert(bookedLead.aiStoppedReason && bookedLead.aiStoppedReason.includes(booking.referenceCode!), "Stop reason must cite the booking reference");

    const [viewingEvent] = await db
      .select()
      .from(schema.leadEvents)
      .where(and(eq(schema.leadEvents.leadId, testLeadId), eq(schema.leadEvents.workspaceId, TEST_WS_DAY17)));
    assert(viewingEvent, "A viewing_scheduled lead event must be written");
    assert.strictEqual(viewingEvent.type, "viewing_scheduled");
    console.log("✔ [TEST 8 PASSED] Lead is Viewing Booked and autonomous AI is stopped.\n");

    console.log("=========================================================");
    console.log(" ALL DAY 17 BOOKING CONFIRMATION TESTS PASSED (8/8 - 100%)");
    console.log("=========================================================\n");
  } catch (error) {
    console.error("❌ [DAY 17 TEST FAILED]", error);
    process.exit(1);
  } finally {
    console.log("▶ [TEARDOWN] Purging test fixtures from Neon PostgreSQL...");
    try {
      if (confirmedAppointmentId) {
        await db.delete(schema.systemEvents).where(eq(schema.systemEvents.workspaceId, TEST_WS_DAY17));
        await db.delete(schema.auditLogs).where(eq(schema.auditLogs.workspaceId, TEST_WS_DAY17));
        await db.delete(schema.appointments).where(eq(schema.appointments.workspaceId, TEST_WS_DAY17));
      }
      await db.delete(schema.leads).where(eq(schema.leads.workspaceId, TEST_WS_DAY17));
      await db.delete(schema.properties).where(eq(schema.properties.workspaceId, TEST_WS_DAY17));
      await db.delete(schema.workspaces).where(eq(schema.workspaces.id, TEST_WS_DAY17));
      console.log("✔ [TEARDOWN COMPLETE] Test fixtures purged.\n");
    } catch {
      // Best-effort cleanup
    }
    await app.close();
  }
}

runDay17BookingConfirmationTests();
