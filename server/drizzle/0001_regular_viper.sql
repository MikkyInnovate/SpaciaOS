CREATE TYPE "public"."client_role" AS ENUM('owner', 'admin', 'sales_manager', 'sales_agent', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."internal_role" AS ENUM('super_admin', 'operations', 'support', 'technical_admin');--> statement-breakpoint
CREATE TYPE "public"."system_event_status" AS ENUM('emitted', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."audit_actor_type" AS ENUM('user', 'system', 'api_key', 'ai_agent');--> statement-breakpoint
CREATE TYPE "public"."audit_severity" AS ENUM('info', 'warning', 'critical');--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role" "client_role" NOT NULL,
	"permission" varchar(100) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar(64) NOT NULL,
	"event_name" varchar(100) NOT NULL,
	"aggregate_type" varchar(50) NOT NULL,
	"aggregate_id" varchar(64) NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" "system_event_status" DEFAULT 'emitted' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_workspace_id_workspaces_id_fk";
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "actor_type" "audit_actor_type" DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "severity" "audit_severity" DEFAULT 'info' NOT NULL;--> statement-breakpoint
ALTER TABLE "system_events" ADD CONSTRAINT "system_events_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_role_permission" ON "role_permissions" USING btree ("role","permission");--> statement-breakpoint
CREATE INDEX "idx_system_events_tenant_timeline" ON "system_events" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_system_events_aggregate" ON "system_events" USING btree ("workspace_id","aggregate_type","aggregate_id");--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE restrict ON UPDATE no action;