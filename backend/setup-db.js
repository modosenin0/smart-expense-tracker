import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

const connectionString = "postgresql://dbadmin:calambur01@smart-expense-tracker-db.postgres.database.azure.com/postgres?sslmode=require";

async function setupDatabase() {
  const client = new Client({
    connectionString: connectionString
  });

  try {
    console.log('Connecting to Azure PostgreSQL...');
    await client.connect();
    console.log('Connected successfully!');

    // Read the SQL script
    const sqlScript = fs.readFileSync(path.join(process.cwd(), '..', 'docs', 'SQL-scripts.sql'), 'utf8');
    
    console.log('Running database schema setup...');
    await client.query(sqlScript);
    console.log('Database schema created successfully!');

  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

setupDatabase();