import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/lib/auth-context';
import { SettingsProvider } from '@/lib/settings-context';
import { SupportButton } from '@/components/support-button';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'King - Premium Digital Services',
  description: 'Game top-ups, app credits, and digital marketing services with instant delivery and secure payments.',
  openGraph: {
    title: 'King - Premium Digital Services',
    description: 'Game top-ups, app credits, and digital marketing services with instant delivery and secure payments.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'King - Premium Digital Services',
    description: 'Game top-ups, app credits, and digital marketing services with instant delivery and secure payments.',
  },
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider>
          <SettingsProvider>
            <AuthProvider>
              {children}
              <SupportButton />
              <Toaster position="top-right" />
            </AuthProvider>
          </SettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
