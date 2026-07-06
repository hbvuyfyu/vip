'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, AlertCircle, ShoppingCart, Wallet, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import type { Service } from '@/lib/types';
import { formatCurrency } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

export default function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [target, setTarget] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*, provider:providers(*), category:categories(*)')
        .eq('id', id)
        .maybeSingle();
      if (error || !data) {
        setService(null);
      } else {
        setService(data as Service);
        setQuantity((data as Service).min_order || 1);
      }
      setLoading(false);
    })();
  }, [id]);

  const total = service ? service.sell_price * quantity : 0;
  const canAfford = profile ? profile.wallet_balance >= total : false;

  const handleOrder = async () => {
    if (!profile) {
      router.push('/login');
      return;
    }
    if (!service) return;
    if (!target.trim()) {
      toast.error('Please enter the target (e.g. player ID or account link)');
      return;
    }
    if (profile.is_blocked) {
      toast.error('Your account is blocked. Contact support.');
      return;
    }
    if (!canAfford) {
      toast.error('Insufficient wallet balance. Please recharge your wallet.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: service.id,
          quantity,
          target: target.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to place order');
      }
      toast.success('Order placed successfully!');
      router.push('/orders');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-silver-400" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-silver-500">Service not found.</p>
        <Link href="/services" className="text-silver-900 hover:underline mt-2 inline-block">
          Back to services
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/services" className="inline-flex items-center text-silver-600 hover:text-silver-900 mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to services
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="silver-card overflow-hidden p-0">
          <div className="aspect-square bg-silver-100">
            {service.image_url ? (
              <img src={service.image_url} alt={service.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full silver-gradient flex items-center justify-center">
                <Zap className="h-20 w-20 text-silver-400" />
              </div>
            )}
          </div>
        </Card>

        <Card className="silver-card p-6">
          <h1 className="text-2xl font-bold text-silver-900">{service.name}</h1>
          {service.category && (
            <span className="inline-block mt-2 px-3 py-1 rounded-full bg-silver-100 text-silver-700 text-xs font-medium">
              {service.category.name}
            </span>
          )}
          <p className="text-silver-600 mt-4">{service.description || 'Premium digital service with instant delivery.'}</p>

          <div className="mt-6 p-4 rounded-lg bg-silver-50 border border-silver-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-silver-500">Price per unit</span>
              <span className="text-2xl font-bold text-silver-900">{formatCurrency(service.sell_price)}</span>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="target">Target / Account Details</Label>
              <Textarea
                id="target"
                placeholder="Enter player ID, account link, or required details"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min={service.min_order}
                max={service.max_order}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(service.min_order, Math.min(service.max_order, Number(e.target.value) || 1)))}
              />
              <p className="text-xs text-silver-500">
                Min: {service.min_order} / Max: {service.max_order}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-silver-100 flex items-center justify-between">
              <span className="font-medium text-silver-700">Total</span>
              <span className="text-xl font-bold text-silver-900">{formatCurrency(total)}</span>
            </div>

            {authLoading ? null : !profile ? (
              <Link href="/login" className="block">
                <Button className="w-full silver-button">Sign in to Order</Button>
              </Link>
            ) : (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-silver-500 flex items-center gap-1">
                    <Wallet className="h-4 w-4" />
                    Your balance
                  </span>
                  <span className={canAfford ? 'text-silver-900 font-medium' : 'text-red-600 font-medium'}>
                    {formatCurrency(profile.wallet_balance)}
                  </span>
                </div>
                <Button
                  onClick={handleOrder}
                  disabled={submitting || !canAfford}
                  className="w-full silver-button"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShoppingCart className="h-4 w-4 mr-2" />}
                  {canAfford ? 'Place Order' : 'Insufficient Balance'}
                </Button>
                {!canAfford && (
                  <Link href="/wallet/recharge">
                    <Button variant="outline" className="w-full">Recharge Wallet</Button>
                  </Link>
                )}
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
