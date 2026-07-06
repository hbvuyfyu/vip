'use client';

import { useEffect, useState } from 'react';
import { Loader2, Plus, Edit, Trash2, Image as ImageIcon, Eye, EyeOff, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import type { Banner, BannerImage } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { ImageUpload } from '@/components/image-upload';
import { toast } from 'sonner';

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<(Banner & { banner_images: BannerImage[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState({ title: '', link_url: '', width: 1200, height: 400, duration: 5000, is_active: true, sort_order: 0 });
  const [images, setImages] = useState<BannerImage[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');

  const load = async () => {
    const { data } = await supabase
      .from('banners')
      .select('*, banner_images(*)')
      .order('sort_order');
    setBanners((data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ title: '', link_url: '', width: 1200, height: 400, duration: 5000, is_active: true, sort_order: 0 });
    setImages([]);
    setNewImageUrl('');
    setDialog(true);
  };

  const openEdit = (b: Banner & { banner_images: BannerImage[] }) => {
    setEditing(b);
    setForm({
      title: b.title, link_url: b.link_url, width: b.width, height: b.height,
      duration: b.duration, is_active: b.is_active, sort_order: b.sort_order,
    });
    setImages(b.banner_images || []);
    setNewImageUrl('');
    setDialog(true);
  };

  const save = async () => {
    if (!form.title) { toast.error('Title is required'); return; }
    let bannerId = editing?.id;
    if (editing) {
      const { error } = await supabase.from('banners').update({
        title: form.title, link_url: form.link_url, width: Number(form.width), height: Number(form.height),
        duration: Number(form.duration), is_active: form.is_active, sort_order: Number(form.sort_order),
        updated_at: new Date().toISOString(),
      }).eq('id', editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success('Banner updated');
    } else {
      const { data, error } = await supabase.from('banners').insert({
        title: form.title, link_url: form.link_url, width: Number(form.width), height: Number(form.height),
        duration: Number(form.duration), is_active: form.is_active, sort_order: Number(form.sort_order),
      }).select().single();
      if (error) { toast.error(error.message); return; }
      bannerId = data.id;
      toast.success('Banner created');
    }
    if (newImageUrl && bannerId) {
      await supabase.from('banner_images').insert({
        banner_id: bannerId, image_url: newImageUrl, sort_order: images.length,
      });
    }
    setDialog(false);
    load();
  };

  const removeImage = async (img: BannerImage) => {
    if (!confirm('Remove this image?')) return;
    await supabase.from('banner_images').delete().eq('id', img.id);
    if (editing) {
      const { data } = await supabase.from('banner_images').select('*').eq('banner_id', editing.id).order('sort_order');
      setImages((data as BannerImage[]) || []);
    }
  };

  const remove = async (b: Banner) => {
    if (!confirm(`Delete banner "${b.title}"?`)) return;
    const { error } = await supabase.from('banners').delete().eq('id', b.id);
    if (error) toast.error(error.message);
    else { toast.success('Banner deleted'); load(); }
  };

  const toggle = async (b: Banner) => {
    await supabase.from('banners').update({ is_active: !b.is_active }).eq('id', b.id);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-silver-900">Banners</h1>
          <p className="text-silver-500 mt-1">Manage homepage banner carousels</p>
        </div>
        <Button onClick={openNew} className="silver-button">
          <Plus className="h-4 w-4 mr-2" />
          Add Banner
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-silver-400" />
        </div>
      ) : banners.length === 0 ? (
        <Card className="silver-card p-8 text-center">
          <ImageIcon className="h-12 w-12 text-silver-300 mx-auto mb-3" />
          <p className="text-silver-500">No banners yet</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {banners.map((b) => (
            <Card key={b.id} className="silver-card p-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-20 rounded bg-silver-100 overflow-hidden flex-shrink-0">
                  {b.banner_images?.[0]?.image_url ? (
                    <img src={b.banner_images[0].image_url} alt={b.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <ImageIcon className="h-5 w-5 text-silver-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-silver-900 truncate">{b.title}</h3>
                  <p className="text-xs text-silver-500">{b.banner_images?.length || 0} images - {b.width}x{b.height}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button size="icon" variant="ghost" onClick={() => toggle(b)} title={b.is_active ? 'Active' : 'Inactive'}>
                    {b.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => openEdit(b)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(b)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Banner' : 'Add Banner'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Link URL (optional)</Label>
              <Input value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} placeholder="/services" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Width</Label>
                <Input type="number" value={form.width} onChange={(e) => setForm({ ...form, width: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Height</Label>
                <Input type="number" value={form.height} onChange={(e) => setForm({ ...form, height: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Duration (ms)</Label>
                <Input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
            </div>

            {editing && (
              <div className="space-y-2 pt-3 border-t border-silver-100">
                <Label>Current Images</Label>
                {images.length === 0 ? (
                  <p className="text-xs text-silver-400">No images yet</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {images.map((img) => (
                      <div key={img.id} className="relative aspect-video rounded-lg overflow-hidden border border-silver-200">
                        <img src={img.image_url} alt="banner" className="h-full w-full object-cover" />
                        <button
                          onClick={() => removeImage(img)}
                          className="absolute top-1 right-1 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>Add New Image</Label>
              <ImageUpload value={newImageUrl} onChange={setNewImageUrl} folder="banners" aspectRatio="banner" />
              <p className="text-xs text-silver-500">Upload an image and save to add it to this banner</p>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={save} className="silver-button">
              <Upload className="h-4 w-4 mr-2" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
