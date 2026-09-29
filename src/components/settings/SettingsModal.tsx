import React, { useState, Suspense } from 'react';
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
  Bell,
  Clock,
  Sparkles,
  Cloud,
  Layers,
  ChevronRight,
  FileText,
  BookOpen,
  Smartphone,
  Image as ImageIcon,
  Loader2,
  Info,
  ShieldCheck,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Settings, BackupEnvelope } from '../../types';
import { DBService } from '../../services/db';
import { AuthService } from '../../services/auth';
import { NotificationService } from '../../services/notificationService';
import { HapticService } from '../../services/hapticService';
import { VaultCryptoService } from '../../services/vaultCryptoService';
import { AboutModal } from '../about/AboutModal';
import { FAQModal } from '../faq/FAQModal';

const AppArchitectureGraph = React.lazy(() => import('./AppArchitectureGraph'));

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onSettingsSaved: (updated: Settings) => void;
  onDataRestored: () => void;
  onOpenBackup?: () => void;
  onOpenSmartRules?: () => void;
  onOpenReports?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSettingsSaved,
  onDataRestored,
  onOpenBackup,
  onOpenSmartRules,
  onOpenReports,
}) => {
  const [userFullName, setUserFullName] = useState(settings.userFullName || '');
  const [companyName, setCompanyName] = useState(settings.companyName || '');
  const [taxId, setTaxId] = useState(settings.taxId || '');
  const [monthlyIncome, setMonthlyIncome] = useState(String(settings.monthlyIncome || 0));
  const [savingsBuffer, setSavingsBuffer] = useState(String(settings.savingsBuffer ?? 250));
  const [currency, setCurrency] = useState(settings.currency || '€');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [biometriaActiva, setBiometriaActiva] = useState(settings.biometriaActiva || false);
  const [guardarContrasenaAuto, setGuardarContrasenaAuto] = useState(
    settings.guardarContrasenaAuto || false
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    settings.notificationsEnabled ?? true
  );
  const [notificationHour, setNotificationHour] = useState(
    settings.notificationHour || '21:30'
  );
  const [hapticsEnabled, setHapticsEnabled] = useState(settings.hapticsEnabled ?? true);
  const [hapticTested, setHapticTested] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [importMessage, setImportMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(
    null
  );
  const [showTechStack, setShowTechStack] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showFAQModal, setShowFAQModal] = useState(false);
  const [verticonsModalOpen, setVerticonsModalOpen] = useState(false);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
  const [vaultStatus, setVaultStatus] = useState<string | null>(null);

  const handleVerifyVault = async () => {
    try {
      const res = await VaultCryptoService.verifyIntegrity();
      if (res.ok) {
        setVaultStatus('Verificada OK (AES-256)');
        await HapticService.notificationSuccess();
      } else {
        setVaultStatus('Error verificación');
        await HapticService.notificationError();
      }
      setTimeout(() => setVaultStatus(null), 3000);
    } catch {
      setVaultStatus('Error');
    }
  };

  const handleDownloadImage = async (imagePath: string, fileName: string, title: string) => {
    setDownloadingFile(fileName);
    try {
      const response = await fetch(imagePath);
      if (!response.ok) throw new Error('No se pudo obtener el archivo de imagen.');
      const blob = await response.blob();

      if (Capacitor.isNativePlatform()) {
        const reader = new FileReader();
        const base64Data = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            const res = reader.result as string;
            const base64 = res.split(',')[1] || res;
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        const fileResult = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Cache,
        });

        await Share.share({
          title,
          text: `Icono CronoCash: ${fileName}`,
          url: fileResult.uri,
          dialogTitle: `Guardar o compartir ${fileName}`,
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch (err) {
      console.error('Error al descargar o compartir icono:', err);
      alert('No se pudo guardar la imagen en el dispositivo.');
    } finally {
      setDownloadingFile(null);
    }
  };

  if (!isOpen) return null;

  const handleTestNotification = async () => {
    setTestSent(true);
    await NotificationService.sendTestNotification(3);
    setTimeout(() => setTestSent(false), 3500);
  };

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Settings = {
      ...settings,
      userFullName: userFullName.trim(),
      companyName: companyName.trim(),
      taxId: taxId.trim(),
      monthlyIncome: parseFloat(monthlyIncome.replace(',', '.')) || 0,
      savingsBuffer: parseFloat(savingsBuffer.replace(',', '.')) || 0,
      currency,
      notificationsEnabled,
      notificationHour,
      hapticsEnabled,
      biometriaActiva,
      guardarContrasenaAuto,
      updatedAt: new Date().toISOString(),
    };

    HapticService.setEnabled(hapticsEnabled);

    // Programar o actualizar recordatorio diario
    await NotificationService.scheduleDailyReviewReminder(notificationsEnabled, notificationHour);

    // Si el usuario introdujo un nuevo PIN
    if (newPin.trim()) {
      if (newPin.trim().length < 4) {
        await HapticService.notificationError();
        alert('El nuevo PIN debe tener al menos 4 caracteres.');
        return;
      }
      if (newPin !== confirmPin) {
        await HapticService.notificationError();
        alert('Los PINs introducidos no coinciden.');
        return;
      }
      updated.pinSeguridad = newPin.trim();
      updated.bloqueoPinActivo = true;
      AuthService.setPassword(newPin.trim(), true);
    }

    await DBService.saveSettings(updated);
    await HapticService.notificationSuccess();
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
      AuthService.keepSessionUnlockedAfterRestore();
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
                <label className="text-[11px] font-bold text-slate-400">Ingresos Mensuales Estimados (Salario Base)</label>
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

          {/* Colchón de Ahorro & Reserva de Imprevistos */}
          <div className="space-y-3 p-3 bg-slate-900/80 border border-slate-800 rounded-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-teal-400" />
                <span>Colchón de Ahorro & Imprevistos</span>
              </h3>
            </div>

            <div className="space-y-2">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">Importe Blindado para Colchón / Fondo de Emergencia</label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    step="0.01"
                    value={savingsBuffer}
                    onChange={(e) => setSavingsBuffer(e.target.value)}
                    placeholder="250"
                    className="w-full h-10 px-3 pr-8 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono font-bold text-teal-400"
                  />
                  <span className="absolute right-3 text-xs text-slate-400 font-mono">{currency}</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Este fondo queda protegido ante el cálculo del <strong className="text-slate-300">Gasto Diario Seguro</strong>, asegurando que nunca comprometas tu colchón ante emergencias sin previo aviso.
              </p>
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

          {/* Bóveda Cifrada Local (AES-GCM-256) */}
          <div className="space-y-3 p-3 bg-slate-900/80 border border-emerald-500/30 rounded-2xl relative overflow-hidden shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Bóveda Cifrada en Reposo (AES-GCM-256)</span>
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-400" />
                Blindaje Activo
              </span>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              Tus gastos, ingresos, facturas y saldos se almacenan cifrados en reposo en tu dispositivo mediante <strong>cifrado militar autenticado AES-GCM de 256 bits</strong> con clave única local. Nadie ajeno a tu aplicación puede leer tu información financiera.
            </p>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-slate-400 font-mono">
                Estándar NIST SP 800-38D • 100% Offline
              </span>
              <button
                type="button"
                onClick={handleVerifyVault}
                className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>{vaultStatus ? vaultStatus : 'Verificar Bóveda'}</span>
              </button>
            </div>
          </div>

          {/* Notificaciones y Alarmas Programadas */}
          <div className="space-y-3 p-3 bg-slate-900/80 border border-slate-800 rounded-2xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-emerald-400" />
                <span>Notificaciones y Alarmas</span>
              </span>
              <button
                type="button"
                onClick={handleTestNotification}
                disabled={testSent}
                className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all"
              >
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>{testSent ? '¡Enviada (3s)!' : 'Probar Alarma'}</span>
              </button>
            </h3>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
                className="rounded text-emerald-500 focus:ring-0"
              />
              <span className="text-xs text-slate-300 font-semibold">
                Activar avisos de cobro y recordatorio nocturno
              </span>
            </label>

            {notificationsEnabled && (
              <div className="pt-1 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-blue-400" />
                    <span>Cierre Diario de Gastos</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="time"
                      value={notificationHour}
                      onChange={(e) => setNotificationHour(e.target.value)}
                      className="px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white"
                    />
                    <span className="text-[10px] text-slate-400">Revisión de compras del día</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                    <Bell className="w-3 h-3 text-amber-400" />
                    <span>Avisos Escalonados de Recibos</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Alarma automática <strong>3 días antes</strong> y a las <strong>09:00</strong> el día del cargo.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Respuesta Táctil & Háptica (Gentle AI Haptic Control) */}
          <div className="space-y-3 p-3 bg-slate-900/80 border border-slate-800 rounded-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-purple-400" />
                <span>Respuesta Táctil & Háptica</span>
              </h3>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border transition-colors ${
                hapticsEnabled
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {hapticsEnabled ? 'Activada' : 'Desactivada'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="hapticsToggle" className="text-xs font-semibold text-slate-200 block">
                  Vibración háptica en botones y avisos
                </label>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Respuesta táctil al pulsar botones, cambiar de pestaña y confirmar pagos
                </p>
              </div>
              <input
                id="hapticsToggle"
                type="checkbox"
                checked={hapticsEnabled}
                onChange={(e) => {
                  const val = e.target.checked;
                  setHapticsEnabled(val);
                  HapticService.setEnabled(val);
                  if (val) HapticService.impactMedium();
                }}
                className="w-5 h-5 rounded border-slate-700 text-purple-500 focus:ring-purple-500 bg-slate-800 cursor-pointer"
              />
            </div>

            {hapticsEnabled && (
              <div className="pt-1 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Verifica la intensidad en tu terminal:</span>
                <button
                  type="button"
                  onClick={async () => {
                    await HapticService.notificationSuccess();
                    setHapticTested(true);
                    setTimeout(() => setHapticTested(false), 2000);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>{hapticTested ? '¡Vibración Probada!' : 'Probar Vibración'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Reglas Inteligentes de Categorización */}
          <div className="space-y-3 p-3 bg-slate-900/80 border border-slate-800 rounded-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Auto-Categorización Inteligente</span>
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Offline Rules
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Reglas automáticas de coincidencia por patrón de comercio para clasificar tus gastos y extractos bancarios en su bolsa correspondiente.
            </p>

            {onOpenSmartRules && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSmartRules();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Gestionar Reglas de Categorización</span>
              </button>
            )}
          </div>

          {/* Informes de Dirección y Cuadro Fiscal Trimestral */}
          <div className="space-y-3 p-3 bg-slate-900/80 border border-slate-800 rounded-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span>Informes & Fiscalidad (PDF / CSV)</span>
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Mod. 130 / 303
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Genera informes ejecutivos de dirección en PDF para cualquier mes o consulta la liquidación trimestral para la AEAT con exportación del libro de facturas.
            </p>

            {onOpenReports && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenReports();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-300 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <FileText className="w-4 h-4 text-blue-400" />
                <span>Abrir Informes de Dirección & Fiscalidad</span>
              </button>
            )}
          </div>

          {/* Copias de Seguridad */}
          <div className="space-y-3 p-3 bg-slate-900/80 border border-slate-800 rounded-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copias de Seguridad</span>
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Drive 2 Ranuras
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Protege tus datos con la estrategia canónica de 2 ranuras en Google Drive o restaura con comparador inteligente previo a sobrescribir.
            </p>

            {onOpenBackup && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenBackup();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <Cloud className="w-4 h-4 text-emerald-400" />
                <span>Abrir Gestor Google Drive & Comparador</span>
              </button>
            )}

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
                <span>{exportSuccess ? '¡Descargado!' : 'Exportar Local'}</span>
              </button>

              <label
                onClick={() => AuthService.setPickingFile(true)}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Upload className="w-4 h-4 text-teal-400" />
                <span>Restaurar Rápido</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={(e) => {
                    AuthService.setPickingFile(false);
                    handleImportBackup(e);
                  }}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Centro de Ayuda & FAQ (Estándar Universal de FAQ) */}
          <div className="space-y-2 p-3 bg-slate-900/80 border border-slate-800 rounded-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-teal-400" />
                <span>Ayuda & Documentación</span>
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold">
                14 Módulos
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowFAQModal(true)}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-teal-500/40 transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20 text-teal-400 border border-teal-500/30 group-hover:scale-105 transition-transform">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Centro de Ayuda & FAQ (Manual Maestro)</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                  </div>
                  <p className="text-[10px] text-slate-400">
                    43 guías operativas, atajos, dudas frecuentes y buscador predictivo
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-400 group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>

          {/* Acerca de & Novedades de la App (Skill app-about-changelog) */}
          <div className="space-y-2 p-3 bg-slate-900/80 border border-slate-800 rounded-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Información & Novedades</span>
              </h3>
            </div>

            <button
              type="button"
              onClick={() => setShowAboutModal(true)}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/40 transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Acerca de CronoCash & Novedades</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Historial de versiones explicado para humanos, ficha técnica y licencia
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>

          {/* Arquitectura del Sistema & Salud del Stack */}
          <div className="space-y-2 p-3 bg-slate-900/80 border border-slate-800 rounded-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                <span>Transparencia & Arquitectura</span>
              </h3>
            </div>

            <button
              type="button"
              onClick={() => setShowTechStack(true)}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-blue-500/40 transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/25 group-hover:scale-105 transition-transform">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Arquitectura y Salud del Stack</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Grafo interactivo de tecnologías, dependencias y telemetría en tiempo real
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>

          {/* Personalización de Icono & Tarjetas Verticons */}
          <div className="space-y-2 p-3 bg-slate-900/80 border border-slate-800 rounded-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                <span>Icono & Verticons Pack</span>
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                2:3 Mobile
              </span>
            </div>

            <button
              type="button"
              onClick={() => setVerticonsModalOpen(true)}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/40 transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/25 group-hover:scale-105 transition-transform">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Personalización de Icono Oficial & Verticons</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Descarga el icono APK oficial y tarjetas 2:3 Verticons para lanzadores Android
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
            </button>
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

        {showTechStack && (
          <Suspense fallback={null}>
            <AppArchitectureGraph
              isOpen={showTechStack}
              onClose={() => setShowTechStack(false)}
            />
          </Suspense>
        )}

        {showAboutModal && (
          <AboutModal
            isOpen={showAboutModal}
            onClose={() => setShowAboutModal(false)}
            onOpenArchitecture={() => setShowTechStack(true)}
            onOpenFAQ={() => setShowFAQModal(true)}
          />
        )}

        {showFAQModal && (
          <FAQModal
            isOpen={showFAQModal}
            onClose={() => setShowFAQModal(false)}
          />
        )}

        {/* Modal de Icono APK Oficial y Colección Verticons 2:3 */}
        {verticonsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <div className="bg-[#0b111e] border border-cyan-500/40 rounded-3xl w-full max-w-lg p-5 text-white shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-cyan-400" />
                  <span>Iconografía Oficial CronoCash</span>
                </h3>
                <button
                  onClick={() => setVerticonsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 space-y-5">
                {/* Comparativa de Iconos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
                  {/* 1. Icono Launcher APK (Squircle) */}
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 flex flex-col items-center">
                    <span className="text-xs font-bold text-slate-300">Icono Launcher APK</span>
                    <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-2xl border border-slate-700/80 bg-slate-950">
                      <img
                        src="/logo.jpg"
                        alt="CronoCash Launcher"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Adaptive Squircle 1:1 integrado en el instalador Android
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDownloadImage('/logo.jpg', 'crono-cash-launcher.jpg', 'Icono CronoCash Oficial')}
                      disabled={downloadingFile === 'crono-cash-launcher.jpg'}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs font-bold text-slate-200 flex items-center gap-1 border border-slate-700 cursor-pointer disabled:opacity-50 transition-all shadow-md"
                    >
                      {downloadingFile === 'crono-cash-launcher.jpg' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                      <span>{downloadingFile === 'crono-cash-launcher.jpg' ? 'Guardando...' : 'Descargar JPG'}</span>
                    </button>
                  </div>

                  {/* 2. Verticons Card Edition */}
                  <div className="p-4 rounded-2xl bg-slate-900 border border-cyan-500/40 space-y-3 flex flex-col items-center">
                    <span className="text-xs font-bold text-cyan-300 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Verticons Card Pack</span>
                    </span>
                    <div className="w-20 h-30 rounded-2xl overflow-hidden shadow-2xl border border-cyan-400/50 bg-slate-950/60 p-0.5">
                      <img
                        src="/verticon-icon.png"
                        alt="CronoCash Verticons"
                        className="w-full h-full object-contain drop-shadow-[0_0_12px_rgba(52,211,153,0.3)]"
                      />
                    </div>
                    <span className="text-[11px] text-slate-400 text-center">
                      Tarjeta vertical 2:3 al ras con marco de neón esmeralda y fibra de carbono (sin marcos negros)
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleDownloadImage('/verticon-icon.png', 'crono-cash-verticon.png', 'Tarjeta Verticons Transparente')}
                        disabled={downloadingFile === 'crono-cash-verticon.png'}
                        className="px-2.5 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 active:scale-95 text-xs font-bold text-cyan-300 flex items-center gap-1 border border-cyan-500/40 cursor-pointer disabled:opacity-50 transition-all shadow-md"
                      >
                        {downloadingFile === 'crono-cash-verticon.png' ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                        <span>{downloadingFile === 'crono-cash-verticon.png' ? 'Guardando...' : 'PNG Transparente'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadImage('/verticon-icon.jpg', 'crono-cash-verticon.jpg', 'Tarjeta Verticons JPG')}
                        disabled={downloadingFile === 'crono-cash-verticon.jpg'}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs font-bold text-slate-300 flex items-center gap-1 border border-slate-700 cursor-pointer disabled:opacity-50 transition-all shadow-md"
                      >
                        {downloadingFile === 'crono-cash-verticon.jpg' ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                        <span>{downloadingFile === 'crono-cash-verticon.jpg' ? 'Guardando...' : 'JPG'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Instrucciones de aplicación en Android */}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs text-slate-300">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-cyan-400" />
                    <span>Cómo aplicar el icono en tu teléfono Android:</span>
                  </div>
                  <ol className="list-decimal pl-4 space-y-1 text-slate-400">
                    <li>
                      <strong>Icono Automático:</strong> Al instalar el APK compilado, tu teléfono
                      usará automáticamente el icono de la bóveda esmeralda en el launcher.
                    </li>
                    <li>
                      <strong>Personalización con Verticons:</strong> Descarga la imagen Verticons en
                      tu galería pulsando en "Descargar Verticon".
                    </li>
                    <li>
                      En tu launcher compatible (Nova Launcher, Niagara Launcher, Smart Launcher): mantén
                      pulsado el icono de CronoCash → Editar → Seleccionar imagen de Galería.
                    </li>
                  </ol>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => setVerticonsModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
