'use client';

import React, { useEffect, useState, FormEvent } from 'react';
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

import {
  Shield,
  CloudCog,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react';

type Profile = {
  id: string;
  org_id: string;
};

type IntegrationProvider = 'google_admin' | 'intune';

type IntegrationRow = {
  id: string;
  org_id: string;
  type: IntegrationProvider;
  config: Record<string, any>;
  last_sync_at: string | null;
  created_at: string | null;
};

type IntegrationsMap = Record<IntegrationProvider, IntegrationRow | null>;

type ModalState = {
  open: boolean;
  provider: IntegrationProvider | null;
  // form fields as simple key/value
  form: Record<string, string>;
};

export default function IntegrationsPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [integrations, setIntegrations] = useState<IntegrationsMap>({
    google_admin: null,
    intune: null,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modal, setModal] = useState<ModalState>({
    open: false,
    provider: null,
    form: {},
  });

  const [busyProvider, setBusyProvider] = useState<IntegrationProvider | null>(
    null
  );
  const [syncing, setSyncing] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);
  const [bannerVariant, setBannerVariant] = useState<'success' | 'error'>(
    'success'
  );

  // Load profile + integrations
  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/login');
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, org_id')
        .eq('id', user.id)
        .maybeSingle<Profile>();

      if (profileError || !profileData) {
        console.error('Profile load error:', profileError);
        router.replace('/onboarding/new-org');
        return;
      }

      setProfile(profileData);

      // Load integrations for this org
      const { data: rows, error: rowsError } = await supabase
        .from('integrations')
        .select('id, org_id, type, config, last_sync_at, created_at')
        .eq('org_id', profileData.org_id);

      if (rowsError) {
        console.error('Integrations load error:', rowsError);
        setError('Failed to load integrations.');
        setIntegrations({ google_admin: null, intune: null });
        setLoading(false);
        return;
      }

      const map: IntegrationsMap = {
        google_admin: null,
        intune: null,
      };

      (rows ?? []).forEach((row) => {
        if (row.type === 'google_admin' || row.type === 'intune') {
          map[row.type as IntegrationProvider] = row as IntegrationRow;
        }
      });

      setIntegrations(map);
      setLoading(false);
    }

    load();
  }, [router]);

  function isConnected(provider: IntegrationProvider): boolean {
    return !!integrations[provider];
  }

  function openModal(provider: IntegrationProvider) {
    const existing = integrations[provider];
    let initialForm: Record<string, string> = {};

    if (provider === 'google_admin') {
      const cfg = (existing?.config ?? {}) as Record<string, any>;
      initialForm = {
        service_account_json: cfg.service_account_json ?? '',
        org_unit: cfg.org_unit ?? '',
      };
    } else if (provider === 'intune') {
      const cfg = (existing?.config ?? {}) as Record<string, any>;
      initialForm = {
        tenant_id: cfg.tenant_id ?? '',
        client_id: cfg.client_id ?? '',
        client_secret: cfg.client_secret ?? '',
      };
    }

    setModal({
      open: true,
      provider,
      form: initialForm,
    });
  }

  function closeModal() {
    setModal({
      open: false,
      provider: null,
      form: {},
    });
  }

  async function handleModalSubmit(e: FormEvent) {
    e.preventDefault();
    if (!profile || !modal.provider) return;

    const provider = modal.provider;
    setBusyProvider(provider);
    setBannerMessage(null);

    try {
      const existing = integrations[provider];

      if (existing) {
        // UPDATE
        const { data, error: updateError } = await supabase
          .from('integrations')
          .update({
            config: modal.form,
          })
          .eq('id', existing.id)
          .select(
            'id, org_id, type, config, last_sync_at, created_at'
          )
          .maybeSingle<IntegrationRow>();

        if (updateError || !data) throw updateError ?? new Error('Update failed');

        setIntegrations((prev) => ({
          ...prev,
          [provider]: data,
        }));

        setBannerVariant('success');
        setBannerMessage(
          provider === 'google_admin'
            ? 'Updated Google Admin configuration.'
            : 'Updated Intune configuration.'
        );
      } else {
        // INSERT
        const { data, error: insertError } = await supabase
          .from('integrations')
          .insert([
            {
              org_id: profile.org_id,
              type: provider,
              config: modal.form,
            },
          ])
          .select(
            'id, org_id, type, config, last_sync_at, created_at'
          )
          .maybeSingle<IntegrationRow>();

        if (insertError || !data) {
          throw insertError ?? new Error('Insert failed');
        }

        setIntegrations((prev) => ({
          ...prev,
          [provider]: data,
        }));

        setBannerVariant('success');
        setBannerMessage(
          provider === 'google_admin'
            ? 'Connected to Google Admin (sandbox config saved).'
            : 'Connected to Intune (sandbox config saved).'
        );
      }

      closeModal();
    } catch (err: any) {
      console.error('Save integration error:', err);
      setBannerVariant('error');
      setBannerMessage(
        err?.message ?? 'Failed to save integration configuration.'
      );
    } finally {
      setBusyProvider(null);
    }
  }

  async function handleDisconnect(provider: IntegrationProvider) {
    const existing = integrations[provider];
    if (!existing) return;

    setBusyProvider(provider);
    setBannerMessage(null);

    try {
      const { error: deleteError } = await supabase
        .from('integrations')
        .delete()
        .eq('id', existing.id);

      if (deleteError) throw deleteError;

      setIntegrations((prev) => ({
        ...prev,
        [provider]: null,
      }));

      setBannerVariant('success');
      setBannerMessage(
        provider === 'google_admin'
          ? 'Google Admin disconnected.'
          : 'Intune disconnected.'
      );
    } catch (err: any) {
      console.error('Disconnect error:', err);
      setBannerVariant('error');
      setBannerMessage(
        err?.message ?? 'Failed to disconnect integration.'
      );
    } finally {
      setBusyProvider(null);
    }
  }

  async function handleFakeSync() {
    if (!profile) return;
    setSyncing(true);
    setBannerMessage(null);

    try {
      const res = await fetch('/api/fake-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId: profile.org_id }),
      });

      const text = await res.text();
      let json: any = null;
      try {
        json = JSON.parse(text);
      } catch {
        // ignore parse error, text might not be JSON
      }

      if (!res.ok) {
        throw new Error(json?.error ?? text ?? 'Fake sync failed.');
      }

      const devicesInserted = json?.devicesInserted ?? 0;
      const assignmentsInserted = json?.assignmentsInserted ?? 0;

      setBannerVariant('success');
      setBannerMessage(
        `Simulated ${devicesInserted} devices and ${assignmentsInserted} assignments from Google Admin.`
      );
    } catch (err: any) {
      console.error('Fake sync error:', err);
      setBannerVariant('error');
      setBannerMessage(err?.message ?? 'Fake sync failed.');
    } finally {
      setSyncing(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center font-sans">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-6 py-4 shadow-sm">
          <p className="text-sm text-slate-300">Loading integrations…</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center font-sans">
        <Card className="w-full max-w-md rounded-2xl border-red-900/60 bg-red-950/40 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-red-100">
              Something went wrong
            </CardTitle>
            <CardDescription className="text-sm text-red-200/80">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full border-red-500/40 text-red-100 hover:bg-red-900/40"
              onClick={() => router.refresh()}
            >
              Try again
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const google = integrations.google_admin;
  const intune = integrations.intune;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 font-sans">
      {/* Top bar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <button
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              ← Back to dashboard
            </button>
            <h1 className="text-xl md:text-2xl font-semibold text-slate-50">
              Integrations
            </h1>
            <p className="text-xs text-slate-400">
              Connect Google Admin and Intune so AssetIQ can stay in sync.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="border-slate-700 bg-slate-900/60 text-slate-100 hover:bg-slate-800 hover:border-slate-600 rounded-xl text-xs md:text-sm transition-colors inline-flex items-center gap-1"
              onClick={handleFakeSync}
              disabled={syncing}
            >
              <RefreshCw className="h-3 w-3" />
              {syncing ? 'Simulating…' : 'Simulate sync'}
            </Button>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 md:py-8 space-y-6 animate-in fade-in duration-200">
        {/* Banner */}
        {bannerMessage && (
          <div
            className={`rounded-2xl border px-4 py-3 text-xs ${
              bannerVariant === 'success'
                ? 'border-emerald-700 bg-emerald-950/40 text-emerald-100'
                : 'border-red-800 bg-red-950/40 text-red-100'
            }`}
          >
            {bannerMessage}
          </div>
        )}

        {/* Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Google Admin */}
          <Card className="rounded-2xl border-slate-800 bg-slate-900/80 shadow-sm hover:shadow-md hover:border-slate-700 transition-all">
            <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-slate-800/70 p-2">
                  <Shield className="h-5 w-5 text-[#3578E5]" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold leading-tight">
                    Google Admin
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    Sync Chromebooks and OU membership from Google Workspace.
                  </CardDescription>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge
                  variant="outline"
                  className={`text-[10px] px-2 py-0.5 ${
                    isConnected('google_admin')
                      ? 'border-emerald-500/60 text-emerald-300 bg-emerald-900/20'
                      : 'border-slate-700 text-slate-300 bg-slate-900'
                  }`}
                >
                  {isConnected('google_admin') ? (
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      <XCircle className="h-3 w-3" />
                      Not connected
                    </span>
                  )}
                </Badge>
                <span className="text-[10px] text-slate-500">
                  {google?.last_sync_at
                    ? `Last sync: ${new Date(
                        google.last_sync_at
                      ).toLocaleString()}`
                    : 'No syncs yet'}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-400">
              <p>
                In the real world this would use a service account and domain-
                wide delegation to read devices and OU membership from Google
                Admin. For now, we&apos;re just saving config in a sandbox.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <Button
                  size="sm"
                  className="bg-[#3578E5] hover:bg-[#2861bc] text-xs rounded-xl"
                  onClick={() => openModal('google_admin')}
                  disabled={busyProvider === 'google_admin'}
                >
                  {isConnected('google_admin') ? 'Edit config' : 'Connect'}
                </Button>
                {isConnected('google_admin') && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs rounded-xl border-slate-700 hover:bg-slate-800"
                    onClick={() => handleDisconnect('google_admin')}
                    disabled={busyProvider === 'google_admin'}
                  >
                    Disconnect
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Intune */}
          <Card className="rounded-2xl border-slate-800 bg-slate-900/80 shadow-sm hover:shadow-md hover:border-slate-700 transition-all">
            <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-slate-800/70 p-2">
                  <CloudCog className="h-5 w-5 text-[#3578E5]" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold leading-tight">
                    Microsoft Intune
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    Pull Windows / macOS fleet from Intune device inventory.
                  </CardDescription>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge
                  variant="outline"
                  className={`text-[10px] px-2 py-0.5 ${
                    isConnected('intune')
                      ? 'border-emerald-500/60 text-emerald-300 bg-emerald-900/20'
                      : 'border-slate-700 text-slate-300 bg-slate-900'
                  }`}
                >
                  {isConnected('intune') ? (
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      <XCircle className="h-3 w-3" />
                      Not connected
                    </span>
                  )}
                </Badge>
                <span className="text-[10px] text-slate-500">
                  {intune?.last_sync_at
                    ? `Last sync: ${new Date(
                        intune.last_sync_at
                      ).toLocaleString()}`
                    : 'No syncs yet'}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-400">
              <p>
                In production this would use an Azure app registration and
                Graph API to read devices. For now, we just persist the config
                so you can see how the flow will feel.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <Button
                  size="sm"
                  className="bg-[#3578E5] hover:bg-[#2861bc] text-xs rounded-xl"
                  onClick={() => openModal('intune')}
                  disabled={busyProvider === 'intune'}
                >
                  {isConnected('intune') ? 'Edit config' : 'Connect'}
                </Button>
                {isConnected('intune') && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs rounded-xl border-slate-700 hover:bg-slate-800"
                    onClick={() => handleDisconnect('intune')}
                    disabled={busyProvider === 'intune'}
                  >
                    Disconnect
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Simple modal implementation (no shadcn dependency) */}
      {modal.open && modal.provider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 shadow-lg p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-slate-50">
                  {modal.provider === 'google_admin'
                    ? 'Google Admin configuration'
                    : 'Intune configuration'}
                </h2>
                <p className="text-[11px] text-slate-400">
                  Paste in sandbox credentials or placeholders. This won&apos;t
                  call any real APIs yet.
                </p>
              </div>
              <button
                className="text-slate-400 hover:text-slate-100 text-xs"
                onClick={closeModal}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="space-y-3">
              {modal.provider === 'google_admin' && (
                <>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-300">
                      Service account JSON
                    </label>
                    <textarea
                      rows={4}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3578E5] resize-y"
                      value={modal.form.service_account_json ?? ''}
                      onChange={(e) =>
                        setModal((prev) => ({
                          ...prev,
                          form: {
                            ...prev.form,
                            service_account_json: e.target.value,
                          },
                        }))
                      }
                      placeholder="{ ... }"
                    />
                    <p className="text-[11px] text-slate-500">
                      In production, this would be the full service account JSON
                      with domain-wide delegation.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-300">
                      Org Unit / scope (optional)
                    </label>
                    <input
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3578E5]"
                      value={modal.form.org_unit ?? ''}
                      onChange={(e) =>
                        setModal((prev) => ({
                          ...prev,
                          form: { ...prev.form, org_unit: e.target.value },
                        }))
                      }
                      placeholder="/Staff"
                    />
                  </div>
                </>
              )}

              {modal.provider === 'intune' && (
                <>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-300">
                      Tenant ID
                    </label>
                    <input
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3578E5]"
                      value={modal.form.tenant_id ?? ''}
                      onChange={(e) =>
                        setModal((prev) => ({
                          ...prev,
                          form: { ...prev.form, tenant_id: e.target.value },
                        }))
                      }
                      placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-300">
                      Client ID
                    </label>
                    <input
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3578E5]"
                      value={modal.form.client_id ?? ''}
                      onChange={(e) =>
                        setModal((prev) => ({
                          ...prev,
                          form: { ...prev.form, client_id: e.target.value },
                        }))
                      }
                      placeholder="app registration client id"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-300">
                      Client secret
                    </label>
                    <input
                      type="password"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3578E5]"
                      value={modal.form.client_secret ?? ''}
                      onChange={(e) =>
                        setModal((prev) => ({
                          ...prev,
                          form: {
                            ...prev.form,
                            client_secret: e.target.value,
                          },
                        }))
                      }
                      placeholder="••••••••••••••••••••"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={closeModal}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-[#3578E5] hover:bg-[#2861bc] rounded-xl"
                  disabled={busyProvider === modal.provider}
                >
                  Save
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
