import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Edit2,
  Trash2,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  AlertTriangle,
  Check,
  Tag,
  Home,
  Zap,
  Droplets,
  Smartphone,
  Car,
  Fuel,
  Bus,
  Train,
  Utensils,
  Music,
  Shield,
  ShieldCheck,
  FileCheck,
  Repeat,
  Bell,
  Sparkles,
  TrendingUp,
  Coins,
  LineChart,
  Landmark,
  Gem,
  Building2,
  Key,
  Wifi,
  Tv,
  GraduationCap,
  BookOpen,
  Stethoscope,
  Pill,
  Eye,
  Wrench,
  Scissors,
  Dumbbell,
  Gift,
  HeartHandshake,
  Bot,
  Gamepad2,
  Package,
  Trophy,
  Crown,
  CreditCard,
  GripVertical,
} from 'lucide-react';
import { FunctionalCategory, RecurringRule } from '../../types';
import { DBService } from '../../services/db';
import { HapticService } from '../../services/hapticService';
import { useTouchSortable } from '../../hooks/useTouchSortable';

// Catálogo de 40 iconos 100% Lucide React
export const LUCIDE_CATEGORY_ICONS: Record<string, React.ElementType> = {
  TrendingUp,
  CreditCard,
  ShieldCheck,
  Repeat,
  Landmark,
  Car,
  GraduationCap,
  Stethoscope,
  Wrench,
  Sparkles,
  HeartHandshake,
  Gift,
  Home,
  Zap,
  Droplets,
  Smartphone,
  Fuel,
  Bus,
  Train,
  Utensils,
  Music,
  Shield,
  FileCheck,
  Bell,
  Coins,
  LineChart,
  Gem,
  Building2,
  Key,
  Wifi,
  Tv,
  BookOpen,
  Pill,
  Eye,
  Scissors,
  Dumbbell,
  Bot,
  Gamepad2,
  Package,
  Trophy,
  Crown,
};

const COLOR_PALETTE = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ec4899', // pink
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#ef4444', // red
  '#14b8a6', // teal
  '#f97316', // orange
  '#6366f1', // indigo
  '#a855f7', // violet
  '#84cc16', // lime
  '#eab308', // gold
  '#d946ef', // fuchsia
  '#14532d', // forest
  '#0284c7', // sky
];

interface FunctionalCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: RecurringRule[];
  onCategoriesChanged: () => void;
}

