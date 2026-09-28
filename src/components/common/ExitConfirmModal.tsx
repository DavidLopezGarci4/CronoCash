import React from 'react';
import { LogOut, X, ShieldAlert } from 'lucide-react';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { HapticService } from '../../services/hapticService';

interface ExitConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExitConfirmModal: React.FC<ExitConfirmModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleConfirmExit = async () => {
    await HapticService.notificationWarning();
    if (Capacitor.isNativePlatform()) {
      await CapApp.exitApp();
    } else {
      // Fallback para entorno web / navegador
      try {
        window.close();
      } catch {
        // En caso de que el navegador restrinja window.close()
      }
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col space-y-4">
        {/* Cabecera del Diálogo */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400">
              <LogOut className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">¿Salir de CronoCash?</h3>
              <p className="text-xs text-slate-400">Cierre de aplicación</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mensaje Informativo */}
        <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-300 leading-relaxed space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-slate-200">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Tus datos permanecen cifrados</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Toda tu información está guardada de forma segura en este dispositivo. Puedes salir con total tranquilidad.
          </p>
        </div>

        {/* Botones de Acción */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirmExit}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white font-extrabold text-xs shadow-md shadow-rose-950/40 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Confirmar y Salir</span>
          </button>
        </div>
      </div>
    </div>
  );
};
