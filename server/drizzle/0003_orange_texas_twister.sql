CREATE TABLE "calendar_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar(64) NOT NULL,
	"agent_id" uuid,
	"provider" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'connected' NOT NULL,
	"calendar_id" varchar(255),
	"access_token" text,
	"refresh_token" text,
	"expires_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_calendar_connections_id_workspace" UNIQUE("id","workspace_id")
);
--> statement-breakpoint
CREATE TABLE "integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar(64) NOT NULL,
	"type" varchar(50) NOT NULL,
	"name" varchar(150) NOT NULL,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb,
	"credentials" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_integrations_id_workspace" UNIQUE("id","workspace_id")
);
--> statement-breakpoint
CREATE TABLE "ai_agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar(64) NOT NULL,
	"name" varchar(150) NOT NULL,
	"role" varchar(100) DEFAULT 'lead_qualifier' NOT NULL,
	"system_prompt" text,
	"voice_id" varchar(100),
	"phone_number" varchar(50),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_ai_agents_id_workspace" UNIQUE("id","workspace_id")
);
--> statement-breakpoint
CREATE TABLE "ai_configurations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar(64) NOT NULL,
	"ai_agent_id" uuid NOT NULL,
	"provider" varchar(50) DEFAULT 'openai' NOT NULL,
	"model" varchar(100) DEFAULT 'gpt-4o' NOT NULL,
	"temperature" numeric(3, 2) DEFAULT '0.70' NOT NULL,
	"max_tokens" integer DEFAULT 1000 NOT NULL,
	"qualification_rules" jsonb DEFAULT '{}'::jsonb,
	"routing_rules" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_ai_configurations_id_workspace" UNIQUE("id","workspace_id")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar(64) NOT NULL,
	"user_id" varchar(64),
	"type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"entity_type" varchar(50),
	"entity_id" uuid,
	"is_read" boolean DEFAULT false NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_notifications_id_workspace" UNIQUE("id","workspace_id")
);
--> statement-breakpoint
ALTER TABLE "calendar_connections" ADD CONSTRAINT "calendar_connections_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_connections" ADD CONSTRAINT "fk_calendar_connections_agent" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_agents" ADD CONSTRAINT "ai_agents_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_configurations" ADD CONSTRAINT "ai_configurations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_configurations" ADD CONSTRAINT "fk_ai_configurations_agent_ws" FOREIGN KEY ("ai_agent_id","workspace_id") REFERENCES "public"."ai_agents"("id","workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_calendar_connections_workspace" ON "calendar_connections" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "idx_integrations_workspace_type" ON "integrations" USING btree ("workspace_id","type");--> statement-breakpoint
CREATE INDEX "idx_ai_agents_workspace" ON "ai_agents" USING btree ("workspace_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_ai_configurations_agent" ON "ai_configurations" USING btree ("workspace_id","ai_agent_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_user_read" ON "notifications" USING btree ("workspace_id","user_id","is_read");