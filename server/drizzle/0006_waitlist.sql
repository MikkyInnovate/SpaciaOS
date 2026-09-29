CREATE TABLE "waitlist_subscribers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"sequence_number" integer NOT NULL,
	"referral_code" varchar(24) NOT NULL,
	"referred_by" varchar(24),
	"ip_hash" varchar(64),
	"user_agent" varchar(255),
	"status" varchar(32) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_waitlist_email" UNIQUE("email"),
	CONSTRAINT "uq_waitlist_referral" UNIQUE("referral_code")
);
--> statement-breakpoint
CREATE INDEX "idx_waitlist_sequence" ON "waitlist_subscribers" USING btree ("sequence_number");
--> statement-breakpoint
CREATE INDEX "idx_waitlist_created" ON "waitlist_subscribers" USING btree ("created_at");
