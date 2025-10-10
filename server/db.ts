import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Always use Neon PostgreSQL database
if (!process.env.DATABASE_URL) {
  throw new Error(`
❌ DATABASE_URL is required but not set!

Please set up your Neon database:
1. Go to https://console.neon.tech/
2. Sign up for a free account
3. Create a new project
4. Copy the connection string from the dashboard
5. Set the DATABASE_URL environment variable:
   export DATABASE_URL="postgresql://username:password@hostname:port/database?sslmode=require"

Or create a .env file in the project root with:
   DATABASE_URL=postgresql://username:password@hostname:port/database?sslmode=require
`);
}

// Always use PostgreSQL (Neon)
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool, schema });

export { pool, db };