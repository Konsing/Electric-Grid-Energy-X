'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getAccountBilling, payBill } from '@/lib/api';
import { formatCurrency } from '@egx/shared';
import { v4 as uuid } from 'uuid';

export default function BillingPage() {
  const { user, token } = useAuth();
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);

  const accountId = user?.account?.id;

  const loadBills = async () => {
    if (!accountId || !token) return;
    try {
      const res = await getAccountBilling(accountId, token);
      setBills(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBills();
  }, [accountId, token]);

  const handlePay = async (billId: string) => {
    if (!token) return;
    setPaying(billId);
    try {
      await payBill(billId, 'CREDIT_CARD', uuid(), token);
      await loadBills();
    } catch (err: any) {
      alert(err.message || 'Payment failed');
    } finally {
      setPaying(null);
    }
  };

  if (loading) return <div className="text-zinc-500">Loading bills...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-50">Billing</h1>

      <div className="rounded-lg border border-zinc-800 overflow-hidden">
        <table className="min-w-full divide-y divide-zinc-800">
          <thead className="bg-zinc-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide">Period</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide">Usage</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide">Due Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 bg-zinc-900">
            {bills.map((bill) => (
              <tr key={bill.id} className="hover:bg-zinc-800/50">
                <td className="px-6 py-4 text-sm text-zinc-300">
                  {new Date(bill.startDate).toLocaleDateString()} - {new Date(bill.endDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm text-zinc-300">{bill.totalKwh.toFixed(1)} kWh</td>
                <td className="px-6 py-4 text-sm font-medium text-zinc-200">{formatCurrency(bill.amountDue)}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    bill.status === 'PAID' ? 'bg-green-950 text-green-400' :
                    bill.status === 'ISSUED' ? 'bg-blue-950 text-blue-400' :
                    bill.status === 'OVERDUE' ? 'bg-red-950 text-red-400' :
                    'bg-zinc-800 text-zinc-300'
                  }`}>
                    {bill.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-zinc-400">
                  {new Date(bill.dueDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  {bill.status === 'ISSUED' && (
                    <button
                      onClick={() => handlePay(bill.id)}
                      disabled={paying === bill.id}
                      className="px-3 py-1 text-sm bg-zinc-50 text-zinc-950 rounded-md hover:bg-zinc-200 disabled:opacity-50 font-semibold"
                    >
                      {paying === bill.id ? 'Processing...' : 'Pay'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {bills.length === 0 && (
          <div className="p-8 text-center text-zinc-500 bg-zinc-900">No billing records</div>
        )}
      </div>
    </div>
  );
}
