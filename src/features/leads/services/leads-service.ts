import { apiClient } from "@/lib/api/client";
import type {
  Lead,
  LeadFilterParams,
  LeadsApiResponse,
  LeadStatus,
  LeadActivity,
  FollowUpSchedule,
  LossDetails,
  HandoffContext,
} from "../types";
import { MOCK_LEADS } from "../data/mock-leads";

/**
 * Proposed Backend Contracts (Defined by Frontend, Pending Backend Verification):
 * - GET /api/v1/leads?search=&scoreCategory=&status=&managementMode=
 * - GET /api/v1/leads/:id
 * - PATCH /api/v1/leads/:id/status { status, note }
 * - POST /api/v1/leads/:id/activities { type, title, description }
 * - POST /api/v1/leads/:id/takeover { brokerName, reason }
 * - POST /api/v1/leads/:id/stop-ai { reason }
 * - POST /api/v1/leads/:id/resume-ai {}
 * - POST /api/v1/leads/:id/nurture { schedule, notes }
 * - POST /api/v1/leads/:id/lost { lossDetails }
 * - PATCH /api/v1/leads/:id/follow-up { schedule }
 *
 * Mock Boundary Strategy:
 * Until backend services implement and verify these endpoints, this service
 * catches network/404 errors and maintains an in-memory session copy of MOCK_LEADS.
 * All mock data is clearly isolated behind this adapter.
 */

// In-memory mock session store for client-side state transitions
const inMemoryMockLeads: Lead[] = JSON.parse(JSON.stringify(MOCK_LEADS));

