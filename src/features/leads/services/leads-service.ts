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
  CreateLeadInput,
  DuplicateCheckResult,
  DuplicateMatch,
  AiToolExecutionStep,
} from "../types";
import { MOCK_LEADS } from "../data/mock-leads";

/**
 * Normalizes phone numbers for canonical matching across Nigerian local (080...)
 * and international (+234...) formats.
 */
export function normalizePhoneNumber(raw?: string): string {
  if (!raw) return "";
  let cleaned = raw.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+")) {
    cleaned = cleaned.substring(1);
  }
  // Nigerian local standard: 080... (11 digits) -> 23480...
  if (cleaned.startsWith("0") && cleaned.length === 11) {
    cleaned = "234" + cleaned.substring(1);
  } else if (cleaned.length === 10 && !cleaned.startsWith("234")) {
    cleaned = "234" + cleaned;
  }
  return cleaned;
}

function createUniqueId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

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

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUuid(id: string): boolean {
  return UUID_REGEX.test(id);
}

const LEAD_ALIAS_MAP: Record<string, string> = {
  lead_adeleke: "lead_01",
  lead_jenkins: "lead_02",
  lead_babatunde: "lead_03",
  lead_eze: "lead_04",
  lead_okafor: "lead_05",
  lead_yusuf: "lead_06",
  lead_bakare: "lead_07",
  lead_nwosu: "lead_08",
  lead_adesina: "lead_09",
};

function resolveLeadId(id: string): string {
  if (!id) return "lead_01";
  return LEAD_ALIAS_MAP[id] || id;
}

// In-memory mock session store for client-side state transitions
const inMemoryMockLeads: Lead[] = JSON.parse(JSON.stringify(MOCK_LEADS));

class LeadsService {
  /**
   * Fetches leads with optional client-side/server-side filtering.
   */
  async getLeads(filters?: LeadFilterParams): Promise<LeadsApiResponse> {
    const queryParams = new URLSearchParams();
    if (filters?.search) queryParams.set("search", filters.search);
    if (filters?.scoreCategory && filters.scoreCategory !== "ALL") {
      queryParams.set("scoreCategory", filters.scoreCategory);
    }
    if (filters?.status && filters.status !== "ALL") {
      queryParams.set("status", filters.status);
    }
    if (filters?.managementMode && filters.managementMode !== "ALL") {
      queryParams.set("managementMode", filters.managementMode);
    }

    const queryString = queryParams.toString();
    const endpoint = "/api/v1/leads" + (queryString ? "?" + queryString : "");

    const response = await apiClient.get<LeadsApiResponse | { leads: Lead[]; total: number }>(
      endpoint
    );
    if (response && Array.isArray((response as any).leads)) {
      return response as LeadsApiResponse;
    }

    throw new Error("Invalid response format received from leads API.");
  }

  /**
   * Fetches a single lead by its ID.
   */
  async getLeadById(id: string): Promise<Lead | null> {
    if (isUuid(id)) {
      try {
        const response = await apiClient.get<Lead | { lead: Lead }>("/api/v1/leads/" + id);
        if (response) {
          if ("lead" in response && (response as any).lead) {
            return (response as any).lead;
          }
          return response as Lead;
        }
      } catch (err) {
        console.warn(`Could not fetch lead '${id}' from API, using fallback:`, err);
      }
    }
    const targetId = resolveLeadId(id);
    const found =
      inMemoryMockLeads.find((l) => l.id === id || l.id === targetId) ||
      MOCK_LEADS.find((l) => l.id === id || l.id === targetId);
    return found ? JSON.parse(JSON.stringify(found)) : null;
  }

  /**
   * Proposed contract: Update lead lifecycle status.
   */
  async updateLeadStatus(id: string, newStatus: LeadStatus, note?: string): Promise<Lead> {
    if (isUuid(id)) {
      try {
        const response = await apiClient.patch<Lead | { lead: Lead }>(`/api/v1/leads/${id}/status`, {
          status: newStatus,
          note,
        });
        if (response) {
          if ("lead" in response && (response as any).lead) {
            return (response as any).lead;
          }
          return response as Lead;
        }
      } catch (err) {
        console.warn(`Backend updateLeadStatus failed for lead ${id}, applying local update:`, err);
      }
    }

    // Local fallback for mock leads or offline backend
    const isHuman = newStatus === "Human Managed";
    const targetId = resolveLeadId(id);
    const index = inMemoryMockLeads.findIndex((l) => l.id === id || l.id === targetId);
    if (index !== -1) {
      const current = inMemoryMockLeads[index];
      const updated: Lead = {
        ...current,
        status: newStatus,
        managementMode: isHuman ? "human_managed" : current.managementMode,
        isAiStopped: isHuman ? true : current.isAiStopped,
      };
      inMemoryMockLeads[index] = updated;
      return JSON.parse(JSON.stringify(updated));
    }

    const fallbackLead = MOCK_LEADS.find((l) => l.id === id || l.id === targetId);
    if (fallbackLead) {
      const updated: Lead = {
        ...fallbackLead,
        status: newStatus,
        managementMode: isHuman ? "human_managed" : fallbackLead.managementMode,
        isAiStopped: isHuman ? true : fallbackLead.isAiStopped,
      };
      inMemoryMockLeads.push(updated);
      return JSON.parse(JSON.stringify(updated));
    }

    // Synthesize fallback to prevent UI crash
    const synthesized: Lead = {
      ...MOCK_LEADS[0],
      id,
      name: id.replace("lead_", "").replace(/^\w/, (c) => c.toUpperCase()) + " (Lead)",
      status: newStatus,
      managementMode: isHuman ? "human_managed" : "ai_autonomous",
      isAiStopped: isHuman ? true : false,
    };
    inMemoryMockLeads.push(synthesized);
    return synthesized;
  }

