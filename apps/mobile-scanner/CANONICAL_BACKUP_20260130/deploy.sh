#!/bin/bash
# Quick deployment script for canonical backup
# This script deploys the exact working version to Firebase Hosting

echo "🚀 Deploying Canonical Backup to Firebase Hosting..."
echo "Version: 1.0.3 (Build 4)"
echo "Source: CANONICAL_BACKUP_20260130"

# Navigate to the web build folder
cd web

# Deploy to Firebase
echo "📡 Deploying to Firebase Hosting..."
firebase deploy --only hosting

echo "✅ Deployment complete!"
echo "🌐 Your app should be available at your Firebase Hosting URL"
echo "📋 This is the exact same version as https://payparq-d-6rex95.web.app/"