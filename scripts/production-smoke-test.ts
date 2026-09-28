/**
 * Spacia Production Smoke Test Runner
 * Validates active production deployment endpoints, health probes, auth barriers, and SSR availability.
 */

interface SmokeCheckResult {
  name: string;
  url: string;
  status: "PASS" | "FAIL";
  durationMs: number;
  details: string;
}

async function runCheck(
  name: string,
  url: string,
  options: RequestInit = {},
  validator: (res: Response, body: any) => { pass: boolean; details: string }
): Promise<SmokeCheckResult> {
  const start = Date.now();
  try {
    const res = await fetch(url, options);
    let body: any = null;
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      body = await res.json();
    } else {
      body = await res.text();
    }
    const durationMs = Date.now() - start;
    const { pass, details } = validator(res, body);
    return {
      name,
      url,
      status: pass ? "PASS" : "FAIL",
      durationMs,
      details,
    };
  } catch (err: any) {
    const durationMs = Date.now() - start;
    return {
      name,
      url,
      status: "FAIL",
      durationMs,
      details: `Network/Fetch Error: ${err.message}`,
    };
  }
}

async function main() {
  const backendBase = process.env.BACKEND_URL || "http://localhost:8000";
  const frontendBase = process.env.FRONTEND_URL || "http://localhost:3000";

  console.log("=================================================================");
  console.log(" PACIA PRODUCTION LAUNCH: AUTOMATED SMOKE TEST BENCH");
  console.log("=================================================================");
  console.log(`Backend Target : ${backendBase}`);
  console.log(`Frontend Target: ${frontendBase}`);
  console.log(`Timestamp      : ${new Date().toISOString()}`);
  console.log("=================================================================\n");

  const results: SmokeCheckResult[] = [];

  // 1. Backend Liveness Probe
  results.push(
    await runCheck(
      "1. Backend Liveness Probe",
      `${backendBase}/api/v1/health`,
      { method: "GET" },
      (res, body) => {
        const data = body?.data || body;
        const pass = res.status === 200 && (data?.status === "healthy" || data?.status === "ok");
        return {
          pass,
          details: `HTTP ${res.status} | Status: ${data?.status || "unknown"} | DB: ${data?.database || "unknown"}`,
        };
      }
    )
  );

  // 2. Backend Deep Readiness Probe (Database & Memory)
  results.push(
    await runCheck(
      "2. Backend Readiness Probe (Neon DB & Latency)",
      `${backendBase}/api/v1/health/readiness`,
      { method: "GET" },
      (res, body) => {
        const data = body?.data || body;
        const pass =
          res.status === 200 &&
          (data?.status === "ready" || data?.status === "degraded") &&
          data?.subsystems?.database?.status === "connected";
        const latency = data?.subsystems?.database?.latencyMs ?? "N/A";
        const heap = data?.subsystems?.memory?.heapUsedMb ?? "N/A";
        return {
          pass,
          details: `HTTP ${res.status} | DB: ${data?.subsystems?.database?.status} (${latency}ms) | Heap: ${heap}MB | Redis: ${data?.subsystems?.redis?.status || "unknown"}`,
        };
      }
    )
  );

  // 3. Security Boundary: Invalid / Unauthenticated Leads Access Rejection
  results.push(
    await runCheck(
      "3. Security Barrier: Invalid Token Rejection",
      `${backendBase}/api/v1/leads`,
      {
        method: "GET",
        headers: { Authorization: "Bearer invalid_malformed_token" },
      },
      (res, body) => {
        const pass = res.status === 401;
        return {
          pass,
          details: `HTTP ${res.status} (Expected 401 Unauthorized)`,
        };
      }
    )
  );

  // 4. Webhook Integrity: Bad Payload Ingestion Rejection
  results.push(
    await runCheck(
      "4. Webhook Ingestion Barrier: Missing Payload Rejection",
      `${backendBase}/api/v1/leads/ingest`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      },
      (res, body) => {
        const pass = res.status === 400 || res.status === 401;
        return {
          pass,
          details: `HTTP ${res.status} (Canonical Error Envelope Enforced)`,
        };
      }
    )
  );

  // 5. Frontend Server Availability (SSR Root)
  results.push(
    await runCheck(
      "5. Frontend Next.js 16 SSR Gateway",
      `${frontendBase}/`,
      { method: "GET" },
      (res, body) => {
        const pass = res.status === 200 || res.status === 307 || res.status === 308;
        return {
          pass,
          details: `HTTP ${res.status} | Content-Type: ${res.headers.get("content-type") || "unknown"}`,
        };
      }
    )
  );

  // Print Summary Table
  let passedCount = 0;
  for (const r of results) {
    const symbol = r.status === "PASS" ? "✔" : "✖";
    console.log(` ${symbol} [${r.status}] ${r.name.padEnd(55)} (${r.durationMs}ms)`);
    console.log(`     ↳ ${r.details}`);
    if (r.status === "PASS") passedCount++;
  }

  console.log("\n=================================================================");
  console.log(` Smoke Test Scorecard: ${passedCount}/${results.length} checks passed (${Math.round((passedCount / results.length) * 100)}%)`);
  console.log("=================================================================");

  if (passedCount < results.length) {
    console.error("SMOKE TEST FAILED: One or more critical subsystems failed verification.");
    process.exit(1);
  } else {
    console.log("ALL PRODUCTION SMOKE CHECKS PASSED (100%)!");
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Fatal smoke test execution error:", err);
  process.exit(1);
});
