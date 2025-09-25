import express from 'express';
import configManager from '../config/configManager.js';

const router = express.Router();

// Health check endpoint
router.get('/health', async (req, res) => {
    try {
        const healthStatus = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            uptime: process.uptime(),
            keyVault: null,
            database: null
        };

        // Check Key Vault connectivity
        try {
            const keyVaultHealth = await configManager.healthCheck();
            healthStatus.keyVault = keyVaultHealth;
        } catch (error) {
            healthStatus.keyVault = { status: 'unhealthy', error: error.message };
        }

        // Check database connectivity
        try {
            const pool = require('../config/db.js');
            await pool.query('SELECT 1');
            healthStatus.database = { status: 'healthy' };
        } catch (error) {
            healthStatus.database = { status: 'unhealthy', error: error.message };
        }

        // Determine overall status
        const isHealthy = healthStatus.keyVault?.status === 'healthy' && 
                         healthStatus.database?.status === 'healthy';
        
        healthStatus.status = isHealthy ? 'healthy' : 'unhealthy';

        res.status(isHealthy ? 200 : 503).json(healthStatus);
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

// Security info endpoint (non-sensitive information only)
router.get('/security-info', async (req, res) => {
    try {
        const config = configManager.getConfig();
        
        res.json({
            keyVault: {
                name: config.keyVaultName,
                status: 'configured'
            },
            authentication: {
                jwtEnabled: !!config.jwtSecret,
                tokenExpiry: config.jwtExpiresIn
            },
            monitoring: {
                applicationInsights: !!config.appInsightsConnectionString,
                status: 'active'
            },
            environment: config.nodeEnv,
            securityFeatures: [
                'Azure Key Vault integration',
                'Managed Identity authentication',
                'Automated secret rotation',
                'Application Insights monitoring',
                'Secure database connections'
            ]
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to retrieve security information',
            message: error.message
        });
    }
});

// Force refresh secrets (admin endpoint)
router.post('/refresh-secrets', async (req, res) => {
    try {
        await configManager.refreshSecrets();
        
        res.json({
            status: 'success',
            message: 'Secrets refreshed from Azure Key Vault',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to refresh secrets',
            error: error.message
        });
    }
});

export default router;