-- Create activity logs table
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Users can read their own logs
CREATE POLICY "logs_select_own" ON public.activity_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can read all logs
CREATE POLICY "logs_admin_select_all" ON public.activity_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'ADMIN'
    )
  );

-- Anyone authenticated can insert logs (used by server actions)
CREATE POLICY "logs_insert_authenticated" ON public.activity_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Create mock blockchain table for Phase 1
CREATE TABLE IF NOT EXISTS public.blockchain_mock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tx_id TEXT NOT NULL UNIQUE,
  hash TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.blockchain_mock ENABLE ROW LEVEL SECURITY;

-- Users can read their own blockchain records
CREATE POLICY "blockchain_mock_select_own" ON public.blockchain_mock
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own blockchain records
CREATE POLICY "blockchain_mock_insert_own" ON public.blockchain_mock
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own blockchain records
CREATE POLICY "blockchain_mock_update_own" ON public.blockchain_mock
  FOR UPDATE USING (auth.uid() = user_id);

-- Admins can read all blockchain records
CREATE POLICY "blockchain_mock_admin_select_all" ON public.blockchain_mock
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'ADMIN'
    )
  );
