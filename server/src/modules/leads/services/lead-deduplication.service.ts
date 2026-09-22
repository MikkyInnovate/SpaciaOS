import { Injectable, Inject, Logger } from "@nestjs/common";
import { eq, and } from "drizzle-orm";
import { DRIZZLE_DATABASE, DrizzleDb } from "../../../database/database.provider";
import { leads, LeadRecord } from "../../../database/schema/leads.schema";

export interface DuplicateSearchCriteria {
  externalId?: string;
  phone: string;
  email?: string;
}

@Injectable()
export class LeadDeduplicationService {
  private readonly logger = new Logger(LeadDeduplicationService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: DrizzleDb) {}

  /**
   * Searches for an existing lead strictly scoped to the tenant workspace.
   * Priority: external_id -> normalized phone -> normalized email.
   */
  async findExistingLead(
    workspaceId: string,
    criteria: DuplicateSearchCriteria,
    executor?: any
  ): Promise<LeadRecord | null> {
    const dbContext = executor || this.db;

    // 1. External / Client Lead ID match (exact client reference)
    if (criteria.externalId) {
      const byExternalId = await dbContext
        .select()
        .from(leads)
        .where(
          and(
            eq(leads.workspaceId, workspaceId),
            eq(leads.externalId, criteria.externalId)
          )
        )
        .limit(1);

      if (byExternalId.length > 0) {
        this.logger.log(
          `Lead duplicate found by externalId '${criteria.externalId}' in workspace '${workspaceId}'`
        );
        return byExternalId[0];
      }
    }

    // 2. Normalized Phone number match
    if (criteria.phone) {
      const byPhone = await dbContext
        .select()
        .from(leads)
        .where(
          and(
            eq(leads.workspaceId, workspaceId),
            eq(leads.phone, criteria.phone)
          )
        )
        .limit(1);

      if (byPhone.length > 0) {
        this.logger.log(
          `Lead duplicate found by phone '${criteria.phone}' in workspace '${workspaceId}'`
        );
        return byPhone[0];
      }
    }

    // 3. Normalized Email match
    if (criteria.email) {
      const byEmail = await dbContext
        .select()
        .from(leads)
        .where(
          and(
            eq(leads.workspaceId, workspaceId),
            eq(leads.email, criteria.email)
          )
        )
        .limit(1);

      if (byEmail.length > 0) {
        this.logger.log(
          `Lead duplicate found by email '${criteria.email}' in workspace '${workspaceId}'`
        );
        return byEmail[0];
      }
    }

    return null;
  }
}
