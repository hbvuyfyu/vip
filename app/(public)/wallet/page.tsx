'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Wallet, Plus, ArrowDownCircle, ArrowUpCircle, Receipt, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import type { WalletTransaction } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/format';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function WalletPage() {
  const { profile, loading } = useAuth();
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [txLoading, setTxLoading] = useState(true);

  useEffect(() => {
    if (!profile) {
      setTxLoading(false);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(50);
      setTransactions((data as WalletTransaction[]) || []);
      setTxLoading(false);
    })();
  }, [profile]);

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
        <p className="text-silver-500">Please sign in to view your wallet.</p>
        <Link href="/login" className="mt-4 inline-block">
          <Button className="silver-button">Sign In</Button>
        </Link>
      </div>
    );
  }

  const txIcon = (type: WalletTransaction['type']) => {
    if (type === 'recharge' || type === 'refund') return <ArrowDownCircle className="h-5 w-5 text-green-600" />;
    if (type === 'order') return <ArrowUpCircle className="h-5 w-5 text-red-500" />;
    return <Receipt className="h-5 w-5 text-silver-500" />;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-silver-900 mb-6">My Wallet</h1>

      <Card className="silver-card p-6 mb-6 relative overflow-hidden">
        <div className="absolute inset-0 silver-gradient opacity-40" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-silver-600">Current Balance</p>
              <p className="text-4xl font-bold text-silver-900 mt-1">{formatCurrency(profile.wallet_balance)}</p>
            </div>
            <div className="h-16 w-16 rounded-2xl silver-gradient flex items-center justify-center">
              <Wallet className="h-8 w-8 text-silver-700" />
            </div>
          </div>
          <div className="mt-6">
            <Link href="/wallet/recharge">
              <Button className="silver-button">
                <Plus className="h-4 w-4 mr-2" />
                Recharge Wallet
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      <div>
        <h2 className="text-xl font-semibold text-silver-900 mb-4">Transaction History</h2>
        {txLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-silver-400" />
          </div>
        ) : transactions.length === 0 ? (
          <Card className="silver-card p-8 text-center">
            <Receipt className="h-10 w-10 text-silver-300 mx-auto mb-3" />
            <p className="text-silver-500">No transactions yet</p>
            <p className="text-sm text-silver-400 mt-1">Your transaction history will appear here</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <Card key={tx.id} className="silver-card p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-silver-100 flex items-center justify-center flex-shrink-0">
                  {txIcon(tx.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-silver-900 capitalize">{tx.type}</p>
                  <p className="text-xs text-silver-500 truncate">{tx.description || formatDate(tx.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className={cn('font-semibold', tx.amount >= 0 ? 'text-green-600' : 'text-red-500')}>
                    {tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount)}
                  </p>
                  <p className="text-xs text-silver-500">{formatDate(tx.created_at)}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
