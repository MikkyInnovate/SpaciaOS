import { apiClient } from "@/lib/api/client";
import type {
  WorkflowActivityEvent,
  EventFilterParams,
  EventsApiResponse,
} from "../types";
import { MOCK_WORKFLOW_EVENTS } from "../data/mock-events";

/**
 * Proposed Backend REST & WebSocket Contracts:
 * - GET /api/v1/events?entityId=&actorType=&status=&category=
 * - GET /api/v1/workflows/:id
 * - POST /api/v1/workflows/:id/retry
 * - POST /api/v1/workflows/:id/cancel
 * - POST /api/v1/events
 *
 * Mock Boundary Strategy:
 * When backend endpoints return 404/network errors, this service provides
 * a deterministic in-memory session state store simulating real-time workflow
 * status transitions, backoff countdowns, and instant retries.
 */

const inMemoryEvents: WorkflowActivityEvent[] = JSON.parse(
  JSON.stringify(MOCK_WORKFLOW_EVENTS)
);

class EventsService {
  /**
   * Fetches events for an entity (lead, call, appointment) or global workspace.
   */
  async getEvents(filters?: EventFilterParams): Promise<EventsApiResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.entityId) queryParams.set("entityId", filters.entityId);
      if (filters?.actorType && filters.actorType !== "ALL") {
        queryParams.set("actorType", filters.actorType);
      }
      if (filters?.status && filters.status !== "ALL") {
        queryParams.set("status", filters.status);
      }
      if (filters?.category && filters.category !== "ALL") {
        queryParams.set("category", filters.category);
      }
      if (filters?.search) queryParams.set("search", filters.search);

      const queryString = queryParams.toString();
      const endpoint = "/api/v1/events" + (queryString ? "?" + queryString : "");

      const response = await apiClient.get<EventsApiResponse>(endpoint);
      if (response && Array.isArray(response.events)) {
        return response;
      }
    } catch {
      // Backend not yet available: fall through to in-memory fallback
    }

    // Simulated short network delay
    await new Promise((resolve) => setTimeout(resolve, 120));

    let filtered = [...inMemoryEvents];

    if (filters?.entityId) {
      filtered = filtered.filter(
        (e) => !e.entityId || e.entityId === filters.entityId
      );
    }

    if (filters?.actorType && filters.actorType !== "ALL") {
      filtered = filtered.filter((e) => e.actor.type === filters.actorType);
    }

    if (filters?.status && filters.status !== "ALL") {
      filtered = filtered.filter((e) => e.status === filters.status);
    }

    if (filters?.category && filters.category !== "ALL") {
      filtered = filtered.filter((e) => e.category === filters.category);
    }

    if (filters?.search?.trim()) {
      const q = filters.search.toLowerCase().trim();
      filtered = filtered.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.actor.name.toLowerCase().includes(q)
      );
    }

    return {
      events: filtered,
      total: filtered.length,
    };
  }

  /**
   * Executes a retry on a failed or retrying workflow step.
   * Simulates immediate optimistic transition to 'in_progress' and then 'completed'.
   */
  async retryWorkflow(workflowId: string): Promise<WorkflowActivityEvent> {
    try {
      const response = await apiClient.post<{ event: WorkflowActivityEvent }>(
        `/api/v1/workflows/${workflowId}/retry`
      );
      if (response?.event) {
        return response.event;
      }
    } catch {
      // Backend not available: update in-memory session store
    }

    await new Promise((resolve) => setTimeout(resolve, 400));

    const index = inMemoryEvents.findIndex((e) => e.workflowId === workflowId);
    if (index === -1) {
      throw new Error(`Workflow ${workflowId} not found.`);
    }

    const currentEvent = inMemoryEvents[index];
    const currentAttempt = (currentEvent.retry?.currentAttempt || 1) + 1;
    const maxRetries = currentEvent.retry?.maxRetries || 3;

    const updatedEvent: WorkflowActivityEvent = {
      ...currentEvent,
      status: "completed",
      title: `${currentEvent.title.replace("Failed", "Resolved").replace("Dropped", "Reconnected")} (Retry ${currentAttempt}/${maxRetries})`,
      description: `Workflow successfully recovered after automated retry attempt ${currentAttempt}. Telephony trunk handoff completed.`,
      timestamp: "Just now",
      retry: currentEvent.retry
        ? {
            ...currentEvent.retry,
            currentAttempt,
            isRetrying: false,
          }
        : undefined,
      failure: undefined,
    };

    inMemoryEvents[index] = updatedEvent;
    return JSON.parse(JSON.stringify(updatedEvent));
  }

  /**
   * Cancels an active or retrying workflow.
   */
  async cancelWorkflow(workflowId: string, reason?: string): Promise<WorkflowActivityEvent> {
    try {
      const response = await apiClient.post<{ event: WorkflowActivityEvent }>(
        `/api/v1/workflows/${workflowId}/cancel`,
        { reason }
      );
      if (response?.event) {
        return response.event;
      }
    } catch {
      // Offline fallback
    }

    const index = inMemoryEvents.findIndex((e) => e.workflowId === workflowId);
    if (index === -1) {
      throw new Error(`Workflow ${workflowId} not found.`);
    }

    const currentEvent = inMemoryEvents[index];
    const updatedEvent: WorkflowActivityEvent = {
      ...currentEvent,
      status: "cancelled",
      description: `${currentEvent.description} [Cancelled by operator: ${reason || "User requested cancellation"}]`,
      timestamp: "Just now",
      retry: undefined,
    };

    inMemoryEvents[index] = updatedEvent;
    return JSON.parse(JSON.stringify(updatedEvent));
  }

  /**
   * Appends an event to the in-memory store.
   */
  async addEvent(
    eventData: Omit<WorkflowActivityEvent, "id">
  ): Promise<WorkflowActivityEvent> {
    const newEvent: WorkflowActivityEvent = {
      ...eventData,
      id: `evt_${Date.now()}`,
    };

    try {
      const response = await apiClient.post<{ event: WorkflowActivityEvent }>(
        "/api/v1/events",
        newEvent
      );
      if (response?.event) {
        return response.event;
      }
    } catch {
      // Offline fallback
    }

    inMemoryEvents.unshift(newEvent);
    return newEvent;
  }
}

export const eventsService = new EventsService();
