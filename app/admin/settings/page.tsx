'use client';

import { useEffect, useState } from 'react';
import { Loader2, Save, AlertCircle, Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ImageUpload } from '@/components/image-upload';
import { toast } from 'sonner';

export default function AdminSettingsPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [branding, setBranding] = useState({ site_name: 'King', logo_url: '', favicon_url: '', tagline: 'Premium Digital Services' });
  const [support, setSupport] = useState({ whatsapp: '+15043253235', instagram: '', facebook: '', telegram: '' });
  const [profit, setProfit] = useState({ global_margin: 15 });
  const [methods, setMethods] = useState<Array<{ id: string; name: string; address: string; notes: string }>>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('settings').select('key, value');
      for (const row of data || []) {
        if (row.key === 'branding') setBranding(row.value as any);
        if (row.key === 'support') setSupport(row.value as any);
        if (row.key === 'profit') setProfit(row.value as any);
        if (row.key === 'payment_methods') setMethods((row.value as any)?.methods || []);
      }
      setLoading(false);
    })();
  }, []);

  if (profile?.role !== 'super_admin') {
    return (
      <div className="text-center py-16">
        <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
        <p className="text-silver-700">Super Admin access required.</p>
      </div>
    );
  }

  const saveSection = async (key: string, value: any) => {
    setSaving(key);
    const { error } = await supabase.from('settings').upsert({
      key,
      value,
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    });
    if (error) toast.error(error.message);
    else toast.success(`${key} saved`);
    setSaving(null);
  };

  const addMethod = () => {
    setMethods([...methods, { id: `method-${Date.now()}`, name: '', address: '', notes: '' }]);
  };

  const removeMethod = (idx: number) => {
    setMethods(methods.filter((_, i) => i !== idx));
  };

  const updateMethod = (idx: number, field: 'name' | 'address' | 'notes', value: string) => {
    const next = [...methods];
    next[idx] = { ...next[idx], [field]: value };
    setMethods(next);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-silver-400" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-silver-900">Settings</h1>
        <p className="text-silver-500 mt-1">Configure branding, support, pricing, and payments</p>
      </div>

      <div className="space-y-6 max-w-2xl">
        <Card className="silver-card p-5">
          <h2 className="font-semibold text-silver-900 mb-4">Branding</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Site Name</Label>
              <Input value={branding.site_name} onChange={(e) => setBranding({ ...branding, site_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Tagline</Label>
              <Input value={branding.tagline} onChange={(e) => setBranding({ ...branding, tagline: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Logo</Label>
                <ImageUpload value={branding.logo_url} onChange={(url) => setBranding({ ...branding, logo_url: url })} folder="branding" aspectRatio="auto" />
              </div>
              <div className="space-y-2">
                <Label>Favicon</Label>
                <ImageUpload value={branding.favicon_url} onChange={(url) => setBranding({ ...branding, favicon_url: url })} folder="branding" aspectRatio="square" />
              </div>
            </div>
            <Button onClick={() => saveSection('branding', branding)} className="silver-button" disabled={saving === 'branding'}>
              <Save className="h-4 w-4 mr-2" />
              {saving === 'branding' ? 'Saving...' : 'Save Branding'}
            </Button>
          </div>
        </Card>

        <Card className="silver-card p-5">
          <h2 className="font-semibold text-silver-900 mb-4">Support Contact</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>WhatsApp Number</Label>
              <Input value={support.whatsapp} onChange={(e) => setSupport({ ...support, whatsapp: e.target.value })} placeholder="+15043253235" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Instagram URL</Label>
                <Input value={support.instagram} onChange={(e) => setSupport({ ...support, instagram: e.target.value })} placeholder="https://instagram.com/..." />
              </div>
              <div className="space-y-2">
                <Label>Facebook URL</Label>
                <Input value={support.facebook} onChange={(e) => setSupport({ ...support, facebook: e.target.value })} placeholder="https://facebook.com/..." />
              </div>
              <div className="space-y-2">
                <Label>Telegram URL</Label>
                <Input value={support.telegram} onChange={(e) => setSupport({ ...support, telegram: e.target.value })} placeholder="https://t.me/..." />
              </div>
            </div>
            <Button onClick={() => saveSection('support', support)} className="silver-button" disabled={saving === 'support'}>
              <Save className="h-4 w-4 mr-2" />
              {saving === 'support' ? 'Saving...' : 'Save Support'}
            </Button>
          </div>
        </Card>

        <Card className="silver-card p-5">
          <h2 className="font-semibold text-silver-900 mb-4">Profit Margin</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Global Profit Margin (%)</Label>
              <Input type="number" step="0.01" value={profit.global_margin} onChange={(e) => setProfit({ ...profit, global_margin: Number(e.target.value) })} />
              <p className="text-xs text-silver-500">Applied to all services unless overridden per-service</p>
            </div>
            <Button onClick={() => saveSection('profit', profit)} className="silver-button" disabled={saving === 'profit'}>
              <Save className="h-4 w-4 mr-2" />
              {saving === 'profit' ? 'Saving...' : 'Save Margin'}
            </Button>
          </div>
        </Card>

        <Card className="silver-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-silver-900">Payment Methods</h2>
            <Button size="sm" variant="outline" onClick={addMethod}>
              <Plus className="h-4 w-4 mr-1" />
              Add Method
            </Button>
          </div>
          <div className="space-y-3">
            {methods.length === 0 ? (
              <p className="text-sm text-silver-500">No payment methods configured</p>
            ) : (
              methods.map((m, idx) => (
                <div key={idx} className="p-3 rounded-lg border border-silver-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-silver-700">Method {idx + 1}</span>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeMethod(idx)}>
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </Button>
                  </div>
                  <Input placeholder="Name (e.g. USDT TRC20)" value={m.name} onChange={(e) => updateMethod(idx, 'name', e.target.value)} />
                  <Input placeholder="Payment address" value={m.address} onChange={(e) => updateMethod(idx, 'address', e.target.value)} />
                  <Textarea placeholder="Notes / instructions" value={m.notes} onChange={(e) => updateMethod(idx, 'notes', e.target.value)} rows={2} />
                </div>
              ))
            )}
          </div>
          <Button onClick={() => saveSection('payment_methods', { methods })} className="silver-button mt-4" disabled={saving === 'payment_methods'}>
            <Save className="h-4 w-4 mr-2" />
            {saving === 'payment_methods' ? 'Saving...' : 'Save Payment Methods'}
          </Button>
        </Card>
      </div>
    </div>
  );
}
