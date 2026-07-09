import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { ServiceCard } from '@/components/ServiceCard';
import { EmptyState } from '@/components/EmptyState';
import { Colors } from '@/constants/colors';
import type { Category, Service } from '@/lib/types';

export default function ServicesScreen() {
  const insets = useSafeAreaInsets();
  const { category: initialCategory } = useLocalSearchParams<{ category?: string }>();
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory ?? '');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [{ data: cats }, { data: svcs }] = await Promise.all([
      supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('services').select('*, category:categories(*), provider:providers(name)').eq('is_visible', true).order('sort_order'),
    ]);
    setCategories((cats as Category[]) ?? []);
    setServices((svcs as Service[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const filtered = services.filter(s => {
    const matchCat = !selectedCategory || s.category?.slug === selectedCategory;
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>الخدمات</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث عن خدمة..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
            textAlign="right"
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.catScroll}
        contentContainerStyle={styles.catContent}
      >
        <TouchableOpacity
          style={[styles.catChip, !selectedCategory && styles.catChipActive]}
          onPress={() => setSelectedCategory('')}
        >
          <Text style={[styles.catChipText, !selectedCategory && styles.catChipTextActive]}>الكل</Text>
        </TouchableOpacity>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.catChip, selectedCategory === cat.slug && styles.catChipActive]}
            onPress={() => setSelectedCategory(selectedCategory === cat.slug ? '' : cat.slug)}
          >
            <Text style={[styles.catChipText, selectedCategory === cat.slug && styles.catChipTextActive]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results count */}
      <Text style={styles.resultCount}>{filtered.length} خدمة</Text>

      <FlatList
        data={filtered}
        keyExtractor={s => s.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <ServiceCard service={item} />}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />}
        ListEmptyComponent={
          loading ? null : (
            <EmptyState
              icon="cube-outline"
              title="لا توجد خدمات"
              message="لا توجد خدمات متاحة حالياً في هذه الفئة"
            />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 24,  color: Colors.textPrimary, marginBottom: 12, textAlign: 'right' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.bgInput, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 14, height: 46,
  },
  searchInput: { flex: 1, fontSize: 14,  color: Colors.textPrimary },
  catScroll: { maxHeight: 52 },
  catContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  catChip: {
    paddingHorizontal: 16, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  catChipActive: {
    backgroundColor: Colors.goldDim,
    borderColor: Colors.borderGold,
  },
  catChipText: { fontSize: 13,  color: Colors.textSecondary },
  catChipTextActive: { color: Colors.gold },
  resultCount: { fontSize: 12,  color: Colors.textMuted, paddingHorizontal: 16, marginBottom: 4, textAlign: 'right' },
  list: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 24 },
});
