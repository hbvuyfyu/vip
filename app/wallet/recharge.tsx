import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/colors';

interface PaymentMethod {
  id: string;
  name: string;
  address: string;
  notes: string;
}

export default function RechargeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useAuth();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [amount, setAmount] = useState('');
  const [txId, setTxId] = useState('');
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [proofImageUri, setProofImageUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('settings').select('value').eq('key', 'payment_methods').single();
      if (data?.value) {
        const methods = (data.value as any).methods ?? [];
        setMethods(methods);
        if (methods.length > 0) setSelectedMethod(methods[0]);
      }
    })();
  }, []);

  const pickImage = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) { Alert.alert('الإذن مطلوب', 'يحتاج التطبيق للوصول إلى الصور'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setProofImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!selectedMethod) { Alert.alert('خطأ', 'يرجى اختيار طريقة الدفع'); return; }
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Alert.alert('خطأ', 'يرجى إدخال مبلغ صحيح'); return;
    }
    if (!txId.trim()) { Alert.alert('خطأ', 'يرجى إدخال رقم العملية'); return; }

    setSubmitting(true);
    try {
      let imageUrl = '';
      if (proofImageUri) {
        // Upload image to supabase storage
        const ext = proofImageUri.split('.').pop() ?? 'jpg';
        const fileName = `recharge/${profile!.id}/${Date.now()}.${ext}`;
        const response = await fetch(proofImageUri);
        const blob = await response.blob();
        const { error: uploadErr } = await supabase.storage.from('images').upload(fileName, blob, { contentType: `image/${ext}` });
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from('images').getPublicUrl(fileName);
          imageUrl = urlData.publicUrl;
        }
      }

      const { error } = await supabase.from('recharge_requests').insert({
        user_id: profile!.id,
        payment_method: selectedMethod.name,
        amount: parseFloat(amount),
        transaction_id: txId.trim(),
        proof_image_url: imageUrl,
        status: 'pending',
      });

      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('تم الإرسال!', 'تم إرسال طلب الشحن بنجاح. سيتم مراجعته من قبل الإدارة', [
        { text: 'حسناً', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('خطأ', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>شحن المحفظة</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Payment Methods */}
        <Text style={styles.sectionTitle}>طريقة الدفع</Text>
        {methods.map(m => (
          <TouchableOpacity
            key={m.id}
            style={[styles.methodCard, selectedMethod?.id === m.id && styles.methodCardActive]}
            onPress={() => setSelectedMethod(m)}
          >
            <View style={styles.methodCheck}>
              {selectedMethod?.id === m.id
                ? <Ionicons name="checkmark-circle" size={20} color={Colors.gold} />
                : <Ionicons name="ellipse-outline" size={20} color={Colors.textMuted} />
              }
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.methodName}>{m.name}</Text>
              <Text style={styles.methodAddr} selectable>{m.address}</Text>
              {m.notes && <Text style={styles.methodNotes}>{m.notes}</Text>}
            </View>
            <TouchableOpacity
              style={styles.copyBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                Alert.alert('تم النسخ', m.address);
              }}
            >
              <Ionicons name="copy-outline" size={18} color={Colors.gold} />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        {/* Form */}
        <Text style={styles.sectionTitle}>بيانات التحويل</Text>
        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>المبلغ (USD)</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="cash-outline" size={18} color={Colors.textSecondary} style={{ marginRight: 10 }} />
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor={Colors.textMuted}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                textAlign="right"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>رقم/معرف العملية</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="barcode-outline" size={18} color={Colors.textSecondary} style={{ marginRight: 10 }} />
              <TextInput
                style={styles.input}
                placeholder="أدخل رقم العملية..."
                placeholderTextColor={Colors.textMuted}
                value={txId}
                onChangeText={setTxId}
                textAlign="right"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>صورة إثبات التحويل (اختياري)</Text>
            {proofImageUri ? (
              <View style={styles.imagePreviewWrap}>
                <Image source={{ uri: proofImageUri }} style={styles.imagePreview} />
                <TouchableOpacity style={styles.removeImage} onPress={() => setProofImageUri(null)}>
                  <Ionicons name="close-circle" size={24} color={Colors.error} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                <Ionicons name="image-outline" size={28} color={Colors.textSecondary} />
                <Text style={styles.imagePickerText}>اضغط لرفع صورة</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <LinearGradient colors={Colors.gradientGold as [string, string]} style={styles.submitBtnGrad}>
            {submitting ? <ActivityIndicator color="#000" /> : <>
              <Ionicons name="send" size={20} color="#000" />
              <Text style={styles.submitBtnText}>إرسال طلب الشحن</Text>
            </>}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17,  color: Colors.textPrimary },
  content: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 16,  color: Colors.textPrimary, marginBottom: 12, marginTop: 8, textAlign: 'right' },
  methodCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: Colors.bgCard, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 10,
  },
  methodCardActive: { borderColor: Colors.borderGold, backgroundColor: Colors.goldDim },
  methodCheck: { paddingTop: 2 },
  methodName: { fontSize: 15,  color: Colors.textPrimary, textAlign: 'right', marginBottom: 4 },
  methodAddr: { fontSize: 13,  color: Colors.textSecondary, textAlign: 'right' },
  methodNotes: { fontSize: 11,  color: Colors.textMuted, textAlign: 'right', marginTop: 4 },
  copyBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.goldDim, borderRadius: 10 },
  formCard: { backgroundColor: Colors.bgCard, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: Colors.border, marginBottom: 16 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13,  color: Colors.textSecondary, marginBottom: 8, textAlign: 'right' },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgInput, borderRadius: 12, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 14, height: 52,
  },
  input: { flex: 1, fontSize: 14,  color: Colors.textPrimary },
  imagePicker: {
    height: 100, backgroundColor: Colors.bgInput, borderRadius: 12, borderWidth: 1,
    borderColor: Colors.border, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  imagePickerText: { fontSize: 14,  color: Colors.textSecondary },
  imagePreviewWrap: { position: 'relative', height: 160, borderRadius: 12, overflow: 'hidden' },
  imagePreview: { width: '100%', height: '100%' },
  removeImage: { position: 'absolute', top: 8, right: 8 },
  submitBtn: { borderRadius: 14, overflow: 'hidden' },
  submitBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  submitBtnText: { fontSize: 16,  color: '#000' },
});
