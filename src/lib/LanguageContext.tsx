
import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { translations, LanguageCode } from './translations';

interface LanguageContextType {
  t: (key: keyof typeof translations['en']) => string;
  language: LanguageCode;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const { profile } = useAuth();
  const language = (profile?.language as LanguageCode) || 'en';

  const t = (key: keyof typeof translations['en']): string => {
    const dict = translations[language] || translations['en'];
    return (dict as any)[key] || (translations['en'] as any)[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ t, language }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
