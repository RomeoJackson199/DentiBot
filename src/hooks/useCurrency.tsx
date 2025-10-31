import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from '@/lib/logger';

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
    loadCurrencySettings();
  }, [dentistId]);

  const loadCurrencySettings = async () => {
    try {
      // Get current business context from session_business
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSettings({
          currency: 'EUR',
          symbol: '€',
          format: (amount: number) => `€${amount.toFixed(2)}`,
        });
        return;
      }

      const { data: sessionBusiness } = await supabase
        .from('session_business')
        .select('business_id')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (sessionBusiness?.business_id) {
        const { data: business } = await supabase
          .from('businesses')
          .select('currency')
          .eq('id', sessionBusiness.business_id)
          .maybeSingle();

        const currencyCode = business?.currency || 'EUR';
        const symbol = CURRENCY_SYMBOLS[currencyCode] || '€';

        setSettings({
          currency: currencyCode as any,
          symbol,
          format: (amount: number) => {
            const locale = currencyCode === 'EUR' ? 'de-DE' : 
                          currencyCode === 'GBP' ? 'en-GB' :
                          currencyCode === 'USD' ? 'en-US' :
                          currencyCode === 'CAD' ? 'en-CA' :
                          'en-AU';
            
            return new Intl.NumberFormat(locale, {
              style: 'currency',
              currency: currencyCode,
            }).format(amount);
          },
        });
        return;
      }

      // Fallback
      setSettings({
        currency: 'EUR',
        symbol: '€',
        format: (amount: number) => `€${amount.toFixed(2)}`,
      });
    } catch (error) {
      logger.error('Error loading currency settings:', error);
      setSettings({
        currency: 'EUR',
        symbol: '€',
        format: (amount: number) => `€${amount.toFixed(2)}`,
      });
    }
  };

  const updateCurrency = async (currency: CurrencySettings['currency']) => {
    try {
      // Get current business context from session
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: sessionBusiness, error: sessionError } = await supabase
        .from('session_business')
        .select('business_id')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (sessionError) throw sessionError;
      const businessId = sessionBusiness?.business_id;
      if (!businessId) throw new Error('No business selected');

      const { error } = await supabase
        .from('businesses')
        .update({ currency })
        .eq('id', businessId);

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
      logger.error('Error updating currency:', error);
      throw error;
    }
  };

  return { settings, updateCurrency };
}
