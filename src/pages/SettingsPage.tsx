import React from 'react';
import { 
  Moon, 
  Sun, 
  Monitor, 
  Type, 
  Palette, 
  Check,
  Smartphone,
  Info,
  Languages,
  Tag,
  Plus,
  Trash2,
  Download
} from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'react-hot-toast';
import { cn } from '../lib/utils';
import { useSettings } from '../context/SettingsContext';
import { useTranslation } from '../hooks/useTranslation';
import { usePwaInstall } from '../hooks/usePwaInstall';

const SettingsPage = () => {
  const { theme, accent, font, language, labels, setTheme, setAccent, setFont, setLanguage, addLabel, removeLabel } = useSettings();
  const { t } = useTranslation();
  const [newLabel, setNewLabel] = React.useState('');
  const { isInstallable, isStandalone, installApp } = usePwaInstall();

  const handleAddLabel = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLabel.trim()) {
      addLabel(newLabel.trim().toLowerCase());
      setNewLabel('');
      toast.success(t('labelAdded') || 'Label Added');
    }
  };

  const handleRemoveLabel = (label: string) => {
    removeLabel(label);
    toast.success(t('labelRemoved') || 'Label Removed');
  }

  const handleSetLanguage = (lang: any) => {
    setLanguage(lang);
    toast.success('Language Updated');
  }

  const handleSetTheme = (newTheme: any) => {
    setTheme(newTheme);
    toast.success('Theme Updated');
  }

  const handleSetAccent = (newAccent: any) => {
    setAccent(newAccent);
    toast.success('Accent Color Updated');
  }

  const handleSetFont = (newFont: any) => {
    setFont(newFont);
    toast.success('Typography Updated');
  }

  const handleInstallClick = async () => {
    const success = await installApp();
    if (success) {
      toast.success('App installed successfully!');
    } else {
      toast.error('Installation could not be completed.');
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="px-2">
        <h2 className="text-xl font-black text-gray-900 dark:text-gray-100 leading-tight">{t('settings')}</h2>
        <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mt-1">{t('customizeExperience')}</p>
      </div>

      <div className="space-y-4 px-2">
        {/* Language */}
        <section className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <Languages className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100">{t('language')}</h3>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'en', label: 'English' },
              { id: 'hi', label: 'Hindi' },
              { id: 'hinglish', label: 'Hinglish' }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => handleSetLanguage(item.id as any)}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all active:scale-95",
                  language === item.id 
                    ? "bg-primary text-white border-primary shadow-md shadow-primary/20" 
                    : "bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-100 dark:border-gray-700"
                )}
              >
                <span className="text-[10px] font-black uppercase tracking-tighter">{item.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Dynamic Labels */}
        <section className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <Tag className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100">{t('billLabels')}</h3>
          </div>

          <div className="space-y-3">
            <form onSubmit={handleAddLabel} className="flex gap-2">
              <input 
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder={t('addLabelPlaceholder')}
                className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2 text-xs font-bold"
              />
              <button 
                type="submit"
                className="bg-primary text-white p-2 rounded-xl active:scale-95 transition-all"
              >
                <Plus className="w-5 h-5" />
              </button>
            </form>

            <div className="flex flex-wrap gap-2">
              {labels.map(label => (
                <div 
                  key={label}
                  className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 pl-3 pr-1 py-1 rounded-lg"
                >
                  <span className="text-[10px] font-black uppercase tracking-tighter text-gray-600 dark:text-gray-300">{label}</span>
                  <button 
                    onClick={() => handleRemoveLabel(label)}
                    className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Appearance */}
        <section className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <Palette className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100">{t('appearance')}</h3>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'light', icon: Sun, label: 'Light' },
              { id: 'dark', icon: Moon, label: 'Dark' },
              { id: 'system', icon: Monitor, label: 'System' }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => handleSetTheme(item.id as any)}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all active:scale-95",
                  theme === item.id 
                    ? "bg-primary text-white border-primary shadow-md shadow-primary/20" 
                    : "bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-100 dark:border-gray-700"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase tracking-tighter">{item.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Accent Color */}
        <section className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <Smartphone className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100">{t('accentColor')}</h3>
          </div>

          <div className="flex justify-between px-2">
            {[
              { id: 'orange', color: '#ea580c' },
              { id: 'blue', color: '#2563eb' },
              { id: 'green', color: '#16a34a' },
              { id: 'purple', color: '#9333ea' }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => handleSetAccent(item.id as any)}
                className={cn(
                  "w-10 h-10 rounded-full border-2 transition-all active:scale-90 flex items-center justify-center",
                  accent === item.id ? "border-gray-900" : "border-transparent"
                )}
                style={{ backgroundColor: item.color }}
              >
                {accent === item.id && <Check className="w-5 h-5 text-white" />}
              </button>
            ))}
          </div>
        </section>

        {/* Typography */}
        <section className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <Type className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100">{t('typography')}</h3>
          </div>

          <div className="space-y-2">
            {[
              { id: 'inter', label: 'Inter (Modern)', desc: 'Clean and readable' },
              { id: 'outfit', label: 'Outfit (Soft)', desc: 'Rounded and friendly' },
              { id: 'mono', label: 'Technical Mono', desc: 'Precise and professional' }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => handleSetFont(item.id as any)}
                className={cn(
                  "w-full flex items-center justify-between p-4 rounded-2xl border transition-all active:scale-[0.98]",
                  font === item.id 
                    ? "bg-primary/5 dark:bg-primary/20 border-primary/20 dark:border-primary/40" 
                    : "bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-800"
                )}
              >
                <div className="text-left">
                  <p className={cn("font-bold text-gray-900 dark:text-gray-100", item.id === 'mono' ? 'font-mono' : 'font-sans')}>
                    {item.label}
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{item.desc}</p>
                </div>
                {font === item.id && <Check className="w-5 h-5 text-primary" />}
              </button>
            ))}
          </div>
        </section>

        {/* PWA Installation */}
        <section className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <Download className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100">{t('installApp') || 'Install Web App'}</h3>
          </div>

          <div className="space-y-3">
            {isStandalone ? (
              <div className="bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 p-4 rounded-2xl border border-green-100 dark:border-green-905/40 text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <p>App is already installed and running in standalone mode!</p>
              </div>
            ) : isInstallable ? (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-3 leading-relaxed">
                  Install Baheti Billing App on your phone or desktop for instant access, stable offline billing, and a faster native experience directly from your home screen.
                </p>
                <button
                  onClick={handleInstallClick}
                  className="w-full bg-primary text-white py-3 px-4 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Install App Now
                </button>
              </div>
            ) : (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed mb-3">
                  For quick mobile or desktop operations, run this bill generator directly as a native application.
                </p>
                <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 p-4 rounded-2xl text-[10px] space-y-1.5 font-bold text-gray-500 dark:text-gray-400">
                  <p className="uppercase tracking-widest text-[9px] text-primary mb-1">Easy Launcher Steps:</p>
                  <p className="flex items-start gap-1">
                    <span className="text-primary font-bold">•</span> iOS Safari: Tap the <span className="text-gray-700 dark:text-gray-200">Share Arrow</span>, then scroll and select <span className="text-gray-700 dark:text-gray-200">"Add to Home Screen"</span>.
                  </p>
                  <p className="flex items-start gap-1">
                    <span className="text-primary font-bold">•</span> Chrome/Desktop: Look for the <span className="text-gray-700 dark:text-gray-200">"Install" icon</span> inside the address bar, or open your browser config menu and select install.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Info */}
        <section className="bg-primary/5 dark:bg-primary/10 rounded-3xl p-5 border border-primary/10 dark:border-primary/20 flex gap-4">
          <Info className="w-5 h-5 text-primary/40 dark:text-primary/60 shrink-0" />
          <div>
            <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">{t('aboutApp')}</p>
            <p className="text-[10px] text-primary/60 dark:text-primary/40 font-medium leading-relaxed">
              Baheti Billing System v2.0. Built for fast mobile bill generation and catalog management.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SettingsPage;
