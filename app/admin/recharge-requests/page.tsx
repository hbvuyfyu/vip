'use client';

import { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, XCircle, Clock, Wallet, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import type { RechargeRequest } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/format';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function AdminRechargeRequestsPage() {
  const { profile: me } = useAuth();
  const [requests, setRequests] = useState<RechargeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [reviewing, setReviewing] = useState<RechargeRequest | null>(null);
  const [dialog, setDialog] = useState(false);
  const [finalAmount, setFinalAmount] = useState('');
  const [notes, setNotes] = useState('');

  const load = async () => {
    let q = supabase
      .from('recharge_requests')
      .select('*, user:profiles(*)')
      .order('created_at', { ascending: false });
    if (filter !== 'all') q = q.eq('status', filter);
    const { data } = await q;
    setRequests((data as RechargeRequest[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    load();
  }, [filter]);

  const openReview = (r: RechargeRequest) => {
    setReviewing(r);
    setFinalAmount(String(r.amount));
    setNotes('');
    setDialog(true);
  };

  const approve = async () => {
    if (!reviewing) return;
    const amt = Number(finalAmount);
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return; }
    const { error } = await supabase.rpc('approve_recharge', {
      p_request_id: reviewing.id,
      p_final_amount: amt,
      p_admin_notes: notes,
      p_actor_id: me?.id,
    });
    if (error) toast.error(error.message);
    else { toast.success('Recharge approved'); setDialog(false); load(); }
  };

  const reject = async () => {
    if (!reviewing) return;
    const { error } = await supabase
      .from('recharge_requests')
      .update({ status: 'rejected', admin_notes: notes, reviewed_by: me?.id, reviewed_at: new Date().toISOString() })
      .eq('id', reviewing.id);
    if (error) toast.error(error.message);
    else { toast.success('Recharge rejected'); setDialog(false); load(); }
  };

  const statusBadge = (s: string) => {
    if (s === 'pending') return <Badge className="bg-amber-100 text-amber-700">Pending</Badge>;
    if (s === 'approved') return <Badge className="bg-green-100 text-green-700">Approved</Badge>;
    return <Badge variant="destructive">Rejected</Badge>;
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-silver-900">Recharge Requests</h1>
        <p className="text-silver-500 mt-1">Review and process wallet recharge requests</p>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f)}
            className={filter === f ? 'silver-button capitalize' : 'capitalize'}
          >
            {f}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-silver-400" />
        </div>
      ) : requests.length === 0 ? (
        <Card className="silver-card p-8 text-center">
          <Wallet className="h-12 w-12 text-silver-300 mx-auto mb-3" />
          <p className="text-silver-500">No {filter} requests</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {requests.map((r) => (
            <Card key={r.id} className="silver-card p-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full silver-gradient flex items-center justify-center flex-shrink-0">
                  <Wallet className="h-5 w-5 text-silver-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-silver-900">{r.user?.phone || 'Unknown'}</span>
                    {statusBadge(r.status)}
                  </div>
                  <p className="text-sm text-silver-700 mt-1">
                    Requested: <span className="font-semibold">{formatCurrency(r.amount)}</span>
                    {r.final_amount !== null && r.status === 'approved' && (
                      <span className="ml-2 text-green-600">Approved: {formatCurrency(r.final_amount)}</span>
                    )}
                  </p>
                  <p className="text-xs text-silver-500 mt-1">
                    Method: {r.payment_method} - {formatDate(r.created_at)}
                  </p>
                  {r.transaction_id && <p className="text-xs text-silver-500">TxID: {r.transaction_id}</p>}
                  {r.proof_image_url && (
                    <a href={r.proof_image_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1">
                      <ExternalLink className="h-3 w-3" />
                      View proof
                    </a>
                  )}
                </div>
                {r.status === 'pending' && (
                  <Button size="sm" className="silver-button" onClick={() => openReview(r)}>
                    Review
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Review Recharge Request</DialogTitle>
          </DialogHeader>
          {reviewing && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-silver-50 space-y-1 text-sm">
                <p><span className="text-silver-500">User:</span> <span className="font-medium">{reviewing.user?.phone}</span></p>
                <p><span className="text-silver-500">Requested:</span> <span className="font-medium">{formatCurrency(reviewing.amount)}</span></p>
                <p><span className="text-silver-500">Method:</span> {reviewing.payment_method}</p>
                {reviewing.transaction_id && <p><span className="text-silver-500">TxID:</span> {reviewing.transaction_id}</p>}
                {reviewing.proof_image_url && (
                  <a href={reviewing.proof_image_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                    <ExternalLink className="h-3 w-3" /> View proof image
                  </a>
                )}
              </div>
              <div className="space-y-2">
                <Label>Final Amount to Add (USD)</Label>
                <Input type="number" step="0.01" value={finalAmount} onChange={(e) => setFinalAmount(e.target.value)} />
                <p className="text-xs text-silver-500">Edit if the actual received amount differs</p>
              </div>
              <div className="space-y-2">
                <Label>Admin Notes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Optional notes" />
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button variant="destructive" onClick={reject}>Reject</Button>
            <Button onClick={approve} className="silver-button">Approve</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
