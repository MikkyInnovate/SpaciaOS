import {
  Injectable,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { UsersRepository } from "../users/users.repository";
import { WorkspacesRepository } from "./workspaces.repository";
import { WorkspaceMembersRepository, WorkspaceRole } from "./workspace-members.repository";
import { UserRecord } from "../../database/schema/users.schema";
import { WorkspaceRecord, WorkspaceTier } from "../../database/schema/workspaces.schema";
import { WorkspaceMemberRecord } from "../../database/schema/users.schema";

export interface ProvisionWorkspaceInput {
  userId: string;
  userEmail: string;
  userFirstName?: string;
  userLastName?: string;
  userImageUrl?: string;
  workspaceId: string;
  workspaceName: string;
  workspaceSlug: string;
  workspaceTier?: "starter" | "growth" | "enterprise";
  requestedRole?: WorkspaceRole;
  isOrgAdminInClerk?: boolean;
}

export interface ProvisioningResult {
  user: UserRecord;
  workspace: WorkspaceRecord;
  membership: WorkspaceMemberRecord;
  isNewWorkspace: boolean;
}

/**
 * ProvisioningService: Dedicated, isolated service for explicit workspace onboarding and synchronization.
 * 
 * Architectural Guarantees:
 * 1. SEPARATE CONCERN: Never automatically invoked by authentication or authorization guards.
 * 2. IDEMPOTENT: Safe against concurrent requests and retries.
 * 3. ROLE SAFETY: Non-admin Clerk users cannot initialize a new workspace as owner without admin privileges.
 */
@Injectable()
export class ProvisioningService {
  private readonly logger = new Logger(ProvisioningService.name);

  constructor(
    private readonly usersRepo: UsersRepository,
    private readonly workspacesRepo: WorkspacesRepository,
    private readonly membersRepo: WorkspaceMembersRepository
  ) {}

  /**
   * Explicitly provisions or synchronizes a user and workspace.
   */
  async provisionOrSync(input: ProvisionWorkspaceInput): Promise<ProvisioningResult> {
    // 1. Upsert User record in Neon
    const user = await this.usersRepo.upsert({
      id: input.userId,
      email: input.userEmail,
      firstName: input.userFirstName,
      lastName: input.userLastName,
      imageUrl: input.userImageUrl,
    });

    // 2. Check if workspace already exists in Neon
    let workspace = await this.workspacesRepo.findById(input.workspaceId);
    let isNewWorkspace = false;

    if (!workspace) {
      // Role safety: Only a Clerk org:admin/owner or explicit initial creator may initialize a new workspace
      if (input.isOrgAdminInClerk === false) {
        throw new BadRequestException({
          code: "CANNOT_INITIALIZE_WORKSPACE",
          message: "Only organization administrators can initialize a new Pacia workspace.",
        });
      }

      workspace = await this.workspacesRepo.create({
        id: input.workspaceId,
        name: input.workspaceName,
        slug: input.workspaceSlug,
        tier: input.workspaceTier || "starter",
      });
      isNewWorkspace = true;
      this.logger.log(`Provisioned new workspace: ${workspace.id} (${workspace.name})`);
    }

    // 3. Resolve membership
    let membership = await this.membersRepo.findMember(workspace.id, user.id);

    if (!membership) {
      // Determine initial role: First creator of a new workspace becomes owner; joining existing becomes sales_agent unless admin
      let initialRole: WorkspaceRole = "sales_agent";
      if (isNewWorkspace) {
        initialRole = "owner";
      } else if (input.isOrgAdminInClerk) {
        initialRole = "admin";
      }

      membership = await this.membersRepo.createMember(workspace.id, {
        userId: user.id,
        role: initialRole,
      });

      this.logger.log(
        `Added user ${user.id} to workspace ${workspace.id} with role: ${initialRole}`
      );
    }

    return {
      user,
      workspace,
      membership,
      isNewWorkspace,
    };
  }
}
