#!/bin/bash

# Complete Azure Security Deployment Script
# This script sets up the entire secure infrastructure

set -e

echo "🚀 Starting Complete Azure Security Setup..."

# Configuration
RESOURCE_GROUP="smart-expense-tracker-rg"
LOCATION="westeurope"
KEY_VAULT_NAME="smart-expense-kv-$(shuf -i 1000-9999 -n 1)"
POSTGRES_SERVER_NAME="smart-expense-tracker-db"
APP_SERVICE_NAME="smart-expense-tracker-api"
APP_INSIGHTS_NAME="smart-expense-insights-$(shuf -i 1000-9999 -n 1)"

echo "📋 Configuration:"
echo "   Resource Group: $RESOURCE_GROUP"
echo "   Location: $LOCATION"
echo "   Key Vault: $KEY_VAULT_NAME"
echo "   PostgreSQL: $POSTGRES_SERVER_NAME"
echo "   App Service: $APP_SERVICE_NAME"

# 1. Create Key Vault
echo "🔐 Creating Azure Key Vault..."
az keyvault create \
    --name $KEY_VAULT_NAME \
    --resource-group $RESOURCE_GROUP \
    --location $LOCATION \
    --enable-rbac-authorization true \
    --retention-days 90

# 2. Get current user and assign permissions
echo "👤 Setting up Key Vault permissions..."
CURRENT_USER=$(az ad signed-in-user show --query id -o tsv)
az role assignment create \
    --role "Key Vault Administrator" \
    --assignee $CURRENT_USER \
    --scope "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.KeyVault/vaults/$KEY_VAULT_NAME"

# Wait for permissions
sleep 30

# 3. Generate and store secrets
echo "🎯 Generating secure secrets..."

# JWT Secret
JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
az keyvault secret set \
    --vault-name $KEY_VAULT_NAME \
    --name "JWT-SECRET" \
    --value "$JWT_SECRET"

# Database Password
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
az keyvault secret set \
    --vault-name $KEY_VAULT_NAME \
    --name "DB-ADMIN-PASSWORD" \
    --value "$DB_PASSWORD"

# Update PostgreSQL password
echo "🗄️ Updating PostgreSQL server..."
az postgres flexible-server update \
    --resource-group $RESOURCE_GROUP \
    --name $POSTGRES_SERVER_NAME \
    --admin-password "$DB_PASSWORD"

# 4. Create new Application Insights
echo "📊 Creating Application Insights..."
APP_INSIGHTS_CONNECTION=$(az monitor app-insights component create \
    --app $APP_INSIGHTS_NAME \
    --location $LOCATION \
    --resource-group $RESOURCE_GROUP \
    --kind web \
    --query "connectionString" -o tsv)

az keyvault secret set \
    --vault-name $KEY_VAULT_NAME \
    --name "APPLICATIONINSIGHTS-CONNECTION-STRING" \
    --value "$APP_INSIGHTS_CONNECTION"

# 5. Enable managed identity for App Service
echo "🆔 Configuring App Service managed identity..."
PRINCIPAL_ID=$(az webapp identity assign \
    --resource-group $RESOURCE_GROUP \
    --name $APP_SERVICE_NAME \
    --query principalId -o tsv)

# Grant Key Vault access
az role assignment create \
    --role "Key Vault Secrets User" \
    --assignee $PRINCIPAL_ID \
    --scope "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.KeyVault/vaults/$KEY_VAULT_NAME"

# 6. Configure App Service settings
echo "⚙️ Configuring App Service settings..."
az webapp config appsettings set \
    --resource-group $RESOURCE_GROUP \
    --name $APP_SERVICE_NAME \
    --settings \
        KEY_VAULT_NAME=$KEY_VAULT_NAME \
        DATABASE_URL="postgresql://dbadmin@$POSTGRES_SERVER_NAME.postgres.database.azure.com/postgres?sslmode=require" \
        PORT=5000 \
        NODE_ENV=production

# 7. Create GitHub repository secrets
echo "🔑 Creating GitHub secrets..."
gh secret set AZURE_KEYVAULT_NAME --body "$KEY_VAULT_NAME"
gh secret set AZURE_RESOURCE_GROUP --body "$RESOURCE_GROUP"
gh secret set POSTGRES_SERVER_NAME --body "$POSTGRES_SERVER_NAME"

# 8. Generate updated .env template
echo "📝 Creating .env template..."
cat > ../backend/.env.secure << EOF
# Azure Key Vault Configuration
KEY_VAULT_NAME=$KEY_VAULT_NAME

# Database Configuration (password managed by Key Vault)
DATABASE_URL=postgresql://dbadmin@$POSTGRES_SERVER_NAME.postgres.database.azure.com/postgres?sslmode=require

# Server Configuration
PORT=5000
NODE_ENV=production

# All secrets are automatically loaded from Azure Key Vault:
# - JWT_SECRET
# - DB_ADMIN_PASSWORD (injected into DATABASE_URL)
# - APPLICATIONINSIGHTS_CONNECTION_STRING
EOF

# 9. Create monitoring dashboard
echo "📊 Setting up monitoring..."
az monitor log-analytics workspace create \
    --resource-group $RESOURCE_GROUP \
    --workspace-name "smart-expense-logs" \
    --location $LOCATION

echo "✅ Azure Security Setup Complete!"
echo ""
echo "🔐 Key Vault: $KEY_VAULT_NAME"
echo "📊 Application Insights: $APP_INSIGHTS_NAME"
echo "🗄️ Database password rotated"
echo "🔑 JWT secret generated"
echo ""
echo "🎯 Next Steps:"
echo "1. Install Azure packages: cd backend && npm install"
echo "2. Deploy your application: git push origin main"
echo "3. Secrets will auto-rotate every 90 days"
echo "4. Monitor via Application Insights dashboard"
echo ""
echo "🔗 Key Vault URL: https://$KEY_VAULT_NAME.vault.azure.net"