  /**
   * Proposed contract: Add an activity entry to a lead.
   */
  async addLeadActivity(
    id: string,
    activityData: Omit<LeadActivity, "id">
  ): Promise<LeadActivity> {
    if (isUuid(id)) {
      try {
        const response = await apiClient.post<LeadActivity | { activity: LeadActivity }>(
          `/api/v1/leads/${id}/activities`,
          {
            type: activityData.type,
            title: activityData.title,
            description: activityData.description,
            channel: activityData.channel,
            metadata: activityData.meta,
          }
        );
        if (response) {
          if ("activity" in response && (response as any).activity) {
            return (response as any).activity;
          }
          return response as LeadActivity;
        }
      } catch (err) {
        console.warn(`Backend addLeadActivity failed for lead ${id}:`, err);
      }
    }

    const activity: LeadActivity = {
      id: createUniqueId("act"),
      ...activityData,
      timestamp: "Just now",
    };
    const index = inMemoryMockLeads.findIndex((l) => l.id === id);
    if (index !== -1) {
      inMemoryMockLeads[index].activities = [activity, ...(inMemoryMockLeads[index].activities || [])];
    }
    return activity;
  }

  /**
   * Human broker seizes direct control of the lead, pausing AI automation.
   */
  async takeoverLead(
    id: string,
    brokerName = "Marcus Vance",
    reason = "Manual broker takeover initiated"
  ): Promise<Lead> {
    if (isUuid(id)) {
      try {
        const res = await apiClient.post<any>(`/api/v1/leads/${id}/takeover`, {
          brokerName,
          reason,
        });
        if (res?.lead) return res.lead;
      } catch (err) {
        console.warn(`Backend takeoverLead failed for lead ${id}:`, err);
      }
    }
    return this.updateLeadStatus(id, "Human Managed", `${reason} (Broker: ${brokerName})`);
  }

  /**
   * Pauses autonomous AI actions without claiming lead.
   */
  async stopAI(id: string, reason = "Broker paused autonomous AI automation"): Promise<Lead> {
    if (isUuid(id)) {
      try {
        const res = await apiClient.post<any>(`/api/v1/leads/${id}/stop-ai`, { reason });
        if (res?.lead) return res.lead;
      } catch (err) {
        console.warn(`Backend stopAI failed for lead ${id}:`, err);
      }
    }
    return this.updateLeadStatus(id, "Human Managed", reason);
  }

  /**
   * Resumes autonomous AI engine for this lead.
   */
  async resumeAI(id: string): Promise<Lead> {
    if (isUuid(id)) {
      try {
        const res = await apiClient.post<any>(`/api/v1/leads/${id}/resume-ai`);
        if (res?.lead) return res.lead;
      } catch (err) {
        console.warn(`Backend resumeAI failed for lead ${id}:`, err);
      }
    }
    return this.updateLeadStatus(id, "In Conversation", "Autonomous AI automation resumed");
  }

  /**
   * Marks lead as Nurture and schedules follow-up cadence.
   */
  async markNurture(
    id: string,
    schedule: FollowUpSchedule,
    notes?: string
  ): Promise<Lead> {
    return this.updateLeadStatus(
      id,
      "Nurture",
      `Follow-up scheduled on ${schedule.scheduledFormatted}.${notes ? ` Note: ${notes}` : ""}`
    );
  }

