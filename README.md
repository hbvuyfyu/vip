# King - Premium Digital Services Platform

A professional, production-ready digital services marketplace for game top-ups, app credits, and digital marketing services. Built with Next.js, Supabase, and Tailwind CSS.

## Features

- **Silver-themed premium UI** with animated 3D King logo
- **Phone + password authentication** (Supabase Auth)
- **Internal wallet system** (USD) with recharge requests and admin approval
- **Service marketplace** with categories, sub-buttons, and featured services
- **Provider integration** - add external API providers and auto-sync services
- **Profit margin system** - global and per-service margins (base price never exposed to customers)
- **Banner carousel** with multiple images per banner
- **Admin dashboard** with role-based access (Super Admin / Admin / User)
- **Image uploads** directly from device (Supabase Storage)
- **Audit logging** for all important operations
- **WhatsApp support** floating button
- **Dark mode** support
- **Fully responsive** - mobile-first design

## Tech Stack

- **Frontend**: Next.js 13 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Auth**: Supabase Auth (email/password mapped from phone)
- **Storage**: Supabase Storage (image uploads)
- **Icons**: lucide-react

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- A Supabase project (https://supabase.com)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/hbvuyfyu/vip.git
   cd vip
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in your Supabase credentials:
   ```bash
   cp .env.example .env
   ```

3. The database schema is applied automatically via Supabase migrations. If you need to apply manually, use the Supabase MCP tools or SQL editor.

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:3000

### Making Your First Super Admin

1. Register an account via the `/register` page
2. In the Supabase dashboard, run this SQL to promote your account:
   ```sql
   UPDATE profiles SET role = 'super_admin' WHERE phone = 'YOUR_PHONE_NUMBER';
   ```

### Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
app/
  (public)/          # Public-facing pages (with header/footer)
    page.tsx          # Home page
    login/            # Login page
    register/         # Register page
    services/         # Services listing + detail
    wallet/           # Wallet + recharge
    orders/           # User orders
  admin/              # Admin panel (role-protected)
    page.tsx          # Dashboard
    services/         # Services management
    categories/       # Categories + sub-buttons
    banners/          # Banner management
    orders/           # Orders management
    providers/        # Provider management (super admin)
    recharge-requests/ # Recharge approvals
    users/            # User management
    settings/         # Branding, support, pricing (super admin)
  api/                # API routes
    orders/           # Order creation (wallet deduction + provider forwarding)
    providers/sync/   # Provider service sync
components/
  ui/                 # shadcn/ui components
  king-logo.tsx       # 3D animated King logo
  site-header.tsx     # Public header
  site-footer.tsx     # Public footer
  support-button.tsx  # Floating WhatsApp button
  banner-carousel.tsx # Banner carousel
  service-card.tsx    # Service card
  image-upload.tsx    # Image upload component
lib/
  supabase/           # Supabase clients
  auth-context.tsx    # Auth provider
  settings-context.tsx # Settings provider
  types.ts            # TypeScript types
  format.ts           # Formatting utilities
```

## Database Schema

The platform uses Supabase (PostgreSQL) with the following main tables:

- `profiles` - User accounts (extends auth.users with phone, role, wallet)
- `categories` - Homepage categories
- `sub_buttons` - Sub-buttons within categories
- `providers` - External service providers (API integration)
- `services` - Services from providers (with base/sell pricing)
- `wallet_transactions` - Wallet history
- `recharge_requests` - Wallet recharge requests
- `orders` - Customer orders
- `banners` / `banner_images` - Banner carousels
- `homepage_sections` - Configurable homepage sections
- `audit_logs` - Audit trail
- `settings` - Key-value settings (branding, support, profit, payments)

All tables have Row Level Security (RLS) enabled with appropriate policies.

## Roles & Permissions

- **User**: Browse services, recharge wallet, place orders, view own orders/transactions
- **Admin**: Manage services, categories, banners, orders, users (no pricing/providers)
- **Super Admin**: Everything Admin can do + manage providers, settings, pricing, wallet adjustments

## Security

- Passwords hashed by Supabase Auth (bcrypt)
- Row Level Security on all tables
- Server-side authorization checks in API routes
- Admin-only functions protected by `is_admin()` / `is_super_admin()` SQL helpers
- Wallet operations use SECURITY DEFINER functions to bypass RLS safely
- No sensitive data exposed to frontend (base prices, API keys hidden)

## Deployment

This project is ready to deploy on:
- Vercel (recommended for Next.js)
- Netlify
- Railway
- Any Node.js hosting

Set the environment variables in your hosting platform's dashboard.

## License

MIT
