ALTER TABLE "announcements" DROP CONSTRAINT "announcements_created_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "courses" DROP CONSTRAINT "courses_instructor_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "enrollments" DROP CONSTRAINT "enrollments_student_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "materials" DROP CONSTRAINT "materials_created_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "submissions" DROP CONSTRAINT "submissions_student_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_instructor_id_users_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;