import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, "../.env") });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is missing!");
  process.exit(1);
}

const sql = neon(databaseUrl);

async function seed() {
  const workspaces = ["org_dubai_palace", "ws_default_spacia"];

  for (const ws of workspaces) {
    console.log(`Seeding live dashboard data for workspace: ${ws}...`);

    // Ensure workspace exists
    await sql`
      INSERT INTO workspaces (id, name, slug, tier)
      VALUES (${ws}, 'Dubai Palace Realty', ${ws}, 'enterprise')
      ON CONFLICT (id) DO NOTHING;
    `;

    // 1. Properties
    const [prop1] = await sql`
      INSERT INTO properties (
        workspace_id, title, slug, location, property_type, price, formatted_price, bedrooms, bathrooms, availability
      ) VALUES (
        ${ws}, 'The Grand Waterfront Villa', ${'grand-waterfront-villa-' + ws + '-' + Date.now()}, 'Zone A, Banana Island, Ikoyi', 'mansion', 950000000, '₦950,000,000', 6, 7, 'Available'
      )
      RETURNING id;
    `;

    const [prop2] = await sql`
      INSERT INTO properties (
        workspace_id, title, slug, location, property_type, price, formatted_price, bedrooms, bathrooms, availability
      ) VALUES (
        ${ws}, 'Bourdillon Sky Penthouse', ${'bourdillon-sky-penthouse-' + ws + '-' + Date.now()}, '4 Bourdillon Road, Ikoyi', 'penthouse', 1200000000, '₦1,200,000,000', 5, 6, 'Available'
      )
      RETURNING id;
    `;

    // 2. Leads
    const [lead1] = await sql`
      INSERT INTO leads (
        workspace_id, property_id, name, phone, email, status, score, score_category, budget, intent, timeline, next_action, management_mode, is_ai_stopped, inbound_notes
      ) VALUES (
        ${ws}, ${prop2.id}, 'Chief Adeleke Cole', '+2348031234567', 'adeleke.cole@ventureholdings.ng', 'Qualified', 92, 'HOT', '₦1,200,000,000', 'Purchase', 'Immediate', 'Schedule Senior Partner Closing', 'ai_autonomous', false, 'High net worth buyer. Outright cash liquidity verified via GTBank.'
      )
      RETURNING id;
    `;

    const [lead2] = await sql`
      INSERT INTO leads (
        workspace_id, property_id, name, phone, email, status, score, score_category, budget, intent, timeline, next_action, management_mode, is_ai_stopped, ai_stopped_reason, inbound_notes
      ) VALUES (
        ${ws}, ${prop2.id}, 'Senator Okonjo', '+2348039876543', 'okonjo.gov@nigeria.ng', 'Human Managed', 88, 'HOT', '₦2,000,000,000', 'Purchase', 'Within 30 Days', 'Immediate Executive Follow-up', 'human_managed', true, 'Prospect requested immediate senior partner call regarding title documentation.', 'Urgent human takeover requested.'
      )
      RETURNING id;
    `;

    const [lead3] = await sql`
      INSERT INTO leads (
        workspace_id, property_id, name, phone, email, status, score, score_category, budget, intent, timeline, next_action, management_mode, is_ai_stopped, inbound_notes
      ) VALUES (
        ${ws}, ${prop1.id}, 'Alhaji Danjuma', '+2348039998877', 'alhajidanjuma@investment.ng', 'Viewing Booked', 94, 'HOT', '₦950,000,000', 'Purchase', 'Immediate', 'Prepare Gate Pass & Deed Pack', 'ai_autonomous', false, 'Confirmed VIP Walkthrough for Banana Island property.'
      )
      RETURNING id;
    `;

    const [lead4] = await sql`
      INSERT INTO leads (
        workspace_id, property_id, name, phone, email, status, score, score_category, budget, intent, timeline, next_action, management_mode, is_ai_stopped, inbound_notes
      ) VALUES (
        ${ws}, ${prop1.id}, 'Fatima Al-Zahra', '+971508889900', 'fatima@emirates.ae', 'Contacting', 72, 'WARM', '₦600,000,000', 'Investment', '1-3 Months', 'AI Voice Follow-up at 2 PM', 'ai_autonomous', false, 'Inquiring for overseas investment portfolio.'
      )
      RETURNING id;
    `;

    // 3. Calls
    await sql`
      INSERT INTO calls (
        workspace_id, lead_id, lead_name, lead_phone, duration_seconds, outcome, call_score
      ) VALUES
      (${ws}, ${lead1.id}, 'Chief Adeleke Cole', '+2348031234567', 240, 'qualified', 92)
    `;

    await sql`
      INSERT INTO calls (
        workspace_id, lead_id, lead_name, lead_phone, duration_seconds, outcome, call_score
      ) VALUES
      (${ws}, ${lead3.id}, 'Alhaji Danjuma', '+2348039998877', 195, 'viewing_booked', 94)
    `;

    // 4. Appointments
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);
    const tomorrowEnd = new Date(tomorrow.getTime() + 60 * 60000);

    const inTwoDays = new Date();
    inTwoDays.setDate(inTwoDays.getDate() + 2);
    inTwoDays.setHours(11, 30, 0, 0);
    const inTwoDaysEnd = new Date(inTwoDays.getTime() + 60 * 60000);

    await sql`
      INSERT INTO appointments (
        workspace_id, lead_id, property_id, title, location, scheduled_start_at, scheduled_end_at, status, notes
      ) VALUES
      (${ws}, ${lead3.id}, ${prop1.id}, 'VIP Private Showing: The Grand Waterfront Villa', 'Zone A, Banana Island, Ikoyi', ${tomorrow}, ${tomorrowEnd}, 'confirmed', 'VIP Inspection. Gate pass active.')
    `;

    await sql`
      INSERT INTO appointments (
        workspace_id, lead_id, property_id, title, location, scheduled_start_at, scheduled_end_at, status, notes
      ) VALUES
      (${ws}, ${lead1.id}, ${prop2.id}, 'Executive Walkthrough: Bourdillon Sky Penthouse', '4 Bourdillon Road, Ikoyi', ${inTwoDays}, ${inTwoDaysEnd}, 'scheduled', 'Closer on-site: Ade Admin.')
    `;

    // 5. Follow-ups
    await sql`
      INSERT INTO follow_ups (
        workspace_id, lead_id, scheduled_at, status, directive
      ) VALUES
      (${ws}, ${lead1.id}, ${new Date()}, 'pending', 'Follow up with GTBank mortgage/cash confirmation.')
    `;

    // 6. Lead Events
    await sql`
      INSERT INTO lead_events (
        workspace_id, lead_id, type, title, description, channel
      ) VALUES
      (${ws}, ${lead3.id}, 'viewing_scheduled', 'VIP Inspection Booked: Alhaji Danjuma', 'Confirmed walkthrough for The Grand Waterfront Villa, Banana Island.', 'calendar'),
      (${ws}, ${lead1.id}, 'ai_voice_call', 'Vapi Voice Session: Chief Adeleke', 'BANT qualification scored 92/100 (HOT). Outright purchase liquidity verified.', 'voice'),
      (${ws}, ${lead2.id}, 'status_change', 'Human Takeover Activated: Senator Okonjo', 'AI communication paused upon request for legal title review.', 'system')
    `;

    console.log(`✔ Workspace ${ws} seeded with live domain records!`);
  }
}

seed()
  .then(() => {
    console.log("\n🚀 All database fixtures seeded successfully!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Seed error:", err);
    process.exit(1);
  });
