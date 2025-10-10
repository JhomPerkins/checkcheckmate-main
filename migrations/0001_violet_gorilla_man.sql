CREATE TABLE "plagiarism_reports" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" varchar NOT NULL,
	"matches" jsonb NOT NULL,
	"highest_similarity" integer NOT NULL,
	"is_flagged" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "programs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "programs_name_unique" UNIQUE("name"),
	CONSTRAINT "programs_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "embedding" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "year_level" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "program_id" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_active" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "plagiarism_reports" ADD CONSTRAINT "plagiarism_reports_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE no action ON UPDATE no action;