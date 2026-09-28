import React, { createContext, useContext, useState, useEffect } from 'react';
import { HapticService } from '../services/hapticService';

interface PrivacyContextType {
  isPrivate: boolean;
  togglePrivacy: () => void;
  setPrivacy: (enabled: boolean) => void;
  mask: (amount: number | string, currency?: string, decimals?: number) => string;
  maskRaw: (text: string) => string;
}

const PrivacyContext = createContext<PrivacyContextType>({
  isPrivate: false,
  togglePrivacy: () => {},
  setPrivacy: () => {},
  mask: (amount, currency = '€') => `${amount} ${currency}`,
  maskRaw: (text) => text,
});

export const PrivacyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPrivate, setIsPrivateState] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem('cronocash_privacy_mode') === 'true';
      }
    } catch {
      // Fallback
    }
    return false;
  });

  const setPrivacy = (enabled: boolean) => {
    setIsPrivateState(enabled);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('cronocash_privacy_mode', enabled ? 'true' : 'false');
      }
    } catch {
      // Fallback
    }
  };

  const togglePrivacy = () => {
    HapticService.selection();
    setPrivacy(!isPrivate);
  };

  const mask = (amount: number | string, currency = '€', decimals = 2): string => {
    if (isPrivate) {
      return currency ? `•••• ${currency}` : '••••';
    }
    const num = typeof amount === 'number' ? amount : parseFloat(amount);
    if (isNaN(num)) {
      return `${amount} ${currency}`.trim();
    }
    return `${num.toFixed(decimals)} ${currency}`.trim();
  };

  const maskRaw = (text: string): string => {
    if (isPrivate) return '••••';
    return text;
  };

  return (
    <PrivacyContext.Provider
      value={{
        isPrivate,
        togglePrivacy,
        setPrivacy,
        mask,
        maskRaw,
      }}
    >
      {children}
    </PrivacyContext.Provider>
  );
};

export const usePrivacy = (): PrivacyContextType => useContext(PrivacyContext);
