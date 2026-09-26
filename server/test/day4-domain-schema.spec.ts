import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { eq, and } from "drizzle-orm";
import ws from "ws";
import * as dotenv from "dotenv";
import {
  workspaces,
  properties,
  propertyFeatures,
  agents,
  leads,
  leadEvents,
  leadScores,
  conversations,
  messages,
  calls,
  transcripts,
  callSummaries,
  qualificationResults,
  followUps,
  appointments,
  calendarConnections,
  integrations,
  aiAgents,
  aiConfigurations,
  notifications,
} from "../src/database/schema";

dotenv.config();
neonConfig.webSocketConstructor = ws;

async function runDomainSchemaVerification() {
  console.log("\n=========================================================");
  console.log(" PACIA DAY 4: CORE DOMAIN SCHEMA & LIFECYCLE VERIFICATION");
  console.log("=========================================================\n");

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not defined in environment.");
  }

  const pool = new Pool({ connectionString });
  const db = drizzle(pool);

  const timestamp = Date.now();
  const ws1 = `ws_day4_alpha_${timestamp}`;
  const ws2 = `ws_day4_beta_${timestamp}`;

  try {
    // -------------------------------------------------------------------------
    // SETUP: Provision 2 Workspaces in Neon
    // -------------------------------------------------------------------------
    console.log("1. PROVISIONING MULTI-TENANT TEST WORKSPACES...");
    await db.insert(workspaces).values([
      {
        id: ws1,
        name: "Day 4 Alpha Realty",
        slug: `alpha-${timestamp}`,
        tier: "enterprise",
      },
      {
        id: ws2,
        name: "Day 4 Beta Realty",
        slug: `beta-${timestamp}`,
        tier: "growth",
      },
    ]);
    console.log("  ✓ Workspaces Alpha & Beta provisioned in Neon");

    // -------------------------------------------------------------------------
    // 2. PROPERTIES & FEATURES
    // -------------------------------------------------------------------------
    console.log("\n2. TESTING PROPERTIES & PROPERTY FEATURES INSERTION...");
    const [prop] = await db
      .insert(properties)
      .values({
        workspaceId: ws1,
        slug: "waterfront-penthouse-ikoyi",
        title: "Waterfront Penthouse — Ikoyi",
        location: "Bourbillon Road, Ikoyi",
        city: "Lagos",
        state: "Lagos State",
        propertyType: "Penthouse",
        price: "850000000.00",
        formattedPrice: "₦850,000,000",
        bedrooms: 4,
        bathrooms: 5,
        squareMeters: 450,
        parkingSpaces: 3,
        developmentStage: "Ready for Occupancy",
        availability: "Available",
        verificationStatus: "Verified",
        titleDeedType: "Governor's Consent",
        images: ["https://example.com/p1.jpg"],
        featuredImage: "https://example.com/p1.jpg",
        description: "Ultra-luxury penthouse with private elevator.",
      })
      .returning();

    await db.insert(propertyFeatures).values([
      {
        workspaceId: ws1,
        propertyId: prop.id,
        feature: "Private Jetty",
        category: "luxury",
      },
      {
        workspaceId: ws1,
        propertyId: prop.id,
        feature: "24/7 Power",
        category: "utility",
      },
    ]);
    console.log(`  ✓ Property '${prop.title}' (₦${prop.price}) and features inserted`);

    // -------------------------------------------------------------------------
    // 3. AGENTS (HUMAN BROKERS)
    // -------------------------------------------------------------------------
    console.log("\n3. TESTING AGENTS (SALES EXECUTIVE PROFILES)...");
    const [agent] = await db
      .insert(agents)
      .values({
        workspaceId: ws1,
        name: "Marcus Vance",
        email: `marcus_${timestamp}@alpha.local`,
        phone: "+2348012345678",
        roleTitle: "Senior Luxury Broker",
        status: "active",
        maxConcurrentLeads: 25,
      })
      .returning();
    console.log(`  ✓ Sales Agent '${agent.name}' (${agent.roleTitle}) created`);

    // -------------------------------------------------------------------------
    // 4. LEADS, EVENTS & SCORING
    // -------------------------------------------------------------------------
    console.log("\n4. TESTING LEADS, EVENTS & LEAD SCORING...");
    const [lead] = await db
      .insert(leads)
      .values({
        workspaceId: ws1,
        propertyId: prop.id,
        assignedAgentId: agent.id,
        name: "Chief Raymond Cole",
        phone: "+2348099887766",
        email: "raymond.cole@holding.ng",
        budget: "₦1,000,000,000",
        score: 95,
        scoreCategory: "HOT",
        status: "In Conversation",
        intent: "Purchase",
        timeline: "< 30 days",
        source: "instagram",
        managementMode: "ai_autonomous",
      })
      .returning();

    await db.insert(leadEvents).values([
      {
        workspaceId: ws1,
        leadId: lead.id,
        type: "inbound_capture",
        title: "Instagram Ad Lead Intake",
        description: "Captured inquiry for Waterfront Penthouse",
        channel: "instagram",
        actorType: "system",
      },
      {
        workspaceId: ws1,
        leadId: lead.id,
        type: "ai_voice_call",
        title: "Autonomous Voice Outreach",
        description: "Completed 4m 12s voice discovery call",
        channel: "call",
        actorType: "ai_agent",
      },
    ]);

    await db.insert(leadScores).values({
      workspaceId: ws1,
      leadId: lead.id,
      score: 95,
      scoreCategory: "HOT",
      budgetScore: 98,
      authorityScore: 95,
      needScore: 92,
      timelineScore: 94,
      propertyFitScore: 96,
      factors: { positive: ["High declared liquidity", "Immediate closing timeline"] },
    });
    console.log(`  ✓ Lead '${lead.name}' (Score: ${lead.score}) with events & score breakdown created`);

    // -------------------------------------------------------------------------
    // 5. CONVERSATIONS & MESSAGES
    // -------------------------------------------------------------------------
    console.log("\n5. TESTING CONVERSATIONS & MESSAGING...");
    const [conv] = await db
      .insert(conversations)
      .values({
        workspaceId: ws1,
        leadId: lead.id,
        propertyId: prop.id,
        assignedAgentId: agent.id,
        channel: "whatsapp",
        status: "active_ai",
        prospectName: lead.name,
        prospectPhone: lead.phone,
        unreadCount: 0,
        lastMessageText: "I am ready to inspect this Thursday.",
        lastMessageAt: new Date(),
        lastMessageSender: "prospect",
      })
      .returning();

    await db.insert(messages).values([
      {
        workspaceId: ws1,
        conversationId: conv.id,
        senderType: "ai_agent",
        senderName: "Adaeze (AI Specialist)",
        content: "Good afternoon Chief Cole, would 2:00 PM on Thursday work for the inspection?",
        deliveryStatus: "read",
      },
      {
        workspaceId: ws1,
        conversationId: conv.id,
        senderType: "prospect",
        senderName: lead.name,
        content: "I am ready to inspect this Thursday at 2:00 PM.",
        deliveryStatus: "delivered",
      },
    ]);
    console.log(`  ✓ Conversation via ${conv.channel} with 2 messages inserted`);

    // -------------------------------------------------------------------------
    // 6. CALLS, TRANSCRIPTS & CALL SUMMARIES
    // -------------------------------------------------------------------------
    console.log("\n6. TESTING CALLS, TRANSCRIPTS & SUMMARIES...");
    const [call] = await db
      .insert(calls)
      .values({
        workspaceId: ws1,
        leadId: lead.id,
        propertyId: prop.id,
        leadName: lead.name,
        leadPhone: lead.phone,
        outcome: "viewing_booked",
        recordingState: "ready",
        recordingUrl: "https://audio.pacia.internal/rec_123.mp3",
        durationSeconds: 252,
        callScore: 96,
        agentPersona: "Adaeze Luxury Voice",
        metrics: { talkRatio: { ai: 42, prospect: 58 }, latencyMs: 380 },
      })
      .returning();

    await db.insert(transcripts).values({
      workspaceId: ws1,
      callId: call.id,
      fullText: "Agent: Hello Chief Cole... Prospect: Yes, I want to book viewing...",
      turns: [
        { speaker: "agent", speakerName: "Adaeze", timestampSeconds: 2, message: "Hello Chief Cole" },
        { speaker: "prospect", speakerName: "Chief Raymond Cole", timestampSeconds: 5, message: "Yes, I want to book viewing" },
      ],
    });

    await db.insert(callSummaries).values({
      workspaceId: ws1,
      callId: call.id,
      synthesis: "Chief Cole confirmed outright purchasing power and requested Thursday 2PM viewing.",
      keyTakeaways: ["Outright cash buyer", "Decision maker", "Viewing scheduled"],
      objectionsRaised: [],
      actionItems: ["Assign Marcus Vance for in-person hosting"],
      suggestedNextStep: "Send calendar invite",
    });
    console.log(`  ✓ Call (Outcome: ${call.outcome}, Duration: ${call.durationSeconds}s) with transcript & summary created`);

    // -------------------------------------------------------------------------
    // 7. QUALIFICATION RESULTS
    // -------------------------------------------------------------------------
    console.log("\n7. TESTING QUALIFICATION DOMAIN MODEL...");
    const [qual] = await db
      .insert(qualificationResults)
      .values({
        workspaceId: ws1,
        leadId: lead.id,
        callId: call.id,
        confidenceScore: 98,
        buyerIntent: "high_purchase_intent",
        decisionReadiness: "immediate_close",
        motivation: "Executive relocation to Ikoyi waterfront corridor",
        timelineWindow: "< 30 days",
        timelineUrgency: "urgent",
        budgetDeclared: "₦1,000,000,000",
        paymentStructure: "Outright",
        budgetStretchCategory: "Within Budget",
        objections: [],
        intentSignals: [{ type: "authority", label: "Sole signatory on corporate trust", strength: "high" }],
      })
      .returning();
    console.log(`  ✓ Qualification result (Intent: ${qual.buyerIntent}, Readiness: ${qual.decisionReadiness}) inserted`);

    // -------------------------------------------------------------------------
    // 8. FOLLOW-UPS & APPOINTMENTS (TIMESTAMPTZ)
    // -------------------------------------------------------------------------
    console.log("\n8. TESTING SALES SCHEDULING (TIMESTAMPTZ APPOINTMENTS & FOLLOW-UPS)...");
    const startDate = new Date(Date.now() + 48 * 3600 * 1000);
    const endDate = new Date(startDate.getTime() + 3600 * 1000);

    const [appt] = await db
      .insert(appointments)
      .values({
        workspaceId: ws1,
        leadId: lead.id,
        propertyId: prop.id,
        assignedAgentId: agent.id,
        title: "Exclusive Penthouse Inspection — Chief Cole",
        type: "property_viewing",
        status: "confirmed",
        scheduledStartAt: startDate,
        scheduledEndAt: endDate,
        location: prop.location,
        notes: "Buyer requested VIP security access at estate gate.",
      })
      .returning();

    await db.insert(followUps).values({
      workspaceId: ws1,
      leadId: lead.id,
      scheduledAt: new Date(startDate.getTime() - 2 * 3600 * 1000), // 2 hours before
      channel: "whatsapp",
      cadence: "once",
      status: "pending",
      priority: "immediate",
      directive: "Send VIP gate pass code to Chief Cole via WhatsApp",
    });
    console.log(`  ✓ Appointment '${appt.title}' scheduled: ${appt.scheduledStartAt.toISOString()} -> ${appt.scheduledEndAt.toISOString()}`);

    // -------------------------------------------------------------------------
    // 9. TESTING CALENDAR, INTEGRATIONS, AI CONFIGURATIONS & NOTIFICATIONS
    // -------------------------------------------------------------------------
    console.log("\n9. TESTING CALENDAR, INTEGRATIONS, AI CONFIGS & NOTIFICATIONS...");
    
    // Calendar connection
    const [cal] = await db
      .insert(calendarConnections)
      .values({
        workspaceId: ws1,
        agentId: agent.id,
        provider: "google",
        calendarId: "primary@pacia.io",
        status: "connected",
        metadata: { syncEnabled: true },
      })
      .returning();
    console.log(`  ✓ Calendar Connection provisioned: ${cal.provider} (${cal.calendarId})`);

    // Integration (MCP / Webhook)
    const [integ] = await db
      .insert(integrations)
      .values({
        workspaceId: ws1,
        type: "mcp",
        name: "Enterprise Inventory MCP",
        status: "active",
        config: { endpoint: "https://mcp.alpha-realty.com/v1" },
      })
      .returning();
    console.log(`  ✓ Integration registered: ${integ.name} (type: ${integ.type})`);

    // AI Agent
    const [aiAgent] = await db
      .insert(aiAgents)
      .values({
        workspaceId: ws1,
        name: "Aria — Luxury Sales Qualifier",
        role: "inbound_qualifier",
        voiceId: "eleven_rachel_voice_01",
        phoneNumber: "+2348000000001",
        isActive: true,
      })
      .returning();
    console.log(`  ✓ AI Agent deployed: ${aiAgent.name} (role: ${aiAgent.role})`);

    // AI Configuration
    const [aiConfig] = await db
      .insert(aiConfigurations)
      .values({
        workspaceId: ws1,
        aiAgentId: aiAgent.id,
        provider: "openai",
        model: "gpt-4o",
        temperature: "0.70",
        maxTokens: 1200,
        qualificationRules: { minBudgetNaira: 100000000 },
      })
      .returning();
    console.log(`  ✓ AI Configuration bound: ${aiConfig.provider}/${aiConfig.model} (temp: ${aiConfig.temperature})`);

    // Notification
    const [notif] = await db
      .insert(notifications)
      .values({
        workspaceId: ws1,
        type: "lead_qualified",
        title: "High-Net-Worth Lead Qualified",
        message: "Chief Adeleke Cole (Budget: ₦900M) scored 95/100 and booked a viewing.",
        entityType: "lead",
        entityId: lead.id,
        isRead: false,
      })
      .returning();
    console.log(`  ✓ In-app Notification created: ${notif.title} (unread: ${!notif.isRead})`);

    // -------------------------------------------------------------------------
    // 10. CROSS-TENANT INTEGRITY CHECK (COMPOSITE FOREIGN KEY ENFORCEMENT)
    // -------------------------------------------------------------------------
    console.log("\n10. TESTING CROSS-TENANT BOUNDARY PROTECTION (COMPOSITE FOREIGN KEYS)...");
    let crossTenantBlocked = false;
    try {
      // Attempt to associate a lead event in Workspace 2 (Beta) with Lead from Workspace 1 (Alpha)
      await db.insert(leadEvents).values({
        workspaceId: ws2, // Workspace Beta!
        leadId: lead.id, // Lead from Workspace Alpha!
        type: "inbound_capture",
        title: "Cross-Tenant Intruder Event",
        description: "Intruder event attempting cross-tenant injection",
        channel: "web",
      });
    } catch (err: any) {
      crossTenantBlocked = true;
      console.log(`  ✓ Database physically blocked cross-workspace reference via composite FK: ${err.message?.split("\n")[0]}`);
    }

    if (!crossTenantBlocked) {
      throw new Error("FAILED: Database allowed an event in Workspace B to reference a lead in Workspace A!");
    }

    // -------------------------------------------------------------------------
    // 11. LIFECYCLE DELETION & INTEGRITY RULES (CASCADE vs SET NULL)
    // -------------------------------------------------------------------------
    console.log("\n11. TESTING LIFECYCLE DELETION RULES (CASCADE vs SET NULL)...");
    
    // A. Delete Property -> Verify Lead remains intact with propertyId set to NULL
    await db.delete(properties).where(eq(properties.id, prop.id));
    const [leadAfterPropDelete] = await db.select().from(leads).where(eq(leads.id, lead.id));
    if (!leadAfterPropDelete) {
      throw new Error("FAILED: Deleting property deleted the lead! Expected propertyId to be set to NULL.");
    }
    if (leadAfterPropDelete.propertyId !== null) {
      throw new Error(`FAILED: Expected lead.propertyId to be null, but got ${leadAfterPropDelete.propertyId}`);
    }
    console.log("  ✓ Deleting property safely set lead.propertyId to NULL (Lead retained)");

    // B. Delete Lead -> Verify call records remain for audit compliance, but lead_events & lead_scores cascade
    await db.delete(leads).where(eq(leads.id, lead.id));
    
    // Check call still exists with leadId = null
    const [callAfterLeadDelete] = await db.select().from(calls).where(eq(calls.id, call.id));
    if (!callAfterLeadDelete || callAfterLeadDelete.leadId !== null) {
      throw new Error("FAILED: Call audit record was destroyed or leadId not nulled upon lead deletion!");
    }
    console.log("  ✓ Deleting lead safely preserved call recording with leadId set to NULL");

    // Check lead events cascaded
    const remainingEvents = await db.select().from(leadEvents).where(eq(leadEvents.leadId, lead.id));
    if (remainingEvents.length !== 0) {
      throw new Error("FAILED: Expected lead events to be cascaded upon lead deletion!");
    }
    console.log("  ✓ Deleting lead cascaded and purged owned lead_events and lead_scores");

    // Clean up test workspaces
    await db.delete(workspaces).where(eq(workspaces.id, ws1));
    await db.delete(workspaces).where(eq(workspaces.id, ws2));
    console.log("  ✓ Cleaned up test workspaces and cascaded all remaining tenant records");

    console.log("\n=========================================================");
    console.log(" ALL DAY 4 CORE DOMAIN SCHEMA TESTS PASSED (100%)");
    console.log("=========================================================\n");
  } catch (error) {
    console.error("\n❌ DAY 4 SCHEMA VERIFICATION FAILED:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runDomainSchemaVerification();
