/*
# King Platform - Initial Schema

Complete database schema for the King digital services marketplace.
Tables: profiles, categories, sub_buttons, providers, services,
wallet_transactions, recharge_requests, orders, banners, banner_images,
homepage_sections, audit_logs, settings.
RLS enabled on all tables with helper functions is_admin/is_super_admin.
*/

-- ============================================================
-- PROFILES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone text UNIQUE NOT NULL,
  full_name text DEFAULT '',
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  is_blocked boolean NOT NULL DEFAULT false,
  wallet_balance numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- HELPER FUNCTIONS (after profiles exists)
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
      AND is_blocked = false
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'super_admin'
      AND is_blocked = false
  );
$$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, phone, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.phone, split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- CATEGORIES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text DEFAULT '',
  image_url text DEFAULT '',
  icon text DEFAULT '',
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_public_read" ON public.categories;
CREATE POLICY "categories_public_read"
ON public.categories FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "categories_admin_write" ON public.categories;
CREATE POLICY "categories_admin_write"
ON public.categories FOR ALL
TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- SUB BUTTONS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.sub_buttons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  image_url text DEFAULT '',
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sub_buttons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sub_buttons_public_read" ON public.sub_buttons;
CREATE POLICY "sub_buttons_public_read"
ON public.sub_buttons FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "sub_buttons_admin_write" ON public.sub_buttons;
CREATE POLICY "sub_buttons_admin_write"
ON public.sub_buttons FOR ALL
TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- PROVIDERS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  api_url text NOT NULL,
  api_key text NOT NULL,
  extra_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  last_sync_at timestamptz,
  last_sync_error text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "providers_super_admin_only" ON public.providers;
CREATE POLICY "providers_super_admin_only"
ON public.providers FOR ALL
TO authenticated
USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- ============================================================
-- SERVICES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  provider_service_id text NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  image_url text DEFAULT '',
  base_price numeric(12,2) NOT NULL DEFAULT 0,
  sell_price numeric(12,2) NOT NULL DEFAULT 0,
  profit_margin numeric(5,2) NOT NULL DEFAULT 0,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  sub_button_id uuid REFERENCES public.sub_buttons(id) ON DELETE SET NULL,
  is_visible boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  min_order int NOT NULL DEFAULT 1,
  max_order int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider_id, provider_service_id)
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "services_public_read" ON public.services;
CREATE POLICY "services_public_read"
ON public.services FOR SELECT
TO anon, authenticated USING (is_visible = true OR public.is_admin());

DROP POLICY IF EXISTS "services_admin_write" ON public.services;
CREATE POLICY "services_admin_write"
ON public.services FOR ALL
TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- WALLET TRANSACTIONS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('recharge', 'order', 'refund', 'adjustment')),
  amount numeric(12,2) NOT NULL,
  balance_after numeric(12,2) NOT NULL,
  reference_id uuid,
  description text DEFAULT '',
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wallet_tx_select_own" ON public.wallet_transactions;
CREATE POLICY "wallet_tx_select_own"
ON public.wallet_transactions FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "wallet_tx_admin_insert" ON public.wallet_transactions;
CREATE POLICY "wallet_tx_admin_insert"
ON public.wallet_transactions FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- ============================================================
-- RECHARGE REQUESTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.recharge_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  payment_method text NOT NULL,
  amount numeric(12,2) NOT NULL,
  final_amount numeric(12,2),
  transaction_id text DEFAULT '',
  proof_image_url text DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES public.profiles(id),
  reviewed_at timestamptz,
  admin_notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.recharge_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "recharge_select_own" ON public.recharge_requests;
CREATE POLICY "recharge_select_own"
ON public.recharge_requests FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "recharge_insert_own" ON public.recharge_requests;
CREATE POLICY "recharge_insert_own"
ON public.recharge_requests FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "recharge_admin_update" ON public.recharge_requests;
CREATE POLICY "recharge_admin_update"
ON public.recharge_requests FOR UPDATE
TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- ORDERS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  quantity int NOT NULL DEFAULT 1,
  total_price numeric(12,2) NOT NULL,
  target text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  provider_order_id text DEFAULT '',
  provider_response jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_select_own" ON public.orders;
