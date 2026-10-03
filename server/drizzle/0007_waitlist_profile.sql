-- Waitlist profile details (step 2 of the waitlist form). Additive only.
-- Hand-trimmed: the generated diff also re-created tables/columns that already exist in the
-- database (snapshot drift from earlier hand-written migrations), so only these columns are applied.
ALTER TABLE "waitlist_subscribers" ADD COLUMN IF NOT EXISTS "full_name" varchar(120);--> statement-breakpoint
ALTER TABLE "waitlist_subscribers" ADD COLUMN IF NOT EXISTS "company_name" varchar(160);--> statement-breakpoint
ALTER TABLE "waitlist_subscribers" ADD COLUMN IF NOT EXISTS "company_website" varchar(255);--> statement-breakpoint
ALTER TABLE "waitlist_subscribers" ADD COLUMN IF NOT EXISTS "team_size" varchar(16);
