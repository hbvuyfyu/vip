'use client';

import { useEffect, useState } from 'react';
import { Loader2, Edit, Trash2, Star, Eye, EyeOff, Package, Search, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import type { Service, Provider, Category } from '@/lib/types';
import { formatCurrency } from '@/lib/format';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { ImageUpload } from '@/components/image-upload';
import { toast } from 'sonner';

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Service | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', image_url: '', sell_price: 0, category_id: '', is_visible: true, is_featured: false, sort_order: 0,
  });

  const load = async () => {
    const [{ data: s }, { data: p }, { data: c }] = await Promise.all([
      supabase.from('services').select('*, provider:providers(*), category:categories(*)').order('created_at', { ascending: false }),
      supabase.from('providers').select('*'),
      supabase.from('categories').select('*').order('sort_order'),
    ]);
    setServices((s as Service[]) || []);
    setProviders((p as Provider[]) || []);
    setCategories((c as Category[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openEdit = (s: Service) => {
    setEditing(s);
    setForm({
      name: s.name,
      description: s.description || '',
      image_url: s.image_url || '',
      sell_price: s.sell_price,
      category_id: s.category_id || '',
      is_visible: s.is_visible,
      is_featured: s.is_featured,
      sort_order: s.sort_order,
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!editing) return;
    const { error } = await supabase.from('services').update({
      name: form.name,
      description: form.description,
      image_url: form.image_url,
      sell_price: Number(form.sell_price),
      category_id: form.category_id || null,
      is_visible: form.is_visible,
      is_featured: form.is_featured,
      sort_order: Number(form.sort_order),
      updated_at: new Date().toISOString(),
    }).eq('id', editing.id);
    if (error) toast.error(error.message);
    else toast.success('Service updated');
    setDialogOpen(false);
    load();
  };

  const toggleVisible = async (s: Service) => {
    await supabase.from('services').update({ is_visible: !s.is_visible }).eq('id', s.id);
    load();
  };

  const toggleFeatured = async (s: Service) => {
    await supabase.from('services').update({ is_featured: !s.is_featured }).eq('id', s.id);
    load();
  };

  const remove = async (s: Service) => {
    if (!confirm(`Delete service "${s.name}"?`)) return;
    const { error } = await supabase.from('services').delete().eq('id', s.id);
    if (error) toast.error(error.message);
    else {
      toast.success('Service deleted');
      load();
    }
  };

  const filtered = services.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-silver-900">Services</h1>
          <p className="text-silver-500 mt-1">Manage all services from your providers</p>
        </div>
        <Button onClick={load} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-silver-400" />
        <Input placeholder="Search services..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-silver-400" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="silver-card p-8 text-center">
          <Package className="h-12 w-12 text-silver-300 mx-auto mb-3" />
          <p className="text-silver-500">No services found</p>
          <p className="text-sm text-silver-400 mt-1">Add a provider and sync services to get started</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((s) => (
            <Card key={s.id} className="silver-card p-3 flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-silver-100 overflow-hidden flex-shrink-0">
                {s.image_url ? (
                  <img src={s.image_url} alt={s.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <Package className="h-5 w-5 text-silver-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-silver-900 truncate">{s.name}</h3>
                  {s.is_featured && <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />}
                </div>
                <p className="text-xs text-silver-500 truncate">
                  {s.provider?.name} - {formatCurrency(s.sell_price)}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button size="icon" variant="ghost" onClick={() => toggleVisible(s)} title={s.is_visible ? 'Hide' : 'Show'}>
                  {s.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
                <Button size="icon" variant="ghost" onClick={() => toggleFeatured(s)} title="Toggle featured">
                  <Star className={`h-4 w-4 ${s.is_featured ? 'fill-yellow-400 text-yellow-400' : 'text-silver-400'}`} />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => openEdit(s)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => remove(s)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Service Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Image</Label>
                <ImageUpload value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} folder="services" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Sell Price (USD)</Label>
                  <Input type="number" step="0.01" value={form.sell_price} onChange={(e) => setForm({ ...form, sell_price: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>Sort Order</Label>
                  <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <select
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  className="w-full h-10 rounded-md border border-silver-200 bg-white px-3 text-sm"
                >
                  <option value="">No category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="visible">Visible to customers</Label>
                <Switch checked={form.is_visible} onCheckedChange={(v) => setForm({ ...form, is_visible: v })} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="featured">Featured on homepage</Label>
                <Switch checked={form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={save} className="silver-button">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
