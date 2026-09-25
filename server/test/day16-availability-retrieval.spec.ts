/**
 * PACIA DAY 16 TEST SUITE: AVAILABILITY RETRIEVAL & REAL AVAILABLE SLOT ENGINE
 * 
 * Verifies:
 * 1. Viewing slot availability retrieval for target property and date via AppointmentsService.
 * 2. Slot entity contract structure (ISO timestamps, formatted ranges, broker metadata).
 * 3. Detection of external Google Calendar Free/Busy collisions (1:00 PM – 2:00 PM blocked, reason specified).
 * 4. Identification of open slots ('isAvailable: true' Real Available Slots).
 * 5. Internal booking collision lockout: reserving a real available slot marks it unavailable with conflict explanation.
 * 6. Inviolable double-booking prevention: attempting to re-book the same slot is rejected with ConflictException (409).
 * 7. Multi-tenant availability isolation: appointments in Workspace A never block slots in Workspace B.
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
import { eq } from "drizzle-orm";
import { AppointmentsService } from "../src/modules/appointments/appointments.service";
import { CalendarAdapterService } from "../src/modules/appointments/calendar-adapter.service";
import { GoogleCalendarAdapter } from "../src/modules/appointments/adapters/google-calendar.adapter";
import { TenantContext } from "../src/common/tenant/tenant-context.interface";

neonConfig.webSocketConstructor = ws;

const TEST_WS_DAY16 = `ws_day16_avail_${Date.now()}`;
const TEST_WS_DAY16_ISOLATED = `ws_day16_isolated_${Date.now()}`;
const TEST_USER_ID = "broker_ade_luxury";

const mockTenant: TenantContext = {
  workspaceId: TEST_WS_DAY16,
  userId: TEST_USER_ID,
  role: "admin",
  permissions: ["leads:read", "leads:write"],
};

const isolatedTenant: TenantContext = {
  workspaceId: TEST_WS_DAY16_ISOLATED,
  userId: "broker_chinedu",
  role: "admin",
  permissions: ["leads:read", "leads:write"],
};

async function runDay16AvailabilityRetrievalTests() {
  console.log("\n=========================================================");
  console.log(" PACIA DAY 16: AVAILABILITY RETRIEVAL & REAL AVAILABLE SLOT");
  console.log("=========================================================\n");

  const app: INestApplication = await NestFactory.create(AppModule, { logger: false });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();

  const db = app.get<DrizzleDb>(DRIZZLE_DATABASE);
  const appointmentsService = app.get<AppointmentsService>(AppointmentsService);
  const calendarAdapter = app.get<CalendarAdapterService>(CalendarAdapterService);
  const googleAdapter = app.get<GoogleCalendarAdapter>(GoogleCalendarAdapter);

  let testLeadId: string = "";
  let testPropertyId: string = "";
  let isolatedPropertyId: string = "";
  let bookedAppointmentId: string = "";
  const targetDateStr = new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0];

  try {
    // -------------------------------------------------------------
    // SETUP: Provision isolated workspaces, property & lead in Neon
    // -------------------------------------------------------------
    console.log("▶ [SETUP] Provisioning isolated Day 16 workspaces, properties & lead in Neon PostgreSQL...");
    await db.insert(schema.workspaces).values([
      {
        id: TEST_WS_DAY16,
        name: "Day 16 Spacia High-End Realty",
        slug: `day16-avail-${Date.now()}`,
      },
      {
        id: TEST_WS_DAY16_ISOLATED,
        name: "Day 16 Competing Brokerage",
        slug: `day16-isolated-${Date.now()}`,
      },
    ]);

    const [lead] = await db
      .insert(schema.leads)
      .values({
        workspaceId: TEST_WS_DAY16,
        name: "Alhaji Danjuma",
        phone: "+2348039998877",
        email: "danjuma.investments@gmail.com",
        budget: "₦950,000,000",
        locationPreference: "Banana Island, Ikoyi",
        status: "Qualified",
      })
      .returning();
    testLeadId = lead.id;

    const [prop] = await db
      .insert(schema.properties)
      .values({
        workspaceId: TEST_WS_DAY16,
        slug: `grand-waterfront-villa-${Date.now()}`,
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
    testPropertyId = prop.id;

    const [propIsolated] = await db
      .insert(schema.properties)
      .values({
        workspaceId: TEST_WS_DAY16_ISOLATED,
        slug: `eko-atlantic-penthouse-${Date.now()}`,
        title: "Eko Atlantic Sky Penthouse",
        location: "Eko Atlantic City, Lagos",
        propertyType: "penthouse",
        price: "1200000000",
        formattedPrice: "₦1,200,000,000",
        bedrooms: 4,
        bathrooms: 5,
        squareMeters: 650,
        availability: "Available",
      })
      .returning();
    isolatedPropertyId = propIsolated.id;

    console.log(`✔ [SETUP COMPLETE] Workspace [${TEST_WS_DAY16}], Lead [${testLeadId}], Property [${testPropertyId}] ready.\n`);

    // -------------------------------------------------------------
    // TEST 1: Retrieve Viewing Slots Array via AppointmentsService
    // -------------------------------------------------------------
    console.log("▶ [TEST 1] Testing viewing slot availability retrieval for target date...");
    const slots = await appointmentsService.getAvailableSlots(
      mockTenant,
      testPropertyId,
      targetDateStr
    );

    assert(Array.isArray(slots), "Slots must return an array");
    assert.strictEqual(slots.length, 6, "Must generate exactly 6 standardized viewing slots (10:00, 11:30, 1:00, 2:30, 4:00, 5:30)");
    console.log(`✔ [TEST 1 PASSED] Successfully retrieved ${slots.length} viewing slots for date: ${targetDateStr}.\n`);

    // -------------------------------------------------------------
    // TEST 2: Verify Viewing Slot Schema & Attributes
    // -------------------------------------------------------------
    console.log("▶ [TEST 2] Verifying slot entity schema contracts (ISO timestamps, formatted ranges, broker metadata)...");
    for (const slot of slots) {
      assert(slot.id, "Slot must have a unique ID");
      assert(slot.startTime, "Slot must include an ISO startTime");
      assert(slot.endTime, "Slot must include an ISO endTime");
      assert(slot.formattedTime, "Slot must include human-readable formattedTime");
      assert(slot.formattedDate, "Slot must include human-readable formattedDate");
      assert(typeof slot.isAvailable === "boolean", "Slot must have a boolean isAvailable status");
      assert(slot.brokerName, "Slot must specify assigned broker name");
      assert(new Date(slot.startTime) < new Date(slot.endTime), "Slot startTime must precede endTime");
    }
    console.log(`✔ [TEST 2 PASSED] All 6 slot records strictly satisfy ViewingSlotEntity contract.\n`);

    // -------------------------------------------------------------
    // TEST 3: Google Calendar Free/Busy Clash Detection (1:00 PM Conflict)
    // -------------------------------------------------------------
    console.log("▶ [TEST 3] Verifying external Google Calendar Free/Busy collision check for 1:00 PM slot...");
    const slot1pm = slots.find((s) => s.formattedTime.includes("01:00 PM") || s.startTime.includes("T13:00:00"));
    assert(slot1pm, "1:00 PM viewing slot must exist in the returned array");
    assert.strictEqual(slot1pm!.isAvailable, false, "1:00 PM slot must be marked unavailable due to Google Calendar clash");
    assert(
      slot1pm!.reasonUnavailable?.includes("Google Calendar"),
      `Expected reason to indicate Google Calendar clash, got: '${slot1pm!.reasonUnavailable}'`
    );
    console.log(`✔ [TEST 3 PASSED] Google Calendar conflict accurately detected: '${slot1pm!.reasonUnavailable}'.\n`);

    // -------------------------------------------------------------
    // TEST 4: Real Available Slot Identification & Selection Deliverable
    // -------------------------------------------------------------
    console.log("▶ [TEST 4] Identifying Real Available Slots for booking deliverable...");
    const realAvailableSlots = slots.filter((s) => s.isAvailable);
    assert(realAvailableSlots.length >= 4, `Expected at least 4 available slots, found ${realAvailableSlots.length}`);

    const slot10am = realAvailableSlots.find((s) => s.formattedTime.includes("10:00 AM") || s.startTime.includes("T10:00:00"));
    assert(slot10am, "10:00 AM slot must be a verified Real Available Slot");
    assert.strictEqual(slot10am!.isAvailable, true, "10:00 AM must be open for booking");
    assert.strictEqual(slot10am!.reasonUnavailable, undefined, "Available slot must not have an unavailability reason");
    console.log(`✔ [TEST 4 PASSED] Real Available Slot identified: [${slot10am!.formattedTime}] (${slot10am!.brokerName}).\n`);

    // -------------------------------------------------------------
    // TEST 5: Internal Booking Collision Lockout (Double-Booking Prevention)
    // -------------------------------------------------------------
    console.log("▶ [TEST 5] Booking 10:00 AM slot and verifying internal clash detection...");
    const booking = await appointmentsService.createAppointment(mockTenant, {
      leadId: testLeadId,
      propertyId: testPropertyId,
      startTime: slot10am!.startTime,
      endTime: slot10am!.endTime,
      meetingType: "in_person_viewing",
      location: "Zone A, Banana Island, Lagos",
      notes: "Day 16 slot availability verification booking",
    });
    bookedAppointmentId = booking.id;
    assert(booking.id, "Appointment creation must return an id");
    assert.strictEqual(booking.status, "confirmed");

    // Re-query availability
    const refreshedSlots = await appointmentsService.getAvailableSlots(
      mockTenant,
      testPropertyId,
      targetDateStr
    );
    const refreshed10am = refreshedSlots.find((s) => s.formattedTime.includes("10:00 AM") || s.startTime.includes("T10:00:00"));
    assert(refreshed10am, "10:00 AM slot must be returned in refreshed slots");
    assert.strictEqual(refreshed10am!.isAvailable, false, "10:00 AM slot must now be marked unavailable after booking");
    assert(
      refreshed10am!.reasonUnavailable?.includes("already booked"),
      `Expected reason to indicate internal booking, got: '${refreshed10am!.reasonUnavailable}'`
    );
    console.log(`✔ [TEST 5 PASSED] Slot availability accurately transitioned from open to booked: '${refreshed10am!.reasonUnavailable}'.\n`);

    // -------------------------------------------------------------
    // TEST 6: Inviolable Re-Booking Lockout (ConflictException)
    // -------------------------------------------------------------
    console.log("▶ [TEST 6] Testing double-booking rejection on newly booked 10:00 AM slot...");
    let conflictCaught = false;
    try {
      await appointmentsService.createAppointment(mockTenant, {
        leadId: testLeadId,
        propertyId: testPropertyId,
        startTime: slot10am!.startTime,
        endTime: slot10am!.endTime,
        meetingType: "in_person_viewing",
        location: "Zone A, Banana Island, Lagos",
      });
    } catch (err: any) {
      conflictCaught = true;
      assert(
        err.message.includes("already booked") || err.status === 409,
        `Expected conflict error, got: ${err.message}`
      );
    }
    assert(conflictCaught, "Must reject duplicate booking attempt on reserved slot with 409 Conflict");
    console.log("✔ [TEST 6 PASSED] Inviolable double-booking collision lockout verified (409 ConflictException).\n");

    // -------------------------------------------------------------
    // TEST 7: Multi-Tenant Availability Isolation
    // -------------------------------------------------------------
    console.log("▶ [TEST 7] Verifying multi-tenant slot availability isolation...");
    const isolatedSlots = await appointmentsService.getAvailableSlots(
      isolatedTenant,
      isolatedPropertyId,
      targetDateStr
    );
    const isolated10am = isolatedSlots.find((s) => s.formattedTime.includes("10:00 AM") || s.startTime.includes("T10:00:00"));
    assert(isolated10am, "10:00 AM slot must exist in isolated tenant schedule");
    assert.strictEqual(
      isolated10am!.isAvailable,
      true,
      "10:00 AM slot must remain available in Workspace B (no cross-tenant leakage of Workspace A booking)"
    );
    console.log("✔ [TEST 7 PASSED] Workspace isolation verified: Workspace A booking does not restrict Workspace B slots.\n");

    console.log("=========================================================");
    console.log(" ALL DAY 16 AVAILABILITY RETRIEVAL TESTS PASSED (7/7 - 100%)");
    console.log("=========================================================\n");
  } catch (error) {
    console.error("❌ [DAY 16 TEST FAILED]", error);
    process.exit(1);
  } finally {
    console.log("▶ [TEARDOWN] Purging test fixtures from Neon PostgreSQL...");
    try {
      if (bookedAppointmentId) {
        await db.delete(schema.systemEvents).where(eq(schema.systemEvents.workspaceId, TEST_WS_DAY16));
        await db.delete(schema.auditLogs).where(eq(schema.auditLogs.workspaceId, TEST_WS_DAY16));
        await db.delete(schema.appointments).where(eq(schema.appointments.workspaceId, TEST_WS_DAY16));
      }
      await db.delete(schema.properties).where(eq(schema.properties.workspaceId, TEST_WS_DAY16));
      await db.delete(schema.properties).where(eq(schema.properties.workspaceId, TEST_WS_DAY16_ISOLATED));
      await db.delete(schema.leads).where(eq(schema.leads.workspaceId, TEST_WS_DAY16));
      await db.delete(schema.workspaces).where(eq(schema.workspaces.id, TEST_WS_DAY16));
      await db.delete(schema.workspaces).where(eq(schema.workspaces.id, TEST_WS_DAY16_ISOLATED));
      console.log("✔ [TEARDOWN COMPLETE] Test fixtures purged.\n");
    } catch (teardownErr) {
      console.warn("Teardown warning:", (teardownErr as Error).message);
    }
    await app.close();
  }
}

runDay16AvailabilityRetrievalTests();
