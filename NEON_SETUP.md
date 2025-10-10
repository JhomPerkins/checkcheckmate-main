# Neon Database Setup Guide

This guide will help you set up your CHECKmate Learning Management System to use Neon PostgreSQL database.

## Prerequisites

- Node.js installed on your system
- A Neon account (free tier available)

## Step 1: Create a Neon Database

1. Go to [https://console.neon.tech/](https://console.neon.tech/)
2. Sign up for a free account or log in
3. Click "Create Project"
4. Choose a project name (e.g., "checkmate-lms")
5. Select a region closest to you
6. Click "Create Project"

## Step 2: Get Your Connection String

1. Once your project is created, you'll see the dashboard
2. In the "Connection Details" section, copy the connection string
3. It will look like: `postgresql://username:password@hostname:port/database?sslmode=require`

## Step 3: Set Environment Variable

### Option A: Using .env file (Recommended)

Create a `.env` file in your project root:

```bash
# Create .env file
touch .env
```

Add your DATABASE_URL to the `.env` file:

```env
DATABASE_URL=postgresql://username:password@hostname:port/database?sslmode=require
```

### Option B: Using Command Line

#### Windows (PowerShell):
```powershell
$env:DATABASE_URL="postgresql://username:password@hostname:port/database?sslmode=require"
```

#### Windows (Command Prompt):
```cmd
set DATABASE_URL=postgresql://username:password@hostname:port/database?sslmode=require
```

#### Linux/Mac:
```bash
export DATABASE_URL="postgresql://username:password@hostname:port/database?sslmode=require"
```

## Step 4: Run Database Setup

Once you have set the DATABASE_URL, run the setup script:

```bash
npm run setup:neon
```

This will:
- Run database migrations to create all tables
- Seed the database with sample data
- Create test users (admin, instructors, students)

## Step 5: Start the Application

```bash
npm run dev
```

## Test Credentials

After seeding, you can use these credentials to test the system:

- **Administrator**: `admin@university.edu` / `password123`
- **Instructor**: `sarah.johnson@university.edu` / `password123`
- **Student**: `alice.smith@student.edu` / `password123`

## Troubleshooting

### Error: "password authentication failed for user 'neondb_owner'"

This usually means:
1. The DATABASE_URL is not set correctly
2. The connection string is malformed
3. The database credentials are incorrect

**Solution**: Double-check your DATABASE_URL and make sure it's properly formatted.

### Error: "relation does not exist"

This means the database tables haven't been created yet.

**Solution**: Run `npm run db:push` to create the tables.

### Error: "no such table: users"

This means the database is empty and needs to be seeded.

**Solution**: Run `npm run db:seed` to populate the database with sample data.

## Database Schema

The system creates the following tables:
- `users` - User accounts (students, instructors, administrators)
- `courses` - Course information
- `enrollments` - Student course enrollments
- `assignments` - Course assignments
- `submissions` - Student assignment submissions
- `grades` - Assignment grades and feedback
- `announcements` - Course announcements
- `materials` - Course materials and resources

## Production Considerations

For production deployment:
1. Use a strong, unique password for your database
2. Enable connection pooling
3. Set up database backups
4. Monitor database performance
5. Consider upgrading to a paid Neon plan for better performance

## Support

If you encounter any issues:
1. Check the Neon console for database status
2. Verify your connection string format
3. Ensure all environment variables are set correctly
4. Check the application logs for detailed error messages
