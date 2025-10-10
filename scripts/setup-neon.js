#!/usr/bin/env node

import { config } from 'dotenv';
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

// Load environment variables
config();

console.log('🚀 Setting up Neon Database for CHECKmate LMS\n');

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.log('❌ DATABASE_URL is not set!\n');
  
  console.log('Please follow these steps to set up your Neon database:');
  console.log('1. Go to https://console.neon.tech/');
  console.log('2. Sign up for a free account');
  console.log('3. Create a new project');
  console.log('4. Copy the connection string from the dashboard');
  console.log('5. Set the DATABASE_URL environment variable:\n');
  
  console.log('   Windows (PowerShell):');
  console.log('   $env:DATABASE_URL="postgresql://username:password@hostname:port/database?sslmode=require"');
  console.log('');
  console.log('   Windows (Command Prompt):');
  console.log('   set DATABASE_URL=postgresql://username:password@hostname:port/database?sslmode=require');
  console.log('');
  console.log('   Linux/Mac:');
  console.log('   export DATABASE_URL="postgresql://username:password@hostname:port/database?sslmode=require"');
  console.log('');
  console.log('   Or create a .env file in the project root with:');
  console.log('   DATABASE_URL=postgresql://username:password@hostname:port/database?sslmode=require');
  
  process.exit(1);
}

console.log('✅ DATABASE_URL is set');
console.log(`   Using: ${process.env.DATABASE_URL.replace(/:[^:@]+@/, ':***@')}\n`);

try {
  console.log('🔄 Running database migrations...');
  execSync('npm run db:push', { stdio: 'inherit' });
  console.log('✅ Database migrations completed\n');

  console.log('🌱 Seeding database with sample data...');
  execSync('npm run db:seed', { stdio: 'inherit' });
  console.log('✅ Database seeding completed\n');

  console.log('🎉 Neon database setup complete!');
  console.log('You can now start the application with: npm run dev\n');

  console.log('📝 Default admin credentials:');
  console.log('   Email: admin@university.edu');
  console.log('   Password: admin123');
  console.log('   Role: administrator\n');

} catch (error) {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
}

