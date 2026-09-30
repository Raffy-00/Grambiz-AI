-- ==============================================================================
-- GramBiz AI — Supabase Database Migration & Schema Script
-- ==============================================================================
-- Run this script in your Supabase SQL Editor:
-- Dashboard -> SQL Editor -> New Query -> Paste & Run
-- ==============================================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    name TEXT,
    phone_or_email TEXT,
    village TEXT,
    district TEXT,
    preferred_language TEXT DEFAULT 'en',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Ensure columns exist if table was already created
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS village TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en';

-- 2. ASSESSMENTS TABLE
CREATE TABLE IF NOT EXISTS public.assessments (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    village TEXT,
    district TEXT,
    state TEXT,
    margin_capital NUMERIC NOT NULL DEFAULT 0,
    business_category TEXT NOT NULL DEFAULT '',
    experience TEXT,
    project_cost NUMERIC NOT NULL DEFAULT 0,
    loan_amount NUMERIC NOT NULL DEFAULT 0,
    scheme_name TEXT NOT NULL DEFAULT '',
    feasibility_score INTEGER NOT NULL DEFAULT 0,
    raw_json_data JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_assessments_user_id ON public.assessments (user_id);
CREATE INDEX IF NOT EXISTS idx_assessments_created_at ON public.assessments (created_at DESC);

-- 3. ANALYSIS DRAFTS TABLE (Auto-save & Cross-device sync)
CREATE TABLE IF NOT EXISTS public.analysis_drafts (
    id TEXT PRIMARY KEY, -- usually matches user_id
    user_id TEXT NOT NULL,
    current_step INTEGER DEFAULT 1,
    business_data JSONB,
    location_data JSONB,
    capital_data JSONB,
    feasibility_data JSONB,
    completed_steps JSONB,
    last_platform TEXT DEFAULT 'mobile',
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_analysis_drafts_user_id ON public.analysis_drafts (user_id);

-- 4. CHAT MESSAGES TABLE (AI Assistant history sync)
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    timestamp TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages (user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages (created_at ASC);

-- ==============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
-- Allow full read/write access for public anon key & authenticated users.
-- This enables direct client-side synchronization and offline-first persistence.

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Grant usage on public schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE public.users TO anon, authenticated;
GRANT ALL ON TABLE public.assessments TO anon, authenticated;
GRANT ALL ON TABLE public.analysis_drafts TO anon, authenticated;
GRANT ALL ON TABLE public.chat_messages TO anon, authenticated;

-- Policies for users table
DROP POLICY IF EXISTS "Public full access to users" ON public.users;
CREATE POLICY "Public full access to users"
    ON public.users
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Policies for assessments table
DROP POLICY IF EXISTS "Public full access to assessments" ON public.assessments;
CREATE POLICY "Public full access to assessments"
    ON public.assessments
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Policies for analysis_drafts table
DROP POLICY IF EXISTS "Public full access to analysis_drafts" ON public.analysis_drafts;
CREATE POLICY "Public full access to analysis_drafts"
    ON public.analysis_drafts
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Policies for chat_messages table
DROP POLICY IF EXISTS "Public full access to chat_messages" ON public.chat_messages;
CREATE POLICY "Public full access to chat_messages"
    ON public.chat_messages
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);
