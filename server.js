// Traditional CommonJS server for Azure App Service compatibility
const express = require('express');
const cors = require('cors');
const path = require('path');

// Environment variables
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const USE_AZURE_KEY_VAULT = process.env.USE_AZURE_KEY_VAULT === 'true';
const AZURE_KEY_VAULT_URL = process.env.AZURE_KEY_VAULT_URL;

console.log('Starting Smart Expense Tracker API...');
console.log('Environment:', NODE_ENV);
console.log('Using Azure Key Vault:', USE_AZURE_KEY_VAULT);
console.log('Key Vault URL:', AZURE_KEY_VAULT_URL);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    useKeyVault: USE_AZURE_KEY_VAULT,
    keyVaultUrl: AZURE_KEY_VAULT_URL || 'not configured'
  });
});

// Database configuration with fallback
let dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'smart_expense_tracker',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password'
};

// Key Vault integration (if enabled)
if (USE_AZURE_KEY_VAULT && AZURE_KEY_VAULT_URL) {
  console.log('Attempting to load secrets from Azure Key Vault...');
  
  // Try to load Azure SDK
  try {
    const { DefaultAzureCredential } = require('@azure/identity');
    const { SecretClient } = require('@azure/keyvault-secrets');
    
    const credential = new DefaultAzureCredential();
    const client = new SecretClient(AZURE_KEY_VAULT_URL, credential);
    
    // Async function to load secrets
    const loadSecrets = async () => {
      try {
        const dbPassword = await client.getSecret('db-password');
        const dbHost = await client.getSecret('db-host');
        const dbName = await client.getSecret('db-name');
        const dbUser = await client.getSecret('db-user');
        
        dbConfig = {
          host: dbHost.value,
          port: 5432,
          database: dbName.value,
          user: dbUser.value,
          password: dbPassword.value
        };
        
        console.log('Successfully loaded database configuration from Key Vault');
      } catch (error) {
        console.error('Failed to load secrets from Key Vault:', error.message);
        console.log('Falling back to environment variables');
      }
    };
    
    // Load secrets but don't block server startup
    loadSecrets().catch(err => {
      console.error('Key Vault initialization failed:', err.message);
    });
    
  } catch (error) {
    console.error('Azure SDK not available:', error.message);
    console.log('Using environment variables for database configuration');
  }
}

// Simple API routes
app.get('/api/expenses', (req, res) => {
  res.json({ 
    message: 'Expenses endpoint', 
    dbConfig: {
      host: dbConfig.host,
      database: dbConfig.database,
      user: dbConfig.user,
      // Don't expose password
    }
  });
});

app.get('/api/categories', (req, res) => {
  res.json({ message: 'Categories endpoint' });
});

app.get('/api/analytics', (req, res) => {
  res.json({ message: 'Analytics endpoint' });
});

// Catch-all for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});