import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

type Theme = 'light' | 'dark' | 'system';
type AccentColor = 'orange' | 'blue' | 'green' | 'purple';
type FontType = 'inter' | 'outfit' | 'mono';
type Language = 'en' | 'hi' | 'hinglish';

interface SettingsContextType {
  theme: Theme;
  accent: AccentColor;
  font: FontType;
  language: Language;
  labels: string[];
  logoUrl: string;
  setTheme: (t: Theme) => void;
  setAccent: (a: AccentColor) => void;
  setFont: (f: FontType) => void;
  setLanguage: (l: Language) => void;
  setLogoUrl: (url: string) => void;
  addLabel: (l: string) => void;
  removeLabel: (l: string) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('billing-theme') as Theme) || 'system');
  const [accent, setAccent] = useState<AccentColor>(() => (localStorage.getItem('billing-accent') as AccentColor) || 'orange');
  const [font, setFont] = useState<FontType>(() => (localStorage.getItem('billing-font') as FontType) || 'inter');
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('billing-lang') as Language) || 'en');
  const [logoUrl, setLogoUrl] = useState<string>(() => localStorage.getItem('billing-logo-url') || '');
  const [labels, setLabels] = useState<string[]>(() => {
    const saved = localStorage.getItem('billing-labels');
    return saved ? JSON.parse(saved) : ['pending', 'done', 'bank'];
  });

  // Real-time synchronization from Firestore database setting
  useEffect(() => {
    const docRef = doc(db, 'settings', 'branding');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (typeof data.logoUrl === 'string') {
          setLogoUrl(data.logoUrl);
        }
      }
    }, (error) => {
      console.warn("Firestore settings read rejected or offline:", error);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    localStorage.setItem('billing-lang', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('billing-logo-url', logoUrl);
  }, [logoUrl]);

  useEffect(() => {
    localStorage.setItem('billing-labels', JSON.stringify(labels));
  }, [labels]);

  useEffect(() => {
    localStorage.setItem('billing-theme', theme);
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    
    let resolvedTheme = theme;
    if (theme === 'system') {
      resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    root.classList.add(resolvedTheme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('billing-accent', accent);
    const colors: Record<AccentColor, string> = {
      orange: '#ea580c',
      blue: '#2563eb',
      green: '#16a34a',
      purple: '#9333ea'
    };
    const shadows: Record<AccentColor, string> = {
      orange: 'rgba(234, 88, 12, 0.2)',
      blue: 'rgba(37, 99, 235, 0.2)',
      green: 'rgba(22, 163, 74, 0.2)',
      purple: 'rgba(147, 51, 234, 0.2)'
    };
    document.documentElement.style.setProperty('--primary', colors[accent]);
    document.documentElement.style.setProperty('--primary-shadow', shadows[accent]);
  }, [accent]);

  useEffect(() => {
    localStorage.setItem('billing-font', font);
    const fonts: Record<FontType, string> = {
      inter: '"Inter", sans-serif',
      outfit: '"Outfit", sans-serif',
      mono: '"JetBrains Mono", monospace'
    };
    document.documentElement.style.setProperty('--font-family', fonts[font]);
  }, [font]);

  const updateLogoUrl = async (url: string) => {
    const trimmed = url.trim();
    setLogoUrl(trimmed);
    localStorage.setItem('billing-logo-url', trimmed);
    try {
      await setDoc(doc(db, 'settings', 'branding'), { logoUrl: trimmed }, { merge: true });
    } catch (e) {
      console.error("Failed to persist brand logo to Firestore settings collection:", e);
    }
  };

  const addLabel = (l: string) => {
    if (!labels.includes(l)) {
      setLabels([...labels, l]);
    }
  };

  const removeLabel = (l: string) => {
    setLabels(labels.filter(label => label !== l));
  };

  return (
    <SettingsContext.Provider value={{ theme, accent, font, language, labels, logoUrl, setTheme, setAccent, setFont, setLanguage, setLogoUrl: updateLogoUrl, addLabel, removeLabel }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
};
