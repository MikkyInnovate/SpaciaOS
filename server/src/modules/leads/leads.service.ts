import {
  Injectable,
  Inject,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import { eq, and, or, ilike, desc, count, SQL } from "drizzle-orm";
import { DRIZZLE_DATABASE, DrizzleDb } from "../../database/database.provider";
import * as schema from "../../database/schema";
import { TenantContext } from "../../common/tenant/tenant-context.interface";
import { GetLeadsQueryDto } from "./dto/get-leads-query.dto";
import { UpdateLeadStatusDto } from "./dto/update-lead-status.dto";
import { CreateLeadActivityDto } from "./dto/create-lead-activity.dto";
import {
  PaginatedLeadsResponseDto,
  LeadDetailDto,
  LeadActivityDto,
} from "./dto/lead-response.dto";
import {
  toLeadSummaryDto,
  toLeadDetailDto,
  toLeadActivityDto,
} from "./utils/lead.mapper";

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE)
    private readonly db: DrizzleDb
  ) {}

  /**
   * Retrieves a paginated list of leads strictly scoped to the active workspace.
   * Supports text search, status filters, score category, and management mode.
   */
  async getLeads(
    tenant: TenantContext,
    query: GetLeadsQueryDto
  ): Promise<PaginatedLeadsResponseDto> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [
      eq(schema.leads.workspaceId, tenant.workspaceId),
    ];

    if (query.search?.trim()) {
      const raw = query.search.trim();
      const term = `%${raw}%`;
      const searchConditions = [
        ilike(schema.leads.name, term),
        ilike(schema.leads.phone, term),
        ilike(schema.leads.email, term),
        ilike(schema.leads.locationPreference, term),
      ];

      const digitsOnly = raw.replace(/\D/g, "");
      if (digitsOnly.length >= 7) {
        if (digitsOnly.startsWith("0")) {
          searchConditions.push(ilike(schema.leads.phone, `%${digitsOnly.substring(1)}%`));
        } else {
          searchConditions.push(ilike(schema.leads.phone, `%${digitsOnly}%`));
        }
      }

      conditions.push(or(...searchConditions)!);
    }

    if (query.status && query.status !== "ALL") {
      conditions.push(
        eq(
          schema.leads.status,
          query.status as (typeof schema.leadStatusEnum.enumValues)[number]
        )
      );
    }

    if (query.scoreCategory && query.scoreCategory !== "ALL") {
      conditions.push(
        eq(
          schema.leads.scoreCategory,
          query.scoreCategory as (typeof schema.leadScoreCategoryEnum.enumValues)[number]
        )
      );
    }

    if (query.managementMode && query.managementMode !== "ALL") {
      conditions.push(
        eq(
          schema.leads.managementMode,
          query.managementMode as (typeof schema.leadManagementModeEnum.enumValues)[number]
        )
      );
    }

    const whereClause = and(...conditions);

    // Total count query
    const [countResult] = await this.db
      .select({ total: count() })
      .from(schema.leads)
      .where(whereClause);

    const total = Number(countResult?.total || 0);

    // Data query with left joins on properties and agents
    const rows = await this.db
      .select({
        lead: schema.leads,
        property: schema.properties,
        agent: schema.agents,
      })
      .from(schema.leads)
      .leftJoin(
        schema.properties,
        eq(schema.leads.propertyId, schema.properties.id)
      )
      .leftJoin(schema.agents, eq(schema.leads.assignedAgentId, schema.agents.id))
      .where(whereClause)
      .orderBy(desc(schema.leads.createdAt))
      .limit(limit)
      .offset(offset);

    const leads = rows.map((r) => toLeadSummaryDto(r.lead, r.property, r.agent));

    return {
      leads,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Retrieves a comprehensive lead dossier by ID.
   * Throws 404 if not found or if belonging to another workspace.
   */
  async getLeadById(
    tenant: TenantContext,
    id: string
  ): Promise<LeadDetailDto> {
    const [lead] = await this.db
      .select()
      .from(schema.leads)
      .where(
        and(
          eq(schema.leads.id, id),
          eq(schema.leads.workspaceId, tenant.workspaceId)
        )
      );

    if (!lead) {
      throw new NotFoundException({
        code: "LEAD_NOT_FOUND",
        message: `Lead with ID '${id}' was not found in this workspace.`,
      });
    }

    // Fetch linked property if present
    let property: typeof schema.properties.$inferSelect | null = null;
    if (lead.propertyId) {
      const [prop] = await this.db
        .select()
        .from(schema.properties)
        .where(
          and(
            eq(schema.properties.id, lead.propertyId),
            eq(schema.properties.workspaceId, tenant.workspaceId)
          )
        );
      property = prop || null;
    }

    // Fetch linked agent if present
    let agent: typeof schema.agents.$inferSelect | null = null;
    if (lead.assignedAgentId) {
      const [ag] = await this.db
        .select()
        .from(schema.agents)
        .where(
          and(
            eq(schema.agents.id, lead.assignedAgentId),
            eq(schema.agents.workspaceId, tenant.workspaceId)
          )
        );
      agent = ag || null;
    }

    // Fetch latest score
    const [score] = await this.db
      .select()
      .from(schema.leadScores)
      .where(
        and(
          eq(schema.leadScores.leadId, lead.id),
          eq(schema.leadScores.workspaceId, tenant.workspaceId)
        )
      )
      .orderBy(desc(schema.leadScores.calculatedAt))
      .limit(1);

    // Fetch latest qualification
    const [qualification] = await this.db
      .select()
      .from(schema.qualificationResults)
      .where(
        and(
          eq(schema.qualificationResults.leadId, lead.id),
          eq(schema.qualificationResults.workspaceId, tenant.workspaceId)
        )
      )
      .orderBy(desc(schema.qualificationResults.evaluatedAt))
      .limit(1);

    // Fetch timeline activities
    const events = await this.db
      .select()
      .from(schema.leadEvents)
      .where(
        and(
          eq(schema.leadEvents.leadId, lead.id),
          eq(schema.leadEvents.workspaceId, tenant.workspaceId)
        )
      )
      .orderBy(desc(schema.leadEvents.createdAt))
      .limit(50);

    return toLeadDetailDto(
      lead,
      property,
      agent,
      score || null,
      qualification || null,
      events
    );
  }

  /**
   * Updates lead lifecycle status and records an immutable status_change event.
   */
  async updateLeadStatus(
    tenant: TenantContext,
    id: string,
    dto: UpdateLeadStatusDto
  ): Promise<LeadDetailDto> {
    const [existingLead] = await this.db
      .select()
      .from(schema.leads)
      .where(
        and(
          eq(schema.leads.id, id),
          eq(schema.leads.workspaceId, tenant.workspaceId)
        )
      );

    if (!existingLead) {
      throw new NotFoundException({
        code: "LEAD_NOT_FOUND",
        message: `Lead with ID '${id}' was not found in this workspace.`,
      });
    }

    const previousStatus = existingLead.status;
    const updateData: Partial<typeof schema.leads.$inferInsert> = {
      status: dto.status,
      updatedAt: new Date(),
    };

    // Apply domain lifecycle management rules
    if (dto.status === "Human Managed") {
      updateData.managementMode = "human_managed";
      updateData.isAiStopped = true;
      updateData.aiStoppedReason = dto.note || "Broker manual takeover";
    } else if (dto.status === "Nurture") {
      updateData.managementMode = "nurture";
    } else if (dto.status === "Lost") {
      updateData.managementMode = "lost";
      updateData.lossReason = dto.lossReason || "other";
      updateData.lossNotes = dto.lossNotes || dto.note || null;
    } else if (
      dto.status === "Qualified" ||
      dto.status === "Contacting" ||
      dto.status === "In Conversation"
    ) {
      updateData.managementMode = "ai_autonomous";
      updateData.isAiStopped = false;
      updateData.aiStoppedReason = null;
    }

    // Update lead record
    await this.db
      .update(schema.leads)
      .set(updateData)
      .where(
        and(
          eq(schema.leads.id, id),
          eq(schema.leads.workspaceId, tenant.workspaceId)
        )
      );

    // Record immutable audit event in lead_events
    await this.db.insert(schema.leadEvents).values({
      leadId: id,
      workspaceId: tenant.workspaceId,
      type: "status_change",
      title: `Status updated to ${dto.status}`,
      description:
        dto.note || `Lead transitioned from '${previousStatus}' to '${dto.status}'.`,
      channel: "system",
      actorType: "human_broker",
      actorId: tenant.userId,
      metadata: {
        previousStatus,
        newStatus: dto.status,
        note: dto.note || null,
        lossReason: dto.lossReason || null,
      },
    });

    this.logger.log(
      `Lead ${id} in workspace ${tenant.workspaceId} transitioned from ${previousStatus} to ${dto.status} by user ${tenant.userId}`
    );

    return this.getLeadById(tenant, id);
  }

  /**
   * Adds a new lead activity/event to the lead's timeline.
   */
  async createLeadActivity(
    tenant: TenantContext,
    id: string,
    dto: CreateLeadActivityDto
  ): Promise<LeadActivityDto> {
    const [existingLead] = await this.db
      .select({ id: schema.leads.id })
      .from(schema.leads)
      .where(
        and(
          eq(schema.leads.id, id),
          eq(schema.leads.workspaceId, tenant.workspaceId)
        )
      );

    if (!existingLead) {
      throw new NotFoundException({
        code: "LEAD_NOT_FOUND",
        message: `Lead with ID '${id}' was not found in this workspace.`,
      });
    }

    const [newEvent] = await this.db
      .insert(schema.leadEvents)
      .values({
        leadId: id,
        workspaceId: tenant.workspaceId,
        type: dto.type,
        title: dto.title,
        description: dto.description,
        channel: dto.channel || "system",
        actorType: "human_broker",
        actorId: tenant.userId,
        metadata: dto.metadata || {},
      })
      .returning();

    // Touch lead updatedAt
    await this.db
      .update(schema.leads)
      .set({ updatedAt: new Date() })
      .where(
        and(
          eq(schema.leads.id, id),
          eq(schema.leads.workspaceId, tenant.workspaceId)
        )
      );

    return toLeadActivityDto(newEvent);
  }

  /**
   * Retrieves paginated activities for a lead.
   */
  async getLeadActivities(
    tenant: TenantContext,
    id: string,
    page = 1,
    limit = 50
  ): Promise<{ activities: LeadActivityDto[]; total: number }> {
    const [existingLead] = await this.db
      .select({ id: schema.leads.id })
      .from(schema.leads)
      .where(
        and(
          eq(schema.leads.id, id),
          eq(schema.leads.workspaceId, tenant.workspaceId)
        )
      );

    if (!existingLead) {
      throw new NotFoundException({
        code: "LEAD_NOT_FOUND",
        message: `Lead with ID '${id}' was not found in this workspace.`,
      });
    }

    const offset = (Math.max(1, page) - 1) * limit;

    const [countResult] = await this.db
      .select({ total: count() })
      .from(schema.leadEvents)
      .where(
        and(
          eq(schema.leadEvents.leadId, id),
          eq(schema.leadEvents.workspaceId, tenant.workspaceId)
        )
      );

    const total = Number(countResult?.total || 0);

    const events = await this.db
      .select()
      .from(schema.leadEvents)
      .where(
        and(
          eq(schema.leadEvents.leadId, id),
          eq(schema.leadEvents.workspaceId, tenant.workspaceId)
        )
      )
      .orderBy(desc(schema.leadEvents.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      activities: events.map(toLeadActivityDto),
      total,
    };
  }
}
