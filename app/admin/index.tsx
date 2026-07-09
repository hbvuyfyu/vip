import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { AppHeader } from '@/components/AppHeader';
import { StatCard } from '@/components/StatCard';
import { COLORS } from '@/constants/colors';

const sections = [
  { label: 'مزودي الخدمات', icon: 'server-outline', route: '/admin/providers' },
  { label: 'الخدمات', icon: 'grid-outline', route: '/admin/services' },
  { label: 'الفئات', icon: 'folder-outline', route: '/admin/categories' },
  { label: 'البانرات', icon: 'images-outline', route: '/admin/banners' },
  { label: 'المستخدمون', icon: 'people-outline', route: '/admin/users' },
  { label: 'الطلبات', icon: 'receipt-outline', route: '/admin/orders' },
  { label: 'طلبات الشحن', icon: 'wallet-outline', route: '/admin/recharge' },
  { label: 'الإعدادات', icon: 'settings-outline', route: '/admin/settings' },
] as const;

export default function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [orders, users, requests] = await Promise.all([
        supabase.from('orders').select('id, total_price', { count: 'exact' }),
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('recharge_requests').select('id').eq('status', 'pending'),
      ]);
      const revenue = (orders.data ?? []).reduce((s, o) => s + o.total_price, 0);
      return {
        orders: orders.count ?? 0,
        users: users.count ?? 0,
        revenue,
        pending: requests.data?.length ?? 0,
      };
    },
  });

  return (
    <View style={styles.screen}>
      <AppHeader title="لوحة الإدارة" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statsRow}>
          <StatCard label="إجمالي الطلبات" value={stats?.orders ?? 0} icon="receipt-outline" />
          <StatCard label="المستخدمون" value={stats?.users ?? 0} icon="people-outline" color={COLORS.silver} />
        </View>
        <View style={styles.statsRow}>
          <StatCard label="الإيرادات" value={`${(stats?.revenue ?? 0).toFixed(0)} ر.س`} icon="trending-up-outline" color="#4CAF50" />
          <StatCard label="شحن معلق" value={stats?.pending ?? 0} icon="time-outline" color="#FF9800" />
        </View>

        <Text style={styles.sectionTitle}>أقسام الإدارة</Text>
        <View style={styles.grid}>
          {sections.map(s => (
            <TouchableOpacity key={s.route} style={styles.card} onPress={() => router.push(s.route as any)}>
              <Ionicons name={s.icon as any} size={28} color={COLORS.gold} />
              <Text style={styles.cardLabel}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, gap: 12 },
  statsRow: { flexDirection: 'row', gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginTop: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    width: '47%',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text },
});
