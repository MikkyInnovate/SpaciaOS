import { Global, Module } from "@nestjs/common";
import { databaseProviders, DRIZZLE_DATABASE, NEON_POOL } from "./database.provider";

@Global()
@Module({
  providers: [...databaseProviders],
  exports: [DRIZZLE_DATABASE, NEON_POOL],
})
export class DatabaseModule {}
