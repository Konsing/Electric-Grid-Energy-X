'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getUsageSummary, getUsageAnalytics, getAccountBilling, getActiveOutages } from '@/lib/api';
import { formatCurrency, formatKwh } from '@egx/shared';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

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
    return <div className="text-zinc-500">Loading dashboard...</div>;
  }

  // Prepare chart data
  const usageData = analytics?.months?.map((m: any) => ({
    month: m.month ? new Date(m.month).toLocaleString('default', { month: 'short' }) : '',
    kwh: Math.round(m.kwh),
    cost: m.cost,
  })) || [];

  const billingData = [...bills]
    .reverse()
    .slice(-8)
    .map((b: any) => ({
      period: new Date(b.startDate).toLocaleString('default', { month: 'short' }),
      amount: b.amountDue,
      status: b.status,
    }));

  const trend = usage?.trend;
  const trendLabel = trend != null
    ? `${trend > 0 ? '+' : ''}${trend.toFixed(1)}%`
    : null;
  const trendColor = trend != null
    ? (trend > 0 ? 'text-red-400' : 'text-green-400')
    : '';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-50">Dashboard</h1>
        <p className="text-zinc-400">
          Welcome back, {user?.account?.firstName}!
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Current Month</p>
          <p className="mt-1 text-3xl font-extrabold tracking-tight text-zinc-50">
            {usage?.currentMonth ? (
              <>{usage.currentMonth.toFixed(0)} <span className="text-sm text-zinc-500 font-normal">kWh</span></>
            ) : '--'}
          </p>
          {trendLabel && (
            <p className={`text-xs mt-1 ${trendColor}`}>{trendLabel} vs last month</p>
          )}
        </div>
        <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Monthly Average</p>
          <p className="mt-1 text-3xl font-extrabold tracking-tight text-zinc-50">
            {usage?.averageMonthly ? (
              <>{usage.averageMonthly.toFixed(0)} <span className="text-sm text-zinc-500 font-normal">kWh</span></>
            ) : '--'}
          </p>
        </div>
        <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Total (12 mo)</p>
          <p className="mt-1 text-3xl font-extrabold tracking-tight text-zinc-50">
            {usage?.totalKwh ? (
              <>{usage.totalKwh.toFixed(0)} <span className="text-sm text-zinc-500 font-normal">kWh</span></>
            ) : '--'}
          </p>
        </div>
        <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Active Outages</p>
          <p className="mt-1 text-3xl font-extrabold tracking-tight text-zinc-50">{outages.length}</p>
        </div>
      </div>

      {/* Usage Area Chart */}
      {usageData.length > 0 && (
        <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
          <h2 className="font-bold tracking-tight text-zinc-50 mb-6">Energy Usage</h2>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={usageData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="usageGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="month" tick={{ fill: '#71717a', fontSize: 12 }} axisLine={{ stroke: '#27272a' }} tickLine={false} />
              <YAxis tick={{ fill: '#71717a', fontSize: 12 }} axisLine={{ stroke: '#27272a' }} tickLine={false} tickFormatter={(v) => `${v}`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
                labelStyle={{ color: '#fafafa' }}
                itemStyle={{ color: '#3b82f6' }}
                formatter={(value: number) => [`${value} kWh`, 'Usage']}
              />
              <Area type="monotone" dataKey="kwh" stroke="#3b82f6" strokeWidth={2} fill="url(#usageGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Cost Bar Chart */}
      {billingData.length > 0 && (
        <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
          <h2 className="font-bold tracking-tight text-zinc-50 mb-6">Monthly Cost</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={billingData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="period" tick={{ fill: '#71717a', fontSize: 12 }} axisLine={{ stroke: '#27272a' }} tickLine={false} />
              <YAxis tick={{ fill: '#71717a', fontSize: 12 }} axisLine={{ stroke: '#27272a' }} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
                labelStyle={{ color: '#fafafa' }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Cost']}
              />
              <Bar dataKey="amount" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Bills */}
        <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
          <h2 className="font-bold tracking-tight text-zinc-50 mb-4">Recent Bills</h2>
          {bills.length === 0 ? (
            <p className="text-zinc-500 text-sm">No bills yet</p>
          ) : (
            <div className="space-y-3">
              {bills.slice(0, 5).map((bill: any) => (
                <div key={bill.id} className="flex justify-between items-center py-2 border-b border-zinc-800 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-zinc-200">{formatCurrency(bill.amountDue)}</p>
                    <p className="text-xs text-zinc-500">
                      {new Date(bill.startDate).toLocaleDateString()} - {new Date(bill.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    bill.status === 'PAID' ? 'bg-green-950 text-green-400' :
                    bill.status === 'ISSUED' ? 'bg-blue-950 text-blue-400' :
                    bill.status === 'OVERDUE' ? 'bg-red-950 text-red-400' :
                    'bg-zinc-800 text-zinc-300'
                  }`}>
                    {bill.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Outages */}
        <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
          <h2 className="font-bold tracking-tight text-zinc-50 mb-4">Active Outages</h2>
          {outages.length === 0 ? (
            <p className="text-green-400 text-sm">No active outages in your area</p>
          ) : (
            <div className="space-y-3">
              {outages.map((outage: any) => (
                <div key={outage.id} className="py-2 border-b border-zinc-800 last:border-0">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium text-zinc-200">{outage.title}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      outage.severity === 'CRITICAL' ? 'bg-red-950 text-red-400' :
                      outage.severity === 'HIGH' ? 'bg-orange-950 text-orange-400' :
                      outage.severity === 'MEDIUM' ? 'bg-yellow-950 text-yellow-400' :
                      'bg-zinc-800 text-zinc-300'
                    }`}>
                      {outage.severity}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">{outage.affectedArea}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
