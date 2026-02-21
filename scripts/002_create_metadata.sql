-- Create metadata table for stego operations
CREATE TABLE IF NOT EXISTS public.metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  original_size INTEGER,
  stego_hash TEXT NOT NULL,
  tx_id TEXT,
  oracle_query_id TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('processing', 'completed', 'verified', 'tampered')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.metadata ENABLE ROW LEVEL SECURITY;

-- Users can read their own metadata
CREATE POLICY "metadata_select_own" ON public.metadata
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own metadata
CREATE POLICY "metadata_insert_own" ON public.metadata
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own metadata
CREATE POLICY "metadata_update_own" ON public.metadata
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own metadata
CREATE POLICY "metadata_delete_own" ON public.metadata
  FOR DELETE USING (auth.uid() = user_id);

-- Admins can read all metadata
CREATE POLICY "metadata_admin_select_all" ON public.metadata
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'ADMIN'
    )
  );
