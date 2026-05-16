import React, { useState, useEffect, useMemo } from 'react';
import { useProducts } from '../hooks/useProducts';
import { useCustomers } from '../hooks/useCustomers';
import { useBills } from '../hooks/useBills';
import { Product, BillItem, Customer, Unit } from '../types';
import ProductSearch from '../components/ProductSearch';
import { Trash2, Share2, Printer, CheckCircle2, Calculator, AlertCircle, RefreshCw, User, ShoppingBag, MessageSquare, Image as ImageIcon, FileText } from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { useTranslation } from '../hooks/useTranslation';
import { useReceiptSharing } from '../hooks/useReceiptSharing';
import { ReceiptCard } from '../components/ReceiptCard';
import { useScrollLock } from '../hooks/useScrollLock';

import { Bill } from '../types';

interface BillingPageProps {
  initialBill?: Bill | null;
  onClearDraft?: () => void;
}

const BillingPage: React.FC<BillingPageProps> = ({ initialBill, onClearDraft }) => {
  const { products, seedProducts } = useProducts();
  const { customers } = useCustomers();
  const { bills, addBill, updateBill } = useBills();
  const { t } = useTranslation();
  const { handleShareText, handleShareImage, generatePDF } = useReceiptSharing();

  const receiptRef = React.useRef<HTMLDivElement>(null);
  const [editingBillId, setEditingBillId] = useState<string | null>(null);
  const [lastBill, setLastBill] = useState<{
    customerName: string;
    items: BillItem[];
    subtotal: number;
    previousBalance: number;
    courierCharge?: number;
    manualPendingAmount?: number;
    finalTotal: number;
    date: string;
  } | null>(null);

  const [customerSearch, setCustomerSearch] = useState('saman');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [items, setItems] = useState<BillItem[]>([]);
  const [courierCharge, setCourierCharge] = useState<number>(0);
  const [manualPendingAmount, setManualPendingAmount] = useState<number>(0);
  const [showCourierInput, setShowCourierInput] = useState(false);
  const [showPendingInput, setShowPendingInput] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [shareOnSave, setShareOnSave] = useState(false);

  // Lock scroll when success modal is open
  useScrollLock(isSuccess);

  useEffect(() => {
    seedProducts();
  }, []);

  useEffect(() => {
    if (initialBill) {
      setCustomerSearch(initialBill.customerName);
      setItems(initialBill.items || []);
      setEditingBillId(initialBill.id);
      // If we had the actual customer object, we would set it here.
      // For now, setting the name search is enough.
      onClearDraft?.();
    }
  }, [initialBill, onClearDraft]);

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.total, 0), [items]);
  const finalTotal = subtotal + (selectedCustomer?.pendingBalance || 0) + courierCharge + manualPendingAmount;

  const handleAddProduct = (product: Product) => {
    const existingIndex = items.findIndex(item => item.productId === product.id && (!product.variants || item.variant === product.variants[0]));
    
    if (existingIndex > -1) {
      // If already exists, don't do anything (it will be disabled in UI anyway)
      return;
    }

    const defaultQty = product.unit === Unit.KG ? 0.5 : 1;
    const newItem: BillItem = {
      productId: product.id,
      name: product.nameHi,
      nameEn: product.nameEn || '',
      price: product.price,
      quantity: defaultQty,
      unit: product.unit,
      total: product.price * defaultQty,
      variant: product.variants?.[0] || '',
      availableVariants: product.variants || []
    };
    setItems([newItem, ...items]);
  };

  const handleUpdateItem = (index: number, updates: Partial<BillItem>) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], ...updates };
    newItems[index].total = newItems[index].quantity * newItems[index].price;
    setItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSaveBill = async (e?: React.MouseEvent, autoShare = false) => {
    if (!customerSearch) return;
    if (items.length === 0) return;

    setIsSaving(true);
    setShareOnSave(autoShare);
    const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    
    try {
      // Map items to ensure no undefined values are sent to Firestore
      const sanitizedItems = items.map(item => ({
        productId: item.productId,
        name: item.name,
        nameEn: item.nameEn || '',
        quantity: item.quantity,
        unit: item.unit,
        price: item.price,
        total: item.total,
        variant: item.variant || '',
        availableVariants: item.availableVariants || []
      }));

      if (editingBillId) {
        await updateBill(editingBillId, {
          customerId: selectedCustomer?.id || '',
          customerName: customerSearch || 'saman',
          items: sanitizedItems,
          subtotal,
          previousBalance: selectedCustomer?.pendingBalance || 0,
          courierCharge,
          manualPendingAmount,
          finalTotal,
          status: 'done'
        });
        setEditingBillId(null);
      } else {
        await addBill({
          customerId: selectedCustomer?.id || '',
          customerName: customerSearch || 'saman',
          items: sanitizedItems,
          subtotal,
          previousBalance: selectedCustomer?.pendingBalance || 0,
          courierCharge,
          manualPendingAmount,
          finalTotal,
          status: 'done'
        });
      }

      const billData = {
        customerName: customerSearch || 'saman',
        items: [...items],
        subtotal,
        previousBalance: selectedCustomer?.pendingBalance || 0,
        courierCharge,
        manualPendingAmount,
        finalTotal,
        date: dateStr
      };

      setLastBill(billData);
      setItems([]);
      setCourierCharge(0);
      setManualPendingAmount(0);
      setShowCourierInput(false);
      setShowPendingInput(false);
      setSelectedCustomer(null);
      setCustomerSearch('saman');
      setIsSuccess(true);

      if (autoShare) {
        // We'll let the success modal handle the specific share action
        // or we could trigger one here. But modal choice is safer.
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-full flex flex-col gap-5 pb-32">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-gray-100 leading-tight">{t('createBill')}</h2>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mt-0.5">{t('quickGeneration')}</p>
        </div>
        <button 
          onClick={() => seedProducts(true)}
          className="p-2.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl text-gray-400 dark:text-gray-500 hover:text-primary transition-all active:scale-90 shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Input Group */}
      <div className="bg-white dark:bg-gray-900 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm p-4 space-y-3">
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600 group-focus-within:text-primary transition-colors">
            <User className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
            placeholder={t('customerSearch')}
            className="w-full bg-gray-50 dark:bg-gray-800/50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white dark:placeholder:text-gray-600"
          />
        </div>
        
        <div className="pt-2">
          <ProductSearch 
            products={products} 
            currentItems={items.map(item => item.productId)}
            onSelect={handleAddProduct} 
          />
        </div>
      </div>

      {/* Items Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-primary" />
            <span className="text-xs font-black uppercase tracking-widest text-gray-400">{t('cartCount')} ({items.length})</span>
          </div>
          {items.length > 0 && (
            <button 
              onClick={() => setItems([])}
              className="text-[10px] font-black uppercase text-red-400 tracking-tighter"
            >
              {t('clearBasket')}
            </button>
          )}
        </div>

        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {(items || []).map((item, index) => (
              <motion.div
                key={`${item.productId}-${index}`}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 rounded-3xl shadow-sm flex flex-col gap-3"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 dark:text-gray-100 leading-tight text-sm">{item.name}</h4>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium leading-none mt-0.5">{item.nameEn}</p>
                    {item.availableVariants && item.availableVariants.length > 0 && (
                      <div className="flex wrap gap-1 mt-1.5">
                        {item.availableVariants.map(v => (
                          <button
                            key={v}
                            onClick={() => handleUpdateItem(index, { variant: v })}
                            className={cn(
                              "text-[8px] font-black px-2 py-0.5 rounded-lg border transition-all uppercase",
                              item.variant === v ? "bg-primary text-white border-primary" : "bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-100 dark:border-gray-700"
                            )}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => handleRemoveItem(index)}
                    className="p-2 text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all active:scale-90"
                    title={t('delete')}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800/50 p-1 rounded-xl">
                    <button 
                      onClick={() => handleUpdateItem(index, { quantity: Math.max(0, item.quantity - (item.unit === Unit.KG ? 0.25 : 1)) })}
                      className="w-8 h-8 flex items-center justify-center font-black text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800 rounded-lg shadow-sm"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleUpdateItem(index, { quantity: parseFloat(e.target.value) || 0 })}
                      className="w-12 bg-transparent border-none text-center font-black text-sm p-0 focus:ring-0 dark:text-white"
                    />
                    <button 
                      onClick={() => handleUpdateItem(index, { quantity: item.quantity + (item.unit === Unit.KG ? 0.25 : 1) })}
                      className="w-8 h-8 flex items-center justify-center font-black text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800 rounded-lg shadow-sm"
                    >
                      +
                    </button>
                    <span className="text-[8px] font-black text-gray-300 dark:text-gray-600 uppercase px-1">{item.unit === Unit.KG ? 'KG' : 'PC'}</span>
                  </div>

                  <div className="text-right">
                    <p className="text-[9px] font-black text-gray-300 dark:text-gray-600 uppercase">{t('total')}</p>
                    <p className="text-lg font-black text-primary leading-none tracking-tighter">₹{item.total.toFixed(0)}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {items.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-16 text-center bg-gray-50/50 dark:bg-gray-900/50 rounded-[40px] border-2 border-dashed border-gray-100 dark:border-gray-800"
            >
              <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100 dark:border-gray-700">
                <Calculator className="w-6 h-6 text-gray-200 dark:text-gray-700" />
              </div>
              <p className="text-gray-400 dark:text-gray-600 font-bold text-[10px] uppercase tracking-widest px-8 leading-relaxed">
                {t('noItemsAdded')}
              </p>
            </motion.div>
          )}
        </div>

        {/* Optional Charges Section */}
        {items.length > 0 && (
          <div className="flex flex-wrap gap-2 px-2 mt-4">
            {!showCourierInput ? (
              <button 
                onClick={() => setShowCourierInput(true)}
                className="text-[9px] font-black uppercase tracking-wider bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-2 rounded-xl border border-blue-100 dark:border-blue-900/30 active:scale-95 transition-all"
              >
                + {t('courierCharge') || 'Courier'}
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-xl border border-blue-100 dark:border-blue-900/30">
                <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">{t('courier') || 'Courier'}</span>
                <input 
                  type="number"
                  value={courierCharge || ''}
                  onChange={(e) => setCourierCharge(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-16 bg-white dark:bg-gray-800 border-none rounded-lg py-1 px-2 text-xs font-black focus:ring-1 focus:ring-blue-400 outline-none text-blue-600"
                />
                <button onClick={() => { setCourierCharge(0); setShowCourierInput(false); }} className="text-blue-400">×</button>
              </div>
            )}

            {!showPendingInput ? (
              <button 
                onClick={() => setShowPendingInput(true)}
                className="text-[9px] font-black uppercase tracking-wider bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 px-3 py-2 rounded-xl border border-orange-100 dark:border-orange-900/30 active:scale-95 transition-all"
              >
                + {t('pendingAmount') || 'Pending'}
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-900/20 px-3 py-1.5 rounded-xl border border-orange-100 dark:border-orange-900/30">
                <span className="text-[9px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest">{t('pending') || 'Pending'}</span>
                <input 
                  type="number"
                  value={manualPendingAmount || ''}
                  onChange={(e) => setManualPendingAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-16 bg-white dark:bg-gray-800 border-none rounded-lg py-1 px-2 text-xs font-black focus:ring-1 focus:ring-orange-400 outline-none text-orange-600"
                />
                <button onClick={() => { setManualPendingAmount(0); setShowPendingInput(false); }} className="text-orange-400">×</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Summary Bar */}
      <AnimatePresence>
        {items.length > 0 && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-24 left-4 right-4 z-40"
          >
            <div className="bg-gray-900 text-white rounded-[32px] p-4 shadow-2xl flex items-center justify-between border border-white/5">
              <div className="pl-2">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{t('totalPayable')}</p>
                <p className="text-2xl font-black tracking-tighter">{formatCurrency(finalTotal)}</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={(e) => handleSaveBill(e, true)}
                  disabled={isSaving || !customerSearch}
                  className="bg-gray-800 hover:bg-gray-700 text-white px-5 py-4 rounded-2xl flex items-center gap-2 font-black text-xs uppercase transition-all active:scale-95 disabled:grayscale disabled:opacity-50"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={(e) => handleSaveBill(e, false)}
                  disabled={isSaving || !customerSearch}
                  className="bg-primary hover:brightness-110 text-white px-8 py-4 rounded-2xl flex items-center gap-2 font-black text-xs uppercase transition-all active:scale-95 disabled:grayscale disabled:opacity-50"
                >
                  {isSaving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>{t('save')}</span>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {isSuccess && lastBill && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-gray-950/60 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="bg-white dark:bg-gray-900 rounded-[48px] p-8 shadow-2xl text-center max-w-sm w-full border border-gray-100 dark:border-gray-800"
            >
              <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">{t('success')}</h3>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-[0.2em] mb-8 leading-relaxed">
                {lastBill.customerName}<br/>
                <span className="text-primary">{formatCurrency(lastBill.finalTotal)}</span>
              </p>
              
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button 
                  onClick={() => lastBill && handleShareText(lastBill)}
                  className="bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 p-4 rounded-[24px] flex flex-col items-center gap-2 border border-green-100 dark:border-green-900/50 active:scale-95 transition-all"
                >
                  <MessageSquare className="w-5 h-5" />
                  <span className="text-[8px] font-black uppercase tracking-widest">{t('shareText')}</span>
                </button>
                <button 
                  onClick={() => lastBill && handleShareImage(receiptRef, lastBill.customerName)}
                  className="bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 p-4 rounded-[24px] flex flex-col items-center gap-2 border border-blue-100 dark:border-blue-900/50 active:scale-95 transition-all"
                >
                  <ImageIcon className="w-5 h-5" />
                  <span className="text-[8px] font-black uppercase tracking-widest">{t('shareImage')}</span>
                </button>
                <button 
                  onClick={() => lastBill && generatePDF(receiptRef, lastBill.customerName)}
                  className="bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 p-4 rounded-[24px] flex flex-col items-center gap-2 border border-orange-100 dark:border-orange-900/50 active:scale-95 transition-all"
                >
                  <FileText className="w-5 h-5" />
                  <span className="text-[8px] font-black uppercase tracking-widest">{t('sharePDF')}</span>
                </button>
                <button 
                  onClick={() => window.print()}
                  className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 p-4 rounded-[24px] flex flex-col items-center gap-2 border border-gray-100 dark:border-gray-700 active:scale-95 transition-all"
                >
                  <Printer className="w-5 h-5" />
                  <span className="text-[8px] font-black uppercase tracking-widest">{t('printReceipt')}</span>
                </button>
              </div>

              <button 
                onClick={() => setIsSuccess(false)}
                className="w-full bg-gray-950 text-white dark:bg-white dark:text-gray-950 font-black py-4 rounded-2xl text-xs uppercase tracking-widest active:scale-95 transition-all"
              >
                {t('dismiss')}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hidden Receipt Component for Image Capture */}
      <div className="fixed -left-[2000px] top-0 pointer-events-none receipt-print-container">
        {lastBill && (
          <ReceiptCard 
            ref={receiptRef}
            customerName={lastBill.customerName}
            items={lastBill.items}
            subtotal={lastBill.subtotal}
            previousBalance={lastBill.previousBalance}
            courierCharge={lastBill.courierCharge}
            manualPendingAmount={lastBill.manualPendingAmount}
            finalTotal={lastBill.finalTotal}
            date={lastBill.date}
          />
        )}
      </div>

    </div>
  );
};

export default BillingPage;
