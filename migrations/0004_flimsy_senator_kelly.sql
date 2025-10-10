CREATE TABLE "instructor_programs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"instructor_id" varchar NOT NULL,
	"program_id" varchar NOT NULL,
	"assigned_at" timestamp DEFAULT now(),
	"assigned_by" varchar,
	"is_active" boolean DEFAULT true,
	CONSTRAINT "unique_instructor_program" UNIQUE("instructor_id","program_id")
);
--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "program_id" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "instructor_programs" ADD CONSTRAINT "instructor_programs_instructor_id_users_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instructor_programs" ADD CONSTRAINT "instructor_programs_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instructor_programs" ADD CONSTRAINT "instructor_programs_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;