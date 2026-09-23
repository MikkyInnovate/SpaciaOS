import { Injectable, Inject, Logger } from "@nestjs/common";
import { eq, and, desc } from "drizzle-orm";
import { DRIZZLE_DATABASE, DrizzleDb } from "../../../database/database.provider";
import * as schema from "../../../database/schema";
import { ChatMessage } from "../interfaces/ai-agent.interface";

@Injectable()
export class ConversationMemoryService {
  private readonly logger = new Logger(ConversationMemoryService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE)
    private readonly db: DrizzleDb
  ) {}

  /**
   * Retrieves an existing conversation or provisions a new isolated conversation thread.
   */
  async getOrCreateConversation(
    workspaceId: string,
    conversationId?: string,
    leadId?: string,
    prospect?: { name?: string; phone?: string; email?: string }
  ): Promise<schema.ConversationRecord> {
    if (conversationId) {
      const [existing] = await this.db
        .select()
        .from(schema.conversations)
        .where(
          and(
            eq(schema.conversations.id, conversationId),
            eq(schema.conversations.workspaceId, workspaceId)
          )
        )
        .limit(1);

      if (existing) {
        return existing;
      }
    }

    // Provision new conversation thread
    const [created] = await this.db
      .insert(schema.conversations)
      .values({
        workspaceId,
        leadId: leadId || undefined,
        channel: "web_chat",
        status: "active_ai",
        prospectName: prospect?.name || "Prospective Buyer",
        prospectPhone: prospect?.phone || "+2348000000000",
        prospectEmail: prospect?.email || undefined,
        lastMessageSender: "prospect",
        metadata: {
          sessionOrigin: "ai_sales_agent",
        },
      })
      .returning();

    return created;
  }

  /**
   * Loads recent messages in chronological order, strictly scoped to workspace and conversation.
   */
  async loadRecentMessages(
    workspaceId: string,
    conversationId: string,
    limit = 10
  ): Promise<ChatMessage[]> {
    const records = await this.db
      .select()
      .from(schema.messages)
      .where(
        and(
          eq(schema.messages.workspaceId, workspaceId),
          eq(schema.messages.conversationId, conversationId)
        )
      )
      .orderBy(desc(schema.messages.createdAt))
      .limit(limit);

    // Reverse to chronological order
    const chronological = records.reverse();

    return chronological.map((rec) => {
      let role: "user" | "assistant" | "system" | "tool" = "user";
      if (rec.senderType === "ai_agent") role = "assistant";
      else if (rec.senderType === "system") role = "system";

      return {
        role,
        content: rec.content,
        name: rec.senderName,
      };
    });
  }

  /**
   * Persists an individual message to the messages table.
   */
  async saveMessage(
    workspaceId: string,
    conversationId: string,
    senderType: "prospect" | "ai_agent" | "system",
    content: string,
    senderName?: string,
    aiMetadata?: Record<string, any>
  ): Promise<string> {
    const [inserted] = await this.db
      .insert(schema.messages)
      .values({
        workspaceId,
        conversationId,
        senderType,
        senderName: senderName || (senderType === "ai_agent" ? "Spacia AI" : "Prospect"),
        content,
        deliveryStatus: "delivered",
        aiMetadata: aiMetadata || {},
      })
      .returning({ id: schema.messages.id });

    // Update conversation summary
    await this.db
      .update(schema.conversations)
      .set({
        lastMessageText: content.slice(0, 500),
        lastMessageAt: new Date(),
        lastMessageSender: senderType,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.conversations.id, conversationId),
          eq(schema.conversations.workspaceId, workspaceId)
        )
      );

    return inserted.id;
  }
}
