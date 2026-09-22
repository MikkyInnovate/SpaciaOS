import { eq, and, desc, SQL } from "drizzle-orm";
import { PgTableWithColumns } from "drizzle-orm/pg-core";
import { DrizzleDb } from "../../database/database.provider";
import { TenantContext } from "./tenant-context.interface";

/**
 * ARCHITECTURAL CONVENTION & SECURITY NOTICE:
 * 
 * BaseTenantRepository is the standard mandatory convention for all tenant-owned domain data in Pacia.
 * 
 * IMPORTANT ARCHITECTURAL NOTE:
 * This abstraction provides automated enforcement of tenant scoping within application query paths.
 * However, this abstraction alone does not mathematically or physically guarantee isolation against
 * arbitrary raw SQL or bypasses. All direct Drizzle queries, migrations, or batch jobs operating on
 * tenant-owned resources MUST NEVER bypass workspace scoping (`where: eq(table.workspaceId, workspaceId)`).
 * 
 * Operational data (e.g. system_events, leads, properties) MUST inherit or utilize this pattern.
 * Audit logs and compliance records must observe appropriate retention policies rather than blind cascading.
 */
export abstract class BaseTenantRepository<
  TTable extends PgTableWithColumns<any> & {
    id: any;
    workspaceId: any;
    createdAt?: any;
  },
  TSelect = TTable["$inferSelect"],
  TInsert = TTable["$inferInsert"],
> {
  constructor(
    protected readonly db: DrizzleDb,
    protected readonly table: TTable
  ) {}

  /**
   * Returns a tenant-scoped operational proxy that strictly binds all operations to the verified tenant.
   */
  forTenant(ctx: TenantContext) {
    return this.scoped(ctx.workspaceId);
  }

  /**
   * Scoped query interface bound to a specific workspace ID.
   */
  scoped(workspaceId: string) {
    if (!workspaceId) {
      throw new Error("Cannot execute tenant-scoped query without an explicit workspaceId.");
    }

    const table = this.table;
    const db = this.db;

    return {
      /**
       * Queries records strictly scoped to this workspace.
       */
      findMany: async (options?: {
        where?: SQL;
        limit?: number;
        offset?: number;
      }): Promise<TSelect[]> => {
        const tenantCondition = eq(table.workspaceId, workspaceId);
        const finalCondition = options?.where
          ? and(tenantCondition, options.where)
          : tenantCondition;

        let query: any = db.select().from(table as any).where(finalCondition);

        if ("createdAt" in table && table.createdAt) {
          query = query.orderBy(desc(table.createdAt));
        }

        if (options?.limit) {
          query = query.limit(options.limit);
        }
        if (options?.offset) {
          query = query.offset(options.offset);
        }

        return (await query) as TSelect[];
      },

      /**
       * Finds a single record by ID, strictly enforcing workspace ownership.
       */
      findById: async (id: string): Promise<TSelect | null> => {
        const results = await db
          .select()
          .from(table as any)
          .where(and(eq(table.workspaceId, workspaceId), eq(table.id, id)))
          .limit(1);

        return (results[0] as TSelect) || null;
      },

      /**
       * Inserts a record, automatically binding it to this workspace ID.
       */
      create: async (
        data: Omit<TInsert, "workspaceId" | "id" | "createdAt"> & { id?: string }
      ): Promise<TSelect> => {
        const insertPayload = {
          ...data,
          workspaceId,
        };

        const results = (await db
          .insert(table as any)
          .values(insertPayload as any)
          .returning()) as any[];

        return results[0] as TSelect;
      },

      /**
       * Updates a record by ID, ensuring the record belongs to this workspace.
       */
      updateById: async (
        id: string,
        data: Partial<Omit<TInsert, "workspaceId" | "id" | "createdAt">>
      ): Promise<TSelect | null> => {
        const results = (await db
          .update(table as any)
          .set(data as any)
          .where(and(eq(table.workspaceId, workspaceId), eq(table.id, id)))
          .returning()) as any[];

        return (results[0] as TSelect) || null;
      },

      /**
       * Deletes a record by ID, ensuring the record belongs to this workspace.
       */
      deleteById: async (id: string): Promise<boolean> => {
        const results = (await db
          .delete(table as any)
          .where(and(eq(table.workspaceId, workspaceId), eq(table.id, id)))
          .returning()) as any[];

        return results.length > 0;
      },
    };
  }
}
