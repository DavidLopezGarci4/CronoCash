import { Expense, Settings, Quarter, TaxReport } from '../types';

export class TaxService {
  /**
   * Obtiene las fechas de inicio, fin y plazo límite de presentación oficial en la AEAT
   */
  static getQuarterDateRange(quarter: Quarter, year: number): {
    startDate: string;
    endDate: string;
    deadlineDate: string;
  } {
    switch (quarter) {
      case 1:
        return {
          startDate: `${year}-01-01`,
          endDate: `${year}-03-31`,
          deadlineDate: `${year}-04-20`,
        };
      case 2:
        return {
          startDate: `${year}-04-01`,
          endDate: `${year}-06-30`,
          deadlineDate: `${year}-07-20`,
        };
      case 3:
        return {
          startDate: `${year}-07-01`,
          endDate: `${year}-09-30`,
          deadlineDate: `${year}-10-20`,
        };
      case 4:
        return {
          startDate: `${year}-10-01`,
          endDate: `${year}-12-31`,
          deadlineDate: `${year + 1}-01-30`,
        };
    }
  }

  /**
   * Calcula el IVA soportado individual para un gasto deducible
   */
  static getExpenseTaxAmount(expense: Expense): { baseAmount: number; taxRate: number; taxAmount: number } {
    const total = expense.amount || 0;
    if (total <= 0) {
      return { baseAmount: 0, taxRate: 0, taxAmount: 0 };
    }

    if (expense.taxAmount !== undefined && expense.taxAmount !== null && !isNaN(expense.taxAmount) && expense.taxAmount > 0) {
      const taxAmount = Math.round(expense.taxAmount * 100) / 100;
      const baseAmount = Math.max(0, Math.round((total - taxAmount) * 100) / 100);
      const rate = baseAmount > 0 ? Math.round((taxAmount / baseAmount) * 100) : (expense.taxRate ?? 21);
      return { baseAmount, taxRate: rate, taxAmount };
    }

    const rate = expense.taxRate !== undefined && expense.taxRate !== null && !isNaN(expense.taxRate)
      ? expense.taxRate
      : 21;

    const rateFraction = rate / 100;
    const baseAmount = Math.round((total / (1 + rateFraction)) * 100) / 100;
    const taxAmount = Math.max(0, Math.round((total - baseAmount) * 100) / 100);

    return { baseAmount, taxRate: rate, taxAmount };
  }

  /**
   * Genera el informe y cálculo fiscal completo para el trimestre seleccionado
   */
  static calculateQuarterTax(
    expenses: Expense[],
    settings: Settings,
    quarter: Quarter,
    year: number,
    referenceDate = new Date()
  ): TaxReport {
    const { startDate, endDate, deadlineDate } = this.getQuarterDateRange(quarter, year);

    // Calcular días restantes y vencimiento
    const deadlineObj = new Date(`${deadlineDate}T23:59:59`);
    const nowObj = referenceDate;
    const isDeadlinePassed = nowObj.getTime() > deadlineObj.getTime();
    const daysUntilDeadline = isDeadlinePassed
      ? 0
      : Math.max(0, Math.ceil((deadlineObj.getTime() - nowObj.getTime()) / (1000 * 60 * 60 * 24)));

    // Filtrar gastos dentro de la ventana trimestral
    const quarterExpenses = expenses.filter((e) => {
      const d = (e.date || '').split('T')[0];
      return d >= startDate && d <= endDate;
    });

    const invoices = quarterExpenses
      .filter((e) => Boolean(e.isInvoice))
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    const nonInvoices = quarterExpenses.filter((e) => !e.isInvoice);

    const deductibleExpenses = Math.round(
      invoices.reduce((sum, e) => sum + (e.amount || 0), 0) * 100
    ) / 100;

    const nonDeductibleExpenses = Math.round(
      nonInvoices.reduce((sum, e) => sum + (e.amount || 0), 0) * 100
    ) / 100;

    // Ingresos brutos estimados del trimestre (3 meses de facturación)
    const monthlyIncome = settings.monthlyIncome || 0;
    const grossIncome = Math.round(monthlyIncome * 3 * 100) / 100;

    // Rendimiento Neto para el Modelo 130
    const netYield = Math.round((grossIncome - deductibleExpenses) * 100) / 100;
    const model130EstimatedTax = Math.max(0, Math.round(netYield * 0.20 * 100) / 100);

    // IVA para el Modelo 303 (Repercutido vs Soportado)
    const ivaRepercutido = Math.round(grossIncome * 0.21 * 100) / 100;
    const ivaSoportado = Math.round(
      invoices.reduce((sum, inv) => {
        const { taxAmount } = this.getExpenseTaxAmount(inv);
        return sum + taxAmount;
      }, 0) * 100
    ) / 100;

    const model303Result = Math.round((ivaRepercutido - ivaSoportado) * 100) / 100;

    return {
      quarter,
      year,
      startDate,
      endDate,
      deadlineDate,
      daysUntilDeadline,
      isDeadlinePassed,
      grossIncome,
      deductibleExpenses,
      nonDeductibleExpenses,
      netYield,
      model130EstimatedTax,
      ivaRepercutido,
      ivaSoportado,
      model303Result,
      invoiceCount: invoices.length,
      invoices,
    };
  }

  /**
   * Exporta el libro registro oficial de facturas recibidas en formato CSV compatible con Excel y software contable
   */
  static exportTaxCsv(taxReport: TaxReport, settings: Settings): string {
    const sanitize = (val: string | number | undefined | null) => {
      const s = String(val ?? '').replace(/"/g, '""');
      return `"${s}"`;
    };

    const header = [
      'Fecha',
      'Nº Factura',
      'Proveedor / Emisor',
      'Concepto',
      'Base Imponible',
      'Tipo IVA (%)',
      'Cuota IVA',
      'Total',
    ].map(sanitize).join(';');

    let sumBase = 0;
    let sumTax = 0;
    let sumTotal = 0;

    const rows = taxReport.invoices.map((inv) => {
      const { baseAmount, taxRate, taxAmount } = this.getExpenseTaxAmount(inv);
      sumBase += baseAmount;
      sumTax += taxAmount;
      sumTotal += inv.amount || 0;

      return [
        sanitize(inv.date || ''),
        sanitize(inv.invoiceNumber || 'S/N'),
        sanitize(inv.supplier || 'Varios / No especificado'),
        sanitize(inv.title || ''),
        sanitize(baseAmount.toFixed(2)),
        sanitize(`${taxRate}%`),
        sanitize(taxAmount.toFixed(2)),
        sanitize((inv.amount || 0).toFixed(2)),
      ].join(';');
    });

    const summaryRow = [
      sanitize('TOTALES CONSOLIDADOS'),
      sanitize(''),
      sanitize(`${settings.companyName || settings.userFullName || 'CronoCash'}`),
      sanitize(`Trimestre ${taxReport.quarter}T-${taxReport.year}`),
      sanitize(sumBase.toFixed(2)),
      sanitize(''),
      sanitize(sumTax.toFixed(2)),
      sanitize(sumTotal.toFixed(2)),
    ].join(';');

    // \uFEFF añade el Byte Order Mark UTF-8 para que Excel lo abra con tildes y caracteres especiales correctos
    return '\uFEFF' + [header, ...rows, summaryRow].join('\r\n');
  }
}
