# Deployment Fix - Fresh Build Solution

## Problem Identified
Your production deployments were showing a 3-day-old version because:
1. **Uncommitted changes**: The `build.sh` file had uncommitted changes with hardcoded Supabase credentials
2. **Vercel builds from git**: Vercel builds from the committed code in your repository, not local changes
3. **Cache issues**: Build caches may have been serving stale builds

## Solution Applied

### 1. Version Bump
- Updated `pubspec.yaml` from `1.0.4+5` to `1.0.5+6`
- This forces cache invalidation across all platforms

### 2. Enhanced Build Script
- Added deploy ID and timestamp to `version.json`
- Enhanced cache-busting in `build.sh`
- Hardcoded Supabase credentials for reliability

### 3. Vercel Configuration
- Updated `vercel.json` to prevent build caching
- Added ignore command to force rebuilds

### 4. Fresh Build Script
- Created `tool/build_fresh_prod.ps1` for local production builds
- This matches what Vercel will build

## Next Steps to Deploy

### Option 1: Push to Trigger Vercel (Recommended)
```powershell
# Push the committed changes
git push origin main

# Vercel will automatically detect the push and rebuild
# Check your Vercel dashboard for the new deployment
```

### Option 2: Manual Vercel Redeploy
1. Go to your Vercel dashboard
2. Find your project
3. Click "Redeploy" on the latest deployment
4. Or trigger a new deployment from the main branch

### Option 3: Test Locally First
```powershell
# Build a fresh production build locally
.\tool\build_fresh_prod.ps1

# Test it locally
cd build/web
python -m http.server 8080
# Open http://localhost:8080 in your browser
```

## Verification

After deployment, check:
1. Visit `/version.json` on your deployed site
2. Verify it shows:
   - `version: "1.0.5+6"`
   - Recent `timestamp`
   - Unique `deployId`

## If Still Seeing Old Version

1. **Clear browser cache**: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
2. **Check Vercel logs**: Ensure the build completed successfully
3. **Verify git push**: Make sure changes were pushed to remote
4. **Force redeploy**: Use Vercel dashboard to trigger a fresh build

## Files Changed
- `build.sh` - Enhanced with cache-busting and hardcoded credentials
- `pubspec.yaml` - Version bumped to 1.0.5+6
- `vercel.json` - Added cache prevention
- `tool/build_fresh_prod.ps1` - New fresh build script

## Important Notes
- The generated plugin files (linux/macos/windows) are auto-generated and don't need to be committed
- The `.firebase/hosting.*.cache` file is a Firebase cache file and can be ignored
- All source code changes should now be committed and ready for deployment
