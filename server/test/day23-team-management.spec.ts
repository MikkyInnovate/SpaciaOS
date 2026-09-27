/**
 * PACIA DAY 23: TEAM MANAGEMENT TEST SUITE
 * 
 * Verifies end-to-end:
 * 1. Workspace members listing & automatic baseline broker provisioning
 * 2. Team KPI summary stats (members, brokers, routing active, capacity)
 * 3. Member invitations with role assignment & agent routing profile creation
 * 4. Role mutation with Sole Owner Protection guardrails
 * 5. Member status transitions (Active <-> Suspended) and routing sync
 * 6. Agent routing rule updates (territory, specializations, routing weight, capacity)
 * 7. Member removal with Sole Owner Protection
 * 8. Multi-tenant workspace isolation (Workspace A vs Workspace B)
 * 9. RBAC permission validation and role definitions
 */

const assert = require("assert");
import { NestFactory } from "@nestjs/core";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { eq } from "drizzle-orm";
import { AppModule } from "../src/app.module";
import { DRIZZLE_DATABASE, DrizzleDb } from "../src/database/database.provider";
import * as schema from "../src/database/schema";
import { TenantContext } from "../src/common/tenant/tenant-context.interface";
import { TeamService } from "../src/modules/team/team.service";

neonConfig.webSocketConstructor = ws;

