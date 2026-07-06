'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Settings } from '@/lib/types';

interface SettingsContextValue {
  settings: Settings | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const defaultSettings: Settings = {
  branding: { site_name: 'King', logo_url: '', favicon_url: '', tagline: 'Premium Digital Services' },
  support: { whatsapp: '+15043253235', instagram: '', facebook: '', telegram: '' },
  profit: { global_margin: 15 },
  payment_methods: { methods: [] },
};

const SettingsContext = createContext<SettingsContextValue>({
  settings: defaultSettings,
  loading: true,
  refresh: async () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const { data, error } = await supabase.from('settings').select('key, value');
    if (error) {
      setLoading(false);
      return;
    }
    const merged: Partial<Settings> = {};
    for (const row of data || []) {
      (merged as Record<string, unknown>)[row.key] = row.value;
    }
    setSettings({ ...defaultSettings, ...merged } as Settings);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading, refresh }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
