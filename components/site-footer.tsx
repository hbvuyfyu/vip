'use client';

import Link from 'next/link';
import { Instagram, Facebook, Send, MessageCircle } from 'lucide-react';
import { KingLogo } from '@/components/king-logo';
import { useSettings } from '@/lib/settings-context';

export function SiteFooter() {
  const { settings } = useSettings();
  const support = settings?.support;

  const socials = [
    { key: 'instagram', url: support?.instagram, Icon: Instagram, label: 'Instagram' },
    { key: 'facebook', url: support?.facebook, Icon: Facebook, label: 'Facebook' },
    { key: 'telegram', url: support?.telegram, Icon: Send, label: 'Telegram' },
    {
      key: 'whatsapp',
      url: support?.whatsapp ? `https://wa.me/${support.whatsapp.replace(/[^0-9]/g, '')}` : '',
      Icon: MessageCircle,
      label: 'WhatsApp',
    },
  ].filter((s) => s.url);

  return (
    <footer className="mt-20 border-t border-silver-200 bg-silver-50/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <KingLogo size="md" />
            <p className="mt-4 text-sm text-silver-600 max-w-md">
              {settings?.branding?.tagline || 'Premium Digital Services'}. Game top-ups,
              app credits, and digital marketing services with instant delivery and secure payments.
            </p>
            {socials.length > 0 && (
              <div className="flex items-center gap-3 mt-6">
                {socials.map(({ key, url, Icon, label }) => (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="h-10 w-10 rounded-full silver-card flex items-center justify-center text-silver-700 hover:text-silver-900"
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-silver-900 mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="text-silver-600 hover:text-silver-900">Home</Link></li>
              <li><Link href="/services" className="text-silver-600 hover:text-silver-900">Services</Link></li>
              <li><Link href="/wallet" className="text-silver-600 hover:text-silver-900">Wallet</Link></li>
              <li><Link href="/orders" className="text-silver-600 hover:text-silver-900">My Orders</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-silver-900 mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              {support?.whatsapp && (
                <li>
                  <a
                    href={`https://wa.me/${support.whatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-silver-600 hover:text-silver-900"
                  >
                    WhatsApp Support
                  </a>
                </li>
              )}
              <li><Link href="/register" className="text-silver-600 hover:text-silver-900">Create Account</Link></li>
              <li><Link href="/login" className="text-silver-600 hover:text-silver-900">Sign In</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-silver-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-silver-500">
            &copy; {new Date().getFullYear()} {settings?.branding?.site_name || 'King'}. All rights reserved.
          </p>
          <p className="text-xs text-silver-500">Premium Digital Services Platform</p>
        </div>
      </div>
    </footer>
  );
}
