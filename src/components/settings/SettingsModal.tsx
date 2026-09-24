import React, { useState } from 'react';
import {
  X,
  Shield,
  Key,
  Fingerprint,
  Download,
  Upload,
  Check,
  Building,
  User,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import { Settings, BackupEnvelope } from '../../types';
import { DBService } from '../../services/db';
import { AuthService } from '../../services/auth';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onSettingsSaved: (updated: Settings) => void;
  onDataRestored: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSettingsSaved,
  onDataRestored,
}) => {
  const [userFullName, setUserFullName] = useState(settings.userFullName || '');
  const [companyName, setCompanyName] = useState(settings.companyName || '');
  const [taxId, setTaxId] = useState(settings.taxId || '');
  const [monthlyIncome, setMonthlyIncome] = useState(String(settings.monthlyIncome || 0));
  const [currency, setCurrency] = useState(settings.currency || '€');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [biometriaActiva, setBiometriaActiva] = useState(settings.biometriaActiva || false);
  const [guardarContrasenaAuto, setGuardarContrasenaAuto] = useState(
    settings.guardarContrasenaAuto || false
  );
  const [exportSuccess, setExportSuccess] = useState(false);
  const [importMessage, setImportMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(
    null
  );

  if (!isOpen) return null;

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Settings = {
      ...settings,
      userFullName: userFullName.trim(),
      companyName: companyName.trim(),
      taxId: taxId.trim(),
      monthlyIncome: parseFloat(monthlyIncome.replace(',', '.')) || 0,
      currency,
      biometriaActiva,
      guardarContrasenaAuto,
      updatedAt: new Date().toISOString(),
    };

    // Si el usuario introdujo un nuevo PIN
    if (newPin.trim()) {
      if (newPin.trim().length < 4) {
        alert('El nuevo PIN debe tener al menos 4 caracteres.');
        return;
      }
      if (newPin !== confirmPin) {
        alert('Los PINs introducidos no coinciden.');
        return;
      }
      updated.pinSeguridad = newPin.trim();
      updated.bloqueoPinActivo = true;
      AuthService.setPassword(newPin.trim(), true);
    }

    await DBService.saveSettings(updated);
    onSettingsSaved(updated);
    onClose();
  };

  const handleExportBackup = async () => {
    try {
      const envelope = await DBService.exportBackupEnvelope();
      const json = JSON.stringify(envelope, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gastos-facturacion-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (e: any) {
      alert('Error al exportar: ' + e.message);
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const envelope = JSON.parse(text) as BackupEnvelope;
      if (!envelope.version || !envelope.settings) {
        throw new Error('Archivo de respaldo no compatible.');
      }
      await DBService.importBackupEnvelope(envelope);
      setImportMessage({ type: 'ok', text: 'Copia de seguridad restaurada correctamente.' });
      setTimeout(() => {
        onDataRestored();
        onClose();
      }, 1200);
    } catch (err: any) {
      setImportMessage({ type: 'err', text: 'Error al importar: ' + err.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-[#0f172a] border border-slate-700/80 rounded-3xl w-full max-w-lg p-5 text-white shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white">Configuración y Bóveda</h2>
              <p className="text-xs text-slate-400">Seguridad, perfil y copias de seguridad</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSaveGeneral} className="mt-4 space-y-4">
          {/* Perfil & Datos Fiscales */}
          <div className="space-y-3 p-3 bg-slate-900/80 border border-slate-800 rounded-2xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span>Perfil y Facturación</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">Titular / Nombre</label>
                <input
                  type="text"
                  value={userFullName}
                  onChange={(e) => setUserFullName(e.target.value)}
                  placeholder="Tu nombre..."
                  className="w-full h-10 px-3 bg-slate-950 border border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">Empresa / Razón Social</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Mi Negocio SL / Autónomo..."
                  className="w-full h-10 px-3 bg-slate-950 border border-slate-700 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">NIF / CIF</label>
                <input
                  type="text"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  placeholder="B12345678"
                  className="w-full h-10 px-3 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">Ingresos Mensuales Estimados</label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    step="0.01"
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(e.target.value)}
                    placeholder="2000"
                    className="w-full h-10 px-3 pr-8 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono font-bold text-emerald-400"
                  />
                  <span className="absolute right-3 text-xs text-slate-400">{currency}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Seguridad y Clave PIN */}
          <div className="space-y-3 p-3 bg-slate-900/80 border border-slate-800 rounded-2xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cambio de PIN de Seguridad</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">Nuevo PIN (Opcional)</label>
                <input
                  type="password"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="Dejar vacío para no cambiar"
                  className="w-full h-10 px-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-center font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">Confirmar Nuevo PIN</label>
                <input
                  type="password"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  placeholder="Repite el nuevo PIN"
                  className="w-full h-10 px-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-center font-mono"
                />
              </div>
            </div>

            <div className="flex flex-col space-y-2 pt-1">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={guardarContrasenaAuto}
                  onChange={(e) => setGuardarContrasenaAuto(e.target.checked)}
                  className="rounded text-emerald-500 focus:ring-0"
                />
                <span className="text-xs text-slate-300">Mantener sesión iniciada en este dispositivo</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={biometriaActiva}
                  onChange={(e) => setBiometriaActiva(e.target.checked)}
                  className="rounded text-emerald-500 focus:ring-0"
                />
                <span className="text-xs text-slate-300">Permitir desbloqueo con Huella Dactilar</span>
              </label>
            </div>
          </div>

          {/* Copias de Seguridad */}
          <div className="space-y-3 p-3 bg-slate-900/80 border border-slate-800 rounded-2xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Copias de Seguridad (Backup JSON)</span>
            </h3>

            {importMessage && (
              <div
                className={`p-2 rounded-xl text-xs font-medium ${
                  importMessage.type === 'ok'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                {importMessage.text}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleExportBackup}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>{exportSuccess ? '¡Descargado!' : 'Exportar Backup'}</span>
              </button>

              <label className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer">
                <Upload className="w-4 h-4 text-teal-400" />
                <span>Restaurar JSON</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-bold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold shadow-md shadow-emerald-500/20 cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Guardar Ajustes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
