'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { QRCodeCanvas } from 'qrcode.react';

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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
  location: string | null;
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
  const [assignUrl, setAssignUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!deviceId) return;

    async function load() {
      setLoading(true);
      setError(null);

      const { data: deviceData, error: deviceError } = await supabase
        .from('devices')
        .select(
          'id, org_id, asset_tag, serial_number, model, platform, status, last_seen_at, warranty_until, created_at, location'
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

  // Build the QR /assign URL once we know origin + asset_tag
  useEffect(() => {
    if (device?.asset_tag && typeof window !== 'undefined') {
      const url = `${window.location.origin}/assign?asset_tag=${encodeURIComponent(
        device.asset_tag
      )}`;
      setAssignUrl(url);
    } else {
      setAssignUrl(null);
    }
  }, [device?.asset_tag]);

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
      <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center font-sans">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-base">Loading device…</CardTitle>
            <CardDescription className="text-sm text-slate-400">
              Fetching device details and assignment history.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  if (error || !device) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center font-sans">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-base">Device not found</CardTitle>
            <CardDescription className="text-sm text-slate-400">
              {error ?? 'We could not find this device.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push('/devices')}
            >
              ← Back to devices
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const isAssigned = device.status === 'assigned';

    return (
    <main className="min-h-screen bg-slate-950 text-slate-50 font-sans">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <button
              onClick={() => router.push('/devices')}
              className="inline-flex items-center text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
            >
              ← Back to devices
            </button>
            <h1 className="text-xl md:text-2xl font-semibold text-slate-50">
              {device.asset_tag ?? 'Device details'}
            </h1>
            <p className="text-xs text-slate-400">
              View details and assignment history for this device.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge className="capitalize">{device.status}</Badge>

            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push(`/devices/${device.id}/edit`)}
            >
              Edit details
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (device.asset_tag) {
                  router.push(
                    `/assign?asset_tag=${encodeURIComponent(
                      device.asset_tag
                    )}`
                  );
                } else {
                  router.push(`/devices/${device.id}/assign`);
                }
              }}
            >
              {isAssigned ? 'Reassign' : 'Assign'}
            </Button>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 md:py-8 space-y-6">
{/* Top grid: device info + status + QR */}
        <section className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)]">
          {/* Device info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Device details</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Core identifiers and hardware information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Asset tag</span>
                <span className="font-medium">{device.asset_tag ?? '—'}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Serial number</span>
                <span className="font-medium">
                  {device.serial_number ?? '—'}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Model</span>
                <span className="font-medium">{device.model ?? '—'}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Platform</span>
                <span className="font-medium">
                  {formatPlatform(device.platform)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Location</span>
                <span className="font-medium">
                  {device.location ?? '—'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Status + lifecycle + QR */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Status & lifecycle</CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  High-level health for this device.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between items-center gap-4">
                  <span className="text-slate-400">Status</span>
                  <Badge className="capitalize">{device.status}</Badge>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Last seen</span>
                  <span className="font-medium">
                    {formatDateTime(device.last_seen_at)}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Warranty until</span>
                  <span className="font-medium">
                    {formatDate(device.warranty_until)}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Created</span>
                  <span className="font-medium">
                    {formatDateTime(device.created_at)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">QR quick-assign</CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Scan to open the assignment flow for this asset.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center py-4">
                {assignUrl ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="rounded-2xl bg-white p-3">
                      <QRCodeCanvas value={assignUrl} size={120} />
                    </div>
                    <p className="text-[11px] text-slate-400 break-all text-center">
                      {assignUrl}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 text-center">
                    Add an asset tag to this device to generate a QR code.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Assignment history */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm md:text-base font-semibold text-slate-100">
                Assignment history
              </h2>
              <Badge variant="outline">
                {assignments.length} record
                {assignments.length === 1 ? '' : 's'}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-slate-300 hover:text-slate-50"
              onClick={() => {
                if (device.asset_tag) {
                  router.push(
                    `/assign?asset_tag=${encodeURIComponent(device.asset_tag)}`
                  );
                } else {
                  router.push(`/devices/${device.id}/assign`);
                }
              }}
            >
              {isAssigned ? 'Reassign device' : 'Assign device'}
            </Button>
          </div>

          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Assignee</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Assigned at</TableHead>
                      <TableHead>Returned at</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="py-8 text-center text-sm text-slate-400"
                        >
                          No assignment history yet for this device.
                        </TableCell>
                      </TableRow>
                    ) : (
                      assignments.map((a) => (
                        <TableRow
                          key={a.id}
                          className="border-slate-800 hover:bg-slate-800/80 transition-colors"
                        >
                          <TableCell>{a.assignee_name ?? '—'}</TableCell>
                          <TableCell>{a.assignee_email ?? '—'}</TableCell>
                          <TableCell>
                            {formatDateTime(a.assigned_at)}
                          </TableCell>
                          <TableCell>
                            {formatDateTime(a.returned_at)}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {a.notes ?? '—'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
