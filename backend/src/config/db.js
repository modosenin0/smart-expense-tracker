import pkg from "pg";
import configManager from "./configManager.js";

const { Pool } = pkg;

// Initialize pool after configuration is ready
let pool = null;

async function initializeDatabase() {
  try {
    // Wait for configuration to be initialized
    if (!configManager.isInitialized) {
      await configManager.initialize();
    }
    
    const config = configManager.getConfig();
    
    pool = new Pool({
      connectionString: config.databaseUrl,
    });

    await pool.connect();
    console.log("✅ PostgreSQL connected");
    return pool;
  } catch (err) {
    console.error("❌ DB connection error", err);
    throw err;
  }
}

// Export a function that returns the pool (ensures it's initialized)
async function getPool() {
  if (!pool) {
    await initializeDatabase();
  }
  return pool;
}

export default { getPool, initializeDatabase };
