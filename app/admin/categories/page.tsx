'use client';

import { useEffect, useState } from 'react';
import { Loader2, Plus, Edit, Trash2, Tags, ChevronDown, ChevronRight, Star, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import type { Category, SubButton } from '@/lib/types';
import { slugify } from '@/lib/format';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { ImageUpload } from '@/components/image-upload';
import { toast } from 'sonner';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<(Category & { sub_buttons: SubButton[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [catDialog, setCatDialog] = useState(false);
  const [subDialog, setSubDialog] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [editingSub, setEditingSub] = useState<{ cat: Category; sub: SubButton | null } | null>(null);
  const [catForm, setCatForm] = useState({ name: '', description: '', image_url: '', icon: '', is_active: true, is_featured: false, sort_order: 0 });
  const [subForm, setSubForm] = useState({ name: '', image_url: '', sort_order: 0, is_active: true });

  const load = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*, sub_buttons(*)')
      .order('sort_order');
    setCategories((data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openNewCat = () => {
    setEditingCat(null);
    setCatForm({ name: '', description: '', image_url: '', icon: '', is_active: true, is_featured: false, sort_order: 0 });
    setCatDialog(true);
  };

  const openEditCat = (c: Category) => {
    setEditingCat(c);
    setCatForm({
      name: c.name, description: c.description, image_url: c.image_url, icon: c.icon,
      is_active: c.is_active, is_featured: c.is_featured, sort_order: c.sort_order,
    });
    setCatDialog(true);
  };

  const saveCat = async () => {
    if (!catForm.name) {
      toast.error('Name is required');
      return;
    }
    const slug = slugify(catForm.name) + '-' + Date.now().toString(36).slice(-4);
    if (editingCat) {
      const { error } = await supabase.from('categories').update({
        name: catForm.name, description: catForm.description, image_url: catForm.image_url,
        icon: catForm.icon, is_active: catForm.is_active, is_featured: catForm.is_featured,
        sort_order: Number(catForm.sort_order), updated_at: new Date().toISOString(),
      }).eq('id', editingCat.id);
      if (error) toast.error(error.message);
      else toast.success('Category updated');
    } else {
      const { error } = await supabase.from('categories').insert({
        name: catForm.name, slug, description: catForm.description, image_url: catForm.image_url,
        icon: catForm.icon, is_active: catForm.is_active, is_featured: catForm.is_featured,
        sort_order: Number(catForm.sort_order),
      });
      if (error) toast.error(error.message);
      else toast.success('Category created');
    }
    setCatDialog(false);
    load();
  };

  const removeCat = async (c: Category) => {
    if (!confirm(`Delete category "${c.name}" and all its sub-buttons?`)) return;
    const { error } = await supabase.from('categories').delete().eq('id', c.id);
    if (error) toast.error(error.message);
    else { toast.success('Category deleted'); load(); }
  };

  const toggleCat = async (c: Category, field: 'is_active' | 'is_featured') => {
    await supabase.from('categories').update({ [field]: !c[field] }).eq('id', c.id);
    load();
  };

  const openNewSub = (cat: Category) => {
    setEditingSub({ cat, sub: null });
    setSubForm({ name: '', image_url: '', sort_order: 0, is_active: true });
    setSubDialog(true);
  };

  const openEditSub = (cat: Category, sub: SubButton) => {
    setEditingSub({ cat, sub });
    setSubForm({ name: sub.name, image_url: sub.image_url, sort_order: sub.sort_order, is_active: sub.is_active });
    setSubDialog(true);
  };

  const saveSub = async () => {
    if (!editingSub) return;
    if (!subForm.name) { toast.error('Name is required'); return; }
    if (editingSub.sub) {
      const { error } = await supabase.from('sub_buttons').update({
        name: subForm.name, image_url: subForm.image_url, sort_order: Number(subForm.sort_order), is_active: subForm.is_active,
      }).eq('id', editingSub.sub.id);
      if (error) toast.error(error.message);
      else toast.success('Sub-button updated');
    } else {
      const { error } = await supabase.from('sub_buttons').insert({
        category_id: editingSub.cat.id, name: subForm.name, image_url: subForm.image_url,
        sort_order: Number(subForm.sort_order), is_active: subForm.is_active,
      });
      if (error) toast.error(error.message);
      else toast.success('Sub-button created');
    }
    setSubDialog(false);
    load();
  };

  const removeSub = async (sub: SubButton) => {
    if (!confirm(`Delete sub-button "${sub.name}"?`)) return;
    const { error } = await supabase.from('sub_buttons').delete().eq('id', sub.id);
    if (error) toast.error(error.message);
    else { toast.success('Sub-button deleted'); load(); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-silver-900">Categories</h1>
          <p className="text-silver-500 mt-1">Manage homepage categories and sub-buttons</p>
        </div>
        <Button onClick={openNewCat} className="silver-button">
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-silver-400" />
        </div>
      ) : categories.length === 0 ? (
        <Card className="silver-card p-8 text-center">
          <Tags className="h-12 w-12 text-silver-300 mx-auto mb-3" />
          <p className="text-silver-500">No categories yet</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {categories.map((c) => (
            <Card key={c.id} className="silver-card">
              <div className="p-3 flex items-center gap-3">
                <button
                  onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                  className="p-1 hover:bg-silver-100 rounded"
                >
                  {expanded === c.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                <div className="h-10 w-10 rounded-lg bg-silver-100 overflow-hidden flex-shrink-0">
                  {c.image_url ? (
                    <img src={c.image_url} alt={c.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Tags className="h-5 w-5 text-silver-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-silver-900">{c.name}</h3>
                    {c.is_featured && <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />}
                  </div>
                  <p className="text-xs text-silver-500">{c.sub_buttons?.length || 0} sub-buttons</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button size="icon" variant="ghost" onClick={() => toggleCat(c, 'is_active')} title={c.is_active ? 'Active' : 'Inactive'}>
                    {c.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => toggleCat(c, 'is_featured')} title="Toggle featured">
                    <Star className={`h-4 w-4 ${c.is_featured ? 'fill-yellow-400 text-yellow-400' : 'text-silver-400'}`} />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => openEditCat(c)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => removeCat(c)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
              {expanded === c.id && (
                <div className="border-t border-silver-100 p-3 bg-silver-50/50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-silver-700">Sub-buttons</h4>
                    <Button size="sm" variant="outline" onClick={() => openNewSub(c)}>
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </div>
                  {c.sub_buttons?.length === 0 ? (
                    <p className="text-xs text-silver-400 py-2">No sub-buttons yet</p>
                  ) : (
                    <div className="space-y-1">
                      {c.sub_buttons?.map((sub) => (
                        <div key={sub.id} className="flex items-center gap-2 p-2 rounded-lg bg-white border border-silver-100">
                          <div className="h-8 w-8 rounded bg-silver-100 overflow-hidden flex-shrink-0">
                            {sub.image_url ? (
                              <img src={sub.image_url} alt={sub.name} className="h-full w-full object-cover" />
                            ) : null}
                          </div>
                          <span className="flex-1 text-sm text-silver-700">{sub.name}</span>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditSub(c, sub)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeSub(sub)}>
                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Dialog open={catDialog} onOpenChange={setCatDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCat ? 'Edit Category' : 'Add Category'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={catForm.description} onChange={(e) => setCatForm({ ...catForm, description: e.target.value })} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Image</Label>
              <ImageUpload value={catForm.image_url} onChange={(url) => setCatForm({ ...catForm, image_url: url })} folder="categories" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Icon (emoji or name)</Label>
                <Input value={catForm.icon} onChange={(e) => setCatForm({ ...catForm, icon: e.target.value })} placeholder="Game" />
              </div>
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input type="number" value={catForm.sort_order} onChange={(e) => setCatForm({ ...catForm, sort_order: Number(e.target.value) })} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch checked={catForm.is_active} onCheckedChange={(v) => setCatForm({ ...catForm, is_active: v })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Featured</Label>
              <Switch checked={catForm.is_featured} onCheckedChange={(v) => setCatForm({ ...catForm, is_featured: v })} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={saveCat} className="silver-button">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={subDialog} onOpenChange={setSubDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSub?.sub ? 'Edit Sub-button' : 'Add Sub-button'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={subForm.name} onChange={(e) => setSubForm({ ...subForm, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Image</Label>
              <ImageUpload value={subForm.image_url} onChange={(url) => setSubForm({ ...subForm, image_url: url })} folder="buttons" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input type="number" value={subForm.sort_order} onChange={(e) => setSubForm({ ...subForm, sort_order: Number(e.target.value) })} />
              </div>
              <div className="flex items-center justify-between pt-6">
                <Label>Active</Label>
                <Switch checked={subForm.is_active} onCheckedChange={(v) => setSubForm({ ...subForm, is_active: v })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={saveSub} className="silver-button">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
