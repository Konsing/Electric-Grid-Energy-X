'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getUsageSummary, getUsageAnalytics, getAccountBilling, getActiveOutages } from '@/lib/api';
import { formatCurrency, formatKwh } from '@egx/shared';

export default function DashboardPage() {
  const { user, token } = useAuth();
  const [usage, setUsage] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [bills, setBills] = useState<any[]>([]);
  const [outages, setOutages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const accountId = user?.account?.id;

  useEffect(() => {
    if (!accountId || !token) return;

    Promise.all([
      getUsageSummary(accountId, token).catch(() => null),
      getUsageAnalytics(accountId, token).catch(() => null),
      getAccountBilling(accountId, token).catch(() => null),
      getActiveOutages(token).catch(() => null),
    ]).then(([usageRes, analyticsRes, billingRes, outagesRes]) => {
      setUsage(usageRes?.data);
      setAnalytics(analyticsRes?.data);
      setBills(billingRes?.data || []);
      setOutages(outagesRes?.data || []);
      setLoading(false);
    });
  }, [accountId, token]);

  if (loading) {
    return <div className="text-gray-500">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">
          Welcome back, {user?.account?.firstName}!
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Current Month Usage</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">
            {usage?.currentMonth ? formatKwh(usage.currentMonth) : '--'}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Monthly Average</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">
            {usage?.averageMonthly ? formatKwh(usage.averageMonthly) : '--'}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Total (12 mo)</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">
            {usage?.totalKwh ? formatKwh(usage.totalKwh) : '--'}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Active Outages</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{outages.length}</p>
        </div>
      </div>

      {/* Usage Chart */}
      {analytics?.months && analytics.months.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-lg font-semibold mb-4">Monthly Usage</h2>
          <div className="flex items-end gap-2 h-48">
            {analytics.months.map((month: any, i: number) => {
              const maxKwh = Math.max(...analytics.months.map((m: any) => m.kwh));
              const height = maxKwh > 0 ? (month.kwh / maxKwh) * 100 : 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-gray-500">{formatKwh(month.kwh)}</span>
                  <div
                    className="w-full bg-brand-500 rounded-t"
                    style={{ height: `${height}%`, minHeight: '4px' }}
                  />
                  <span className="text-xs text-gray-400">{month.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Bills */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-lg font-semibold mb-4">Recent Bills</h2>
          {bills.length === 0 ? (
            <p className="text-gray-500 text-sm">No bills yet</p>
          ) : (
            <div className="space-y-3">
              {bills.slice(0, 5).map((bill: any) => (
                <div key={bill.id} className="flex justify-between items-center py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{formatCurrency(bill.amountDue)}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(bill.startDate).toLocaleDateString()} - {new Date(bill.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    bill.status === 'PAID' ? 'bg-green-100 text-green-800' :
                    bill.status === 'ISSUED' ? 'bg-blue-100 text-blue-800' :
                    bill.status === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {bill.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Outages */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-lg font-semibold mb-4">Active Outages</h2>
          {outages.length === 0 ? (
            <p className="text-green-600 text-sm">No active outages in your area</p>
          ) : (
            <div className="space-y-3">
              {outages.map((outage: any) => (
                <div key={outage.id} className="py-2 border-b last:border-0">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium">{outage.title}</p>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      outage.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                      outage.severity === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                      outage.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {outage.severity}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{outage.affectedArea}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
