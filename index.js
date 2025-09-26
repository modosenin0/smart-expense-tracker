import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import pool from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import configManager from "./config/configManager.js";

// Load environment variables first
dotenv.config();

// Initialize configuration and Application Insights
async function initializeApp() {
  try {
    console.log('🚀 Starting Smart Expense Tracker API...');
    
    // Initialize configuration manager (loads secrets from Key Vault)
    await configManager.initialize();
    const config = configManager.getConfig();
    
    // Initialize Application Insights with Key Vault connection string
    const appInsights = require('applicationinsights');
    appInsights.setup(config.appInsightsConnectionString)
      .setAutoDependencyCorrelation(true)
      .setAutoCollectRequests(true)
      .setAutoCollectPerformance(true, true)
      .setAutoCollectExceptions(true)
      .setAutoCollectDependencies(true)
      .setAutoCollectConsole(true)
      .setUseDiskRetryCaching(true)
      .setSendLiveMetrics(true)
      .start();
    
    return { config, insights: appInsights };
  } catch (error) {
    console.error('❌ Failed to initialize application:', error.message);
    process.exit(1);
  }
}
const app = express();

// Configure CORS for both development and production
const corsOptions = {
  origin: [
    "http://localhost:3000", // React dev server
    "https://ambitious-bay-055468303.1.azurestaticapps.net", // Azure Static Web App
    /\.azurestaticapps\.net$/ // Any Azure Static Web App subdomain
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());

// Health check endpoint (required for Azure App Service)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'Smart Expense Tracker API'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Smart Expense Tracker API is running!',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      expenses: '/api/expenses',
      categories: '/api/categories',
      analytics: '/api/analytics',
      health: '/health'
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/', healthRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    message: `Route ${req.originalUrl} not found`
  });
});

// Start server
async function startServer() {
  try {
    // Initialize app configuration
    const { config } = await initializeApp();
    
    // Test database connection
    console.log('🗄️  Testing database connection...');
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Database connection successful');
    
    // Start HTTP server
    const PORT = process.env.PORT || 8080;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/health`);
      console.log(`📱 API Base URL: http://localhost:${PORT}/api`);
      console.log('🔒 Key Vault integration: Active');
      console.log('📊 Application Insights: Active');
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start the application
startServer().catch(error => {
  console.error('💥 Fatal error starting application:', error);
  process.exit(1);
});