/**
 * Utilidad universal de formateo monetario para CronoCash.
 * Garantiza que la cifra y la divisa permanezcan siempre unidas de forma indivisible
 * utilizando el espacio no separable de Unicode (\u00A0) y previniendo saltos de línea (soft-wrap).
 */

export interface FormatCurrencyOptions {
  decimals?: number;
  showSign?: boolean;
  prefix?: string;
  isPrivate?: boolean;
}

/**
 * Formatea un importe y su divisa con espacio indivisible (\u00A0 - NO-BREAK SPACE).
 * Ejemplo: formatCurrency(49.51, '€') => "49.51 €" (inseparable)
 */
export function formatCurrency(
  amount: number | string | undefined | null,
  currency: string = '€',
  options?: FormatCurrencyOptions
): string {
  if (options?.isPrivate) {
    return `••••\u00A0${currency}`;
  }

  const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount ?? 0);
  if (isNaN(num)) {
    return `0.00\u00A0${currency}`;
  }

  const decimals = options?.decimals ?? 2;
  const prefix = options?.prefix ?? '';
  const sign = options?.showSign && num > 0 ? '+' : '';

  return `${prefix}${sign}${num.toFixed(decimals)}\u00A0${currency}`;
}

/**
 * Devuelve un importe negativo con espacio indivisible para gastos ejecutados.
 * Ejemplo: formatNegativeExpense(49.51, '€') => "-49.51 €"
 */
export function formatNegativeExpense(
  amount: number | string | undefined | null,
  currency: string = '€',
  isPrivate?: boolean
): string {
  if (isPrivate) {
    return `-••••\u00A0${currency}`;
  }
  const num = Math.abs(typeof amount === 'string' ? parseFloat(amount) : Number(amount ?? 0));
  return `-${num.toFixed(2)}\u00A0${currency}`;
}
