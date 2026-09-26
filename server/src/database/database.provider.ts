import { Provider, Logger } from "@nestjs/common";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle, type NeonDatabase } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./schema";
import { EnvService } from "../config/env.service";

// Required for @neondatabase/serverless in Node.js environments
neonConfig.webSocketConstructor = ws;

export const DRIZZLE_DATABASE = "DRIZZLE_DATABASE";
export const NEON_POOL = "NEON_POOL";

export type DrizzleDb = NeonDatabase<typeof schema>;

const logger = new Logger("DatabaseProvider");

export const databaseProviders: Provider[] = [
  {
    provide: NEON_POOL,
    inject: [EnvService],
    useFactory: (envService: EnvService) => {
      const connectionString = envService.databaseUrl;
      const pool = new Pool({ connectionString });
      return pool;
    },
  },
  {
    provide: DRIZZLE_DATABASE,
    inject: [NEON_POOL],
    useFactory: (pool: Pool): DrizzleDb => {
      return drizzle(pool, { schema });
    },
  },
];
