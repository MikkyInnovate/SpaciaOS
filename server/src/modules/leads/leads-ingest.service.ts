import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { eq, and } from "drizzle-orm";
import { DRIZZLE_DATABASE, DrizzleDb } from "../../database/database.provider";
import { WorkspacesRepository } from "../workspaces/workspaces.repository";
import { LeadIngestDto } from "./dto/lead-ingest.dto";
import { LeadNormalizerUtils } from "./utils/lead-normalizer.utils";
import { LeadIdempotencyService } from "./services/lead-idempotency.service";
import { LeadDeduplicationService } from "./services/lead-deduplication.service";
import { LeadWorkflowQueueService } from "./services/lead-workflow-queue.service";
import { TenantContext } from "../../common/tenant/tenant-context.interface";
import { WorkspaceRecord } from "../../database/schema/workspaces.schema";
import { properties, PropertyRecord } from "../../database/schema/properties.schema";
import { leads, LeadRecord } from "../../database/schema/leads.schema";
import { leadEvents } from "../../database/schema/leads.schema";

export interface IngestLeadResult {
  statusCode: number;
  responseBody: {
    lead: LeadRecord;
    isDuplicate: boolean;
    reEngaged: boolean;
    message: string;
  };
  isReplay: boolean;
}

@Injectable()
export class LeadsIngestService {
  private readonly logger = new Logger(LeadsIngestService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: DrizzleDb,
    private readonly workspacesRepo: WorkspacesRepository,
    private readonly idempotencyService: LeadIdempotencyService,
    private readonly deduplicationService: LeadDeduplicationService,
    private readonly workflowQueueService: LeadWorkflowQueueService
  ) {}

