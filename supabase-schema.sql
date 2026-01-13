-- Warmap Generator Database Schema
-- Run this SQL in your Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  business_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Warmaps table
CREATE TABLE IF NOT EXISTS warmaps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,

  -- Basic Info
  client_name TEXT NOT NULL,
  business_name TEXT NOT NULL,
  strategy_subtitle TEXT DEFAULT 'Deep Event Optimization + Educational Layer Strategy',

  -- Funnel Type
  funnel_type TEXT NOT NULL CHECK (funnel_type IN ('webinar', 'webinar_to_call', 'direct_call')),

  -- Current State
  current_daily_spend DECIMAL NOT NULL,
  target_daily_spend DECIMAL NOT NULL,

  -- Stage 1: Entry Point
  stage1_name TEXT DEFAULT 'Registration',
  stage1_price DECIMAL DEFAULT 0,
  stage1_is_paid BOOLEAN DEFAULT FALSE,
  landing_page_conversion_rate DECIMAL DEFAULT 7,
  current_cpa_stage1 DECIMAL NOT NULL,
  cpa_stage1_at_scale DECIMAL,
  cpa_stage1_kill_range DECIMAL NOT NULL,

  -- Stage 2: Engagement
  stage2_name TEXT DEFAULT 'Attendance',
  stage2_price DECIMAL DEFAULT 0,
  stage2_is_paid BOOLEAN DEFAULT FALSE,
  stage2_conversion_rate DECIMAL DEFAULT 70,

  -- Stage 3: Qualification (optional)
  stage3_enabled BOOLEAN DEFAULT FALSE,
  stage3_name TEXT,
  stage3_price DECIMAL DEFAULT 0,
  stage3_is_paid BOOLEAN DEFAULT FALSE,
  stage3_conversion_rate DECIMAL,

  -- Stage 4: Pre-Conversion (optional)
  stage4_enabled BOOLEAN DEFAULT FALSE,
  stage4_name TEXT,
  stage4_conversion_rate DECIMAL,

  -- High Ticket
  high_ticket_price DECIMAL NOT NULL,
  high_ticket_conversion_rate DECIMAL DEFAULT 30,

  -- Campaign Structure
  layer1_creatives_count TEXT DEFAULT '10-12',
  layer1_objective TEXT DEFAULT 'Conversions',
  layer1_optimization_event TEXT,
  layer1_daily_budget DECIMAL DEFAULT 10000,

  layer2_enabled BOOLEAN DEFAULT TRUE,
  layer2_creatives_count TEXT DEFAULT '18-20',
  layer2_objective TEXT DEFAULT 'ThruPlay (Video Views)',
  layer2_cost_per_view DECIMAL DEFAULT 0.50,

  -- Scaling
  scaling_increment_percent DECIMAL DEFAULT 20,
  scaling_frequency_days_min INTEGER DEFAULT 3,
  scaling_frequency_days_max INTEGER DEFAULT 4,

  -- Targets
  target_roi DECIMAL DEFAULT 2,

  -- Tech Stack
  funnel_platform TEXT DEFAULT 'GoHighLevel (GHL)',
  tracking_tool TEXT DEFAULT 'ZinoTrack',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster client lookups
CREATE INDEX IF NOT EXISTS idx_warmaps_client_id ON warmaps(client_id);

-- Create index for searching
CREATE INDEX IF NOT EXISTS idx_warmaps_client_name ON warmaps(client_name);
CREATE INDEX IF NOT EXISTS idx_warmaps_business_name ON warmaps(business_name);

-- Row Level Security (optional - enable for production)
-- ALTER TABLE warmaps ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Sample policies (uncomment if using RLS)
-- CREATE POLICY "Allow all for now" ON warmaps FOR ALL USING (true);
-- CREATE POLICY "Allow all for now" ON clients FOR ALL USING (true);
