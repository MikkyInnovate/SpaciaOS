import { apiClient } from "@/lib/api/client";
import type { Lead, LeadFilterParams, LeadsApiResponse, LeadStatus, LeadActivity } from "../types";
import { MOCK_LEADS } from "../data/mock-leads";

/**
 * Proposed Backend Contracts (Defined by Frontend, Pending Backend Verification):
 * - GET /api/v1/leads?search=&scoreCategory=&status=
 * - GET /api/v1/leads/:id
 * - PATCH /api/v1/leads/:id/status { status, note }
 * - POST /api/v1/leads/:id/activities { type, title, description }
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
}

export const leadsService = new LeadsService();
