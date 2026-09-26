import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Plus,
  Trash2,
  Check,
  Search,
  Filter,
  RefreshCw,
  ShieldCheck,
  FileSpreadsheet,
  AlertCircle,
  Tag,
} from 'lucide-react';
import { SmartRule, Bucket } from '../../types';
import { DBService, INITIAL_SMART_RULES } from '../../services/db';

interface SmartRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: SmartRule[];
  buckets: Bucket[];
  onRulesUpdated: () => void;
}

export const SmartRulesModal: React.FC<SmartRulesModalProps> = ({
  isOpen,
  onClose,
  rules,
  buckets,
  onRulesUpdated,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBucket, setFilterBucket] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);

  // Formulario nueva regla
  const [newPattern, setNewPattern] = useState('');
  const [newMatchType, setNewMatchType] = useState<'contains' | 'exact' | 'startsWith' | 'regex'>('contains');
  const [newBucketId, setNewBucketId] = useState(buckets[0]?.id || '');
  const [newPriority, setNewPriority] = useState('10');
  const [newIsInvoice, setNewIsInvoice] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleToggleActive = async (rule: SmartRule) => {
    const updated: SmartRule = { ...rule, isActive: !rule.isActive };
    await DBService.saveSmartRule(updated);
    onRulesUpdated();
  };

  const handleDeleteRule = async (id: string) => {
    if (confirm('¿Eliminar esta regla inteligente?')) {
      await DBService.deleteSmartRule(id);
      onRulesUpdated();
    }
  };

  const handleResetSeeds = async () => {
    if (confirm('¿Restablecer las reglas inteligentes a las semillas recomendadas por defecto?')) {
      await DBService.applySmartRulesSeeds('replace');
      onRulesUpdated();
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPattern.trim()) {
      setErrorMsg('El patrón o término de coincidencia es obligatorio.');
      return;
    }

    if (newMatchType === 'regex') {
      try {
        new RegExp(newPattern);
      } catch {
        setErrorMsg('La expresión regular ingresada no es válida.');
        return;
      }
    }

    const rule: SmartRule = {
      id: `rule_custom_${Date.now()}`,
      pattern: newPattern.trim().toUpperCase(),
      matchType: newMatchType,
      bucketId: newBucketId || buckets[0]?.id || '',
      priority: parseInt(newPriority, 10) || 10,
      isInvoice: newIsInvoice,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    await DBService.saveSmartRule(rule);
    setNewPattern('');
    setNewPriority('10');
    setNewIsInvoice(false);
    setShowAddForm(false);
    setErrorMsg('');
    onRulesUpdated();
  };

  // Filtrado de reglas
  const filteredRules = rules.filter((r) => {
    const matchesSearch =
      r.pattern.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.matchType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBucket = filterBucket === 'all' || r.bucketId === filterBucket;
    return matchesSearch && matchesBucket;
  });

  const getBucket = (bucketId: string) => buckets.find((b) => b.id === bucketId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0b101b] border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Cabecera */}
        <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                Reglas Inteligentes de Categorización
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {rules.length} Activas
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Clasificación automática offline por comercio y concepto bancario
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/70 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de herramientas */}
        <div className="p-4 border-b border-slate-800/60 bg-slate-900/30 space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por comercio (ej: Mercadona, Cepsa)..."
                className="w-full pl-9 pr-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <select
              value={filterBucket}
              onChange={(e) => setFilterBucket(e.target.value)}
              className="px-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="all">Todas las bolsas</option>
              {buckets.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 cursor-pointer transition-all shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="hidden sm:inline">Nueva Regla</span>
            </button>
          </div>

          {/* Formulario desplegable Nueva Regla */}
          {showAddForm && (
            <form onSubmit={handleCreateRule} className="p-3.5 rounded-2xl bg-slate-900/90 border border-cyan-500/30 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between text-xs font-bold text-cyan-300">
                <span>Definir Nueva Regla de Asignación</span>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {errorMsg && (
                <div className="p-2 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Patrón / Término a Coincidir
                  </label>
                  <input
                    type="text"
                    value={newPattern}
                    onChange={(e) => setNewPattern(e.target.value)}
                    placeholder="Ej: MCDONALDS o ZARA"
                    required
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono uppercase focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Tipo de Coincidencia
                  </label>
                  <select
                    value={newMatchType}
                    onChange={(e) => setNewMatchType(e.target.value as any)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="contains">Contiene el texto (Recomendado)</option>
                    <option value="startsWith">Empieza por el texto</option>
                    <option value="exact">Coincidencia exacta</option>
                    <option value="regex">Expresión regular (Avanzado)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Bolsa Presupuestaria Destino
                  </label>
                  <select
                    value={newBucketId}
                    onChange={(e) => setNewBucketId(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    {buckets.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Prioridad de Evaluación (1 - 100)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center space-x-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={newIsInvoice}
                    onChange={(e) => setNewIsInvoice(e.target.checked)}
                    className="rounded text-cyan-500 focus:ring-0"
                  />
                  <span>Marcar automáticamente como Factura oficial / Desgravable</span>
                </label>

                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs cursor-pointer shadow-md transition-all"
                >
                  Guardar Regla
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Lista de Reglas */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredRules.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No se encontraron reglas con los filtros actuales.
            </div>
          ) : (
            filteredRules.map((rule) => {
              const bucket = getBucket(rule.bucketId);
              return (
                <div
                  key={rule.id}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    rule.isActive
                      ? 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                      : 'bg-slate-950/40 border-slate-900 opacity-60'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(rule)}
                      className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                        rule.isActive
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-500 border border-slate-700'
                      }`}
                      title={rule.isActive ? 'Regla activa' : 'Regla pausada'}
                    >
                      <Check className={`w-4 h-4 ${rule.isActive ? 'opacity-100' : 'opacity-30'}`} />
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-xs text-white truncate">
                          {rule.pattern}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                          {rule.matchType}
                        </span>
                        {rule.isInvoice && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300 font-semibold border border-teal-500/30">
                            Factura
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 mt-1 text-[11px]">
                        <span className="text-slate-500">Asigna a:</span>
                        {bucket ? (
                          <span className="flex items-center space-x-1.5 font-semibold text-slate-200">
                            <span
                              className="w-2 h-2 rounded-full inline-block"
                              style={{ backgroundColor: bucket.color }}
                            />
                            <span>{bucket.name}</span>
                          </span>
                        ) : (
                          <span className="text-amber-400">Bolsa no encontrada</span>
                        )}
                        <span className="text-slate-600">•</span>
                        <span className="text-slate-500 text-[10px]">Prio: {rule.priority}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDeleteRule(rule.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Eliminar regla"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/40 flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetSeeds}
            className="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Restablecer Semillas Oficiales</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-all cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
