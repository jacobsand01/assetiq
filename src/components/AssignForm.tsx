'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

type Device = {
  id: string;
  org_id: string;
  asset_tag: string | null;
  model: string | null;
  platform: string;
  status: string;
};

export default function AssignForm({
  deviceId,
  assetTag,
}: {
  deviceId?: string;
  assetTag?: string;
}) {
  const router = useRouter();

  const [device, setDevice] = useState<Device | null>(null);
  const [assigneeName, setAssigneeName] = useState('');
  const [assigneeEmail, setAssigneeEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadDevice() {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('devices')
        .select('id, org_id, asset_tag, model, platform, status')
        .limit(1);

      if (deviceId) query = query.eq('id', deviceId);
      else if (assetTag) query = query.eq('asset_tag', assetTag);
      else {
        setError('Missing device ID or asset tag.');
        setLoading(false);
        return;
      }

      const { data, error } = await query.maybeSingle();
      if (error || !data) {
        console.error(error);
        setError('Device not found.');
        setLoading(false);
        return;
      }

      setDevice(data);
      setLoading(false);
    }

    loadDevice();
  }, [deviceId, assetTag]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!device) return;

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const { error: insertError } = await supabase
        .from('device_assignments')
        .insert([
          {
            device_id: device.id,
            org_id: device.org_id,
            assignee_name: assigneeName,
            assignee_email: assigneeEmail,
            assigned_at: new Date().toISOString(),
            returned_at: null,
          },
        ]);

      if (insertError) {
        if (
          insertError.message?.includes('uniq_active_assignment_per_device') ||
          insertError.code === '23505'
        ) {
          throw new Error('This device already has an active assignment.');
        }
        throw insertError;
      }

      const { error: updateError } = await supabase
        .from('devices')
        .update({ status: 'assigned' })
        .eq('id', device.id);

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => router.push(`/devices/${device.id}`), 1200);
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? 'Failed to assign device');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading)
    return (
      <div className="text-center py-10 text-slate-300">Loading device…</div>
    );

  if (error || !device)
    return (
      <div className="text-center py-10 text-slate-300">
        {error ?? 'Device not found.'}
      </div>
    );

  return (
    <div className="w-full max-w-md bg-slate-800/80 border border-slate-700 rounded-xl p-6 shadow-lg">
      <h1 className="text-2xl font-bold text-white mb-2 text-center">
        Assign Device
      </h1>
      <p className="text-slate-300 text-center mb-6">
        {device.asset_tag ?? 'Untitled'} · {device.model ?? 'Unknown model'}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-slate-200 mb-1">
            Assignee Name
          </label>
          <input
            type="text"
            required
            value={assigneeName}
            onChange={(e) => setAssigneeName(e.target.value)}
            placeholder="Jane Smith"
            className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-200 mb-1">
            Assignee Email
          </label>
          <input
            type="email"
            required
            value={assigneeEmail}
            onChange={(e) => setAssigneeEmail(e.target.value)}
            placeholder="jane.smith@example.com"
            className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {error && (
          <p className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-md px-3 py-2">
            {error}
          </p>
        )}
        {success && (
          <p className="text-sm text-green-400 bg-green-950/40 border border-green-900 rounded-md px-3 py-2">
            Device assigned successfully!
          </p>
        )}

        <div className="flex justify-end mt-4">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 disabled:opacity-60"
          >
            {submitting ? 'Assigning...' : 'Assign Device'}
          </button>
        </div>
      </form>
    </div>
  );
}
