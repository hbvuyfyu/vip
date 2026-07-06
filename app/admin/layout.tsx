'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Package, Users, Wallet, Image, Settings, Server,
  ClipboardList, Tags, LogOut, Menu, X, Shield, ChevronRight, Crown,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import type { Profile } from '@/lib/types';
import { KingLogo } from '@/components/king-logo';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetClose } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/admin', label: 'Dashboard', Icon: LayoutDashboard, superOnly: false },
  { href: '/admin/services', label: 'Services', Icon: Package, superOnly: false },
  { href: '/admin/categories', label: 'Categories', Icon: Tags, superOnly: false },
  { href: '/admin/banners', label: 'Banners', Icon: Image, superOnly: false },
  { href: '/admin/orders', label: 'Orders', Icon: ClipboardList, superOnly: false },
  { href: '/admin/recharge-requests', label: 'Recharge Requests', Icon: Wallet, superOnly: false },
  { href: '/admin/users', label: 'Users', Icon: Users, superOnly: false },
  { href: '/admin/providers', label: 'Providers', Icon: Server, superOnly: true },
  { href: '/admin/settings', label: 'Settings', Icon: Settings, superOnly: true },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, loading, signOut } = useAuth();
  const [authChecked, setAuthChecked] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!profile) {
      router.replace('/login');
      return;
    }
    if (profile.role !== 'admin' && profile.role !== 'super_admin') {
      router.replace('/');
      return;
    }
    setAuthChecked(true);
  }, [profile, loading, router]);

  if (loading || !authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-silver-400">Loading...</div>
      </div>
    );
  }

  const isSuperAdmin = profile?.role === 'super_admin';
  const visibleNav = navItems.filter((n) => !n.superOnly || isSuperAdmin);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-silver-200">
        <Link href="/admin" className="flex items-center">
          <KingLogo size="sm" />
        </Link>
        <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-silver-100">
          <Shield className="h-4 w-4 text-silver-600" />
          <span className="text-sm font-medium text-silver-700">
            {isSuperAdmin ? 'Super Admin' : 'Admin'}
          </span>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {visibleNav.map((item) => {
          const Icon = item.Icon;
          const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                active
                  ? 'bg-silver-200 text-silver-900'
                  : 'text-silver-600 hover:bg-silver-100 hover:text-silver-900'
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight className="h-4 w-4" />}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-silver-200 space-y-2">
        <Link href="/" onClick={() => setOpen(false)}>
          <Button variant="ghost" className="w-full justify-start">
            <Crown className="h-4 w-4 mr-2" />
            View Site
          </Button>
        </Link>
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:text-red-700"
          onClick={() => {
            signOut();
            router.push('/login');
          }}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-silver-50">
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 border-r border-silver-200 bg-white">
        <SidebarContent />
      </aside>

      <div className="lg:pl-64">
        <header className="lg:hidden sticky top-0 z-30 glass-effect border-b border-silver-200 px-4 h-14 flex items-center justify-between">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetTitle className="sr-only">Admin menu</SheetTitle>
              <SidebarContent />
            </SheetContent>
          </Sheet>
          <Link href="/admin">
            <KingLogo size="sm" showText={false} />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              signOut();
              router.push('/login');
            }}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </header>

        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
