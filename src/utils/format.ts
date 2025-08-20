import i18n from '@/i18n';

export const formatDate = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(i18n.language).format(d);
};

export const formatCurrency = (amount: number, currency = 'EUR') => {
  return new Intl.NumberFormat(i18n.language, {
    style: 'currency',
    currency
  }).format(amount);
};
