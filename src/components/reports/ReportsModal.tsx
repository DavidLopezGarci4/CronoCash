import React, { useState, useMemo } from 'react';
import {
  X,
  FileText,
  Calendar,
  Download,
  Share2,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Layers,
  Receipt,
  Loader2,
  Building2,
  TrendingUp,
  Percent,
} from 'lucide-react';
import { Expense, Bucket, Settings, SavingsGoal, Quarter } from '../../types';
import { TaxService } from '../../services/taxService';
import { PdfReportService } from '../../services/pdfReportService';

interface ReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: Expense[];
  buckets: Bucket[];
  settings: Settings;
  goals: SavingsGoal[];
  currency?: string;
}

export const ReportsModal: React.FC<ReportsModalProps> = ({
  isOpen,
  onClose,
  expenses,
  buckets,
  settings,
  goals,
  currency = '€',
}) => {
  const [activeTab, setActiveTab] = useState<'monthly' | 'tax'>('monthly');

  // Estado para el informe mensual
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1); // 1-12
  const [isGeneratingMonthlyPdf, setIsGeneratingMonthlyPdf] = useState(false);

  // Estado para el cuadro fiscal trimestral
  const [taxQuarter, setTaxQuarter] = useState<Quarter>(() => {
    const m = currentDate.getMonth() + 1;
    if (m <= 3) return 1;
    if (m <= 6) return 2;
    if (m <= 9) return 3;
    return 4;
  });
  const [taxYear, setTaxYear] = useState<number>(currentDate.getFullYear());
  const [isGeneratingTaxPdf, setIsGeneratingTaxPdf] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Cálculo del prefijo de mes YYYY-MM
  const monthStr = useMemo(() => {
    return `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  }, [selectedYear, selectedMonth]);

  // Cálculos del informe mensual
  const monthlyData = useMemo(() => {
    const monthExpenses = expenses.filter((e) => (e.date || '').startsWith(monthStr));
    const monthlyIncome = settings.monthlyIncome || 0;
    const totalExpenses = Math.round(
      monthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0) * 100
    ) / 100;
    const netBalance = Math.round((monthlyIncome - totalExpenses) * 100) / 100;
    const savingsRate = monthlyIncome > 0
      ? Math.max(0, Math.round(((monthlyIncome - totalExpenses) / monthlyIncome) * 1000) / 10)
      : 0;

    // Resumen por bolsas
    const bucketBreakdown = buckets.map((b) => {
      const spent = Math.round(
        monthExpenses
          .filter((e) => e.bucketId === b.id)
          .reduce((sum, e) => sum + (e.amount || 0), 0) * 100
      ) / 100;
      const limit = b.budgetLimit || 0;
      const pct = limit > 0 ? Math.round((spent / limit) * 100) : (spent > 0 ? 100 : 0);
      const remaining = limit - spent;
      return {
        bucket: b,
        spent,
        limit,
        pct,
        remaining,
      };
    });

    return {
      monthExpenses,
      monthlyIncome,
      totalExpenses,
      netBalance,
      savingsRate,
      bucketBreakdown,
    };
  }, [expenses, buckets, settings.monthlyIncome, monthStr]);

  // Cálculos del informe fiscal trimestral
  const taxReport = useMemo(() => {
    return TaxService.calculateQuarterTax(expenses, settings, taxQuarter, taxYear);
  }, [expenses, settings, taxQuarter, taxYear]);

  // Nombres de los meses en español
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];

  if (!isOpen) return null;

  const showFeedback = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 3500);
  };

  // Generar y descargar PDF Mensual
  const handleDownloadMonthlyPdf = async () => {
    try {
      setIsGeneratingMonthlyPdf(true);
      const blob = await PdfReportService.generateMonthlyReport(
        expenses,
        buckets,
        settings,
        goals,
        monthStr
      );
      const filename = `CronoCash-Informe-${monthStr}.pdf`;
      await PdfReportService.shareOrDownloadPdf(blob, filename);
      showFeedback('Informe mensual generado y listo.');
    } catch (err) {
      console.error('Error generando informe mensual PDF:', err);
      showFeedback('Error al generar el PDF del informe.');
    } finally {
      setIsGeneratingMonthlyPdf(false);
    }
  };

  // Generar y descargar PDF Fiscal
  const handleDownloadTaxPdf = async () => {
    try {
      setIsGeneratingTaxPdf(true);
      const blob = await PdfReportService.generateQuarterlyTaxReport(taxReport, settings);
      const filename = `CronoCash-Fiscal-${taxQuarter}T-${taxYear}.pdf`;
      await PdfReportService.shareOrDownloadPdf(blob, filename);
      showFeedback('Informe fiscal trimestral generado correctamente.');
    } catch (err) {
      console.error('Error generando PDF fiscal:', err);
      showFeedback('Error al generar el PDF fiscal.');
    } finally {
      setIsGeneratingTaxPdf(false);
    }
  };

  // Exportar CSV del libro registro
  const handleExportCsv = async () => {
    try {
      setIsExportingCsv(true);
      const csv = TaxService.exportTaxCsv(taxReport, settings);
      const filename = `Libro-Facturas-${taxQuarter}T-${taxYear}.csv`;
      await PdfReportService.shareOrDownloadCsv(csv, filename);
      showFeedback('Libro de facturas en CSV exportado con éxito.');
    } catch (err) {
      console.error('Error exportando libro de facturas:', err);
      showFeedback('Error al exportar el archivo CSV.');
    } finally {
      setIsExportingCsv(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-2xl overflow-hidden">
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 text-blue-400 border border-blue-500/30">
              <FileText className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Informes & Fiscalidad
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold">
                  v1.12.0
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Informes ejecutivos en PDF de alta dirección y liquidación trimestral AEAT
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notificación Toast de feedback */}
        {actionFeedback && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/30 px-4 py-2 flex items-center gap-2 text-emerald-300 text-xs font-semibold animate-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionFeedback}</span>
          </div>
        )}

        {/* Barra de Pestañas */}
        <div className="grid grid-cols-2 border-b border-slate-800 bg-slate-950/60 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('monthly')}
            className={`py-2.5 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'monthly'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Informe Ejecutivo Mensual</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tax')}
            className={`py-2.5 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'tax'
                ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg shadow-teal-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Cuadro Fiscal Trimestral (130 / 303)</span>
          </button>
        </div>

        {/* Contenido Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* ============================================================== */}
          {/* PESTAÑA 1: INFORME EJECUTIVO MENSUAL                           */}
          {/* ============================================================== */}
          {activeTab === 'monthly' && (
            <div className="space-y-6">
              {/* Filtro Selector de Mes y Año */}
              <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Periodo del Informe:
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    {monthNames.map((name, idx) => (
                      <option key={name} value={idx + 1}>
                        {name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    {[2024, 2025, 2026, 2027, 2028].map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Cuadrícula de KPIs Mensuales */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Ingresos Mes
                  </span>
                  <span className="text-base sm:text-lg font-mono font-black text-emerald-400">
                    {monthlyData.monthlyIncome.toFixed(2)} {currency}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Gastos Computados
                  </span>
                  <span className="text-base sm:text-lg font-mono font-black text-rose-400">
                    {monthlyData.totalExpenses.toFixed(2)} {currency}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Balance Neto
                  </span>
                  <span
                    className={`text-base sm:text-lg font-mono font-black ${
                      monthlyData.netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {monthlyData.netBalance >= 0 ? '+' : ''}
                    {monthlyData.netBalance.toFixed(2)} {currency}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Tasa de Ahorro
                  </span>
                  <span className="text-base sm:text-lg font-mono font-black text-blue-400">
                    {monthlyData.savingsRate.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Desglose Previo por Bolsas */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-400" />
                    <span>Consumo por Bolsas Financieras</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    {monthlyData.monthExpenses.length} transacciones
                  </span>
                </div>

                <div className="space-y-2">
                  {monthlyData.bucketBreakdown.map((item) => (
                    <div
                      key={item.bucket.id}
                      className="p-3 rounded-2xl bg-slate-800/30 border border-slate-800 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: item.bucket.color || '#3b82f6' }}
                          />
                          <span className="font-bold text-white">{item.bucket.name}</span>
                        </div>
                        <div className="font-mono text-xs">
                          <span className="text-slate-200 font-bold">{item.spent.toFixed(2)}</span>
                          <span className="text-slate-500"> / {item.limit.toFixed(2)} {currency}</span>
                          <span
                            className={`ml-2 font-bold ${
                              item.pct > 100
                                ? 'text-rose-400'
                                : item.pct > 85
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                            }`}
                          >
                            ({item.pct}%)
                          </span>
                        </div>
                      </div>

                      {/* Barra de progreso */}
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            item.pct > 100
                              ? 'bg-rose-500'
                              : item.pct > 85
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, item.pct)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botón Heroico de Descarga / Compartir PDF */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleDownloadMonthlyPdf}
                  disabled={isGeneratingMonthlyPdf}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm flex items-center justify-center gap-3 shadow-xl shadow-blue-600/25 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingMonthlyPdf ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Generando Informe Ejecutivo PDF...</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-5 h-5" />
                      <span>Descargar / Compartir Informe PDF ({monthNames[selectedMonth - 1]} {selectedYear})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* PESTAÑA 2: CUADRO FISCAL TRIMESTRAL (MOD. 130 / 303)           */}
          {/* ============================================================== */}
          {activeTab === 'tax' && (
            <div className="space-y-6">
              {/* Selector de Trimestre y Año */}
              <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-teal-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Periodo Impositivo:
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Selector 1T, 2T, 3T, 4T */}
                  <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-700">
                    {([1, 2, 3, 4] as Quarter[]).map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setTaxQuarter(q)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          taxQuarter === q
                            ? 'bg-teal-500 text-slate-950 font-black shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {q}T
                      </button>
                    ))}
                  </div>

                  <select
                    value={taxYear}
                    onChange={(e) => setTaxYear(Number(e.target.value))}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                  >
                    {[2024, 2025, 2026, 2027, 2028].map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Banner Semafórico de Plazo Oficial AEAT */}
              <div
                className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
                  taxReport.isDeadlinePassed
                    ? 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                    : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                }`}
              >
                <div className="p-2 rounded-xl bg-slate-900/60 shrink-0">
                  {taxReport.isDeadlinePassed ? (
                    <AlertTriangle className="w-5 h-5 text-rose-400" />
                  ) : (
                    <Clock className="w-5 h-5 text-emerald-400" />
                  )}
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider">
                      {taxReport.isDeadlinePassed
                        ? 'Plazo Oficial AEAT Vencido'
                        : 'Plazo Oficial AEAT en Vigor'}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900/80 font-bold">
                      Límite: {taxReport.deadlineDate}
                    </span>
                  </div>
                  <p className="text-xs opacity-90">
                    {taxReport.isDeadlinePassed
                      ? `La fecha oficial para liquidar el ${taxQuarter}T expiró. Presentar fuera de plazo puede implicar recargos automáticos.`
                      : `Restan ${taxReport.daysUntilDeadline} días naturales para presentar los Modelos 130 y 303 sin recargos.`}
                  </p>
                </div>
              </div>

              {/* Tarjetas de Modelos 130 y 303 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tarjeta Modelo 130 (IRPF) */}
                <div className="p-4 rounded-3xl bg-slate-800/40 border border-indigo-500/30 space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider text-indigo-300">
                        Modelo 130 (IRPF)
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold">
                      Pago Fracc. 20%
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Ingresos brutos (3 meses):</span>
                      <span className="font-mono text-white font-bold">
                        {taxReport.grossIncome.toFixed(2)} {currency}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Gastos deducibles oficiales:</span>
                      <span className="font-mono text-rose-300 font-bold">
                        -{taxReport.deductibleExpenses.toFixed(2)} {currency}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Rendimiento neto:</span>
                      <span className="font-mono text-white font-bold">
                        {taxReport.netYield.toFixed(2)} {currency}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">A Ingresar (Casilla 07):</span>
                    <span className="text-lg font-mono font-black text-indigo-400">
                      {taxReport.model130EstimatedTax.toFixed(2)} {currency}
                    </span>
                  </div>
                </div>

                {/* Tarjeta Modelo 303 (IVA) */}
                <div className="p-4 rounded-3xl bg-slate-800/40 border border-teal-500/30 space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider text-teal-300">
                        Modelo 303 (IVA)
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-bold">
                      Autoliquidación
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>IVA Repercutido (21%):</span>
                      <span className="font-mono text-white font-bold">
                        {taxReport.ivaRepercutido.toFixed(2)} {currency}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>IVA Soportado en Facturas:</span>
                      <span className="font-mono text-emerald-300 font-bold">
                        -{taxReport.ivaSoportado.toFixed(2)} {currency}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Facturas deducibles:</span>
                      <span className="font-mono text-slate-200">
                        {taxReport.invoiceCount} facturas
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">
                      {taxReport.model303Result >= 0 ? 'Resultado (A Ingresar):' : 'Resultado (A Compensar):'}
                    </span>
                    <span
                      className={`text-lg font-mono font-black ${
                        taxReport.model303Result >= 0 ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                    >
                      {Math.abs(taxReport.model303Result).toFixed(2)} {currency}
                    </span>
                  </div>
                </div>
              </div>

              {/* Previa de Facturas Computadas */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-teal-400" />
                    <span>Facturas Deducibles Computadas ({taxReport.invoices.length})</span>
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400">
                    Total: {taxReport.deductibleExpenses.toFixed(2)} {currency}
                  </span>
                </div>

                <div className="max-h-48 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950/40">
                  {taxReport.invoices.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500 italic">
                      No hay facturas desgravables marcadas en este trimestre.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900/90 text-slate-400 font-bold uppercase text-[10px] sticky top-0 border-b border-slate-800">
                        <tr>
                          <th className="p-2.5">Fecha</th>
                          <th className="p-2.5">Nº Factura</th>
                          <th className="p-2.5">Proveedor</th>
                          <th className="p-2.5">Concepto</th>
                          <th className="p-2.5 text-right">IVA</th>
                          <th className="p-2.5 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                        {taxReport.invoices.map((inv) => {
                          const { taxAmount } = TaxService.getExpenseTaxAmount(inv);
                          return (
                            <tr key={inv.id} className="hover:bg-slate-800/30">
                              <td className="p-2.5 text-slate-400">{inv.date}</td>
                              <td className="p-2.5 text-slate-300 font-bold">{inv.invoiceNumber || 'S/N'}</td>
                              <td className="p-2.5 text-slate-300 font-sans">{inv.supplier || 'Varios'}</td>
                              <td className="p-2.5 text-slate-400 font-sans truncate max-w-[120px]">{inv.title}</td>
                              <td className="p-2.5 text-right text-emerald-400 font-bold">{taxAmount.toFixed(2)}</td>
                              <td className="p-2.5 text-right text-white font-bold">{inv.amount.toFixed(2)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Botones de Acción Fiscal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDownloadTaxPdf}
                  disabled={isGeneratingTaxPdf}
                  className="py-3.5 px-4 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-teal-600/25 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingTaxPdf ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generando PDF Fiscal...</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      <span>Exportar Informe Fiscal PDF ({taxQuarter}T-{taxYear})</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleExportCsv}
                  disabled={isExportingCsv}
                  className="py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
                >
                  {isExportingCsv ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
                      <span>Exportando CSV...</span>
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-4 h-4 text-teal-400" />
                      <span>Descargar Libro de Facturas (CSV)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
