import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import type { Profile, Service, Provider } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { service_id, quantity, target } = body as { service_id: string; quantity: number; target: string };

    if (!service_id || !quantity || !target) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    const profile = profileData as Profile | null;
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    if (profile.is_blocked) {
      return NextResponse.json({ error: 'Account is blocked' }, { status: 403 });
    }

    const { data: serviceData } = await supabase
      .from('services')
      .select('*, provider:providers(*)')
      .eq('id', service_id)
      .maybeSingle();
    const service = serviceData as (Service & { provider: Provider }) | null;
    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }
    if (!service.is_visible) {
      return NextResponse.json({ error: 'Service is not available' }, { status: 400 });
    }

    const qty = Math.max(service.min_order || 1, Math.min(service.max_order || 1, Number(quantity) || 1));
    const total = Number(service.sell_price) * qty;

    if (Number(profile.wallet_balance) < total) {
      return NextResponse.json({ error: 'Insufficient wallet balance' }, { status: 400 });
    }

    const newBalance = Number(profile.wallet_balance) - total;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ wallet_balance: newBalance, updated_at: new Date().toISOString() })
      .eq('id', profile.id);
    if (updateError) {
      return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 });
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: profile.id,
        service_id: service.id,
        provider_id: service.provider_id,
        quantity: qty,
        total_price: total,
        target,
        status: 'pending',
      })
      .select()
      .single();
    if (orderError) {
      await supabase
        .from('profiles')
        .update({ wallet_balance: Number(profile.wallet_balance), updated_at: new Date().toISOString() })
        .eq('id', profile.id);
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    await supabase.from('wallet_transactions').insert({
      user_id: profile.id,
      type: 'order',
      amount: -total,
      balance_after: newBalance,
      reference_id: order.id,
      description: `Order for ${service.name}`,
      created_by: profile.id,
    });

    try {
      const provider = service.provider;
      if (provider?.api_url && provider?.api_key) {
        const providerResponse = await forwardToProvider(provider, service, qty, target);
        if (providerResponse.ok) {
          const data = await providerResponse.json().catch(() => ({}));
          await supabase.from('orders').update({
            status: 'processing',
            provider_order_id: String(data.order || data.id || ''),
            provider_response: data,
            updated_at: new Date().toISOString(),
          }).eq('id', order.id);
        } else {
          await supabase.from('orders').update({
            status: 'processing',
            provider_response: { error: 'Provider call pending manual review' },
            updated_at: new Date().toISOString(),
          }).eq('id', order.id);
        }
      }
    } catch {
      // Provider call failed - order remains pending for manual processing
    }

    return NextResponse.json({ order_id: order.id, status: 'pending' });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Server error' }, { status: 500 });
  }
}

async function forwardToProvider(provider: Provider, service: Service, quantity: number, target: string) {
  const body: Record<string, unknown> = {
    key: provider.api_key,
    action: 'add',
    service: service.provider_service_id,
    quantity,
    link: target,
  };
  Object.assign(body, provider.extra_config || {});
  return fetch(provider.api_url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
