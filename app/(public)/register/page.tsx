'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Phone, Lock, User, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { KingLogo } from '@/components/king-logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

function phoneToEmail(phone: string) {
  const digits = phone.replace(/[^0-9]/g, '');
  return `${digits}@king.app`;
}

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const digits = phone.replace(/[^0-9]/g, '');
    if (digits.length < 6) {
      setError('Please enter a valid phone number');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const email = phoneToEmail(phone);
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, phone: digits } },
      });
      if (signUpError) {
        if (signUpError.message.toLowerCase().includes('already registered')) {
          setError('This phone number is already registered. Try signing in.');
        } else {
          setError(signUpError.message);
        }
        setLoading(false);
        return;
      }
      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          phone: digits,
          full_name: fullName,
        });
      }
      router.push('/');
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 silver-gradient">
      <Card className="w-full max-w-md p-8 silver-card">
        <div className="flex justify-center mb-6">
          <KingLogo size="lg" animated />
        </div>
        <h1 className="text-2xl font-bold text-center text-silver-900">Create Account</h1>
        <p className="text-center text-silver-500 mt-1 text-sm">
          Join King and start ordering digital services
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-silver-400" />
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="pl-10"
                required
                autoComplete="name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-silver-400" />
              <Input
                id="phone"
                type="tel"
                placeholder="+1 504 325 3235"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="pl-10"
                required
                autoComplete="tel"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-silver-400" />
              <Input
                id="password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-silver-400" />
              <Input
                id="confirm"
                type="password"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="pl-10"
                required
                autoComplete="new-password"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <Button type="submit" className="w-full silver-button" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Create Account
          </Button>
        </form>

        <p className="text-center text-sm text-silver-500 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-silver-900 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
