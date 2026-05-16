import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { LogIn, PlusCircle, History, Package, LogOut, ReceiptText, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { useTranslation } from './hooks/useTranslation';

// Pages
import BillingPage from './pages/BillingPage';
import ProductsPage from './pages/ProductsPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import { Bill } from './types';

function AppContent() {
  const { user, loading, loginAsAdmin, loginAsGuest, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'billing' | 'history' | 'catalog' | 'settings'>('billing');
  const [draftBill, setDraftBill] = useState<Bill | null>(null);
  const [mpin, setMpin] = useState('');
  const [showMpinInput, setShowMpinInput] = useState(false);
  const [mpinError, setMpinError] = useState(false);
  const { t } = useTranslation();

  // If guest, force catalog tab
  useEffect(() => {
    if (user?.role === 'guest') {
      setActiveTab('catalog');
    }
  }, [user]);

  const handleEditBill = (bill: Bill) => {
    setDraftBill(bill);
    setActiveTab('billing');
  };

  const handleMpinLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setMpinError(false);
    const success = loginAsAdmin(mpin);
    if (!success) {
      setMpinError(true);
      setMpin('');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-gray-950">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-500 dark:text-gray-400 font-bold text-sm">{t('loading')}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-gray-950 p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-[40px] shadow-2xl p-10 text-center border border-gray-100 dark:border-gray-800"
        >
          <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
            <ReceiptText className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
            {t('appName')}
          </h1>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-10">
            {t('appTagline')}
          </p>

          {!showMpinInput ? (
            <div className="space-y-4">
              <button
                onClick={loginAsGuest}
                className="w-full flex items-center justify-center gap-3 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-bold py-4 px-6 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all border border-gray-100 dark:border-gray-700 active:scale-95 duration-200"
              >
                <Package className="w-5 h-5" />
                <span>{t('viewList')}</span>
              </button>
              
              <button
                onClick={() => setShowMpinInput(true)}
                className="w-full flex items-center justify-center gap-3 bg-primary text-white font-bold py-4 px-6 rounded-2xl hover:brightness-110 transition-all shadow-lg active:scale-95 duration-200"
              >
                <LogIn className="w-5 h-5" />
                <span>{t('enterMpin')}</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleMpinLogin} className="space-y-4">
              <motion.div
                animate={mpinError ? { x: [-10, 10, -10, 10, 0] } : {}}
                transition={{ duration: 0.4 }}
              >
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={mpin}
                  onChange={(e) => {
                    setMpinError(false);
                    setMpin(e.target.value.replace(/\D/g, ''));
                  }}
                  placeholder="****"
                  autoFocus
                  className={cn(
                    "w-full text-center text-3xl tracking-[1em] font-black py-4 bg-gray-50 dark:bg-gray-800 border-2 rounded-2xl outline-none transition-all dark:text-white",
                    mpinError ? "border-red-500 animate-pulse" : "border-gray-100 dark:border-gray-700 focus:border-primary"
                  )}
                />
                {mpinError && (
                  <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mt-2">{t('incorrectMpin')}</p>
                )}
              </motion.div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowMpinInput(false)}
                  className="flex-1 py-4 font-bold text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-2xl active:scale-95 transition-all"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={mpin.length < 4}
                  className="flex-[2] py-4 font-bold bg-primary text-white rounded-2xl shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                >
                  Login
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    );
  }

  const allTabs = [
    { id: 'billing', label: t('newBill'), icon: PlusCircle, component: <BillingPage initialBill={draftBill} onClearDraft={() => setDraftBill(null)} /> },
    { id: 'history', label: t('history'), icon: History, component: <HistoryPage onEdit={handleEditBill} /> },
    { id: 'catalog', label: t('catalog'), icon: Package, component: <ProductsPage /> },
    { id: 'settings', label: t('settings'), icon: Settings, component: <SettingsPage /> },
  ];

  const isAdmin = user.role === 'admin';
  const tabs = isAdmin ? allTabs : allTabs.filter(t => t.id === 'catalog');

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans pb-24 transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-5 py-4 flex items-center justify-between z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center shadow-md shadow-primary/20">
            <ReceiptText className="w-4 h-4 text-white" />
          </div>
          <span className="font-black text-sm tracking-tight">{t('appName')}</span>
        </div>
        
        <button 
          onClick={logout}
          className="p-1 text-gray-300 hover:text-red-500 transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-md mx-auto p-4 overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 5 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -5 }}
            transition={{ duration: 0.15 }}
          >
            {tabs.find(t => t.id === activeTab)?.component}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-100 dark:border-gray-800 flex items-center justify-between px-2 py-2 z-40 rounded-[32px] shadow-2xl safe-bottom w-[94%] max-w-md">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "relative flex flex-col items-center justify-center py-2.5 transition-all duration-300 rounded-2xl flex-1",
                isActive ? "text-primary" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-xl transition-all duration-300 flex items-center gap-2",
                isActive ? "bg-primary/10 px-4" : "bg-transparent"
              )}>
                <Icon className={cn("w-5 h-5 transition-transform duration-300", isActive && "scale-110")} />
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-tight transition-all duration-300 overflow-hidden whitespace-nowrap",
                  isActive ? "max-w-[80px] opacity-100" : "max-w-0 opacity-0"
                )}>
                  {tab.label}
                </span>
              </div>
              {isActive && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full"
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <AppContent />
        <Toaster 
          position="top-center" 
          toastOptions={{
            className: 'font-sans font-bold text-[10px] uppercase tracking-widest',
            duration: 2000,
            style: {
              background: '#000',
              color: '#fff',
              borderRadius: '16px',
            }
          }}
        />
      </SettingsProvider>
    </AuthProvider>
  );
}
