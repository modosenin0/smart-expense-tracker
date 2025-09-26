# Azure App Service Deployment Script (PowerShell)
# This script commits and pushes the restructured code for deployment

Write-Host "🚀 Deploying Smart Expense Tracker to Azure App Service..." -ForegroundColor Green
Write-Host ""

# Check git status
Write-Host "📋 Current git status:" -ForegroundColor Yellow
git status --porcelain
Write-Host ""

# Add all changes
Write-Host "📦 Adding all changes to git..." -ForegroundColor Yellow
git add .
Write-Host ""

# Commit with deployment message
Write-Host "💾 Committing changes..." -ForegroundColor Yellow
$commitMessage = @"
🚀 Restructure for Azure App Service compatibility

✅ Moved backend code to root level for Azure App Service
✅ Consolidated package.json with all backend dependencies  
✅ Fixed import paths for flat structure
✅ Added Azure deployment configuration files
✅ Maintained frontend in subdirectory
✅ All Azure Key Vault integration preserved

Ready for automatic deployment via GitHub webhook!
"@

git commit -m $commitMessage
Write-Host ""

# Push to trigger deployment
Write-Host "🌍 Pushing to GitHub (this will trigger Azure deployment)..." -ForegroundColor Yellow
git push origin main
Write-Host ""

Write-Host "🎉 Deployment initiated!" -ForegroundColor Green
Write-Host ""
Write-Host "🔍 Next steps:" -ForegroundColor Cyan
Write-Host "1. Monitor Azure App Service deployment logs" -ForegroundColor White
Write-Host "2. Check health endpoint: https://smart-expense-tracker-app.azurewebsites.net/health" -ForegroundColor White
Write-Host "3. Verify Key Vault integration is working" -ForegroundColor White
Write-Host ""
Write-Host "📊 Your smart expense tracker should be live shortly!" -ForegroundColor Green