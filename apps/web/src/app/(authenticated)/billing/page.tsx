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

  if (loading) return <div className="text-gray-500">Loading bills...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Billing</h1>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usage</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {bills.map((bill) => (
              <tr key={bill.id}>
                <td className="px-6 py-4 text-sm">
                  {new Date(bill.startDate).toLocaleDateString()} - {new Date(bill.endDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm">{bill.totalKwh.toFixed(1)} kWh</td>
                <td className="px-6 py-4 text-sm font-medium">{formatCurrency(bill.amountDue)}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    bill.status === 'PAID' ? 'bg-green-100 text-green-800' :
                    bill.status === 'ISSUED' ? 'bg-blue-100 text-blue-800' :
                    bill.status === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {bill.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
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
          <div className="p-8 text-center text-gray-500">No billing records</div>
        )}
      </div>
    </div>
  );
}
