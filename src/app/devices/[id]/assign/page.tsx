'use client';

import AssignForm from '@/components/AssignForm';
import { useParams } from 'next/navigation';

export default function AssignDevicePage() {
  const params = useParams();
  const deviceId = typeof params?.id === 'string' ? params.id : '';

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100">
      <AssignForm deviceId={deviceId} />
    </main>
  );
}
