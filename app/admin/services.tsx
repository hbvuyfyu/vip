import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Switch,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { AppHeader } from '@/components/AppHeader';
import { InputModal } from '@/components/InputModal';
import { COLORS } from '@/constants/colors';
import type { Service } from '@/lib/types';

export default function AdminServices() {
  const qc = useQueryClient();
  const [priceModal, setPriceModal] = useState<{ visible: boolean; service?: Service }>({ visible: false });

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['admin-services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*, category:categories(name), provider:providers(name)')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as Service[];
    },
  });

  const updateService = useMutation({
    mutationFn: async (update: Partial<Service> & { id: string }) => {
      const { id, ...rest } = update;
      const { error } = await supabase.from('services').update(rest).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-services'] }),
  });

  const renderItem = ({ item }: { item: Service }) => (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.meta}>{(item as any).provider?.name ?? ''} · {(item as any).category?.name ?? 'بدون فئة'}</Text>
        <TouchableOpacity
          onPress={() => setPriceModal({ visible: true, service: item })}
          style={styles.priceRow}
        >
          <Text style={styles.price}>{item.sell_price.toFixed(2)} ر.س</Text>
          <Ionicons name="pencil-outline" size={14} color={COLORS.gold} />
        </TouchableOpacity>
      </View>
      <View style={styles.switches}>
        <View style={styles.switchItem}>
          <Text style={styles.switchLabel}>ظاهر</Text>
          <Switch
            value={item.is_visible}
            onValueChange={v => updateService.mutate({ id: item.id, is_visible: v })}
            trackColor={{ true: COLORS.gold, false: COLORS.border }}
            thumbColor={COLORS.text}
          />
        </View>
        <View style={styles.switchItem}>
          <Text style={styles.switchLabel}>مميز</Text>
          <Switch
            value={item.is_featured}
            onValueChange={v => updateService.mutate({ id: item.id, is_featured: v })}
            trackColor={{ true: COLORS.gold, false: COLORS.border }}
            thumbColor={COLORS.text}
          />
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <AppHeader title="إدارة الخدمات" />
      {isLoading
        ? <ActivityIndicator color={COLORS.gold} style={{ marginTop: 40 }} />
        : (
          <FlatList
            data={services}
            keyExtractor={i => i.id}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 12, gap: 8 }}
          />
        )
      }
      <InputModal
        visible={priceModal.visible}
        title="تعديل سعر البيع"
        placeholder="السعر بالريال"
        defaultValue={priceModal.service?.sell_price.toString() ?? ''}
        keyboardType="decimal-pad"
        onConfirm={val => {
          if (priceModal.service) {
            updateService.mutate({ id: priceModal.service.id, sell_price: parseFloat(val) || priceModal.service.sell_price });
          }
          setPriceModal({ visible: false });
        }}
        onCancel={() => setPriceModal({ visible: false })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  row: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  name: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  meta: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  price: { fontSize: 14, fontWeight: '700', color: COLORS.gold },
  switches: { gap: 6, justifyContent: 'center' },
  switchItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  switchLabel: { fontSize: 11, color: COLORS.textMuted },
});
