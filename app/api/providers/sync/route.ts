import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_blocked')
      .eq('id', user.id)
      .maybeSingle();
    if (!profile || profile.role !== 'super_admin' || profile.is_blocked) {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }

    const { provider_id } = await req.json();
    if (!provider_id) {
      return NextResponse.json({ error: 'Provider ID required' }, { status: 400 });
    }

    const { data: provider } = await supabase
      .from('providers')
      .select('*')
      .eq('id', provider_id)
      .maybeSingle();
    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    let services: any[] = [];
    let syncError = '';
    try {
      const body: Record<string, unknown> = {
        key: provider.api_key,
        action: 'services',
      };
      Object.assign(body, provider.extra_config || {});
      const res = await fetch(provider.api_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        syncError = `Provider returned ${res.status}`;
      } else {
        const data = await res.json();
        services = Array.isArray(data) ? data : (data.services || []);
      }
    } catch (e) {
      syncError = e instanceof Error ? e.message : 'Network error';
    }

    let synced = 0;
    for (const s of services) {
      const providerServiceId = String(s.service || s.id || '');
      const name = String(s.name || 'Unnamed service');
      const basePrice = Number(s.rate || s.price || 0) / 1000;
      const { data: profitRow } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'profit')
        .maybeSingle();
      const margin = Number((profitRow?.value as any)?.global_margin || 15);
      const sellPrice = Number((basePrice * (1 + margin / 100)).toFixed(4));

      const { error } = await supabase
        .from('services')
        .upsert(
          {
            provider_id: provider.id,
            provider_service_id: providerServiceId,
            name,
            description: String(s.description || ''),
            base_price: basePrice,
            sell_price: sellPrice,
            profit_margin: margin,
            min_order: Number(s.min || 1),
            max_order: Number(s.max || 1),
          },
          { onConflict: 'provider_id,provider_service_id' }
        );
      if (!error) synced++;
    }

    await supabase
      .from('providers')
      .update({
        last_sync_at: new Date().toISOString(),
        last_sync_error: syncError,
        updated_at: new Date().toISOString(),
      })
      .eq('id', provider.id);

    if (syncError && services.length === 0) {
      return NextResponse.json({ error: syncError, synced: 0 }, { status: 502 });
    }

    return NextResponse.json({ synced, total: services.length });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Server error' }, { status: 500 });
  }
}
