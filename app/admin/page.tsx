'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, Package, ClipboardList, Wallet, TrendingUp, DollarSign, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { formatCurrency, formatDate } from '@/lib/format';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Stats {
  users: number;
  services: number;
  orders: number;
  pendingRecharges: number;
  totalRevenue: number;
  pendingOrders: number;
}

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<Stats>({
    users: 0, services: 0, orders: 0, pendingRecharges: 0, totalRevenue: 0, pendingOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [
        { count: users },
        { count: services },
        { count: orders },
        { count: pendingRecharges },
        { count: pendingOrders },
        { data: ordersData },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'user'),
        supabase.from('services').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('recharge_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase
          .from('orders')
          .select('*, service:services(name), user:profiles(phone)')
          .order('created_at', { ascending: false })
          .limit(5),
      ]);
      const revenue = (ordersData || []).reduce((sum, o) => sum + (o.total_price || 0), 0);
      setStats({
        users: users || 0,
        services: services || 0,
        orders: orders || 0,
        pendingRecharges: pendingRecharges || 0,
        totalRevenue: revenue,
        pendingOrders: pendingOrders || 0,
      });
      setRecentOrders(ordersData || []);
      setLoading(false);
    })();
  }, []);

  const statCards = [
    { label: 'Total Users', value: stats.users, Icon: Users, color: 'text-blue-600' },
    { label: 'Services', value: stats.services, Icon: Package, color: 'text-silver-700' },
    { label: 'Total Orders', value: stats.orders, Icon: ClipboardList, color: 'text-silver-700' },
    { label: 'Pending Orders', value: stats.pendingOrders, Icon: Clock, color: 'text-amber-600' },
    { label: 'Pending Recharges', value: stats.pendingRecharges, Icon: Wallet, color: 'text-amber-600' },
    { label: 'Revenue', value: formatCurrency(stats.totalRevenue), Icon: DollarSign, color: 'text-green-600' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-silver-900">Dashboard</h1>
        <p className="text-silver-500 mt-1">Welcome back, {profile?.full_name || profile?.phone}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {statCards.map((s) => {
          const Icon = s.Icon;
          return (
            <Card key={s.label} className="silver-card p-4">
              <div className="flex items-center justify-between mb-2">
                <Icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <p className="text-2xl font-bold text-silver-900">{s.value}</p>
              <p className="text-xs text-silver-500 mt-1">{s.label}</p>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="silver-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-silver-900">Recent Orders</h2>
            <Link href="/admin/orders">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </div>
          {loading ? (
            <p className="text-silver-400 text-sm">Loading...</p>
          ) : recentOrders.length === 0 ? (
            <p className="text-silver-500 text-sm">No orders yet</p>
          ) : (
            <div className="space-y-2">
              {recentOrders.map((o) => (
                <div key={o.id} className="flex items-center justify-between p-3 rounded-lg bg-silver-50">
                  <div className="min-w-0">
                    <p className="font-medium text-silver-900 truncate">{o.service?.name || 'Service'}</p>
                    <p className="text-xs text-silver-500">{o.user?.phone} - {formatDate(o.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-silver-900">{formatCurrency(o.total_price)}</p>
                    <p className="text-xs text-silver-500 capitalize">{o.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="silver-card p-5">
          <h2 className="font-semibold text-silver-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/admin/services">
              <Button variant="outline" className="w-full justify-start">
                <Package className="h-4 w-4 mr-2" />
                Manage Services
              </Button>
            </Link>
            <Link href="/admin/banners">
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="h-4 w-4 mr-2" />
                Manage Banners
              </Button>
            </Link>
            <Link href="/admin/recharge-requests">
              <Button variant="outline" className="w-full justify-start">
                <Wallet className="h-4 w-4 mr-2" />
                Recharge Requests
              </Button>
            </Link>
            <Link href="/admin/users">
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Manage Users
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
