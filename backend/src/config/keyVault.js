import { DefaultAzureCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';

class AzureKeyVaultManager {
    constructor() {
        this.keyVaultUrl = process.env.AZURE_KEY_VAULT_URL;
        if (!this.keyVaultUrl) {
            throw new Error('AZURE_KEY_VAULT_URL environment variable is required');
        }
        
        // Extract Key Vault name from URL for logging purposes
        this.keyVaultName = this.keyVaultUrl.replace('https://', '').replace('.vault.azure.net/', '');
        this.credential = new DefaultAzureCredential();
        this.client = new SecretClient(this.keyVaultUrl, this.credential);
        
        // Cache for secrets to avoid repeated API calls
        this.secretsCache = new Map();
        this.cacheExpiry = new Map();
        this.cacheTTL = 300000; // 5 minutes
    }

    async getSecret(secretName) {
        const now = Date.now();
        
        // Check cache first
        if (this.secretsCache.has(secretName) && 
            this.cacheExpiry.get(secretName) > now) {
            console.log(`🔍 Retrieved ${secretName} from cache`);
            return this.secretsCache.get(secretName);
        }

        try {
            console.log(`🔐 Fetching ${secretName} from Azure Key Vault...`);
            const secret = await this.client.getSecret(secretName);
            
            // Cache the secret
            this.secretsCache.set(secretName, secret.value);
            this.cacheExpiry.set(secretName, now + this.cacheTTL);
            
            console.log(`✅ Successfully retrieved ${secretName}`);
            return secret.value;
        } catch (error) {
            console.error(`❌ Failed to retrieve secret ${secretName}:`, error.message);
            throw new Error(`Failed to retrieve secret ${secretName}: ${error.message}`);
        }
    }

    async getAllSecrets() {
        const secrets = {};
        
        try {
            // Get all required secrets in parallel
            const [jwtSecret, dbPassword, appInsightsConnection] = await Promise.all([
                this.getSecret('JWT-SECRET'),
                this.getSecret('DB-ADMIN-PASSWORD'),
                this.getSecret('APPLICATIONINSIGHTS-CONNECTION-STRING')
            ]);

            secrets.JWT_SECRET = jwtSecret;
            secrets.DB_ADMIN_PASSWORD = dbPassword;
            secrets.APPLICATIONINSIGHTS_CONNECTION_STRING = appInsightsConnection;

            console.log('🎉 All secrets loaded from Azure Key Vault');
            return secrets;
        } catch (error) {
            console.error('❌ Failed to load secrets from Key Vault:', error.message);
            throw error;
        }
    }

    // Method to build complete database URL with password from Key Vault
    async getDatabaseUrl() {
        const password = await this.getSecret('DB-ADMIN-PASSWORD');
        const baseUrl = process.env.DATABASE_URL || '';
        
        // Replace placeholder password in DATABASE_URL
        const urlWithPassword = baseUrl.replace(/@([^.]+)\./, `@$1:${password}@`);
        return urlWithPassword;
    }

    // Clear cache (useful for testing or forced refresh)
    clearCache() {
        this.secretsCache.clear();
        this.cacheExpiry.clear();
        console.log('🗑️ Key Vault cache cleared');
    }

    // Health check method
    async healthCheck() {
        try {
            await this.getSecret('JWT-SECRET');
            return { status: 'healthy', keyVault: this.keyVaultName };
        } catch (error) {
            return { 
                status: 'unhealthy', 
                keyVault: this.keyVaultName, 
                error: error.message 
            };
        }
    }
}

export default AzureKeyVaultManager;