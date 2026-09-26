import React, { useState } from 'react';
import {
  X,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Cpu,
  Smartphone,
  ExternalLink,
  History,
  Layers,
  Heart,
  CheckCircle2,
} from 'lucide-react';
import userChangelog from '../../config/changelog.user.json';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenArchitecture?: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({
  isOpen,
  onClose,
  onOpenArchitecture,
}) => {
  const [expandedVersions, setExpandedVersions] = useState<Record<string, boolean>>({
    '1.11.0': false,
    '1.10.0': false,
  });

  if (!isOpen) return null;

  const currentVer = userChangelog.versions[0];
  const previousVersions = userChangelog.versions.slice(1);

  const toggleVersion = (ver: string) => {
    setExpandedVersions((prev) => ({
      ...prev,
      [ver]: !prev[ver],
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-gradient-to-b from-[#131b2e] to-[#0b101d] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-none">
                Acerca de & Novedades
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Historial de cambios e información de la app
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido con Scroll */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Ficha de Identidad de la App */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/80 to-[#0e172a] border border-slate-800 p-5 text-center sm:text-left sm:flex sm:items-center sm:space-x-5 shadow-inner">
            <div className="mx-auto sm:mx-0 w-20 h-20 rounded-2xl p-1 bg-gradient-to-br from-emerald-500/40 to-teal-500/10 border border-emerald-500/30 shadow-xl relative shrink-0">
              <img
                src="/logo.jpg"
                alt="Logo"
                className="w-full h-full object-cover rounded-xl"
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900" />
            </div>

            <div className="mt-4 sm:mt-0 flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h3 className="text-xl font-black text-white tracking-tight">
                  {userChangelog.appName}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  v{userChangelog.currentVersion}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                  Build {userChangelog.buildNumber}
                </span>
              </div>

              <p className="text-xs text-slate-300 font-medium mt-1">
                {userChangelog.appSubtitle}
              </p>

              <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-[11px] text-slate-400">
                <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3" />
                  <span>100% Local & Privado</span>
                </span>
                <span className="inline-flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/60">
                  <Smartphone className="w-3 h-3 text-cyan-400" />
                  <span>Android APK / PWA</span>
                </span>
              </div>
            </div>
          </div>

          {/* Tarjeta Heroica: Novedades de la Versión Instalada */}
          <div className="rounded-2xl bg-gradient-to-br from-emerald-950/20 via-slate-900 to-slate-900/90 border-2 border-emerald-500/30 p-5 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <h4 className="text-sm font-black text-white uppercase tracking-wider">
                  Novedades de la Versión v{currentVer.version}
                </h4>
              </div>
              <span className="text-[11px] font-mono text-emerald-400/80">
                {currentVer.date}
              </span>
            </div>

            <p className="text-xs font-bold text-emerald-300 mb-3">
              {currentVer.title}
            </p>

            <ul className="space-y-2.5">
              {currentVer.highlights.map((h, i) => (
                <li
                  key={i}
                  className="flex items-start space-x-2.5 text-xs text-slate-200 leading-relaxed bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Botón de Acceso a Salud del Stack si está configurado */}
          {onOpenArchitecture && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/30 via-indigo-950/20 to-slate-900 border border-blue-500/30 flex items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">
                    Grafo de Arquitectura & Salud del Stack
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Inspecciona en tiempo real las 6 tecnologías nucleares a 60 FPS
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenArchitecture();
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-600/20 flex items-center gap-1.5 shrink-0"
              >
                <span>Inspeccionar</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Historial Desplegable de Versiones Anteriores */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 px-1">
              <History className="w-4 h-4 text-slate-400" />
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Historial de Versiones Previas
              </h4>
            </div>

            <div className="space-y-2">
              {previousVersions.map((ver) => {
                const isExpanded = expandedVersions[ver.version] ?? false;
                return (
                  <div
                    key={ver.version}
                    className="rounded-xl border border-slate-800/80 bg-slate-900/40 overflow-hidden transition-all duration-200"
                  >
                    <button
                      onClick={() => toggleVersion(ver.version)}
                      className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="flex items-center space-x-2.5">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-slate-800 text-emerald-400 border border-slate-700">
                          v{ver.version}
                        </span>
                        <span className="text-xs font-semibold text-slate-200">
                          {ver.title}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-slate-400">
                        <span className="text-[10px] font-mono hidden sm:inline">
                          {ver.date}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="p-3 pt-0 border-t border-slate-800/60 bg-slate-950/30">
                        <ul className="space-y-2 mt-2.5">
                          {ver.highlights.map((h, idx) => (
                            <li
                              key={idx}
                              className="text-xs text-slate-300 flex items-start space-x-2"
                            >
                              <span className="text-emerald-500 font-bold">•</span>
                              <span>{h}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ficha Legal y Compromiso de Privacidad */}
          <div className="pt-2 border-t border-slate-800/80 text-center space-y-1.5">
            <p className="text-[11px] text-slate-400">
              {userChangelog.developer} • {userChangelog.license}
            </p>
            <p className="text-[10px] text-slate-500">
              {userChangelog.privacyBadge}
            </p>
          </div>
        </div>

        {/* Pie del Modal */}
        <div className="px-5 py-3 border-t border-slate-800/80 bg-slate-900/60 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
