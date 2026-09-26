CREATE TABLE "idempotency_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar(64) NOT NULL,
	"key" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"status_code" integer,
	"response_body" jsonb,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_idempotency_keys_workspace_key" UNIQUE("workspace_id","key")
);
--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "external_id" varchar(255);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "metadata" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "idempotency_keys" ADD CONSTRAINT "idempotency_keys_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_idempotency_keys_expires" ON "idempotency_keys" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_idempotency_keys_workspace_status" ON "idempotency_keys" USING btree ("workspace_id","status");--> statement-breakpoint
CREATE INDEX "idx_leads_workspace_email" ON "leads" USING btree ("workspace_id","email");--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "uq_leads_workspace_external_id" UNIQUE("workspace_id","external_id");