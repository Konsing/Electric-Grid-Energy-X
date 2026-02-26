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
    return <div className="text-gray-500 dark:text-slate-400">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-slate-400">
          Welcome back, {user?.account?.firstName}!
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border dark:border-slate-700">
          <p className="text-sm text-gray-500 dark:text-slate-400">Current Month Usage</p>
          <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
            {usage?.currentMonth ? formatKwh(usage.currentMonth) : '--'}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border dark:border-slate-700">
          <p className="text-sm text-gray-500 dark:text-slate-400">Monthly Average</p>
          <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
            {usage?.averageMonthly ? formatKwh(usage.averageMonthly) : '--'}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border dark:border-slate-700">
          <p className="text-sm text-gray-500 dark:text-slate-400">Total (12 mo)</p>
          <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
            {usage?.totalKwh ? formatKwh(usage.totalKwh) : '--'}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border dark:border-slate-700">
          <p className="text-sm text-gray-500 dark:text-slate-400">Active Outages</p>
          <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">{outages.length}</p>
        </div>
      </div>

      {/* Usage Chart */}
      {analytics?.months && analytics.months.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border dark:border-slate-700">
          <h2 className="text-lg font-semibold mb-4 dark:text-white">Monthly Usage</h2>
          <div className="flex items-end gap-2">
            {(() => {
              const maxKwh = Math.max(...analytics.months.map((m: any) => m.kwh), 1);
              return analytics.months.map((month: any, i: number) => {
                const heightPx = maxKwh > 0 ? (month.kwh / maxKwh) * 180 : 0;
                const label = month.month
                  ? new Date(month.month).toLocaleString('default', { month: 'short' })
                  : `M${i + 1}`;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-gray-500 dark:text-slate-400">{formatKwh(month.kwh)}</span>
                    <div className="w-full flex items-end" style={{ height: '180px' }}>
                      <div
                        className="w-full bg-brand-500 rounded-t"
                        style={{ height: `${Math.max(heightPx, 4)}px` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 dark:text-slate-500">{label}</span>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Bills */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border dark:border-slate-700">
          <h2 className="text-lg font-semibold mb-4 dark:text-white">Recent Bills</h2>
          {bills.length === 0 ? (
            <p className="text-gray-500 dark:text-slate-400 text-sm">No bills yet</p>
          ) : (
            <div className="space-y-3">
              {bills.slice(0, 5).map((bill: any) => (
                <div key={bill.id} className="flex justify-between items-center py-2 border-b dark:border-slate-700 last:border-0">
                  <div>
                    <p className="text-sm font-medium dark:text-slate-200">{formatCurrency(bill.amountDue)}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      {new Date(bill.startDate).toLocaleDateString()} - {new Date(bill.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    bill.status === 'PAID' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' :
                    bill.status === 'ISSUED' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400' :
                    bill.status === 'OVERDUE' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400' :
                    'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-300'
                  }`}>
                    {bill.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Outages */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border dark:border-slate-700">
          <h2 className="text-lg font-semibold mb-4 dark:text-white">Active Outages</h2>
          {outages.length === 0 ? (
            <p className="text-green-600 dark:text-green-400 text-sm">No active outages in your area</p>
          ) : (
            <div className="space-y-3">
              {outages.map((outage: any) => (
                <div key={outage.id} className="py-2 border-b dark:border-slate-700 last:border-0">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium dark:text-slate-200">{outage.title}</p>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      outage.severity === 'CRITICAL' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400' :
                      outage.severity === 'HIGH' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400' :
                      outage.severity === 'MEDIUM' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400' :
                      'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-300'
                    }`}>
                      {outage.severity}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{outage.affectedArea}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
