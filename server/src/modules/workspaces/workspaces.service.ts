import {
  Injectable,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import { WorkspacesRepository } from "./workspaces.repository";
import { TenantContext } from "../../common/tenant/tenant-context.interface";
import { WorkspaceRecord, NewWorkspaceRecord } from "../../database/schema/workspaces.schema";

@Injectable()
export class WorkspacesService {
  private readonly logger = new Logger(WorkspacesService.name);

  constructor(private readonly workspacesRepo: WorkspacesRepository) {}

  /**
   * Authoritatively resolves a workspace by its Clerk org_id.
   * If not provisioned, throws 404 with canonical WORKSPACE_NOT_PROVISIONED.
   */
  async resolveWorkspace(workspaceId: string): Promise<WorkspaceRecord> {
    const workspace = await this.workspacesRepo.findById(workspaceId);

    if (!workspace) {
      this.logger.warn(`Workspace not found in database for org_id: ${workspaceId}`);
      throw new NotFoundException({
        code: "WORKSPACE_NOT_PROVISIONED",
        message: `Workspace '${workspaceId}' has not been provisioned in Pacia. Please complete workspace provisioning.`,
      });
    }

    return workspace;
  }

  /**
   * Returns current active workspace along with tenant membership & role details.
   */
  async getCurrentWorkspace(tenant: TenantContext): Promise<{
    workspace: WorkspaceRecord;
    tenant: {
      userId: string;
      role: string;
      permissions: string[];
      orgSlug?: string;
    };
  }> {
    const workspace = await this.resolveWorkspace(tenant.workspaceId);

    return {
      workspace,
      tenant: {
        userId: tenant.userId,
        role: tenant.role,
        permissions: tenant.permissions,
        orgSlug: tenant.orgSlug,
      },
    };
  }

  /**
   * Provisions a new workspace (used by onboarding / seed / tests).
   */
  async provisionWorkspace(data: NewWorkspaceRecord): Promise<WorkspaceRecord> {
    return this.workspacesRepo.create(data);
  }
}
