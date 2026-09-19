import { apiClient } from "@/lib/api/client";
import type {
  Conversation,
  ConversationMessage,
  ConversationFilterParams,
  ConversationsApiResponse,
  ConversationStatus,
} from "../types";
import { MOCK_CONVERSATIONS, MOCK_MESSAGES } from "../data/mock-conversations";

/**
 * Proposed Backend REST Contracts:
 * - GET /api/v1/conversations?search=&status=&channel=
 * - GET /api/v1/conversations/:id
 * - GET /api/v1/conversations/:id/messages
 * - POST /api/v1/conversations/:id/messages { content, sender }
 * - POST /api/v1/conversations/:id/takeover { brokerName }
 * - PATCH /api/v1/conversations/:id/status { status }
 *
 * Mock Boundary Strategy:
 * When backend endpoints are unavailable, this service isolates an in-memory
 * session copy of MOCK_CONVERSATIONS and MOCK_MESSAGES. All mutations (broker takeover,
 * sending replies, status transitions) update this local session store optimistically.
 */

const inMemoryConversations: Conversation[] = JSON.parse(
  JSON.stringify(MOCK_CONVERSATIONS)
);

const inMemoryMessages: Record<string, ConversationMessage[]> = JSON.parse(
  JSON.stringify(MOCK_MESSAGES)
);

