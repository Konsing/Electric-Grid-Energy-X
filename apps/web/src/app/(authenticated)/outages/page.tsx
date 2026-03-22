'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getOutages } from '@/lib/api';

export default function OutagesPage() {
  const { token } = useAuth();
  const [outages, setOutages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    getOutages(token)
      .then((res) => setOutages(res.data || []))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="text-zinc-500">Loading outages...</div>;

  const active = outages.filter((o) => o.status !== 'RESOLVED');
  const resolved = outages.filter((o) => o.status === 'RESOLVED');

  const renderCard = (outage: any) => (
    <div key={outage.id} className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-zinc-50">{outage.title}</h3>
          <p className="text-sm text-zinc-400 mt-1">{outage.affectedArea}</p>
        </div>
        <div className="flex gap-2">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            outage.severity === 'CRITICAL' ? 'bg-red-950 text-red-400' :
            outage.severity === 'HIGH' ? 'bg-orange-950 text-orange-400' :
            outage.severity === 'MEDIUM' ? 'bg-yellow-950 text-yellow-400' :
            'bg-zinc-800 text-zinc-300'
          }`}>
            {outage.severity}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            outage.status === 'RESOLVED' ? 'bg-green-950 text-green-400' :
            outage.status === 'IN_PROGRESS' ? 'bg-blue-950 text-blue-400' :
            'bg-yellow-950 text-yellow-400'
          }`}>
            {outage.status}
          </span>
        </div>
      </div>
      <p className="text-sm text-zinc-400 mt-3">{outage.description}</p>
      <div className="mt-3 flex gap-4 text-xs text-zinc-500">
        <span>Started: {new Date(outage.startedAt).toLocaleString()}</span>
        {outage.estimatedResolution && (
          <span>Est. Resolution: {new Date(outage.estimatedResolution).toLocaleString()}</span>
        )}
        {outage.resolvedAt && (
          <span>Resolved: {new Date(outage.resolvedAt).toLocaleString()}</span>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-50">Service Outages</h1>

      <div className="space-y-4">
        {active.map(renderCard)}
        {active.length === 0 && (
          <div className="text-center py-8 text-zinc-500">No active outages</div>
        )}
      </div>

      {resolved.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-zinc-400 pt-4 border-t border-zinc-800">History</h2>
          {resolved.map(renderCard)}
        </div>
      )}
    </div>
  );
}
