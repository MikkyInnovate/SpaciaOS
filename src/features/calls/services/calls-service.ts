import { MOCK_CALLS } from "../data/mock-calls";
import type { Call, CallFilters } from "../types";

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
}

export const callsService = new CallsService();