class ConversationsService {
  /**
   * Fetches conversations with optional filtering.
   */
  async getConversations(
    filters?: ConversationFilterParams
  ): Promise<ConversationsApiResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.search) queryParams.set("search", filters.search);
      if (filters?.status && filters.status !== "ALL") {
        queryParams.set("status", filters.status);
      }
      if (filters?.channel && filters.channel !== "ALL") {
        queryParams.set("channel", filters.channel);
      }

      const queryString = queryParams.toString();
      const endpoint =
        "/api/v1/conversations" + (queryString ? "?" + queryString : "");

      const response = await apiClient.get<ConversationsApiResponse>(endpoint);
      if (response && Array.isArray(response.conversations)) {
        return response;
      }
    } catch {
      // Backend not yet available: fall through to in-memory fallback
    }

    // Simulate minor network delay
    await new Promise((resolve) => setTimeout(resolve, 80));

    let filtered = [...inMemoryConversations];

    if (filters?.search?.trim()) {
      const q = filters.search.toLowerCase().trim();
      filtered = filtered.filter(
        (c) =>
          c.prospect.name.toLowerCase().includes(q) ||
          c.prospect.phone.toLowerCase().includes(q) ||
          c.targetProperty.title.toLowerCase().includes(q) ||
          c.targetProperty.location.toLowerCase().includes(q) ||
          c.lastMessage.text.toLowerCase().includes(q)
      );
    }

    if (filters?.status && filters.status !== "ALL") {
      filtered = filtered.filter((c) => c.status === filters.status);
    }

    if (filters?.channel && filters.channel !== "ALL") {
      filtered = filtered.filter((c) => c.channel === filters.channel);
    }

    // Sort by updated timestamp desc
    filtered.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    return {
      conversations: filtered,
      total: filtered.length,
    };
  }

  /**
   * Fetches a single conversation by ID.
   */
  async getConversationById(id: string): Promise<Conversation | null> {
    try {
      const response = await apiClient.get<{ conversation: Conversation }>(
        `/api/v1/conversations/${id}`
      );
      if (response?.conversation) {
        return response.conversation;
      }
    } catch {
      // Fall through to in-memory fallback
    }

    const found = inMemoryConversations.find((c) => c.id === id);
    return found ? JSON.parse(JSON.stringify(found)) : null;
  }

  /**
   * Fetches the message history for a conversation.
   */
  async getMessages(conversationId: string): Promise<ConversationMessage[]> {
    try {
      const response = await apiClient.get<{ messages: ConversationMessage[] }>(
        `/api/v1/conversations/${conversationId}/messages`
      );
      if (response && Array.isArray(response.messages)) {
        return response.messages;
      }
    } catch {
      // Fall through to in-memory fallback
    }

    const messages = inMemoryMessages[conversationId] || [];
    return JSON.parse(JSON.stringify(messages));
  }

  /**
   * Sends a message from the human broker in a conversation.
   */
  async sendMessage(
    conversationId: string,
    content: string,
    senderName: string = "Marcus Vance"
  ): Promise<ConversationMessage> {
    try {
      const response = await apiClient.post<ConversationMessage>(
        `/api/v1/conversations/${conversationId}/messages`,
        {
          content,
          sender: "human_broker",
          senderName,
        }
      );
      if (response?.id) {
        return response;
      }
    } catch {
      // Fall through to in-memory session mutation
    }

    const newMessage: ConversationMessage = {
      id: `msg_${Date.now()}`,
      conversationId,
      sender: "human_broker",
      senderName,
      content,
      timestamp: new Date().toISOString(),
      deliveryStatus: "delivered",
      brokerMetadata: {
        brokerId: "broker_current",
        brokerName: senderName,
        role: "Sales Associate",
      },
    };

    if (!inMemoryMessages[conversationId]) {
      inMemoryMessages[conversationId] = [];
    }
    inMemoryMessages[conversationId].push(newMessage);

    // Update conversation record
    const convIndex = inMemoryConversations.findIndex(
      (c) => c.id === conversationId
    );
    if (convIndex !== -1) {
      inMemoryConversations[convIndex].lastMessage = {
        text: content,
        timestamp: newMessage.timestamp,
        sender: "human_broker",
      };
      inMemoryConversations[convIndex].status = "human_takeover";
      inMemoryConversations[convIndex].updatedAt = newMessage.timestamp;
      inMemoryConversations[convIndex].unreadCount = 0;
    }

    return newMessage;
  }

  /**
   * Executes a Human Broker Takeover on a conversation.
   * Immediately transitions state to 'human_takeover' and inserts a system audit event.
   */
  async executeTakeover(
    conversationId: string,
    brokerName: string = "Marcus Vance"
  ): Promise<Conversation> {
    try {
      const response = await apiClient.post<{ conversation: Conversation }>(
        `/api/v1/conversations/${conversationId}/takeover`,
        { brokerName }
      );
      if (response?.conversation) {
        return response.conversation;
      }
    } catch {
      // Fall through to in-memory session mutation
    }

    const convIndex = inMemoryConversations.findIndex(
      (c) => c.id === conversationId
    );
    if (convIndex === -1) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    const timestamp = new Date().toISOString();
    inMemoryConversations[convIndex].status = "human_takeover";
    inMemoryConversations[convIndex].updatedAt = timestamp;

    // Append system message
    const systemEvent: ConversationMessage = {
      id: `msg_sys_${Date.now()}`,
      conversationId,
      sender: "system",
      senderName: "System",
      content: `Broker takeover initiated by ${brokerName}. AI autonomous replies paused.`,
      timestamp,
    };

    if (!inMemoryMessages[conversationId]) {
      inMemoryMessages[conversationId] = [];
    }
    inMemoryMessages[conversationId].push(systemEvent);

    return JSON.parse(JSON.stringify(inMemoryConversations[convIndex]));
  }

  /**
   * Updates conversation lifecycle status.
   */
  async updateStatus(
    conversationId: string,
    status: ConversationStatus
  ): Promise<Conversation> {
    try {
      const response = await apiClient.patch<{ conversation: Conversation }>(
        `/api/v1/conversations/${conversationId}/status`,
        { status }
      );
      if (response?.conversation) {
        return response.conversation;
      }
    } catch {
      // Fall through to in-memory session mutation
    }

    const convIndex = inMemoryConversations.findIndex(
      (c) => c.id === conversationId
    );
    if (convIndex === -1) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    inMemoryConversations[convIndex].status = status;
    inMemoryConversations[convIndex].updatedAt = new Date().toISOString();

    return JSON.parse(JSON.stringify(inMemoryConversations[convIndex]));
  }
}

export const conversationsService = new ConversationsService();
