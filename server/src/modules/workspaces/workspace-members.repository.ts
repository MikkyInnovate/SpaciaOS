import { Injectable, Inject } from "@nestjs/common";
import { eq, and } from "drizzle-orm";
import { BaseTenantRepository } from "../../common/tenant/base-tenant.repository";
import {
  workspaceMembers,
  WorkspaceMemberRecord,
  NewWorkspaceMemberRecord,
  workspaceRoleEnum,
} from "../../database/schema/users.schema";
import { DRIZZLE_DATABASE, DrizzleDb } from "../../database/database.provider";
import { ClientRole } from "../../database/schema/roles.schema";

export type WorkspaceRole = (typeof workspaceRoleEnum.enumValues)[number];

@Injectable()
export class WorkspaceMembersRepository extends BaseTenantRepository<
  typeof workspaceMembers,
  WorkspaceMemberRecord,
  NewWorkspaceMemberRecord
> {
  constructor(@Inject(DRIZZLE_DATABASE) db: DrizzleDb) {
    super(db, workspaceMembers);
  }

  /**
   * Finds a member record by workspaceId and userId.
   */
  async findMember(workspaceId: string, userId: string): Promise<WorkspaceMemberRecord | null> {
    const results = await this.db
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.userId, userId)
        )
      )
      .limit(1);

    return results[0] || null;
  }

  /**
   * Lists all members of a workspace.
   */
  async listMembers(workspaceId: string): Promise<WorkspaceMemberRecord[]> {
    return this.scoped(workspaceId).findMany();
  }

  /**
   * Creates a member in a workspace.
   */
  async createMember(
    workspaceId: string,
    data: { userId: string; role: WorkspaceRole }
  ): Promise<WorkspaceMemberRecord> {
    return this.scoped(workspaceId).create(data);
  }

  /**
   * Updates a member's role within a workspace.
   */
  async updateMemberRole(
    workspaceId: string,
    userId: string,
    role: WorkspaceRole
  ): Promise<WorkspaceMemberRecord | null> {
    const results = (await this.db
      .update(workspaceMembers)
      .set({ role })
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.userId, userId)
        )
      )
      .returning()) as WorkspaceMemberRecord[];

    return results[0] || null;
  }

  /**
   * Removes a member from a workspace.
   */
  async removeMember(workspaceId: string, userId: string): Promise<boolean> {
    const results = (await this.db
      .delete(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.userId, userId)
        )
      )
      .returning()) as WorkspaceMemberRecord[];

    return results.length > 0;
  }
}
