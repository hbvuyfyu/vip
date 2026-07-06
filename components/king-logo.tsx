'use client';

import { useSettings } from '@/lib/settings-context';

interface KingLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  showText?: boolean;
}

const sizeMap = {
  sm: { box: 'h-8 w-8', text: 'text-lg' },
  md: { box: 'h-12 w-12', text: 'text-2xl' },
  lg: { box: 'h-20 w-20', text: 'text-4xl' },
  xl: { box: 'h-32 w-32', text: 'text-6xl' },
};

export function KingLogo({ size = 'md', animated = true, showText = true }: KingLogoProps) {
  const { settings } = useSettings();
  const sizes = sizeMap[size];
  const logoUrl = settings?.branding?.logo_url;

  return (
    <div className="flex items-center gap-3">
      <div className={`relative ${sizes.box} flex items-center justify-center`} style={{ perspective: '600px' }}>
        {logoUrl ? (
          <img
            src={logoUrl}
            alt="King"
            className="h-full w-full object-contain"
            style={{ filter: 'drop-shadow(0 4px 12px rgba(15,23,42,0.15))' }}
          />
        ) : (
          <div
            className={animated ? 'king-3d' : ''}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <svg
              viewBox="0 0 64 64"
              className="h-full w-full"
              style={{ filter: 'drop-shadow(0 4px 12px rgba(15,23,42,0.2))' }}
            >
              <defs>
                <linearGradient id="kingGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="30%" stopColor="#e2e8f0" />
                  <stop offset="60%" stopColor="#94a3b8" />
                  <stop offset="100%" stopColor="#475569" />
                </linearGradient>
                <linearGradient id="kingGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f8fafc" />
                  <stop offset="50%" stopColor="#cbd5e1" />
                  <stop offset="100%" stopColor="#64748b" />
                </linearGradient>
              </defs>
              <circle cx="32" cy="32" r="30" fill="url(#kingGrad)" stroke="#94a3b8" strokeWidth="1" />
              <circle cx="32" cy="32" r="26" fill="none" stroke="#475569" strokeWidth="0.5" opacity="0.4" />
              <path
                d="M20 44 L20 22 L26 30 L32 18 L38 30 L44 22 L44 44 Z"
                fill="url(#kingGrad2)"
                stroke="#334155"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
              <circle cx="20" cy="20" r="2.5" fill="#f1f5f9" stroke="#334155" strokeWidth="0.8" />
              <circle cx="32" cy="16" r="2.5" fill="#f1f5f9" stroke="#334155" strokeWidth="0.8" />
              <circle cx="44" cy="20" r="2.5" fill="#f1f5f9" stroke="#334155" strokeWidth="0.8" />
              <rect x="18" y="44" width="28" height="4" rx="1" fill="url(#kingGrad2)" stroke="#334155" strokeWidth="0.8" />
            </svg>
          </div>
        )}
      </div>
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`font-bold tracking-tight king-text-3d ${sizes.text}`}>
            {settings?.branding?.site_name || 'King'}
          </span>
          {size === 'lg' || size === 'xl' ? (
            <span className="text-xs text-silver-500 font-medium tracking-widest uppercase mt-1">
              {settings?.branding?.tagline || 'Premium Digital Services'}
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}