class LeadsService {
  /**
   * Fetches leads with optional client-side/server-side filtering.
   */
  async getLeads(filters?: LeadFilterParams): Promise<LeadsApiResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.search) queryParams.set("search", filters.search);
      if (filters?.scoreCategory && filters.scoreCategory !== "ALL") {
        queryParams.set("scoreCategory", filters.scoreCategory);
      }
      if (filters?.status && filters.status !== "ALL") {
        queryParams.set("status", filters.status);
      }

      const queryString = queryParams.toString();
      const endpoint = "/api/v1/leads" + (queryString ? "?" + queryString : "");

      const response = await apiClient.get<LeadsApiResponse>(endpoint);
      if (response && Array.isArray(response.leads)) {
        return response;
      }
    } catch {
      // Backend not yet available: fall through to deterministic mock fallback
    }

    // Mock fallback with simulated network delay
    await new Promise((resolve) => setTimeout(resolve, 150));

    let filtered = [...inMemoryMockLeads];

    if (filters?.search?.trim()) {
      const query = filters.search.toLowerCase().trim();
      filtered = filtered.filter(
        (lead) =>
          lead.name.toLowerCase().includes(query) ||
          lead.phone.toLowerCase().includes(query) ||
          lead.propertyTitle.toLowerCase().includes(query) ||
          lead.location.toLowerCase().includes(query)
      );
    }

    if (filters?.scoreCategory && filters.scoreCategory !== "ALL") {
      filtered = filtered.filter((lead) => lead.scoreCategory === filters.scoreCategory);
    }

    if (filters?.status && filters.status !== "ALL") {
      filtered = filtered.filter((lead) => lead.status === filters.status);
    }

    if (filters?.managementMode && filters.managementMode !== "ALL") {
      filtered = filtered.filter((lead) => lead.managementMode === filters.managementMode);
    }

    return {
      leads: filtered,
      total: filtered.length,
    };
  }

  /**
   * Fetches a single lead by its ID.
   */
  async getLeadById(id: string): Promise<Lead | null> {
    try {
      const response = await apiClient.get<{ lead: Lead }>("/api/v1/leads/" + id);
      if (response?.lead) {
        return response.lead;
      }
    } catch {
      // Backend not yet available: fall through to deterministic mock fallback
    }

    const found = inMemoryMockLeads.find((lead) => lead.id === id);
    return found ? JSON.parse(JSON.stringify(found)) : null;
  }

  /**
   * Proposed contract: Update lead lifecycle status.
   */
  async updateLeadStatus(id: string, newStatus: LeadStatus, note?: string): Promise<Lead> {
    try {
      const response = await apiClient.patch<{ lead: Lead }>(`/api/v1/leads/${id}/status`, {
        status: newStatus,
        note,
      });
      if (response?.lead) {
        return response.lead;
      }
    } catch {
      // Backend not yet available: update in-memory mock store
    }

    await new Promise((resolve) => setTimeout(resolve, 150));

    const index = inMemoryMockLeads.findIndex((l) => l.id === id);
    if (index === -1) {
      throw new Error(`Lead with ID ${id} not found.`);
    }

    const currentLead = inMemoryMockLeads[index];
    const updatedLead: Lead = {
      ...currentLead,
      status: newStatus,
    };

    // Append an activity entry for this status transition
    const statusActivity: LeadActivity = {
      id: `act_status_${Date.now()}`,
      type: "status_change",
      title: `Status Transitioned to ${newStatus}`,
      description: note || `Broker updated lifecycle status from ${currentLead.status} to ${newStatus}.`,
      timestamp: "Just now",
      channel: "Broker Command",
    };

    updatedLead.activities = [statusActivity, ...(updatedLead.activities || [])];
    inMemoryMockLeads[index] = updatedLead;

    return JSON.parse(JSON.stringify(updatedLead));
  }

  /**
   * Proposed contract: Add an activity entry to a lead.
   */
  async addLeadActivity(
    id: string,
    activityData: Omit<LeadActivity, "id">
  ): Promise<LeadActivity> {
    const newActivity: LeadActivity = {
      ...activityData,
      id: `act_${Date.now()}`,
    };

    try {
      const response = await apiClient.post<{ activity: LeadActivity }>(
        `/api/v1/leads/${id}/activities`,
        newActivity
      );
      if (response?.activity) {
        return response.activity;
      }
    } catch {
      // Backend not yet available: update in-memory mock store
    }

    const index = inMemoryMockLeads.findIndex((l) => l.id === id);
    if (index !== -1) {
      inMemoryMockLeads[index].activities = [
        newActivity,
        ...(inMemoryMockLeads[index].activities || []),
      ];
    }

    return newActivity;
  }

  /**
   * Proposed contract: POST /api/v1/leads/:id/takeover
   * Human broker seizes direct control of the lead, pausing AI automation.
   */
  async takeoverLead(
    id: string,
    brokerName = "Marcus Vance",
    reason = "Manual broker takeover initiated"
  ): Promise<Lead> {
    try {
      const response = await apiClient.post<{ lead: Lead }>(
        `/api/v1/leads/${id}/takeover`,
        { brokerName, reason }
      );
      if (response?.lead) return response.lead;
    } catch {
      // Fallback
    }

    await new Promise((r) => setTimeout(r, 120));

    const index = inMemoryMockLeads.findIndex((l) => l.id === id);
    if (index === -1) throw new Error(`Lead ${id} not found.`);

    const current = inMemoryMockLeads[index];
    const handoff: HandoffContext = {
      triggerReason: reason,
      triggerCategory: "manual_broker",
      synthesis:
        current.handoffContext?.synthesis ||
        current.aiNotes ||
        "Lead transitioned to direct human supervision. AI automation paused.",
      keyQuotes: current.handoffContext?.keyQuotes || [
        `Lead requested broker follow-up on ${current.propertyTitle}.`,
      ],
      unresolvedObjections: current.handoffContext?.unresolvedObjections || [],
      handedOffAt: "Just now",
      brokerName,
    };

    const updated: Lead = {
      ...current,
      status: "Human Managed",
      managementMode: "human_managed",
      assignedBroker: brokerName,
      isAiStopped: true,
      aiStoppedReason: `Direct human supervision active under ${brokerName}.`,
      handoffContext: handoff,
    };

    const takeoverActivity: LeadActivity = {
      id: `act_takeover_${Date.now()}`,
      type: "status_change",
      title: "Broker Seized Direct Control",
      description: `Autonomous AI paused. ${brokerName} assumed active transaction leadership.`,
      timestamp: "Just now",
      channel: "Broker Command",
      actor: {
        type: "human_broker",
        name: brokerName,
        role: "Sales Associate",
        territory: current.location,
        verifiedBadge: true,
      },
    };

    updated.activities = [takeoverActivity, ...(updated.activities || [])];
    inMemoryMockLeads[index] = updated;

    return JSON.parse(JSON.stringify(updated));
  }

  /**
   * Proposed contract: POST /api/v1/leads/:id/stop-ai
   * Pauses autonomous AI actions without claiming lead.
   */
  async stopAI(id: string, reason = "Broker paused autonomous AI automation"): Promise<Lead> {
    try {
      const res = await apiClient.post<{ lead: Lead }>(`/api/v1/leads/${id}/stop-ai`, {
        reason,
      });
      if (res?.lead) return res.lead;
    } catch {
      // Fallback
    }

    await new Promise((r) => setTimeout(r, 100));

    const index = inMemoryMockLeads.findIndex((l) => l.id === id);
    if (index === -1) throw new Error(`Lead ${id} not found.`);

    const current = inMemoryMockLeads[index];
    const updated: Lead = {
      ...current,
      isAiStopped: true,
      aiStoppedReason: reason,
    };

    const activity: LeadActivity = {
      id: `act_stop_ai_${Date.now()}`,
      type: "status_change",
      title: "AI Automation Suspended",
      description: reason,
      timestamp: "Just now",
      channel: "AI Supervisor",
    };

    updated.activities = [activity, ...(updated.activities || [])];
    inMemoryMockLeads[index] = updated;

    return JSON.parse(JSON.stringify(updated));
  }

  /**
   * Proposed contract: POST /api/v1/leads/:id/resume-ai
   * Resumes autonomous AI engine for this lead.
   */
  async resumeAI(id: string): Promise<Lead> {
    try {
      const res = await apiClient.post<{ lead: Lead }>(`/api/v1/leads/${id}/resume-ai`, {});
      if (res?.lead) return res.lead;
    } catch {
      // Fallback
    }

    await new Promise((r) => setTimeout(r, 100));

    const index = inMemoryMockLeads.findIndex((l) => l.id === id);
    if (index === -1) throw new Error(`Lead ${id} not found.`);

    const current = inMemoryMockLeads[index];
    const updated: Lead = {
      ...current,
      isAiStopped: false,
      aiStoppedReason: undefined,
    };

    const activity: LeadActivity = {
      id: `act_resume_ai_${Date.now()}`,
      type: "status_change",
      title: "AI Automation Resumed",
      description: "Autonomous voice and chat engagement active.",
      timestamp: "Just now",
      channel: "AI Supervisor",
    };

    updated.activities = [activity, ...(updated.activities || [])];
    inMemoryMockLeads[index] = updated;

    return JSON.parse(JSON.stringify(updated));
  }

  /**
   * Proposed contract: POST /api/v1/leads/:id/nurture
   * Marks lead as Nurture and schedules follow-up cadence.
   */
  async markNurture(
    id: string,
    schedule: FollowUpSchedule,
    notes?: string
  ): Promise<Lead> {
    try {
      const res = await apiClient.post<{ lead: Lead }>(`/api/v1/leads/${id}/nurture`, {
        schedule,
        notes,
      });
      if (res?.lead) return res.lead;
    } catch {
      // Fallback
    }

    await new Promise((r) => setTimeout(r, 120));

    const index = inMemoryMockLeads.findIndex((l) => l.id === id);
    if (index === -1) throw new Error(`Lead ${id} not found.`);

    const current = inMemoryMockLeads[index];
    const updated: Lead = {
      ...current,
      status: "Nurture",
      managementMode: "nurture",
      followUpSchedule: schedule,
    };

    const activity: LeadActivity = {
      id: `act_nurture_${Date.now()}`,
      type: "status_change",
      title: "Transitioned to Nurture Pipeline",
      description: `Follow-up set for ${schedule.scheduledFormatted} (${schedule.relativeCountdown}) via ${schedule.channel.toUpperCase()}.${notes ? ` Note: ${notes}` : ""}`,
      timestamp: "Just now",
      channel: "Broker Command",
    };

    updated.activities = [activity, ...(updated.activities || [])];
    inMemoryMockLeads[index] = updated;

    return JSON.parse(JSON.stringify(updated));
  }

  /**
   * Proposed contract: POST /api/v1/leads/:id/lost
   * Marks lead as Lost with structured reason classification.
   */
  async markLost(id: string, lossDetails: LossDetails): Promise<Lead> {
    try {
      const res = await apiClient.post<{ lead: Lead }>(`/api/v1/leads/${id}/lost`, {
        lossDetails,
      });
      if (res?.lead) return res.lead;
    } catch {
      // Fallback
    }

    await new Promise((r) => setTimeout(r, 120));

    const index = inMemoryMockLeads.findIndex((l) => l.id === id);
    if (index === -1) throw new Error(`Lead ${id} not found.`);

    const current = inMemoryMockLeads[index];
    const updated: Lead = {
      ...current,
      status: "Lost",
      managementMode: "lost",
      isAiStopped: true,
      aiStoppedReason: `Deal marked as lost: ${lossDetails.reasonLabel}`,
      lossDetails,
    };

    const activity: LeadActivity = {
      id: `act_lost_${Date.now()}`,
      type: "status_change",
      title: `Deal Marked as Lost: ${lossDetails.reasonLabel}`,
      description: lossDetails.notes || `Discontinued qualification. Reason: ${lossDetails.reasonLabel}`,
      timestamp: "Just now",
      channel: "Broker Command",
    };

    updated.activities = [activity, ...(updated.activities || [])];
    inMemoryMockLeads[index] = updated;

    return JSON.parse(JSON.stringify(updated));
  }

  /**
   * Proposed contract: PATCH /api/v1/leads/:id/follow-up
   * Updates or reschedules the follow-up reminder.
   */
  async updateFollowUpSchedule(id: string, schedule: FollowUpSchedule): Promise<Lead> {
    try {
      const res = await apiClient.patch<{ lead: Lead }>(`/api/v1/leads/${id}/follow-up`, {
        schedule,
      });
      if (res?.lead) return res.lead;
    } catch {
      // Fallback
    }

    await new Promise((r) => setTimeout(r, 100));

    const index = inMemoryMockLeads.findIndex((l) => l.id === id);
    if (index === -1) throw new Error(`Lead ${id} not found.`);

    const current = inMemoryMockLeads[index];
    const updated: Lead = {
      ...current,
      followUpSchedule: schedule,
    };

    const activity: LeadActivity = {
      id: `act_resched_${Date.now()}`,
      type: "status_change",
      title: "Follow-up Touchpoint Rescheduled",
      description: `New schedule: ${schedule.scheduledFormatted} (${schedule.relativeCountdown}) via ${schedule.channel.toUpperCase()}.`,
      timestamp: "Just now",
      channel: "Broker Calendar",
    };

    updated.activities = [activity, ...(updated.activities || [])];
    inMemoryMockLeads[index] = updated;

    return JSON.parse(JSON.stringify(updated));
  }

  /**
   * Proposed contract: PATCH /api/v1/leads/:id/objections/:objectionId
   * Resolves or reopens a buyer objection and dynamically recalculates qualification score.
   */
  async updateObjectionStatus(
    leadId: string,
    objectionId: string,
    status: "open" | "resolved",
    note?: string
  ): Promise<{ lead: Lead; scoreDelta: number }> {
    try {
      const res = await apiClient.patch<{ lead: Lead; scoreDelta: number }>(
        `/api/v1/leads/${leadId}/objections/${objectionId}`,
        { status, note }
      );
      if (res?.lead) return res;
    } catch {
      // Fallback
    }

    await new Promise((r) => setTimeout(r, 100));

    const index = inMemoryMockLeads.findIndex((l) => l.id === leadId);
    if (index === -1) throw new Error(`Lead ${leadId} not found.`);

    const current = inMemoryMockLeads[index];
    const profile = current.qualificationProfile;
    if (!profile) return { lead: JSON.parse(JSON.stringify(current)), scoreDelta: 0 };

    let scoreDelta = 0;
    const updatedObjections = profile.objections.map((obj) => {
      if (obj.id === objectionId) {
        const prevStatus = obj.status;
        if (prevStatus !== status) {
          // If resolving: award +6 to +10 score lift depending on severity
          const impactValue = obj.severity === "high" ? 10 : obj.severity === "medium" ? 6 : 4;
          scoreDelta = status === "resolved" ? impactValue : -impactValue;
        }
        return {
          ...obj,
          status,
          resolutionNote: note || obj.resolutionNote,
          resolvedAt: status === "resolved" ? "Just now" : undefined,
        };
      }
      return obj;
    });

    // Recalculate score
    const newScore = Math.min(99, Math.max(10, current.score + scoreDelta));
    const newScoreCategory: "HOT" | "WARM" | "COLD" =
      newScore >= 85 ? "HOT" : newScore >= 60 ? "WARM" : "COLD";

    // Update risk factors in explainable breakdown
    const updatedRiskFactors = profile.explainableBreakdown.riskFactors.map((rf) => {
      if (rf.category === "objection") {
        return {
          ...rf,
          impact: status === "resolved" ? 0 : -Math.abs(rf.impact || 5),
          detail: status === "resolved" ? `Resolved: ${note || "Objection addressed"}` : rf.detail,
        };
      }
      return rf;
    });

    const targetObj = profile.objections.find((o) => o.id === objectionId);
    const objTitle = targetObj?.title || "Buyer Concern";

    const activity: LeadActivity = {
      id: `act_obj_${Date.now()}`,
      type: "status_change",
      title: status === "resolved" ? `Objection Resolved: ${objTitle}` : `Objection Reopened: ${objTitle}`,
      description:
        note ||
        (status === "resolved"
          ? `Broker addressed objection (${objTitle}). Score adjusted by +${scoreDelta} pts.`
          : `Objection (${objTitle}) reopened for broker intervention. Score adjusted by ${scoreDelta} pts.`),
      timestamp: "Just now",
      channel: "Broker Command",
      actor: {
        type: "human_broker",
        name: current.assignedBroker || "Assigned Broker",
        role: "Sales Associate",
        verifiedBadge: true,
      },
    };

    const updated: Lead = {
      ...current,
      score: newScore,
      scoreCategory: newScoreCategory,
      qualificationProfile: {
        ...profile,
        objections: updatedObjections,
        explainableBreakdown: {
          ...profile.explainableBreakdown,
          riskFactors: updatedRiskFactors,
        },
      },
      activities: [activity, ...(current.activities || [])],
    };

    inMemoryMockLeads[index] = updated;

    return { lead: JSON.parse(JSON.stringify(updated)), scoreDelta };
  }
}

export const leadsService = new LeadsService();
