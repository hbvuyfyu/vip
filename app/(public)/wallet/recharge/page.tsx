'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, CheckCircle2, AlertCircle, Upload, CreditCard } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { useSettings } from '@/lib/settings-context';
import { formatCurrency } from '@/lib/format';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ImageUpload } from '@/components/image-upload';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function RechargePage() {
  const router = useRouter();
  const { profile, loading } = useAuth();
  const { settings } = useSettings();
  const methods = settings?.payment_methods?.methods || [];

  const [selectedMethod, setSelectedMethod] = useState('');
  const [amount, setAmount] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [proofImage, setProofImage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (methods.length > 0 && !selectedMethod) {
      setSelectedMethod(methods[0].id);
    }
  }, [methods, selectedMethod]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-silver-400" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-silver-500">Please sign in to recharge your wallet.</p>
        <Link href="/login" className="mt-4 inline-block">
          <Button className="silver-button">Sign In</Button>
        </Link>
      </div>
    );
  }

  const selected = methods.find((m) => m.id === selectedMethod);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) {
      toast.error('Please select a payment method');
      return;
    }
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('recharge_requests').insert({
        user_id: profile.id,
        payment_method: selected.name,
        amount: amt,
        transaction_id: transactionId,
        proof_image_url: proofImage,
      });
      if (error) throw error;
      setSubmitted(true);
      toast.success('Recharge request submitted!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="silver-card p-8 max-w-md mx-auto text-center">
          <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-silver-900">Request Submitted</h2>
          <p className="text-silver-600 mt-2">
            Your request is being processed. Please wait a few minutes for confirmation.
          </p>
          <div className="flex gap-3 justify-center mt-6">
            <Link href="/wallet">
              <Button className="silver-button">Back to Wallet</Button>
            </Link>
            <Button variant="outline" onClick={() => {
              setSubmitted(false);
              setAmount('');
              setTransactionId('');
              setProofImage('');
            }}>
              Submit Another
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Link href="/wallet" className="inline-flex items-center text-silver-600 hover:text-silver-900 mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to wallet
      </Link>

      <h1 className="text-2xl md:text-3xl font-bold text-silver-900 mb-2">Recharge Wallet</h1>
      <p className="text-silver-500 mb-6">Choose a payment method and submit your request</p>

      <div className="space-y-6">
        <div>
          <Label className="mb-3 block">Payment Method</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {methods.length === 0 ? (
              <p className="text-silver-500 text-sm col-span-2">No payment methods configured yet.</p>
            ) : (
              methods.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMethod(m.id)}
                  className={cn(
                    'p-4 rounded-lg border-2 text-left transition-all',
                    selectedMethod === m.id
                      ? 'border-silver-700 bg-silver-100'
                      : 'border-silver-200 bg-white hover:border-silver-400'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-silver-600" />
                    <span className="font-medium text-silver-900">{m.name}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {selected && (
          <Card className="silver-card p-5">
            <h3 className="font-semibold text-silver-900 mb-3">Payment Instructions</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-silver-500">Address: </span>
                <span className="font-mono font-medium text-silver-900 break-all">{selected.address}</span>
              </div>
              {selected.notes && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
                  <AlertCircle className="h-4 w-4 inline mr-1" />
                  {selected.notes}
                </div>
              )}
            </div>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (USD)</Label>
            <Input
              id="amount"
              type="number"
              min="1"
              step="0.01"
              placeholder="10.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="txid">Transaction ID (optional)</Label>
            <Input
              id="txid"
              type="text"
              placeholder="Transaction reference number"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Payment Proof (optional)</Label>
            <ImageUpload
              value={proofImage}
              onChange={setProofImage}
              folder="proofs"
              aspectRatio="square"
              label="Upload payment screenshot"
            />
          </div>

          <Button type="submit" className="w-full silver-button" disabled={submitting || !selected}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
            Verify & Submit
          </Button>
        </form>

        <Card className="silver-card p-4 flex items-start gap-3 bg-silver-50">
          <AlertCircle className="h-5 w-5 text-silver-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-silver-600">
            After submitting, your request will be reviewed by our team. Once approved, the amount will be
            added to your wallet automatically. This usually takes a few minutes.
          </p>
        </Card>
      </div>
    </div>
  );
}
