import React from 'react';
import { BillItem } from '../types';
import { formatCurrency } from '../lib/utils';
import { ReceiptText } from 'lucide-react';

interface ReceiptCardProps {
  customerName: string;
  items: BillItem[];
  subtotal: number;
  previousBalance: number;
  courierCharge?: number;
  manualPendingAmount?: number;
  finalTotal: number;
  date: string;
}

export const ReceiptCard = React.forwardRef<HTMLDivElement, ReceiptCardProps>(({ 
  customerName, 
  items, 
  subtotal, 
  previousBalance, 
  courierCharge = 0,
  manualPendingAmount = 0,
  finalTotal,
  date
}, ref) => {
  return (
    <div 
      ref={ref}
      className="w-[380px] bg-white rounded-none flex flex-col text-gray-900 font-sans overflow-hidden"
      style={{ position: 'relative' }}
    >
      {/* Business Header */}
      <div className="p-8 pb-4 border-b-4 border-[#002e6e]">
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <h1 className="text-xl font-black text-[#002e6e] uppercase tracking-tight leading-tight">
              Baheti's
            </h1>
            <h2 className="text-sm font-black text-[#00baf2] uppercase tracking-[0.2em] -mt-1">
              माहेश्वरी ग्रहस्थी उद्योग
            </h2>
          </div>
          <div className="bg-[#002e6e] text-white px-4 py-2 rounded-sm text-center">
            <p className="text-[10px] font-black tracking-[0.2em] uppercase">Bill / Invoice</p>
          </div>
        </div>
        
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-gray-600">
            <span className="text-[9px] font-black uppercase tracking-widest bg-gray-100 px-1.5 py-0.5 rounded">Contact</span>
            <p className="text-[10px] font-bold">9301613460, 9407933460</p>
          </div>
        </div>
      </div>

      <div className="p-8 pt-6 space-y-6">
        <div className="flex justify-between items-end border-b border-gray-100 pb-6">
          <div>
            <p className="text-[10px] font-black text-[#00baf2] uppercase tracking-[0.2em] mb-1">Bill To</p>
            <p className="text-xl font-black text-[#002e6e] uppercase">{customerName}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Date</p>
            <p className="text-xs font-black text-gray-900">{date}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50 pb-2">
            <span>Description</span>
            <span>Subtotal</span>
          </div>
          <div className="space-y-4 max-h-[400px] overflow-hidden">
            {items && items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start">
                <div className="flex flex-col flex-1">
                  <span className="text-[13px] font-black text-gray-800 leading-tight">{item.name}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-gray-400 font-bold bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                      {item.quantity} {item.unit} @ ₹{item.price}
                    </span>
                    {item.variant && (
                      <span className="text-[9px] bg-[#00baf2]/5 text-[#00baf2] px-2 py-0.5 rounded font-black tracking-tighter uppercase border border-[#00baf2]/10">
                        {item.variant}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-sm font-black text-gray-900 ml-4">₹{item.total.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-6 border-t-2 border-dashed border-gray-100 space-y-3">
          <div className="flex justify-between text-gray-500 font-bold text-[11px] uppercase tracking-widest">
            <span>Base Amount</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {previousBalance > 0 && (
            <div className="flex justify-between text-red-500 font-bold text-[11px] uppercase tracking-widest">
              <span>Old Pending Balance</span>
              <span>+{formatCurrency(previousBalance)}</span>
            </div>
          )}
          {courierCharge > 0 && (
            <div className="flex justify-between text-blue-500 font-bold text-[11px] uppercase tracking-widest">
              <span>Courier Charges</span>
              <span>+{formatCurrency(courierCharge)}</span>
            </div>
          )}
          {manualPendingAmount > 0 && (
            <div className="flex justify-between text-orange-600 font-bold text-[11px] uppercase tracking-widest">
              <span>Added Pending Amount</span>
              <span>+{formatCurrency(manualPendingAmount)}</span>
            </div>
          )}
          <div className="flex justify-between pt-4 border-t border-gray-50 items-center">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-[#002e6e] uppercase tracking-widest leading-none mb-1">Total Amount</span>
              <span className="text-xs text-gray-400 font-medium">Inclusive of all items</span>
            </div>
            <span className="text-3xl font-black text-[#00baf2] tracking-tighter">₹{finalTotal.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="pt-8 flex flex-col items-center gap-6">
          <div className="text-center space-y-2 border-t border-gray-50 pt-6 w-full">
            <p className="text-[10px] font-black text-[#002e6e] uppercase tracking-[0.3em]">Thank You for your visit!</p>
            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-[0.15em]">Visit Again for Pure & Quality Products</p>
          </div>
        </div>
      </div>

      {/* Decorative Wave Bottom */}
      <div className="h-2 bg-[#00baf2] mt-auto" />
    </div>
  );
});
