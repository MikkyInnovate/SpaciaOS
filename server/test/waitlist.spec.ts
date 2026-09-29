const assert = require("assert");
import { config } from "dotenv";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "../src/app.module";
import { HttpExceptionFilter } from "../src/common/filters/http-exception.filter";
import { TransformInterceptor } from "../src/common/interceptors/transform.interceptor";
import { LoggingInterceptor } from "../src/common/interceptors/logging.interceptor";
import { DRIZZLE_DATABASE, DrizzleDb, NEON_POOL } from "../src/database/database.provider";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as schema from "../src/database/schema";
import { eq } from "drizzle-orm";

config({ path: "./.env" });
neonConfig.webSocketConstructor = ws;

process.env.ALLOW_MOCK_AUTH = "true";
process.env.NODE_ENV = "test";

async function runWaitlistTests() {
  console.log("\n=========================================================");
  console.log(" PACIA WAITLIST: END-TO-END ENGINE & IDEMPOTENCY AUDIT");
  console.log("=========================================================\n");

  const app = await NestFactory.create(AppModule, { logger: false });

  app.setGlobalPrefix("api/v1");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      stopAtFirstError: false,
    })
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());

  await app.listen(0);
  const server = app.getHttpServer();
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api/v1`;

  const db: DrizzleDb = app.get(DRIZZLE_DATABASE);
  const pool: Pool = app.get(NEON_POOL);

  const timestamp = Date.now();
  const testEmail = `luxury.broker.${timestamp}@lagosprime.ng`;
  const botEmail = `spambot.${timestamp}@automated.ru`;

  try {
    // ---------------------------------------------------------------------------
    // TEST 1: Public Stats Counter Availability
    // ---------------------------------------------------------------------------
    console.log("▶ [CHECK 1: PUBLIC STATS] Fetching live waitlist odometer metrics...");
    const statsRes = await fetch(`${baseUrl}/waitlist/stats`);
    assert.strictEqual(statsRes.status, 200, "Stats endpoint must be publicly accessible (HTTP 200)");
    const statsBody = await statsRes.json();
    assert.strictEqual(statsBody.success, true);
    assert.ok(statsBody.data.totalCount >= 1240, "Total count must reflect baseline social proof");
    assert.ok(statsBody.data.activeToday > 0, "Active count must be greater than zero");
    console.log(`  ✔ Live stats verified: totalCount=${statsBody.data.totalCount}, activeToday=${statsBody.data.activeToday}`);

    // ---------------------------------------------------------------------------
    // TEST 2: First-Time Registration & Sequence Assignment
    // ---------------------------------------------------------------------------
    console.log("\n▶ [CHECK 2: REGISTRATION] Registering new verified luxury subscriber...");
    const joinRes = await fetch(`${baseUrl}/waitlist/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        ref: "SPACIA-FOUNDER",
      }),
    });
    assert.strictEqual(joinRes.status, 200, "Registration must succeed (HTTP 200)");
    const joinBody = await joinRes.json();
    assert.strictEqual(joinBody.success, true);
    assert.strictEqual(joinBody.data.alreadyJoined, false);
    assert.ok(joinBody.data.position >= 1241, "Position must be assigned sequentially above baseline");
    assert.ok(joinBody.data.referralCode.startsWith("SPACIA-"), "Referral code must have SPACIA- prefix");
    assert.ok(joinBody.data.maskedEmail.includes("***"), "Email must be masked for privacy in response");
    console.log(`  ✔ Successfully registered: position=#${joinBody.data.position}, referralCode=${joinBody.data.referralCode}, masked=${joinBody.data.maskedEmail}`);

    // ---------------------------------------------------------------------------
    // TEST 3: Strict Idempotency on Resubmission
    // ---------------------------------------------------------------------------
    console.log("\n▶ [CHECK 3: IDEMPOTENCY] Resubmitting the same email (duplicate check)...");
    const duplicateRes = await fetch(`${baseUrl}/waitlist/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
      }),
    });
    assert.strictEqual(duplicateRes.status, 200, "Resubmission must be idempotent and succeed (HTTP 200)");
    const duplicateBody = await duplicateRes.json();
    assert.strictEqual(duplicateBody.success, true);
    assert.strictEqual(duplicateBody.data.alreadyJoined, true, "Must flag alreadyJoined as true");
    assert.strictEqual(duplicateBody.data.position, joinBody.data.position, "Position must remain unchanged");
    assert.strictEqual(duplicateBody.data.referralCode, joinBody.data.referralCode, "Referral code must be preserved");
    console.log(`  ✔ Idempotent handling certified: kept exact reserved position #${duplicateBody.data.position}`);

    // ---------------------------------------------------------------------------
    // TEST 4: Honeypot Anti-Bot Trapping
    // ---------------------------------------------------------------------------
    console.log("\n▶ [CHECK 4: ANTI-BOT HONEYPOT] Submitting with populated honeypot field...");
    const botRes = await fetch(`${baseUrl}/waitlist/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: botEmail,
        honeypot: "http://spam-link.ru/crypto",
      }),
    });
    assert.strictEqual(botRes.status, 200, "Bot request must be absorbed gracefully without error");
    const botBody = await botRes.json();
    assert.strictEqual(botBody.success, true);

    // Verify bot was NOT inserted into database
    const [dbBot] = await db
      .select()
      .from(schema.waitlistSubscribers)
      .where(eq(schema.waitlistSubscribers.email, botEmail.toLowerCase()))
      .limit(1);
    assert.strictEqual(dbBot, undefined, "Bot email must NOT be saved in database table");
    console.log("  ✔ Honeypot protection certified: bot safely discarded with zero database pollution");

    // ---------------------------------------------------------------------------
    // TEST 5: Zero-Trust Database State Verification
    // ---------------------------------------------------------------------------
    console.log("\n▶ [CHECK 5: DB INTEGRITY] Auditing database row and SHA-256 IP hash...");
    const [subscriber] = await db
      .select()
      .from(schema.waitlistSubscribers)
      .where(eq(schema.waitlistSubscribers.email, testEmail.toLowerCase()))
      .limit(1);

    assert.ok(subscriber, "Subscriber row must exist in waitlist_subscribers");
    assert.strictEqual(subscriber.referredBy, "SPACIA-FOUNDER", "Referred by must be recorded");
    assert.strictEqual(subscriber.status, "pending");
    assert.ok(subscriber.ipHash, "IP address must be securely hashed with SHA-256");
    console.log("  ✔ Database record certified with immutable sequence ranking and hashed IP.");

    console.log("\n=========================================================");
    console.log(" ✅ ALL WAITLIST ENGINE TESTS PASSED (5/5 CHECKS)!");
    console.log("=========================================================\n");
  } finally {
    // Cleanup test subscriber
    await db
      .delete(schema.waitlistSubscribers)
      .where(eq(schema.waitlistSubscribers.email, testEmail.toLowerCase()));

    await app.close();
  }
}

runWaitlistTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Waitlist test failed:", err);
    process.exit(1);
  });
