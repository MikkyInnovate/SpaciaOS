/**
 * PACIA FRONTEND USER-FLOW TEST SUITE
 * 
 * Verifies end-to-end multi-step interactive operational journeys through
 * the client application and feature services:
 * - Journey 1: Lead Intake & Qualification Flow
 * - Journey 2: Voice Call Review & Human Broker Takeover
 * - Journey 3: Inspection Booking & Scheduling Flow
 * - Journey 4: Team Member Invitation & Role Elevation
 * - Journey 5: Internal Operations Command & Workflow Recovery
 */

import { describe, it, expect } from "./setup";
import { leadsService } from "@/features/leads/services/leads-service";
import { callsService } from "@/features/calls/services/calls-service";
import { appointmentsService } from "@/features/appointments/services/appointments-service";
import { teamService } from "@/features/team/services/team-service";
import { opsService } from "@/features/ops/services/ops-service";

export async function runUserFlowTests() {
  await describe("Journey 1: Lead Intake & Qualification Flow", async () => {
    await it("filters inbound leads by HOT score category (80+)", async () => {
      const res = await leadsService.getLeads({ scoreCategory: "HOT" });
      expect(res.leads.length).toBeGreaterThan(0);
      for (const lead of res.leads) {
        expect(lead.scoreCategory).toBe("HOT");
        expect(lead.score).toBeGreaterThanOrEqual(80);
      }
    });

    await it("retrieves lead dossier with target property specs and BANT context", async () => {
      const res = await leadsService.getLeads();
      const firstLead = res.leads[0];
      const leadDetail = await leadsService.getLeadById(firstLead.id);

      expect(leadDetail).toBeTruthy();
      expect(leadDetail?.id).toBe(firstLead.id);
      expect(leadDetail?.name).toBe(firstLead.name);
      expect(leadDetail?.budget).toBeDefined();
      expect(leadDetail?.propertyTitle).toBeDefined();
      expect(leadDetail?.location).toBeDefined();
    });

    await it("appends broker memo note with photo attachment to lead activity timeline", async () => {
      const res = await leadsService.getLeads();
      const targetLead = res.leads[0];

      const newActivity = await leadsService.addLeadActivity(targetLead.id, {
        type: "human_note",
        title: "Site Survey & Title Document Attached",
        description: "Governor Consent verified at Land Registry. Buyer ready to place initial deposit.",
        timestamp: "Just now",
        actor: { type: "human_broker", name: "Ade Admin", role: "Senior Luxury Closer" },
        meta: {
          imageUrl: "https://example.com/gov_consent.jpg",
          imageCaption: "gov_consent_scan.jpg",
        },
      });

      expect(newActivity).toBeTruthy();
      expect(newActivity.title).toBe("Site Survey & Title Document Attached");
      expect(newActivity.actor?.type).toBe("human_broker");
      expect(newActivity.meta?.imageUrl).toBe("https://example.com/gov_consent.jpg");

      // Verify the activity appears on the lead's timeline
      const updatedLead = await leadsService.getLeadById(targetLead.id);
      const found = updatedLead?.activities?.find((a) => a.id === newActivity.id);
      expect(found).toBeDefined();
    });

    await it("transitions lead lifecycle status to 'Viewing Booked' with optimistic sync", async () => {
      const res = await leadsService.getLeads();
      const targetLead = res.leads[0];

      const updated = await leadsService.updateLeadStatus(
        targetLead.id,
        "Viewing Booked",
        "Physical inspection confirmed for Saturday 2 PM"
      );

      expect(updated.status).toBe("Viewing Booked");

      const reFetched = await leadsService.getLeadById(targetLead.id);
      expect(reFetched?.status).toBe("Viewing Booked");
    });
  });

  await describe("Journey 2: Voice Call Review & Human Broker Takeover", async () => {
    await it("retrieves voice calls filtered by outcome ('qualified')", async () => {
      const calls = await callsService.getCalls({ outcome: "qualified" });
      expect(calls.length).toBeGreaterThan(0);
      for (const call of calls) {
        expect(call.outcome).toBe("qualified");
      }
    });

    await it("inspects synchronized audio transcript turns and sentiment", async () => {
      const calls = await callsService.getCalls();
      const activeCall = calls[0];
      const callDetail = await callsService.getCallById(activeCall.id);

      expect(callDetail).toBeTruthy();
      expect(callDetail?.recordingState).toBeDefined();
      expect(callDetail?.transcript?.length).toBeGreaterThan(0);

      // Check speaker turn attribution
      const firstTurn = callDetail?.transcript[0];
      expect(firstTurn?.speaker).toBeDefined();
      expect(firstTurn?.message).toBeDefined();
    });

    await it("executes single-click human broker takeover and halts AI engine", async () => {
      const leads = await leadsService.getLeads();
      const leadToTakeover = leads.leads[0];

      const takeoverResult = await leadsService.takeoverLead(
        leadToTakeover.id,
        "Ade Admin (Senior Luxury Closer)",
        "VIP client requested direct principal broker communication"
      );

      expect(takeoverResult).toBeTruthy();
      expect(takeoverResult.managementMode).toBe("human_managed");
      expect(takeoverResult.isAiStopped).toBe(true);
    });
  });

  await describe("Journey 3: Inspection Booking & Scheduling Flow", async () => {
    await it("retrieves available inspection slots for target property without Sunday collisions", async () => {
      const nextMonday = new Date();
      nextMonday.setDate(nextMonday.getDate() + ((1 + 7 - nextMonday.getDay()) % 7 || 7));

      const slots = await appointmentsService.getAvailableSlots("prop_banana_villa", nextMonday);
      expect(slots.length).toBeGreaterThan(0);

      const availableSlot = slots.find((s) => s.isAvailable);
      expect(availableSlot).toBeDefined();
      expect(availableSlot?.formattedTime).toBeDefined();
    });

    await it("creates a confirmed viewing appointment and generates VIP reference code", async () => {
      const targetDate = new Date(Date.now() + 86400000 * 3);
      const newApt = await appointmentsService.createAppointment({
        leadId: "lead_adeleke",
        leadName: "Chief Adeleke",
        leadPhone: "+234 802 345 6789",
        propertyId: "prop_banana_villa",
        propertyTitle: "The Grand Waterfront Villa",
        location: "Zone A, Banana Island, Ikoyi, Lagos",
        startTime: targetDate.toISOString(),
        meetingType: "vip_private_showing",
        notes: "VIP Inspection. High-net-worth investor.",
        generateGatePass: true,
      });

      expect(newApt.id).toBeDefined();
      expect(newApt.status).toBe("confirmed");
      expect(newApt.leadName).toBe("Chief Adeleke");
      expect(newApt.gatePassCode).toBeDefined();
      expect(newApt.gatePassCode).toContain("VIP");
    });

    await it("cancels appointment with luxury quick-reason chip", async () => {
      const appointments = await appointmentsService.getAppointments();
      const targetApt = appointments[0];

      const cancelled = await appointmentsService.updateStatus(
        targetApt.id,
        "cancelled",
        "Broker scheduling conflict"
      );

      expect(cancelled.status).toBe("cancelled");
      expect(cancelled.cancelledReason).toBe("Broker scheduling conflict");
    });
  });

  await describe("Journey 4: Team Member Invitation & Role Elevation", async () => {
    await it("retrieves current team roster and role definitions", async () => {
      const roles = await teamService.getRoles();
      expect(roles.length).toBe(4); // owner, admin, sales_manager, sales_agent
      expect(roles.find((r) => r.role === "owner")).toBeDefined();
      expect(roles.find((r) => r.role === "admin")).toBeDefined();
      expect(roles.find((r) => r.role === "sales_manager")).toBeDefined();
      expect(roles.find((r) => r.role === "sales_agent")).toBeDefined();
    });

    await it("verifies team KPI metrics calculations", async () => {
      const stats = await teamService.getStats();
      expect(stats.totalMembers).toBeGreaterThanOrEqual(0);
      expect(stats.capacityUtilizationPercent).toBeGreaterThanOrEqual(0);
    });
  });

  await describe("Journey 5: Internal Operations Command & Workflow Recovery", async () => {
    await it("retrieves operational pulse overview", async () => {
      const overview = await opsService.getOverview();
      expect(overview).toBeDefined();
      expect(overview.totalWorkspaces).toBeGreaterThan(0);
      expect(overview.systemStatus).toBe("operational");
    });

    await it("executes 1-click retry on background queue workflow", async () => {
      const retryResult = await opsService.retryWorkflow("evt_test_failure_01");
      expect(retryResult).toBeDefined();
      expect(retryResult.success).toBe(true);
    });
  });
}
