export type UserRole = 'user' | 'admin' | 'super_admin';

export interface Profile {
  id: string;
  phone: string;
  full_name: string;
  role: UserRole;
  is_blocked: boolean;
  wallet_balance: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubButton {
  id: string;
  category_id: string;
  name: string;
  image_url: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  category?: Category;
}

export interface Provider {
  id: string;
  name: string;
  api_url: string;
  api_key: string;
  extra_config: Record<string, unknown>;
  is_active: boolean;
  last_sync_at: string | null;
  last_sync_error: string;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  provider_id: string;
  provider_service_id: string;
  name: string;
  description: string;
  image_url: string;
  base_price: number;
  sell_price: number;
  profit_margin: number;
  category_id: string | null;
  sub_button_id: string | null;
  is_visible: boolean;
  is_featured: boolean;
  sort_order: number;
  min_order: number;
  max_order: number;
  created_at: string;
  updated_at: string;
  provider?: Provider;
  category?: Category;
}

export interface WalletTransaction {
  id: string;
  user_id: string;
  type: 'recharge' | 'order' | 'refund' | 'adjustment';
  amount: number;
  balance_after: number;
  reference_id: string | null;
  description: string;
  created_by: string | null;
  created_at: string;
}

export interface RechargeRequest {
  id: string;
  user_id: string;
  payment_method: string;
  amount: number;
  final_amount: number | null;
  transaction_id: string;
  proof_image_url: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string | null;
  reviewed_at: string | null;
  admin_notes: string;
  created_at: string;
  user?: Profile;
}

export interface Order {
  id: string;
  user_id: string;
  service_id: string;
  provider_id: string;
  quantity: number;
  total_price: number;
  target: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  provider_order_id: string;
  provider_response: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  service?: Service;
  user?: Profile;
}

export interface Banner {
  id: string;
  title: string;
  link_url: string;
  width: number;
  height: number;
  duration: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  images?: BannerImage[];
}

export interface BannerImage {
  id: string;
  banner_id: string;
  image_url: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface HomepageSection {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
  sort_order: number;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  details: Record<string, unknown>;
  created_at: string;
  actor?: Profile;
}

export interface Settings {
  branding: {
    site_name: string;
    logo_url: string;
    favicon_url: string;
    tagline: string;
  };
  support: {
    whatsapp: string;
    instagram: string;
    facebook: string;
    telegram: string;
  };
  profit: {
    global_margin: number;
  };
  payment_methods: {
    methods: Array<{
      id: string;
      name: string;
      address: string;
      notes: string;
    }>;
  };
}

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> };
      categories: { Row: Category; Insert: Partial<Category>; Update: Partial<Category> };
      sub_buttons: { Row: SubButton; Insert: Partial<SubButton>; Update: Partial<SubButton> };
      providers: { Row: Provider; Insert: Partial<Provider>; Update: Partial<Provider> };
      services: { Row: Service; Insert: Partial<Service>; Update: Partial<Service> };
      wallet_transactions: { Row: WalletTransaction; Insert: Partial<WalletTransaction>; Update: Partial<WalletTransaction> };
      recharge_requests: { Row: RechargeRequest; Insert: Partial<RechargeRequest>; Update: Partial<RechargeRequest> };
      orders: { Row: Order; Insert: Partial<Order>; Update: Partial<Order> };
      banners: { Row: Banner; Insert: Partial<Banner>; Update: Partial<Banner> };
      banner_images: { Row: BannerImage; Insert: Partial<BannerImage>; Update: Partial<BannerImage> };
      homepage_sections: { Row: HomepageSection; Insert: Partial<HomepageSection>; Update: Partial<HomepageSection> };
      audit_logs: { Row: AuditLog; Insert: Partial<AuditLog>; Update: Partial<AuditLog> };
      settings: { Row: { key: string; value: Record<string, unknown>; updated_at: string; updated_by: string | null }; Insert: { key: string; value: Record<string, unknown>; updated_by?: string }; Update: { value?: Record<string, unknown>; updated_by?: string } };
    };
  };
}
