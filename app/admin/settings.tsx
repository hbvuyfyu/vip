import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { AppHeader } from '@/components/AppHeader';
import { COLORS } from '@/constants/colors';
import type { Settings } from '@/lib/types';

const DEFAULT_SETTINGS: Settings = {
  branding: { site_name: 'King', logo_url: '', favicon_url: '', tagline: 'منصة الخدمات الرقمية' },
  support: { whatsapp: '', instagram: '', facebook: '', telegram: '' },
  profit: { global_margin: 20 },
  payment_methods: { methods: [] },
};

export default function AdminSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const { data } = await supabase.from('settings').select('*').single();
      return data;
    },
  });

  useEffect(() => {
    if (data) {
      setSettings({
        branding: data.branding ?? DEFAULT_SETTINGS.branding,
        support: data.support ?? DEFAULT_SETTINGS.support,
        profit: data.profit ?? DEFAULT_SETTINGS.profit,
        payment_methods: data.payment_methods ?? DEFAULT_SETTINGS.payment_methods,
      });
    }
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      if (data?.id) {
        const { error } = await supabase.from('settings').update(settings).eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('settings').insert(settings);
        if (error) throw error;
      }
    },
    onSuccess: () => Alert.alert('تم', 'تم حفظ الإعدادات'),
    onError: (e: Error) => Alert.alert('خطأ', e.message),
  });

  const Field = ({ label, value, onChangeText, keyboardType = 'default' as any }: any) => (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={String(value)}
        onChangeText={onChangeText}
        placeholderTextColor={COLORS.textMuted}
        keyboardType={keyboardType}
      />
    </View>
  );

  if (isLoading) return <ActivityIndicator color={COLORS.gold} style={{ marginTop: 80 }} />;

  return (
    <View style={styles.screen}>
      <AppHeader title="الإعدادات" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.section}>العلامة التجارية</Text>
        <Field label="اسم الموقع" value={settings.branding.site_name} onChangeText={(v: string) => setSettings(s => ({ ...s, branding: { ...s.branding, site_name: v } }))} />
        <Field label="الشعار (URL)" value={settings.branding.logo_url} onChangeText={(v: string) => setSettings(s => ({ ...s, branding: { ...s.branding, logo_url: v } }))} />
        <Field label="الشعار الفرعي" value={settings.branding.tagline} onChangeText={(v: string) => setSettings(s => ({ ...s, branding: { ...s.branding, tagline: v } }))} />

        <Text style={styles.section}>الدعم والتواصل</Text>
        <Field label="واتساب" value={settings.support.whatsapp} onChangeText={(v: string) => setSettings(s => ({ ...s, support: { ...s.support, whatsapp: v } }))} />
        <Field label="تلغرام" value={settings.support.telegram} onChangeText={(v: string) => setSettings(s => ({ ...s, support: { ...s.support, telegram: v } }))} />
        <Field label="إنستغرام" value={settings.support.instagram} onChangeText={(v: string) => setSettings(s => ({ ...s, support: { ...s.support, instagram: v } }))} />
        <Field label="فيسبوك" value={settings.support.facebook} onChangeText={(v: string) => setSettings(s => ({ ...s, support: { ...s.support, facebook: v } }))} />

        <Text style={styles.section}>الأرباح</Text>
        <Field label="هامش الربح العام (%)" value={settings.profit.global_margin} keyboardType="numeric" onChangeText={(v: string) => setSettings(s => ({ ...s, profit: { global_margin: parseFloat(v) || 0 } }))} />

        <TouchableOpacity style={styles.btn} onPress={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? <ActivityIndicator color={COLORS.background} /> : <Text style={styles.btnText}>حفظ الإعدادات</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, gap: 4 },
  section: { fontSize: 14, fontWeight: '700', color: COLORS.gold, marginTop: 16, marginBottom: 8 },
  fieldGroup: { marginBottom: 10 },
  fieldLabel: { fontSize: 12, color: COLORS.textMuted, marginBottom: 4 },
  input: {
    backgroundColor: COLORS.surface, borderRadius: 10, borderWidth: 1,
    borderColor: COLORS.border, padding: 12, color: COLORS.text, fontSize: 14,
  },
  btn: { marginTop: 20, backgroundColor: COLORS.gold, borderRadius: 14, padding: 15, alignItems: 'center' },
  btnText: { color: COLORS.background, fontWeight: '700', fontSize: 16 },
});
