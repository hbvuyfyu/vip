'use client';

import { useEffect, useState } from 'react';
import { Loader2, Plus, RefreshCw, Trash2, Edit, Server, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import type { Provider } from '@/lib/types';
import { formatDate } from '@/lib/format';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export default function AdminProvidersPage() {
  const { profile } = useAuth();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Provider | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', api_url: '', api_key: '', extra_config: '' });

  const load = async () => {
    const { data } = await supabase.from('providers').select('*').order('created_at', { ascending: false });
    setProviders((data as Provider[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', api_url: '', api_key: '', extra_config: '' });
    setDialogOpen(true);
  };

  const openEdit = (p: Provider) => {
    setEditing(p);
    setForm({
      name: p.name,
      api_url: p.api_url,
      api_key: p.api_key,
      extra_config: JSON.stringify(p.extra_config || {}, null, 2),
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.name || !form.api_url || !form.api_key) {
      toast.error('Name, API URL, and API Key are required');
      return;
    }
    let extraConfig: Record<string, unknown> = {};
    if (form.extra_config.trim()) {
      try {
        extraConfig = JSON.parse(form.extra_config);
      } catch {
        toast.error('Extra config must be valid JSON');
        return;
      }
    }
    if (editing) {
      const { error } = await supabase
        .from('providers')
        .update({
          name: form.name,
          api_url: form.api_url,
          api_key: form.api_key,
          extra_config: extraConfig,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editing.id);
      if (error) toast.error(error.message);
      else toast.success('Provider updated');
    } else {
      const { error } = await supabase.from('providers').insert({
        name: form.name,
        api_url: form.api_url,
        api_key: form.api_key,
        extra_config: extraConfig,
      });
      if (error) toast.error(error.message);
      else toast.success('Provider added');
    }
    setDialogOpen(false);
    load();
  };

  const remove = async (p: Provider) => {
    if (!confirm(`Delete provider ${p.name}? This will also delete all its services.`)) return;
    const { error } = await supabase.from('providers').delete().eq('id', p.id);
    if (error) toast.error(error.message);
    else {
      toast.success('Provider deleted');
      load();
    }
  };

  const sync = async (p: Provider) => {
    setSyncing(p.id);
    try {
      const res = await fetch('/api/providers/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider_id: p.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Sync failed');
      toast.success(`Synced ${data.synced || 0} services`);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Sync failed');
    } finally {
      setSyncing(null);
    }
  };

  const toggleActive = async (p: Provider) => {
    await supabase.from('providers').update({ is_active: !p.is_active }).eq('id', p.id);
    load();
  };

  if (profile?.role !== 'super_admin') {
    return (
      <div className="text-center py-16">
        <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
        <p className="text-silver-700">Super Admin access required.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-silver-900">Providers</h1>
          <p className="text-silver-500 mt-1">Manage external service providers</p>
        </div>
        <Button onClick={openNew} className="silver-button">
          <Plus className="h-4 w-4 mr-2" />
          Add Provider
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-silver-400" />
        </div>
      ) : providers.length === 0 ? (
        <Card className="silver-card p-8 text-center">
          <Server className="h-12 w-12 text-silver-300 mx-auto mb-3" />
          <p className="text-silver-500">No providers yet</p>
          <p className="text-sm text-silver-400 mt-1">Add a provider to start importing services</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {providers.map((p) => (
            <Card key={p.id} className="silver-card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="h-10 w-10 rounded-lg silver-gradient flex items-center justify-center flex-shrink-0">
                    <Server className="h-5 w-5 text-silver-700" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-silver-900">{p.name}</h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${p.is_active ? 'bg-green-50 text-green-700' : 'bg-silver-100 text-silver-500'}`}>
                        {p.is_active ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        {p.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-xs text-silver-500 mt-1 truncate">{p.api_url}</p>
                    {p.last_sync_at && (
                      <p className="text-xs text-silver-400 mt-1">Last sync: {formatDate(p.last_sync_at)}</p>
                    )}
                    {p.last_sync_error && (
                      <p className="text-xs text-red-500 mt-1">Error: {p.last_sync_error}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button size="sm" variant="outline" onClick={() => sync(p)} disabled={syncing === p.id}>
                    <RefreshCw className={`h-4 w-4 mr-1 ${syncing === p.id ? 'animate-spin' : ''}`} />
                    Sync
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => openEdit(p)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(p)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-silver-100 flex items-center justify-between">
                <span className="text-sm text-silver-600">Active</span>
                <Switch checked={p.is_active} onCheckedChange={() => toggleActive(p)} />
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Provider' : 'Add Provider'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Provider Name</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. SMM Panel" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="api_url">API URL</Label>
              <Input id="api_url" value={form.api_url} onChange={(e) => setForm({ ...form, api_url: e.target.value })} placeholder="https://provider.com/api/v2" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="api_key">API Key</Label>
              <Input id="api_key" type="password" value={form.api_key} onChange={(e) => setForm({ ...form, api_key: e.target.value })} placeholder="Your API key" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="extra">Extra Config (JSON, optional)</Label>
              <Textarea id="extra" value={form.extra_config} onChange={(e) => setForm({ ...form, extra_config: e.target.value })} placeholder='{"format":"json"}' rows={4} className="font-mono text-sm" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={save} className="silver-button">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