  /**
   * Resolves the authoritative workspace adhering strictly to precedence rules:
   * 1. Authenticated tenant context is IMMUTABLE and takes absolute precedence.
   * 2. Unauthenticated: X-Workspace-Id -> X-Workspace-Slug -> workspaceSlug in body -> workspaceId in body.
   */
  async resolveWorkspace(
    headers: Record<string, string | string[] | undefined>,
    dto: LeadIngestDto,
    tenantContext?: TenantContext
  ): Promise<WorkspaceRecord> {
    const headerWsId = (headers["x-workspace-id"] as string)?.trim();
    const headerWsSlug = (headers["x-workspace-slug"] as string)?.trim();
    const bodySlug = dto.workspaceSlug?.trim();
    const bodyId = dto.workspaceId?.trim();

    // 1. Authenticated Request
    if (tenantContext?.workspaceId) {
      const authWsId = tenantContext.workspaceId;

      // Reject any conflicting header or body specification to prevent tenant spoofing
      if (headerWsId && headerWsId !== authWsId) {
        throw new ForbiddenException({
          code: "WORKSPACE_CONTEXT_MISMATCH",
          message: `Header 'X-Workspace-Id' (${headerWsId}) does not match authenticated tenant (${authWsId}).`,
        });
      }
      if (bodyId && bodyId !== authWsId) {
        throw new ForbiddenException({
          code: "WORKSPACE_CONTEXT_MISMATCH",
          message: `Payload 'workspaceId' (${bodyId}) does not match authenticated tenant (${authWsId}).`,
        });
      }
      if (tenantContext.orgSlug) {
        if (headerWsSlug && headerWsSlug !== tenantContext.orgSlug) {
          throw new ForbiddenException({
            code: "WORKSPACE_CONTEXT_MISMATCH",
            message: `Header 'X-Workspace-Slug' does not match authenticated tenant organization slug.`,
          });
        }
        if (bodySlug && bodySlug !== tenantContext.orgSlug) {
          throw new ForbiddenException({
            code: "WORKSPACE_CONTEXT_MISMATCH",
            message: `Payload 'workspaceSlug' does not match authenticated tenant organization slug.`,
          });
        }
      }

      let workspace = await this.workspacesRepo.findById(authWsId);
      if (!workspace) {
        if (
          process.env.NODE_ENV === "development" ||
          process.env.ALLOW_MOCK_AUTH === "true"
        ) {
          workspace = await this.workspacesRepo.create({
            id: authWsId,
            name: tenantContext.orgSlug
              ? tenantContext.orgSlug.replace(/-/g, " ")
              : "Primary Workspace",
            slug: tenantContext.orgSlug || authWsId,
          });
        } else {
          throw new NotFoundException({
            code: "WORKSPACE_NOT_PROVISIONED",
            message: `Authenticated workspace '${authWsId}' not found in database.`,
          });
        }
      }
      return workspace;
    }

    // 2. Unauthenticated / Public Webhook Precedence
    // Precedence: X-Workspace-Id -> X-Workspace-Slug -> body.workspaceSlug -> body.workspaceId
    let workspace: WorkspaceRecord | null = null;

    if (headerWsId) {
      workspace = await this.workspacesRepo.findById(headerWsId);
      if (!workspace) {
        if (
          process.env.NODE_ENV === "development" ||
          process.env.ALLOW_MOCK_AUTH === "true"
        ) {
          workspace = await this.workspacesRepo.create({
            id: headerWsId,
            name: headerWsSlug ? headerWsSlug.replace(/-/g, " ") : "Primary Workspace",
            slug: headerWsSlug || headerWsId,
          });
        } else {
          throw new NotFoundException({
            code: "WORKSPACE_NOT_PROVISIONED",
            message: `Workspace ID '${headerWsId}' specified in X-Workspace-Id header not found.`,
          });
        }
      }
      return workspace;
    }

    if (headerWsSlug) {
      workspace = await this.workspacesRepo.findBySlug(headerWsSlug);
      if (!workspace) {
        throw new NotFoundException({
          code: "WORKSPACE_NOT_PROVISIONED",
          message: `Workspace slug '${headerWsSlug}' specified in X-Workspace-Slug header not found.`,
        });
      }
      return workspace;
    }

    if (bodySlug) {
      workspace = await this.workspacesRepo.findBySlug(bodySlug);
      if (!workspace) {
        throw new NotFoundException({
          code: "WORKSPACE_NOT_PROVISIONED",
          message: `Workspace slug '${bodySlug}' specified in request body not found.`,
        });
      }
      return workspace;
    }

    if (bodyId) {
      workspace = await this.workspacesRepo.findById(bodyId);
      if (!workspace) {
        throw new NotFoundException({
          code: "WORKSPACE_NOT_PROVISIONED",
          message: `Workspace ID '${bodyId}' specified in request body not found.`,
        });
      }
      return workspace;
    }

    if (
      process.env.NODE_ENV === "development" ||
      process.env.ALLOW_MOCK_AUTH === "true"
    ) {
      const defaultWs = await this.workspacesRepo.findById("org_dubai_palace");
      if (defaultWs) return defaultWs;
    }

    throw new BadRequestException({
      code: "WORKSPACE_IDENTIFIER_REQUIRED",
      message:
        "A workspace identifier (X-Workspace-Id, X-Workspace-Slug, or workspaceSlug/workspaceId in body) is required for public lead ingestion.",
    });
  }

  /**
   * Resolves target property strictly scoped to the resolved workspace.
   * Cross-tenant references throw an explicit validation exception.
   */
  async resolveProperty(
    workspaceId: string,
    workspaceSlug: string,
    propertyId?: string,
    propertySlug?: string
  ): Promise<PropertyRecord | null> {
    if (propertyId) {
      const results = await this.db
        .select()
        .from(properties)
        .where(
          and(
            eq(properties.workspaceId, workspaceId),
            eq(properties.id, propertyId)
          )
        )
        .limit(1);

      if (results.length === 0) {
        throw new BadRequestException({
          code: "PROPERTY_NOT_FOUND_IN_WORKSPACE",
          message: `Property ID '${propertyId}' does not exist in workspace '${workspaceSlug}'. Cross-workspace property attachment is blocked.`,
        });
      }
      return results[0];
    }

    if (propertySlug) {
      const results = await this.db
        .select()
        .from(properties)
        .where(
          and(
            eq(properties.workspaceId, workspaceId),
            eq(properties.slug, propertySlug)
          )
        )
        .limit(1);

      if (results.length === 0) {
        throw new BadRequestException({
          code: "PROPERTY_NOT_FOUND_IN_WORKSPACE",
          message: `Property slug '${propertySlug}' does not exist in workspace '${workspaceSlug}'. Cross-workspace property attachment is blocked.`,
        });
      }
      return results[0];
    }

    return null;
  }

