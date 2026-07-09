import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Alert, Image,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { AppHeader } from '@/components/AppHeader';
import { COLORS } from '@/constants/colors';
import type { Banner } from '@/lib/types';

export default function AdminBanners() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const { data: banners = [], isLoading } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('banners')
        .select('*, images:banner_images(*)')
        .order('sort_order');
      if (error) throw error;
      return data as Banner[];
    },
  });

  const addBanner = useMutation({
    mutationFn: async () => {
      if (!title) throw new Error('العنوان مطلوب');
      const maxOrder = banners.length ? Math.max(...banners.map(b => b.sort_order)) + 1 : 0;
      const { error } = await supabase.from('banners').insert({ title, link_url: linkUrl, sort_order: maxOrder, is_active: true, width: 800, height: 300, duration: 3500 });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-banners'] }); setTitle(''); setLinkUrl(''); setShowForm(false); },
    onError: (e: Error) => Alert.alert('خطأ', e.message),
  });

  const addImage = async (bannerId: string) => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (result.canceled) return;
    setUploading(true);
    try {
      const asset = result.assets[0];
      const ext = asset.uri.split('.').pop() ?? 'jpg';
      const path = `banners/${bannerId}/${Date.now()}.${ext}`;
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const { error: upErr } = await supabase.storage.from('images').upload(path, blob);
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(path);
      await supabase.from('banner_images').insert({ banner_id: bannerId, image_url: publicUrl, sort_order: 0, is_active: true });
      qc.invalidateQueries({ queryKey: ['admin-banners'] });
    } catch (e: any) {
      Alert.alert('خطأ في الرفع', e.message);
    } finally {
      setUploading(false);
    }
  };

  const deleteBanner = (id: string) => {
    Alert.alert('حذف البانر', 'هل أنت متأكد؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: async () => {
        await supabase.from('banners').delete().eq('id', id);
        qc.invalidateQueries({ queryKey: ['admin-banners'] });
      }},
    ]);
  };

  const renderItem = ({ item }: { item: Banner }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.bannerTitle}>{item.title}</Text>
        <TouchableOpacity onPress={() => deleteBanner(item.id)}>
          <Ionicons name="trash-outline" size={18} color="#F44336" />
        </TouchableOpacity>
      </View>
      {item.link_url ? <Text style={styles.link} numberOfLines={1}>{item.link_url}</Text> : null}
      <View style={styles.imagesRow}>
        {(item.images ?? []).map(img => (
          <Image key={img.id} source={{ uri: img.image_url }} style={styles.thumb} />
        ))}
        <TouchableOpacity style={styles.addImg} onPress={() => addImage(item.id)} disabled={uploading}>
          {uploading ? <ActivityIndicator color={COLORS.gold} size="small" /> : <Ionicons name="add" size={24} color={COLORS.gold} />}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <AppHeader
        title="البانرات"
        rightAction={
          <TouchableOpacity onPress={() => setShowForm(!showForm)}>
            <Ionicons name={showForm ? 'close' : 'add'} size={26} color={COLORS.gold} />
          </TouchableOpacity>
        }
      />
      {showForm && (
        <View style={styles.form}>
          <TextInput style={styles.input} placeholder="العنوان" placeholderTextColor={COLORS.textMuted} value={title} onChangeText={setTitle} />
          <TextInput style={styles.input} placeholder="رابط (اختياري)" placeholderTextColor={COLORS.textMuted} value={linkUrl} onChangeText={setLinkUrl} autoCapitalize="none" />
          <TouchableOpacity style={styles.btn} onPress={() => addBanner.mutate()} disabled={addBanner.isPending}>
            <Text style={styles.btnText}>إضافة بانر</Text>
          </TouchableOpacity>
        </View>
      )}
      {isLoading
        ? <ActivityIndicator color={COLORS.gold} style={{ marginTop: 40 }} />
        : <FlatList data={banners} keyExtractor={b => b.id} renderItem={renderItem} contentContainerStyle={{ padding: 12, gap: 10 }} />
      }
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  form: {
    margin: 12, backgroundColor: COLORS.surface, borderRadius: 16,
    padding: 14, gap: 10, borderWidth: 1, borderColor: COLORS.goldDim,
  },
  input: {
    backgroundColor: COLORS.background, borderRadius: 10, borderWidth: 1,
    borderColor: COLORS.border, padding: 12, color: COLORS.text, fontSize: 14,
  },
  btn: { backgroundColor: COLORS.gold, borderRadius: 12, padding: 12, alignItems: 'center' },
  btnText: { color: COLORS.background, fontWeight: '700', fontSize: 14 },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: COLORS.border, gap: 10,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bannerTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  link: { fontSize: 11, color: COLORS.textMuted },
  imagesRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  thumb: { width: 80, height: 52, borderRadius: 8 },
  addImg: {
    width: 80, height: 52, borderRadius: 8,
    borderWidth: 1, borderColor: COLORS.goldDim, borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center',
  },
});
