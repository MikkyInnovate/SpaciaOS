CREATE TYPE "public"."property_availability" AS ENUM('Available', 'Under Offer', 'Sold', 'Reserved', 'Unavailable');--> statement-breakpoint
CREATE TYPE "public"."property_verification_status" AS ENUM('Verified', 'Pending Verification', 'Unverified');--> statement-breakpoint
CREATE TYPE "public"."agent_status" AS ENUM('active', 'busy', 'offline');--> statement-breakpoint
CREATE TYPE "public"."lead_activity_type" AS ENUM('inbound_capture', 'ai_voice_call', 'whatsapp_message', 'viewing_scheduled', 'human_note', 'status_change');--> statement-breakpoint
CREATE TYPE "public"."lead_intent" AS ENUM('Purchase', 'Rental', 'Investment');--> statement-breakpoint
CREATE TYPE "public"."lead_management_mode" AS ENUM('ai_autonomous', 'human_managed', 'nurture', 'lost');--> statement-breakpoint
CREATE TYPE "public"."lead_score_category" AS ENUM('HOT', 'WARM', 'COLD');--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('New', 'Contacting', 'In Conversation', 'Qualified', 'Follow-up', 'Viewing Booked', 'Human Managed', 'Nurture', 'Lost');--> statement-breakpoint
CREATE TYPE "public"."conversation_channel" AS ENUM('whatsapp', 'web_chat', 'voice_transcript');--> statement-breakpoint
CREATE TYPE "public"."conversation_status" AS ENUM('active_ai', 'awaiting_prospect', 'qualified', 'viewing_booked', 'human_takeover', 'escalated', 'closed');--> statement-breakpoint
CREATE TYPE "public"."message_delivery_status" AS ENUM('sending', 'sent', 'delivered', 'read');--> statement-breakpoint
CREATE TYPE "public"."message_sender_type" AS ENUM('ai_agent', 'prospect', 'human_broker', 'system');--> statement-breakpoint
CREATE TYPE "public"."call_outcome" AS ENUM('viewing_booked', 'qualified', 'callback_requested', 'nurture', 'voicemail', 'escalated_takeover');--> statement-breakpoint
CREATE TYPE "public"."call_recording_state" AS ENUM('ready', 'processing', 'live', 'failed', 'no_audio');--> statement-breakpoint
CREATE TYPE "public"."buyer_intent_category" AS ENUM('high_purchase_intent', 'investment_yield_seeking', 'luxury_relocation', 'exploratory', 'unqualified');--> statement-breakpoint
CREATE TYPE "public"."decision_readiness_stage" AS ENUM('immediate_close', 'evaluating_shortlist', 'spousal_board_review', 'asset_liquidation', 'exploratory');--> statement-breakpoint
CREATE TYPE "public"."appointment_status" AS ENUM('pending', 'scheduled', 'confirmed', 'completed', 'cancelled', 'no_show');--> statement-breakpoint
CREATE TYPE "public"."appointment_type" AS ENUM('property_viewing', 'virtual_tour', 'contract_signing', 'followup_meeting');--> statement-breakpoint
CREATE TYPE "public"."follow_up_cadence" AS ENUM('once', 'daily', 'weekly', 'biweekly', 'monthly');--> statement-breakpoint
CREATE TYPE "public"."follow_up_channel" AS ENUM('call', 'whatsapp', 'email');--> statement-breakpoint
CREATE TYPE "public"."follow_up_status" AS ENUM('pending', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."priority_level" AS ENUM('immediate', 'scheduled', 'routine');--> statement-breakpoint
CREATE TABLE "properties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar(64) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"estate_name" varchar(255),
	"location" varchar(255) NOT NULL,
	"city" varchar(100) DEFAULT 'Lagos' NOT NULL,
	"state" varchar(100) DEFAULT 'Lagos State' NOT NULL,
	"property_type" varchar(100) NOT NULL,
	"price" numeric(15, 2) NOT NULL,
	"formatted_price" varchar(50) NOT NULL,
	"bedrooms" integer,
	"bathrooms" integer,
	"square_meters" integer,
	"parking_spaces" integer,
	"development_stage" varchar(100),
	"availability" "property_availability" DEFAULT 'Available' NOT NULL,
	"verification_status" "property_verification_status" DEFAULT 'Pending Verification' NOT NULL,
	"title_deed_type" varchar(150),
	"registry_number" varchar(100),
	"featured_image" text,
	"images" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"description" text,
	"developer_or_owner" varchar(255),
	"commercial_terms" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_properties_id_workspace" UNIQUE("id","workspace_id"),
	CONSTRAINT "uq_properties_slug_workspace" UNIQUE("workspace_id","slug")
);
--> statement-breakpoint
CREATE TABLE "property_features" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar(64) NOT NULL,
	"property_id" uuid NOT NULL,
	"feature" varchar(150) NOT NULL,
	"category" varchar(50) DEFAULT 'amenity',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar(64) NOT NULL,
	"user_id" varchar(64),
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(50),
	"avatar_url" text,
	"role_title" varchar(100) DEFAULT 'Sales Executive' NOT NULL,
	"status" "agent_status" DEFAULT 'active' NOT NULL,
	"max_concurrent_leads" integer DEFAULT 50 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_agents_id_workspace" UNIQUE("id","workspace_id")
);
--> statement-breakpoint
CREATE TABLE "lead_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar(64) NOT NULL,
	"lead_id" uuid NOT NULL,
	"type" "lead_activity_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"channel" varchar(50),
	"actor_type" varchar(50) DEFAULT 'system' NOT NULL,
	"actor_id" varchar(64),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar(64) NOT NULL,
	"lead_id" uuid NOT NULL,
	"score" integer NOT NULL,
	"score_category" "lead_score_category" NOT NULL,
	"budget_score" integer DEFAULT 0,
	"authority_score" integer DEFAULT 0,
	"need_score" integer DEFAULT 0,
	"timeline_score" integer DEFAULT 0,
	"property_fit_score" integer DEFAULT 0,
	"factors" jsonb DEFAULT '{}'::jsonb,
	"calculated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar(64) NOT NULL,
	"property_id" uuid,
	"assigned_agent_id" uuid,
	"name" varchar(255) NOT NULL,
	"phone" varchar(50) NOT NULL,
	"email" varchar(255),
	"inbound_notes" text,
	"location_preference" varchar(255),
	"budget" varchar(100),
	"score" integer DEFAULT 0 NOT NULL,
	"score_category" "lead_score_category" DEFAULT 'COLD' NOT NULL,
	"status" "lead_status" DEFAULT 'New' NOT NULL,
	"intent" "lead_intent" DEFAULT 'Purchase' NOT NULL,
	"timeline" varchar(100),
	"source" varchar(100) DEFAULT 'website' NOT NULL,
	"next_action" text,
	"management_mode" "lead_management_mode" DEFAULT 'ai_autonomous' NOT NULL,
	"is_ai_stopped" boolean DEFAULT false NOT NULL,
	"ai_stopped_reason" text,
	"loss_reason" varchar(100),
	"loss_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_leads_id_workspace" UNIQUE("id","workspace_id")
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar(64) NOT NULL,
	"lead_id" uuid,
	"property_id" uuid,
	"assigned_agent_id" uuid,
	"channel" "conversation_channel" DEFAULT 'whatsapp' NOT NULL,
	"status" "conversation_status" DEFAULT 'active_ai' NOT NULL,
	"prospect_name" varchar(255) NOT NULL,
	"prospect_phone" varchar(50) NOT NULL,
	"prospect_email" varchar(255),
	"unread_count" integer DEFAULT 0 NOT NULL,
	"last_message_text" text,
	"last_message_at" timestamp with time zone,
	"last_message_sender" "message_sender_type",
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_conversations_id_workspace" UNIQUE("id","workspace_id")
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar(64) NOT NULL,
	"conversation_id" uuid NOT NULL,
	"sender_type" "message_sender_type" NOT NULL,
	"sender_name" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"delivery_status" "message_delivery_status" DEFAULT 'sent' NOT NULL,
	"artifact" jsonb,
	"ai_metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "call_summaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar(64) NOT NULL,
	"call_id" uuid NOT NULL,
	"synthesis" text NOT NULL,
	"key_takeaways" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"objections_raised" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"action_items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"suggested_next_step" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_call_summaries_call_workspace" UNIQUE("call_id","workspace_id")
);
--> statement-breakpoint
CREATE TABLE "calls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar(64) NOT NULL,
	"lead_id" uuid,
	"property_id" uuid,
	"lead_name" varchar(255) NOT NULL,
	"lead_phone" varchar(50) NOT NULL,
	"outcome" "call_outcome" DEFAULT 'qualified' NOT NULL,
	"recording_state" "call_recording_state" DEFAULT 'ready' NOT NULL,
	"recording_url" text,
	"duration_seconds" integer DEFAULT 0 NOT NULL,
	"call_score" integer,
	"is_escalated" boolean DEFAULT false NOT NULL,
	"is_live" boolean DEFAULT false NOT NULL,
	"agent_persona" varchar(100),
	"metrics" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_calls_id_workspace" UNIQUE("id","workspace_id")
);
--> statement-breakpoint
CREATE TABLE "transcripts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar(64) NOT NULL,
	"call_id" uuid NOT NULL,
	"turns" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"full_text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_transcripts_call_workspace" UNIQUE("call_id","workspace_id")
);
--> statement-breakpoint
CREATE TABLE "qualification_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar(64) NOT NULL,
	"lead_id" uuid NOT NULL,
	"call_id" uuid,
	"confidence_score" integer NOT NULL,
	"buyer_intent" "buyer_intent_category" NOT NULL,
	"decision_readiness" "decision_readiness_stage" NOT NULL,
	"motivation" text,
	"timeline_window" varchar(100),
	"timeline_urgency" varchar(50) DEFAULT 'near_term',
	"budget_declared" varchar(100),
	"budget_verified_liquidity" varchar(100),
	"payment_structure" varchar(50) DEFAULT 'Outright',
	"budget_stretch_category" varchar(50),
	"objections" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"intent_signals" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"evaluated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar(64) NOT NULL,
	"lead_id" uuid,
	"property_id" uuid,
	"assigned_agent_id" uuid,
	"title" varchar(255) NOT NULL,
	"type" "appointment_type" DEFAULT 'property_viewing' NOT NULL,
	"status" "appointment_status" DEFAULT 'scheduled' NOT NULL,
	"scheduled_start_at" timestamp with time zone NOT NULL,
	"scheduled_end_at" timestamp with time zone NOT NULL,
	"location" varchar(255) NOT NULL,
	"meeting_url" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "follow_ups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar(64) NOT NULL,
	"lead_id" uuid NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"channel" "follow_up_channel" DEFAULT 'call' NOT NULL,
	"cadence" "follow_up_cadence" DEFAULT 'once' NOT NULL,
	"status" "follow_up_status" DEFAULT 'pending' NOT NULL,
	"priority" "priority_level" DEFAULT 'scheduled' NOT NULL,
	"directive" text,
	"notes" text,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_features" ADD CONSTRAINT "property_features_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_features" ADD CONSTRAINT "fk_property_features_property_ws" FOREIGN KEY ("property_id","workspace_id") REFERENCES "public"."properties"("id","workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_events" ADD CONSTRAINT "lead_events_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_events" ADD CONSTRAINT "fk_lead_events_lead_ws" FOREIGN KEY ("lead_id","workspace_id") REFERENCES "public"."leads"("id","workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_scores" ADD CONSTRAINT "lead_scores_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_scores" ADD CONSTRAINT "fk_lead_scores_lead_ws" FOREIGN KEY ("lead_id","workspace_id") REFERENCES "public"."leads"("id","workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "fk_leads_property" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "fk_leads_agent" FOREIGN KEY ("assigned_agent_id") REFERENCES "public"."agents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "fk_conversations_lead" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "fk_conversations_property" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "fk_conversations_agent" FOREIGN KEY ("assigned_agent_id") REFERENCES "public"."agents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "fk_messages_conversation_ws" FOREIGN KEY ("conversation_id","workspace_id") REFERENCES "public"."conversations"("id","workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_summaries" ADD CONSTRAINT "call_summaries_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_summaries" ADD CONSTRAINT "fk_call_summaries_call_ws" FOREIGN KEY ("call_id","workspace_id") REFERENCES "public"."calls"("id","workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calls" ADD CONSTRAINT "calls_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calls" ADD CONSTRAINT "fk_calls_lead" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calls" ADD CONSTRAINT "fk_calls_property" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transcripts" ADD CONSTRAINT "transcripts_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transcripts" ADD CONSTRAINT "fk_transcripts_call_ws" FOREIGN KEY ("call_id","workspace_id") REFERENCES "public"."calls"("id","workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qualification_results" ADD CONSTRAINT "qualification_results_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qualification_results" ADD CONSTRAINT "fk_qualifications_lead_ws" FOREIGN KEY ("lead_id","workspace_id") REFERENCES "public"."leads"("id","workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qualification_results" ADD CONSTRAINT "fk_qualifications_call" FOREIGN KEY ("call_id") REFERENCES "public"."calls"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "fk_appointments_lead" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "fk_appointments_property" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "fk_appointments_agent" FOREIGN KEY ("assigned_agent_id") REFERENCES "public"."agents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow_ups" ADD CONSTRAINT "fk_follow_ups_lead_ws" FOREIGN KEY ("lead_id","workspace_id") REFERENCES "public"."leads"("id","workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_properties_workspace_status" ON "properties" USING btree ("workspace_id","availability");--> statement-breakpoint
CREATE INDEX "idx_properties_workspace_price" ON "properties" USING btree ("workspace_id","price");--> statement-breakpoint
CREATE INDEX "idx_property_features_property" ON "property_features" USING btree ("workspace_id","property_id");--> statement-breakpoint
CREATE INDEX "idx_agents_workspace_status" ON "agents" USING btree ("workspace_id","status");--> statement-breakpoint
CREATE INDEX "idx_agents_workspace_email" ON "agents" USING btree ("workspace_id","email");--> statement-breakpoint
CREATE INDEX "idx_lead_events_lead_time" ON "lead_events" USING btree ("workspace_id","lead_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_lead_scores_lead" ON "lead_scores" USING btree ("workspace_id","lead_id");--> statement-breakpoint
CREATE INDEX "idx_leads_workspace_status" ON "leads" USING btree ("workspace_id","status");--> statement-breakpoint
CREATE INDEX "idx_leads_workspace_score" ON "leads" USING btree ("workspace_id","score_category","score");--> statement-breakpoint
CREATE INDEX "idx_leads_workspace_phone" ON "leads" USING btree ("workspace_id","phone");--> statement-breakpoint
CREATE INDEX "idx_conversations_workspace_status" ON "conversations" USING btree ("workspace_id","status");--> statement-breakpoint
CREATE INDEX "idx_conversations_workspace_channel" ON "conversations" USING btree ("workspace_id","channel");--> statement-breakpoint
CREATE INDEX "idx_messages_conversation_time" ON "messages" USING btree ("workspace_id","conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_calls_workspace_outcome" ON "calls" USING btree ("workspace_id","outcome");--> statement-breakpoint
CREATE INDEX "idx_calls_workspace_created" ON "calls" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_qualifications_lead" ON "qualification_results" USING btree ("workspace_id","lead_id");--> statement-breakpoint
CREATE INDEX "idx_qualifications_intent" ON "qualification_results" USING btree ("workspace_id","buyer_intent");--> statement-breakpoint
CREATE INDEX "idx_appointments_workspace_time" ON "appointments" USING btree ("workspace_id","scheduled_start_at");--> statement-breakpoint
CREATE INDEX "idx_appointments_workspace_status" ON "appointments" USING btree ("workspace_id","status");--> statement-breakpoint
CREATE INDEX "idx_follow_ups_workspace_time" ON "follow_ups" USING btree ("workspace_id","scheduled_at");--> statement-breakpoint
CREATE INDEX "idx_follow_ups_workspace_status" ON "follow_ups" USING btree ("workspace_id","status");