import React, { useState } from 'react';
import { X, Plus, Check, Receipt, Tag, Calendar, DollarSign, Building } from 'lucide-react';
import { Expense, Bucket } from '../../types';
import { HapticService } from '../../services/hapticService';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Expense) => void;
  buckets: Bucket[];
  currency: string;
  initialExpense?: Expense | null;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  buckets,
  currency,
  initialExpense,
}) => {
  const [title, setTitle] = useState(initialExpense?.title || '');
  const [amount, setAmount] = useState(initialExpense?.amount ? String(initialExpense.amount) : '');
  const [bucketId, setBucketId] = useState(
    initialExpense?.bucketId || (buckets.length > 0 ? buckets[0].id : '')
  );
  const [date, setDate] = useState(
    initialExpense?.date || new Date().toISOString().split('T')[0]
  );
  const [isInvoice, setIsInvoice] = useState(initialExpense?.isInvoice || false);
  const [invoiceNumber, setInvoiceNumber] = useState(initialExpense?.invoiceNumber || '');
  const [supplier, setSupplier] = useState(initialExpense?.supplier || '');
  const [taxRate, setTaxRate] = useState(initialExpense?.taxRate !== undefined ? String(initialExpense.taxRate) : '21');
  const [notes, setNotes] = useState(initialExpense?.notes || '');
  const [status, setStatus] = useState<'paid' | 'pending'>(initialExpense?.status || 'paid');

  React.useEffect(() => {
    if (isOpen) {
      setTitle(initialExpense?.title || '');
      setAmount(initialExpense?.amount ? String(initialExpense.amount) : '');
      setBucketId(initialExpense?.bucketId || (buckets.length > 0 ? buckets[0].id : ''));
      setDate(initialExpense?.date || new Date().toISOString().split('T')[0]);
      setIsInvoice(initialExpense?.isInvoice || false);
      setInvoiceNumber(initialExpense?.invoiceNumber || '');
      setSupplier(initialExpense?.supplier || '');
      setTaxRate(initialExpense?.taxRate !== undefined ? String(initialExpense.taxRate) : '21');
      setNotes(initialExpense?.notes || '');
      setStatus(initialExpense?.status || 'paid');
    }
  }, [isOpen, initialExpense, buckets]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      await HapticService.notificationWarning();
      alert('Por favor, introduce un importe válido.');
      return;
    }

    const parsedTaxRate = parseFloat(taxRate) || 0;
    const taxAmount = isInvoice ? (parsedAmount * parsedTaxRate) / (100 + parsedTaxRate) : 0;

    const expense: Expense = {
      id: initialExpense?.id || `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim() || 'Gasto sin título',
      amount: parsedAmount,
      date,
      bucketId: bucketId || (buckets[0]?.id ?? 'default'),
      isInvoice,
      invoiceNumber: isInvoice ? invoiceNumber.trim() : undefined,
      supplier: supplier.trim() || undefined,
      taxRate: isInvoice ? parsedTaxRate : undefined,
      taxAmount: isInvoice ? Number(taxAmount.toFixed(2)) : undefined,
      notes: notes.trim() || undefined,
      status,
      createdAt: initialExpense?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await HapticService.notificationSuccess();
    onSave(expense);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700/80 rounded-3xl w-full max-w-lg p-5 text-slate-900 dark:text-white shadow-2xl overflow-y-auto max-h-[92vh]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </span>
            <span>{initialExpense ? 'Editar Gasto' : 'Nuevo Gasto o Factura'}</span>
          </h2>
          <button
            onClick={() => {
              HapticService.selection();
              onClose();
            }}
            className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer active:scale-95"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Concepto e Importe */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Concepto / Nombre *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Fibra óptica, Compra semanal..."
                className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Importe ({currency}) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400 focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Bolsa y Fecha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Bolsa de Presupuesto *</label>
              <select
                value={bucketId}
                onChange={(e) => setBucketId(e.target.value)}
                className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-200 focus:outline-hidden focus:border-emerald-500"
              >
                {buckets.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.budgetLimit} {currency})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                  <span>Fecha de Origen / Pago *</span>
                </label>
                {date && (
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    {date === new Date().toISOString().split('T')[0] ? 'Hoy' : date.split('-').reverse().join('/')}
                  </span>
                )}
              </div>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-200 focus:outline-hidden focus:border-emerald-500"
              />
              <p className="text-[10px] text-slate-500">
                Día en que se originó el desembolso o factura (no necesariamente hoy).
              </p>
            </div>
          </div>

          {/* Toggle Factura Oficial Desgravable */}
          <div className="p-3 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
            <div
              onClick={() => setIsInvoice(!isInvoice)}
              className="flex items-center justify-between cursor-pointer select-none"
            >
              <div className="flex items-center space-x-2.5">
                <Receipt className={`w-5 h-5 ${isInvoice ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Factura oficial / Desgravable</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Incluye número de factura, NIF/CIF y deducción de IVA
                  </div>
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                  isInvoice ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'border-slate-400 dark:border-slate-600'
                }`}
              >
                {isInvoice && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>

            {isInvoice && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Nº de Factura</label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="FAC-2026-001"
                    className="w-full h-10 px-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Proveedor / Emisor</label>
                  <input
                    type="text"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    placeholder="Iberdrola, Amazon..."
                    className="w-full h-10 px-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">IVA (%)</label>
                  <select
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    className="w-full h-10 px-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                  >
                    <option value="21">21% (General)</option>
                    <option value="10">10% (Reducido)</option>
                    <option value="4">4% (Superreducido)</option>
                    <option value="0">0% (Exento)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Estado de Pago */}
          <div className="flex items-center space-x-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Estado:</span>
            <button
              type="button"
              onClick={() => setStatus('paid')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                status === 'paid'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/40'
                  : 'text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Pagado
            </button>
            <button
              type="button"
              onClick={() => setStatus('pending')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                status === 'pending'
                  ? 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/40'
                  : 'text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Pendiente
            </button>
          </div>

          {/* Notas */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Notas / Observaciones</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalles adicionales, garantía, etc."
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          {/* Botón Guardar */}
          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => {
                HapticService.selection();
                onClose();
              }}
              className="px-4 py-2.5 min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold cursor-pointer active:scale-95 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 min-h-[44px] rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold shadow-md shadow-emerald-500/20 cursor-pointer flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Guardar Gasto</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