export const FunctionalCategoriesModal: React.FC<FunctionalCategoriesModalProps> = ({
  isOpen,
  onClose,
  rules,
  onCategoriesChanged,
}) => {
  const [categories, setCategories] = useState<FunctionalCategory[]>([]);
  const [editingCategory, setEditingCategory] = useState<FunctionalCategory | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Estado del formulario
  const [formName, setFormName] = useState('');
  const [formIcon, setFormIcon] = useState('Tag');
  const [formColor, setFormColor] = useState('#3b82f6');
  const [formDesc, setFormDesc] = useState('');

  // Estado para borrado seguro con reasignación
  const [categoryToDelete, setCategoryToDelete] = useState<FunctionalCategory | null>(null);
  const [reassignTargetId, setReassignTargetId] = useState<string>('');

  const loadCategories = () => {
    const list = DBService.getFunctionalCategories();
    setCategories(list);
  };

  useEffect(() => {
    if (isOpen) {
      loadCategories();
      setIsFormOpen(false);
      setEditingCategory(null);
      setCategoryToDelete(null);
    }
  }, [isOpen]);

  const handleReorderCategories = async (newCategories: FunctionalCategory[]) => {
    setCategories(newCategories);
    await DBService.updateFunctionalCategoriesOrder(newCategories);
    onCategoriesChanged();
  };

  const { dragIndex, overIndex, getHandleProps, getItemProps } = useTouchSortable({
    items: categories,
    onReorder: handleReorderCategories,
    enabled: isOpen && !isFormOpen && !categoryToDelete,
  });

  if (!isOpen) return null;

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormName('');
    setFormIcon('Tag');
    setFormColor('#3b82f6');
    setFormDesc('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (cat: FunctionalCategory) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormIcon(cat.icon || 'Tag');
    setFormColor(cat.color || '#3b82f6');
    setFormDesc(cat.description || '');
    setIsFormOpen(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('Por favor introduce un nombre para la categoría.');
      return;
    }

    const category: FunctionalCategory = {
      id: editingCategory ? editingCategory.id : `cat_${Date.now()}`,
      name: formName.trim(),
      icon: formIcon,
      color: formColor,
      isSystem: editingCategory ? editingCategory.isSystem : false,
      order: editingCategory ? editingCategory.order : categories.length + 1,
      description: formDesc.trim() || undefined,
    };

    await DBService.saveFunctionalCategory(category);
    loadCategories();
    setIsFormOpen(false);
    onCategoriesChanged();
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const reordered = [...categories];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    await DBService.updateFunctionalCategoriesOrder(reordered);
    loadCategories();
    onCategoriesChanged();
  };

  const handlePromptDelete = (cat: FunctionalCategory) => {
    const inUseCount = rules.filter((r) => r.categoryType === cat.id).length;
    setCategoryToDelete(cat);
    // Categoría destino por defecto distinta a la que se va a borrar
    const defaultAlternative = categories.find((c) => c.id !== cat.id)?.id || 'bill';
    setReassignTargetId(defaultAlternative);
    HapticService.notificationWarning();
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;

    const inUseCount = rules.filter((r) => r.categoryType === categoryToDelete.id).length;
    await DBService.deleteFunctionalCategory(
      categoryToDelete.id,
      inUseCount > 0 ? reassignTargetId : undefined
    );

    await HapticService.notificationSuccess();
    setCategoryToDelete(null);
    loadCategories();
    onCategoriesChanged();
  };

  const handleResetDefaults = async () => {
    const confirmed = window.confirm(
      '¿Deseas restaurar las 12 categorías predeterminadas del sistema? Tus reglas mantendrán sus asignaciones originales.'
    );
    if (!confirmed) return;

    await DBService.resetDefaultFunctionalCategories();
    await HapticService.notificationSuccess();
    loadCategories();
    onCategoriesChanged();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs">
      <div className="bg-[#0f172a] border border-slate-700/80 rounded-3xl w-full max-w-lg p-5 text-white shadow-2xl animate-in fade-in duration-200 flex flex-col max-h-[90vh]">
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Tag className="w-4 h-4 text-emerald-400" />
              <span>Gestor de Categorías Funcionales</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Personaliza, añade y organiza las categorías de tus compromisos
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal interno: Formulario Crear / Editar */}
        {isFormOpen ? (
          <form onSubmit={handleSaveForm} className="mt-4 space-y-4 overflow-y-auto pr-1 flex-1">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400">Nombre de la Categoría *</label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ej. Inversiones, Mascotas VIP, Alquiler..."
                className="w-full h-11 px-3 bg-slate-900 border border-slate-700 rounded-xl text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Selector de Icono Lucide */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400">
                Icono Vectorial (40 disponibles)
              </label>
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 p-2 bg-slate-900/60 rounded-2xl border border-slate-800 max-h-40 overflow-y-auto">
                {Object.keys(LUCIDE_CATEGORY_ICONS).map((iconKey) => {
                  const Comp = LUCIDE_CATEGORY_ICONS[iconKey] || Tag;
                  const isSelected = formIcon === iconKey;
                  return (
                    <button
                      key={iconKey}
                      type="button"
                      onClick={() => setFormIcon(iconKey)}
                      className={`p-2 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-500 text-slate-950 font-bold scale-105 shadow-md shadow-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                      }`}
                      title={iconKey}
                    >
                      <Comp className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selector de Color */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400">Color Distintivo</label>
              <div className="flex items-center space-x-2 pt-1 flex-wrap gap-y-2">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFormColor(c)}
                    className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                      formColor === c ? 'border-white scale-110 shadow-lg' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Descripción opcional */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400">Descripción / Ejemplos</label>
              <input
                type="text"
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Qué gastos cubre esta categoría..."
                className="w-full h-10 px-3 bg-slate-900 border border-slate-700 rounded-xl text-xs focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold cursor-pointer transition-all"
              >
                {editingCategory ? 'Actualizar Categoría' : 'Crear Categoría'}
              </button>
            </div>
          </form>
        ) : categoryToDelete ? (
          /* Diálogo de Borrado Seguro con Reasignación Obligatoria */
          <div className="mt-4 p-4 rounded-2xl bg-rose-950/20 border border-rose-500/40 space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-rose-200">
                  ¿Eliminar "{categoryToDelete.name}"?
                </h4>
                {rules.filter((r) => r.categoryType === categoryToDelete.id).length > 0 ? (
                  <p className="text-xs text-rose-300/90 mt-1">
                    Esta categoría está en uso en{' '}
                    <b>
                      {rules.filter((r) => r.categoryType === categoryToDelete.id).length} compromiso(s)
                    </b>
                    . Para proteger tus datos y no dejar gastos huérfanos, selecciona la categoría de destino
                    a la que reasignarlos:
                  </p>
                ) : (
                  <p className="text-xs text-slate-300 mt-1">
                    Esta categoría no tiene ningún compromiso asignado. Puede eliminarse de forma limpia.
                  </p>
                )}
              </div>
            </div>

            {rules.filter((r) => r.categoryType === categoryToDelete.id).length > 0 && (
              <div className="space-y-1 pt-1">
                <label className="text-[11px] font-bold text-slate-300">
                  Reasignar compromisos a:
                </label>
                <select
                  value={reassignTargetId}
                  onChange={(e) => setReassignTargetId(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-900 border border-rose-500/50 rounded-xl text-xs text-white focus:outline-none"
                >
                  {categories
                    .filter((c) => c.id !== categoryToDelete.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-700 text-xs font-bold text-slate-300 hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold cursor-pointer"
              >
                Confirmar Eliminación
              </button>
            </div>
          </div>
        ) : (
          /* Lista de Categorías */
          <div className="mt-4 flex-1 overflow-y-auto space-y-2 pr-1">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-bold text-slate-400">
                {categories.length} Categorías activas
              </span>
              <button
                onClick={handleOpenAdd}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer transition-all"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Nueva Categoría</span>
              </button>
            </div>

            {categories.map((cat, idx) => {
              const Comp = LUCIDE_CATEGORY_ICONS[cat.icon] || Tag;
              const inUseCount = rules.filter((r) => r.categoryType === cat.id).length;

              return (
                <div
                  key={cat.id}
                  {...getItemProps(idx)}
                  className={`rounded-2xl border flex items-stretch transition-all duration-300 ease-out overflow-hidden ${
                    dragIndex === idx
                      ? 'ring-2 ring-blue-400 scale-[1.03] -translate-y-1 shadow-2xl shadow-blue-500/25 z-30 bg-slate-800/95 border-blue-400 opacity-95'
                      : overIndex === idx && dragIndex !== null
                      ? 'scale-[0.97] translate-y-1 opacity-40 bg-slate-950/90 border-dashed border-2 border-blue-500/50 shadow-inner ring-1 ring-blue-500/20 z-10'
                      : 'border-slate-800 hover:border-slate-700 bg-slate-900/90 scale-100 translate-y-0 opacity-100'
                  }`}
                >
                  {/* Fina Pestaña Lateral Táctil (Drag Handle) */}
                  <div
                    {...getHandleProps(idx)}
                    className="w-7 sm:w-8 flex items-center justify-center bg-slate-950/50 hover:bg-blue-600/20 active:bg-blue-600/40 border-r border-slate-800/80 cursor-grab active:cursor-grabbing text-slate-500 hover:text-blue-400 active:text-blue-300 transition-colors shrink-0 select-none group"
                    title="Mantén pulsado y arrastra para reordenar"
                    aria-label="Arrastrar para mover"
                  >
                    <GripVertical className="w-4 h-4 transition-transform group-active:scale-110" />
                  </div>

                  <div className="p-3 flex-1 flex items-center justify-between gap-3 min-w-0">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
                        style={{
                          backgroundColor: `${cat.color || '#3b82f6'}20`,
                          borderColor: `${cat.color || '#3b82f6'}50`,
                          color: cat.color || '#3b82f6',
                        }}
                      >
                        <Comp className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-white truncate">{cat.name}</span>
                          {cat.isSystem ? (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold border border-slate-700">
                              Sistema
                            </span>
                          ) : (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/30">
                              Personalizada
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 block truncate">
                          {inUseCount > 0 ? `${inUseCount} compromiso(s) asignado(s)` : 'Sin compromisos activos'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      {/* Reordenar rápido por botón accesible */}
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMove(idx, 'up')}
                        className="p-1 text-slate-500 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                        title="Subir"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === categories.length - 1}
                        onClick={() => handleMove(idx, 'down')}
                        className="p-1 text-slate-500 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                        title="Bajar"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Editar */}
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(cat)}
                        className="p-1.5 text-slate-400 hover:text-blue-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Eliminar */}
                      <button
                        type="button"
                        onClick={() => handlePromptDelete(cat)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pie: Restablecer defaults */}
        {!isFormOpen && !categoryToDelete && (
          <div className="pt-3 mt-3 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="text-[11px] font-semibold text-slate-400 hover:text-amber-300 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Restaurar las 12 categorías iniciales del sistema"
            >
              <RotateCcw className="w-3 h-3 text-amber-400" />
              <span>Restablecer categorías del sistema</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs font-bold text-slate-300 cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
