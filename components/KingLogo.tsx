import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';

interface KingLogoProps {
  size?: 'sm' | 'md' | 'lg';
}

export function KingLogo({ size = 'md' }: KingLogoProps) {
  const iconSize = size === 'sm' ? 24 : size === 'md' ? 36 : 52;
  const fontSize = size === 'sm' ? 16 : size === 'md' ? 24 : 34;

  return (
    <View style={styles.row}>
      <Ionicons name="diamond" size={iconSize} color={COLORS.gold} />
      <Text style={[styles.text, { fontSize }]}>King</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  text: { fontWeight: '900', color: COLORS.gold, letterSpacing: 2 },
});
