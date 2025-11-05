'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

type ProfileRow = {
  id: string;
  full_name: string | null;
  org_id: string;
};

export default function AppHomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileRow | null>(null);

  useEffect(() => {
    async function init() {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/login');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, org_id')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading profile:', error);
        router.replace('/onboarding/new-org');
        return;
      }

      if (!data) {
        router.replace('/onboarding/new-org');
        return;
      }

      setProfile(data);
      setLoading(false);
    }

    init();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100">
        <p>Loading your workspace...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100">
      <header className="border-b border-slate-700 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">AssetIQ</h1>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-slate-300">
            {profile?.full_name ?? 'Unnamed admin'}
          </span>
          <button
            className="rounded-md border border-slate-600 px-3 py-1 text-xs hover:bg-slate-800"
            onClick={async () => {
              await supabase.auth.signOut();
              router.replace('/login');
            }}
          >
            Sign out
          </button>
        </div>
      </header>

      <section className="p-6">
  <h2 className="text-lg font-semibold mb-2">
    Welcome to your AssetIQ workspace
  </h2>
  <p className="text-slate-300 mb-4">
    Next we&apos;ll plug in devices, assignments, and offboarding workflows.
  </p>

  <button
    className="rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600"
    onClick={() => router.push('/devices')}
  >
    View devices
  </button>
</section>
    </main>
  );
}
