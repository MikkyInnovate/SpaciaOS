import {
  Injectable,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import {
  WorkspaceMembersRepository,
  WorkspaceRole,
} from "./workspace-members.repository";
import { WorkspaceMemberRecord } from "../../database/schema/users.schema";

@Injectable()
export class WorkspaceMembersService {
  private readonly logger = new Logger(WorkspaceMembersService.name);

  constructor(
    private readonly workspaceMembersRepo: WorkspaceMembersRepository
  ) {}

  /**
   * Authoritatively validates that a user is an active member of the given workspace in Neon DB.
   * Throws 403 Forbidden with WORKSPACE_MEMBERSHIP_REQUIRED if membership does not exist.
   */
  async validateMembership(
    workspaceId: string,
    userId: string
  ): Promise<WorkspaceMemberRecord> {
    const member = await this.workspaceMembersRepo.findMember(workspaceId, userId);

    if (!member) {
      this.logger.warn(
        `Access denied: User '${userId}' does not have an active database membership in workspace '${workspaceId}'.`
      );
      throw new ForbiddenException({
        code: "WORKSPACE_MEMBERSHIP_REQUIRED",
        message: `User '${userId}' does not have an active membership in workspace '${workspaceId}'. A valid database membership is required for authorization.`,
      });
    }

    return member;
  }

  /**
   * Finds a member record by workspaceId and userId without throwing.
   */
  async findMember(
    workspaceId: string,
    userId: string
  ): Promise<WorkspaceMemberRecord | null> {
    return this.workspaceMembersRepo.findMember(workspaceId, userId);
  }

  /**
   * Lists all members belonging to a workspace.
   */
  async listMembers(workspaceId: string): Promise<WorkspaceMemberRecord[]> {
    return this.workspaceMembersRepo.listMembers(workspaceId);
  }

  /**
   * Adds a user to a workspace with a designated Pacia role.
   */
  async addMember(
    workspaceId: string,
    userId: string,
    role: WorkspaceRole
  ): Promise<WorkspaceMemberRecord> {
    return this.workspaceMembersRepo.createMember(workspaceId, { userId, role });
  }

  /**
   * Updates a member's role within a workspace.
   */
  async updateRole(
    workspaceId: string,
    userId: string,
    role: WorkspaceRole
  ): Promise<WorkspaceMemberRecord | null> {
    return this.workspaceMembersRepo.updateMemberRole(workspaceId, userId, role);
  }
}