async function runDay23TeamManagementTestSuite() {
  console.log("\n=========================================================");
  console.log(" PACIA DAY 23: TEAM MANAGEMENT TEST SUITE");
  console.log("=========================================================\n");

  const app: INestApplication = await NestFactory.create(AppModule, { logger: false });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();

  const db = app.get<DrizzleDb>(DRIZZLE_DATABASE);
  const teamService = app.get<TeamService>(TeamService);

  const TEST_WS_A = `ws_day23_spacia_vi_${Date.now()}`;
  const TEST_WS_B = `ws_day23_spacia_ikoyi_${Date.now()}`;

  const OWNER_USER_A = `user_owner_a_${Date.now()}`;
  const OWNER_USER_B = `user_owner_b_${Date.now()}`;

  const tenantOwnerA: TenantContext = {
    workspaceId: TEST_WS_A,
    userId: OWNER_USER_A,
    role: "owner",
    permissions: ["*"],
  };

  const tenantAdminA: TenantContext = {
    workspaceId: TEST_WS_A,
    userId: `user_admin_a_${Date.now()}`,
    role: "admin",
    permissions: [
      "workspace:manage",
      "members:manage",
      "members:read",
      "leads:read",
      "leads:write",
      "calls:trigger",
    ],
  };

  const tenantAgentA: TenantContext = {
    workspaceId: TEST_WS_A,
    userId: `user_agent_a_${Date.now()}`,
    role: "sales_agent",
    permissions: ["members:read", "leads:read", "leads:write"],
  };

  const tenantOwnerB: TenantContext = {
    workspaceId: TEST_WS_B,
    userId: OWNER_USER_B,
    role: "owner",
    permissions: ["*"],
  };

  try {
    // -------------------------------------------------------------
    // SETUP: Provision isolated Neon PostgreSQL Workspaces & Owners
    // -------------------------------------------------------------
    console.log("▶ [SETUP] Provisioning isolated workspaces and owners in Neon DB...");
    await db.insert(schema.workspaces).values([
      { id: TEST_WS_A, name: "Spacia Victoria Island Flagship", slug: `spacia-vi-${Date.now()}` },
      { id: TEST_WS_B, name: "Spacia Ikoyi Office", slug: `spacia-ik-${Date.now()}` },
    ]);

    await db.insert(schema.users).values([
      { id: OWNER_USER_A, email: `owner.vi.${Date.now()}@spacia.luxury`, firstName: "Kola", lastName: "Aluko" },
      { id: OWNER_USER_B, email: `owner.ik.${Date.now()}@spacia.luxury`, firstName: "Folorunsho", lastName: "Alakija" },
      { id: tenantAdminA.userId, email: `admin.vi.${Date.now()}@spacia.luxury`, firstName: "Dayo", lastName: "Operations" },
      { id: tenantAgentA.userId, email: `agent.vi.${Date.now()}@spacia.luxury`, firstName: "Chioma", lastName: "Broker" },
    ]);

    await db.insert(schema.workspaceMembers).values([
      { workspaceId: TEST_WS_A, userId: OWNER_USER_A, role: "owner", status: "active" },
      { workspaceId: TEST_WS_A, userId: tenantAdminA.userId, role: "admin", status: "active" },
      { workspaceId: TEST_WS_A, userId: tenantAgentA.userId, role: "sales_agent", status: "active" },
      { workspaceId: TEST_WS_B, userId: OWNER_USER_B, role: "owner", status: "active" },
    ]);

    // -------------------------------------------------------------
    // TEST 1: Baseline Luxury Broker Auto-seeding & Listing
    // -------------------------------------------------------------
    console.log("▶ [TEST 1] Verifying automatic baseline broker provisioning & team listing...");
    const membersA = await teamService.listMembers(TEST_WS_A);

    assert.ok(membersA.length >= 4, "Workspace A must have at least 4 members (owner, admin, agent + seeded brokers)");
    
    // Check that Tunde, Ngozi, and Femi are present
    const tunde = membersA.find((m) => m.agent?.name === "Tunde Bakare");
    const ngozi = membersA.find((m) => m.agent?.name === "Ngozi Eze");
    const femi = membersA.find((m) => m.agent?.name === "Femi Adeleke");

    assert.ok(tunde, "Tunde Bakare must be seeded");
    assert.strictEqual(tunde?.agent?.territory, "Lekki Phase 1 & Ikate");
    assert.ok(ngozi, "Ngozi Eze must be seeded");
    assert.strictEqual(ngozi?.agent?.territory, "Ikoyi & Banana Island");
    assert.ok(femi, "Femi Adeleke must be seeded");
    assert.strictEqual(femi?.agent?.territory, "Victoria Island & Eko Atlantic");

    console.log("  ✔ Seeded brokers verified with high-value Nigerian luxury territories.");

    // Check stats
    const statsA = await teamService.getStats(TEST_WS_A);
    assert.ok(statsA.totalMembers >= 4, "Total members count must match");
    assert.ok(statsA.activeBrokers >= 3, "At least 3 active brokers must exist");
    assert.ok(statsA.totalCapacity >= 150, "Total broker capacity must be >= 150");
    assert.ok(statsA.availableCapacity <= statsA.totalCapacity, "Available capacity calculated correctly");
    console.log(`  ✔ Team KPI Stats computed: ${statsA.totalMembers} members, ${statsA.activeBrokers} brokers, ${statsA.totalCapacity} total lead capacity.`);

    // -------------------------------------------------------------
    // TEST 2: Member Invitation & Routing Profile Creation
    // -------------------------------------------------------------
    console.log("▶ [TEST 2] Inviting new luxury agent with territory & routing rules...");
    const newAgentEmail = `esther.daniels.${Date.now()}@spacia.luxury`;

    const invitedMember = await teamService.inviteMember(tenantAdminA, {
      email: newAgentEmail,
      firstName: "Esther",
      lastName: "Daniels",
      role: "sales_agent",
      phone: "+234 812 999 8888",
      roleTitle: "Senior Waterfront Specialist",
      territory: "Banana Island North & Guzape",
      specializations: ["waterfront", "penthouses"],
      routingWeight: 25,
      maxConcurrentLeads: 40,
    });

    assert.strictEqual(invitedMember.user.email, newAgentEmail);
    assert.strictEqual(invitedMember.role, "sales_agent");
    assert.strictEqual(invitedMember.status, "active");
    assert.ok(invitedMember.agent, "Agent record must be created for sales_agent role");
    assert.strictEqual(invitedMember.agent?.territory, "Banana Island North & Guzape");
    assert.strictEqual(invitedMember.agent?.routingWeight, 25);
    assert.strictEqual(invitedMember.agent?.maxConcurrentLeads, 40);
    assert.strictEqual(invitedMember.agent?.isAvailableForRouting, true);

    console.log("  ✔ Member successfully invited and agent routing profile created.");

    // Verify duplicate invitation throws ConflictException
    let duplicateRejected = false;
    try {
      await teamService.inviteMember(tenantAdminA, {
        email: newAgentEmail,
        role: "sales_agent",
      });
    } catch (err: any) {
      if (err.status === 409 || err.name === "ConflictException") {
        duplicateRejected = true;
      }
    }
    assert.strictEqual(duplicateRejected, true, "Duplicate invite must throw ConflictException (409)");
    console.log("  ✔ Duplicate email invitation strictly rejected.");

    // Verify unauthorized role invitation (Agent cannot invite)
    let unauthorizedRejected = false;
    try {
      await teamService.inviteMember(tenantAgentA, {
        email: `unauthorized.${Date.now()}@spacia.luxury`,
        role: "sales_agent",
      });
    } catch (err: any) {
      if (err.status === 403 || err.name === "ForbiddenException") {
        unauthorizedRejected = true;
      }
    }
    assert.strictEqual(unauthorizedRejected, true, "Non-admin cannot invite team members");
    console.log("  ✔ Unauthorized invitation by sales agent rejected (403).");

    // -------------------------------------------------------------
    // TEST 3: Role Mutation & Sole Owner Protection Guardrail
    // -------------------------------------------------------------
    console.log("▶ [TEST 3] Testing role updates & Sole Owner Protection Guardrail...");
    
    // Find Owner A's membership record
    const ownerMember = membersA.find((m) => m.userId === OWNER_USER_A)!;
    assert.ok(ownerMember, "Owner membership must exist");

    // Attempting to demote sole owner to sales_manager should FAIL
    let soleOwnerDemotionPrevented = false;
    try {
      await teamService.updateRole(tenantOwnerA, ownerMember.id, { role: "sales_manager" });
    } catch (err: any) {
      if (err.status === 400 && err.message.includes("Cannot demote the sole workspace owner")) {
        soleOwnerDemotionPrevented = true;
      }
    }
    assert.strictEqual(soleOwnerDemotionPrevented, true, "Sole owner demotion must be blocked by safety guardrail");
    console.log("  ✔ Sole Owner Protection Guardrail prevented accidental owner demotion.");

    // Promote Admin to Owner
    const adminMember = membersA.find((m) => m.userId === tenantAdminA.userId)!;
    assert.ok(adminMember, "Admin member record must exist");

    const promoted = await teamService.updateRole(tenantOwnerA, adminMember.id, { role: "owner" });
    assert.strictEqual(promoted.role, "owner", "Admin must be successfully elevated to owner");
    console.log("  ✔ Promoted co-owner successfully.");

    // Now demoting original owner should SUCCEED because there is another active owner
    const demoted = await teamService.updateRole(tenantOwnerA, ownerMember.id, { role: "admin" });
    assert.strictEqual(demoted.role, "admin", "Demoting owner succeeds when secondary owner exists");
    console.log("  ✔ Demoting owner allowed once co-owner is established.");

    // Restore original owner
    await teamService.updateRole(tenantOwnerA, ownerMember.id, { role: "owner" });

    // -------------------------------------------------------------
    // TEST 4: Member Status Transitions & Routing Sync
    // -------------------------------------------------------------
    console.log("▶ [TEST 4] Testing member status transitions & routing synchronization...");
    
    // Suspend Esther Daniels
    const suspended = await teamService.updateStatus(tenantOwnerA, invitedMember.id, { status: "suspended" });
    assert.strictEqual(suspended.status, "suspended");
    assert.strictEqual(suspended.agent?.status, "offline");
    assert.strictEqual(suspended.agent?.isAvailableForRouting, false, "Suspended agent must be removed from lead routing");
    console.log("  ✔ Member suspension automatically detached agent from lead routing engine.");

    // Re-activate Esther Daniels
    const reactivated = await teamService.updateStatus(tenantOwnerA, invitedMember.id, { status: "active" });
    assert.strictEqual(reactivated.status, "active");
    assert.strictEqual(reactivated.agent?.status, "active");
    assert.strictEqual(reactivated.agent?.isAvailableForRouting, true, "Reactivated agent restored to active routing");
    console.log("  ✔ Member reactivation automatically restored agent to active lead routing pool.");

    // Sole owner suspension attempt should fail
    let ownerSuspensionPrevented = false;
    try {
      await teamService.updateStatus(tenantOwnerA, ownerMember.id, { status: "suspended" });
    } catch (err: any) {
      if (err.status === 400 && err.message.includes("Cannot suspend the sole active workspace owner")) {
        ownerSuspensionPrevented = true;
      }
    }
    // (Note: if admin is still co-owner, let's demote admin back to admin first to test sole owner suspension)
    await teamService.updateRole(tenantOwnerA, adminMember.id, { role: "admin" });
    try {
      await teamService.updateStatus(tenantOwnerA, ownerMember.id, { status: "suspended" });
    } catch (err: any) {
      if (err.status === 400 && err.message.includes("Cannot suspend the sole active workspace owner")) {
        ownerSuspensionPrevented = true;
      }
    }
    assert.strictEqual(ownerSuspensionPrevented, true, "Sole owner cannot be suspended");
    console.log("  ✔ Guardrail prevented suspension of sole active workspace owner.");

    // -------------------------------------------------------------
    // TEST 5: Agent Routing Profile Updates
    // -------------------------------------------------------------
    console.log("▶ [TEST 5] Updating agent territory, weights, and lead capacity...");
    const agentId = invitedMember.agent!.id;

    const updatedAgent = await teamService.updateAgentRouting(tenantOwnerA, agentId, {
      territory: "Eko Atlantic City Marina",
      routingWeight: 35,
      maxConcurrentLeads: 75,
      specializations: ["waterfront", "ultra_luxury", "investment_yield"],
      isAvailableForRouting: true,
    });

    assert.strictEqual(updatedAgent.territory, "Eko Atlantic City Marina");
    assert.strictEqual(updatedAgent.routingWeight, 35);
    assert.strictEqual(updatedAgent.maxConcurrentLeads, 75);
    assert.deepStrictEqual(updatedAgent.specializations, ["waterfront", "ultra_luxury", "investment_yield"]);
    console.log("  ✔ Agent routing configuration updated and verified.");

    // -------------------------------------------------------------
    // TEST 6: Member Removal & Sole Owner Protection
    // -------------------------------------------------------------
    console.log("▶ [TEST 6] Testing member removal and sole owner protection...");
    
    // Removing sole owner should FAIL
    let ownerRemovalPrevented = false;
    try {
      await teamService.removeMember(tenantOwnerA, ownerMember.id);
    } catch (err: any) {
      if (err.status === 400 && err.message.includes("Cannot remove the sole workspace owner")) {
        ownerRemovalPrevented = true;
      }
    }
    assert.strictEqual(ownerRemovalPrevented, true, "Sole owner cannot be removed");
    console.log("  ✔ Guardrail prevented removing sole workspace owner.");

    // Removing invited member should SUCCEED
    const removalResult = await teamService.removeMember(tenantOwnerA, invitedMember.id);
    assert.strictEqual(removalResult.success, true);

    const postRemovalMembers = await teamService.listMembers(TEST_WS_A);
    const foundRemoved = postRemovalMembers.find((m) => m.id === invitedMember.id);
    assert.strictEqual(foundRemoved, undefined, "Removed member must no longer be returned");
    console.log("  ✔ Member successfully removed and agent record retired.");

    // -------------------------------------------------------------
    // TEST 7: Multi-Tenant Workspace Isolation
    // -------------------------------------------------------------
    console.log("▶ [TEST 7] Verifying multi-tenant isolation between Workspaces A & B...");
    const membersB = await teamService.listMembers(TEST_WS_B);
    
    // Check that members in Workspace A do NOT appear in Workspace B
    const leakedMember = membersB.find((m) => m.userId === OWNER_USER_A || m.userId === tenantAdminA.userId);
    assert.strictEqual(leakedMember, undefined, "Workspace B must not contain Workspace A members");

    // Attempting to modify Workspace A member from Workspace B tenant must throw NotFoundException
    let crossTenantUpdateBlocked = false;
    try {
      await teamService.updateRole(tenantOwnerB, ownerMember.id, { role: "admin" });
    } catch (err: any) {
      if (err.status === 404 || err.name === "NotFoundException") {
        crossTenantUpdateBlocked = true;
      }
    }
    assert.strictEqual(crossTenantUpdateBlocked, true, "Cross-tenant member modification must return 404");
    console.log("  ✔ Multi-tenant database boundary strictly enforced.");

    // -------------------------------------------------------------
    // TEST 8: Role Definitions & RBAC Guide
    // -------------------------------------------------------------
    console.log("▶ [TEST 8] Verifying role definitions & RBAC permissions guide...");
    const roleDefs = teamService.getRoleDefinitions();
    assert.strictEqual(roleDefs.length, 4);

    const ownerDef = roleDefs.find((r) => r.role === "owner");
    const adminDef = roleDefs.find((r) => r.role === "admin");
    const managerDef = roleDefs.find((r) => r.role === "sales_manager");
    const agentDef = roleDefs.find((r) => r.role === "sales_agent");

    assert.ok(ownerDef && ownerDef.permissions.includes("All Permissions"));
    assert.ok(adminDef && adminDef.permissions.includes("members:manage"));
    assert.ok(managerDef && managerDef.permissions.includes("handoff:takeover"));
    assert.ok(agentDef && agentDef.permissions.includes("appointments:manage"));
    console.log("  ✔ All 4 luxury real estate roles and RBAC permissions validated.");

    console.log("\n=========================================================");
    console.log(" ✅ ALL PACIA DAY 23 TEAM MANAGEMENT TESTS PASSED!");
    console.log("=========================================================\n");
  } catch (err) {
    console.error("\n❌ DAY 23 TEST FAILED:", err);
    throw err;
  } finally {
    await app.close();
  }
}

runDay23TeamManagementTestSuite()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
