const { Pool } = require('@neondatabase/serverless');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkStudents() {
  try {
    const client = await pool.connect();
    console.log('🔍 Checking existing students and their approval status...\n');
    
    const result = await client.query(`
      SELECT 
        id, 
        first_name, 
        last_name, 
        email, 
        role, 
        approval_status, 
        approved_at, 
        created_at
      FROM users 
      WHERE role = 'student'
      ORDER BY created_at DESC
    `);
    
    console.log(`Found ${result.rows.length} students:`);
    result.rows.forEach((student, index) => {
      console.log(`${index + 1}. ${student.first_name} ${student.last_name} (${student.email})`);
      console.log(`   Role: ${student.role}`);
      console.log(`   Approval Status: ${student.approval_status}`);
      console.log(`   Approved At: ${student.approved_at}`);
      console.log(`   Created At: ${student.created_at}`);
      console.log('');
    });
    
    client.release();
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkStudents();
