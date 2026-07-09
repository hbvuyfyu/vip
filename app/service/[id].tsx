import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/colors';
import { formatCurrency } from '@/lib/format';
import type { Service } from '@/lib/types';

export default function ServiceDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { profile, refreshProfile } = useAuth();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState('');
  const [quantity, setQuantity] = useState('');
  const [ordering, setOrdering] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('services')
        .select('*, provider:providers(*), category:categories(*)')
        .eq('id', id)
        .single();
      setService(data as Service);
      if (data) setQuantity(String(data.min_order));
      setLoading(false);
    })();
  }, [id]);

  const totalPrice = service ? (parseInt(quantity || '0') / 1000) * service.sell_price : 0;

  const handleOrder = async () => {
    if (!service || !profile) return;
    if (!target.trim()) { Alert.alert('خطأ', 'يرجى إدخال الرابط أو الهدف'); return; }
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < service.min_order || qty > service.max_order) {
      Alert.alert('خطأ', `الكمية يجب أن تكون بين ${service.min_order} و ${service.max_order}`);
      return;
    }
    const price = (qty / 1000) * service.sell_price;
    if (profile.wallet_balance < price) {
      Alert.alert('رصيد غير كافٍ', 'رصيد محفظتك غير كافٍ لإتمام الطلب', [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'شحن المحفظة', onPress: () => router.push('/wallet/recharge') },
      ]);
      return;
    }

    Alert.alert(
      'تأكيد الطلب',
      `الخدمة: ${service.name}\nالكمية: ${qty.toLocaleString()}\nالسعر: ${formatCurrency(price)}`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تأكيد',
          onPress: async () => {
            setOrdering(true);
            try {
              // Deduct from wallet
              const newBalance = profile.wallet_balance - price;
              const { error: walletErr } = await supabase.rpc('deduct_wallet', {
                p_user_id: profile.id,
                p_amount: price,
                p_description: `طلب: ${service.name}`,
              });
              if (walletErr) {
                // Fallback: direct update
                await supabase.from('profiles').update({ wallet_balance: newBalance }).eq('id', profile.id);
                await supabase.from('wallet_transactions').insert({
                  user_id: profile.id,
                  type: 'order',
                  amount: -price,
                  balance_after: newBalance,
                  description: `طلب: ${service.name}`,
                });
              }

              // Create order
              const { error: orderErr } = await supabase.from('orders').insert({
                user_id: profile.id,
                service_id: service.id,
                provider_id: service.provider_id,
                quantity: qty,
                total_price: price,
                target: target.trim(),
                status: 'pending',
                provider_order_id: '',
                provider_response: {},
              });

              if (orderErr) throw orderErr;

              await refreshProfile();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('تم الطلب!', 'تم تقديم طلبك بنجاح. يمكنك متابعته من صفحة طلباتي', [
                { text: 'طلباتي', onPress: () => router.push('/(tabs)/orders') },
                { text: 'حسناً', onPress: () => router.back() },
              ]);
            } catch (err: any) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('خطأ', err.message ?? 'حدث خطأ أثناء الطلب');
            } finally {
              setOrdering(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={Colors.gold} size="large" />
      </View>
    );
  }

  if (!service) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: Colors.textSecondary }}>الخدمة غير موجودة</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>تفاصيل الخدمة</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Service Info */}
        <View style={styles.serviceCard}>
          <View style={styles.serviceIconWrap}>
            <Ionicons name="cube" size={32} color={Colors.gold} />
          </View>
          <Text style={styles.serviceName}>{service.name}</Text>
          {service.description && (
            <Text style={styles.serviceDesc}>{service.description}</Text>
          )}

          <View style={styles.infoGrid}>
            {[
              { label: 'السعر لكل 1000', value: formatCurrency(service.sell_price), color: Colors.gold },
              { label: 'الحد الأدنى', value: service.min_order.toLocaleString(), color: Colors.textPrimary },
              { label: 'الحد الأقصى', value: service.max_order.toLocaleString(), color: Colors.textPrimary },
              { label: 'الفئة', value: service.category?.name ?? 'عام', color: Colors.textPrimary },
            ].map(item => (
              <View key={item.label} style={styles.infoItem}>
                <Text style={[styles.infoValue, { color: item.color }]}>{item.value}</Text>
                <Text style={styles.infoLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Order Form */}
        <View style={styles.orderForm}>
          <Text style={styles.formTitle}>تقديم الطلب</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>الرابط / الهدف</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="link-outline" size={18} color={Colors.textSecondary} style={{ marginRight: 10 }} />
              <TextInput
                style={styles.input}
                placeholder="https://..."
                placeholderTextColor={Colors.textMuted}
                value={target}
                onChangeText={setTarget}
                autoCapitalize="none"
                autoCorrect={false}
                textAlign="right"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.qtyRow}>
              <Text style={styles.inputLabel}>الكمية</Text>
              <Text style={styles.qtyRange}>{service.min_order} - {service.max_order}</Text>
            </View>
            <View style={styles.qtyInput}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQuantity(q => String(Math.max(service.min_order, parseInt(q || '0') - 100)))}
              >
                <Ionicons name="remove" size={20} color={Colors.gold} />
              </TouchableOpacity>
              <TextInput
                style={styles.qtyText}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="number-pad"
                textAlign="center"
              />
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQuantity(q => String(Math.min(service.max_order, parseInt(q || '0') + 100)))}
              >
                <Ionicons name="add" size={20} color={Colors.gold} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Price summary */}
          <View style={styles.priceSummary}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>الإجمالي</Text>
              <Text style={styles.priceValue}>{formatCurrency(totalPrice)}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>رصيدك</Text>
              <Text style={[styles.priceValue, { color: profile!.wallet_balance >= totalPrice ? Colors.success : Colors.error }]}>
                {formatCurrency(profile?.wallet_balance ?? 0)}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.orderBtn, ordering && { opacity: 0.7 }]}
            onPress={handleOrder}
            disabled={ordering}
          >
            <LinearGradient colors={Colors.gradientGold as [string, string]} style={styles.orderBtnGrad}>
              {ordering
                ? <ActivityIndicator color="#000" />
                : <>
                    <Ionicons name="checkmark-circle" size={20} color="#000" />
                    <Text style={styles.orderBtnText}>تأكيد الطلب</Text>
                  </>
              }
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17,  color: Colors.textPrimary },
  serviceCard: {
    margin: 16, backgroundColor: Colors.bgCard, borderRadius: 20,
    padding: 20, borderWidth: 1, borderColor: Colors.border, alignItems: 'center',
  },
  serviceIconWrap: {
    width: 70, height: 70, borderRadius: 20, backgroundColor: Colors.goldDim,
    borderWidth: 1, borderColor: Colors.borderGold, justifyContent: 'center', alignItems: 'center', marginBottom: 14,
  },
  serviceName: { fontSize: 20,  color: Colors.textPrimary, textAlign: 'center', marginBottom: 8 },
  serviceDesc: { fontSize: 14,  color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 16 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, width: '100%' },
  infoItem: {
    flex: 1, minWidth: '45%', backgroundColor: Colors.bgCardHover,
    borderRadius: 12, padding: 12, alignItems: 'center',
  },
  infoValue: { fontSize: 16,  marginBottom: 4 },
  infoLabel: { fontSize: 11,  color: Colors.textSecondary },
  orderForm: { marginHorizontal: 16, backgroundColor: Colors.bgCard, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: Colors.border },
  formTitle: { fontSize: 18,  color: Colors.textPrimary, marginBottom: 20, textAlign: 'right' },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13,  color: Colors.textSecondary, marginBottom: 8, textAlign: 'right' },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgInput, borderRadius: 12, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 14, height: 52,
  },
  input: { flex: 1, fontSize: 14,  color: Colors.textPrimary },
  qtyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qtyRange: { fontSize: 12,  color: Colors.textMuted },
  qtyInput: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgInput, borderRadius: 12, borderWidth: 1, borderColor: Colors.border,
    height: 52, overflow: 'hidden',
  },
  qtyBtn: { width: 52, height: 52, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.goldDim },
  qtyText: { flex: 1, fontSize: 18,  color: Colors.textPrimary },
  priceSummary: { backgroundColor: Colors.bgCardHover, borderRadius: 12, padding: 16, marginBottom: 16, gap: 8 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceLabel: { fontSize: 14,  color: Colors.textSecondary },
  priceValue: { fontSize: 16,  color: Colors.textPrimary },
  orderBtn: { borderRadius: 14, overflow: 'hidden' },
  orderBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  orderBtnText: { fontSize: 16,  color: '#000' },
});
