import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { AppHeader } from '@/components/AppHeader';
import { COLORS } from '@/constants/colors';
import type { Provider } from '@/lib/types';

export default function ProvidersScreen() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [syncing, setSyncing] = useState<string | null>(null);

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ['admin-providers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('providers').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Provider[];
    },
  });

  const addProvider = useMutation({
    mutationFn: async () => {
      if (!name || !apiUrl || !apiKey) throw new Error('جميع الحقول مطلوبة');
      const { error } = await supabase.from('providers').insert({ name, api_url: apiUrl, api_key: apiKey });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-providers'] });
      setName(''); setApiUrl(''); setApiKey(''); setShowForm(false);
      Alert.alert('تم', 'تمت إضافة المزود بنجاح');
    },
    onError: (e: Error) => Alert.alert('خطأ', e.message),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, val }: { id: string; val: boolean }) => {
      const { error } = await supabase.from('providers').update({ is_active: val }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-providers'] }),
  });

  const deleteProvider = (id: string) => {
    Alert.alert('حذف المزود', 'هل أنت متأكد؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف', style: 'destructive',
        onPress: async () => {
          await supabase.from('providers').delete().eq('id', id);
          qc.invalidateQueries({ queryKey: ['admin-providers'] });
        },
      },
    ]);
  };

  const syncProvider = async (p: Provider) => {
    setSyncing(p.id);
    try {
      const res = await fetch(p.api_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: p.api_key, action: 'services' }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw: any[] = await res.json();

      // Upsert services into Supabase
      const services = raw.map(s => ({
        provider_id: p.id,
        provider_service_id: String(s.service ?? s.id),
        name: s.name ?? s.service_name ?? 'خدمة',
        description: s.category ?? '',
        base_price: parseFloat(s.rate ?? s.price ?? 0),
        sell_price: parseFloat(s.rate ?? s.price ?? 0),
        min_order: parseInt(s.min ?? 100),
        max_order: parseInt(s.max ?? 10000),
        is_visible: false,
        is_featured: false,
        sort_order: 0,
      }));

      for (const chunk of chunkArray(services, 50)) {
        await supabase.from('services').upsert(chunk, {
          onConflict: 'provider_id,provider_service_id',
          ignoreDuplicates: false,
        });
      }

      await supabase.from('providers').update({ last_sync_at: new Date().toISOString(), last_sync_error: '' }).eq('id', p.id);
      qc.invalidateQueries({ queryKey: ['admin-providers'] });
      Alert.alert('تم', `تمت مزامنة ${services.length} خدمة`);
    } catch (e: any) {
      await supabase.from('providers').update({ last_sync_error: e.message }).eq('id', p.id);
      Alert.alert('خطأ في المزامنة', e.message);
    } finally {
      setSyncing(null);
    }
  };

  return (
    <View style={styles.screen}>
      <AppHeader
        title="مزودو الخدمات"
        rightAction={
          <TouchableOpacity onPress={() => setShowForm(!showForm)}>
            <Ionicons name={showForm ? 'close' : 'add'} size={26} color={COLORS.gold} />
          </TouchableOpacity>
        }
      />
      <ScrollView contentContainerStyle={styles.content}>
        {showForm && (
          <View style={styles.form}>
            <Text style={styles.formTitle}>إضافة مزود جديد</Text>
            <TextInput style={styles.input} placeholder="الاسم" placeholderTextColor={COLORS.textMuted} value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="رابط API" placeholderTextColor={COLORS.textMuted} value={apiUrl} onChangeText={setApiUrl} autoCapitalize="none" />
            <TextInput style={styles.input} placeholder="مفتاح API" placeholderTextColor={COLORS.textMuted} value={apiKey} onChangeText={setApiKey} secureTextEntry />
            <TouchableOpacity style={styles.btn} onPress={() => addProvider.mutate()} disabled={addProvider.isPending}>
              {addProvider.isPending ? <ActivityIndicator color={COLORS.background} /> : <Text style={styles.btnText}>إضافة</Text>}
            </TouchableOpacity>
          </View>
        )}

        {isLoading ? (
          <ActivityIndicator color={COLORS.gold} style={{ marginTop: 40 }} />
        ) : providers.length === 0 ? (
          <Text style={styles.empty}>لا يوجد مزودون. أضف مزوداً للبدء.</Text>
        ) : (
          providers.map(p => (
            <View key={p.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName}>{p.name}</Text>
                  <Text style={styles.cardUrl} numberOfLines={1}>{p.api_url}</Text>
                  {p.last_sync_at && (
                    <Text style={styles.cardMeta}>آخر مزامنة: {new Date(p.last_sync_at).toLocaleString('ar')}</Text>
                  )}
                  {p.last_sync_error ? (
                    <Text style={styles.errorText} numberOfLines={2}>{p.last_sync_error}</Text>
                  ) : null}
                </View>
                <View style={[styles.statusDot, { backgroundColor: p.is_active ? '#4CAF50' : COLORS.border }]} />
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => syncProvider(p)} disabled={syncing === p.id}>
                  {syncing === p.id
                    ? <ActivityIndicator color={COLORS.gold} size="small" />
                    : <Ionicons name="sync-outline" size={18} color={COLORS.gold} />}
                  <Text style={styles.actionLabel}>مزامنة</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => toggleActive.mutate({ id: p.id, val: !p.is_active })}>
                  <Ionicons name={p.is_active ? 'pause-outline' : 'play-outline'} size={18} color={COLORS.silver} />
                  <Text style={[styles.actionLabel, { color: COLORS.silver }]}>{p.is_active ? 'إيقاف' : 'تفعيل'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => deleteProvider(p.id)}>
                  <Ionicons name="trash-outline" size={18} color="#F44336" />
                  <Text style={[styles.actionLabel, { color: '#F44336' }]}>حذف</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, gap: 12 },
  form: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.goldDim,
  },
  formTitle: { fontSize: 16, fontWeight: '700', color: COLORS.gold, textAlign: 'center' },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    color: COLORS.text,
    fontSize: 14,
  },
  btn: { backgroundColor: COLORS.gold, borderRadius: 12, padding: 13, alignItems: 'center' },
  btnText: { color: COLORS.background, fontWeight: '700', fontSize: 15 },
  empty: { textAlign: 'center', color: COLORS.textMuted, marginTop: 40, fontSize: 15 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  cardUrl: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  cardMeta: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  errorText: { fontSize: 11, color: '#F44336', marginTop: 2 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  cardActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: 8,
    gap: 4,
  },
  actionLabel: { fontSize: 12, fontWeight: '600', color: COLORS.gold },
});
