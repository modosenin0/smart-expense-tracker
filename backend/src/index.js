import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import pool from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js"
import configManager from "./config/configManager.js";

// Load environment variables first
dotenv.config();

// Initialize configuration and Application Insights
// Global variables for configuration and insights
let config;
let insights;

async function initializeApp() {
  try {
    console.log('🚀 Starting Smart Expense Tracker API...');
    
    // Initialize configuration manager (loads secrets from Key Vault)
    await configManager.initialize();
    config = configManager.getConfig();
    
    // Initialize Application Insights with Key Vault connection string
    const appInsights = (await import('applicationinsights')).default;
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
    
    insights = appInsights;
    
    return { config, insights };
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
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Application Insights middleware for custom tracking
if (insights) {
  app.use((req, res, next) => {
    const startTime = Date.now();
    
    // Log request
    insights.telemetry.trackTrace(`${req.method} ${req.url}`, 1, {
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent') || 'Unknown'
    });

    // Track response time
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      insights.telemetry.trackMetric('request_duration_ms', duration, {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode.toString()
      });

      // Track custom events for important endpoints
      if (req.url.includes('/auth/login') && res.statusCode === 200) {
        insights.telemetry.trackEvent('user_login_success');
      } else if (req.url.includes('/auth/register') && res.statusCode === 201) {
        insights.telemetry.trackEvent('user_registration_success');
      } else if (req.url.includes('/expenses') && req.method === 'POST' && res.statusCode === 201) {
        insights.telemetry.trackEvent('expense_created');
      }
    });

    next();
  });
}

app.use("/api/auth", authRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/analytics", analyticsRoutes);

app.get("/", (req, res) => {
  res.send("Smart Expense Tracker API is running 🚀");
});

app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ db_time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Initialize and start server
if (process.env.NODE_ENV !== "test") {
  initializeApp().then(() => {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🔍 Application Insights: ${insights ? 'Enabled' : 'Disabled'}`);
    });
  }).catch(error => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  });
} else {
  // For tests, initialize without starting server
  initializeApp().catch(error => {
    console.error('❌ Failed to initialize for tests:', error);
  });
}

export default app;
