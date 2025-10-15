/**
 * Seed AI Test Data
 * Creates sample submissions to test AI analytics
 */

import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function seedAITestData() {
  let client;
  
  try {
    client = await pool.connect();
    console.log('🧪 Seeding AI test data...\n');
    
    // Get a sample assignment
    const assignmentResult = await client.query('SELECT id FROM assignments LIMIT 1');
    if (assignmentResult.rows.length === 0) {
      console.log('❌ No assignments found. Please create assignments first.');
      return;
    }
    const assignmentId = assignmentResult.rows[0].id;
    
    // Get sample students
    const studentResult = await client.query("SELECT id FROM users WHERE role = 'student' LIMIT 3");
    if (studentResult.rows.length === 0) {
      console.log('❌ No students found. Please create students first.');
      return;
    }
    
    // Create sample submissions with AI grading data
    const sampleSubmissions = [
      {
        assignment_id: assignmentId,
        student_id: studentResult.rows[0].id,
        content: "This is a sample essay about artificial intelligence in education. AI systems can help automate grading and provide personalized learning experiences.",
        status: 'graded',
        ai_graded: true,
        ai_confidence: '85.5',
        ai_processing_time: 1250,
        ai_graded_at: new Date().toISOString(),
        submitted_at: new Date().toISOString()
      },
      {
        assignment_id: assignmentId,
        student_id: studentResult.rows[1]?.id || studentResult.rows[0].id,
        content: "Machine learning algorithms are transforming how we approach education. These systems can analyze student performance and adapt teaching methods accordingly.",
        status: 'graded',
        ai_graded: true,
        ai_confidence: '78.2',
        ai_processing_time: 980,
        ai_graded_at: new Date().toISOString(),
        submitted_at: new Date().toISOString()
      },
      {
        assignment_id: assignmentId,
        student_id: studentResult.rows[2]?.id || studentResult.rows[0].id,
        content: "The future of education lies in personalized learning powered by artificial intelligence. Students can receive customized feedback and learning paths.",
        status: 'graded',
        ai_graded: true,
        ai_confidence: '92.1',
        ai_processing_time: 1450,
        ai_graded_at: new Date().toISOString(),
        submitted_at: new Date().toISOString()
      }
    ];
    
    // Insert sample submissions
    for (const submission of sampleSubmissions) {
      const result = await client.query(`
        INSERT INTO submissions (assignment_id, student_id, content, status, ai_graded, ai_confidence, ai_processing_time, ai_graded_at, submitted_at, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        RETURNING id
      `, [
        submission.assignment_id,
        submission.student_id,
        submission.content,
        submission.status,
        submission.ai_graded,
        submission.ai_confidence,
        submission.ai_processing_time,
        submission.ai_graded_at,
        submission.submitted_at
      ]);
      
      console.log(`✅ Created submission ${result.rows[0].id} with AI grading data`);
    }
    
    // Create some plagiarism reports
    const plagiarismReports = [
      {
        submission_id: (await client.query('SELECT id FROM submissions WHERE ai_graded = true LIMIT 1')).rows[0].id,
        matches: JSON.stringify([
          { id: 'sim_1', similarity: 75, studentId: 'student_123', content: 'Sample similar content...' }
        ]),
        highest_similarity: 75,
        is_flagged: true
      }
    ];
    
    for (const report of plagiarismReports) {
      await client.query(`
        INSERT INTO plagiarism_reports (submission_id, matches, highest_similarity, is_flagged, created_at)
        VALUES ($1, $2, $3, $4, NOW())
      `, [
        report.submission_id,
        report.matches,
        report.highest_similarity,
        report.is_flagged
      ]);
      
      console.log(`✅ Created plagiarism report for submission ${report.submission_id}`);
    }
    
    // Update assignment AI grading count
    await client.query(`
      UPDATE assignments 
      SET ai_grading_count = ai_grading_count + $1, updated_at = NOW()
      WHERE id = $2
    `, [sampleSubmissions.length, assignmentId]);
    
    console.log(`\n🎉 AI test data seeded successfully!`);
    console.log(`📊 Created ${sampleSubmissions.length} AI-graded submissions`);
    console.log(`📊 Created ${plagiarismReports.length} plagiarism reports`);
    console.log(`📊 Updated assignment AI grading count`);
    
    console.log('\n🔍 Testing AI Analytics...');
    
    // Test AI analytics query
    const aiStatsResult = await client.query(`
      SELECT 
        COUNT(*) as total_submissions,
        COUNT(CASE WHEN ai_graded = true THEN 1 END) as ai_graded_submissions,
        ROUND(
          CASE 
            WHEN COUNT(*) > 0 THEN 
              (COUNT(CASE WHEN ai_graded = true THEN 1 END)::float / COUNT(*)) * 100 
            ELSE 0 
          END, 2
        ) as ai_usage_percentage,
        ROUND(AVG(CAST(ai_confidence AS DECIMAL)), 2) as avg_confidence,
        ROUND(AVG(ai_processing_time)) as avg_processing_time
      FROM submissions
    `);
    
    const plagiarismCountResult = await client.query('SELECT COUNT(*) as count FROM plagiarism_reports');
    
    const stats = aiStatsResult.rows[0];
    const plagiarismCount = plagiarismCountResult.rows[0].count;
    
    console.log('\n📈 AI Analytics Results:');
    console.log(`   Total Submissions: ${stats.total_submissions}`);
    console.log(`   AI Graded: ${stats.ai_graded_submissions}`);
    console.log(`   AI Usage: ${stats.ai_usage_percentage}%`);
    console.log(`   Avg Confidence: ${stats.avg_confidence}%`);
    console.log(`   Avg Processing Time: ${stats.avg_processing_time}ms`);
    console.log(`   Plagiarism Reports: ${plagiarismCount}`);
    
  } catch (error) {
    console.error('❌ Error seeding AI test data:', error.message);
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

seedAITestData();