CREATE POLICY "orders_select_own"
ON public.orders FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "orders_insert_own" ON public.orders;
CREATE POLICY "orders_insert_own"
ON public.orders FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "orders_admin_update" ON public.orders;
CREATE POLICY "orders_admin_update"
ON public.orders FOR UPDATE
TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- BANNERS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  link_url text DEFAULT '',
  width int NOT NULL DEFAULT 1200,
  height int NOT NULL DEFAULT 400,
  duration int NOT NULL DEFAULT 5000,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "banners_public_read" ON public.banners;
CREATE POLICY "banners_public_read"
ON public.banners FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "banners_admin_write" ON public.banners;
CREATE POLICY "banners_admin_write"
ON public.banners FOR ALL
TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- BANNER IMAGES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.banner_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  banner_id uuid NOT NULL REFERENCES public.banners(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.banner_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "banner_images_public_read" ON public.banner_images;
CREATE POLICY "banner_images_public_read"
ON public.banner_images FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "banner_images_admin_write" ON public.banner_images;
CREATE POLICY "banner_images_admin_write"
ON public.banner_images FOR ALL
TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- HOMEPAGE SECTIONS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.homepage_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'custom',
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "homepage_sections_public_read" ON public.homepage_sections;
CREATE POLICY "homepage_sections_public_read"
ON public.homepage_sections FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "homepage_sections_admin_write" ON public.homepage_sections;
CREATE POLICY "homepage_sections_admin_write"
ON public.homepage_sections FOR ALL
TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- AUDIT LOGS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL DEFAULT '',
  entity_id text DEFAULT '',
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_admin_read" ON public.audit_logs;
CREATE POLICY "audit_logs_admin_read"
ON public.audit_logs FOR SELECT
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "audit_logs_admin_insert" ON public.audit_logs;
CREATE POLICY "audit_logs_admin_insert"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- ============================================================
-- SETTINGS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id)
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settings_public_read" ON public.settings;
CREATE POLICY "settings_public_read"
ON public.settings FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "settings_admin_write" ON public.settings;
CREATE POLICY "settings_admin_write"
ON public.settings FOR ALL
TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_services_category ON public.services(category_id);
CREATE INDEX IF NOT EXISTS idx_services_provider ON public.services(provider_id);
CREATE INDEX IF NOT EXISTS idx_services_visible_featured ON public.services(is_visible, is_featured);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_user ON public.wallet_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recharge_user ON public.recharge_requests(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recharge_status ON public.recharge_requests(status);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sub_buttons_category ON public.sub_buttons(category_id);
CREATE INDEX IF NOT EXISTS idx_banner_images_banner ON public.banner_images(banner_id, sort_order);

-- ============================================================
-- STORAGE BUCKET FOR IMAGES
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "images_public_read" ON storage.objects;
CREATE POLICY "images_public_read"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'images');

DROP POLICY IF EXISTS "images_authenticated_insert" ON storage.objects;
CREATE POLICY "images_authenticated_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'images');

DROP POLICY IF EXISTS "images_admin_update" ON storage.objects;
CREATE POLICY "images_admin_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'images' AND public.is_admin());

DROP POLICY IF EXISTS "images_admin_delete" ON storage.objects;
CREATE POLICY "images_admin_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'images' AND public.is_admin());

-- ============================================================
-- DEFAULT SETTINGS
-- ============================================================

INSERT INTO public.settings (key, value) VALUES
  ('branding', '{"site_name":"King","logo_url":"","favicon_url":"","tagline":"Premium Digital Services"}'::jsonb),
  ('support', '{"whatsapp":"+15043253235","instagram":"","facebook":"","telegram":""}'::jsonb),
  ('profit', '{"global_margin":15}'::jsonb),
  ('payment_methods', '{"methods":[{"id":"usdt","name":"USDT (TRC20)","address":"TYourWalletAddressHere","notes":"Send only USDT to this address on TRC20 network."},{"id":"bank","name":"Bank Transfer","address":"Bank Account 0000 0000 0000","notes":"Contact support after transfer."}]}'::jsonb)
ON CONFLICT (key) DO NOTHING;
