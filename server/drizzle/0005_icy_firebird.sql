CREATE TABLE "ai_agent_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar(64) NOT NULL,
	"name" varchar(150) DEFAULT 'Amara' NOT NULL,
	"voice" varchar(100) DEFAULT 'en-NG-EzinneNeural' NOT NULL,
	"tone" varchar(100) DEFAULT 'luxury_professional' NOT NULL,
	"language" varchar(50) DEFAULT 'en-NG' NOT NULL,
	"greeting" text DEFAULT 'Good day. Thank you for contacting Spacia. I am Amara, your personal luxury real estate advisor. How may I assist your property acquisition today?' NOT NULL,
	"business_hours" jsonb DEFAULT '{"enabled":true,"start":"08:00","end":"19:00","timezone":"Africa/Lagos","days":["monday","tuesday","wednesday","thursday","friday","saturday"]}'::jsonb NOT NULL,
	"escalation_rules" jsonb DEFAULT '{"humanTakeoverKeywords":["human","agent","broker","lawyer","scam","dispute","litigation","c-of-o query","bank wire instructions","fraud"],"budgetThresholdNaira":500000000,"maxNegativeSentiments":2,"requireHumanForContracts":true}'::jsonb NOT NULL,
	"follow_up_rules" jsonb DEFAULT '{"maxAttempts":3,"intervalHours":24,"autoArchiveUnresponsiveDays":7,"channelOrder":["whatsapp","sms","voice"]}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_ai_agent_configs_workspace" UNIQUE("workspace_id")
);
--> statement-breakpoint
ALTER TABLE "ai_agent_configs" ADD CONSTRAINT "ai_agent_configs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_ai_agent_configs_workspace_active" ON "ai_agent_configs" USING btree ("workspace_id","is_active");