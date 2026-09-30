import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  BookOpen,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  PieChart,
  Repeat,
  Calendar,
  Bell,
  Cloud,
  Lightbulb,
  Smartphone,
  Cpu,
  Sparkles,
  Upload,
  Target,
  FileText,
  ChevronsUpDown,
  Tag,
} from 'lucide-react';
import { FAQ_DATA } from '../../config/faq.data';
import { FAQSection } from '../../types/faq';

interface FAQModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSectionId?: string;
}

export const FAQModal: React.FC<FAQModalProps> = ({
  isOpen,
  onClose,
  initialSectionId = 'all',
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialSectionId);
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  // Mapa de iconos temáticos por sección
  const getSectionIcon = (iconName?: string) => {
    switch (iconName) {
      case 'ShieldCheck':
        return ShieldCheck;
      case 'PieChart':
        return PieChart;
      case 'Repeat':
        return Repeat;
      case 'Calendar':
        return Calendar;
      case 'Bell':
        return Bell;
      case 'Cloud':
        return Cloud;
      case 'Lightbulb':
        return Lightbulb;
      case 'Smartphone':
        return Smartphone;
      case 'Cpu':
        return Cpu;
      case 'Sparkles':
        return Sparkles;
      case 'Upload':
        return Upload;
      case 'Target':
        return Target;
      case 'FileText':
        return FileText;
      default:
        return BookOpen;
    }
  };

  const totalQuestions = useMemo(() => {
    return FAQ_DATA.reduce((acc, s) => acc + s.items.length, 0);
  }, []);

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleAll = (expand: boolean) => {
    const next: Record<string, boolean> = {};
    FAQ_DATA.forEach((sec) => {
      sec.items.forEach((item) => {
        next[item.id] = expand;
      });
    });
    setOpenItems(next);
  };

  // Filtrado y auto-expansión en búsqueda
  const filteredSections = useMemo(() => {
    const q = search.trim().toLowerCase();
    return FAQ_DATA.map((section) => {
      // Si hay categoría activa y no es 'all', filtrar
      if (selectedCategory !== 'all' && section.id !== selectedCategory) {
        return null;
      }

      // Si no hay búsqueda, devolver todos los items de la sección
      if (!q) {
        return section;
      }

      // Filtrar preguntas, viñetas y etiquetas
      const matchedItems = section.items.filter((item) => {
        const inQuestion = item.question.toLowerCase().includes(q);
        const inBullets = item.bullets.some((b) => b.toLowerCase().includes(q));
        const inTags = item.tags?.some((t) => t.toLowerCase().includes(q));
        const inSectionTitle = section.title.toLowerCase().includes(q);
        return inQuestion || inBullets || inTags || inSectionTitle;
      });

      if (matchedItems.length === 0) return null;
      return { ...section, items: matchedItems };
    }).filter(Boolean) as FAQSection[];
  }, [search, selectedCategory]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[92vh] sm:h-[88vh] bg-white dark:bg-gradient-to-b dark:from-[#111827] dark:via-[#0d131f] dark:to-[#070b14] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Cabecera común del Modal */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                  Centro de Ayuda & FAQ
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  {FAQ_DATA.length} módulos • {totalQuestions} guías
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manual maestro operativo y resolución de dudas de CronoCash
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Controles de expansión rápida en desktop */}
            <div className="hidden sm:flex items-center space-x-1.5 mr-2">
              <button
                type="button"
                onClick={() => toggleAll(true)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-200 dark:bg-slate-800/80 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Expandir todo
              </button>
              <button
                type="button"
                onClick={() => toggleAll(false)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-200 dark:bg-slate-800/80 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Colapsar todo
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Buscador predictivo sticky */}
        <div className="px-4 sm:px-6 pt-3 pb-2 bg-slate-100/70 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800/60">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por función, concepto o duda (ej. biometrico, rollover, sha-256, modelo 130)..."
              className="w-full pl-10 pr-9 py-2 rounded-xl bg-white dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700/80 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 shadow-inner transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Chips de categoría envolventes en MÓVIL (flex-wrap sin scroll horizontal) */}
          <div className="flex md:hidden flex-wrap gap-1.5 pt-2.5 max-h-24 overflow-y-auto">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                selectedCategory === 'all'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                  : 'bg-slate-200/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700/60'
              }`}
            >
              Todas ({totalQuestions})
            </button>
            {FAQ_DATA.map((sec) => (
              <button
                key={sec.id}
                onClick={() => setSelectedCategory(sec.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  selectedCategory === sec.id
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                    : 'bg-slate-200/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700/60'
                }`}
              >
                {sec.title.split('. ')[1] || sec.title} ({sec.items.length})
              </button>
            ))}
          </div>
        </div>

        {/* ÁREA PRINCIPAL: RESPONSIVE DUAL (Split View en Desktop, 1 Columna en Móvil) */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* SIDEBAR MASTER EN PANTALLA GRANDE (md:w-80 border-r) */}
          <aside className="hidden md:flex md:w-72 lg:w-80 flex-col border-r border-slate-200 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-950/40 p-3 space-y-1 overflow-y-auto">
            <div className="px-2 py-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Secciones</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">14</span>
            </div>

            <button
              onClick={() => setSelectedCategory('all')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-2.5 truncate">
                <BookOpen className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span className="truncate">Todas las Secciones</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {totalQuestions}
              </span>
            </button>

            <div className="space-y-0.5 pt-1">
              {FAQ_DATA.map((sec) => {
                const Icon = getSectionIcon(sec.iconName);
                const isSelected = selectedCategory === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => setSelectedCategory(sec.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/40 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 truncate pr-2">
                      <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`} />
                      <span className="truncate">{sec.title}</span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 shrink-0">
                      {sec.items.length}
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* PANEL DE DETALLE / ACORDEONES (Scroll vertical fluido) */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {filteredSections.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700/60 flex items-center justify-center text-slate-400 mx-auto">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">No se encontraron resultados</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  No hay guías ni preguntas que coincidan con &quot;{search}&quot;. Prueba con otros términos como
                  &quot;recibos&quot;, &quot;pin&quot; o &quot;drive&quot;.
                </p>
                <button
                  onClick={() => setSearch('')}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors"
                >
                  Limpiar búsqueda
                </button>
              </div>
            ) : (
              filteredSections.map((sec) => {
                const SecIcon = getSectionIcon(sec.iconName);
                return (
                  <div
                    key={sec.id}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800/90 bg-white dark:bg-slate-900/40 overflow-hidden shadow-sm max-w-3xl"
                  >
                    {/* Cabecera de la Sección */}
                    <div className="px-4 py-3 bg-slate-100/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-3">
                      <div className="flex items-center space-x-2.5 truncate">
                        <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                          <SecIcon className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                            {sec.title}
                          </h3>
                          {sec.description && (
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                              {sec.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                        {sec.items.length} {sec.items.length === 1 ? 'guía' : 'guías'}
                      </span>
                    </div>

                    {/* Acordeones de Preguntas */}
                    <div className="divide-y divide-slate-200 dark:divide-slate-800/60">
                      {sec.items.map((item) => {
                        // Auto-expandir si el usuario busca algo, o según estado
                        const isSearchMatch = search.trim().length > 0;
                        const isOpen = isSearchMatch || !!openItems[item.id];

                        return (
                          <div key={item.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/20">
                            <button
                              type="button"
                              onClick={() => toggleItem(item.id)}
                              className="w-full px-4 py-3.5 flex items-center justify-between text-left gap-3 cursor-pointer group"
                            >
                              <div className="flex items-center space-x-2 flex-1">
                                <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
                                  {item.question}
                                </span>
                                {item.badge && (
                                  <span className="hidden sm:inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              <div className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800/60 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white transition-colors shrink-0">
                                {isOpen ? (
                                  <ChevronUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </div>
                            </button>

                            {isOpen && (
                              <div className="px-4 pb-4 pt-1 bg-slate-50/70 dark:bg-slate-950/40 border-t border-slate-200 dark:border-slate-800/40 animate-in fade-in duration-150">
                                <ul className="space-y-2 mt-1">
                                  {item.bullets.map((bullet, idx) => {
                                    // Resaltar el título de la viñeta si tiene dos puntos
                                    const parts = bullet.split(': ');
                                    const hasPrefix = parts.length > 1;

                                    return (
                                      <li
                                        key={idx}
                                        className="text-xs sm:text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed flex items-start space-x-2"
                                      >
                                        <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0 mt-0.5">
                                          •
                                        </span>
                                        <div>
                                          {hasPrefix ? (
                                            <>
                                              <strong className="text-slate-900 dark:text-white font-semibold">
                                                {parts[0]}:{' '}
                                              </strong>
                                              <span>{parts.slice(1).join(': ')}</span>
                                            </>
                                          ) : (
                                            <span>{bullet}</span>
                                          )}
                                        </div>
                                      </li>
                                    );
                                  })}
                                </ul>

                                {item.tags && item.tags.length > 0 && (
                                  <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800/50 flex flex-wrap gap-1 items-center">
                                    <Tag className="w-3 h-3 text-slate-400 dark:text-slate-500 mr-1" />
                                    {item.tags.map((t, tidx) => (
                                      <span
                                        key={tidx}
                                        className="text-[10px] font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800"
                                      >
                                        #{t}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </main>
        </div>

        {/* Pie del Modal */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
            Sincronizado con <span className="font-mono text-slate-700 dark:text-slate-300">docs/FAQ.md</span> • Versión v1.13.0
          </p>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors ml-auto cursor-pointer"
          >
            Entendido, cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