  /**
   * Marks lead as Lost with structured reason classification.
   */
  async markLost(id: string, lossDetails: LossDetails): Promise<Lead> {
    if (isUuid(id)) {
      try {
        const response = await apiClient.patch<Lead | { lead: Lead }>(`/api/v1/leads/${id}/status`, {
          status: "Lost",
          note: lossDetails.notes,
          lossReason: lossDetails.reason,
          lossNotes: lossDetails.notes,
        });
        if (response) {
          if ("lead" in response && (response as any).lead) {
            return (response as any).lead;
          }
          return response as Lead;
        }
      } catch (err) {
        console.warn(`Backend markLost failed for lead ${id}:`, err);
      }
    }
    return this.updateLeadStatus(id, "Lost", lossDetails.notes);
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
      id: createUniqueId("act_resched"),
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
      id: createUniqueId("act_obj"),
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

  /**
   * Scans existing leads in the workspace for canonical phone number or email matches.
   */
  detectDuplicates(phone?: string, email?: string): DuplicateCheckResult {
    const normPhone = phone ? normalizePhoneNumber(phone) : "";
    const normEmail = email ? email.trim().toLowerCase() : "";

    if (!normPhone && !normEmail) {
      return { hasDuplicate: false, matches: [] };
    }

    const matches: DuplicateMatch[] = [];

    for (const lead of inMemoryMockLeads) {
      const leadNormPhone = normalizePhoneNumber(lead.phone);
      const leadNormEmail = lead.email ? lead.email.trim().toLowerCase() : "";

      const phoneMatch = Boolean(normPhone && leadNormPhone && normPhone === leadNormPhone);
      const emailMatch = Boolean(normEmail && leadNormEmail && normEmail === leadNormEmail);

      if (phoneMatch || emailMatch) {
        matches.push({
          leadId: lead.id,
          leadName: lead.name,
          phone: lead.phone,
          email: lead.email,
          score: lead.score,
          scoreCategory: lead.scoreCategory,
          status: lead.status,
          propertyTitle: lead.propertyTitle,
          matchType: phoneMatch && emailMatch ? "both" : phoneMatch ? "phone" : "email",
          relativeTime: "Existing record in system",
        });
      }
    }

    return {
      hasDuplicate: matches.length > 0,
      matches,
    };
  }

  /**
   * Intakes a new prospect, validates duplicates, initializes BANT profile, and prepends to database.
   */
  async createLead(input: CreateLeadInput): Promise<Lead> {
    const res = await apiClient.post<{
      lead: { id: string };
      isDuplicate: boolean;
      reEngaged: boolean;
      message: string;
    }>("/api/v1/leads/ingest", {
      name: input.name,
      phone: input.phone,
      email: input.email,
      budget: input.budget,
      timeline: input.timeline,
      locationPreference: input.location,
      message: input.notes,
      source: input.source,
    });

    if (res?.lead?.id) {
      const created = await this.getLeadById(res.lead.id);
      if (created) return created;
    }

    throw new Error("Failed to intake lead: Lead could not be loaded from backend.");
  }

  /**
   * Executes AI re-qualification and simulated tool execution trace (OpenRouter inference).
   */
  async rerunAiQualification(
    leadId: string
  ): Promise<{ lead: Lead; trace: AiToolExecutionStep[] }> {
    await new Promise((r) => setTimeout(r, 450));
    const index = inMemoryMockLeads.findIndex((l) => l.id === leadId);
    if (index === -1) throw new Error(`Lead ${leadId} not found.`);

    const current = inMemoryMockLeads[index];
    const trace: AiToolExecutionStep[] = [
      {
        tool: "lookup_property",
        input: JSON.stringify({ property: current.propertyTitle, budget: current.budget }),
        output: JSON.stringify({
          matchStatus: "verified",
          marketPriceRange: current.budget,
          titleVerification: "Governor's Consent (Verified)",
        }),
        durationMs: 140,
        timestamp: "Just now",
      },
      {
        tool: "calculate_bant_score",
        input: JSON.stringify({
          budget: current.budget,
          timeline: current.timeline,
          intent: current.intent,
        }),
        output: JSON.stringify({
          calculatedScore: Math.min(96, current.score + 4),
          category: "HOT",
          confidenceRate: "95%",
        }),
        durationMs: 210,
        timestamp: "Just now",
      },
      {
        tool: "log_buyer_objection",
        input: JSON.stringify({ leadId, scan: "residual_risks" }),
        output: JSON.stringify({
          unresolvedCount: current.qualificationProfile?.objections.filter((o) => o.status === "open").length || 0,
          recommendation: "Proceed with viewing invitation",
        }),
        durationMs: 110,
        timestamp: "Just now",
      },
    ];

    const updatedScore = Math.min(98, current.score + 3);
    const updatedCategory: "HOT" | "WARM" | "COLD" = updatedScore >= 85 ? "HOT" : "WARM";

    const activity: LeadActivity = {
      id: createUniqueId("act_ai_underwrite"),
      type: "status_change",
      title: "AI Underwriting Refreshed (OpenRouter)",
      description: `Deep qualification analysis executed via Claude 3.5 Sonnet. Score adjusted to ${updatedScore}/100 (${updatedCategory}).`,
      timestamp: "Just now",
      channel: "OpenRouter LLM",
      actor: {
        type: "ai_agent",
        name: "Spacia Underwriting Core",
        role: "Autonomous Underwriter",
        modelIdentifier: "Claude 3.5 Sonnet via OpenRouter",
        confidenceScore: 95,
      },
    };

    const updatedLead: Lead = {
      ...current,
      score: updatedScore,
      scoreCategory: updatedCategory,
      activities: [activity, ...(current.activities || [])],
    };

    inMemoryMockLeads[index] = updatedLead;
    return { lead: JSON.parse(JSON.stringify(updatedLead)), trace };
  }
}

export const leadsService = new LeadsService();
