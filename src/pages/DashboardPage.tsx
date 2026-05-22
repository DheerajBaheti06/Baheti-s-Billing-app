import React, { useMemo, useState } from 'react';
import { useBills } from '../hooks/useBills';
import { useCustomers } from '../hooks/useCustomers';
import { useProducts } from '../hooks/useProducts';
import { formatCurrency, cn, parseTimestamp } from '../lib/utils';
import { 
  TrendingUp, 
  Package, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight,
  ShoppingCart,
  Calendar,
  Star,
  Banknote,
  ChevronDown
} from 'lucide-react';
import { 
  format, 
  isToday, 
  startOfMonth, 
  startOfWeek, 
  startOfYear, 
  endOfDay,
  subDays,
  subMonths,
  isAfter,
  isBefore
} from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from '../hooks/useTranslation';

interface DashboardPageProps {
  onNavigate: (tab: 'dashboard' | 'billing' | 'history' | 'catalog' | 'settings', params?: { status?: string }) => void;
}

type DateRange = 'today' | 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'all';

const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { bills, loading: billsLoading } = useBills();
  const { customers, loading: customersLoading } = useCustomers();
  const { products, loading: productsLoading } = useProducts();
  const { t } = useTranslation();
  const [selectedRange, setSelectedRange] = useState<DateRange>('today');
  const [showRangePicker, setShowRangePicker] = useState(false);

  const stats = useMemo(() => {
    if (billsLoading) return null;

    const now = new Date();
    
    const getRangeInterval = (range: DateRange) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      switch (range) {
        case 'today': 
          return { start: today, end: endOfDay(now) };
        case 'last7days': 
          return { start: subDays(today, 7), end: endOfDay(now) };
        case 'last30days': 
          return { start: subDays(today, 30), end: endOfDay(now) };
        case 'thisMonth': 
          return { start: startOfMonth(now), end: endOfDay(now) };
        case 'lastMonth': {
          const firstOfThisMonth = startOfMonth(now);
          const firstOfLastMonth = startOfMonth(subMonths(now, 1));
          return { start: firstOfLastMonth, end: subDays(firstOfThisMonth, 0) }; // Wait, subDays 0 is same. 
          // Actually, until end of last month:
          // return { start: firstOfLastMonth, end: subDays(firstOfThisMonth, 1) };
        }
        case 'thisYear': 
          return { start: startOfYear(now), end: endOfDay(now) };
        default: 
          return { start: new Date(0), end: new Date(8640000000000000) };
      }
    };

    const interval = getRangeInterval(selectedRange);
    
    // lastMonth specific fix:
    if (selectedRange === 'lastMonth') {
      const firstOfThisMonth = startOfMonth(now);
      const firstOfLastMonth = startOfMonth(subMonths(now, 1));
      const endOfLastMonth = subDays(firstOfThisMonth, 0.000001); // Just before this month
      interval.start = firstOfLastMonth;
      interval.end = endOfLastMonth;
    }

    const filteredBills = bills.filter(b => {
      const date = parseTimestamp(b.timestamp);
      if (!date) return false;
      return isAfter(date, interval.start) && isBefore(date, interval.end);
    });

    const totalSales = filteredBills.reduce((sum, b) => sum + b.finalTotal, 0);
    
    const outstanding = filteredBills
      .filter(b => b.status === 'pending')
      .reduce((sum, b) => sum + b.finalTotal, 0);
      
    const bankReceived = filteredBills
      .filter(b => b.status === 'bank')
      .reduce((sum, b) => sum + b.finalTotal, 0);

    const productSales: { [key: string]: { name: string, count: number, revenue: number } } = {};
    filteredBills.forEach(bill => {
      bill.items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = { name: item.name, count: 0, revenue: 0 };
        }
        productSales[item.productId].count += item.quantity;
        productSales[item.productId].revenue += item.total;
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 4);

    return {
      totalSales,
      outstanding,
      bankReceived,
      topProducts,
      count: filteredBills.length
    };
  }, [bills, billsLoading, selectedRange]);

  if (billsLoading || customersLoading || productsLoading) {
    return (
      <div className="p-8 text-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('loading')}</p>
      </div>
    );
  }

  const rangeLabels: Record<DateRange, string> = {
    today: 'Today',
    last7days: 'Last 7 Days',
    last30days: 'Last 30 Days',
    thisMonth: 'This Month',
    lastMonth: 'Last Month',
    thisYear: 'This Year',
    all: 'All Time'
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="px-1 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-none mb-1">
            {t('dashboard') || 'Dashboard'}
          </h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            {format(new Date(), 'EEEE, dd MMMM yyyy')}
          </p>
        </div>

        <div className="relative">
          <button 
            onClick={() => setShowRangePicker(!showRangePicker)}
            className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 px-4 py-2.5 rounded-2xl shadow-sm active:scale-95 transition-all outline-none"
          >
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-700 dark:text-gray-300">
              {rangeLabels[selectedRange]}
            </span>
            <ChevronDown className={cn("w-3 h-3 text-gray-400 transition-transform", showRangePicker && "rotate-180")} />
          </button>

          <AnimatePresence>
            {showRangePicker && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-2xl z-50 overflow-hidden"
              >
                {(['today', 'last7days', 'last30days', 'thisMonth', 'lastMonth', 'thisYear', 'all'] as DateRange[]).map((range) => (
                  <button
                    key={range}
                    onClick={() => {
                      setSelectedRange(range);
                      setShowRangePicker(false);
                    }}
                    className={cn(
                      "w-full text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-50 dark:border-gray-800 last:border-0 outline-none",
                      selectedRange === range ? "text-primary flex items-center justify-between" : "text-gray-500"
                    )}
                  >
                    {rangeLabels[range]}
                    {selectedRange === range && <div className="w-1.5 h-1.5 bg-primary rounded-full" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => onNavigate('history')}
          className="bg-primary p-5 rounded-[32px] text-white shadow-xl shadow-primary/20 flex flex-col justify-between aspect-square cursor-pointer active:scale-95 transition-all outline-none"
        >
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-4 h-4 opacity-40" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">
              {rangeLabels[selectedRange]} Sales
            </p>
            <h3 className="text-2xl font-black tracking-tighter leading-none">₹{stats?.totalSales.toLocaleString('en-IN')}</h3>
            <p className="text-[9px] font-bold mt-2 opacity-60 uppercase">{stats?.count} {t('bills') || 'Bills'}</p>
          </div>
        </motion.div>

        <div className="grid grid-rows-2 gap-4">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => onNavigate('history', { status: 'bank' })}
            className="bg-green-50 dark:bg-green-950/20 p-4 rounded-[28px] border border-green-100 dark:border-green-900/30 flex flex-col justify-between cursor-pointer active:scale-95 transition-all outline-none"
          >
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-bold text-green-600 dark:text-green-400 uppercase tracking-widest">Bank Total</span>
              <Banknote className="w-3 h-3 text-green-500" />
            </div>
            <div>
              <p className="text-lg font-black text-green-700 dark:text-green-300 leading-tight">₹{stats?.bankReceived.toLocaleString('en-IN')}</p>
              <p className="text-[8px] text-green-600/50 dark:text-green-400/50 font-bold uppercase mt-0.5">{rangeLabels[selectedRange]}</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => onNavigate('history', { status: 'pending' })}
            className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-[28px] border border-orange-100 dark:border-orange-900/30 flex flex-col justify-between cursor-pointer active:scale-95 transition-all outline-none"
          >
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-bold text-orange-400 uppercase tracking-widest">{t('outstanding') || 'Outstanding'}</span>
              <Wallet className="w-3 h-3 text-orange-400" />
            </div>
            <div>
              <p className="text-lg font-black text-orange-600 dark:text-orange-300 leading-tight">₹{stats?.outstanding.toLocaleString('en-IN')}</p>
              <p className="text-[8px] text-orange-400/50 dark:text-orange-400/50 font-bold uppercase mt-0.5">{rangeLabels[selectedRange]}</p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 px-1">
        <button 
          onClick={() => onNavigate('catalog')}
          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 active:scale-95 transition-all outline-none"
        >
          <div className="flex items-center gap-3">
            <Package className="w-4 h-4 text-gray-400" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('products')}</span>
          </div>
          <span className="text-xs font-black text-gray-900 dark:text-white">{products.length}</span>
        </button>
        <button 
          onClick={() => onNavigate('history')}
          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 active:scale-95 transition-all outline-none"
        >
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-4 h-4 text-gray-400" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('totalOrders') || 'Orders'}</span>
          </div>
          <span className="text-xs font-black text-gray-900 dark:text-white">{bills.length}</span>
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-[32px] p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black dark:bg-white rounded-xl flex items-center justify-center">
              <Star className="w-4 h-4 text-white dark:text-black" />
            </div>
            <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">{t('topProducts') || 'Top Products'}</h4>
          </div>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{rangeLabels[selectedRange]}</p>
        </div>

        <div className="space-y-4">
          {stats?.topProducts.map((p, idx) => (
            <div key={idx} className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-gray-300 dark:text-gray-700 w-4">0{idx + 1}</span>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white leading-none">{p.name}</p>
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">₹{p.revenue.toLocaleString('en-IN')}</p>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 px-3 py-1 rounded-full border border-gray-100 dark:border-gray-700">
                <span className="text-[10px] font-black text-primary">{p.count.toFixed(0)} SOLD</span>
              </div>
            </div>
          ))}
          {stats?.topProducts.length === 0 && (
            <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest py-4">No sales data yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
