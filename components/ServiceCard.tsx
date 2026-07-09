import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';
import type { Service } from '@/lib/types';

interface ServiceCardProps {
  service: Service;
}

export function ServiceCard({ service }: ServiceCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/service/${service.id}`)}
      activeOpacity={0.8}
    >
      {service.is_featured && (
        <View style={styles.badge}>
          <Ionicons name="star" size={10} color={COLORS.background} />
          <Text style={styles.badgeText}>مميز</Text>
        </View>
      )}
      <Text style={styles.name} numberOfLines={2}>{service.name}</Text>
      <Text style={styles.desc} numberOfLines={1}>{service.description || service.category?.name || ''}</Text>
      <View style={styles.footer}>
        <Text style={styles.price}>{service.sell_price.toFixed(2)} ر.س</Text>
        <Text style={styles.range}>{service.min_order} - {service.max_order}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
    position: 'relative',
    overflow: 'hidden',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gold,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderBottomLeftRadius: 10,
    gap: 3,
  },
  badgeText: { fontSize: 10, color: COLORS.background, fontWeight: '700' },
  name: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginTop: 4 },
  desc: { fontSize: 12, color: COLORS.textMuted },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  price: { fontSize: 15, fontWeight: '800', color: COLORS.gold },
  range: { fontSize: 11, color: COLORS.textSecondary },
});
