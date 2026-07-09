import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { EmptyState } from '@/components/EmptyState';
import { Colors } from '@/constants/colors';
import { formatCurrency, formatDate } from '@/lib/format';
import type { WalletTransaction } from '@/lib/types';

const TYPE_ICONS: Record<string, { icon: string; color: string; label: string }> = {
  recharge: { icon: 'add-circle-outline', color: Colors.success, label: 'شحن' },
  order: { icon: 'cart-outline', color: Colors.error, label: 'طلب' },
  refund: { icon: 'refresh-outline', color: Colors.info, label: 'استرداد' },
  adjustment: { icon: 'settings-outline', color: Colors.warning, label: 'تعديل' },
};

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, refreshProfile } = useAuth();
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(50);
    setTransactions((data as WalletTransaction[]) ?? []);
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([load(), refreshProfile()]);
    setRefreshing(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>المحفظة</Text>
      </View>

      <FlatList
        data={transactions}
        keyExtractor={t => t.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />}
        ListHeaderComponent={
          <>
            {/* Balance Card */}
            <LinearGradient colors={['#1A1408', '#221A08', '#1A1408']} style={styles.balanceCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <View style={styles.balanceGlow} />
              <Text style={styles.balanceLabel}>الرصيد الحالي</Text>
              <Text style={styles.balanceAmount}>{formatCurrency(profile?.wallet_balance ?? 0)}</Text>
              <TouchableOpacity onPress={() => router.push('/wallet/recharge')} style={styles.rechargeBtn}>
                <LinearGradient colors={Colors.gradientGold as [string, string]} style={styles.rechargeBtnGrad}>
                  <Ionicons name="add" size={18} color="#000" />
                  <Text style={styles.rechargeBtnText}>شحن المحفظة</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>

            {/* Summary */}
            <View style={styles.summaryRow}>
              {[
                { label: 'إجمالي الشحن', value: transactions.filter(t => t.type === 'recharge').reduce((s, t) => s + t.amount, 0), color: Colors.success, icon: 'trending-up' },
                { label: 'إجمالي الإنفاق', value: Math.abs(transactions.filter(t => t.type === 'order').reduce((s, t) => s + t.amount, 0)), color: Colors.error, icon: 'trending-down' },
              ].map(item => (
                <View key={item.label} style={styles.summaryCard}>
                  <Ionicons name={item.icon as any} size={20} color={item.color} />
                  <Text style={[styles.summaryValue, { color: item.color }]}>{formatCurrency(item.value)}</Text>
                  <Text style={styles.summaryLabel}>{item.label}</Text>
                </View>
              ))}
            </View>

            {transactions.length > 0 && (
              <Text style={styles.sectionTitle}>سجل المعاملات</Text>
            )}
          </>
        }
        ListEmptyComponent={
          <EmptyState
            icon="wallet-outline"
            title="لا توجد معاملات"
            message="قم بشحن محفظتك للبدء"
            actionLabel="شحن الآن"
            onAction={() => router.push('/wallet/recharge')}
          />
        }
        renderItem={({ item: tx }) => {
          const info = TYPE_ICONS[tx.type] ?? { icon: 'help-circle-outline', color: Colors.silver, label: tx.type };
          const isPositive = tx.amount >= 0;
          return (
            <View style={styles.txCard}>
              <View style={[styles.txIcon, { backgroundColor: info.color + '20' }]}>
                <Ionicons name={info.icon as any} size={20} color={info.color} />
              </View>
              <View style={styles.txInfo}>
                <Text style={styles.txLabel}>{tx.description || info.label}</Text>
                <Text style={styles.txDate}>{formatDate(tx.created_at)}</Text>
              </View>
              <View style={styles.txAmounts}>
                <Text style={[styles.txAmount, { color: isPositive ? Colors.success : Colors.error }]}>
                  {isPositive ? '+' : ''}{formatCurrency(tx.amount)}
                </Text>
                <Text style={styles.txBalance}>الرصيد: {formatCurrency(tx.balance_after)}</Text>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { fontSize: 24,  color: Colors.textPrimary, textAlign: 'right' },
  list: { paddingHorizontal: 16, paddingBottom: 32, paddingTop: 16 },
  balanceCard: {
    borderRadius: 24, padding: 24, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.25)',
    overflow: 'hidden', alignItems: 'center',
  },
  balanceGlow: {
    position: 'absolute', top: -30, width: 200, height: 200,
    borderRadius: 100, backgroundColor: 'rgba(201,168,76,0.06)',
  },
  balanceLabel: { fontSize: 14,  color: Colors.textSecondary, marginBottom: 8 },
  balanceAmount: { fontSize: 42,  color: Colors.gold, marginBottom: 24 },
  rechargeBtn: { borderRadius: 16, overflow: 'hidden', width: '80%' },
  rechargeBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  rechargeBtnText: { fontSize: 16,  color: '#000' },
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  summaryCard: {
    flex: 1, backgroundColor: Colors.bgCard, borderRadius: 16, padding: 16,
    alignItems: 'center', gap: 8, borderWidth: 1, borderColor: Colors.border,
  },
  summaryValue: { fontSize: 18,  },
  summaryLabel: { fontSize: 12,  color: Colors.textSecondary },
  sectionTitle: { fontSize: 16,  color: Colors.textPrimary, marginBottom: 12, textAlign: 'right' },
  txCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.bgCard, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 8,
  },
  txIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  txInfo: { flex: 1 },
  txLabel: { fontSize: 14,  color: Colors.textPrimary, textAlign: 'right' },
  txDate: { fontSize: 11,  color: Colors.textMuted, marginTop: 3, textAlign: 'right' },
  txAmounts: { alignItems: 'flex-end' },
  txAmount: { fontSize: 15,  },
  txBalance: { fontSize: 10,  color: Colors.textMuted, marginTop: 2 },
});
