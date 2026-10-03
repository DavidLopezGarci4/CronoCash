import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Filter,
  Layers,
  ChevronDown,
  RotateCcw,
  Check,
  ShieldAlert,
  Loader2,
  Building,
  Coins,
  ArrowRightLeft,
  TrendingUp,
  Repeat,
} from 'lucide-react';
import { Expense, Bucket, SmartRule, ExtraIncome } from '../../types';
import {
  CsvImporterService,
  AnalyzedTransaction,
  BatchAnalysisResult,
  resolveTargetSalaryMonth,
  formatMonthName,
} from '../../services/csvImporterService';
import { DBService } from '../../services/db';
import { AuthService } from '../../services/auth';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: Expense[];
  buckets: Bucket[];
  rules: SmartRule[];
  currency: string;
  onImportComplete: () => void;
  onOpenRulesManager?: () => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  expenses,
  buckets,
  rules,
  currency,
  onImportComplete,
  onOpenRulesManager,
}) => {
  const [step, setStep] = useState<'upload' | 'review'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const [transactions, setTransactions] = useState<AnalyzedTransaction[]>([]);
  const [filterView, setFilterView] = useState<'all' | 'valid' | 'matched' | 'duplicates'>('all');
  const [saveAsRules, setSaveAsRules] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importSummary, setImportSummary] = useState<{ imported: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const handleFocus = () => {
      setTimeout(() => {
        AuthService.setPickingFile(false);
      }, 1200);
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  if (!isOpen) return null;

  const handleProcessFile = async (file: File) => {
    try {
      setIsProcessing(true);
      setFileName(file.name);

      let rawRows = [];
      const lowerName = file.name.toLowerCase();

      if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
        const buffer = await file.arrayBuffer();
        rawRows = CsvImporterService.parseExcel(buffer);
      } else {
        const text = await file.text();
        rawRows = CsvImporterService.parseCsv(text);
      }

      if (rawRows.length === 0) {
        alert(
          'No se detectaron transacciones válidas en el archivo. Asegúrate de que contenga la cabecera bancaria (ej. Fecha contable, Fecha valor, Descripción, Importe).'
        );
        setIsProcessing(false);
        return;
      }

      const existingExtraIncomes = DBService.getExtraIncomes();
      const currentSettings = await DBService.getSettings();
      const existingSalaries = currentSettings.monthlySalaries || {};
      const currentRecurringRules = await DBService.getRecurringRules();
      const analysis = await CsvImporterService.analyzeBatch(
        rawRows,
        expenses,
        rules,
        buckets,
        existingExtraIncomes,
        existingSalaries,
        currentRecurringRules
      );
      setTransactions(analysis.allTransactions);
      setStep('review');
    } catch (err: any) {
      alert('Error al leer el archivo bancario: ' + (err?.message || 'Error desconocido'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  // Modificación de fila en la tabla de staging
  const handleToggleSelect = (id: string) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, selected: !t.selected } : t))
    );
  };

  const handleSelectAllValid = (selected: boolean) => {
    setTransactions((prev) =>
      prev.map((t) => (!t.isDuplicate ? { ...t, selected } : t))
    );
  };

  const handleChangeBucket = (id: string, bucketId: string) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, suggestedBucketId: bucketId } : t))
    );
  };

  const handleUpdateIncomeTarget = (id: string, compositeValue: string) => {
    const parts = compositeValue.split(':');
    const mode = parts[0];
    const param = parts[1];
    setTransactions((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        if (mode === 'salary') {
          return {
            ...t,
            incomeCategoryMode: 'salary',
            targetSalaryMonth: param,
            targetBucketId: undefined,
            allocationMode: 'general',
          };
        } else if (mode === 'bucket_budget') {
          return {
            ...t,
            incomeCategoryMode: 'extra',
            targetBucketId: param,
            targetExtraMonth: undefined,
            allocationMode: 'bucket_budget',
          };
        } else if (mode === 'bucket_refund_prev') {
          const prevMonth = parts[2];
          return {
            ...t,
            incomeCategoryMode: 'extra',
            targetBucketId: param,
            targetExtraMonth: prevMonth,
            allocationMode: 'bucket_refund',
          };
        } else if (mode === 'bucket_refund') {
          return {
            ...t,
            incomeCategoryMode: 'extra',
            targetBucketId: param,
            targetExtraMonth: undefined,
            allocationMode: 'bucket_refund',
          };
        } else {
          return {
            ...t,
            incomeCategoryMode: 'extra',
            targetExtraMonth: param,
            targetBucketId: undefined,
            allocationMode: 'general',
          };
        }
      })
    );
  };

  const handleToggleInvoice = (id: string) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isInvoice: !t.isInvoice } : t))
    );
  };

  // Contadores
  const totalCount = transactions.length;
  const duplicateCount = transactions.filter((t) => t.isDuplicate).length;
  const matchedCount = transactions.filter((t) => !t.isDuplicate && t.matchedRuleId).length;
  const validCount = transactions.filter((t) => !t.isDuplicate).length;
  const selectedCount = transactions.filter((t) => t.selected).length;

  // Filtrado de la lista en staging
  const displayedTransactions = transactions.filter((t) => {
    if (filterView === 'valid') return !t.isDuplicate;
    if (filterView === 'matched') return !t.isDuplicate && t.matchedRuleId;
    if (filterView === 'duplicates') return t.isDuplicate;
    return true;
  });

  // Asentar e Importar
  const handleCommitImport = async (importAllValid: boolean = false) => {
    const toImport = importAllValid
      ? transactions.filter((t) => !t.isDuplicate)
      : transactions.filter((t) => t.selected);
    if (toImport.length === 0) {
      alert(
        importAllValid
          ? 'No hay transacciones válidas para importar en este extracto.'
          : 'Selecciona al menos una transacción para importar o pulsa "Importar Todas".'
      );
      return;
    }

    setIsProcessing(true);
    const batchId = `batch_${Date.now()}`;
    const timestamp = new Date().toISOString();

    const expensesToSave: Expense[] = [];
    const incomesToSave: ExtraIncome[] = [];
    let salariesImportedCount = 0;

    for (let idx = 0; idx < toImport.length; idx++) {
      const tx = toImport[idx];
      if (tx.isIncome) {
        if (tx.incomeCategoryMode === 'salary') {
          // Nómina Mensual Real Blindada
          // Si el cobro fue >= día 20, financia el mes siguiente; si fue < día 20, financia el mes en curso.
          const targetMonth =
            tx.targetSalaryMonth ||
            resolveTargetSalaryMonth(tx.parsedDate);
          await DBService.setMonthlySalary(targetMonth, {
            amount: tx.amount,
            source: 'bank_import',
            concept: tx.cleanConcept || `Nómina ${formatMonthName(targetMonth)}`,
            date: tx.parsedDate,
            rawHash: tx.rawHash,
            updatedAt: timestamp,
          });
          salariesImportedCount++;
        } else {
          // Ingreso Extra Puntual
          // Imputa al mes actual de la transacción por defecto, o al mes asignado (ej. mes pasado o siguiente)
          const rawDateMonth = tx.parsedDate ? tx.parsedDate.substring(0, 7) : new Date().toISOString().substring(0, 7);
          const effectiveMonth = tx.targetExtraMonth && tx.targetExtraMonth !== rawDateMonth ? tx.targetExtraMonth : undefined;

          incomesToSave.push({
            id: `inc_imp_${Date.now()}_${idx}`,
            title: tx.cleanConcept || 'Ingreso bancario',
            amount: tx.amount,
            type: 'punctual',
            category: 'other',
            date: tx.parsedDate,
            effectiveMonth,
            isActive: true,
            rawHash: tx.rawHash,
            targetBucketId: tx.targetBucketId,
            allocationMode: tx.allocationMode || (tx.targetBucketId ? 'bucket_budget' : 'general'),
            notes: `Abono bancario importado (${fileName})${effectiveMonth ? ` • Imputado/Reembolsado a ${formatMonthName(effectiveMonth)} (cobro ${tx.parsedDate})` : ''}`,
            createdAt: timestamp,
          });
        }
      } else {
        const matchedRuleId = tx.matchedRecurringRuleId;
        const effectiveMonth =
          tx.targetExpenseMonth && tx.targetExpenseMonth !== tx.parsedDate?.substring(0, 7)
            ? tx.targetExpenseMonth
            : undefined;
        expensesToSave.push({
          id: `exp_imp_${Date.now()}_${idx}`,
          title: tx.cleanConcept || 'Movimiento bancario',
          amount: tx.amount,
          date: tx.parsedDate,
          effectiveMonth,
          bucketId: tx.suggestedBucketId,
          isInvoice: Boolean(tx.isInvoice),
          status: 'paid',
          recurringRuleId: matchedRuleId,
          rawHash: tx.rawHash,
          importBatchId: batchId,
          notes: matchedRuleId
            ? `Importado de extracto bancario (${fileName}) • Vinculado a regla: ${tx.matchedRecurringRuleTitle || ''}`
            : `Importado de extracto bancario (${fileName})`,
          createdAt: timestamp,
        });

        // Si coincide con regla recurrente, registrar en completedDates y suprimir posible cobro duplicado pre-generado
        if (matchedRuleId) {
          const rule = (await DBService.getRecurringRules()).find((r) => r.id === matchedRuleId);
          if (rule) {
            const completed = new Set(rule.completedDates || []);
            if (tx.parsedDate) completed.add(tx.parsedDate);
            await DBService.saveRecurringRule({
              ...rule,
              completedDates: Array.from(completed),
            });
          }

          // Eliminar gasto automático pre-existente para esta regla en el mismo mes y con mismo importe
          const autoExp = expenses.find(
            (e) =>
              (e.recurringRuleId === matchedRuleId || e.id.startsWith(`exp_rec_auto_${matchedRuleId}`)) &&
              (e.date || '').startsWith(tx.parsedDate.substring(0, 7)) &&
              Math.abs(e.amount - tx.amount) < 0.01
          );
          if (autoExp) {
            await DBService.deleteExpense(autoExp.id);
          }
        }
      }
    }

    if (expensesToSave.length > 0) {
      await DBService.saveExpensesBatch(expensesToSave);
    }

    if (incomesToSave.length > 0) {
      for (const inc of incomesToSave) {
        await DBService.saveExtraIncome(inc);
      }
    }

    // Si el usuario marcó la opción de guardar como nuevas reglas automáticas (solo gastos)
    if (saveAsRules) {
      const existingRules = await DBService.getSmartRules();
      const existingPatterns = new Set(existingRules.map((r) => r.pattern.toUpperCase().trim()));

      for (const tx of toImport.filter((t) => !t.isIncome)) {
        // Extraer primera o dos palabras más significativas del concepto
        const words = tx.cleanConcept.replace(/[^a-zA-Z0-9\s]/g, '').trim().split(/\s+/);
        const keyword = words[0]?.toUpperCase();

        if (keyword && keyword.length >= 3 && !existingPatterns.has(keyword)) {
          existingPatterns.add(keyword);
          const newRule: SmartRule = {
            id: `rule_auto_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            pattern: keyword,
            matchType: 'contains',
            bucketId: tx.suggestedBucketId,
            isInvoice: tx.isInvoice,
            priority: 5,
            isActive: true,
            createdAt: timestamp,
          };
          await DBService.saveSmartRule(newRule);
        }
      }
    }

    setImportSummary({ imported: expensesToSave.length + incomesToSave.length + salariesImportedCount });
    setIsProcessing(false);
    onImportComplete();

    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 dark:bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-[#0b101c] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100">
        {/* Cabecera */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between bg-slate-50 dark:bg-slate-900/40 shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-emerald-100 dark:bg-gradient-to-br dark:from-emerald-500/20 dark:to-teal-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">Importador Bancario Universal</h2>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                Compatible con extractos Excel (.xlsx, .xls) y CSV de Santander, BBVA, Bankinter, CaixaBank, ING, etc.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {step === 'review' && (
              <>
                {selectedCount > 0 ? (
                  <button
                    type="button"
                    onClick={() => handleCommitImport(false)}
                    disabled={isProcessing}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/25 active:scale-95 cursor-pointer transition-all"
                    title={`Asentar las ${selectedCount} transacciones seleccionadas`}
                  >
                    {isProcessing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    )}
                    <span>Asentar ({selectedCount})</span>
                  </button>
                ) : validCount > 0 ? (
                  <button
                    type="button"
                    onClick={() => handleCommitImport(true)}
                    disabled={isProcessing}
                    className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer transition-all"
                    title={`Importar todas las ${validCount} transacciones válidas a la vez`}
                  >
                    {isProcessing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    <span className="hidden sm:inline">Importar</span> Todas ({validCount})
                  </button>
                ) : null}
              </>
            )}

            {onOpenRulesManager && (
              <button
                type="button"
                onClick={onOpenRulesManager}
                className="hidden md:flex px-3 py-1.5 rounded-xl bg-cyan-100 dark:bg-slate-800/80 hover:bg-cyan-200 dark:hover:bg-slate-700/80 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/30 text-xs font-semibold items-center gap-1.5 cursor-pointer transition-all shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>Reglas</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors cursor-pointer"
              title="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        {step === 'upload' ? (
          <div className="p-6 flex-1 flex flex-col items-center justify-center text-center">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => {
                AuthService.setPickingFile(true);
                fileInputRef.current?.click();
              }}
              className={`w-full max-w-lg p-8 sm:p-12 rounded-3xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center space-y-4 ${
                isDragging
                  ? 'border-emerald-400 bg-emerald-500/10 scale-102'
                  : 'border-slate-300 dark:border-slate-700/80 hover:border-emerald-500/50 bg-slate-50/70 dark:bg-slate-900/30 hover:bg-slate-100/80 dark:hover:bg-slate-900/60'
              }`}
            >
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-500/30 shadow-md">
                <Upload className="w-8 h-8 stroke-[2.2]" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Arrastra tu extracto bancario en Excel (.xlsx, .xls) o CSV aquí
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  o pulsa para explorar en tus archivos
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-2 pt-2 text-[11px] text-slate-600 dark:text-slate-400">
                <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 shadow-xs">
                  Detección de cabecera bancaria
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 shadow-xs">
                  Omisión de preámbulo y no consolidados
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 shadow-xs">
                  Deduplicación SHA-256 Gastos/Ingresos
                </span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls,.tsv,text/csv,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                onChange={(e) => {
                  AuthService.setPickingFile(false);
                  handleFileInputChange(e);
                }}
                className="hidden"
              />
            </div>

            {isProcessing && (
              <div className="mt-4 flex items-center space-x-2 text-xs text-emerald-600 dark:text-emerald-400 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analizando extracto y evaluando reglas de categorización...</span>
              </div>
            )}
          </div>
        ) : (
          /* PASO 2: BANDEJA DE REVISIÓN (STAGING TABLE) */
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Resumen superior con contadores */}
            <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/20 space-y-2.5 sm:space-y-3 shrink-0">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
                <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs">
                  <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Total Detectadas</div>
                  <div className="text-base sm:text-lg font-black font-mono text-slate-900 dark:text-white mt-0.5">{totalCount}</div>
                </div>

                <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30 shadow-xs">
                  <div className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Nuevas Válidas</span>
                  </div>
                  <div className="text-base sm:text-lg font-black font-mono text-emerald-800 dark:text-emerald-300 mt-0.5">{validCount}</div>
                </div>

                <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs">
                  <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                    <span>Duplicadas</span>
                  </div>
                  <div className="text-base sm:text-lg font-black font-mono text-slate-500 dark:text-slate-400 mt-0.5">{duplicateCount}</div>
                </div>

                <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-500/30 shadow-xs">
                  <div className="text-[10px] uppercase font-bold text-cyan-700 dark:text-cyan-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Auto-Asignadas</span>
                  </div>
                  <div className="text-base sm:text-lg font-black font-mono text-cyan-800 dark:text-cyan-300 mt-0.5">{matchedCount}</div>
                </div>
              </div>

              {/* Pestañas de filtrado & Controles de Selección masiva */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                <div className="flex items-center space-x-1 bg-slate-200/70 dark:bg-slate-950/70 p-1 rounded-xl border border-slate-300 dark:border-slate-800 text-xs">
                  <button
                    onClick={() => setFilterView('all')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      filterView === 'all'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Todas ({totalCount})
                  </button>
                  <button
                    onClick={() => setFilterView('valid')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      filterView === 'valid'
                        ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300'
                    }`}
                  >
                    Válidas ({validCount})
                  </button>
                  <button
                    onClick={() => setFilterView('matched')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      filterView === 'matched'
                        ? 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-cyan-700 dark:hover:text-cyan-300'
                    }`}
                  >
                    Por Regla ({matchedCount})
                  </button>
                  {duplicateCount > 0 && (
                    <button
                      onClick={() => setFilterView('duplicates')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                        filterView === 'duplicates'
                          ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-rose-700 dark:hover:text-rose-300'
                      }`}
                    >
                      Duplicadas ({duplicateCount})
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-2 text-xs">
                  <button
                    type="button"
                    onClick={() => handleSelectAllValid(true)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-500/30 font-bold transition-all cursor-pointer"
                  >
                    Seleccionar válidas ({validCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectAllValid(false)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700 font-medium transition-all cursor-pointer"
                  >
                    Deseleccionar
                  </button>
                  {selectedCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-mono font-bold text-[11px] border border-emerald-300 dark:border-emerald-500/30 animate-pulse">
                      {selectedCount} elegidas
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Tabla interactiva con scroll */}
            <div className="flex-1 overflow-y-auto min-h-0 p-3 sm:p-4 space-y-2.5">
              {displayedTransactions.length === 0 ? (
                <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
                  No hay transacciones en este filtro.
                </div>
              ) : (
                displayedTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shadow-xs ${
                      tx.isDuplicate
                        ? 'bg-slate-100/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-900 opacity-60'
                        : tx.selected
                        ? 'bg-emerald-50/20 dark:bg-emerald-950/15 border-emerald-300 dark:border-emerald-500/40 shadow-xs'
                        : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 opacity-80'
                    }`}
                  >
                    <div
                      className="flex items-center space-x-3 min-w-0 flex-1 cursor-pointer select-none"
                      onClick={() => !tx.isDuplicate && handleToggleSelect(tx.id)}
                    >
                      <input
                        type="checkbox"
                        checked={tx.selected}
                        disabled={tx.isDuplicate}
                        onChange={() => handleToggleSelect(tx.id)}
                        className="rounded text-emerald-500 focus:ring-0 w-4 h-4 cursor-pointer shrink-0"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                            {tx.parsedDate}
                          </span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
                            {tx.cleanConcept}
                          </span>
                          {tx.isIncome && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 font-bold flex items-center gap-1.5">
                              {tx.targetBucketId ? (
                                (() => {
                                  const targetB = buckets.find((b) => b.id === tx.targetBucketId);
                                  const bName = targetB?.name || 'Bolsa';
                                  return tx.allocationMode === 'bucket_refund' ? (
                                    <>
                                      <ArrowRightLeft className="w-3 h-3 text-cyan-600 dark:text-cyan-400 shrink-0" />
                                      <span>Reembolso {bName}</span>
                                    </>
                                  ) : (
                                    <>
                                      <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                      <span>Inyección {bName}</span>
                                    </>
                                  );
                                })()
                              ) : tx.incomeCategoryMode === 'salary' ? (
                                <>
                                  <Building className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                  <span>Nómina</span>
                                  <span className="text-emerald-700 dark:text-emerald-400 font-mono">
                                    &rarr; {formatMonthName(tx.targetSalaryMonth || resolveTargetSalaryMonth(tx.parsedDate))}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Coins className="w-3 h-3 text-teal-600 dark:text-teal-400 shrink-0" />
                                  <span>Ingreso Extra</span>
                                  <span className="text-teal-700 dark:text-teal-300 font-mono">
                                    &rarr; {formatMonthName(tx.targetExtraMonth || (tx.parsedDate ? tx.parsedDate.substring(0, 7) : ''))}
                                  </span>
                                </>
                              )}
                            </span>
                          )}
                          {tx.isDuplicate && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 font-semibold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                              Duplicado ya integrado
                            </span>
                          )}
                          {tx.matchedRulePattern && !tx.isDuplicate && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30 font-semibold flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                              {tx.matchedRulePattern}
                            </span>
                          )}
                          {tx.matchedRecurringRuleTitle && !tx.isDuplicate && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 font-semibold flex items-center gap-1">
                              <Repeat className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                              <span>Coincide: {tx.matchedRecurringRuleTitle}</span>
                            </span>
                          )}
                          {!tx.isIncome && tx.targetExpenseMonth && tx.targetExpenseMonth !== tx.parsedDate?.substring(0, 7) && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 font-semibold flex items-center gap-1 shrink-0">
                              <span>⏩ Imputado a {formatMonthName(tx.targetExpenseMonth)}</span>
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                          <span>Original: {tx.rawConcept.substring(0, 45)}</span>
                          {tx.balance !== undefined && (
                            <>
                              <span>•</span>
                              <span className="text-slate-400 dark:text-slate-500 font-mono">
                                Saldo: {tx.balance.toFixed(2)} {tx.currency || currency}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-800/60">
                      {/* Selector de Destino: Bolsa para Gastos / Nómina vs Extra para Ingresos */}
                      {!tx.isIncome ? (
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <select
                            value={tx.suggestedBucketId}
                            disabled={tx.isDuplicate}
                            onChange={(e) => handleChangeBucket(tx.id, e.target.value)}
                            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer max-w-[150px] truncate"
                          >
                            {buckets.map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.name}
                              </option>
                            ))}
                          </select>

                          {/* Selector / Toggle de Imputación a Mes Siguiente */}
                          {(() => {
                            const txDate = tx.parsedDate || '';
                            const curMonth = txDate.substring(0, 7);
                            const nextMonth = (() => {
                              const [y, m] = (curMonth || '2026-09').split('-').map(Number);
                              const d = new Date(y, m - 1 + 1, 1);
                              return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                            })();
                            const activeMonth = tx.targetExpenseMonth || curMonth;
                            const isImputedNext = activeMonth === nextMonth;

                            return (
                              <button
                                type="button"
                                disabled={tx.isDuplicate}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newTarget = isImputedNext ? curMonth : nextMonth;
                                  setTransactions((prev) =>
                                    prev.map((item) =>
                                      item.id === tx.id ? { ...item, targetExpenseMonth: newTarget } : item
                                    )
                                  );
                                }}
                                className={`text-[10px] px-2 py-0.5 rounded-lg border font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                                  isImputedNext
                                    ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-500/30'
                                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-700 dark:hover:text-slate-200'
                                }`}
                                title="Imputar gasto al presupuesto del mes siguiente sin inflar la bolsa actual"
                              >
                                <span>{isImputedNext ? '⏩ Imputa al Mes +1' : 'Imputar al Mes +1'}</span>
                              </button>
                            );
                          })()}
                        </div>
                      ) : (
                        <div className="flex flex-col items-end gap-1">
                          {(() => {
                            const cleanDate = tx.parsedDate || new Date().toISOString().split('T')[0];
                            const currentMonth = cleanDate.substring(0, 7);
                            const day = parseInt(cleanDate.split('-')[2] || '0', 10);
                            const targetSalaryMonth = resolveTargetSalaryMonth(cleanDate);

                            const parts = currentMonth.split('-');
                            const y = parseInt(parts[0], 10);
                            const m = parseInt(parts[1], 10);
                            const prevMonth = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
                            const prevMonth2 = (() => {
                              const [py, pm] = prevMonth.split('-').map(Number);
                              return pm === 1 ? `${py - 1}-12` : `${py}-${String(pm - 1).padStart(2, '0')}`;
                            })();
                            const nextMonth = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;

                            const isAfter20 = day >= 20;
                            const activeMode = tx.incomeCategoryMode || 'salary';
                            const activeMonth =
                                activeMode === 'salary'
                                  ? (tx.targetSalaryMonth || targetSalaryMonth)
                                  : (tx.targetExtraMonth || currentMonth);
                            const selectVal = tx.targetBucketId
                              ? (tx.allocationMode === 'bucket_refund' && tx.targetExtraMonth && tx.targetExtraMonth !== currentMonth
                                  ? `bucket_refund_prev:${tx.targetBucketId}:${tx.targetExtraMonth}`
                                  : `${tx.allocationMode || 'bucket_budget'}:${tx.targetBucketId}`)
                              : `${activeMode}:${activeMonth}`;

                            return (
                              <select
                                value={selectVal}
                                disabled={tx.isDuplicate}
                                onChange={(e) => handleUpdateIncomeTarget(tx.id, e.target.value)}
                                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-emerald-300 dark:border-emerald-500/40 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer max-w-[210px] sm:max-w-[270px] truncate"
                              >
                                <optgroup label="Nóminas y Salarios">
                                  {isAfter20 ? (
                                    <>
                                      <option value={`salary:${targetSalaryMonth}`}>
                                        Nómina {formatMonthName(targetSalaryMonth)} (Financia prox. mes)
                                      </option>
                                      <option value={`salary:${currentMonth}`}>
                                        Nómina {formatMonthName(currentMonth)} (Mes del cobro)
                                      </option>
                                    </>
                                  ) : (
                                    <>
                                      <option value={`salary:${currentMonth}`}>
                                        Nómina {formatMonthName(currentMonth)} (Financia mes actual)
                                      </option>
                                      <option value={`salary:${prevMonth}`}>
                                        Nómina {formatMonthName(prevMonth)} (Mes anterior)
                                      </option>
                                    </>
                                  )}
                                </optgroup>

                                <optgroup label="Ingresos Extras Generales">
                                  <option value={`extra:${currentMonth}`}>
                                    Ingreso Extra {formatMonthName(currentMonth)} (Mes actual)
                                  </option>
                                  <option value={`extra:${prevMonth}`}>
                                    Ingreso Extra {formatMonthName(prevMonth)} (Mes anterior)
                                  </option>
                                  <option value={`extra:${prevMonth2}`}>
                                    Ingreso Extra {formatMonthName(prevMonth2)} (Hace 2 meses)
                                  </option>
                                  <option value={`extra:${nextMonth}`}>
                                    Ingreso Extra {formatMonthName(nextMonth)} (Mes siguiente)
                                  </option>
                                </optgroup>

                                {buckets && buckets.length > 0 && (
                                  <>
                                    <optgroup label={`⏪ Reembolso Mes Pasado (${formatMonthName(prevMonth)})`}>
                                      {buckets.map((b) => (
                                        <option key={`refund_prev:${b.id}`} value={`bucket_refund_prev:${b.id}:${prevMonth}`}>
                                          ⏪ Reembolso {b.name} (en {formatMonthName(prevMonth)})
                                        </option>
                                      ))}
                                    </optgroup>
                                    <optgroup label={`⏪ Reembolso Hace 2 Meses (${formatMonthName(prevMonth2)})`}>
                                      {buckets.map((b) => (
                                        <option key={`refund_prev2:${b.id}`} value={`bucket_refund_prev:${b.id}:${prevMonth2}`}>
                                          ⏪ Reembolso {b.name} (en {formatMonthName(prevMonth2)})
                                        </option>
                                      ))}
                                    </optgroup>
                                    <optgroup label={`Reembolso Mes Actual (${formatMonthName(currentMonth)})`}>
                                      {buckets.map((b) => (
                                        <option key={`refund:${b.id}`} value={`bucket_refund:${b.id}`}>
                                          Reembolso en {b.name} (-gasto)
                                        </option>
                                      ))}
                                    </optgroup>
                                    <optgroup label="Inyección a Bolsa (Amplía límite)">
                                      {buckets.map((b) => (
                                        <option key={`budget:${b.id}`} value={`bucket_budget:${b.id}`}>
                                          Inyección en {b.name} (+límite)
                                        </option>
                                      ))}
                                    </optgroup>
                                  </>
                                )}
                              </select>
                            );
                          })()}
                        </div>
                      )}

                      {/* Factura Checkbox (solo aplicable a gastos) */}
                      {!tx.isIncome && (
                        <button
                          type="button"
                          onClick={() => handleToggleInvoice(tx.id)}
                          disabled={tx.isDuplicate}
                          className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                            tx.isInvoice
                              ? 'bg-teal-100 dark:bg-teal-500/20 border-teal-300 dark:border-teal-500/40 text-teal-800 dark:text-teal-300'
                              : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                          }`}
                          title="Marcar como factura desgravable"
                        >
                          Factura
                        </button>
                      )}

                      {/* Importe con signo y categoría en cápsula estilizada con margen de respiro */}
                      <div className="px-3.5 py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 min-w-[100px] sm:min-w-[110px] text-right shrink-0 shadow-xs flex flex-col justify-center">
                        <span
                          className={`font-mono font-black text-xs sm:text-sm tracking-tight ${
                            tx.isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          {tx.isIncome ? `+${tx.amount.toFixed(2)}` : `-${tx.amount.toFixed(2)}`} {currency}
                        </span>
                        <span
                          className={`block text-[9px] font-bold uppercase tracking-wider ${
                            tx.isIncome
                              ? tx.incomeCategoryMode === 'salary'
                                ? 'text-teal-600 dark:text-teal-400 font-extrabold'
                                : 'text-emerald-600/90 dark:text-emerald-400/90'
                              : 'text-slate-500'
                          }`}
                        >
                          {tx.isIncome ? (tx.incomeCategoryMode === 'salary' ? 'Nómina Mes' : 'Ingreso Extra') : 'Gasto'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Fijo con Acciones Principales y Soporte Dual de Importación */}
            <div className="shrink-0 sticky bottom-0 z-30 p-3.5 sm:p-4 border-t border-slate-200 dark:border-slate-800/90 bg-white/95 dark:bg-[#0b101c]/95 backdrop-blur-md flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <label className="flex items-center space-x-2.5 cursor-pointer text-xs text-slate-700 dark:text-slate-300 select-none">
                  <input
                    type="checkbox"
                    checked={saveAsRules}
                    onChange={(e) => setSaveAsRules(e.target.checked)}
                    className="rounded text-cyan-500 focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                  <span>
                    Crear <strong>reglas inteligentes</strong> con las asignaciones
                  </span>
                </label>

                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedCount}</span> de{' '}
                  <span className="font-bold">{validCount}</span> válidas seleccionadas
                </div>
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setStep('upload')}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer flex-1 sm:flex-none text-center"
                >
                  Cambiar archivo
                </button>

                {/* Opción 1: Importar todas las válidas directamente */}
                <button
                  type="button"
                  onClick={() => handleCommitImport(true)}
                  disabled={validCount === 0 || isProcessing}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                    validCount > 0 && !isProcessing
                      ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-600 active:scale-95 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-600 border-transparent cursor-not-allowed shadow-none'
                  }`}
                  title="Importar todas las transacciones válidas sin duplicados de una sola vez"
                >
                  <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>Importar Todas ({validCount})</span>
                </button>

                {/* Opción 2: Asentar solo las seleccionadas por el usuario */}
                <button
                  type="button"
                  onClick={() => handleCommitImport(false)}
                  disabled={selectedCount === 0 || isProcessing}
                  className={`px-5 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg flex-1 sm:flex-none ${
                    selectedCount > 0 && !isProcessing
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/25 active:scale-95 ring-2 ring-emerald-500/20'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none'
                  }`}
                  title={
                    selectedCount > 0
                      ? `Guardar en la base de datos las ${selectedCount} transacciones seleccionadas`
                      : 'Selecciona una o más transacciones para asentar'
                  }
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Importando...</span>
                    </>
                  ) : importSummary ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>¡{importSummary.imported} Importadas!</span>
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-4 h-4 stroke-[3]" />
                      <span>Asentar {selectedCount > 0 ? `${selectedCount} ` : ''}Seleccionadas</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
