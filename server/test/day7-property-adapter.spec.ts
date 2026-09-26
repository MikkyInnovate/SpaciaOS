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
import { eq, inArray } from "drizzle-orm";
import { PropertyAdapterService } from "../src/modules/properties/property-adapter.service";
import { PropertyAdapterRegistry } from "../src/modules/properties/adapters/property-adapter.registry";
import { SpaciaNativePropertyAdapter } from "../src/modules/properties/adapters/spacia-native-property.adapter";
import { MockPmsPropertyAdapter } from "../src/modules/properties/adapters/mock-pms-property.adapter";

config({ path: "./.env" });
neonConfig.webSocketConstructor = ws;

process.env.ALLOW_MOCK_AUTH = "true";
process.env.NODE_ENV = "test";

async function runDay7PropertyAdapterTests() {
  console.log("\n=========================================================");
  console.log(" PACIA DAY 7: PROPERTY ADAPTER LAYER CONTRACT & ISOLATION");
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
  const adapterService: PropertyAdapterService = app.get(PropertyAdapterService);
  const registry: PropertyAdapterRegistry = app.get(PropertyAdapterRegistry);
  const nativeAdapter: SpaciaNativePropertyAdapter = app.get(SpaciaNativePropertyAdapter);
  const mockAdapter: MockPmsPropertyAdapter = app.get(MockPmsPropertyAdapter);

  const timestamp = Date.now();
  const wsA = `ws_day7_alpha_${timestamp}`;
  const wsASlug = `alpha-estates-${timestamp}`;
  const wsB = `ws_day7_beta_${timestamp}`;
  const wsBSlug = `beta-realty-${timestamp}`;

  const userA = `user_day7_alpha_${timestamp}`;
  const userB = `user_day7_beta_${timestamp}`;

  const authHeaderA = {
    Authorization: `Bearer mock_token_${userA}:${wsA}:admin:${wsASlug}`,
    "X-Workspace-Id": wsA,
    "Content-Type": "application/json",
  };

  const authHeaderB = {
    Authorization: `Bearer mock_token_${userB}:${wsB}:admin:${wsBSlug}`,
    "X-Workspace-Id": wsB,
    "Content-Type": "application/json",
  };

  let propAId: string;
  let propBId: string;

  try {
    // 0. Setup test workspaces & users
    console.log("▶ [SETUP] Provisioning isolated test workspaces in Neon...");
    await db.insert(schema.workspaces).values([
      { id: wsA, name: "Alpha Luxury Estates", slug: wsASlug },
      { id: wsB, name: "Beta Realty Ventures", slug: wsBSlug },
    ]);

    await db.insert(schema.users).values([
      { id: userA, email: `alpha_${timestamp}@spacia.io`, firstName: "Alpha", lastName: "Admin" },
      { id: userB, email: `beta_${timestamp}@spacia.io`, firstName: "Beta", lastName: "Admin" },
    ]);

    await db.insert(schema.workspaceMembers).values([
      { workspaceId: wsA, userId: userA, role: "admin" },
      { workspaceId: wsB, userId: userB, role: "admin" },
    ]);

    // Seed Property A in Workspace A
    const [propA] = await db
      .insert(schema.properties)
      .values({
        workspaceId: wsA,
        slug: `waterfront-villa-${timestamp}`,
        title: "The Ikoyi Waterfront Villa",
        estateName: "Parkview Enclave",
        location: "5 Gerard Road, Ikoyi",
        city: "Ikoyi",
        state: "Lagos State",
        propertyType: "Villa",
        price: "450000000.00",
        formattedPrice: "₦ 450,000,000",
        bedrooms: 4,
        bathrooms: 5,
        squareMeters: 580,
        parkingSpaces: 4,
        developmentStage: "Ready for Occupancy",
        availability: "Available",
        verificationStatus: "Verified",
        titleDeedType: "Governor's Consent",
        registryNumber: "RC-IKV-2024-991",
        featuredImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
        images: ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c"],
        description: "Exquisite 4-bedroom detached waterfront villa in Ikoyi.",
        commercialTerms: {
          serviceCharge: "₦ 3,500,000/annum",
          minimumDeposit: "30%",
          paymentPlanOptions: ["30% initial deposit, balance over 12 months"],
          agencyFeeNotice: "Standard 5% facilitation fee applies",
        },
      })
      .returning();
    propAId = propA.id;

    await db.insert(schema.propertyFeatures).values([
      { workspaceId: wsA, propertyId: propAId, feature: "24/7 Power", category: "amenity" },
      { workspaceId: wsA, propertyId: propAId, feature: "Private Jetty", category: "luxury" },
    ]);

    // Seed Property B in Workspace B
    const [propB] = await db
      .insert(schema.properties)
      .values({
        workspaceId: wsB,
        slug: `lekki-penthouse-${timestamp}`,
        title: "Lekki Admiralty Penthouse",
        estateName: "Admiralty Heights",
        location: "1 Admiralty Way, Lekki Phase 1",
        city: "Lekki",
        state: "Lagos State",
        propertyType: "Penthouse",
        price: "220000000.00",
        formattedPrice: "₦ 220,000,000",
        bedrooms: 3,
        bathrooms: 3,
        squareMeters: 320,
        availability: "Under Offer",
        verificationStatus: "Pending Verification",
        featuredImage: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750",
        images: ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750"],
      })
      .returning();
    propBId = propB.id;

    console.log(`✓ Test data seeded: PropA (${propAId}) in ${wsA}, PropB (${propBId}) in ${wsB}\n`);

    // =========================================================================
    // TEST 1: IPropertyAdapter Contract Conformance
    // =========================================================================
    console.log("▶ [TEST 1] Verifying IPropertyAdapter interface conformance...");
    const requiredMethods = [
      "searchProperties",
      "getProperty",
      "checkAvailability",
      "getPrice",
      "checkHealth",
    ];

    for (const method of requiredMethods) {
      assert.strictEqual(
        typeof (nativeAdapter as any)[method],
        "function",
        `Native adapter must implement ${method}`
      );
      assert.strictEqual(
        typeof (mockAdapter as any)[method],
        "function",
        `Mock adapter must implement ${method}`
      );
    }
    assert.strictEqual(nativeAdapter.providerId, "spacia_native");
    assert.strictEqual(mockAdapter.providerId, "mock_pms");
    console.log("✓ TEST 1 PASSED: Both adapters fully conform to the IPropertyAdapter contract.\n");

    // =========================================================================
    // TEST 2: Multi-Tenant Workspace Isolation on Search
    // =========================================================================
    console.log("▶ [TEST 2] Verifying multi-tenant isolation on search...");
    const searchA = await adapterService.searchProperties(wsA, {});
    assert.strictEqual(searchA.total, 1, "Workspace A must see exactly 1 property");
    assert.strictEqual(searchA.items[0].id, propAId);
    assert.strictEqual(searchA.items[0].title, "The Ikoyi Waterfront Villa");
    assert.deepStrictEqual(searchA.items[0].features.sort(), ["24/7 Power", "Private Jetty"].sort());

    const searchB = await adapterService.searchProperties(wsB, {});
    assert.strictEqual(searchB.total, 1, "Workspace B must see exactly 1 property");
    assert.strictEqual(searchB.items[0].id, propBId);
    assert.strictEqual(searchB.items[0].title, "Lekki Admiralty Penthouse");

    // Workspace B property MUST NOT appear in Workspace A results
    const leakedToA = searchA.items.find((p) => p.id === propBId);
    assert.strictEqual(leakedToA, undefined, "Workspace B property must NEVER leak into Workspace A search");
    console.log("✓ TEST 2 PASSED: Search strictly isolates inventory by workspace boundary.\n");

    // =========================================================================
    // TEST 3: Cross-Workspace Access Non-Disclosure
    // =========================================================================
    console.log("▶ [TEST 3] Verifying cross-workspace lookup non-disclosure...");
    // Workspace A querying its own property -> normalized property returned
    const ownProp = await adapterService.getProperty(wsA, propAId);
    assert.ok(ownProp, "Workspace A should access its own property");
    assert.strictEqual(ownProp?.title, "The Ikoyi Waterfront Villa");
    assert.strictEqual(ownProp?.currency, "NGN");
    assert.strictEqual(ownProp?.price, 450000000);
    assert.strictEqual(ownProp?.source, "spacia_native");

    // Workspace B attempting to query Workspace A's property -> MUST return null (no existence leak)
    const crossTenantProp = await adapterService.getProperty(wsB, propAId);
    assert.strictEqual(
      crossTenantProp,
      null,
      "Cross-workspace lookup MUST return null without leaking existence"
    );
    console.log("✓ TEST 3 PASSED: Cross-workspace lookup returns null with zero data leakage.\n");

    // =========================================================================
    // TEST 4: Normalized Availability Contract
    // =========================================================================
    console.log("▶ [TEST 4] Verifying normalized availability contract...");
    const availA = await adapterService.checkAvailability(wsA, { propertyId: propAId });
    assert.strictEqual(availA.propertyId, propAId);
    assert.strictEqual(availA.status, "Available");
    assert.strictEqual(availA.isAvailable, true);
    assert.strictEqual(availA.provider, "spacia_native");
    assert.ok(availA.checkedAt, "Must include checkedAt timestamp");

    const availB = await adapterService.checkAvailability(wsB, { propertyId: propBId });
    assert.strictEqual(availB.propertyId, propBId);
    assert.strictEqual(availB.status, "Under Offer");
    assert.strictEqual(availB.isAvailable, false);

    // Cross-tenant availability check
    const availCross = await adapterService.checkAvailability(wsB, { propertyId: propAId });
    assert.strictEqual(availCross.status, "Unknown");
    assert.strictEqual(availCross.isAvailable, false);
    console.log("✓ TEST 4 PASSED: Availability adheres to contract without fabricated status.\n");

    // =========================================================================
    // TEST 5: Normalized Pricing Contract
    // =========================================================================
    console.log("▶ [TEST 5] Verifying normalized pricing contract...");
    const priceA = await adapterService.getPrice(wsA, { propertyId: propAId });
    assert.strictEqual(priceA.propertyId, propAId);
    assert.strictEqual(priceA.basePrice, 450000000);
    assert.strictEqual(priceA.formattedBasePrice, "₦ 450,000,000");
    assert.strictEqual(priceA.currency, "NGN");
    assert.strictEqual(priceA.provider, "spacia_native");
    // Verify real fee breakdown from commercialTerms: 3500000 service charge
    assert.strictEqual(priceA.breakdown.basePrice, 450000000);
    assert.strictEqual(priceA.breakdown.serviceCharge, 3500000);
    assert.strictEqual(priceA.estimatedTotal, 453500000);
    assert.ok(priceA.paymentOptions && priceA.paymentOptions.length > 0);
    console.log("✓ TEST 5 PASSED: Pricing breakdown accurately maps real stored terms.\n");

    // =========================================================================
    // TEST 6: Real Integration Health Abstraction
    // =========================================================================
    console.log("▶ [TEST 6] Verifying integration health abstraction...");
    const health = await adapterService.checkHealth(wsA);
    assert.strictEqual(health.providerId, "spacia_native");
    assert.strictEqual(health.status, "healthy");
    assert.strictEqual(typeof health.latencyMs, "number");
    assert.ok(health.latencyMs >= 0, "Latency must be a non-negative number");
    assert.strictEqual(health.capabilities.canSearch, true);
    assert.strictEqual(health.capabilities.canCheckAvailability, true);
    assert.strictEqual(health.capabilities.canGetRealtimePricing, true);

    const mockHealth = await adapterService.checkHealth(wsA, "mock_pms");
    assert.strictEqual(mockHealth.providerId, "mock_pms");
    assert.strictEqual(mockHealth.isMock, true, "Mock adapter must clearly identify as mock");
    console.log("✓ TEST 6 PASSED: Integration health verifies actual operational state.\n");

    // =========================================================================
    // TEST 7: Provider-Agnostic Adapter Registry & Resolution
    // =========================================================================
    console.log("▶ [TEST 7] Verifying adapter registry resolution...");
    const defaultAdapter = await registry.resolveAdapter(wsA);
    assert.strictEqual(defaultAdapter.providerId, "spacia_native");

    const resolvedMock = await registry.resolveAdapter(wsA, "mock_pms");
    assert.strictEqual(resolvedMock.providerId, "mock_pms");

    // Mock search isolated to mock test workspace
    const mockSearch = await adapterService.searchProperties("ws_mock_pms_test", {}, "mock_pms");
    assert.ok(mockSearch.total >= 2, "Mock store should return seeded fixtures");
    assert.strictEqual(mockSearch.provider, "mock_pms");
    assert.strictEqual(mockSearch.items[0].source, "mock_pms");
    console.log("✓ TEST 7 PASSED: Registry accurately resolves providers dynamically.\n");

    // =========================================================================
    // TEST 8: REST API End-to-End with Tenant Authorization
    // =========================================================================
    console.log("▶ [TEST 8] Verifying REST API endpoints via HTTP...");

    // 8.1 GET /api/v1/properties
    const resList = await fetch(`${baseUrl}/properties`, { headers: authHeaderA });
    assert.strictEqual(resList.status, 200);
    const listBody = await resList.json();
    assert.strictEqual(listBody.data.total, 1);
    assert.strictEqual(listBody.data.items[0].id, propAId);

    // 8.2 GET /api/v1/properties/health
    const resHealth = await fetch(`${baseUrl}/properties/health`, { headers: authHeaderA });
    assert.strictEqual(resHealth.status, 200);
    const healthBody = await resHealth.json();
    assert.strictEqual(healthBody.data.status, "healthy");

    // 8.3 GET /api/v1/properties/:id (Authorized tenant)
    const resDetail = await fetch(`${baseUrl}/properties/${propAId}`, { headers: authHeaderA });
    assert.strictEqual(resDetail.status, 200);
    const detailBody = await resDetail.json();
    assert.strictEqual(detailBody.data.id, propAId);
    assert.strictEqual(detailBody.data.title, "The Ikoyi Waterfront Villa");

    // 8.4 GET /api/v1/properties/:id (Cross-tenant -> 404 NOT FOUND)
    const resCross = await fetch(`${baseUrl}/properties/${propAId}`, { headers: authHeaderB });
    assert.strictEqual(
      resCross.status,
      404,
      "Cross-tenant HTTP request must return 404 Not Found"
    );

    // 8.5 GET /api/v1/properties/:id/availability
    const resAvail = await fetch(`${baseUrl}/properties/${propAId}/availability`, {
      headers: authHeaderA,
    });
    assert.strictEqual(resAvail.status, 200);
    const availHttpBody = await resAvail.json();
    assert.strictEqual(availHttpBody.data.isAvailable, true);

    // 8.6 GET /api/v1/properties/:id/price
    const resPrice = await fetch(`${baseUrl}/properties/${propAId}/price`, {
      headers: authHeaderA,
    });
    assert.strictEqual(resPrice.status, 200);
    const priceHttpBody = await resPrice.json();
    assert.strictEqual(priceHttpBody.data.basePrice, 450000000);
    assert.strictEqual(priceHttpBody.data.breakdown.serviceCharge, 3500000);

    console.log("✓ TEST 8 PASSED: REST API enforces TenantContext and handles requests end-to-end.\n");

    console.log("=========================================================");
    console.log(" ALL 8 PACIA DAY 7 INTEGRATION ADAPTER TESTS PASSED 100%");
    console.log("=========================================================\n");
  } finally {
    console.log("▶ [TEARDOWN] Cleaning up seeded test records...");
    try {
      if (propAId!) {
        await db.delete(schema.propertyFeatures).where(eq(schema.propertyFeatures.propertyId, propAId));
        await db.delete(schema.properties).where(eq(schema.properties.id, propAId));
      }
      if (propBId!) {
        await db.delete(schema.properties).where(eq(schema.properties.id, propBId));
      }
      await db.delete(schema.workspaceMembers).where(inArray(schema.workspaceMembers.workspaceId, [wsA, wsB]));
      await db.delete(schema.users).where(inArray(schema.users.id, [userA, userB]));
      await db.delete(schema.workspaces).where(inArray(schema.workspaces.id, [wsA, wsB]));
      console.log("✓ Teardown complete.\n");
    } catch (cleanupErr: any) {
      console.warn("Teardown warning:", cleanupErr.message);
    }
    await app.close();
    await pool.end();
  }
}

runDay7PropertyAdapterTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n❌ DAY 7 TEST FAILED:", err);
    process.exit(1);
  });
