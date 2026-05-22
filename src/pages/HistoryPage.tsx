import React, { useState } from 'react';
import { useBills } from '../hooks/useBills';
import { formatCurrency, cn, parseTimestamp } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  ChevronRight, 
  Calendar, 
  User, 
  FileText, 
  Landmark, 
  Share2, 
  Trash2, 
  Edit3, 
  MessageSquare, 
  Image as ImageIcon, 
  X,
  Filter,
  Tag,
  Printer
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { Bill } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { useReceiptSharing } from '../hooks/useReceiptSharing';
import { ReceiptCard } from '../components/ReceiptCard';
import { useSettings } from '../context/SettingsContext';
import { useScrollLock } from '../hooks/useScrollLock';

interface HistoryPageProps {
  onEdit?: (bill: Bill) => void;
  initialStatus?: string | 'all';
  onFilterChange?: (status: string | 'all') => void;
}

const HistoryPage: React.FC<HistoryPageProps> = ({ onEdit, initialStatus = 'all', onFilterChange }) => {
  const { bills, loading, deleteBill, updateBill } = useBills();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { labels } = useSettings();
  const { handleShareText, handleShareImage, generatePDF } = useReceiptSharing();
  
  const isAdmin = user?.role === 'admin';

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | 'all'>(initialStatus);
  const [dateFilter, setDateFilter] = useState('');
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const receiptRef = React.useRef<HTMLDivElement>(null);

  // Lock scroll when bill is selected
  useScrollLock(!!selectedBill);

  const filteredBills = bills.filter(bill => {
    const matchesSearch = bill.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || bill.status === statusFilter;
    
    let matchesDate = true;
    const billDateObj = parseTimestamp(bill.timestamp);
    if (dateFilter && billDateObj) {
      const billDate = format(billDateObj, 'yyyy-MM-dd');
      matchesDate = billDate === dateFilter;
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const groupedBillsByDate = filteredBills.reduce((groups: { [key: string]: Bill[] }, bill) => {
    const billDateObj = parseTimestamp(bill.timestamp);
    const date = billDateObj 
      ? format(billDateObj, 'yyyy-MM-dd')
      : 'Processing';
    if (!groups[date]) groups[date] = [];
    groups[date].push(bill);
    return groups;
  }, {});

  const sortedDates = Object.keys(groupedBillsByDate).sort((a, b) => b.localeCompare(a));

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    if (!id) {
      console.error('No bill ID provided for deletion');
      return;
    }

    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      // Auto-reset confirm state after 3 seconds if not clicked
      setTimeout(() => setShowDeleteConfirm(false), 3000);
      return;
    }

    setIsDeleting(true);
    try {
      console.log('Deleteting bill:', id);
      await deleteBill(id);
      setSelectedBill(null);
      setShowDeleteConfirm(false);
    } catch (error: any) {
      console.error('Failed to delete bill:', error);
      alert('Delete Error: ' + (error.message || 'Unknown error'));
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const selectedBillDate = parseTimestamp(selectedBill?.timestamp);
  const billDateStr = selectedBillDate 
    ? format(selectedBillDate, 'dd MMM, yyyy')
    : new Date().toLocaleDateString();

  const shareData = selectedBill ? {
    customerName: selectedBill.customerName,
    items: selectedBill.items,
    subtotal: selectedBill.subtotal,
    previousBalance: selectedBill.previousBalance,
    courierCharge: selectedBill.courierCharge,
    manualPendingAmount: selectedBill.manualPendingAmount,
    finalTotal: selectedBill.finalTotal,
    date: billDateStr
  } : null;

  const handleStatusChange = async (billId: string, status: string) => {
    if (!isAdmin) return;
    try {
      await updateBill(billId, { status });
      if (selectedBill?.id === billId) {
        setSelectedBill({ ...selectedBill, status });
      }
    } catch (error) {
      console.error('Failed to update status', error);
    }
  };

  const getStatusColor = (status?: string) => {
    if (!status) return 'bg-gray-100 dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700';
    
    const s = status.toLowerCase();
    if (s.includes('done')) return 'bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800';
    if (s.includes('bank')) return 'bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800';
    if (s.includes('pending')) return 'bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800';
    
    return 'bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800';
  };

  const renderStatusLabel = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'done') return t('statusDone');
    if (s === 'pending') return t('statusPending');
    if (s === 'bank' || s.includes('bank') || s.includes('payment in bank')) return t('statusBank');
    return status;
  };

  if (loading) return <div className="p-8 text-center text-gray-500 font-bold uppercase text-[10px] tracking-widest">{t('loading')}</div>;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between mb-4 px-1">
        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-gray-100 leading-tight">{t('history')}</h2>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase">{filteredBills.length} {t('items')}</p>
        </div>
        
        <div className="flex items-center gap-2">
          {dateFilter && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter"
            >
              <span>{format(new Date(dateFilter), 'dd MMM')}</span>
              <button onClick={() => setDateFilter('')} className="p-0.5 hover:bg-primary/20 rounded-full transition-colors">
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          )}
          <div className="relative group">
            <div className="p-2.5 bg-white dark:bg-gray-900 rounded-full border border-gray-100 dark:border-gray-800 text-gray-400 shadow-sm transition-all group-hover:text-primary group-hover:border-primary/20">
              <Calendar className="w-5 h-5" />
            </div>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('searchBill')}
            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl py-4 pl-12 pr-4 text-base focus:ring-2 focus:ring-primary outline-none transition-all shadow-sm"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-1">
          <button
            onClick={() => {
              setStatusFilter('all');
              onFilterChange?.('all');
            }}
            className={cn(
              "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap border transition-all",
              statusFilter === 'all' 
                ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                : "bg-white dark:bg-gray-900 text-gray-400 border-gray-100 dark:border-gray-800"
            )}
          >
            {t('all')}
          </button>
          {labels.map(label => (
            <button
              key={label}
              onClick={() => {
                setStatusFilter(label);
                onFilterChange?.(label);
              }}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap border transition-all",
                statusFilter === label 
                  ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                  : "bg-white dark:bg-gray-900 text-gray-400 border-gray-100 dark:border-gray-800"
              )}
            >
              {renderStatusLabel(label)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {sortedDates.map((date) => (
          <div key={date} className="space-y-3">
            <div className="flex items-center gap-4 py-2">
              <div className="h-[1px] flex-1 bg-gray-100 dark:bg-gray-800" />
              <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest bg-gray-50 dark:bg-gray-950 px-2">
                {date === 'Processing' ? t('processing') : (isNaN(new Date(date).getTime()) ? date : format(new Date(date), 'PPP'))}
              </span>
              <div className="h-[1px] flex-1 bg-gray-100 dark:bg-gray-800" />
            </div>
            
            {groupedBillsByDate[date].map((bill) => (
              <div 
                key={bill.id} 
                className="relative group overflow-hidden rounded-3xl"
              >
                {/* Background Actions for Swipe - Only for Admin */}
                {isAdmin && (
                  <div className="absolute inset-0 flex items-center justify-between px-6 rounded-3xl overflow-hidden">
                    <div className="flex items-center gap-2 text-orange-600 font-black text-[10px] uppercase tracking-tighter">
                      <Tag className="w-4 h-4" />
                      {t('statusPending')}
                    </div>
                    <div className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-tighter">
                      {t('statusBank')}
                      <Landmark className="w-4 h-4" />
                    </div>
                  </div>
                )}

                <motion.div
                  drag={isAdmin ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.7}
                  onDragEnd={(_, info) => {
                    if (!isAdmin) return;
                    const threshold = 100;
                    if (info.offset.x > threshold) {
                      // Swipe Right -> Pending
                      handleStatusChange(bill.id, 'pending');
                    } else if (info.offset.x < -threshold) {
                      // Swipe Left -> Bank
                      handleStatusChange(bill.id, 'bank');
                    }
                  }}
                  className="relative z-10"
                >
                  <div 
                    onClick={() => setSelectedBill(bill)}
                    className="w-full bg-white dark:bg-gray-900 p-4 rounded-[28px] border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between gap-4 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0 max-w-[40%]">
                      {/* Done Bullet/Circle - Only for Admin or shown as static for Guest */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isAdmin) handleStatusChange(bill.id, 'done');
                        }}
                        className={cn(
                          "w-6 h-6 rounded-full border-2 flex-shrink-0 transition-all flex items-center justify-center",
                          bill.status === 'done' 
                            ? "bg-green-500 border-green-500 text-white" 
                            : "border-gray-200 dark:border-gray-700",
                          isAdmin && bill.status !== 'done' && "hover:border-green-500",
                          !isAdmin && "cursor-default"
                        )}
                      >
                        {bill.status === 'done' && <div className="w-2 h-2 bg-white rounded-full" />}
                      </button>

                      <div className="text-left overflow-hidden">
                        <h3 className="font-bold text-gray-900 dark:text-gray-100 truncate text-sm leading-tight">{bill.customerName}</h3>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                          {parseTimestamp(bill.timestamp) ? format(parseTimestamp(bill.timestamp)!, 'hh:mm a') : t('processing')}
                        </p>
                      </div>
                    </div>

                    <div className="flex-1 flex justify-center px-2">
                      {bill.status && bill.status !== 'done' && (
                        <span className={cn("text-[11px] font-black uppercase px-4 py-1.5 rounded-full border shadow-sm text-center leading-none whitespace-nowrap tracking-wider", getStatusColor(bill.status))}>
                          {renderStatusLabel(bill.status)}
                        </span>
                      )}
                    </div>

                    <div className="text-right min-w-[80px]">
                      <p className="text-lg font-black text-primary leading-tight tracking-tighter">{formatCurrency(bill.finalTotal)}</p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-1">{(bill.items || []).length} {t('items')}</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        ))}

        {filteredBills.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-gray-400 font-medium font-sans">No records found</p>
          </div>
        )}
      </div>

      {/* Bill Details Drawer/Modal */}
      <AnimatePresence>
        {selectedBill && (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedBill(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative z-10 w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
            >
              <div className="p-5 sm:p-7 flex flex-col min-h-0 h-full">
                <div className="w-12 h-1 bg-gray-200 dark:bg-gray-800 rounded-full mx-auto mb-4 sm:hidden flex-shrink-0" />
                
                <div className="flex justify-between items-start mb-4 flex-shrink-0">
                  <div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 mb-0.5 leading-tight">{selectedBill.customerName}</h3>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      {parseTimestamp(selectedBill.timestamp) ? format(parseTimestamp(selectedBill.timestamp)!, 'PPP, p') : t('processing')}
                    </p>
                  </div>
                  <button 
                    onClick={() => setSelectedBill(null)}
                    className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-grow overflow-y-auto space-y-4 min-h-0 pr-1 scrollbar-hide">
                  <div className="space-y-4 pb-4">
                    {(selectedBill.items || []).map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center py-2.5 border-b border-gray-50 dark:border-gray-800 last:border-0 px-2 rounded-xl">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm leading-tight">{item.name}</h4>
                          {item.nameEn && <p className="text-[9px] text-gray-400 dark:text-gray-500 font-medium leading-none mt-0.5">{item.nameEn}</p>}
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">{item.quantity} {item.unit} @ ₹{item.price}</p>
                            {item.variant && <span className="text-[8px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">{item.variant}</span>}
                          </div>
                        </div>
                        <span className="font-black text-gray-900 dark:text-gray-100 text-sm ml-4 whitespace-nowrap">₹{item.total}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 space-y-3">
                    <div className="flex flex-col gap-2">
                      <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">{isAdmin ? t('markStatus') : 'Current Status'}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {labels.map((status) => (
                          <button
                            key={status}
                            disabled={!isAdmin}
                            onClick={() => handleStatusChange(selectedBill.id, status)}
                            className={cn(
                              "text-[10px] font-black uppercase py-2.5 px-2 rounded-xl border transition-all flex items-center justify-center text-center leading-none tracking-widest",
                              selectedBill.status === status 
                                ? getStatusColor(status) + " shadow-md"
                                : 'bg-white dark:bg-gray-900 text-gray-400 border-gray-100 dark:border-gray-800',
                              !isAdmin && "opacity-80 grayscale-[0.5]"
                            )}
                          >
                            {renderStatusLabel(status)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0 pt-4 space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 space-y-2">
                    <div className="flex justify-between text-[9px] text-gray-400 font-black uppercase tracking-widest">
                      <span>{t('subtotal')}</span>
                      <span>{formatCurrency(selectedBill.subtotal)}</span>
                    </div>
                    {selectedBill.previousBalance > 0 && (
                      <div className="flex justify-between text-[9px] text-red-500 font-black uppercase tracking-widest">
                        <span>{t('previousBalance')}</span>
                        <span>+{formatCurrency(selectedBill.previousBalance)}</span>
                      </div>
                    )}
                    {selectedBill.courierCharge && selectedBill.courierCharge > 0 ? (
                      <div className="flex justify-between text-[9px] text-blue-500 font-black uppercase tracking-widest">
                        <span>{t('courierCharge')}</span>
                        <span>+{formatCurrency(selectedBill.courierCharge)}</span>
                      </div>
                    ) : null}
                    {selectedBill.manualPendingAmount && selectedBill.manualPendingAmount > 0 ? (
                      <div className="flex justify-between text-[9px] text-orange-600 font-black uppercase tracking-widest">
                        <span>{t('pendingAmount')}</span>
                        <span>+{formatCurrency(selectedBill.manualPendingAmount)}</span>
                      </div>
                    ) : null}
                    <div className="flex justify-between items-end pt-2 mt-2 border-t border-gray-200 dark:border-gray-700">
                      <span className="font-black text-gray-900 dark:text-gray-100 text-xs uppercase tracking-widest">{t('totalPaid')}</span>
                      <span className="font-black text-xl text-primary leading-none tracking-tighter">{formatCurrency(selectedBill.finalTotal)}</span>
                    </div>
                  </div>

                  <div className={cn("grid gap-1 pb-4 sm:pb-0", isAdmin ? "grid-cols-6" : "grid-cols-4")}>
                  {isAdmin && (
                    <button 
                      onClick={() => onEdit?.(selectedBill)}
                      className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-primary/5 dark:bg-primary/20 text-primary border border-primary/10 active:scale-95 transition-all"
                      title={t('edit')}
                    >
                      <Edit3 className="w-5 h-5" />
                      <span className="text-[8px] font-black uppercase tracking-tighter">EDIT</span>
                    </button>
                  )}
                  <button 
                    onClick={() => shareData && handleShareText(shareData)}
                    className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-900/50 active:scale-95 transition-all"
                    title={t('shareText')}
                  >
                    <MessageSquare className="w-5 h-5" />
                    <span className="text-[8px] font-black uppercase tracking-tighter">WA</span>
                  </button>
                  <button 
                    onClick={() => receiptRef.current && handleShareImage(receiptRef, selectedBill.customerName)}
                    className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 active:scale-95 transition-all"
                    title={t('shareImage')}
                  >
                    <ImageIcon className="w-5 h-5" />
                    <span className="text-[8px] font-black uppercase tracking-tighter">IMG</span>
                  </button>
                  <button 
                    onClick={() => shareData && generatePDF(receiptRef, selectedBill.customerName)}
                    className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-900/50 active:scale-95 transition-all"
                    title={t('sharePDF')}
                  >
                    <FileText className="w-5 h-5" />
                    <span className="text-[8px] font-black uppercase tracking-tighter">PDF</span>
                  </button>
                  <button 
                    onClick={() => window.print()}
                    className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-gray-700 active:scale-95 transition-all"
                    title={t('printReceipt')}
                  >
                    <Printer className="w-5 h-5" />
                    <span className="text-[8px] font-black uppercase tracking-tighter">PRNT</span>
                  </button>
                  {isAdmin && (
                    <button 
                      onClick={() => handleDelete(selectedBill.id)}
                      disabled={isDeleting}
                      className={cn(
                        "flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border active:scale-95 transition-all flex",
                        isDeleting 
                          ? "bg-gray-100 text-gray-400 border-gray-100 opacity-50 cursor-not-allowed"
                          : showDeleteConfirm
                            ? "bg-red-600 text-white border-red-600 scale-105 shadow-lg shadow-red-200"
                            : "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/50"
                      )}
                      title={t('delete')}
                    >
                      <Trash2 className={cn("w-5 h-5", showDeleteConfirm && "animate-bounce")} />
                      <span className="text-[8px] font-black uppercase tracking-tighter">
                        {showDeleteConfirm ? "SURE?" : "DEL"}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hidden Receipt Component for Image Capture */}
      <div className="fixed -left-[2000px] top-0 pointer-events-none receipt-print-container">
        {selectedBill && shareData && (
          <ReceiptCard 
            ref={receiptRef}
            customerName={shareData.customerName}
            items={shareData.items}
            subtotal={shareData.subtotal}
            previousBalance={shareData.previousBalance}
            courierCharge={selectedBill.courierCharge}
            manualPendingAmount={selectedBill.manualPendingAmount}
            finalTotal={shareData.finalTotal}
            date={shareData.date}
          />
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
