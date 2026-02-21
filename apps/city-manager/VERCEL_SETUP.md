# Vercel Deployment Configuration for City Manager

To ensure `city-manager` deploys correctly from the monorepo and is triggered by changes in this folder, you must configure the **Root Directory** in Vercel.

## 1. Project Settings
Go to your Vercel Dashboard -> Select the **city-manager** project -> **Settings** -> **General**.

## 2. Root Directory (CRITICAL)
Locate the **Root Directory** section.
- **Current Value:** (Likely empty or `./`)
- **New Value:** `apps/city-manager`

**Action:** Click **Edit**, enter `apps/city-manager`, and click **Save**.

## 3. Build & Development Settings
Ensure these are set (usually auto-detected after setting Root Directory, but good to verify):
- **Framework Preset:** `Next.js`
- **Build Command:** `npm run build` (or `next build`)
- **Output Directory:** `.next`
- **Install Command:** `npm install`

## 4. Git Ignore Build Step (Optional but Recommended)
To prevent the app from rebuilding when you only change files in *other* apps (like mobile-scanner), go to **Settings** -> **Git**.
- **Ignored Build Step:** `git diff --quiet HEAD^ HEAD ./`

## 5. Triggering a New Build
After saving these settings:
1. Go to the **Deployments** tab.
2. Click the three dots (`...`) next to the latest commit.
3. Select **Redeploy**.

Alternatively, pushing any new change to `apps/city-manager` will now automatically trigger the build.
