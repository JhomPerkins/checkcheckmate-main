ALTER TABLE "users" ADD COLUMN "approval_status" text DEFAULT 'approved';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "approved_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "approved_by" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;