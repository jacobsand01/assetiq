'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { QRCodeCanvas } from 'qrcode.react';

type Device = {
  id: string;
  org_id: string;
  asset_tag: string | null;
  serial_number: string | null;
  model: string | null;
  platform: string;
  status: string;
  last_seen_at: string | null;
  warranty_until: string | null;
  created_at: string | null;
};

type Assignment = {
  id: string;
  device_id: string;
  assignee_name: string | null;
  assignee_email: string | null;
  assigned_at: string | null;
  returned_at: string | null;
  notes: string | null;
};

export default function DeviceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const deviceId = typeof params?.id === 'string' ? params.id : '';

  const [device, setDevice] = useState<Device | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [baseUrl, setBaseUrl] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
  }, []);

  useEffect(() => {
    if (!deviceId) return;

    async function load() {
      setLoading(true);
      setError(null);

      const { data: deviceData, error: deviceError } = await supabase
        .from('devices')
        .select(
          'id, org_id, asset_tag, serial_number, model, platform, status, last_seen_at, warranty_until, created_at'
        )
        .eq('id', deviceId)
        .maybeSingle();

      if (deviceError || !deviceData) {
        console.error('Device load error:', deviceError);
        setError('Device not found.');
        setLoading(false);
        return;
      }

      setDevice(deviceData as Device);

      const { data: assignmentData, error: assignmentError } = await supabase
        .from('device_assignments')
        .select(
          'id, device_id, assignee_name, assignee_email, assigned_at, returned_at, notes'
        )
        .eq('device_id', deviceId)
        .order('assigned_at', { ascending: false });

      if (assignmentError) {
        console.error('Assignment history error:', assignmentError);
        setAssignments([]);
      } else {
        setAssignments((assignmentData ?? []) as Assignment[]);
      }

      setLoading(false);
    }

    load();
  }, [deviceId]);

  function formatDateTime(value: string | null): string {
    if (!value) return '—';
    const d = new Date(value);
    return isNaN(d.getTime()) ? '—' : d.toLocaleString();
  }

  function formatDate(value: string | null): string {
    if (!value) return '—';
    const d = new Date(value);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
  }

  function formatPlatform(p: string): string {
    switch (p) {
      case 'chromebook':
        return 'Chromebook';
      case 'windows':
        return 'Windows';
      case 'mac':
        return 'Mac';
      case 'ipad':
        return 'iPad';
      default:
        return 'Other';
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100">
        <p>Loading device...</p>
      </main>
    );
  }

  if (error || !device) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-slate-100">
        <p className="mb-4">{error ?? 'Device not found.'}</p>
        <button
          onClick={() => router.push('/devices')}
          className="rounded-md border border-slate-600 px-4 py-2 text-sm hover:bg-slate-800"
        >
          ← Back to Devices
        </button>
      </main>
    );
  }

  const qrValue = device.asset_tag
    ? `${baseUrl}/assign?asset_tag=${device.asset_tag}`
    : '';

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100">
      <header className="border-b border-slate-700 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">
            Device {device.asset_tag ?? '(no asset tag)'}
          </h1>
          <p className="text-sm text-slate-400">
            {device.model ?? 'Unknown model'} · {formatPlatform(device.platform)}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => router.push(`/devices/${device.id}/assign`)}
            className="rounded-md bg-indigo-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-600"
          >
            Assign
          </button>

          <button
            onClick={() => router.push('/devices')}
            className="rounded-md border border-slate-600 px-3 py-1.5 text-sm hover:bg-slate-800"
          >
            ← Back
          </button>
        </div>
      </header>

      <section className="p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 bg-slate-800/70 border border-slate-700 rounded-xl p-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-300 mb-2">
              Device Info
            </h2>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-400">Asset Tag</dt>
                <dd className="font-medium">{device.asset_tag ?? '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Serial Number</dt>
                <dd className="font-medium">{device.serial_number ?? '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Model</dt>
                <dd className="font-medium">{device.model ?? '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Type</dt>
                <dd className="font-medium">
                  {formatPlatform(device.platform)}
                </dd>
              </div>
            </dl>

            {qrValue && (
              <div className="flex flex-col items-center mt-6">
                <QRCodeCanvas
                  value={qrValue}
                  size={140}
                  bgColor="#0f172a"
                  fgColor="#ffffff"
                />
                <p className="text-xs text-slate-400 mt-2">
                  Scan to assign this device
                </p>
              </div>
            )}
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-300 mb-2">
              Status &amp; Lifecycle
            </h2>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-400">Status</dt>
                <dd>
                  <span className="inline-flex items-center rounded-full bg-slate-800 px-2 py-0.5 text-xs capitalize">
                    {device.status}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Last Seen</dt>
                <dd className="font-medium">
                  {formatDateTime(device.last_seen_at)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Warranty Until</dt>
                <dd className="font-medium">
                  {formatDate(device.warranty_until)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Created</dt>
                <dd className="font-medium">
                  {formatDateTime(device.created_at)}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Assignment history */}
        <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-300">
              Assignment History
            </h2>
            {assignments.length > 0 && (
              <span className="text-xs text-slate-400">
                {assignments.length} record
                {assignments.length === 1 ? '' : 's'}
              </span>
            )}
          </div>

          {assignments.length === 0 ? (
            <p className="text-sm text-slate-400">
              No assignment history yet for this device.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border border-slate-700">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-900 border-b border-slate-700">
                  <tr>
                    <th className="px-3 py-2 text-left">Assignee</th>
                    <th className="px-3 py-2 text-left">Email</th>
                    <th className="px-3 py-2 text-left">Assigned At</th>
                    <th className="px-3 py-2 text-left">Returned At</th>
                    <th className="px-3 py-2 text-left">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((a) => (
                    <tr
                      key={a.id}
                      className="border-t border-slate-800 hover:bg-slate-900/70"
                    >
                      <td className="px-3 py-2">{a.assignee_name ?? '—'}</td>
                      <td className="px-3 py-2">{a.assignee_email ?? '—'}</td>
                      <td className="px-3 py-2">
                        {formatDateTime(a.assigned_at)}
                      </td>
                      <td className="px-3 py-2">
                        {formatDateTime(a.returned_at)}
                      </td>
                      <td className="px-3 py-2 max-w-xs truncate">
                        {a.notes ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
