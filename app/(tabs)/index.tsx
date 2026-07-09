import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { BannerCarousel } from '@/components/BannerCarousel';
import { ServiceCard } from '@/components/ServiceCard';
import { KingLogo } from '@/components/KingLogo';
import { Colors } from '@/constants/colors';
import { formatCurrency } from '@/lib/format';
import type { Banner, Category, Service } from '@/lib/types';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useAuth();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featured, setFeatured] = useState<Service[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [{ data: b }, { data: c }, { data: f }] = await Promise.all([
      supabase.from('banners').select('*, images:banner_images(*)').eq('is_active', true).order('sort_order'),
      supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('services').select('*, provider:providers(*)').eq('is_visible', true).eq('is_featured', true).order('sort_order').limit(8),
    ]);
    setBanners((b as Banner[]) ?? []);
    setCategories((c as Category[]) ?? []);
    setFeatured((f as Service[]) ?? []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <KingLogo size="sm" />
        <View style={styles.headerRight}>
          <View style={styles.balanceBadge}>
            <Ionicons name="wallet-outline" size={14} color={Colors.gold} />
            <Text style={styles.balanceText}>{formatCurrency(profile?.wallet_balance ?? 0)}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />}
      >
        {/* Banner */}
        {banners.length > 0 && (
          <View style={styles.section}>
            <BannerCarousel banners={banners} />
          </View>
        )}

        {/* Wallet Card */}
        <View style={styles.section}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/wallet')} activeOpacity={0.9}>
            <LinearGradient colors={['#1A1408', '#2A1F08']} style={styles.walletCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <View style={styles.walletRow}>
                <View>
                  <Text style={styles.walletLabel}>رصيد محفظتك</Text>
                  <Text style={styles.walletBalance}>{formatCurrency(profile?.wallet_balance ?? 0)}</Text>
                </View>
                <TouchableOpacity style={styles.rechargeBtn} onPress={() => router.push('/wallet/recharge')}>
                  <LinearGradient colors={Colors.gradientGold as [string, string]} style={styles.rechargeBtnGrad}>
                    <Ionicons name="add" size={16} color="#000" />
                    <Text style={styles.rechargeBtnText}>شحن</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Categories */}
        {categories.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>الفئات</Text>
            <FlatList
              horizontal
              data={categories}
              showsHorizontalScrollIndicator={false}
              keyExtractor={c => c.id}
              contentContainerStyle={{ paddingRight: 16 }}
              renderItem={({ item: cat }) => (
                <TouchableOpacity
                  style={styles.categoryCard}
                  onPress={() => router.push({ pathname: '/(tabs)/services', params: { category: cat.slug } })}
                >
                  <View style={styles.categoryIcon}>
                    {cat.image_url
                      ? <Image source={{ uri: cat.image_url }} style={{ width: 32, height: 32, borderRadius: 8 }} />
                      : <Ionicons name="grid-outline" size={22} color={Colors.gold} />
                    }
                  </View>
                  <Text style={styles.categoryName} numberOfLines={2}>{cat.name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Features */}
        <View style={styles.section}>
          <View style={styles.featuresRow}>
            {[
              { icon: 'flash-outline', label: 'توصيل فوري' },
              { icon: 'shield-checkmark-outline', label: 'دفع آمن' },
              { icon: 'time-outline', label: 'دعم 24/7' },
            ].map(f => (
              <View key={f.label} style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Ionicons name={f.icon as any} size={20} color={Colors.gold} />
                </View>
                <Text style={styles.featureLabel}>{f.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Featured Services */}
        {featured.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>خدمات مميزة</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/services')}>
                <Text style={styles.seeAll}>عرض الكل</Text>
              </TouchableOpacity>
            </View>
            {featured.map(s => <ServiceCard key={s.id} service={s} />)}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  balanceBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.goldDim, paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: Colors.borderGold,
  },
  balanceText: { fontSize: 13,  color: Colors.gold },
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 18,  color: Colors.textPrimary, marginBottom: 14 },
  seeAll: { fontSize: 13,  color: Colors.gold },
  walletCard: {
    borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)',
  },
  walletRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  walletLabel: { fontSize: 13,  color: Colors.textSecondary, marginBottom: 6 },
  walletBalance: { fontSize: 28,  color: Colors.gold },
  rechargeBtn: { borderRadius: 12, overflow: 'hidden' },
  rechargeBtnGrad: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10 },
  rechargeBtnText: { fontSize: 14,  color: '#000' },
  categoryCard: {
    backgroundColor: Colors.bgCard, borderRadius: 16, padding: 14,
    alignItems: 'center', width: 90, marginLeft: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  categoryIcon: {
    width: 50, height: 50, borderRadius: 14,
    backgroundColor: Colors.goldDim, justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  categoryName: {
    fontSize: 11, 
    color: Colors.textSecondary, textAlign: 'center',
  },
  featuresRow: { flexDirection: 'row', justifyContent: 'space-around' },
  featureItem: { alignItems: 'center', gap: 8 },
  featureIcon: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: Colors.goldDim, borderWidth: 1, borderColor: Colors.borderGold,
    justifyContent: 'center', alignItems: 'center',
  },
  featureLabel: { fontSize: 12,  color: Colors.textSecondary },
});
