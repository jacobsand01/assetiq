'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
      }

      // After login/signup, send them to the app home.
      router.push('/app');
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="w-full max-w-md bg-slate-800/80 border border-slate-700 rounded-xl p-6 shadow-lg">
        <h1 className="text-2xl font-bold text-white mb-2 text-center">
          AssetIQ
        </h1>
        <p className="text-slate-300 text-center mb-6">
          {mode === 'signin'
            ? 'Sign in to your account'
            : 'Create your AssetIQ account'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-200 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-200 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-indigo-500 px-4 py-2 font-medium text-white hover:bg-indigo-600 disabled:opacity-60"
          >
            {loading
              ? 'Working...'
              : mode === 'signin'
              ? 'Sign in'
              : 'Sign up'}
          </button>
        </form>

        <div className="mt-4 text-center">
          {mode === 'signin' ? (
            <button
              type="button"
              className="text-sm text-indigo-300 hover:underline"
              onClick={() => setMode('signup')}
            >
              Need an account? Sign up
            </button>
          ) : (
            <button
              type="button"
              className="text-sm text-indigo-300 hover:underline"
              onClick={() => setMode('signin')}
            >
              Already have an account? Sign in
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
