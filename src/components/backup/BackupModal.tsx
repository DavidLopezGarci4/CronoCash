import React, { useState, useEffect, useRef } from 'react';
import {
  Cloud,
  Download,
  Upload,
  Shield,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  X,
  FileText,
  Database,
  ArrowRightLeft,
  Calendar,
  Layers,
  Repeat,
  DollarSign,
  HelpCircle,
  Clock,
  Sparkles,
  ChevronRight,
  HardDrive,
  Share2,
} from 'lucide-react';
import {
  GoogleDriveBackupService,
  DRIVE_SLOT_ACTUAL,
  DRIVE_SLOT_PREVIA,
  BackupInspectionResult,
  DatabaseCurrentStats,
} from '../../services/googleDriveBackup';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataRestored: () => void;
  currency?: string;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  onDataRestored,
  currency = '€',
}) => {
  const [activeTab, setActiveTab] = useState<'drive' | 'local' | 'restore'>('drive');
  const [selectedSlot, setSelectedSlot] = useState<'actual' | 'previa'>('actual');
  const [isExporting, setIsExporting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showDriveHelp, setShowDriveHelp] = useState(false);

  // Estados del Comparador Previo y Restauración
  const [currentStats, setCurrentStats] = useState<DatabaseCurrentStats | null>(null);
  const [inspectedBackup, setInspectedBackup] = useState<{
    fileContent: string;
    inspection: BackupInspectionResult;
  } | null>(null);
  const [restoreMode, setRestoreMode] = useState<'overwrite' | 'merge'>('overwrite');
  const [confirmCheckbox, setConfirmCheckbox] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar estadísticas actuales de la base de datos
  const refreshCurrentStats = async () => {
    try {
      const stats = await GoogleDriveBackupService.getCurrentStats();
      setCurrentStats(stats);
    } catch (e) {
      console.error('Error al obtener estadísticas actuales:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshCurrentStats();
      setFeedback(null);
      setInspectedBackup(null);
      setConfirmCheckbox(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // --- SUBIDA A GOOGLE DRIVE (2 RANURAS) ---
  const handleExportToDrive = async () => {
    setIsExporting(true);
    setFeedback(null);
    try {
      const payload = await GoogleDriveBackupService.createBackupPayload(selectedSlot);
      const jsonStr = JSON.stringify(payload, null, 2);
      const ok = await GoogleDriveBackupService.exportOrShareFile(
        payload.fileName,
        jsonStr,
        `Copia CronoCash (${payload.fileName})`,
        `Guardar en Google Drive: ${payload.fileName}`
      );

      if (ok) {
        setFeedback({
          type: 'success',
          message: `Copia "${payload.fileName}" lista. Se ha abierto el selector para guardarla en tu Google Drive.`,
        });
        await refreshCurrentStats();
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Error al preparar la copia para Google Drive.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // --- EXPORTACIÓN LOCAL CLÁSICA ---
  const handleExportLocal = async () => {
    setIsExporting(true);
    setFeedback(null);
    try {
      const payload = await GoogleDriveBackupService.createBackupPayload('actual');
      const dateTag = new Date().toISOString().split('T')[0];
      const customFileName = `CronoCash_Backup_${dateTag}.json`;
      const jsonStr = JSON.stringify(payload, null, 2);

      const ok = await GoogleDriveBackupService.exportOrShareFile(
        customFileName,
        jsonStr,
        `Copia de Seguridad CronoCash`,
        `Guardar o compartir copia de seguridad local`
      );

      if (ok) {
        setFeedback({
          type: 'success',
          message: `Copia de seguridad local generada como "${customFileName}".`,
        });
        await refreshCurrentStats();
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Error al exportar archivo local.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // --- SELECCIÓN Y ANÁLISIS DE ARCHIVO PARA RESTAURACIÓN ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFeedback(null);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const inspection = GoogleDriveBackupService.inspectBackupFile(content);

      if (!inspection.isValid) {
        setFeedback({
          type: 'error',
          message: inspection.error || 'El archivo seleccionado no es válido.',
        });
        setInspectedBackup(null);
      } else {
        await refreshCurrentStats();
        setInspectedBackup({
          fileContent: content,
          inspection,
        });
        setConfirmCheckbox(false);
      }
    };
    reader.readAsText(file);
    // Limpiar input para permitir seleccionar el mismo archivo si es necesario
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // --- CONFIRMACIÓN Y EJECUCIÓN DE RESTAURACIÓN ---
  const handleConfirmRestore = async () => {
    if (!inspectedBackup || !confirmCheckbox) return;

    setIsRestoring(true);
    setFeedback(null);
    try {
      const result = await GoogleDriveBackupService.restoreBackup(
        inspectedBackup.fileContent,
        restoreMode
      );

      if (result.success) {
        setFeedback({
          type: 'success',
          message: result.message,
        });
        setInspectedBackup(null);
        await refreshCurrentStats();
        onDataRestored();
      } else {
        setFeedback({
          type: 'error',
          message: result.message,
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: `Fallo durante la restauración: ${err?.message || 'Error'}`,
      });
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md">
      <div className="bg-[#0b111e] border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Cabecera del Modal */}
        <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-xs">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>Copias de Seguridad</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Google Drive 2 Ranuras
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Resguardo seguro en la nube y comparador inteligente previo a restaurar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pestañas de Navegación */}
        <div className="flex border-b border-slate-800/80 bg-slate-950/60 p-1.5 gap-1.5 px-4">
          <button
            onClick={() => setActiveTab('drive')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'drive'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Google Drive</span>
          </button>

          <button
            onClick={() => setActiveTab('local')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'local'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Exportar Local</span>
          </button>

          <button
            onClick={() => setActiveTab('restore')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'restore'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Restaurar / Comparar</span>
          </button>
        </div>

        {/* Mensaje de Feedback */}
        {feedback && (
          <div className="p-3 mx-4 mt-3 rounded-2xl flex items-start gap-2.5 text-xs animate-in fade-in duration-150 border leading-relaxed bg-slate-900/90 shadow-md">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className={feedback.type === 'success' ? 'text-emerald-200' : 'text-rose-200'}>
              {feedback.message}
            </div>
          </div>
        )}

        {/* Contenido con Scroll */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* TAB 1: GOOGLE DRIVE (2 RANURAS CANÓNICAS) */}
          {activeTab === 'drive' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Estrategia Canónica de 2 Ranuras</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowDriveHelp(!showDriveHelp)}
                    className="text-[11px] text-slate-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <HelpCircle className="w-3 h-3" />
                    <span>{showDriveHelp ? 'Ocultar guía' : '¿Cómo funciona?'}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Permite mantener en tu Google Drive <strong>dos archivos fijos</strong>: tu copia más reciente (<span className="text-emerald-300 font-mono text-[11px]">CronoCash_Actual.json</span>) y una de respaldo previa (<span className="text-blue-300 font-mono text-[11px]">CronoCash_Previa.json</span>). Sin riesgo de tokens caídos ni permisos invasivos.
                </p>

                {showDriveHelp && (
                  <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-300 space-y-1.5 bg-slate-950/60 p-2.5 rounded-xl">
                    <p className="font-bold text-emerald-300">Pasos para guardar en tu Google Drive en Android:</p>
                    <ol className="list-decimal list-inside space-y-1 pl-1 text-slate-400">
                      <li>Selecciona la ranura deseada y pulsa <strong>"Subir a Google Drive"</strong>.</li>
                      <li>Se desplegará el panel oficial de Android para compartir (SAF).</li>
                      <li>Elige la app de <strong>Google Drive</strong> y la carpeta que desees.</li>
                      <li>Pulsa <strong>Guardar</strong>. ¡Listo! Tu archivo queda sincronizado.</li>
                    </ol>
                  </div>
                )}
              </div>

              {/* Selector de Ranuras */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Ranura 1: Actual */}
                <div
                  onClick={() => setSelectedSlot('actual')}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                    selectedSlot === 'actual'
                      ? 'bg-emerald-950/20 border-emerald-500/50 shadow-md shadow-emerald-500/10'
                      : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Ranura 1 (Recomendada)
                      </span>
                      <h4 className="text-sm font-bold text-white mt-1.5 font-mono">
                        {DRIVE_SLOT_ACTUAL}
                      </h4>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        selectedSlot === 'actual'
                          ? 'border-emerald-400 bg-emerald-400'
                          : 'border-slate-600'
                      }`}
                    >
                      {selectedSlot === 'actual' && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                    Copia principal de uso diario. Sobrescribe la versión vigente manteniendo tus datos actualizados.
                  </p>
                </div>

                {/* Ranura 2: Previa */}
                <div
                  onClick={() => setSelectedSlot('previa')}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                    selectedSlot === 'previa'
                      ? 'bg-blue-950/20 border-blue-500/50 shadow-md shadow-blue-500/10'
                      : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        Ranura 2 (Seguridad)
                      </span>
                      <h4 className="text-sm font-bold text-white mt-1.5 font-mono">
                        {DRIVE_SLOT_PREVIA}
                      </h4>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        selectedSlot === 'previa'
                          ? 'border-blue-400 bg-blue-400'
                          : 'border-slate-600'
                      }`}
                    >
                      {selectedSlot === 'previa' && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                    Copia de salvaguarda histórica. Ideal para congelar un estado anterior antes de cambios grandes.
                  </p>
                </div>
              </div>

              {/* Estadísticas de la base de datos a empaquetar */}
              {currentStats && (
                <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-2xl space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Datos que se incluirán en la copia:</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                    <div className="p-2 bg-slate-900/60 rounded-xl border border-slate-800">
                      <div className="text-xs font-mono font-bold text-white">{currentStats.expensesCount}</div>
                      <div className="text-[10px] text-slate-400">Gastos</div>
                    </div>
                    <div className="p-2 bg-slate-900/60 rounded-xl border border-slate-800">
                      <div className="text-xs font-mono font-bold text-white">{currentStats.bucketsCount}</div>
                      <div className="text-[10px] text-slate-400">Bolsas</div>
                    </div>
                    <div className="p-2 bg-slate-900/60 rounded-xl border border-slate-800">
                      <div className="text-xs font-mono font-bold text-white">{currentStats.recurringRulesCount}</div>
                      <div className="text-[10px] text-slate-400">Recurrentes</div>
                    </div>
                    <div className="p-2 bg-slate-900/60 rounded-xl border border-slate-800">
                      <div className="text-xs font-mono font-bold text-emerald-400">
                        {currentStats.totalHistoricalSpent.toFixed(0)} {currency}
                      </div>
                      <div className="text-[10px] text-slate-400">Total Histórico</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Botón de Acción Principal Drive */}
              <button
                type="button"
                onClick={handleExportToDrive}
                disabled={isExporting}
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Share2 className="w-4 h-4 stroke-[2.5]" />
                <span>
                  {isExporting
                    ? 'Preparando archivo...'
                    : `Subir / Guardar en Google Drive (${selectedSlot === 'actual' ? DRIVE_SLOT_ACTUAL : DRIVE_SLOT_PREVIA})`}
                </span>
              </button>
            </div>
          )}

          {/* TAB 2: EXPORTACIÓN LOCAL */}
          {activeTab === 'local' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Descarga de Archivo JSON Fechado</span>
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Exporta un archivo JSON completo con la fecha de hoy en el nombre para almacenarlo en tu ordenador, memoria USB o enviarlo por correo.
                </p>
              </div>

              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <span>CronoCash_Backup_{new Date().toISOString().split('T')[0]}.json</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Incluye envelope de seguridad, checksum y fecha en franja horaria Europa/Madrid.
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleExportLocal}
                disabled={isExporting}
                className="w-full py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>{isExporting ? 'Generando archivo...' : 'Descargar / Compartir Archivo Local'}</span>
              </button>
            </div>
          )}

          {/* TAB 3: RESTAURAR Y COMPARADOR PREVIO */}
          {activeTab === 'restore' && (
            <div className="space-y-4">
              {/* Selector de Archivo */}
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-teal-400" />
                    <span>Seleccionar Archivo de Respaldo (.json)</span>
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Selecciona tu copia de Google Drive o de tu dispositivo. El sistema realizará una <strong>inspección previa de integridad</strong> y te mostrará una comparativa antes de tocar tus datos actuales.
                </p>

                <div className="pt-1">
                  <label className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 flex items-center justify-center gap-2 cursor-pointer transition-all">
                    <FileText className="w-4 h-4 text-teal-400" />
                    <span>Examinar Archivo JSON</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json,application/json"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* COMPARADOR LADO A LADO SI HAY ARCHIVO INSPECCIONADO */}
              {inspectedBackup && currentStats && (
                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      <div>
                        <div className="text-xs font-bold text-emerald-300">
                          Archivo Válido: {inspectedBackup.inspection.fileNameSuggested}
                        </div>
                        <div className="text-[10px] text-emerald-400/80 font-mono">
                          Exportado el: {inspectedBackup.inspection.exportDateMadrid} | Checksum: {inspectedBackup.inspection.checksum.substring(0, 8)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tabla / Matriz Lado a Lado */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {/* Columna Izquierda: TELÉFONO ACTUAL */}
                    <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2.5">
                      <div className="border-b border-slate-800 pb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Dispositivo Actual
                        </span>
                        <div className="text-xs font-bold text-white flex items-center gap-1 mt-0.5">
                          <HardDrive className="w-3.5 h-3.5 text-blue-400" />
                          <span>Base de Datos Local</span>
                        </div>
                      </div>

                      <div className="space-y-2 text-[11px]">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Gastos:</span>
                          <span className="font-mono font-bold text-white">{currentStats.expensesCount}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Bolsas:</span>
                          <span className="font-mono font-bold text-white">{currentStats.bucketsCount}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Recurrentes:</span>
                          <span className="font-mono font-bold text-white">{currentStats.recurringRulesCount}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Total acumulado:</span>
                          <span className="font-mono font-bold text-slate-200">
                            {currentStats.totalHistoricalSpent.toFixed(2)} {currency}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Último gasto:</span>
                          <span className="font-mono text-slate-300 text-[10px]">
                            {currentStats.latestExpenseRaw || 'Ninguno'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Columna Derecha: COPIA DE SEGURIDAD */}
                    <div className="p-3.5 bg-slate-950 border border-emerald-500/40 rounded-2xl space-y-2.5 shadow-md shadow-emerald-500/5">
                      <div className="border-b border-slate-800 pb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                          Copia a Restaurar
                        </span>
                        <div className="text-xs font-bold text-white flex items-center gap-1 mt-0.5">
                          <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="truncate">{inspectedBackup.inspection.fileNameSuggested}</span>
                        </div>
                      </div>

                      <div className="space-y-2 text-[11px]">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Gastos:</span>
                          <div className="flex items-center gap-1.5 font-mono font-bold">
                            <span className="text-white">{inspectedBackup.inspection.expensesCount}</span>
                            {inspectedBackup.inspection.expensesCount !== currentStats.expensesCount && (
                              <span
                                className={`text-[10px] px-1 rounded ${
                                  inspectedBackup.inspection.expensesCount > currentStats.expensesCount
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-amber-500/20 text-amber-400'
                                }`}
                              >
                                {inspectedBackup.inspection.expensesCount > currentStats.expensesCount ? '+' : ''}
                                {inspectedBackup.inspection.expensesCount - currentStats.expensesCount}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Bolsas:</span>
                          <span className="font-mono font-bold text-white">
                            {inspectedBackup.inspection.bucketsCount}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Recurrentes:</span>
                          <span className="font-mono font-bold text-white">
                            {inspectedBackup.inspection.recurringRulesCount}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Total acumulado:</span>
                          <span className="font-mono font-bold text-emerald-400">
                            {inspectedBackup.inspection.totalHistoricalSpent.toFixed(2)} {currency}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Último gasto:</span>
                          <span className="font-mono text-emerald-300 text-[10px]">
                            {inspectedBackup.inspection.latestExpenseRaw || 'Ninguno'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Modo de Restauración */}
                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2 text-xs">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Modo de Restauración:
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <label
                        className={`p-2.5 rounded-xl border flex items-start gap-2 cursor-pointer transition-all ${
                          restoreMode === 'overwrite'
                            ? 'bg-emerald-950/20 border-emerald-500/50 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        <input
                          type="radio"
                          name="restoreMode"
                          checked={restoreMode === 'overwrite'}
                          onChange={() => setRestoreMode('overwrite')}
                          className="mt-0.5 text-emerald-500"
                        />
                        <div>
                          <div className="font-bold text-[11px] text-emerald-300">Sobrescribir Completo</div>
                          <div className="text-[10px] text-slate-400">Reemplaza íntegramente la BD con la copia.</div>
                        </div>
                      </label>

                      <label
                        className={`p-2.5 rounded-xl border flex items-start gap-2 cursor-pointer transition-all ${
                          restoreMode === 'merge'
                            ? 'bg-emerald-950/20 border-emerald-500/50 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        <input
                          type="radio"
                          name="restoreMode"
                          checked={restoreMode === 'merge'}
                          onChange={() => setRestoreMode('merge')}
                          className="mt-0.5 text-emerald-500"
                        />
                        <div>
                          <div className="font-bold text-[11px] text-teal-300">Fusionar Registros</div>
                          <div className="text-[10px] text-slate-400">Combina sin borrar gastos no presentes.</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Checkbox de Confirmación Obligatoria */}
                  <label className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={confirmCheckbox}
                      onChange={(e) => setConfirmCheckbox(e.target.checked)}
                      className="mt-1 rounded text-amber-500 focus:ring-0 cursor-pointer"
                    />
                    <div className="text-xs text-amber-200 leading-relaxed">
                      <strong>Confirmo la restauración:</strong> He revisado la comparativa y entiendo que se{' '}
                      {restoreMode === 'overwrite' ? 'reemplazarán' : 'fusionarán'} los datos del teléfono con los de la copia de seguridad.
                    </div>
                  </label>

                  {/* Botones de Confirmación */}
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setInspectedBackup(null)}
                      className="flex-1 py-3 px-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-bold cursor-pointer"
                    >
                      Cancelar Selección
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmRestore}
                      disabled={!confirmCheckbox || isRestoring}
                      className="flex-2 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                    >
                      <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                      <span>{isRestoring ? 'Restaurando...' : 'Ejecutar Restauración Ahora'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Pie de Cierre */}
        <div className="px-5 py-3 border-t border-slate-800/80 bg-slate-950/70 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
