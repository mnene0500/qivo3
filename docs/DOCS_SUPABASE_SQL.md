
# QIVO Production SQL (Native Vercel Economy)

Run these in your **Supabase SQL Editor** to initialize the mandatory tables and atomic helpers.

```sql
-- 1. SETUP ATOMIC HELPERS (Hardened)
CREATE OR REPLACE FUNCTION public.increment_diamonds(user_id UUID, amount NUMERIC)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.balances (user_id, diamonds)
  VALUES (user_id, amount)
  ON CONFLICT (user_id)
  DO UPDATE SET diamonds = COALESCE(balances.diamonds, 0) + amount, updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.increment_coins(user_id UUID, amount BIGINT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.balances (user_id, coins)
  VALUES (user_id, amount)
  ON CONFLICT (user_id)
  DO UPDATE SET coins = COALESCE(balances.coins, 0) + amount, updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. CREATE MANDATORY TABLES
CREATE TABLE IF NOT EXISTS public.pending_payments (
  order_id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.processed_payments (
  order_tracking_id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC,
  coins BIGINT,
  timestamp BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)
);

-- 3. ENABLE REALTIME SAFELY (Idempotent)
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'balances') THEN 
    ALTER PUBLICATION supabase_realtime ADD TABLE public.balances; 
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'coin_history') THEN 
    ALTER PUBLICATION supabase_realtime ADD TABLE public.coin_history; 
  END IF;
END $$;

-- 4. HARDENED RLS POLICIES (Explicit UPSERT permission)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own profile" ON public.users;
CREATE POLICY "Users can manage own profile" ON public.users 
FOR ALL USING (auth.uid() = uid) WITH CHECK (auth.uid() = uid);
```
