import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { EmptyState } from '@/components/EmptyState';
import { Colors, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '@/constants/colors';
import { formatCurrency, formatDate } from '@/lib/format';
import type { Order } from '@/lib/types';

const STATUS_FILTERS = ['all', 'pending', 'processing', 'completed', 'failed', 'cancelled'];
const STATUS_LABELS_MAP: Record<string, string> = {
  all: 'الكل', pending: 'قيد الانتظار', processing: 'جاري', completed: 'مكتمل', failed: 'فشل', cancelled: 'ملغي',
};

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!session?.user) return;
    const { data } = await supabase
      .from('orders')
      .select('*, service:services(name, description)')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    setOrders((data as Order[]) ?? []);
  }, [session]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const filtered = orders.filter(o => statusFilter === 'all' || o.status === statusFilter);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>طلباتي</Text>
      </View>

      {/* Status filter */}
      <FlatList
        horizontal
        data={STATUS_FILTERS}
        showsHorizontalScrollIndicator={false}
        keyExtractor={s => s}
        style={{ maxHeight: 50 }}
        contentContainerStyle={styles.filterContent}
        renderItem={({ item: s }) => (
          <TouchableOpacity
            style={[styles.filterChip, statusFilter === s && styles.filterChipActive]}
            onPress={() => setStatusFilter(s)}
          >
            <Text style={[styles.filterText, statusFilter === s && styles.filterTextActive]}>
              {STATUS_LABELS_MAP[s]}
            </Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={filtered}
        keyExtractor={o => o.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />}
        ListEmptyComponent={
          <EmptyState
            icon="receipt-outline"
            title="لا توجد طلبات"
            message="لم تقم بأي طلبات بعد. تصفح الخدمات وابدأ"
          />
        }
        renderItem={({ item: order }) => {
          const statusColor = ORDER_STATUS_COLORS[order.status] ?? Colors.silver;
          return (
            <View style={styles.orderCard}>
              <View style={styles.orderTop}>
                <View style={[styles.statusBadge, { backgroundColor: statusColor + '20', borderColor: statusColor + '40' }]}>
                  <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                  <Text style={[styles.statusText, { color: statusColor }]}>
                    {ORDER_STATUS_LABELS[order.status] ?? order.status}
                  </Text>
                </View>
                <Text style={styles.orderPrice}>{formatCurrency(order.total_price)}</Text>
              </View>

              <Text style={styles.orderService} numberOfLines={2}>
                {(order.service as any)?.name ?? 'خدمة'}
              </Text>
              <Text style={styles.orderTarget} numberOfLines={1}>الهدف: {order.target}</Text>

              <View style={styles.orderFooter}>
                <Text style={styles.orderDate}>{formatDate(order.created_at)}</Text>
                <View style={styles.orderQty}>
                  <Ionicons name="layers-outline" size={12} color={Colors.textSecondary} />
                  <Text style={styles.orderQtyText}>{order.quantity.toLocaleString()}</Text>
                </View>
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
  filterContent: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 16, backgroundColor: Colors.bgCard,
    borderWidth: 1, borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: Colors.goldDim, borderColor: Colors.borderGold },
  filterText: { fontSize: 12,  color: Colors.textSecondary },
  filterTextActive: { color: Colors.gold },
  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },
  orderCard: {
    backgroundColor: Colors.bgCard, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 10,
  },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12,  },
  orderPrice: { fontSize: 16,  color: Colors.gold },
  orderService: { fontSize: 14,  color: Colors.textPrimary, marginBottom: 4, textAlign: 'right' },
  orderTarget: { fontSize: 12,  color: Colors.textSecondary, textAlign: 'right', marginBottom: 10 },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderDate: { fontSize: 11,  color: Colors.textMuted },
  orderQty: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  orderQtyText: { fontSize: 12,  color: Colors.textSecondary },
});
