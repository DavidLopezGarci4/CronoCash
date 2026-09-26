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
} from 'lucide-react';
import { Expense, Bucket, SmartRule } from '../../types';
import { CsvImporterService, AnalyzedTransaction, BatchAnalysisResult } from '../../services/csvImporterService';
import { DBService } from '../../services/db';

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

  if (!isOpen) return null;

  const handleProcessFile = async (file: File) => {
    try {
      setIsProcessing(true);
      setFileName(file.name);
      const text = await file.text();

      const rawRows = CsvImporterService.parseCsv(text);
      if (rawRows.length === 0) {
        alert('No se detectaron transacciones válidas en el archivo CSV. Comprueba el formato de tu banco.');
        setIsProcessing(false);
        return;
      }

      const analysis = await CsvImporterService.analyzeBatch(rawRows, expenses, rules, buckets);
      setTransactions(analysis.allTransactions);
      setStep('review');
    } catch (err: any) {
      alert('Error al leer el archivo CSV: ' + (err?.message || 'Error desconocido'));
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
  const handleCommitImport = async () => {
    const toImport = transactions.filter((t) => t.selected);
    if (toImport.length === 0) {
      alert('Selecciona al menos una transacción para importar.');
      return;
    }

    setIsProcessing(true);
    const batchId = `batch_${Date.now()}`;
    const timestamp = new Date().toISOString();

    const expensesToSave: Expense[] = toImport.map((tx, idx) => ({
      id: `exp_imp_${Date.now()}_${idx}`,
      title: tx.cleanConcept || 'Movimiento bancario',
      amount: tx.amount,
      date: tx.parsedDate,
      bucketId: tx.suggestedBucketId,
      isInvoice: Boolean(tx.isInvoice),
      status: 'paid',
      rawHash: tx.rawHash,
      importBatchId: batchId,
      notes: `Importado de extracto bancario (${fileName})`,
      createdAt: timestamp,
    }));

    await DBService.saveExpensesBatch(expensesToSave);

    // Si el usuario marcó la opción de guardar como nuevas reglas automáticas
    if (saveAsRules) {
      const existingRules = await DBService.getSmartRules();
      const existingPatterns = new Set(existingRules.map((r) => r.pattern.toUpperCase().trim()));

      for (const tx of toImport) {
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

    setImportSummary({ imported: expensesToSave.length });
    setIsProcessing(false);
    onImportComplete();

    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0b101c] border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Cabecera */}
        <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/40">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 text-emerald-400 border border-emerald-500/30">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-black text-white">Importador Bancario Universal</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  Offline 100%
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Compatible con extractos CSV de CaixaBank, BBVA, Santander, Sabadell, ING, Revolut, etc.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {onOpenRulesManager && (
              <button
                type="button"
                onClick={onOpenRulesManager}
                className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Reglas Inteligentes</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/70 transition-colors cursor-pointer"
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
              onClick={() => fileInputRef.current?.click()}
              className={`w-full max-w-lg p-8 sm:p-12 rounded-3xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center space-y-4 ${
                isDragging
                  ? 'border-emerald-400 bg-emerald-500/10 scale-102'
                  : 'border-slate-700/80 hover:border-emerald-500/50 bg-slate-900/30 hover:bg-slate-900/60'
              }`}
            >
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shadow-lg shadow-emerald-950/40">
                <Upload className="w-8 h-8 stroke-[2.2]" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">
                  Arrastra tu archivo bancario CSV aquí
                </h3>
                <p className="text-xs text-slate-400">
                  o pulsa para explorar en tu dispositivo
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-2 pt-2 text-[11px] text-slate-500">
                <span className="px-2.5 py-1 rounded-lg bg-slate-800/60 border border-slate-800">
                  Separador automático (; o ,)
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-800/60 border border-slate-800">
                  Formato español (DD/MM/YYYY)
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-800/60 border border-slate-800">
                  Deduplicación SHA-256
                </span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv,text/plain"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>

            {isProcessing && (
              <div className="mt-4 flex items-center space-x-2 text-xs text-emerald-400 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analizando extracto y evaluando reglas de categorización...</span>
              </div>
            )}
          </div>
        ) : (
          /* PASO 2: BANDEJA DE REVISIÓN (STAGING TABLE) */
          <div className="flex-1 flex flex-col min-h-0">
            {/* Resumen superior con contadores */}
            <div className="p-4 border-b border-slate-800/60 bg-slate-900/20 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Total Detectadas</div>
                  <div className="text-lg font-black font-mono text-white mt-0.5">{totalCount}</div>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-950/20 border border-emerald-500/30">
                  <div className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Nuevas Válidas</span>
                  </div>
                  <div className="text-lg font-black font-mono text-emerald-300 mt-0.5">{validCount}</div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-slate-500" />
                    <span>Duplicadas Descartadas</span>
                  </div>
                  <div className="text-lg font-black font-mono text-slate-400 mt-0.5">{duplicateCount}</div>
                </div>

                <div className="p-3 rounded-2xl bg-cyan-950/20 border border-cyan-500/30">
                  <div className="text-[10px] uppercase font-bold text-cyan-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Auto-Asignadas</span>
                  </div>
                  <div className="text-lg font-black font-mono text-cyan-300 mt-0.5">{matchedCount}</div>
                </div>
              </div>

              {/* Pestañas de filtrado & Controles de Selección masiva */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center space-x-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setFilterView('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      filterView === 'all'
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Todas ({totalCount})
                  </button>
                  <button
                    onClick={() => setFilterView('valid')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      filterView === 'valid'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'text-slate-400 hover:text-emerald-300'
                    }`}
                  >
                    Válidas ({validCount})
                  </button>
                  <button
                    onClick={() => setFilterView('matched')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      filterView === 'matched'
                        ? 'bg-cyan-500/20 text-cyan-300'
                        : 'text-slate-400 hover:text-cyan-300'
                    }`}
                  >
                    Por Regla ({matchedCount})
                  </button>
                  {duplicateCount > 0 && (
                    <button
                      onClick={() => setFilterView('duplicates')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        filterView === 'duplicates'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'text-slate-400 hover:text-rose-300'
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
                    className="text-emerald-400 hover:underline cursor-pointer font-semibold"
                  >
                    Seleccionar todas las válidas
                  </button>
                  <span className="text-slate-600">•</span>
                  <button
                    type="button"
                    onClick={() => handleSelectAllValid(false)}
                    className="text-slate-400 hover:underline cursor-pointer"
                  >
                    Deseleccionar
                  </button>
                </div>
              </div>
            </div>

            {/* Tabla interactiva con scroll */}
            <div className="flex-1 overflow-y-auto min-h-[280px] p-4 space-y-2">
              {displayedTransactions.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  No hay transacciones en este filtro.
                </div>
              ) : (
                displayedTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      tx.isDuplicate
                        ? 'bg-slate-950/40 border-slate-900 opacity-60'
                        : tx.selected
                        ? 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                        : 'bg-slate-950/20 border-slate-900/80 opacity-70'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={tx.selected}
                        disabled={tx.isDuplicate}
                        onChange={() => handleToggleSelect(tx.id)}
                        className="rounded text-emerald-500 focus:ring-0 w-4 h-4 cursor-pointer"
                      />

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-xs font-mono font-bold text-slate-400">
                            {tx.parsedDate}
                          </span>
                          <span className="text-xs font-bold text-white truncate max-w-xs sm:max-w-md">
                            {tx.cleanConcept}
                          </span>
                          {tx.isDuplicate && (
                            <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-800 text-slate-400 font-semibold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-amber-400" />
                              Duplicado descartado
                            </span>
                          )}
                          {tx.matchedRulePattern && !tx.isDuplicate && (
                            <span className="text-[10px] px-2 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-cyan-400" />
                              {tx.matchedRulePattern}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                          <span>Original: {tx.rawConcept.substring(0, 45)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                      {/* Selector de Bolsa */}
                      <select
                        value={tx.suggestedBucketId}
                        disabled={tx.isDuplicate}
                        onChange={(e) => handleChangeBucket(tx.id, e.target.value)}
                        className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer max-w-[150px]"
                      >
                        {buckets.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>

                      {/* Factura Checkbox */}
                      <button
                        type="button"
                        onClick={() => handleToggleInvoice(tx.id)}
                        disabled={tx.isDuplicate}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                          tx.isInvoice
                            ? 'bg-teal-500/20 border-teal-500/40 text-teal-300'
                            : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                        }`}
                        title="Marcar como factura desgravable"
                      >
                        Factura
                      </button>

                      {/* Importe */}
                      <div className="text-right min-w-[75px]">
                        <span className="font-mono font-black text-sm text-emerald-400">
                          {tx.amount.toFixed(2)} {currency}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer con Switch de Auto-Reglas y Botón Principal */}
            <div className="p-4 border-t border-slate-800/80 bg-slate-900/40 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <label className="flex items-center space-x-2.5 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={saveAsRules}
                    onChange={(e) => setSaveAsRules(e.target.checked)}
                    className="rounded text-cyan-500 focus:ring-0 w-4 h-4"
                  />
                  <span>
                    Guardar asignaciones como <strong>nuevas reglas automáticas</strong> para futuros extractos
                  </span>
                </label>
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setStep('upload')}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-all cursor-pointer flex-1 sm:flex-none text-center"
                >
                  Cambiar archivo
                </button>

                <button
                  type="button"
                  onClick={handleCommitImport}
                  disabled={selectedCount === 0 || isProcessing}
                  className={`px-5 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg flex-1 sm:flex-none ${
                    selectedCount > 0 && !isProcessing
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/25 active:scale-95'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Importando...</span>
                    </>
                  ) : importSummary ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>¡{importSummary.imported} Transacciones Importadas!</span>
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-4 h-4 stroke-[3]" />
                      <span>Asentar e Importar {selectedCount} Movimientos</span>
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
