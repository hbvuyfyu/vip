import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { AppHeader } from '@/components/AppHeader';
import { InputModal } from '@/components/InputModal';
import { COLORS } from '@/constants/colors';
import type { Profile } from '@/lib/types';

export default function AdminUsers() {
  const qc = useQueryClient();
  const [balanceModal, setBalanceModal] = useState<{ visible: boolean; user?: Profile }>({ visible: false });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Profile[];
    },
  });

  const updateUser = useMutation({
    mutationFn: async (update: Partial<Profile> & { id: string }) => {
      const { id, ...rest } = update;
      const { error } = await supabase.from('profiles').update(rest).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const adjustBalance = async (user: Profile, amountStr: string) => {
    const delta = parseFloat(amountStr);
    if (isNaN(delta)) return;
    const newBalance = user.wallet_balance + delta;
    await supabase.from('profiles').update({ wallet_balance: newBalance }).eq('id', user.id);
    await supabase.from('wallet_transactions').insert({
      user_id: user.id,
      type: 'adjustment',
      amount: delta,
      balance_after: newBalance,
      description: `تعديل يدوي من الإدارة`,
    });
    qc.invalidateQueries({ queryKey: ['admin-users'] });
    Alert.alert('تم', `تم تعديل الرصيد إلى ${newBalance.toFixed(2)} ر.س`);
  };

  const renderItem = ({ item }: { item: Profile }) => (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.full_name || 'بدون اسم'}</Text>
        <Text style={styles.phone}>{item.phone}</Text>
        <Text style={styles.balance}>{item.wallet_balance.toFixed(2)} ر.س</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{item.role}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => setBalanceModal({ visible: true, user: item })}
        >
          <Ionicons name="wallet-outline" size={18} color={COLORS.gold} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, item.is_blocked && { borderColor: '#F44336' }]}
          onPress={() => {
            Alert.alert(
              item.is_blocked ? 'رفع الحظر' : 'حظر المستخدم',
              item.is_blocked ? 'هل تريد رفع الحظر؟' : 'هل تريد حظر هذا المستخدم؟',
              [
                { text: 'إلغاء', style: 'cancel' },
                { text: 'تأكيد', onPress: () => updateUser.mutate({ id: item.id, is_blocked: !item.is_blocked }) },
              ],
            );
          }}
        >
          <Ionicons name={item.is_blocked ? 'lock-open-outline' : 'ban-outline'} size={18} color={item.is_blocked ? '#F44336' : COLORS.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <AppHeader title="إدارة المستخدمين" />
      {isLoading
        ? <ActivityIndicator color={COLORS.gold} style={{ marginTop: 40 }} />
        : (
          <FlatList
            data={users}
            keyExtractor={u => u.id}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 12, gap: 8 }}
          />
        )
      }
      <InputModal
        visible={balanceModal.visible}
        title={`تعديل رصيد ${balanceModal.user?.full_name ?? ''}`}
        placeholder="المبلغ (سالب للخصم)"
        keyboardType="decimal-pad"
        onConfirm={val => {
          if (balanceModal.user) adjustBalance(balanceModal.user, val);
          setBalanceModal({ visible: false });
        }}
        onCancel={() => setBalanceModal({ visible: false })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  row: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  name: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  phone: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  balance: { fontSize: 15, fontWeight: '800', color: COLORS.gold, marginTop: 4 },
  roleBadge: {
    alignSelf: 'flex-start',
    marginTop: 4,
    backgroundColor: COLORS.goldDim,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  roleText: { fontSize: 11, color: COLORS.gold },
  actions: { gap: 8, justifyContent: 'center' },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
