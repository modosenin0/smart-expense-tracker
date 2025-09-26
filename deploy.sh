#!/bin/bash

# Azure App Service Deployment Script
# This script commits and pushes the restructured code for deployment

echo "🚀 Deploying Smart Expense Tracker to Azure App Service..."
echo ""

# Check git status
echo "📋 Current git status:"
git status --porcelain
echo ""

# Add all changes
echo "📦 Adding all changes to git..."
git add .
echo ""

# Commit with deployment message
echo "💾 Committing changes..."
git commit -m "🚀 Restructure for Azure App Service compatibility

✅ Moved backend code to root level for Azure App Service
✅ Consolidated package.json with all backend dependencies  
✅ Fixed import paths for flat structure
✅ Added Azure deployment configuration files
✅ Maintained frontend in subdirectory
✅ All Azure Key Vault integration preserved

Ready for automatic deployment via GitHub webhook!"
echo ""

# Push to trigger deployment
echo "🌍 Pushing to GitHub (this will trigger Azure deployment)..."
git push origin main
echo ""

echo "🎉 Deployment initiated!"
echo ""
echo "🔍 Next steps:"
echo "1. Monitor Azure App Service deployment logs"
echo "2. Check health endpoint: https://smart-expense-tracker-app.azurewebsites.net/health"
echo "3. Verify Key Vault integration is working"
echo ""
echo "📊 Your smart expense tracker should be live shortly!"