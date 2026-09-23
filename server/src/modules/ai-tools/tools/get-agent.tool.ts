import {
  Injectable,
  Inject,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import {
  IAiTool,
  ToolDefinition,
  ToolExecutionContext,
  SourceVerification,
} from "../interfaces/ai-tool.interface";
import { DRIZZLE_DATABASE, DrizzleDb } from "../../../database/database.provider";
import * as schema from "../../../database/schema";
import { eq, and } from "drizzle-orm";

export interface GetAgentParams {
  agentId?: string;
  email?: string;
  leadId?: string;
  workspaceId?: string;
}

export interface AgentDossier {
  id: string;
  workspaceId: string;
  name: string;
  email: string;
  phone: string | null;
  roleTitle: string;
  status: string;
  maxConcurrentLeads: number;
  avatarUrl: string | null;
}

@Injectable()
export class GetAgentTool implements IAiTool<GetAgentParams, AgentDossier> {
  readonly name = "get_agent";
  readonly description =
    "Retrieve the profile, phone number, and status of a human sales broker assigned to a lead or territory for scheduling or handoff.";
  readonly requiredPermission = "leads:read"; // or properties:read

  readonly definition: ToolDefinition = {
    name: "get_agent",
    description:
      "Retrieve the profile, phone number, and status of a human sales broker assigned to a lead or territory for scheduling or handoff.",
    parameters: {
      type: "object",
      properties: {
        agentId: {
          type: "string",
          description: "Unique canonical UUID of the agent",
        },
        email: {
          type: "string",
          description: "Agent's corporate email address",
        },
        leadId: {
          type: "string",
          description: "Lead UUID to look up the currently assigned sales broker",
        },
      },
    },
  };

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: DrizzleDb) {}

  validateParams(rawParams: unknown): GetAgentParams {
    if (typeof rawParams !== "object" || rawParams === null) {
      throw new BadRequestException("get_agent parameters must be an object.");
    }
    const params = rawParams as Record<string, any>;

    if (!params.agentId && !params.email && !params.leadId) {
      throw new BadRequestException(
        "At least one of 'agentId', 'email', or 'leadId' must be provided to query an agent."
      );
    }

    return {
      agentId: typeof params.agentId === "string" ? params.agentId.trim() : undefined,
      email: typeof params.email === "string" ? params.email.trim().toLowerCase() : undefined,
      leadId: typeof params.leadId === "string" ? params.leadId.trim() : undefined,
      workspaceId: typeof params.workspaceId === "string" ? params.workspaceId.trim() : undefined,
    };
  }

  async execute(
    params: GetAgentParams,
    context: ToolExecutionContext
  ): Promise<{ data: AgentDossier; sourceVerification: SourceVerification }> {
    // 1. Mandatory inside-the-tool workspace boundary check
    if (!context.workspaceId) {
      throw new UnauthorizedException("Tool execution requires an active workspace context.");
    }
    if (params.workspaceId && params.workspaceId !== context.workspaceId) {
      throw new UnauthorizedException(
        `Cross-workspace access denied: tool caller in workspace [${context.workspaceId}] cannot query agent in workspace [${params.workspaceId}].`
      );
    }

    let targetAgentId = params.agentId;

    // 2. If leadId is provided, resolve assignedAgentId from the lead
    if (!targetAgentId && params.leadId) {
      const [lead] = await this.db
        .select({
          assignedAgentId: schema.leads.assignedAgentId,
        })
        .from(schema.leads)
        .where(
          and(
            eq(schema.leads.id, params.leadId),
            eq(schema.leads.workspaceId, context.workspaceId)
          )
        );

      if (!lead) {
        throw new NotFoundException(
          `Lead [${params.leadId}] not found in workspace [${context.workspaceId}].`
        );
      }
      if (!lead.assignedAgentId) {
        throw new NotFoundException(
          `No broker currently assigned to lead [${params.leadId}].`
        );
      }
      targetAgentId = lead.assignedAgentId;
    }

    // 3. Query agent in Neon PostgreSQL strictly scoped by workspaceId
    const conditions = [eq(schema.agents.workspaceId, context.workspaceId)];
    if (targetAgentId) {
      conditions.push(eq(schema.agents.id, targetAgentId));
    } else if (params.email) {
      conditions.push(eq(schema.agents.email, params.email));
    }

    const [agent] = await this.db
      .select()
      .from(schema.agents)
      .where(and(...conditions));

    if (!agent) {
      throw new NotFoundException(
        `Agent not found in workspace [${context.workspaceId}].`
      );
    }

    const dossier: AgentDossier = {
      id: agent.id,
      workspaceId: agent.workspaceId,
      name: agent.name,
      email: agent.email,
      phone: agent.phone,
      roleTitle: agent.roleTitle,
      status: agent.status,
      maxConcurrentLeads: agent.maxConcurrentLeads,
      avatarUrl: agent.avatarUrl,
    };

    // 4. Source verification
    const sourceVerification: SourceVerification = {
      source: "neon_database_agents",
      providerId: "neon_db",
      isVerified: true,
      verifiedAt: new Date().toISOString(),
      confidence: "authoritative",
      provenanceDetails: `Broker record [${agent.id}] verified in workspace [${context.workspaceId}].`,
    };

    return { data: dossier, sourceVerification };
  }
}
