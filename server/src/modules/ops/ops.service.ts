import {
  Injectable,
  Inject,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import { sql, eq, desc, and, inArray } from "drizzle-orm";
import { DRIZZLE_DATABASE, DrizzleDb } from "../../database/database.provider";
import * as schema from "../../database/schema";
import { IntegrationsService } from "../integrations/integrations.service";
import { AiConfigService } from "../ai-agent/services/ai-config.service";
import { BullMQQueueService } from "../queue/bullmq-queue.service";
import {
  OpsOverviewDto,
  OpsWorkspaceItemDto,
  OpsLeadItemDto,
  OpsWorkflowItemDto,
  OpsCallItemDto,
  OpsAppointmentItemDto,
  OpsErrorItemDto,
  OpsIntegrationItemDto,
  OpsAuditItemDto,
} from "./dto/ops.dto";

@Injectable()
export class OpsService {
  private readonly logger = new Logger(OpsService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: DrizzleDb,
    private readonly integrationsService: IntegrationsService,
    private readonly aiConfigService: AiConfigService,
    private readonly queueService: BullMQQueueService
  ) {}

  /**
   * 1. GET /api/v1/ops/overview
   * Returns aggregated real-time operational pulse across the platform.
   */
  async getOverview(workspaceId?: string): Promise<OpsOverviewDto> {
    const wsFilter = workspaceId ? eq(schema.workspaces.id, workspaceId) : undefined;
    const leadsWsFilter = workspaceId ? eq(schema.leads.workspaceId, workspaceId) : undefined;
    const workflowsWsFilter = workspaceId ? eq(schema.systemEvents.workspaceId, workspaceId) : undefined;
    const callsWsFilter = workspaceId ? eq(schema.calls.workspaceId, workspaceId) : undefined;
    const apptsWsFilter = workspaceId ? eq(schema.appointments.workspaceId, workspaceId) : undefined;
    const integrationsWsFilter = workspaceId ? eq(schema.integrations.workspaceId, workspaceId) : undefined;

    // 1. Total workspaces
    const [wsCountResult] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.workspaces)
      .where(wsFilter);
    const totalWorkspaces = wsCountResult?.count || 0;

    // 2. Total leads
    const [leadsCountResult] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.leads)
      .where(leadsWsFilter);
    const totalLeads = leadsCountResult?.count || 0;

    // 3. Workflows (active vs failed)
    const [activeWorkflowsResult] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.systemEvents)
      .where(
        workflowsWsFilter
          ? and(workflowsWsFilter, sql`${schema.systemEvents.status} in ('emitted', 'processing')`)
          : sql`${schema.systemEvents.status} in ('emitted', 'processing')`
      );
    const activeWorkflows = activeWorkflowsResult?.count || 0;

    const [failedWorkflowsResult] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.systemEvents)
      .where(
        workflowsWsFilter
          ? and(workflowsWsFilter, eq(schema.systemEvents.status, "failed"))
          : eq(schema.systemEvents.status, "failed")
      );
    const failedWorkflows = failedWorkflowsResult?.count || 0;

    // 4. Calls
    const [callsCountResult] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.calls)
      .where(callsWsFilter);
    const totalCalls = callsCountResult?.count || 0;

    // 5. Appointments
    const [apptsCountResult] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.appointments)
      .where(apptsWsFilter);
    const totalAppointments = apptsCountResult?.count || 0;

    // 6. Integrations Health
    const integrationsRows = await this.db
      .select({
        status: schema.integrations.status,
        config: schema.integrations.config,
      })
      .from(schema.integrations)
      .where(integrationsWsFilter);

    let healthy = 0;
    let degraded = 0;
    let unhealthy = 0;

    for (const row of integrationsRows) {
      const cfg: any = row.config || {};
      const hStatus = cfg.healthStatus || (row.status === "connected" ? "healthy" : "untested");
      if (hStatus === "healthy") healthy++;
      else if (hStatus === "degraded") degraded++;
      else if (hStatus === "unhealthy" || row.status === "error") unhealthy++;
      else healthy++;
    }

    const integrationsHealth = {
      healthy,
      degraded,
      unhealthy,
      total: integrationsRows.length,
    };

    // 7. Error Count
    const totalErrors = failedWorkflows + unhealthy;

    // 8. AI Dialer Status
    let aiDialerPaused = false;
    if (workspaceId) {
      const [aiConfig] = await this.db
        .select({ isActive: schema.aiAgentConfigs.isActive })
        .from(schema.aiAgentConfigs)
        .where(eq(schema.aiAgentConfigs.workspaceId, workspaceId))
        .limit(1);
      aiDialerPaused = aiConfig ? !aiConfig.isActive : false;
    } else {
      const [pausedCount] = await this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.aiAgentConfigs)
        .where(eq(schema.aiAgentConfigs.isActive, false));
      aiDialerPaused = (pausedCount?.count || 0) > 0;
    }

    // 9. Overall System Status
    let systemStatus: "operational" | "degraded" | "critical" = "operational";
    if (failedWorkflows > 5 || unhealthy > 2) {
      systemStatus = "critical";
    } else if (failedWorkflows > 0 || degraded > 0 || unhealthy > 0) {
      systemStatus = "degraded";
    }

    return {
      totalWorkspaces,
      totalLeads,
      activeWorkflows,
      failedWorkflows,
      totalCalls,
      totalAppointments,
      totalErrors,
      integrationsHealth,
      aiDialerPaused,
      systemStatus,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * 2. GET /api/v1/ops/workspaces
   * Returns list of workspaces with member count, lead count, call count, and AI status.
   */
  async getWorkspaces(limit = 100): Promise<OpsWorkspaceItemDto[]> {
    const wsList = await this.db
      .select()
      .from(schema.workspaces)
      .orderBy(desc(schema.workspaces.createdAt))
      .limit(limit);

    if (wsList.length === 0) return [];

    const wsIds = wsList.map((w) => w.id);

    // Batch query counts and configs
    const [memberCounts, leadCounts, callCounts, aiConfigs] = await Promise.all([
      this.db
        .select({
          workspaceId: schema.workspaceMembers.workspaceId,
          count: sql<number>`count(*)::int`,
        })
        .from(schema.workspaceMembers)
        .where(inArray(schema.workspaceMembers.workspaceId, wsIds))
        .groupBy(schema.workspaceMembers.workspaceId),

      this.db
        .select({
          workspaceId: schema.leads.workspaceId,
          count: sql<number>`count(*)::int`,
        })
        .from(schema.leads)
        .where(inArray(schema.leads.workspaceId, wsIds))
        .groupBy(schema.leads.workspaceId),

      this.db
        .select({
          workspaceId: schema.calls.workspaceId,
          count: sql<number>`count(*)::int`,
        })
        .from(schema.calls)
        .where(inArray(schema.calls.workspaceId, wsIds))
        .groupBy(schema.calls.workspaceId),

      this.db
        .select({
          workspaceId: schema.aiAgentConfigs.workspaceId,
          isActive: schema.aiAgentConfigs.isActive,
        })
        .from(schema.aiAgentConfigs)
        .where(inArray(schema.aiAgentConfigs.workspaceId, wsIds)),
    ]);

    const memberCountMap = new Map(memberCounts.map((m) => [m.workspaceId, m.count]));
    const leadCountMap = new Map(leadCounts.map((l) => [l.workspaceId, l.count]));
    const callCountMap = new Map(callCounts.map((c) => [c.workspaceId, c.count]));
    const aiStatusMap = new Map(aiConfigs.map((a) => [a.workspaceId, a.isActive === false ? "paused" : "active"]));

    return wsList.map((ws) => ({
      id: ws.id,
      name: ws.name,
      slug: ws.slug,
      tier: ws.tier,
      primaryMarket: ws.primaryMarket,
      memberCount: memberCountMap.get(ws.id) || 0,
      leadCount: leadCountMap.get(ws.id) || 0,
      callCount: callCountMap.get(ws.id) || 0,
      aiStatus: (aiStatusMap.get(ws.id) as "active" | "paused") || "active",
      createdAt: ws.createdAt.toISOString(),
    }));
  }

  /**
   * 3. GET /api/v1/ops/leads
   * Returns recent leads across workspaces.
   */
  async getLeads(limit = 50, workspaceId?: string): Promise<OpsLeadItemDto[]> {
    const filter = workspaceId ? eq(schema.leads.workspaceId, workspaceId) : undefined;

    const leadRows = await this.db
      .select({
        id: schema.leads.id,
        workspaceId: schema.leads.workspaceId,
        name: schema.leads.name,
        email: schema.leads.email,
        phone: schema.leads.phone,
        status: schema.leads.status,
        score: schema.leads.score,
        budget: schema.leads.budget,
        metadata: schema.leads.metadata,
        createdAt: schema.leads.createdAt,
        workspaceName: schema.workspaces.name,
      })
      .from(schema.leads)
      .leftJoin(schema.workspaces, eq(schema.leads.workspaceId, schema.workspaces.id))
      .where(filter)
      .orderBy(desc(schema.leads.createdAt))
      .limit(limit);

    return leadRows.map((r) => {
      const meta: any = r.metadata || {};
      return {
        id: r.id,
        workspaceId: r.workspaceId,
        workspaceName: r.workspaceName || undefined,
        fullName: r.name || "Anonymous Prospect",
        email: r.email,
        phone: r.phone,
        status: r.status,
        score: r.score,
        budget: r.budget ? parseFloat(r.budget.replace(/[^0-9.]/g, "")) || null : null,
        currency: meta.currency || "NGN",
        createdAt: r.createdAt.toISOString(),
      };
    });
  }

  /**
   * 4. GET /api/v1/ops/workflows
   * Returns background workflows / system events.
   */
  async getWorkflows(
    limit = 50,
    statusFilter?: string,
    workspaceId?: string
  ): Promise<OpsWorkflowItemDto[]> {
    const conditions = [];
    if (workspaceId) {
      conditions.push(eq(schema.systemEvents.workspaceId, workspaceId));
    }
    if (statusFilter && statusFilter !== "all") {
      conditions.push(eq(schema.systemEvents.status, statusFilter as any));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await this.db
      .select({
        id: schema.systemEvents.id,
        workspaceId: schema.systemEvents.workspaceId,
        eventName: schema.systemEvents.eventName,
        aggregateType: schema.systemEvents.aggregateType,
        aggregateId: schema.systemEvents.aggregateId,
        status: schema.systemEvents.status,
        payload: schema.systemEvents.payload,
        createdAt: schema.systemEvents.createdAt,
        workspaceName: schema.workspaces.name,
      })
      .from(schema.systemEvents)
      .leftJoin(schema.workspaces, eq(schema.systemEvents.workspaceId, schema.workspaces.id))
      .where(whereClause)
      .orderBy(desc(schema.systemEvents.createdAt))
      .limit(limit);

    return rows.map((r) => {
      const payload: any = r.payload || {};
      return {
        id: r.id,
        workspaceId: r.workspaceId,
        workspaceName: r.workspaceName || undefined,
        eventName: r.eventName,
        aggregateType: r.aggregateType,
        aggregateId: r.aggregateId,
        status: r.status as any,
        payload,
        createdAt: r.createdAt.toISOString(),
        lastError: payload.lastError || payload.error || undefined,
      };
    });
  }

  /**
   * 5. POST /api/v1/ops/workflows/:id/retry
   * Retries a failed workflow / system event.
   */
  async retryWorkflow(workflowId: string, actorId = "ops_operator") {
    const [event] = await this.db
      .select()
      .from(schema.systemEvents)
      .where(eq(schema.systemEvents.id, workflowId))
      .limit(1);

    if (!event) {
      throw new NotFoundException(`Workflow with ID ${workflowId} not found`);
    }

    const payload: any = event.payload || {};
    const retryCount = (payload.retryCount || 0) + 1;

    // Reset status to processing
    const [updated] = await this.db
      .update(schema.systemEvents)
      .set({
        status: "processing",
        payload: {
          ...payload,
          retryCount,
          lastRetriedAt: new Date().toISOString(),
          retriedBy: actorId,
        },
      })
      .where(eq(schema.systemEvents.id, workflowId))
      .returning();

    // Re-queue into BullMQ if active and aggregate is lead or workflow
    try {
      if (event.aggregateType === "lead" || event.aggregateType === "workflow") {
        await this.queueService.dispatchLeadWorkflow(
          {
            workspaceId: event.workspaceId,
            leadId: event.aggregateId,
            phone: payload.phone || "+2348000000000",
            email: payload.email,
            source: payload.source || "ops_retry",
            isReEngagement: true,
            metadata: payload,
          },
          {
            jobId: `lead_retry_${event.workspaceId}_${event.aggregateId}_${retryCount}`,
          }
        );
      }
    } catch (err: any) {
      this.logger.warn(`BullMQ re-queue fallback for ${event.eventName}: ${err.message}`);
    }

    // Record audit log
    await this.db.insert(schema.auditLogs).values({
      workspaceId: event.workspaceId,
      actorId,
      actorType: "user",
      severity: "info",
      action: "workflow:retry",
      resource: `system_event:${workflowId}`,
      metadata: {
        eventName: event.eventName,
        aggregateType: event.aggregateType,
        aggregateId: event.aggregateId,
        retryCount,
      },
    });

    return {
      success: true,
      message: `Workflow '${event.eventName}' (${workflowId}) successfully scheduled for retry.`,
      workflow: updated,
    };
  }

  /**
   * 6. GET /api/v1/ops/calls
   * Returns calls across workspaces.
   */
  async getCalls(limit = 50, workspaceId?: string): Promise<OpsCallItemDto[]> {
    const filter = workspaceId ? eq(schema.calls.workspaceId, workspaceId) : undefined;

    const callRows = await this.db
      .select({
        id: schema.calls.id,
        workspaceId: schema.calls.workspaceId,
        leadName: schema.calls.leadName,
        leadPhone: schema.calls.leadPhone,
        outcome: schema.calls.outcome,
        durationSeconds: schema.calls.durationSeconds,
        isEscalated: schema.calls.isEscalated,
        callScore: schema.calls.callScore,
        recordingUrl: schema.calls.recordingUrl,
        createdAt: schema.calls.createdAt,
        workspaceName: schema.workspaces.name,
      })
      .from(schema.calls)
      .leftJoin(schema.workspaces, eq(schema.calls.workspaceId, schema.workspaces.id))
      .where(filter)
      .orderBy(desc(schema.calls.createdAt))
      .limit(limit);

    return callRows.map((c) => ({
      id: c.id,
      workspaceId: c.workspaceId,
      workspaceName: c.workspaceName || undefined,
      leadName: c.leadName,
      leadPhone: c.leadPhone,
      outcome: c.outcome,
      durationSeconds: c.durationSeconds,
      isEscalated: c.isEscalated,
      callScore: c.callScore,
      recordingUrl: c.recordingUrl,
      createdAt: c.createdAt.toISOString(),
    }));
  }

  /**
   * 7. GET /api/v1/ops/appointments
   * Returns appointments across workspaces.
   */
  async getAppointments(limit = 50, workspaceId?: string): Promise<OpsAppointmentItemDto[]> {
    const filter = workspaceId ? eq(schema.appointments.workspaceId, workspaceId) : undefined;

    const rows = await this.db
      .select({
        id: schema.appointments.id,
        workspaceId: schema.appointments.workspaceId,
        title: schema.appointments.title,
        type: schema.appointments.type,
        status: schema.appointments.status,
        scheduledStartAt: schema.appointments.scheduledStartAt,
        scheduledEndAt: schema.appointments.scheduledEndAt,
        location: schema.appointments.location,
        meetingUrl: schema.appointments.meetingUrl,
        createdAt: schema.appointments.createdAt,
        leadName: schema.leads.name,
        propertyName: schema.properties.title,
        workspaceName: schema.workspaces.name,
      })
      .from(schema.appointments)
      .leftJoin(schema.leads, eq(schema.appointments.leadId, schema.leads.id))
      .leftJoin(schema.properties, eq(schema.appointments.propertyId, schema.properties.id))
      .leftJoin(schema.workspaces, eq(schema.appointments.workspaceId, schema.workspaces.id))
      .where(filter)
      .orderBy(desc(schema.appointments.scheduledStartAt))
      .limit(limit);

    return rows.map((a) => ({
      id: a.id,
      workspaceId: a.workspaceId,
      workspaceName: a.workspaceName || undefined,
      leadName: a.leadName || undefined,
      propertyName: a.propertyName || undefined,
      title: a.title,
      type: a.type,
      status: a.status,
      scheduledStartAt: a.scheduledStartAt.toISOString(),
      scheduledEndAt: a.scheduledEndAt.toISOString(),
      meetingUrl: a.meetingUrl,
      location: a.location,
      createdAt: a.createdAt.toISOString(),
    }));
  }

  /**
   * 8. GET /api/v1/ops/errors
   * Consolidates and returns errors across workflows, integrations, calls, and audit logs.
   */
  async getErrors(limit = 50, workspaceId?: string): Promise<OpsErrorItemDto[]> {
    const errors: OpsErrorItemDto[] = [];

    // 1. Failed Workflows
    const failedWorkflows = await this.db
      .select()
      .from(schema.systemEvents)
      .where(
        workspaceId
          ? and(eq(schema.systemEvents.workspaceId, workspaceId), eq(schema.systemEvents.status, "failed"))
          : eq(schema.systemEvents.status, "failed")
      )
      .orderBy(desc(schema.systemEvents.createdAt))
      .limit(limit);

    for (const fw of failedWorkflows) {
      const payload: any = fw.payload || {};
      errors.push({
        id: `err_wf_${fw.id}`,
        workspaceId: fw.workspaceId,
        source: "workflow",
        title: `Workflow Failed: ${fw.eventName}`,
        message: payload.lastError || payload.error || `Execution failed for ${fw.aggregateType}:${fw.aggregateId}`,
        severity: "critical",
        errorDetails: payload,
        retryable: true,
        entityId: fw.id,
        createdAt: fw.createdAt.toISOString(),
      });
    }

    // 2. Integration Errors / Degraded
    const errorIntegrations = await this.db
      .select()
      .from(schema.integrations)
      .where(
        workspaceId
          ? and(
              eq(schema.integrations.workspaceId, workspaceId),
              sql`${schema.integrations.status} = 'error' OR ${schema.integrations.config}->>'healthStatus' in ('unhealthy', 'degraded')`
            )
          : sql`${schema.integrations.status} = 'error' OR ${schema.integrations.config}->>'healthStatus' in ('unhealthy', 'degraded')`
      )
      .orderBy(desc(schema.integrations.updatedAt))
      .limit(limit);

    for (const ei of errorIntegrations) {
      const cfg: any = ei.config || {};
      errors.push({
        id: `err_int_${ei.id}`,
        workspaceId: ei.workspaceId,
        source: "integration",
        title: `Integration Issue: ${ei.name}`,
        message: cfg.lastError || `Connector in ${ei.status} / ${cfg.healthStatus || "unhealthy"} state`,
        severity: cfg.healthStatus === "degraded" ? "warning" : "critical",
        errorDetails: {
          failureCount: cfg.failureCount,
          lastTestedAt: cfg.lastTestedAt,
        },
        retryable: true,
        entityId: ei.id,
        createdAt: ei.updatedAt.toISOString(),
      });
    }

    // 3. Failed Calls
    const failedCalls = await this.db
      .select()
      .from(schema.calls)
      .where(
        workspaceId
          ? and(eq(schema.calls.workspaceId, workspaceId), eq(schema.calls.recordingState, "failed"))
          : eq(schema.calls.recordingState, "failed")
      )
      .orderBy(desc(schema.calls.createdAt))
      .limit(limit);

    for (const fc of failedCalls) {
      errors.push({
        id: `err_call_${fc.id}`,
        workspaceId: fc.workspaceId,
        source: "call",
        title: `Call Recording Failed: ${fc.leadName}`,
        message: `Telephony recording synthesis failed for call with ${fc.leadPhone}`,
        severity: "warning",
        errorDetails: fc.metrics,
        retryable: false,
        entityId: fc.id,
        createdAt: fc.createdAt.toISOString(),
      });
    }

    // 4. Critical Audit Logs
    const criticalLogs = await this.db
      .select()
      .from(schema.auditLogs)
      .where(
        workspaceId
          ? and(eq(schema.auditLogs.workspaceId, workspaceId), eq(schema.auditLogs.severity, "critical"))
          : eq(schema.auditLogs.severity, "critical")
      )
      .orderBy(desc(schema.auditLogs.createdAt))
      .limit(limit);

    for (const cl of criticalLogs) {
      errors.push({
        id: `err_audit_${cl.id}`,
        workspaceId: cl.workspaceId,
        source: "system",
        title: `Security Alert: ${cl.action}`,
        message: `Action on ${cl.resource} by ${cl.actorType}:${cl.actorId}`,
        severity: "critical",
        errorDetails: cl.metadata,
        retryable: false,
        entityId: cl.id,
        createdAt: cl.createdAt.toISOString(),
      });
    }

    // Sort all errors by creation timestamp descending
    errors.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return errors.slice(0, limit);
  }

  /**
   * 9. GET /api/v1/ops/integrations
   * Returns all integrations across workspaces with health telemetry.
   */
  async getIntegrations(workspaceId?: string): Promise<OpsIntegrationItemDto[]> {
    const filter = workspaceId ? eq(schema.integrations.workspaceId, workspaceId) : undefined;

    const rows = await this.db
      .select({
        id: schema.integrations.id,
        workspaceId: schema.integrations.workspaceId,
        type: schema.integrations.type,
        name: schema.integrations.name,
        status: schema.integrations.status,
        config: schema.integrations.config,
        workspaceName: schema.workspaces.name,
      })
      .from(schema.integrations)
      .leftJoin(schema.workspaces, eq(schema.integrations.workspaceId, schema.workspaces.id))
      .where(filter)
      .orderBy(desc(schema.integrations.createdAt));

    return rows.map((r) => {
      const cfg: any = r.config || {};
      return {
        id: r.id,
        workspaceId: r.workspaceId,
        workspaceName: r.workspaceName || undefined,
        type: r.type,
        name: r.name,
        category: cfg.category || r.type,
        status: r.status,
        healthStatus: cfg.healthStatus || (r.status === "connected" ? "healthy" : "untested"),
        latencyMs: cfg.latencyMs || null,
        failureCount: cfg.failureCount || 0,
        lastTestedAt: cfg.lastTestedAt || null,
        lastError: cfg.lastError || null,
      };
    });
  }

  /**
   * 10. POST /api/v1/ops/integrations/:id/reconnect
   * Triggers reconnection and health probe for an integration from ops command.
   */
  async reconnectIntegration(
    integrationId: string,
    workspaceId?: string,
    actorId = "ops_operator"
  ) {
    let targetWsId = workspaceId;
    if (!targetWsId) {
      const [row] = await this.db
        .select({ workspaceId: schema.integrations.workspaceId })
        .from(schema.integrations)
        .where(eq(schema.integrations.id, integrationId))
        .limit(1);
      targetWsId = row?.workspaceId;
    }

    if (!targetWsId) {
      throw new NotFoundException(`Integration with ID ${integrationId} not found`);
    }

    const result = await this.integrationsService.reconnect(targetWsId, integrationId);

    // Record audit log
    await this.db.insert(schema.auditLogs).values({
      workspaceId: targetWsId,
      actorId,
      actorType: "user",
      severity: "info",
      action: "integration:reconnect",
      resource: `integration:${integrationId}`,
      metadata: {
        status: result.status,
        healthStatus: result.config?.healthStatus,
      },
    });

    return {
      success: true,
      message: `Integration '${result.name}' successfully reconnected.`,
      integration: result,
    };
  }

  /**
   * 11. GET /api/v1/ops/audit
   * Queries audit logs with optional severity and actor filters.
   */
  async getAuditLogs(
    limit = 50,
    severityFilter?: string,
    actorTypeFilter?: string,
    workspaceId?: string
  ): Promise<OpsAuditItemDto[]> {
    const conditions = [];

    if (workspaceId) {
      conditions.push(eq(schema.auditLogs.workspaceId, workspaceId));
    }
    if (severityFilter && severityFilter !== "all") {
      conditions.push(eq(schema.auditLogs.severity, severityFilter as any));
    }
    if (actorTypeFilter && actorTypeFilter !== "all") {
      conditions.push(eq(schema.auditLogs.actorType, actorTypeFilter as any));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await this.db
      .select()
      .from(schema.auditLogs)
      .where(whereClause)
      .orderBy(desc(schema.auditLogs.createdAt))
      .limit(limit);

    return rows.map((r) => ({
      id: r.id,
      workspaceId: r.workspaceId,
      actorId: r.actorId,
      actorType: r.actorType,
      action: r.action,
      resource: r.resource,
      severity: r.severity as any,
      metadata: r.metadata,
      ipAddress: r.ipAddress,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  /**
   * 12. POST /api/v1/ops/ai/pause
   * Pauses outbound AI calling engine for a workspace or platform fleet.
   */
  async pauseAiDialer(workspaceId: string, actorId = "ops_operator") {
    const config = await this.aiConfigService.setOutboundStatus(workspaceId, false);

    await this.db.insert(schema.auditLogs).values({
      workspaceId,
      actorId,
      actorType: "user",
      severity: "warning",
      action: "ai:pause_dialer",
      resource: `ai_agent:${workspaceId}`,
      metadata: {
        outboundPaused: true,
      },
    });

    return {
      success: true,
      isOutboundPaused: true,
      message: "Outbound AI voice dialer paused by operations command.",
      config,
    };
  }

  /**
   * 13. POST /api/v1/ops/ai/resume
   * Resumes outbound AI calling engine for a workspace.
   */
  async resumeAiDialer(workspaceId: string, actorId = "ops_operator") {
    const config = await this.aiConfigService.setOutboundStatus(workspaceId, true);

    await this.db.insert(schema.auditLogs).values({
      workspaceId,
      actorId,
      actorType: "user",
      severity: "info",
      action: "ai:resume_dialer",
      resource: `ai_agent:${workspaceId}`,
      metadata: {
        outboundPaused: false,
      },
    });

    return {
      success: true,
      isOutboundPaused: false,
      message: "Outbound AI voice dialer resumed by operations command.",
      config,
    };
  }

  /**
   * 14. GET /api/v1/ops/ai/status
   * Returns current AI dialer status and telemetry.
   */
  async getAiDialerStatus(workspaceId: string) {
    const telemetry = await this.aiConfigService.getTelemetry(workspaceId);
    return {
      success: true,
      status: telemetry,
    };
  }
}
