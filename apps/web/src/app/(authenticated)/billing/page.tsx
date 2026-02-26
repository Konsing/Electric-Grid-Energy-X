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

  if (loading) return <div className="text-gray-500 dark:text-slate-400">Loading bills...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Billing</h1>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border dark:border-slate-700 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
          <thead className="bg-gray-50 dark:bg-slate-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Period</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Usage</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Due Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
            {bills.map((bill) => (
              <tr key={bill.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                <td className="px-6 py-4 text-sm dark:text-slate-300">
                  {new Date(bill.startDate).toLocaleDateString()} - {new Date(bill.endDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm dark:text-slate-300">{bill.totalKwh.toFixed(1)} kWh</td>
                <td className="px-6 py-4 text-sm font-medium dark:text-slate-200">{formatCurrency(bill.amountDue)}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    bill.status === 'PAID' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' :
                    bill.status === 'ISSUED' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400' :
                    bill.status === 'OVERDUE' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400' :
                    'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-300'
                  }`}>
                    {bill.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-400">
                  {new Date(bill.dueDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  {bill.status === 'ISSUED' && (
                    <button
                      onClick={() => handlePay(bill.id)}
                      disabled={paying === bill.id}
                      className="px-3 py-1 text-sm bg-brand-600 text-white rounded hover:bg-brand-700 disabled:opacity-50"
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
          <div className="p-8 text-center text-gray-500 dark:text-slate-400">No billing records</div>
        )}
      </div>
    </div>
  );
}
