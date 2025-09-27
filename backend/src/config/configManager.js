// Conditional import - only import Azure Key Vault when needed
let AzureKeyVaultManager = null;

class ConfigManager {
    constructor() {
        this.keyVaultManager = null;
        this.config = {};
        this.isInitialized = false;
    }

    async initialize() {
        console.log('🚀 Initializing configuration...');
        
        try {
            const useKeyVault = process.env.USE_AZURE_KEY_VAULT === 'true';
            
            if (useKeyVault) {
                console.log('🔐 Using Azure Key Vault for configuration...');
                // Dynamically import Azure Key Vault manager only when needed
                if (!AzureKeyVaultManager) {
                    const keyVaultModule = await import('./keyVault.js');
                    AzureKeyVaultManager = keyVaultModule.default;
                }
                this.keyVaultManager = new AzureKeyVaultManager();
                
                // Load all secrets from Key Vault
                const secrets = await this.keyVaultManager.getAllSecrets();
                
                // Build configuration object with Key Vault secrets
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
                    keyVaultName: process.env.KEY_VAULT_NAME
                };
            } else {
                console.log('🏠 Using local environment variables for configuration...');
                
                // Validate required local environment variables
                if (!process.env.DATABASE_URL) {
                    throw new Error('DATABASE_URL is required for local development. Please set it in your .env file.');
                }
                if (!process.env.JWT_SECRET) {
                    throw new Error('JWT_SECRET is required for local development. Please set it in your .env file.');
                }
                
                // Build configuration object with local environment variables
                this.config = {
                    // Server configuration
                    port: process.env.PORT || 5000,
                    nodeEnv: process.env.NODE_ENV || 'development',
                    
                    // Database configuration
                    databaseUrl: process.env.DATABASE_URL,
                    
                    // JWT configuration
                    jwtSecret: process.env.JWT_SECRET,
                    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
                    
                    // Application Insights (optional for local development)
                    appInsightsConnectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
                    
                    // Local development info
                    keyVaultName: 'local-development'
                };
            }
            
            this.isInitialized = true;
            console.log('✅ Configuration initialized successfully');
            console.log(`🔐 Using Key Vault: ${this.config.keyVaultName}`);
            console.log(`🌍 Environment: ${this.config.nodeEnv}`);
            
        } catch (error) {
            console.error('❌ Failed to initialize configuration:', error.message);
            throw error;
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
            console.log('🏠 Local development mode - no secrets to refresh');
            return;
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
            return { status: 'healthy', mode: 'local-development' };
        }
        
        return await this.keyVaultManager.healthCheck();
    }
}

// Create singleton instance
const configManager = new ConfigManager();

export default configManager;