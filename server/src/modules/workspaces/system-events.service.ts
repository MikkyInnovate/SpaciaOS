import { Injectable, Logger } from "@nestjs/common";
import { SystemEventsRepository } from "./system-events.repository";
import { TenantContext } from "../../common/tenant/tenant-context.interface";
import { CreateSystemEventDto } from "./dto/create-system-event.dto";
import { SystemEventRecord } from "../../database/schema/system-events.schema";

@Injectable()
export class SystemEventsService {
  private readonly logger = new Logger(SystemEventsService.name);

  constructor(private readonly systemEventsRepo: SystemEventsRepository) {}

  /**
   * Emits an operational event strictly bound to the caller's tenant.
   */
  async emitEvent(
    tenant: TenantContext,
    dto: CreateSystemEventDto
  ): Promise<SystemEventRecord> {
    const tenantScoped = this.systemEventsRepo.forTenant(tenant);

    const record = await tenantScoped.create({
      eventName: dto.eventName,
      aggregateType: dto.aggregateType,
      aggregateId: dto.aggregateId,
      payload: dto.payload || {},
      status: "emitted",
    });

    this.logger.log(
      `Tenant [${tenant.workspaceId}] emitted event: ${dto.eventName} on ${dto.aggregateType}:${dto.aggregateId}`
    );

    return record;
  }

  /**
   * Retrieves operational events strictly scoped to the caller's tenant.
   */
  async getTenantEvents(
    tenant: TenantContext,
    limit: number = 50
  ): Promise<SystemEventRecord[]> {
    const tenantScoped = this.systemEventsRepo.forTenant(tenant);
    return tenantScoped.findMany({ limit });
  }
}
