import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/context/AuthContext';
import { KingLogo } from '@/components/KingLogo';
import { Colors } from '@/constants/colors';
import { formatCurrency, formatDate } from '@/lib/format';

interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
  badge?: string;
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, signOut, isAdmin } = useAuth();

  const handleSignOut = () => {
    Alert.alert('تسجيل الخروج', 'هل أنت متأكد من تسجيل الخروج؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'تأكيد', style: 'destructive',
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const menuItems: MenuItem[] = [
    { icon: 'receipt-outline', label: 'طلباتي', onPress: () => router.push('/(tabs)/orders') },
    { icon: 'wallet-outline', label: 'محفظتي', onPress: () => router.push('/(tabs)/wallet') },
    { icon: 'card-outline', label: 'شحن المحفظة', onPress: () => router.push('/wallet/recharge') },
    { icon: 'help-circle-outline', label: 'الدعم الفني', onPress: () => {} },
  ];

  if (isAdmin) {
    menuItems.splice(3, 0, {
      icon: 'settings-outline',
      label: 'لوحة الإدارة',
      onPress: () => router.push('/admin'),
      color: Colors.gold,
      badge: 'Admin',
    });
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>حسابي</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Profile Card */}
        <LinearGradient colors={['#1A1408', '#221A08']} style={styles.profileCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {profile?.full_name?.charAt(0)?.toUpperCase() ?? profile?.phone?.charAt(0) ?? 'U'}
              </Text>
            </View>
            {(profile?.role === 'admin' || profile?.role === 'super_admin') && (
              <View style={styles.adminBadge}>
                <Ionicons name="shield-checkmark" size={12} color={Colors.gold} />
              </View>
            )}
          </View>
          <Text style={styles.profileName}>{profile?.full_name || 'مستخدم'}</Text>
          <Text style={styles.profilePhone}>{profile?.phone}</Text>
          {profile?.role !== 'user' && (
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>
                {profile?.role === 'super_admin' ? 'مدير عام' : 'مدير'}
              </Text>
            </View>
          )}
          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceValue}>{formatCurrency(profile?.wallet_balance ?? 0)}</Text>
              <Text style={styles.balanceLabel}>الرصيد</Text>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceItem}>
              <Text style={styles.balanceValue}>{formatDate(profile?.created_at ?? '')}</Text>
              <Text style={styles.balanceLabel}>تاريخ الانضمام</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Menu */}
        <View style={styles.menuCard}>
          {menuItems.map((item, i) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuItem, i < menuItems.length - 1 && styles.menuItemBorder]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIcon, item.color && { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon} size={20} color={item.color ?? Colors.textSecondary} />
              </View>
              <Text style={[styles.menuLabel, item.color && { color: item.color }]}>{item.label}</Text>
              {item.badge && (
                <View style={styles.menuBadge}>
                  <Text style={styles.menuBadgeText}>{item.badge}</Text>
                </View>
              )}
              <Ionicons name="chevron-back" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.signOutText}>تسجيل الخروج</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <KingLogo size="sm" />
          <Text style={styles.version}>الإصدار 1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { fontSize: 24,  color: Colors.textPrimary, textAlign: 'right' },
  profileCard: {
    margin: 16, borderRadius: 24, padding: 24,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)',
  },
  avatarWrap: { position: 'relative', marginBottom: 12 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.goldDim, borderWidth: 2, borderColor: Colors.borderGold,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 32,  color: Colors.gold },
  adminBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.bgCard, borderWidth: 2, borderColor: Colors.borderGold,
    justifyContent: 'center', alignItems: 'center',
  },
  profileName: { fontSize: 22,  color: Colors.textPrimary, marginBottom: 4 },
  profilePhone: { fontSize: 14,  color: Colors.textSecondary, marginBottom: 8 },
  roleBadge: {
    backgroundColor: Colors.goldDim, paddingHorizontal: 14, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1, borderColor: Colors.borderGold, marginBottom: 20,
  },
  roleText: { fontSize: 12,  color: Colors.gold },
  balanceRow: { flexDirection: 'row', width: '100%', marginTop: 16 },
  balanceItem: { flex: 1, alignItems: 'center' },
  balanceDivider: { width: 1, backgroundColor: Colors.border },
  balanceValue: { fontSize: 14,  color: Colors.textPrimary, textAlign: 'center' },
  balanceLabel: { fontSize: 11,  color: Colors.textSecondary, marginTop: 4 },
  menuCard: {
    marginHorizontal: 16, backgroundColor: Colors.bgCard,
    borderRadius: 20, borderWidth: 1, borderColor: Colors.border, marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14,
  },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  menuIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.silverDim, justifyContent: 'center', alignItems: 'center',
  },
  menuLabel: { flex: 1, fontSize: 15,  color: Colors.textPrimary, textAlign: 'right' },
  menuBadge: { backgroundColor: Colors.goldDim, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, borderWidth: 1, borderColor: Colors.borderGold },
  menuBadgeText: { fontSize: 10,  color: Colors.gold },
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    marginHorizontal: 16, padding: 16, backgroundColor: Colors.errorDim,
    borderRadius: 16, borderWidth: 1, borderColor: Colors.error + '30', marginBottom: 24,
  },
  signOutText: { fontSize: 16,  color: Colors.error },
  footer: { alignItems: 'center', gap: 8, paddingBottom: 16 },
  version: { fontSize: 12,  color: Colors.textMuted },
});