  /**
   * Executes the full lead ingestion pipeline with transactional integrity.
   */
  async ingestLead(
    headers: Record<string, string | string[] | undefined>,
    dto: LeadIngestDto,
    tenantContext?: TenantContext,
    idempotencyKey?: string
  ): Promise<IngestLeadResult> {
    // 1. Resolve workspace authoritatively
    const workspace = await this.resolveWorkspace(headers, dto, tenantContext);

    // 2. Concurrency-safe Idempotency Check & Reservation
    if (idempotencyKey) {
      const reservation = await this.idempotencyService.reserveKey(
        workspace.id,
        idempotencyKey
      );

      if (!reservation.isNew && reservation.isCompleted) {
        return {
          statusCode: reservation.statusCode,
          responseBody: reservation.responseBody,
          isReplay: true,
        };
      }
    }

    try {
      // 3. Normalize fields
      const normalizedPhone = LeadNormalizerUtils.normalizePhone(dto.phone);
      if (!normalizedPhone) {
        throw new BadRequestException({
          code: "INVALID_PHONE_NUMBER",
          message: "A valid phone number is required.",
        });
      }
      const normalizedEmail = LeadNormalizerUtils.normalizeEmail(dto.email);
      const normalizedName = LeadNormalizerUtils.normalizeName(dto.name);
      const normalizedBudget = LeadNormalizerUtils.normalizeString(dto.budget);
      const normalizedTimeline = LeadNormalizerUtils.normalizeString(dto.timeline);
      const normalizedLocation = LeadNormalizerUtils.normalizeString(
        dto.locationPreference
      );
      const source =
        LeadNormalizerUtils.normalizeString(dto.source) || "website";
      const clientLeadId = LeadNormalizerUtils.normalizeString(dto.clientLeadId);

      // 4. Resolve target property strictly scoped to workspace
      const targetProperty = await this.resolveProperty(
        workspace.id,
        workspace.slug,
        dto.propertyId,
        dto.propertySlug
      );

      // 5. Execute Atomic Ingestion Transaction
      const result = await this.db.transaction(async (tx) => {
        // A. Duplicate Detection (externalId -> phone -> email)
        const existingLead = await this.deduplicationService.findExistingLead(
          workspace.id,
          {
            externalId: clientLeadId,
            phone: normalizedPhone,
            email: normalizedEmail,
          },
          tx
        );

        if (existingLead) {
          // --- RE-ENGAGEMENT FLOW ---
          this.logger.log(
            `Lead re-engagement detected: Lead [${existingLead.id}] (Workspace: ${workspace.id})`
          );

          // Record inbound re-engagement event
          await tx.insert(leadEvents).values({
            workspaceId: workspace.id,
            leadId: existingLead.id,
            type: "inbound_capture",
            title: "Lead Re-engagement: Inbound Website Inquiry",
            description: `Re-engagement inquiry received via ${source}. Inbound message: ${
              dto.message || "No message provided"
            }`,
            channel: source,
            actorType: "system",
            metadata: {
              clientLeadId,
              propertyId: targetProperty?.id || existingLead.propertyId,
              propertySlug: targetProperty?.slug || dto.propertySlug,
              rawPayload: dto,
              isDuplicate: true,
              reEngaged: true,
            },
          });

          // Update lead notes and target property if new
          const updatedNotes = dto.message
            ? existingLead.inboundNotes
              ? `${existingLead.inboundNotes}\n---\n[${new Date().toISOString()}] ${dto.message}`
              : dto.message
            : existingLead.inboundNotes;

          const [updatedLead] = await tx
            .update(leads)
            .set({
              propertyId: targetProperty?.id || existingLead.propertyId,
              inboundNotes: updatedNotes,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(leads.id, existingLead.id),
                eq(leads.workspaceId, workspace.id)
              )
            )
            .returning();

          const responsePayload = {
            lead: updatedLead,
            isDuplicate: true,
            reEngaged: true,
            message:
              "Existing lead identified and re-engaged with new inquiry event.",
          };

          // Complete idempotency key if requested
          if (idempotencyKey) {
            await this.idempotencyService.completeReservation(
              workspace.id,
              idempotencyKey,
              200,
              responsePayload,
              tx
            );
          }

          return {
            statusCode: 200,
            responseBody: responsePayload,
            isReplay: false,
            leadRecord: updatedLead,
            isDuplicate: true,
          };
        }

        // --- NEW LEAD CREATION FLOW ---
        this.logger.log(
          `Creating new lead '${normalizedName}' for workspace '${workspace.id}'`
        );

        const [newLead] = await tx
          .insert(leads)
          .values({
            workspaceId: workspace.id,
            name: normalizedName,
            phone: normalizedPhone,
            email: normalizedEmail,
            propertyId: targetProperty?.id,
            inboundNotes: dto.message,
            locationPreference: normalizedLocation,
            budget: normalizedBudget,
            timeline: normalizedTimeline,
            source,
            status: "New",
            scoreCategory: "COLD",
            score: 0,
            intent: "Purchase",
            managementMode: "ai_autonomous",
            externalId: clientLeadId,
            metadata: dto.metadata || {},
          })
          .returning();

        // Record initial inbound_capture event
        await tx.insert(leadEvents).values({
          workspaceId: workspace.id,
          leadId: newLead.id,
          type: "inbound_capture",
          title: "Inbound Lead Ingestion",
          description: `Lead created via ${source}. Inbound message: ${
            dto.message || "Website inquiry"
          }`,
          channel: source,
          actorType: "system",
          metadata: {
            clientLeadId,
            propertyId: targetProperty?.id,
            propertySlug: targetProperty?.slug || dto.propertySlug,
            rawPayload: dto,
            isDuplicate: false,
          },
        });

        // Record durable NewLead system event into transactional outbox
        await this.workflowQueueService.recordDurableNewLeadEvent(
          workspace.id,
          newLead,
          {
            propertySlug: targetProperty?.slug || dto.propertySlug,
            clientLeadId,
          },
          tx
        );

        const responsePayload = {
          lead: newLead,
          isDuplicate: false,
          reEngaged: false,
          message: "Lead successfully ingested and registered.",
        };

        // Complete idempotency key if requested
        if (idempotencyKey) {
          await this.idempotencyService.completeReservation(
            workspace.id,
            idempotencyKey,
            201,
            responsePayload,
            tx
          );
        }

        return {
          statusCode: 201,
          responseBody: responsePayload,
          isReplay: false,
          leadRecord: newLead,
          isDuplicate: false,
        };
      });

      // 6. Post-Transaction: In-Process Asynchronous Workflow Dispatch
      this.workflowQueueService.dispatchInProcessWorkflow(
        workspace.id,
        result.leadRecord,
        result.isDuplicate
      );

      return {
        statusCode: result.statusCode,
        responseBody: result.responseBody,
        isReplay: false,
      };
    } catch (err: any) {
      // If error occurred and an idempotency key was reserved, unlock/fail it
      if (idempotencyKey) {
        await this.idempotencyService
          .failReservation(workspace.id, idempotencyKey)
          .catch(() => {});
      }
      throw err;
    }
  }
}
