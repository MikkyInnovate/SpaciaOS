import { MOCK_CALLS } from "../data/mock-calls";
import type { Call, CallFilters } from "../types";

function createUniqueId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

class CallsService {
  private calls: Call[] = [...MOCK_CALLS];

  async getCalls(filters?: CallFilters): Promise<Call[]> {
    let result = [...this.calls];

    if (filters?.searchTerm && filters.searchTerm.trim()) {
      const q = filters.searchTerm.toLowerCase();
      result = result.filter(
        (c) =>
          c.leadName.toLowerCase().includes(q) ||
          c.propertyTitle.toLowerCase().includes(q) ||
          c.propertyLocation.toLowerCase().includes(q) ||
          c.leadPhone.includes(q) ||
          c.summary.synthesis.toLowerCase().includes(q)
      );
    }

    if (filters?.outcome && filters.outcome !== "ALL") {
      result = result.filter((c) => c.outcome === filters.outcome);
    }

    if (filters?.recordingState && filters.recordingState !== "ALL") {
      result = result.filter((c) => c.recordingState === filters.recordingState);
    }

    if (filters?.minScore !== undefined) {
      result = result.filter((c) => c.score >= filters.minScore!);
    }

    if (filters?.sortBy === "duration") {
      result.sort((a, b) =>
        filters.sortOrder === "asc"
          ? a.metrics.durationSeconds - b.metrics.durationSeconds
          : b.metrics.durationSeconds - a.metrics.durationSeconds
      );
    } else if (filters?.sortBy === "score") {
      result.sort((a, b) =>
        filters.sortOrder === "asc" ? a.score - b.score : b.score - a.score
      );
    } else {
      // Default: Most recent first
      result.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    return result;
  }

  async getCallById(id: string): Promise<Call | null> {
    const found = this.calls.find((c) => c.id === id);
    return found || null;
  }

  async getCallsByLeadId(leadId: string, leadPhone?: string, leadName?: string): Promise<Call[]> {
    const cleanPhone = leadPhone ? leadPhone.replace(/[\s+-]/g, "") : "";
    const cleanName = leadName ? leadName.toLowerCase().trim() : "";
    const leadNum = leadId.replace("lead_", "");

    return this.calls.filter((c) => {
      if (c.leadId === leadId) return true;
      if (c.leadId && c.leadId.includes(leadNum)) return true;
      if (leadId === "lead_01" && (c.leadId === "lead_adeleke" || c.id === "call_01")) return true;
      if (leadId === "lead_02" && (c.leadId === "lead_jenkins" || c.id === "call_02")) return true;
      if (leadId === "lead_03" && (c.leadId === "lead_babatunde" || c.id === "call_03")) return true;
      if (leadId === "lead_04" && (c.leadId === "lead_eze" || c.id === "call_04")) return true;
      if (leadId === "lead_05" && (c.leadId === "lead_okafor" || c.id === "call_05")) return true;
      if (leadId === "lead_06" && (c.leadId === "lead_yusuf" || c.id === "call_06")) return true;
      if (leadId === "lead_07" && (c.leadId === "lead_bakare" || c.id === "call_07")) return true;
      if (leadId === "lead_08" && (c.leadId === "lead_nwosu" || c.id === "call_08")) return true;
      if (leadId === "lead_09" && (c.leadId === "lead_adesina" || c.id === "call_09")) return true;

      // Match by phone digits if available
      if (cleanPhone && c.leadPhone) {
        const cPhone = c.leadPhone.replace(/[\s+-]/g, "");
        if (cleanPhone.slice(-7) === cPhone.slice(-7)) return true;
      }
      // Match by name if available
      if (cleanName && c.leadName) {
        const parts = cleanName.split(" ");
        const lastName = parts[parts.length - 1];
        if (lastName.length > 2 && c.leadName.toLowerCase().includes(lastName)) return true;
      }
      return false;
    });
  }

  async getVoiceMetrics(): Promise<{
    totalCallsToday: number;
    avgDurationFormatted: string;
    qualificationRate: number;
    viewingsBooked: number;
  }> {
    const totalCallsToday = 42; // Real-world simulated daily volume
    const viewingsBooked = this.calls.filter(
      (c) => c.outcome === "viewing_booked"
    ).length + 8;
    const qualifiedCount = this.calls.filter(
      (c) => c.outcome === "qualified" || c.outcome === "viewing_booked"
    ).length;
    const qualificationRate = Math.round(
      (qualifiedCount / (this.calls.length || 1)) * 100
    );

    return {
      totalCallsToday,
      avgDurationFormatted: "3m 42s",
      qualificationRate: Math.max(75, Math.min(94, qualificationRate)),
      viewingsBooked,
    };
  }

  async addCall(call: Call): Promise<Call> {
    this.calls.unshift(call);
    return call;
  }

  async initiateVapiCall(params: {
    leadId?: string;
    leadName: string;
    leadPhone: string;
    propertyTitle: string;
    propertyLocation?: string;
    declaredBudget?: string;
    score?: number;
    scoreCategory?: "HOT" | "WARM" | "COLD";
    persona?: string;
  }): Promise<Call> {
    await new Promise((r) => setTimeout(r, 100));

    const callId = createUniqueId("call");
    const newCall: Call = {
      id: callId,
      leadId: params.leadId,
      leadName: params.leadName,
      leadPhone: params.leadPhone,
      propertyTitle: params.propertyTitle,
      propertyLocation: params.propertyLocation || "Lagos, Nigeria",
      declaredBudget: params.declaredBudget || "₦250,000,000",
      score: params.score || 82,
      scoreCategory: params.scoreCategory || "WARM",
      outcome: "qualified",
      recordingState: "ready",
      audioDurationSeconds: 142,
      createdAt: new Date().toISOString(),
      relativeTime: "Just now",
      agentPersona: params.persona || "Victoria (Senior Luxury Closer)",
      metrics: {
        durationSeconds: 142,
        durationFormatted: "2m 22s",
        talkRatio: { aiPercent: 44, prospectPercent: 56 },
        turnCount: 5,
        averageLatencyMs: 380,
      },
      summary: {
        synthesis: `Prospect engaged via Vapi AI telephony. Verified serious interest in ${params.propertyTitle}. Affirmed target budget alignment and requested legal underwriting review.`,
        keyTakeaways: [
          "Inquiry confirmed for specified development",
          "Liquid capital availability verified",
          "Requested viewing availability for upcoming weekend",
        ],
        objectionsRaised: ["Offshore transfer clearance timeline"],
        actionItems: [
          "Dispatch digital brochure and floor plans",
          "Reserve inspection slot with on-site broker",
        ],
        suggestedNextStep: "Schedule formal viewing inspection",
      },
      transcript: [
        {
          id: createUniqueId("turn_1"),
          speaker: "agent",
          speakerName: params.persona?.split(" ")[0] || "Victoria",
          timestamp: "00:04",
          timestampSeconds: 4,
          message: `Good day ${params.leadName}, this is ${params.persona?.split(" ")[0] || "Victoria"} from Pacia Properties. I am reaching out regarding your inquiry for ${params.propertyTitle}. Is now a good time?`,
          sentiment: "positive",
        },
        {
          id: createUniqueId("turn_2"),
          speaker: "prospect",
          speakerName: params.leadName,
          timestamp: "00:15",
          timestampSeconds: 15,
          message: `Yes, good afternoon. I saw the listing and wanted to understand the payment milestone structure and title status.`,
          sentiment: "positive",
          bantTags: ["budget", "property_fit"],
        },
        {
          id: createUniqueId("turn_3"),
          speaker: "agent",
          speakerName: params.persona?.split(" ")[0] || "Victoria",
          timestamp: "00:32",
          timestampSeconds: 32,
          message: `Certainly. The property holds clean Governor's Consent with encumbrance-free title. We accommodate outright settlement or a structured 6-month milestone plan.`,
          sentiment: "positive",
          bantTags: ["property_fit"],
        },
        {
          id: createUniqueId("turn_4"),
          speaker: "prospect",
          speakerName: params.leadName,
          timestamp: "00:54",
          timestampSeconds: 54,
          message: `Excellent. Our liquidity is in place; I would like to arrange an in-person inspection of the site this Saturday.`,
          sentiment: "positive",
          bantTags: ["budget", "timeline"],
          keyQuote: true,
        },
        {
          id: createUniqueId("turn_5"),
          speaker: "agent",
          speakerName: params.persona?.split(" ")[0] || "Victoria",
          timestamp: "01:12",
          timestampSeconds: 72,
          message: `Fantastic. I have provisionally reserved Saturday 11:00 AM for you. Our senior broker will have the full inspection dossier ready. Thank you, ${params.leadName}.`,
          sentiment: "positive",
          bantTags: ["timeline"],
        },
      ],
    };

    this.calls.unshift(newCall);
    return newCall;
  }
}

export const callsService = new CallsService();
