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
