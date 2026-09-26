import React, { useState, useEffect } from 'react';
import { AuthService } from './services/auth';
import { DBService } from './services/db';
import { NotificationService } from './services/notificationService';
import { Expense, Bucket, RecurringRule, Settings, FinancialTip, SmartRule } from './types';
import { SafeToSpendService } from './services/safeToSpendService';
import { AuthScreen } from './components/auth/AuthScreen';
import { Header } from './components/layout/Header';
import { BottomNav, NavTab } from './components/layout/BottomNav';
import { Dashboard } from './components/dashboard/Dashboard';
import { BucketsView } from './components/buckets/BucketsView';
import { RecurringView } from './components/recurring/RecurringView';
import { CalendarView } from './components/calendar/CalendarView';
import { TipsView } from './components/tips/TipsView';
import { ExpenseModal } from './components/expenses/ExpenseModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { BackupModal } from './components/backup/BackupModal';
import { CsvImportModal } from './components/importer/CsvImportModal';
import { SmartRulesModal } from './components/importer/SmartRulesModal';

export const App: React.FC = () => {
  // Estado de Bloqueo / Autenticación
  const [isLocked, setIsLocked] = useState(() => {
    // Si la contraseña está configurada, comprobar si ya está desbloqueado o tiene auto-login válido
    if (!AuthService.isPasswordConfigured()) return false;
    if (AuthService.isUnlocked()) return false;
    if (AuthService.canAutoUnlock()) return false;
    return true;
  });

  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [recurringRules, setRecurringRules] = useState<RecurringRule[]>([]);
  const [settings, setSettings] = useState<Settings>(() => DBService.getSettings());
  const [tips, setTips] = useState<FinancialTip[]>([]);
  const [smartRules, setSmartRules] = useState<SmartRule[]>([]);

  // Modales
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [backupModalOpen, setBackupModalOpen] = useState(false);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [smartRulesModalOpen, setSmartRulesModalOpen] = useState(false);

  // Carga inicial de datos desde IndexedDB
  const loadData = async () => {
    const [eList, bList, rList, tList, sList] = await Promise.all([
      DBService.getExpenses(),
      DBService.getBuckets(),
      DBService.getRecurringRules(),
      DBService.getTips(),
      DBService.getSmartRules(),
    ]);
    const storedSettings = DBService.getSettings();
    setExpenses(eList);
    setBuckets(bList);
    setRecurringRules(rList);
    setTips(tList);
    setSmartRules(sList);
    setSettings(storedSettings);

    // Sincronizar recordatorios y facturas programadas en segundo plano
    await NotificationService.syncAllScheduledReminders(storedSettings, rList);
  };

  useEffect(() => {
    loadData();
    NotificationService.init((actionType) => {
      if (actionType === 'open_recurring') {
        setCurrentTab('recurring');
      } else if (actionType === 'open_dashboard') {
        setCurrentTab('dashboard');
      }
    });
  }, []);

  // Sincronizar alarmas de facturas recurrentes y recordatorio diario con Android
  useEffect(() => {
    NotificationService.syncAllScheduledReminders(settings, recurringRules);
  }, [recurringRules, settings.notificationsEnabled, settings.notificationHour]);

  // Bloqueo al pasar a segundo plano
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (!AuthService.isAutoLoginEnabled() && AuthService.isPasswordConfigured()) {
          AuthService.lock(false);
          setIsLocked(true);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Manejo de Bloqueo Manual
  const handleManualLock = () => {
    AuthService.lock(true);
    setIsLocked(true);
  };

  const handleUnlocked = () => {
    setIsLocked(false);
    loadData();
  };

  // CRUD Gastos
  const handleSaveExpense = async (expense: Expense) => {
    await DBService.saveExpense(expense);
    await loadData();
  };

  const handleDeleteExpense = async (id: string) => {
    await DBService.deleteExpense(id);
    await loadData();
  };

  // CRUD Bolsas
  const handleSaveBucket = async (bucket: Bucket) => {
    await DBService.saveBucket(bucket);
    await loadData();
  };

  const handleDeleteBucket = async (id: string) => {
    await DBService.deleteBucket(id);
    await loadData();
  };

  // CRUD Reglas Recurrentes
  const handleSaveRecurringRule = async (rule: RecurringRule) => {
    await DBService.saveRecurringRule(rule);
    await loadData();
  };

  const handleDeleteRecurringRule = async (id: string) => {
    await DBService.deleteRecurringRule(id);
    await loadData();
  };

  const handleApplyRecurringNow = async (rule: RecurringRule) => {
    const expense: Expense = {
      id: `exp_rec_${Date.now()}`,
      title: rule.title,
      amount: rule.amount,
      date: new Date().toISOString().split('T')[0],
      bucketId: rule.bucketId,
      isInvoice: false,
      status: 'paid',
      recurringRuleId: rule.id,
      notes: `Generado automáticamente desde recurrente: ${rule.title}`,
      createdAt: new Date().toISOString(),
    };
    await DBService.saveExpense(expense);
    await loadData();
  };

  const handleToggleTip = async (tipId: string) => {
    await DBService.toggleTipApplied(tipId);
    const updatedTips = await DBService.getTips();
    setTips(updatedTips);
  };

  if (isLocked) {
    return <AuthScreen onUnlocked={handleUnlocked} />;
  }

  // Cálculos para la cabecera y motor Safe-to-Spend
  const currentMonthPrefix = new Date().toISOString().substring(0, 7);
  const totalExpensesMonth = expenses
    .filter((e) => (e.date || '').startsWith(currentMonthPrefix))
    .reduce((sum, e) => sum + e.amount, 0);

  const safeMetrics = SafeToSpendService.calculate(
    expenses,
    recurringRules,
    buckets,
    settings.monthlyIncome || 0
  );

  return (
    <div
      className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30"
      style={{
        paddingTop: 'max(0.7cm, env(safe-area-inset-top, 0px))',
      }}
    >
      {/* Franja superior fija para reloj Android */}
      <div className="safe-top-bar" />

      {/* Cabecera */}
      <Header
        settings={settings}
        totalExpensesMonth={totalExpensesMonth}
        dailySafeToSpend={safeMetrics.dailySafeToSpend}
        onLock={handleManualLock}
        onOpenSettings={() => setSettingsModalOpen(true)}
        onOpenBackup={() => setBackupModalOpen(true)}
      />

      {/* Contenido Principal */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6">
        {currentTab === 'dashboard' && (
          <Dashboard
            expenses={expenses}
            buckets={buckets}
            recurringRules={recurringRules}
            settings={settings}
            onAddExpense={() => {
              setEditingExpense(null);
              setExpenseModalOpen(true);
            }}
            onEditExpense={(exp) => {
              setEditingExpense(exp);
              setExpenseModalOpen(true);
            }}
            onDeleteExpense={handleDeleteExpense}
            onSelectBucketTab={() => setCurrentTab('buckets')}
            onSelectRecurringTab={() => setCurrentTab('recurring')}
            onOpenImporter={() => setCsvModalOpen(true)}
          />
        )}

        {currentTab === 'buckets' && (
          <BucketsView
            buckets={buckets}
            expenses={expenses}
            currency={settings.currency || '€'}
            onSaveBucket={handleSaveBucket}
            onDeleteBucket={handleDeleteBucket}
            onRefresh={loadData}
            onOpenSmartRules={() => setSmartRulesModalOpen(true)}
          />
        )}

        {currentTab === 'recurring' && (
          <RecurringView
            rules={recurringRules}
            buckets={buckets}
            currency={settings.currency || '€'}
            onSaveRule={handleSaveRecurringRule}
            onDeleteRule={handleDeleteRecurringRule}
            onApplyRuleNow={handleApplyRecurringNow}
            onRefresh={loadData}
          />
        )}

        {currentTab === 'calendar' && (
          <CalendarView
            expenses={expenses}
            recurringRules={recurringRules}
            buckets={buckets}
            settings={settings}
            currency={settings.currency || '€'}
            onAddExpense={handleSaveExpense}
          />
        )}

        {currentTab === 'tips' && (
          <TipsView
            tips={tips}
            onToggleApplied={handleToggleTip}
            currency={settings.currency || '€'}
          />
        )}
      </main>

      {/* Navegación Inferior */}
      <BottomNav currentTab={currentTab} onTabChange={setCurrentTab} />

      {/* Franja inferior fija para barra del sistema Android */}
      <div className="safe-bottom-bar" />

      {/* Modal de Gastos */}
      {expenseModalOpen && (
        <ExpenseModal
          isOpen={expenseModalOpen}
          onClose={() => setExpenseModalOpen(false)}
          onSave={handleSaveExpense}
          buckets={buckets}
          currency={settings.currency || '€'}
          initialExpense={editingExpense}
        />
      )}

      {/* Modal de Ajustes y Bóveda */}
      {settingsModalOpen && (
        <SettingsModal
          isOpen={settingsModalOpen}
          onClose={() => setSettingsModalOpen(false)}
          settings={settings}
          onSettingsSaved={(updated) => {
            setSettings(updated);
            NotificationService.syncAllScheduledReminders(updated, recurringRules);
          }}
          onDataRestored={loadData}
          onOpenBackup={() => setBackupModalOpen(true)}
          onOpenSmartRules={() => setSmartRulesModalOpen(true)}
        />
      )}

      {/* Modal de Copias de Seguridad (Google Drive 2 Ranuras) */}
      {backupModalOpen && (
        <BackupModal
          isOpen={backupModalOpen}
          onClose={() => setBackupModalOpen(false)}
          onDataRestored={loadData}
          currency={settings.currency || '€'}
        />
      )}

      {/* Modal de Importación Bancaria CSV */}
      {csvModalOpen && (
        <CsvImportModal
          isOpen={csvModalOpen}
          onClose={() => setCsvModalOpen(false)}
          expenses={expenses}
          buckets={buckets}
          rules={smartRules}
          currency={settings.currency || '€'}
          onImportComplete={loadData}
          onOpenRulesManager={() => {
            setCsvModalOpen(false);
            setSmartRulesModalOpen(true);
          }}
        />
      )}

      {/* Modal de Gestión de Reglas Inteligentes */}
      {smartRulesModalOpen && (
        <SmartRulesModal
          isOpen={smartRulesModalOpen}
          onClose={() => setSmartRulesModalOpen(false)}
          rules={smartRules}
          buckets={buckets}
          onRulesUpdated={loadData}
        />
      )}
    </div>
  );
};
