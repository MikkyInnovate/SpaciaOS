import { apiClient } from "@/lib/api/client";
import type { Lead, LeadFilterParams, LeadsApiResponse } from "../types";
import { MOCK_LEADS } from "../data/mock-leads";

/**
 * Proposed Backend Contract:
 * - GET /api/v1/leads?search=&scoreCategory=&status=
 * - GET /api/v1/leads/:id
 *
 * Pending Backend Implementation:
 * Until the backend service implements these endpoints, this service
 * gracefully catches network/404 errors and provides deterministic data from MOCK_LEADS.
 */
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
    await new Promise((resolve) => setTimeout(resolve, 200));

    let filtered = [...MOCK_LEADS];

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

    const found = MOCK_LEADS.find((lead) => lead.id === id);
    return found || null;
  }
}

export const leadsService = new LeadsService();
