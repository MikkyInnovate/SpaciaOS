import type { Property, PropertyFilterParams } from "../types";
import { MOCK_PROPERTIES } from "../data/mock-properties";
import { apiClient } from "@/lib/api/client";

// In-memory property registry for optimistic session updates
const inMemoryProperties: Property[] = JSON.parse(JSON.stringify(MOCK_PROPERTIES));

export class PropertiesService {
  /**
   * Proposed contract: GET /api/v1/properties
   */
  async getProperties(filters?: PropertyFilterParams): Promise<{ properties: Property[]; total: number }> {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.search) queryParams.set("query", filters.search);
      if (filters?.availability && filters.availability !== "ALL") {
        queryParams.set("availability", filters.availability);
      }
      if (filters?.verificationStatus && filters.verificationStatus !== "ALL") {
        queryParams.set("verificationStatus", filters.verificationStatus);
      }

      const queryString = queryParams.toString();
      const endpoint = "/api/v1/properties" + (queryString ? `?${queryString}` : "");
      const response = await apiClient.get<any>(endpoint);

      if (response?.items) {
        return {
          properties: response.items,
          total: response.total ?? response.items.length,
        };
      }
      if (response?.properties) {
        return response;
      }
    } catch {
      // Backend not yet available: fall through to deterministic mock fallback
    }

    let filtered = [...inMemoryProperties];

    if (filters?.search?.trim()) {
      const q = filters.search.toLowerCase().trim();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q) ||
          p.estateName?.toLowerCase().includes(q) ||
          p.features.some((f) => f.toLowerCase().includes(q))
      );
    }

    if (filters?.availability && filters.availability !== "ALL") {
      filtered = filtered.filter((p) => p.availability === filters.availability);
    }

    if (filters?.verificationStatus && filters.verificationStatus !== "ALL") {
      filtered = filtered.filter((p) => p.verification.status === filters.verificationStatus);
    }

    return {
      properties: filtered,
      total: filtered.length,
    };
  }

  /**
   * Proposed contract: GET /api/v1/properties/:id
   */
  async getPropertyById(id: string): Promise<Property | null> {
    try {
      const response = await apiClient.get<any>("/api/v1/properties/" + id);
      if (response?.id) {
        return response as Property;
      }
      if (response?.property) {
        return response.property;
      }
    } catch {
      // Fall through to in-memory store
    }

    const found = inMemoryProperties.find((p) => p.id === id);
    return found ? JSON.parse(JSON.stringify(found)) : null;
  }

  /**
   * Health check abstraction: GET /api/v1/properties/health
   */
  async checkHealth(providerId?: string) {
    const q = providerId ? `?providerId=${providerId}` : "";
    return apiClient.get<any>(`/api/v1/properties/health${q}`);
  }

  /**
   * Real-time availability check: GET /api/v1/properties/:id/availability
   */
  async checkAvailability(propertyId: string, unitId?: string) {
    const q = unitId ? `?unitId=${unitId}` : "";
    return apiClient.get<any>(`/api/v1/properties/${propertyId}/availability${q}`);
  }

  /**
   * Real-time pricing & fee breakdown: GET /api/v1/properties/:id/price
   */
  async getPrice(propertyId: string, paymentPlan?: string) {
    const q = paymentPlan ? `?paymentPlan=${paymentPlan}` : "";
    return apiClient.get<any>(`/api/v1/properties/${propertyId}/price${q}`);
  }
}

export const propertiesService = new PropertiesService();
