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

  if (loading) return <div className="text-gray-500">Loading outages...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Service Outages</h1>

      <div className="space-y-4">
        {outages.map((outage) => (
          <div key={outage.id} className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">{outage.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{outage.affectedArea}</p>
              </div>
              <div className="flex gap-2">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  outage.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                  outage.severity === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                  outage.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {outage.severity}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  outage.status === 'RESOLVED' ? 'bg-green-100 text-green-800' :
                  outage.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {outage.status}
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-3">{outage.description}</p>
            <div className="mt-3 flex gap-4 text-xs text-gray-400">
              <span>Started: {new Date(outage.startedAt).toLocaleString()}</span>
              {outage.estimatedResolution && (
                <span>Est. Resolution: {new Date(outage.estimatedResolution).toLocaleString()}</span>
              )}
              {outage.resolvedAt && (
                <span>Resolved: {new Date(outage.resolvedAt).toLocaleString()}</span>
              )}
            </div>
          </div>
        ))}
        {outages.length === 0 && (
          <div className="text-center py-8 text-gray-500">No outages reported</div>
        )}
      </div>
    </div>
  );
}
