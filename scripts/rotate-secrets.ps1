# Automated Secret Rotation Script
# Rotates JWT secrets and database passwords automatically

param(
    [Parameter(Mandatory=$true)]
    [string]$KeyVaultName,
    
    [Parameter(Mandatory=$true)]
    [string]$ResourceGroupName,
    
    [Parameter(Mandatory=$false)]
    [string]$PostgresServerName,
    
    [Parameter(Mandatory=$false)]
    [switch]$RotateJWT,
    
    [Parameter(Mandatory=$false)]
    [switch]$RotateDatabase,
    
    [Parameter(Mandatory=$false)]
    [switch]$RotateAll
)

Write-Host "🔄 Starting Automated Secret Rotation..." -ForegroundColor Green
Write-Host "🔐 Key Vault: $KeyVaultName" -ForegroundColor Yellow

function New-SecurePassword {
    param([int]$Length = 32, [int]$SpecialChars = 8)
    return [System.Web.Security.Membership]::GeneratePassword($Length, $SpecialChars)
}

function Update-KeyVaultSecret {
    param(
        [string]$VaultName,
        [string]$SecretName,
        [string]$SecretValue,
        [string]$Description
    )
    
    Write-Host "🔑 Rotating secret: $SecretName" -ForegroundColor Cyan
    
    # Create new version of the secret
    az keyvault secret set `
        --vault-name $VaultName `
        --name $SecretName `
        --value $SecretValue `
        --description "$Description - Rotated on $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Successfully rotated $SecretName" -ForegroundColor Green
    } else {
        Write-Error "❌ Failed to rotate $SecretName"
        return $false
    }
    return $true
}

# Rotate JWT Secret
if ($RotateJWT -or $RotateAll) {
    $newJwtSecret = New-SecurePassword -Length 64 -SpecialChars 10
    Update-KeyVaultSecret -VaultName $KeyVaultName -SecretName "JWT-SECRET" -SecretValue $newJwtSecret -Description "JWT signing secret for authentication"
}

# Rotate Database Password
if ($RotateDatabase -or $RotateAll) {
    $newDbPassword = New-SecurePassword -Length 32 -SpecialChars 8
    
    # Update Key Vault first
    if (Update-KeyVaultSecret -VaultName $KeyVaultName -SecretName "DB-ADMIN-PASSWORD" -SecretValue $newDbPassword -Description "PostgreSQL admin password") {
        
        # Update PostgreSQL server if name provided
        if ($PostgresServerName) {
            Write-Host "🗄️  Updating PostgreSQL server password..." -ForegroundColor Cyan
            az postgres flexible-server update `
                --resource-group $ResourceGroupName `
                --name $PostgresServerName `
                --admin-password $newDbPassword
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ PostgreSQL server password updated" -ForegroundColor Green
            } else {
                Write-Error "❌ Failed to update PostgreSQL server password"
            }
        }
    }
}

# Log rotation event
$rotationLog = @{
    timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    keyVault = $KeyVaultName
    rotatedSecrets = @()
}

if ($RotateJWT -or $RotateAll) { $rotationLog.rotatedSecrets += "JWT-SECRET" }
if ($RotateDatabase -or $RotateAll) { $rotationLog.rotatedSecrets += "DB-ADMIN-PASSWORD" }

$rotationLog | ConvertTo-Json | Out-File -FilePath "../logs/secret-rotation-$(Get-Date -Format 'yyyyMMdd-HHmmss').json" -Encoding UTF8

Write-Host "`n🎉 Secret rotation completed!" -ForegroundColor Green
Write-Host "📋 Rotated secrets: $($rotationLog.rotatedSecrets -join ', ')" -ForegroundColor Yellow
Write-Host "⚠️  Remember to restart your applications to pick up the new secrets!" -ForegroundColor Red