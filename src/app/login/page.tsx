'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type Mode = 'login' | 'signup';

export default function AuthPage() {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        // User will be redirected based on whether they have an org/profile
        router.push('/dashboard');
      } else {
        // Sign up + attach full_name metadata for later
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: fullName ? { full_name: fullName } : undefined,
          },
        });

        if (signUpError) throw signUpError;

        // After signup, send them to org onboarding
        router.push('/onboarding/new-org');
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.message ??
          (mode === 'login'
            ? 'Failed to sign in. Check your email and password.'
            : 'Failed to create account.')
      );
    } finally {
      setLoading(false);
    }
  }

  const title = mode === 'login' ? 'Sign in to AssetIQ' : 'Create your account';
  const subtitle =
    mode === 'login'
      ? 'Track your fleet without juggling spreadsheets.'
      : 'Create an account and then set up your first workspace.';

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center px-4 font-sans">
      <div className="w-full max-w-md">
        {/* App title bar */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium tracking-wide text-slate-400 uppercase">
              AssetIQ
            </span>
            <span className="text-[11px] text-slate-500">
              Lightweight asset tracking for small IT teams.
            </span>
          </div>
          <Badge variant="outline" className="text-[11px]">
            Beta
          </Badge>
        </div>

        {/* Auth card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              {subtitle}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-300">
                    Your name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jacob Sandlin"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3578E5]"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-300">
                  Work email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@school.org"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3578E5]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-300">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3578E5]"
                />
                <p className="text-[11px] text-slate-500">
                  Keep it simple for now; you can switch to SSO later.
                </p>
              </div>

              {error && (
                <p className="text-xs text-red-400 bg-red-950/40 border border-red-900 rounded-xl px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex flex-col gap-3 pt-1">
                <Button
                  type="submit"
                  size="sm"
                  disabled={loading}
                  className="w-full bg-[#3578E5] hover:bg-[#2861bc]"
                >
                  {loading
                    ? mode === 'login'
                      ? 'Signing in…'
                      : 'Creating account…'
                    : mode === 'login'
                    ? 'Sign in'
                    : 'Create account'}
                </Button>

                <button
                  type="button"
                  className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                  onClick={() => {
                    setError(null);
                    setMode(mode === 'login' ? 'signup' : 'login');
                  }}
                >
                  {mode === 'login' ? (
                    <>
                      New here?{' '}
                      <span className="underline underline-offset-2">
                        Create an account
                      </span>
                    </>
                  ) : (
                    <>
                      Already have an account?{' '}
                      <span className="underline underline-offset-2">
                        Sign in instead
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="mt-4 text-[11px] text-slate-500 text-center">
          AssetIQ is designed for one-person or tiny IT teams – no giant ITSM
          stack required.
        </p>
      </div>
    </main>
  );
}
