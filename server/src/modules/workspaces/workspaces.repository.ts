import { Injectable, Inject } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { DRIZZLE_DATABASE, DrizzleDb } from "../../database/database.provider";
import { workspaces, WorkspaceRecord, NewWorkspaceRecord } from "../../database/schema/workspaces.schema";

@Injectable()
export class WorkspacesRepository {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: DrizzleDb
  ) {}

  async findById(id: string): Promise<WorkspaceRecord | null> {
    const results = await this.db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, id))
      .limit(1);

    return results[0] || null;
  }

  async findBySlug(slug: string): Promise<WorkspaceRecord | null> {
    const results = await this.db
      .select()
      .from(workspaces)
      .where(eq(workspaces.slug, slug))
      .limit(1);

    return results[0] || null;
  }

  async create(data: NewWorkspaceRecord): Promise<WorkspaceRecord> {
    const results = await this.db
      .insert(workspaces)
      .values(data)
      .returning();

    return results[0];
  }

  async update(id: string, data: Partial<NewWorkspaceRecord>): Promise<WorkspaceRecord | null> {
    const results = await this.db
      .update(workspaces)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(workspaces.id, id))
      .returning();

    return results[0] || null;
  }
}
