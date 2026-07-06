'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X, Wallet, User, LogOut, Shield, Package, Home } from 'lucide-react';
import { KingLogo } from '@/components/king-logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { formatCurrency } from '@/lib/format';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet';

const navLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/services', label: 'Services', icon: Package },
  { href: '/wallet', label: 'Wallet', icon: Wallet },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { profile, signOut, loading } = useAuth();
  const [open, setOpen] = useState(false);

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';

  return (
    <header className="sticky top-0 z-40 w-full glass-effect border-b border-silver-200/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <KingLogo size="sm" />
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-silver-200 text-silver-800'
                    : 'text-silver-600 hover:text-silver-900 hover:bg-silver-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
          {isAdmin && (
            <Link
              href="/admin"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                pathname.startsWith('/admin')
                  ? 'bg-silver-200 text-silver-800'
                  : 'text-silver-600 hover:text-silver-900 hover:bg-silver-100'
              }`}
            >
              <Shield className="h-4 w-4" />
              Admin
            </Link>
          )}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />
          {loading ? null : profile ? (
            <>
              <Link href="/wallet">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-silver-100 border border-silver-200">
                  <Wallet className="h-4 w-4 text-silver-600" />
                  <span className="text-sm font-semibold text-silver-800">
                    {formatCurrency(profile.wallet_balance)}
                  </span>
                </div>
              </Link>
              <Link href="/orders">
                <Button variant="ghost" size="sm" className="text-silver-700">
                  <User className="h-4 w-4 mr-1" />
                  Account
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="text-silver-700"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-silver-700">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="silver-button">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>

        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 max-w-full">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b border-silver-200">
                  <KingLogo size="sm" />
                  <SheetClose asChild>
                    <Button variant="ghost" size="icon">
                      <X className="h-5 w-5" />
                    </Button>
                  </SheetClose>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                  {navLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <SheetClose asChild key={link.href}>
                        <Link
                          href={link.href}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                            pathname === link.href
                              ? 'bg-silver-200 text-silver-800'
                              : 'text-silver-600 hover:bg-silver-100'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          {link.label}
                        </Link>
                      </SheetClose>
                    );
                  })}
                  {isAdmin && (
                    <SheetClose asChild>
                      <Link
                        href="/admin"
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                          pathname.startsWith('/admin')
                            ? 'bg-silver-200 text-silver-800'
                            : 'text-silver-600 hover:bg-silver-100'
                        }`}
                      >
                        <Shield className="h-5 w-5" />
                        Admin Panel
                      </Link>
                    </SheetClose>
                  )}
                </nav>
                <div className="p-4 border-t border-silver-200 space-y-2">
                  {profile ? (
                    <>
                      <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-silver-100">
                        <span className="text-sm text-silver-600">Balance</span>
                        <span className="font-semibold text-silver-900">
                          {formatCurrency(profile.wallet_balance)}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          signOut();
                          setOpen(false);
                        }}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </Button>
                    </>
                  ) : (
                    <>
                      <SheetClose asChild>
                        <Link href="/login">
                          <Button variant="outline" className="w-full">
                            Sign In
                          </Button>
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link href="/register">
                          <Button className="w-full silver-button">Get Started</Button>
                        </Link>
                      </SheetClose>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
