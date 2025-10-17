import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CurrencySettings {
  currency: 'EUR' | 'USD' | 'GBP' | 'CAD' | 'AUD';
  symbol: string;
  format: (amount: number) => string;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  CAD: 'CA$',
  AUD: 'A$',
};

export function useCurrency(dentistId?: string) {
  const [settings, setSettings] = useState<CurrencySettings>({
    currency: 'EUR',
    symbol: '€',
    format: (amount: number) => `€${amount.toFixed(2)}`,
  });

  useEffect(() => {
    if (dentistId) {
      loadCurrencySettings();
    }
  }, [dentistId]);

  const loadCurrencySettings = async () => {
    if (!dentistId) return;

    try {
      const { data, error } = await supabase
        .from('clinic_settings')
        .select('currency')
        .eq('dentist_id', dentistId)
        .maybeSingle();

      if (error) throw error;

      const currency = data?.currency || 'EUR';
      const symbol = CURRENCY_SYMBOLS[currency] || '€';

      setSettings({
        currency: currency as any,
        symbol,
        format: (amount: number) => {
          // Format based on currency locale
          const locale = currency === 'EUR' ? 'de-DE' : 
                        currency === 'GBP' ? 'en-GB' :
                        currency === 'USD' ? 'en-US' :
                        currency === 'CAD' ? 'en-CA' :
                        'en-AU';
          
          return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency,
          }).format(amount);
        },
      });
    } catch (error) {
      console.error('Error loading currency settings:', error);
    }
  };

  const updateCurrency = async (currency: CurrencySettings['currency']) => {
    if (!dentistId) return;

    try {
      const { error } = await supabase
        .from('clinic_settings')
        .upsert({
          dentist_id: dentistId,
          currency: currency,
        }, {
          onConflict: 'dentist_id',
        });

      if (error) throw error;

      const symbol = CURRENCY_SYMBOLS[currency] || '€';
      setSettings({
        currency,
        symbol,
        format: (amount: number) => {
          const locale = currency === 'EUR' ? 'de-DE' : 
                        currency === 'GBP' ? 'en-GB' :
                        currency === 'USD' ? 'en-US' :
                        currency === 'CAD' ? 'en-CA' :
                        'en-AU';
          
          return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency,
          }).format(amount);
        },
      });
    } catch (error) {
      console.error('Error updating currency:', error);
      throw error;
    }
  };

  return { settings, updateCurrency };
}
