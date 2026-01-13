# Complete Setup Guide for Warmap Generator

This guide will walk you through setting up everything from scratch, step by step.

---

## PART 1: Setting Up Supabase (Your Database)

### Step 1: Create a Supabase Account

1. Go to **https://supabase.com**
2. Click **"Start your project"** (green button)
3. Sign up using:
   - GitHub account (recommended - just click "Continue with GitHub"), OR
   - Email and password

### Step 2: Create a New Project

1. Once logged in, click **"New Project"**
2. Fill in the details:
   - **Name**: `warmap-generator` (or any name you like)
   - **Database Password**: Create a strong password and **SAVE IT SOMEWHERE SAFE** (you won't need it often, but keep it)
   - **Region**: Choose the closest to you (e.g., Mumbai for India, or any US region)
3. Click **"Create new project"**
4. Wait 1-2 minutes for the project to be created (you'll see a loading screen)

### Step 3: Set Up the Database Tables

1. In your Supabase dashboard, look at the left sidebar
2. Click **"SQL Editor"** (it has a terminal/code icon)
3. Click **"New query"** (top right)
4. Copy ALL the code below and paste it into the editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  business_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Warmaps table
CREATE TABLE warmaps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,

  client_name TEXT NOT NULL,
  business_name TEXT NOT NULL,
  strategy_subtitle TEXT DEFAULT 'Deep Event Optimization + Educational Layer Strategy',

  funnel_type TEXT NOT NULL CHECK (funnel_type IN ('webinar', 'webinar_to_call', 'direct_call')),

  current_daily_spend DECIMAL NOT NULL,
  target_daily_spend DECIMAL NOT NULL,

  stage1_name TEXT DEFAULT 'Registration',
  stage1_price DECIMAL DEFAULT 0,
  stage1_is_paid BOOLEAN DEFAULT FALSE,
  landing_page_conversion_rate DECIMAL DEFAULT 7,
  current_cpa_stage1 DECIMAL NOT NULL,
  cpa_stage1_at_scale DECIMAL,
  cpa_stage1_kill_range DECIMAL NOT NULL,

  stage2_name TEXT DEFAULT 'Attendance',
  stage2_price DECIMAL DEFAULT 0,
  stage2_is_paid BOOLEAN DEFAULT FALSE,
  stage2_conversion_rate DECIMAL DEFAULT 70,

  stage3_enabled BOOLEAN DEFAULT FALSE,
  stage3_name TEXT,
  stage3_price DECIMAL DEFAULT 0,
  stage3_is_paid BOOLEAN DEFAULT FALSE,
  stage3_conversion_rate DECIMAL,

  stage4_enabled BOOLEAN DEFAULT FALSE,
  stage4_name TEXT,
  stage4_conversion_rate DECIMAL,

  high_ticket_price DECIMAL NOT NULL,
  high_ticket_conversion_rate DECIMAL DEFAULT 30,

  layer1_creatives_count TEXT DEFAULT '10-12',
  layer1_objective TEXT DEFAULT 'Conversions',
  layer1_optimization_event TEXT,
  layer1_daily_budget DECIMAL DEFAULT 10000,

  layer2_enabled BOOLEAN DEFAULT TRUE,
  layer2_creatives_count TEXT DEFAULT '18-20',
  layer2_objective TEXT DEFAULT 'ThruPlay (Video Views)',
  layer2_cost_per_view DECIMAL DEFAULT 0.50,

  scaling_increment_percent DECIMAL DEFAULT 20,
  scaling_frequency_days_min INTEGER DEFAULT 3,
  scaling_frequency_days_max INTEGER DEFAULT 4,

  target_roi DECIMAL DEFAULT 2,

  funnel_platform TEXT DEFAULT 'GoHighLevel (GHL)',
  tracking_tool TEXT DEFAULT 'ZinoTrack',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_warmaps_client_id ON warmaps(client_id);

-- Enable Row Level Security (but allow all operations for now)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE warmaps ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (you can restrict later)
CREATE POLICY "Allow all operations on clients" ON clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on warmaps" ON warmaps FOR ALL USING (true) WITH CHECK (true);
```

5. Click **"Run"** (green button at bottom right, or press Ctrl+Enter)
6. You should see "Success. No rows returned" - this is correct!

### Step 4: Get Your Supabase Credentials

1. In the left sidebar, click **"Project Settings"** (gear icon at the bottom)
2. Click **"API"** in the settings menu
3. You'll see two important values:

   **Project URL** - looks like:
   ```
   https://abcdefghijk.supabase.co
   ```

   **anon public** key (under "Project API keys") - a long string like:
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6...
   ```

4. **COPY BOTH OF THESE** and save them in a text file - you'll need them soon!

---

## PART 2: Deploying to Vercel

### Step 1: Create a GitHub Account (if you don't have one)

1. Go to **https://github.com**
2. Click **"Sign up"**
3. Follow the steps to create an account

### Step 2: Fork the Repository

1. Go to: **https://github.com/arhaans1/ASR-Meta-Ads-Warmap**
2. Click the **"Fork"** button (top right)
3. Click **"Create fork"**
4. Now you have your own copy of the code!

### Step 3: Create a Vercel Account

1. Go to **https://vercel.com**
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"** (easiest option)
4. Authorize Vercel to access your GitHub

### Step 4: Deploy the Project

1. Once logged into Vercel, click **"Add New..."** → **"Project"**
2. You'll see a list of your GitHub repositories
3. Find **"ASR-Meta-Ads-Warmap"** and click **"Import"**
4. On the configuration page:
   - **Framework Preset**: Should auto-detect as "Vite" ✓
   - **Root Directory**: Leave as `.` (default)
   - **Build Command**: Leave as default
   - **Output Directory**: Leave as default

### Step 5: Add Environment Variables (IMPORTANT!)

Before clicking Deploy, you need to add your Supabase credentials:

1. On the same deployment page, find **"Environment Variables"** section
2. Click to expand it
3. Add the first variable:
   - **Name**: `VITE_SUPABASE_URL`
   - **Value**: Paste your Supabase Project URL (the one that looks like `https://abcdefg.supabase.co`)
   - Click **"Add"**

4. Add the second variable:
   - **Name**: `VITE_SUPABASE_ANON_KEY`
   - **Value**: Paste your Supabase anon key (the long string starting with `eyJ...`)
   - Click **"Add"**

5. Now click **"Deploy"**!

### Step 6: Wait for Deployment

1. Vercel will build and deploy your app (takes 1-2 minutes)
2. You'll see a progress screen with build logs
3. When done, you'll see **"Congratulations!"** with a preview of your site
4. Click **"Continue to Dashboard"** or the preview image to visit your live site!

### Your App is Now Live!

Your app will be available at a URL like:
```
https://asr-meta-ads-warmap.vercel.app
```

(Vercel gives you a free `.vercel.app` domain)

---

## PART 3: Using the App

### Creating Your First Warmap

1. Go to your deployed app URL
2. Click **"New Warmap"**
3. Select a funnel type:
   - **Webinar Funnel**: For direct sales from webinars
   - **Webinar-to-Call**: For webinar + consultation call
   - **Direct Call**: For lead magnet → call funnels
4. Click **"Continue"**
5. Fill in the form with your client's data
6. Click **"Save Warmap"**

### Downloading a Warmap Document

1. From the home page, click on any warmap to view it
2. Click **"Download .docx"** button
3. A Word document will download to your computer!

---

## TROUBLESHOOTING

### "Something went wrong" or blank page

1. Check that your environment variables are set correctly in Vercel:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Make sure both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are there
   - If you need to change them, you must **redeploy** after:
     - Go to Deployments tab → Click "..." on latest → "Redeploy"

### Database errors

1. Go to Supabase Dashboard → SQL Editor
2. Make sure you ran the SQL code from Step 3
3. Check Table Editor (in sidebar) - you should see `clients` and `warmaps` tables

### Can't save warmaps

1. In Supabase, go to Authentication → Policies
2. Make sure policies exist for both tables
3. If not, run the policy creation SQL again:

```sql
CREATE POLICY "Allow all operations on clients" ON clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on warmaps" ON warmaps FOR ALL USING (true) WITH CHECK (true);
```

---

## UPDATING THE APP (Future)

If you want to update the app with new features:

1. The repository owner pushes new code
2. In Vercel Dashboard, go to your project
3. Go to "Git" settings
4. Click "Sync Fork" or manually trigger a new deployment

---

## QUICK REFERENCE

| What | Where to Find It |
|------|-----------------|
| Supabase URL | Supabase → Project Settings → API → Project URL |
| Supabase Key | Supabase → Project Settings → API → anon public |
| Your Live App | Vercel Dashboard → Your Project → Visit |
| Redeploy | Vercel → Deployments → ... → Redeploy |
| Database Tables | Supabase → Table Editor |
| SQL Editor | Supabase → SQL Editor |

---

## NEED HELP?

- **Supabase Docs**: https://supabase.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Report Issues**: https://github.com/arhaans1/ASR-Meta-Ads-Warmap/issues
