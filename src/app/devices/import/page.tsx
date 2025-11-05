'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import { supabase } from '@/lib/supabaseClient';

type CsvDevice = {
  asset_tag: string;
  serial_number: string;
  model: string;
  platform: string;
  warranty_until?: string;
};

export default function ImportDevicesPage() {
  const router = useRouter();
  const [csvData, setCsvData] = useState<CsvDevice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const [successCount, setSuccessCount] = useState<number | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    Papa.parse<CsvDevice>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: Papa.ParseResult<CsvDevice>) => {
        const data = results.data;
        if (!data.length) {
          setError('No data found in CSV.');
          return;
        }
        setCsvData(data);
        setStep('preview');
      },
      error: (error: Error) => {
  console.error(error);
  setError('Failed to parse CSV file.');
},


    });
  };

  const handleImport = async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile?.org_id) throw new Error('No organization found.');

      const cleaned = csvData.map((row) => ({
        org_id: profile.org_id,
        asset_tag: row.asset_tag?.trim(),
        serial_number: row.serial_number?.trim(),
        model: row.model?.trim(),
        platform: row.platform?.trim().toLowerCase() || 'other',
        warranty_until: row.warranty_until || null,
        status: 'active',
        last_seen_at: new Date().toISOString(),
      }));

      const { error: insertError } = await supabase
        .from('devices')
        .insert(cleaned);

      if (insertError) throw insertError;

      setSuccessCount(cleaned.length);
      setTimeout(() => router.push('/devices'), 1500);
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? 'Failed to import devices');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setCsvData([]);
    setStep('upload');
    setError(null);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-slate-100 px-4">
      <div className="w-full max-w-2xl bg-slate-800/80 border border-slate-700 rounded-xl p-6 shadow-lg">
        <h1 className="text-2xl font-bold text-white mb-2 text-center">
          Import Devices from CSV
        </h1>
        <p className="text-slate-300 text-center mb-6">
          Upload a CSV with headers: <br />
          <code className="text-sm text-indigo-400">
            asset_tag, serial_number, model, platform, warranty_until
          </code>
        </p>

        {step === 'upload' && (
          <div className="flex flex-col items-center justify-center space-y-4">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-indigo-500 file:px-4 file:py-2 file:text-white hover:file:bg-indigo-600"
            />
            {error && (
              <p className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-md px-3 py-2">
                {error}
              </p>
            )}
            <button
              onClick={() => router.push('/devices')}
              className="text-sm text-slate-400 hover:text-slate-200 mt-4"
            >
              ← Back to Devices
            </button>
          </div>
        )}

        {step === 'preview' && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Preview Import</h2>
            <div className="overflow-x-auto rounded-md border border-slate-700 mb-4">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-800 border-b border-slate-700">
                  <tr>
                    <th className="px-3 py-2 text-left">Asset Tag</th>
                    <th className="px-3 py-2 text-left">Serial</th>
                    <th className="px-3 py-2 text-left">Model</th>
                    <th className="px-3 py-2 text-left">Platform</th>
                    <th className="px-3 py-2 text-left">Warranty</th>
                  </tr>
                </thead>
                <tbody>
                  {csvData.slice(0, 10).map((row, i) => (
                    <tr
                      key={i}
                      className="border-t border-slate-800 hover:bg-slate-800/50"
                    >
                      <td className="px-3 py-2">{row.asset_tag}</td>
                      <td className="px-3 py-2">{row.serial_number}</td>
                      <td className="px-3 py-2">{row.model}</td>
                      <td className="px-3 py-2">{row.platform}</td>
                      <td className="px-3 py-2">
                        {row.warranty_until || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {csvData.length > 10 && (
              <p className="text-xs text-slate-400 mb-4">
                Showing first 10 of {csvData.length} rows.
              </p>
            )}

            {error && (
              <p className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-md px-3 py-2 mb-2">
                {error}
              </p>
            )}
            {successCount && (
              <p className="text-sm text-green-400 bg-green-950/40 border border-green-900 rounded-md px-3 py-2 mb-2">
                Imported {successCount} devices!
              </p>
            )}

            <div className="flex justify-between mt-4">
              <button
                onClick={handleCancel}
                className="rounded-md border border-slate-600 px-3 py-2 text-sm hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={loading}
                className="rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 disabled:opacity-60"
              >
                {loading ? 'Importing...' : 'Confirm Import'}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
