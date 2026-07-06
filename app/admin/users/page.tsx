'use client';

import { useEffect, useState } from 'react';
import { Loader2, Search, Ban, CheckCircle2, Edit, User as UserIcon, Wallet } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import type { Profile } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/format';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function AdminUsersPage() {
  const { profile: me } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Profile | null>(null);
  const [dialog, setDialog] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustDesc, setAdjustDesc] = useState('');

  const load = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setUsers((data as Profile[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const toggleBlock = async (u: Profile) => {
    if (u.id === me?.id) { toast.error("You can't block yourself"); return; }
    const { error } = await supabase.from('profiles').update({ is_blocked: !u.is_blocked }).eq('id', u.id);
    if (error) toast.error(error.message);
    else { toast.success(u.is_blocked ? 'User unblocked' : 'User blocked'); load(); }
  };

  const setRole = async (u: Profile, role: Profile['role']) => {
    if (u.id === me?.id) { toast.error("You can't change your own role"); return; }
    if (me?.role !== 'super_admin') { toast.error('Only Super Admin can change roles'); return; }
    const { error } = await supabase.from('profiles').update({ role }).eq('id', u.id);
    if (error) toast.error(error.message);
    else { toast.success('Role updated'); load(); }
  };

  const openAdjust = (u: Profile) => {
    setEditing(u);
    setAdjustAmount('');
    setAdjustDesc('');
    setDialog(true);
  };

  const submitAdjust = async () => {
    if (!editing) return;
    const amt = Number(adjustAmount);
    if (!amt || amt === 0) { toast.error('Enter a non-zero amount'); return; }
    const { error } = await supabase.rpc('adjust_wallet_balance', {
      p_user_id: editing.id,
      p_amount: amt,
      p_type: 'adjustment',
      p_description: adjustDesc || 'Admin adjustment',
      p_actor_id: me?.id,
    });
    if (error) toast.error(error.message);
    else { toast.success('Wallet adjusted'); setDialog(false); load(); }
  };

  const filtered = users.filter((u) => u.phone.includes(search) || u.full_name?.toLowerCase().includes(search.toLowerCase()));

  const roleBadge = (role: Profile['role']) => {
    if (role === 'super_admin') return <Badge className="bg-silver-800 text-white">Super Admin</Badge>;
    if (role === 'admin') return <Badge className="bg-silver-300 text-silver-800">Admin</Badge>;
    return <Badge variant="outline">User</Badge>;
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-silver-900">Users</h1>
        <p className="text-silver-500 mt-1">Manage user accounts and roles</p>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-silver-400" />
        <Input placeholder="Search by phone or name..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-silver-400" />
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((u) => (
            <Card key={u.id} className="silver-card p-3 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full silver-gradient flex items-center justify-center flex-shrink-0">
                <UserIcon className="h-5 w-5 text-silver-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-silver-900">{u.full_name || 'Unnamed'}</span>
                  {roleBadge(u.role)}
                  {u.is_blocked && <Badge variant="destructive">Blocked</Badge>}
                </div>
                <p className="text-xs text-silver-500">{u.phone} - Joined {formatDate(u.created_at)}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-semibold text-silver-900">{formatCurrency(u.wallet_balance)}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button size="icon" variant="ghost" onClick={() => openAdjust(u)} title="Adjust wallet">
                  <Wallet className="h-4 w-4" />
                </Button>
                {me?.role === 'super_admin' && (
                  <select
                    value={u.role}
                    onChange={(e) => setRole(u, e.target.value as Profile['role'])}
                    className="h-8 rounded border border-silver-200 bg-white px-1 text-xs"
                    disabled={u.id === me?.id}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                )}
                <Button size="icon" variant="ghost" onClick={() => toggleBlock(u)} title={u.is_blocked ? 'Unblock' : 'Block'}>
                  {u.is_blocked ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Ban className="h-4 w-4 text-red-500" />}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust Wallet - {editing?.phone}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-silver-50">
              <p className="text-sm text-silver-600">Current balance: <span className="font-semibold">{formatCurrency(editing?.wallet_balance || 0)}</span></p>
            </div>
            <div className="space-y-2">
              <Label>Amount (use negative to deduct)</Label>
              <Input type="number" step="0.01" value={adjustAmount} onChange={(e) => setAdjustAmount(e.target.value)} placeholder="10.00 or -5.00" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={adjustDesc} onChange={(e) => setAdjustDesc(e.target.value)} placeholder="Reason for adjustment" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={submitAdjust} className="silver-button">Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
