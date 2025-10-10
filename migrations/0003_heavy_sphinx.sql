ALTER TABLE "users" ADD COLUMN "is_archived" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "archived_at" timestamp;