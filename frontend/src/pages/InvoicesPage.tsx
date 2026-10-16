import { useEffect, useState } from 'react';

interface Invoice {
  _id: string;
  amount: number;
  currency: string;
  transactionId: string;
  status: string;
  breakdown: { energyCost: number; parkingFee: number; bookingFee: number };
  paidAt: string;
}

import { api } from '../api/client';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    api.get('/payments/mine').then((res) => setInvoices(res.data.data));
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-4">Invoices</h1>
      {invoices.length === 0 ? (
        <p className="text-slate-500 text-sm">No invoices yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {invoices.map((inv) => (
            <div key={inv._id} className="card">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-sm">{inv.transactionId}</p>
                  <p className="text-xs text-slate-500">{new Date(inv.paidAt).toLocaleString()}</p>
                </div>
                <span className="badge bg-brand-50 text-brand-700">{inv.status}</span>
              </div>
              <div className="text-sm mt-2 space-y-0.5">
                <div className="flex justify-between"><span className="text-slate-500">Energy cost</span><span>₹{inv.breakdown.energyCost.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Parking fee</span><span>₹{inv.breakdown.parkingFee.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Booking fee</span><span>₹{inv.breakdown.bookingFee.toFixed(2)}</span></div>
                <div className="flex justify-between font-semibold border-t border-slate-100 pt-1 mt-1"><span>Total</span><span>₹{inv.amount.toFixed(2)}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
