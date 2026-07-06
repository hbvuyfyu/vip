'use client';

import { MessageCircle } from 'lucide-react';
import { useSettings } from '@/lib/settings-context';

export function SupportButton() {
  const { settings } = useSettings();
  const whatsapp = settings?.support?.whatsapp || '+15043253235';
  const url = `https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp Support"
      className="fixed bottom-5 right-5 z-50 group"
    >
      <div className="relative">
        <span className="absolute inset-0 rounded-full bg-green-500/40 animate-ping" />
        <div className="relative h-14 w-14 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all hover:scale-105">
          <MessageCircle className="h-7 w-7 text-white" fill="white" />
        </div>
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-silver-900 px-3 py-1.5 text-xs font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Chat with us
        </span>
      </div>
    </a>
  );
}
