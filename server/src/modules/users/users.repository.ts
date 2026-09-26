import { Injectable, Inject } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { DRIZZLE_DATABASE, DrizzleDb } from "../../database/database.provider";
import { users, UserRecord, NewUserRecord } from "../../database/schema/users.schema";

@Injectable()
export class UsersRepository {
  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: DrizzleDb) {}

  async findById(id: string): Promise<UserRecord | null> {
    const results = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return results[0] || null;
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const results = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return results[0] || null;
  }

  async create(data: NewUserRecord): Promise<UserRecord> {
    const results = await this.db.insert(users).values(data).returning();
    return results[0];
  }

  async upsert(data: NewUserRecord): Promise<UserRecord> {
    const results = await this.db
      .insert(users)
      .values(data)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          imageUrl: data.imageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();

    return results[0];
  }
}
