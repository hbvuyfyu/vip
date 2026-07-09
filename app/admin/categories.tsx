import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { AppHeader } from '@/components/AppHeader';
import { COLORS } from '@/constants/colors';
import type { Category } from '@/lib/types';

export default function AdminCategories() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*').order('sort_order');
      if (error) throw error;
      return data as Category[];
    },
  });

  const addCategory = useMutation({
    mutationFn: async () => {
      if (!name) throw new Error('اسم الفئة مطلوب');
      const slug = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
      const maxOrder = categories.length ? Math.max(...categories.map(c => c.sort_order)) + 1 : 0;
      const { error } = await supabase.from('categories').insert({ name: name.trim(), slug, icon, sort_order: maxOrder, is_active: true });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-categories'] }); setName(''); setIcon(''); setShowForm(false); },
    onError: (e: Error) => Alert.alert('خطأ', e.message),
  });

  const deleteCategory = (id: string) => {
    Alert.alert('حذف الفئة', 'هل أنت متأكد؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: async () => {
        await supabase.from('categories').delete().eq('id', id);
        qc.invalidateQueries({ queryKey: ['admin-categories'] });
      }},
    ]);
  };

  const renderItem = ({ item }: { item: Category }) => (
    <View style={styles.row}>
      <View style={styles.iconCircle}>
        <Text style={styles.iconText}>{item.icon || '📁'}</Text>
      </View>
      <Text style={styles.catName}>{item.name}</Text>
      <View style={[styles.activeDot, { backgroundColor: item.is_active ? '#4CAF50' : COLORS.border }]} />
      <TouchableOpacity onPress={() => deleteCategory(item.id)} style={styles.deleteBtn}>
        <Ionicons name="trash-outline" size={16} color="#F44336" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.screen}>
      <AppHeader
        title="الفئات"
        rightAction={
          <TouchableOpacity onPress={() => setShowForm(!showForm)}>
            <Ionicons name={showForm ? 'close' : 'add'} size={26} color={COLORS.gold} />
          </TouchableOpacity>
        }
      />
      {showForm && (
        <View style={styles.form}>
          <TextInput style={styles.input} placeholder="اسم الفئة" placeholderTextColor={COLORS.textMuted} value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder="الأيقونة (emoji)" placeholderTextColor={COLORS.textMuted} value={icon} onChangeText={setIcon} />
          <TouchableOpacity style={styles.btn} onPress={() => addCategory.mutate()} disabled={addCategory.isPending}>
            <Text style={styles.btnText}>إضافة</Text>
          </TouchableOpacity>
        </View>
      )}
      {isLoading
        ? <ActivityIndicator color={COLORS.gold} style={{ marginTop: 40 }} />
        : <FlatList data={categories} keyExtractor={c => c.id} renderItem={renderItem} contentContainerStyle={{ padding: 12, gap: 8 }} />
      }
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  form: {
    margin: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.goldDim,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    color: COLORS.text,
    fontSize: 14,
  },
  btn: { backgroundColor: COLORS.gold, borderRadius: 12, padding: 12, alignItems: 'center' },
  btnText: { color: COLORS.background, fontWeight: '700', fontSize: 14 },
  row: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center', alignItems: 'center',
  },
  iconText: { fontSize: 20 },
  catName: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.text },
  activeDot: { width: 8, height: 8, borderRadius: 4 },
  deleteBtn: { padding: 6 },
});
