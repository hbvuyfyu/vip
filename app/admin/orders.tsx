import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { AppHeader } from '@/components/AppHeader';
import { COLORS, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '@/constants/colors';
import type { Order } from '@/lib/types';

const STATUSES = ['pending', 'processing', 'completed', 'failed', 'cancelled'] as const;

export default function AdminOrders() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>('pending');

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['admin-orders', filter],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, service:services(name), user:profiles(full_name,phone)')
        .eq('status', filter)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as Order[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('orders').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-orders'] }),
  });

  const changeStatus = (order: Order) => {
    Alert.alert('تغيير الحالة', 'اختر الحالة الجديدة:', STATUSES.map(s => ({
      text: ORDER_STATUS_LABELS[s] ?? s,
      onPress: () => updateStatus.mutate({ id: order.id, status: s }),
    })));
  };

  const renderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity style={styles.row} onPress={() => changeStatus(item)} activeOpacity={0.8}>
      <View style={{ flex: 1 }}>
        <Text style={styles.service}>{(item as any).service?.name ?? 'خدمة'}</Text>
        <Text style={styles.user}>{(item as any).user?.full_name ?? ''} · {(item as any).user?.phone ?? ''}</Text>
        <Text style={styles.info}>الكمية: {item.quantity} · {item.total_price.toFixed(2)} ر.س</Text>
        <Text style={styles.target} numberOfLines={1}>{item.target}</Text>
      </View>
      <View style={[styles.badge, { backgroundColor: (ORDER_STATUS_COLORS as any)[item.status] + '33' }]}>
        <Text style={[styles.badgeText, { color: (ORDER_STATUS_COLORS as any)[item.status] }]}>
          {(ORDER_STATUS_LABELS as any)[item.status] ?? item.status}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.screen}>
      <AppHeader title="إدارة الطلبات" />
      <View style={styles.filters}>
        {STATUSES.map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.chip, filter === s && styles.chipActive]}
            onPress={() => setFilter(s)}
          >
            <Text style={[styles.chipText, filter === s && styles.chipTextActive]}>
              {(ORDER_STATUS_LABELS as any)[s]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {isLoading
        ? <ActivityIndicator color={COLORS.gold} style={{ marginTop: 40 }} />
        : (
          <FlatList
            data={orders}
            keyExtractor={o => o.id}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 12, gap: 8 }}
          />
        )
      }
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  filters: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, gap: 6, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  chipActive: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  chipText: { fontSize: 12, color: COLORS.textMuted },
  chipTextActive: { color: COLORS.background, fontWeight: '700' },
  row: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  service: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  user: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  info: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  target: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  badge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: '700' },
});
