'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

// Simple slug helper for organization slugs
function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export default function NewOrgOnboardingPage() {
  const router = useRouter();
  const [orgName, setOrgName] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Get current auth user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/login');
        return;
      }

      const slug = slugify(orgName);

      // 1) Create organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({ name: orgName, slug })
        .select('id')
        .single();

      if (orgError) {
        throw orgError;
      }

      // 2) Create profile linked to that org
      const { error: profileError } = await supabase.from('profiles').insert({
        id: user.id,
        org_id: org.id,
        full_name: fullName || null,
        role: 'owner',
      });

      if (profileError) {
        throw profileError;
      }

      // Done → back to app home
      router.replace('/app');
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? 'Failed to create organization');
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="w-full max-w-md bg-slate-800/80 border border-slate-700 rounded-xl p-6 shadow-lg">
        <h1 className="text-2xl font-bold text-white mb-2 text-center">
          Set up your workspace
        </h1>
        <p className="text-slate-300 text-center mb-6">
          Create an organization for your school or company. You&apos;ll be the
          workspace owner.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-200 mb-1">
              Organization name
            </label>
            <input
              type="text"
              required
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Pleasant Grove Elementary"
              className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-200 mb-1">
              Your name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jacob Sandlin"
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
            {loading ? 'Creating workspace...' : 'Create workspace'}
          </button>
        </form>
      </div>
    </main>
  );
}
