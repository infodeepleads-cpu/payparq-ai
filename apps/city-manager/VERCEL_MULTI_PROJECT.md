# Vercel Multi-Project Configuration

This file configures Vercel to handle multiple projects within this monorepo.

## Projects Configuration

### city-manager
- **Root Directory**: `apps/city-manager`
- **Framework**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

### mobile-scanner
- **Root Directory**: `apps/mobile-scanner`
- **Framework**: Flutter
- **Build Command**: `chmod +x build.sh && ./build.sh`
- **Output Directory**: `build/web`

## Setup Instructions

1. In Vercel Dashboard, create separate projects for each app
2. For each project, configure the Root Directory as specified above
3. Set the framework and build commands accordingly

## Current Issue

The root [vercel.json](file:///c:/payparq.ai/vercel.json) contains Flutter-specific configuration that conflicts with Next.js builds. This needs to be resolved by either:

1. **Option A**: Remove root vercel.json and configure each project individually in Vercel dashboard
2. **Option B**: Use Vercel's monorepo support with proper project configuration

## Recommended Fix

Since Vercel doesn't support multi-project vercel.json in the root, the best approach is:

1. Delete or rename the root [vercel.json](file:///c:/payparq.ai/vercel.json)
2. Configure each project separately in Vercel dashboard with their specific root directories
3. Ensure `apps/city-manager` has its own [vercel.json](file:///c:/payparq.ai/apps/city-manager/vercel.json) (already exists)

This will ensure that changes to `city-manager` only trigger its own deployment.