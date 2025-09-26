import AzureKeyVaultManager from './keyVault.js';

class ConfigManager {
    constructor() {
        this.keyVaultManager = null;
        this.config = {};
        this.isInitialized = false;
    }

    async initialize() {
        console.log('🚀 Initializing configuration...');
        
        // Check if we should use Key Vault
        const useKeyVault = process.env.USE_AZURE_KEY_VAULT === 'true';
        
        if (useKeyVault) {
            try {
                console.log('🔐 Using Azure Key Vault for configuration...');
                // Initialize Key Vault manager
                this.keyVaultManager = new AzureKeyVaultManager();
                
                // Load all secrets from Key Vault
                const secrets = await this.keyVaultManager.getAllSecrets();
                
                // Build configuration object
                this.config = {
                    // Server configuration
                    port: process.env.PORT || 5000,
                    nodeEnv: process.env.NODE_ENV || 'development',
                
                // Database configuration
                databaseUrl: await this.keyVaultManager.getDatabaseUrl(),
                
                // JWT configuration
                jwtSecret: secrets.JWT_SECRET,
                jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
                
                // Application Insights
                appInsightsConnectionString: secrets.APPLICATIONINSIGHTS_CONNECTION_STRING,
                
                // Key Vault info
                keyVaultName: this.keyVaultManager.keyVaultName
            };
            
            this.isInitialized = true;
            console.log('✅ Configuration initialized successfully with Key Vault');
            console.log(`🔐 Using Key Vault: ${this.config.keyVaultName}`);
            console.log(`🌍 Environment: ${this.config.nodeEnv}`);
            
            } catch (error) {
                console.error('❌ Failed to initialize Key Vault configuration:', error.message);
                console.log('🔄 Falling back to environment variables...');
                
                // Fallback to environment variables
                this.config = {
                    port: process.env.PORT || 5000,
                    nodeEnv: process.env.NODE_ENV || 'development',
                    databaseUrl: process.env.DATABASE_URL,
                    jwtSecret: process.env.JWT_SECRET,
                    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
                    appInsightsConnectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
                    keyVaultName: 'fallback-env-vars'
                };
                
                this.isInitialized = true;
                console.log('✅ Configuration initialized with environment variables fallback');
            }
        } else {
            console.log('📝 Using environment variables for configuration...');
            
            this.config = {
                port: process.env.PORT || 5000,
                nodeEnv: process.env.NODE_ENV || 'development',
                databaseUrl: process.env.DATABASE_URL,
                jwtSecret: process.env.JWT_SECRET,
                jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
                appInsightsConnectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
                keyVaultName: 'environment-variables'
            };
            
            this.isInitialized = true;
            console.log('✅ Configuration initialized with environment variables');
        }
    }

    getConfig() {
        if (!this.isInitialized) {
            throw new Error('Configuration not initialized. Call initialize() first.');
        }
        return this.config;
    }

    async refreshSecrets() {
        if (!this.keyVaultManager) {
            throw new Error('Key Vault manager not initialized');
        }
        
        console.log('🔄 Refreshing secrets from Key Vault...');
        this.keyVaultManager.clearCache();
        
        // Reload secrets
        const secrets = await this.keyVaultManager.getAllSecrets();
        
        // Update configuration
        this.config.jwtSecret = secrets.JWT_SECRET;
        this.config.databaseUrl = await this.keyVaultManager.getDatabaseUrl();
        this.config.appInsightsConnectionString = secrets.APPLICATIONINSIGHTS_CONNECTION_STRING;
        
        console.log('✅ Secrets refreshed successfully');
    }

    async healthCheck() {
        if (!this.keyVaultManager) {
            return { status: 'unhealthy', error: 'Key Vault manager not initialized' };
        }
        
        return await this.keyVaultManager.healthCheck();
    }
}

// Create singleton instance
const configManager = new ConfigManager();

export default configManager;