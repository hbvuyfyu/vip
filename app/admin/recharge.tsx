import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { AppHeader } from '@/components/AppHeader';
import { COLORS } from '@/constants/colors';
import type { RechargeRequest } from '@/lib/types';

export default function AdminRecharge() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState('pending');

  const { data = [], isLoading } = useQuery({
    queryKey: ['admin-recharge', filter],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recharge_requests')
        .select('*, user:profiles(full_name,phone,wallet_balance)')
        .eq('status', filter)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as RechargeRequest[];
    },
  });

  const approve = useMutation({
    mutationFn: async (req: RechargeRequest) => {
      const amount = req.final_amount ?? req.amount;
      const newBalance = ((req.user as any)?.wallet_balance ?? 0) + amount;
      const [r1, r2, r3] = await Promise.all([
        supabase.from('recharge_requests').update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          final_amount: amount,
        }).eq('id', req.id),
        supabase.from('profiles').update({ wallet_balance: newBalance }).eq('id', req.user_id),
        supabase.from('wallet_transactions').insert({
          user_id: req.user_id,
          type: 'recharge',
          amount,
          balance_after: newBalance,
          reference_id: req.id,
          description: `شحن رصيد عبر ${req.payment_method}`,
        }),
      ]);
      if (r1.error) throw r1.error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-recharge'] }),
    onError: (e: Error) => Alert.alert('خطأ', e.message),
  });

  const reject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('recharge_requests').update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-recharge'] }),
  });

  const renderItem = ({ item }: { item: RechargeRequest }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{(item.user as any)?.full_name ?? 'مستخدم'}</Text>
          <Text style={styles.phone}>{(item.user as any)?.phone ?? ''}</Text>
          <Text style={styles.amount}>{item.amount.toFixed(2)} ر.س</Text>
          <Text style={styles.meta}>{item.payment_method} · {new Date(item.created_at).toLocaleDateString('ar')}</Text>
          {item.transaction_id ? <Text style={styles.txid}>رقم العملية: {item.transaction_id}</Text> : null}
        </View>
        {item.proof_image_url ? (
          <Image source={{ uri: item.proof_image_url }} style={styles.proof} resizeMode="cover" />
        ) : null}
      </View>
      {filter === 'pending' && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: '#4CAF50' }]}
            onPress={() => Alert.alert('تأكيد الإيداع', `إيداع ${item.amount.toFixed(2)} ر.س؟`, [
              { text: 'إلغاء', style: 'cancel' },
              { text: 'تأكيد', onPress: () => approve.mutate(item) },
            ])}
            disabled={approve.isPending}
          >
            <Text style={styles.btnText}>قبول</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: '#F44336' }]}
            onPress={() => reject.mutate(item.id)}
            disabled={reject.isPending}
          >
            <Text style={styles.btnText}>رفض</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.screen}>
      <AppHeader title="طلبات الشحن" />
      <View style={styles.tabs}>
        {['pending', 'approved', 'rejected'].map(s => (
          <TouchableOpacity key={s} style={[styles.tab, filter === s && styles.tabActive]} onPress={() => setFilter(s)}>
            <Text style={[styles.tabText, filter === s && styles.tabTextActive]}>
              {s === 'pending' ? 'معلق' : s === 'approved' ? 'مقبول' : 'مرفوض'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {isLoading
        ? <ActivityIndicator color={COLORS.gold} style={{ marginTop: 40 }} />
        : <FlatList data={data} keyExtractor={i => i.id} renderItem={renderItem} contentContainerStyle={{ padding: 12, gap: 10 }} />
      }
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  tabs: { flexDirection: 'row', padding: 12, gap: 8 },
  tab: {
    flex: 1, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.border, alignItems: 'center',
  },
  tabActive: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  tabText: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600' },
  tabTextActive: { color: COLORS.background },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: COLORS.border, gap: 12,
  },
  row: { flexDirection: 'row', gap: 12 },
  name: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  phone: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  amount: { fontSize: 18, fontWeight: '800', color: COLORS.gold, marginTop: 4 },
  meta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  txid: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  proof: { width: 72, height: 72, borderRadius: 12 },
  actions: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, borderRadius: 12, padding: 11, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
