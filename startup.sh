#!/bin/bash

# Startup script for Azure App Service
# This script ensures we start from the correct directory

echo "Starting Smart Expense Tracker..."
echo "Current directory: $(pwd)"
echo "Directory contents:"
ls -la

# Check if we're in the root and backend exists
if [ -d "backend" ]; then
    echo "Backend directory found, navigating to backend..."
    cd backend
    echo "Installing dependencies..."
    npm install
    echo "Starting application..."
    npm start
else
    echo "Backend directory not found in root. Checking if we're already in backend..."
    if [ -f "package.json" ]; then
        echo "package.json found in current directory, assuming we're in backend..."
        echo "Installing dependencies..."
        npm install
        echo "Starting application..."
        npm start
    else
        echo "ERROR: Cannot find backend directory or package.json"
        echo "Available directories:"
        find . -name "package.json" -type f
        exit 1
    fi
fi