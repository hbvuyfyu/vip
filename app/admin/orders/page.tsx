'use client';

import { useEffect, useState } from 'react';
import { Loader2, Package, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import type { Order } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/format';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const statusColors: Record<Order['status'], string> = {
  pending: 'bg-amber-100 text-amber-700',
  processing: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  cancelled: 'bg-silver-100 text-silver-600',
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | Order['status']>('all');

  const load = async () => {
    let q = supabase
      .from('orders')
      .select('*, service:services(*), user:profiles(*)')
      .order('created_at', { ascending: false });
    if (filter !== 'all') q = q.eq('status', filter);
    const { data } = await q;
    setOrders((data as Order[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    load();
  }, [filter]);

  const updateStatus = async (o: Order, status: Order['status']) => {
    const { error } = await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', o.id);
    if (error) toast.error(error.message);
    else { toast.success('Status updated'); load(); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-silver-900">Orders</h1>
          <p className="text-silver-500 mt-1">Manage customer orders</p>
        </div>
        <Button onClick={load} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {(['all', 'pending', 'processing', 'completed', 'failed', 'cancelled'] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f)}
            className={filter === f ? 'silver-button capitalize' : 'capitalize'}
          >
            {f}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-silver-400" />
        </div>
      ) : orders.length === 0 ? (
        <Card className="silver-card p-8 text-center">
          <Package className="h-12 w-12 text-silver-300 mx-auto mb-3" />
          <p className="text-silver-500">No orders found</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {orders.map((o) => (
            <Card key={o.id} className="silver-card p-4">
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 rounded-lg bg-silver-100 overflow-hidden flex-shrink-0">
                  {o.service?.image_url ? (
                    <img src={o.service.image_url} alt={o.service.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Package className="h-5 w-5 text-silver-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-silver-900 truncate">{o.service?.name || 'Service'}</h3>
                    <Badge className={statusColors[o.status]}>{o.status}</Badge>
                  </div>
                  <p className="text-xs text-silver-500 mt-0.5">
                    {o.user?.phone} - Qty: {o.quantity} - {formatCurrency(o.total_price)}
                  </p>
                  {o.target && <p className="text-xs text-silver-500 truncate">Target: {o.target}</p>}
                  <p className="text-xs text-silver-400 mt-1">{formatDate(o.created_at)}</p>
                </div>
                <select
                  value={o.status}
                  onChange={(e) => updateStatus(o, e.target.value as Order['status'])}
                  className="h-8 rounded border border-silver-200 bg-white px-2 text-xs"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
