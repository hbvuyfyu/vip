'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Package, Clock, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import type { Order } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/format';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const statusConfig = {
  pending: { Icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Pending' },
  processing: { Icon: RefreshCw, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', label: 'Processing' },
  completed: { Icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', label: 'Completed' },
  failed: { Icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'Failed' },
  cancelled: { Icon: XCircle, color: 'text-silver-500', bg: 'bg-silver-100', border: 'border-silver-200', label: 'Cancelled' },
};

export default function OrdersPage() {
  const { profile, loading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (!profile) {
      setOrdersLoading(false);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from('orders')
        .select('*, service:services(*)')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });
      setOrders((data as Order[]) || []);
      setOrdersLoading(false);
    })();
  }, [profile]);

  if (loading || ordersLoading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-silver-400" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-silver-500">Please sign in to view your orders.</p>
        <Link href="/login" className="mt-4 inline-block">
          <Button className="silver-button">Sign In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-silver-900 mb-6">My Orders</h1>

      {orders.length === 0 ? (
        <Card className="silver-card p-8 text-center">
          <Package className="h-12 w-12 text-silver-300 mx-auto mb-3" />
          <p className="text-silver-500">No orders yet</p>
          <p className="text-sm text-silver-400 mt-1">Browse services and place your first order</p>
          <Link href="/services" className="mt-4 inline-block">
            <Button className="silver-button">Browse Services</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const cfg = statusConfig[order.status];
            const Icon = cfg.Icon;
            return (
              <Card key={order.id} className="silver-card p-4">
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-lg bg-silver-100 overflow-hidden flex-shrink-0">
                    {order.service?.image_url ? (
                      <img src={order.service.image_url} alt={order.service.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Package className="h-6 w-6 text-silver-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-silver-900 truncate">{order.service?.name || 'Service'}</h3>
                        <p className="text-xs text-silver-500 mt-0.5">Order #{order.id.slice(0, 8)}</p>
                      </div>
                      <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border', cfg.bg, cfg.border, cfg.color)}>
                        <Icon className="h-3 w-3" />
                        {cfg.label}
                      </span>
                    </div>
                    {order.target && (
                      <p className="text-xs text-silver-500 mt-2 truncate">Target: {order.target}</p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-sm text-silver-500">Qty: {order.quantity}</span>
                      <span className="font-bold text-silver-900">{formatCurrency(order.total_price)}</span>
                    </div>
                    <p className="text-xs text-silver-400 mt-1">{formatDate(order.created_at)}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
