-- AI Analytics and Tracking Migration
-- Add AI usage tracking to submissions table

ALTER TABLE "submissions" 
ADD COLUMN IF NOT EXISTS "ai_graded" BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS "ai_confidence" DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS "ai_processing_time" INTEGER,
ADD COLUMN IF NOT EXISTS "ai_graded_at" TIMESTAMP;

-- Add AI usage tracking to assignments table
ALTER TABLE "assignments" 
ADD COLUMN IF NOT EXISTS "ai_grading_enabled" BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS "ai_grading_count" INTEGER DEFAULT 0;

-- Create AI statistics tracking table
CREATE TABLE IF NOT EXISTS "ai_statistics" (
  "id" VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  "date" DATE DEFAULT CURRENT_DATE,
  "total_submissions" INTEGER DEFAULT 0,
  "ai_graded_submissions" INTEGER DEFAULT 0,
  "avg_confidence" DECIMAL(5,2) DEFAULT 0,
  "avg_processing_time" INTEGER DEFAULT 0,
  "plagiarism_detected" INTEGER DEFAULT 0,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS "idx_ai_statistics_date" ON "ai_statistics" ("date");
CREATE INDEX IF NOT EXISTS "idx_submissions_ai_graded" ON "submissions" ("ai_graded");

-- Add AI analytics to grades table
ALTER TABLE "grades" 
ADD COLUMN IF NOT EXISTS "ai_generated" BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS "ai_confidence" DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS "ai_rubric_scores" TEXT; -- JSON string for AI rubric breakdown
