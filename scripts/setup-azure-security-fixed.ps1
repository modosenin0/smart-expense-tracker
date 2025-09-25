# Azure Security Setup Script
# This script automates the creation of Azure Key Vault and secure credential management

param(
    [Parameter(Mandatory=$true)]
    [string]$ResourceGroupName,
    
    [Parameter(Mandatory=$true)]
    [string]$Location = "westeurope",
    
    [Parameter(Mandatory=$false)]
    [string]$KeyVaultName,
    
    [Parameter(Mandatory=$false)]
    [string]$PostgresServerName,
    
    [Parameter(Mandatory=$false)]
    [string]$AppServiceName
)

# Generate unique names if not provided
if (-not $KeyVaultName) {
    $KeyVaultName = "smart-expense-kv-$(Get-Random -Minimum 1000 -Maximum 9999)"
}

Write-Host "Starting Azure Security Automation..." -ForegroundColor Green
Write-Host "Resource Group: $ResourceGroupName" -ForegroundColor Yellow
Write-Host "Key Vault: $KeyVaultName" -ForegroundColor Yellow

# 1. Create Azure Key Vault
Write-Host "Creating Azure Key Vault..." -ForegroundColor Cyan
az keyvault create `
    --name $KeyVaultName `
    --resource-group $ResourceGroupName `
    --location $Location `
    --enable-rbac-authorization true `
    --retention-days 90

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to create Key Vault"
    exit 1
}

# 2. Get current user for Key Vault permissions
$currentUser = az ad signed-in-user show --query id -o tsv
Write-Host "Current User ID: $currentUser" -ForegroundColor Yellow

# 3. Assign Key Vault Administrator role
Write-Host "Assigning Key Vault permissions..." -ForegroundColor Cyan
az role assignment create `
    --role "Key Vault Administrator" `
    --assignee $currentUser `
    --scope "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$ResourceGroupName/providers/Microsoft.KeyVault/vaults/$KeyVaultName"

# Wait for permissions to propagate
Start-Sleep -Seconds 30

# 4. Generate and store JWT secret
Write-Host "Generating JWT Secret..." -ForegroundColor Cyan
$jwtSecret = [System.Web.Security.Membership]::GeneratePassword(64, 10)
az keyvault secret set `
    --vault-name $KeyVaultName `
    --name "JWT-SECRET" `
    --value $jwtSecret `
    --description "JWT signing secret for authentication"

# 5. Generate new database admin password
Write-Host "Generating Database Password..." -ForegroundColor Cyan
$dbPassword = [System.Web.Security.Membership]::GeneratePassword(32, 8)
az keyvault secret set `
    --vault-name $KeyVaultName `
    --name "DB-ADMIN-PASSWORD" `
    --value $dbPassword `
    --description "PostgreSQL admin password"

# 6. Update PostgreSQL server password if server name provided
if ($PostgresServerName) {
    Write-Host "Updating PostgreSQL server password..." -ForegroundColor Cyan
    az postgres flexible-server update `
        --resource-group $ResourceGroupName `
        --name $PostgresServerName `
        --admin-password $dbPassword
}

# 7. Create new Application Insights resource with fresh connection string
Write-Host "Creating new Application Insights..." -ForegroundColor Cyan
$appInsightsName = "smart-expense-insights-$(Get-Random -Minimum 1000 -Maximum 9999)"
$appInsights = az monitor app-insights component create `
    --app $appInsightsName `
    --location $Location `
    --resource-group $ResourceGroupName `
    --kind web `
    --query "connectionString" -o tsv

az keyvault secret set `
    --vault-name $KeyVaultName `
    --name "APPLICATIONINSIGHTS-CONNECTION-STRING" `
    --value $appInsights `
    --description "Application Insights connection string"

# 8. Create managed identity for App Service
if ($AppServiceName) {
    Write-Host "Enabling Managed Identity for App Service..." -ForegroundColor Cyan
    $principalId = az webapp identity assign `
        --resource-group $ResourceGroupName `
        --name $AppServiceName `
        --query principalId -o tsv
    
    # Grant App Service access to Key Vault
    az role assignment create `
        --role "Key Vault Secrets User" `
        --assignee $principalId `
        --scope "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$ResourceGroupName/providers/Microsoft.KeyVault/vaults/$KeyVaultName"
}

# 9. Output summary
Write-Host "Security Setup Complete!" -ForegroundColor Green
Write-Host "Key Vault Name: $KeyVaultName" -ForegroundColor Yellow
Write-Host "Application Insights: $appInsightsName" -ForegroundColor Yellow
Write-Host "Key Vault URLs for secrets:" -ForegroundColor Cyan
Write-Host "JWT Secret: https://$KeyVaultName.vault.azure.net/secrets/JWT-SECRET" -ForegroundColor White
Write-Host "DB Password: https://$KeyVaultName.vault.azure.net/secrets/DB-ADMIN-PASSWORD" -ForegroundColor White
Write-Host "App Insights: https://$KeyVaultName.vault.azure.net/secrets/APPLICATIONINSIGHTS-CONNECTION-STRING" -ForegroundColor White

# 10. Generate updated .env file template
Write-Host "Generating .env template..." -ForegroundColor Cyan
$envContent = @"
# Azure Key Vault Configuration
KEY_VAULT_NAME=$KeyVaultName

# Database Configuration (password managed by Key Vault)
DATABASE_URL=postgresql://dbadmin@$PostgresServerName.postgres.database.azure.com/postgres?sslmode=require

# Server Configuration
PORT=5000

# Secrets are loaded from Azure Key Vault:
# JWT_SECRET - Key Vault Secret: JWT-SECRET
# DB_PASSWORD - Key Vault Secret: DB-ADMIN-PASSWORD  
# APPLICATIONINSIGHTS_CONNECTION_STRING - Key Vault Secret: APPLICATIONINSIGHTS-CONNECTION-STRING
"@

$envContent | Out-File -FilePath "./backend/.env.keyvault" -Encoding UTF8
Write-Host "Created .env.keyvault template file" -ForegroundColor Green

Write-Host "All secrets are now managed securely in Azure Key Vault!" -ForegroundColor Green