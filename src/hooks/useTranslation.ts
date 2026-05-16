import { useSettings } from '../context/SettingsContext';
import { translations, TranslationKey } from '../translations';

export const useTranslation = () => {
  const { language } = useSettings();
  
  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations.en[key];
  };

  return { t, language };
};
