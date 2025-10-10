import { Pool } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function seedSampleData() {
  let client;
  
  try {
    client = await pool.connect();
    console.log('🌱 Seeding sample data...\n');
    
    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🧹 Clearing existing data...');
    await client.query('DELETE FROM grades');
    await client.query('DELETE FROM submissions');
    await client.query('DELETE FROM assignments');
    await client.query('DELETE FROM materials');
    await client.query('DELETE FROM announcements');
    await client.query('DELETE FROM enrollments');
    await client.query('DELETE FROM courses');
    await client.query('DELETE FROM users');
    console.log('✅ Existing data cleared\n');
    
    // 1. Create Users
    console.log('👥 Creating users...');
    
    // Hash passwords properly
    const saltRounds = 12;
    const users = [
      {
        first_name: 'Dr. Sarah',
        last_name: 'Johnson',
        email: 'sarah.johnson@university.edu',
        password: await bcrypt.hash('password123', saltRounds),
        role: 'instructor',
        student_id: null
      },
      {
        first_name: 'Prof. Michael',
        last_name: 'Chen',
        email: 'michael.chen@university.edu',
        password: await bcrypt.hash('password123', saltRounds),
        role: 'instructor',
        student_id: null
      },
      {
        first_name: 'Alice',
        last_name: 'Smith',
        email: 'alice.smith@student.edu',
        password: await bcrypt.hash('password123', saltRounds),
        role: 'student',
        student_id: 'STU001'
      },
      {
        first_name: 'Bob',
        last_name: 'Wilson',
        email: 'bob.wilson@student.edu',
        password: await bcrypt.hash('password123', saltRounds),
        role: 'student',
        student_id: 'STU002'
      },
      {
        first_name: 'Carol',
        last_name: 'Davis',
        email: 'carol.davis@student.edu',
        password: await bcrypt.hash('password123', saltRounds),
        role: 'student',
        student_id: 'STU003'
      },
      {
        first_name: 'Admin',
        last_name: 'User',
        email: 'admin@university.edu',
        password: await bcrypt.hash('password123', saltRounds),
        role: 'administrator',
        student_id: null
      }
    ];
    
    const createdUsers = [];
    for (const user of users) {
      const result = await client.query(`
        INSERT INTO users (first_name, last_name, email, password, role, student_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, first_name, last_name, email, role
      `, [user.first_name, user.last_name, user.email, user.password, user.role, user.student_id]);
      createdUsers.push(result.rows[0]);
    }
    
    const instructor1 = createdUsers[0];
    const instructor2 = createdUsers[1];
    const student1 = createdUsers[2];
    const student2 = createdUsers[3];
    const student3 = createdUsers[4];
    const admin = createdUsers[5];
    console.log(`✅ Created ${createdUsers.length} users`);
    
    // 2. Create Courses - No sample courses created
    console.log('\n📚 Skipping course creation - no sample courses needed');
    const createdCourses = [];
    const cs101 = null;
    const cs201 = null;
    const cs301 = null;
    const cs401 = null;
    
    // 3. Create Enrollments - Skipped (no courses)
    console.log('\n🎓 Skipping enrollments - no courses available');
    
    // 4. Create Assignments - Skipped (no courses)
    console.log('\n📝 Skipping assignments - no courses available');
    const createdAssignments = [];
    
    // 5. Create Announcements - Skipped (no courses)
    console.log('\n📢 Skipping announcements - no courses available');
    const announcements = [];
    
    // 6. Create Materials - Skipped (no courses)
    console.log('\n📖 Skipping materials - no courses available');
    const materials = [];
    
    // 7. Create Sample Submissions - Skipped (no assignments)
    console.log('\n📄 Skipping submissions - no assignments available');
    const createdSubmissions = [];
    
    // 8. Create Sample Grades - Skipped (no submissions)
    console.log('\n📊 Skipping grades - no submissions available');
    const grades = [];
    
    console.log('\n🎉 Sample data seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`  👥 Users: ${createdUsers.length}`);
    console.log(`  📚 Courses: ${createdCourses.length} (skipped - no sample courses)`);
    console.log(`  🎓 Enrollments: 0 (skipped - no courses)`);
    console.log(`  📝 Assignments: ${createdAssignments.length} (skipped - no courses)`);
    console.log(`  📢 Announcements: ${announcements.length} (skipped - no courses)`);
    console.log(`  📖 Materials: ${materials.length} (skipped - no courses)`);
    console.log(`  📄 Submissions: ${createdSubmissions.length} (skipped - no assignments)`);
    console.log(`  📊 Grades: ${grades.length} (skipped - no submissions)`);
    
    console.log('\n🔑 Test Credentials:');
    console.log('  Instructor: sarah.johnson@university.edu / password123');
    console.log('  Student: alice.smith@student.edu / password123');
    console.log('  Admin: admin@university.edu / password123');
    console.log('  (All passwords are properly hashed in the database)');
    
  } catch (error) {
    console.error('❌ Error seeding data:', error.message);
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

seedSampleData();
