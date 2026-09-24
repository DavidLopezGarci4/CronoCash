import React, { useState } from 'react';
import { X, Plus, Check, Receipt, Tag, Calendar, DollarSign, Building } from 'lucide-react';
import { Expense, Bucket } from '../../types';

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

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
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

    onSave(expense);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-[#0f172a] border border-slate-700/80 rounded-3xl w-full max-w-lg p-5 text-white shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </span>
            <span>{initialExpense ? 'Editar Gasto' : 'Nuevo Gasto o Factura'}</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Concepto e Importe */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-bold text-slate-400">Concepto / Nombre *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Fibra óptica, Compra semanal..."
                className="w-full h-11 px-3.5 bg-slate-900 border border-slate-700 rounded-xl text-sm focus:outline-hidden focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400">Importe ({currency}) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full h-11 px-3.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono font-bold text-emerald-400 focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Bolsa y Fecha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400">Bolsa de Presupuesto *</label>
              <select
                value={bucketId}
                onChange={(e) => setBucketId(e.target.value)}
                className="w-full h-11 px-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-hidden focus:border-emerald-500"
              >
                {buckets.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.budgetLimit} {currency})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400">Fecha *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-11 px-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Toggle Factura Oficial Desgravable */}
          <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3">
            <div
              onClick={() => setIsInvoice(!isInvoice)}
              className="flex items-center justify-between cursor-pointer select-none"
            >
              <div className="flex items-center space-x-2.5">
                <Receipt className={`w-5 h-5 ${isInvoice ? 'text-emerald-400' : 'text-slate-500'}`} />
                <div>
                  <div className="text-xs font-bold text-slate-200">Factura oficial / Desgravable</div>
                  <div className="text-[11px] text-slate-400">
                    Incluye número de factura, NIF/CIF y deducción de IVA
                  </div>
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                  isInvoice ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'border-slate-600'
                }`}
              >
                {isInvoice && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>

            {isInvoice && (
              <div className="pt-2 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400">Nº de Factura</label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="FAC-2026-001"
                    className="w-full h-10 px-2.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400">Proveedor / Emisor</label>
                  <input
                    type="text"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    placeholder="Iberdrola, Amazon..."
                    className="w-full h-10 px-2.5 bg-slate-950 border border-slate-700 rounded-lg text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400">IVA (%)</label>
                  <select
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    className="w-full h-10 px-2 bg-slate-950 border border-slate-700 rounded-lg text-xs"
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
            <span className="text-xs font-bold text-slate-400">Estado:</span>
            <button
              type="button"
              onClick={() => setStatus('paid')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                status === 'paid'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              Pagado
            </button>
            <button
              type="button"
              onClick={() => setStatus('pending')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                status === 'pending'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              Pendiente
            </button>
          </div>

          {/* Notas */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400">Notas / Observaciones</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalles adicionales, garantía, etc."
              className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          {/* Botón Guardar */}
          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold shadow-md shadow-emerald-500/20 cursor-pointer flex items-center gap-1.5"
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
