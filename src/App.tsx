import React, { useState, useEffect } from 'react';
import { AuthService } from './services/auth';
import { DBService } from './services/db';
import { NotificationService } from './services/notificationService';
import { Expense, Bucket, RecurringRule, Settings, FinancialTip, SmartRule, SavingsGoal, ExtraIncome } from './types';
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
import { GoalsModal } from './components/goals/GoalsModal';
import { ReportsModal } from './components/reports/ReportsModal';
import { ConfirmRecurringExpenseModal } from './components/expenses/ConfirmRecurringExpenseModal';
import { PrivacyProvider } from './context/PrivacyContext';
import { ExtraIncomeModal } from './components/income/ExtraIncomeModal';
import { RecurringEngineService } from './services/recurringEngineService';
import { App as CapApp } from '@capacitor/app';
import { ExitConfirmModal } from './components/common/ExitConfirmModal';

export const App: React.FC = () => {
  // Estado de Bloqueo / Autenticación: Forzar bloqueo en arranque si hay PIN/huella
  const [isLocked, setIsLocked] = useState(() => {
    if (!AuthService.isPasswordConfigured()) return false;
    return true;
  });

  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [recurringRules, setRecurringRules] = useState<RecurringRule[]>([]);
  const [settings, setSettings] = useState<Settings>(() => DBService.getSettings());
  const [tips, setTips] = useState<FinancialTip[]>([]);
  const [smartRules, setSmartRules] = useState<SmartRule[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);

  // Modales
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [backupModalOpen, setBackupModalOpen] = useState(false);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [smartRulesModalOpen, setSmartRulesModalOpen] = useState(false);
  const [goalsModalOpen, setGoalsModalOpen] = useState(false);
  const [reportsModalOpen, setReportsModalOpen] = useState(false);
  const [incomeModalOpen, setIncomeModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmRule, setConfirmRule] = useState<RecurringRule | null>(null);
  const [confirmDate, setConfirmDate] = useState<string>('');
  const [exitModalOpen, setExitModalOpen] = useState(false);

  // Escuchar botón físico / gestual de retroceso de Android para confirmación de salida
  useEffect(() => {
    let backListener: any = null;
    const setupBackButton = async () => {
      try {
        backListener = await CapApp.addListener('backButton', () => {
          setExitModalOpen(true);
        });
      } catch (err) {
        console.warn('Capacitor backButton not available:', err);
      }
    };
    setupBackButton();
    return () => {
      if (backListener && backListener.remove) {
        backListener.remove();
      }
    };
  }, []);

  // Carga inicial de datos desde IndexedDB
  const loadData = async () => {
    const [eList, bList, rList, tList, sList, gList] = await Promise.all([
      DBService.getExpenses(),
      DBService.getBuckets(),
      DBService.getRecurringRules(),
      DBService.getTips(),
      DBService.getSmartRules(),
      DBService.getSavingsGoals(),
    ]);

    // Auto-sanear posibles gastos duplicados derivados de confirmaciones múltiples
    let sanitizedExpenses = eList;
    const seenRecurringKeys = new Set<string>();
    const duplicateIdsToDelete: string[] = [];
    const deduped: Expense[] = [];

    for (const exp of eList) {
      if (exp.recurringRuleId && exp.date) {
        const key = `${exp.recurringRuleId}_${exp.date}_${exp.amount}`;
        if (seenRecurringKeys.has(key)) {
          duplicateIdsToDelete.push(exp.id);
          continue;
        }
        seenRecurringKeys.add(key);
      }
      deduped.push(exp);
    }

    if (duplicateIdsToDelete.length > 0) {
      sanitizedExpenses = deduped;
      for (const id of duplicateIdsToDelete) {
        await DBService.deleteExpense(id);
      }
    }

    // Procesar automáticamente cobros recurrentes debidos (Cobro Automático por defecto)
    const { newExpenses, updatedRules } = RecurringEngineService.processDueRecurringRules(
      rList,
      sanitizedExpenses,
      new Date()
    );

    let finalExpenses = sanitizedExpenses;
    let finalRules = rList;

    if (newExpenses.length > 0) {
      await DBService.saveExpensesBatch(newExpenses);
      finalExpenses = [...newExpenses, ...sanitizedExpenses];
      finalExpenses.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    }

    if (updatedRules.some((r, i) => r !== rList[i])) {
      for (const rule of updatedRules) {
        await DBService.saveRecurringRule(rule);
      }
      finalRules = updatedRules;
    }

    const storedSettings = DBService.getSettings();
    setExpenses(finalExpenses);
    setBuckets(bList);
    setRecurringRules(finalRules);
    setTips(tList);
    setSmartRules(sList);
    setSavingsGoals(gList);
    setSettings(storedSettings);

    // Sincronizar recordatorios y facturas programadas en segundo plano
    await NotificationService.syncAllScheduledReminders(storedSettings, finalRules);
  };

  useEffect(() => {
    loadData();
    NotificationService.init((actionType, extra) => {
      if (actionType === 'confirm_recurring' && extra?.ruleId) {
        DBService.getRecurringRules().then((rules) => {
          const found = rules.find((r) => r.id === extra.ruleId);
          if (found) {
            setConfirmRule(found);
            setConfirmDate(extra.dueDate || new Date().toISOString().split('T')[0]);
            setConfirmModalOpen(true);
          } else {
            setCurrentTab('recurring');
          }
        });
      } else if (actionType === 'open_recurring') {
        setCurrentTab('recurring');
      } else if (actionType === 'open_dashboard') {
        setCurrentTab('dashboard');
      } else if (actionType === 'open_taxes') {
        setReportsModalOpen(true);
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
        if (AuthService.isPasswordConfigured()) {
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

  const handleRevertExpense = async (expense: Expense) => {
    if (expense.recurringRuleId) {
      const targetRule = recurringRules.find((r) => r.id === expense.recurringRuleId);
      if (targetRule && targetRule.completedDates) {
        const updatedDates = targetRule.completedDates.filter((d) => d !== expense.date);
        await DBService.saveRecurringRule({ ...targetRule, completedDates: updatedDates });
      }
    }
    await DBService.deleteExpense(expense.id);
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
    handleOpenConfirmRecurring(rule);
  };

  const handleOpenConfirmRecurring = (rule: RecurringRule, targetDate?: string) => {
    setConfirmRule(rule);
    setConfirmDate(targetDate || new Date().toISOString().split('T')[0]);
    setConfirmModalOpen(true);
  };

  const handleConfirmExpenseFromRecurring = async (data: {
    ruleId: string;
    amount: number;
    date: string;
    bucketId: string;
    isInvoice: boolean;
    updateRuleBaseAmount: boolean;
    adaptFutureDates: boolean;
  }) => {
    const targetRule = recurringRules.find((r) => r.id === data.ruleId);
    if (!targetRule) return;

    // 1. Guardar o actualizar gasto real de forma idempotente (evitar duplicados)
    const existingExpense = expenses.find(
      (e) =>
        (e.recurringRuleId === targetRule.id ||
          (e.title.toLowerCase() === targetRule.title.toLowerCase() &&
            e.bucketId === data.bucketId)) &&
        e.date === data.date
    );

    if (existingExpense) {
      const updatedExpense: Expense = {
        ...existingExpense,
        amount: data.amount,
        bucketId: data.bucketId,
        isInvoice: data.isInvoice,
        recurringRuleId: targetRule.id,
      };
      await DBService.saveExpense(updatedExpense);
    } else {
      const expense: Expense = {
        id: `exp_rec_${Date.now()}`,
        title: targetRule.title,
        amount: data.amount,
        date: data.date,
        bucketId: data.bucketId,
        isInvoice: data.isInvoice,
        status: 'paid',
        recurringRuleId: targetRule.id,
        notes: `Confirmado desde recurrente: ${targetRule.title}`,
        createdAt: new Date().toISOString(),
      };
      await DBService.saveExpense(expense);
    }

    // 2. Si se solicitó actualizar la regla base o adaptarla dinámicamente al nuevo día:
    const completedDates = Array.from(new Set([...(targetRule.completedDates || []), data.date]));
    let updatedRule: RecurringRule = {
      ...targetRule,
      lastGeneratedDate: data.date,
      completedDates,
    };

    if (data.updateRuleBaseAmount && data.amount > 0) {
      updatedRule.amount = data.amount;
    }

    if (data.adaptFutureDates && data.date) {
      const parts = data.date.split('-');
      const newDay = parseInt(parts[2], 10);
      const newMonth = parseInt(parts[1], 10);
      if (!isNaN(newDay) && newDay >= 1 && newDay <= 31) {
        updatedRule.dayOfMonth = newDay;
      }
      if (updatedRule.frequency === 'yearly' && !isNaN(newMonth)) {
        updatedRule.monthOfYear = newMonth;
      }
    }

    await DBService.saveRecurringRule(updatedRule);
    await loadData();
    await NotificationService.scheduleRecurringBillReminders(
      recurringRules.map((r) => (r.id === updatedRule.id ? updatedRule : r))
    );
  };

  const handleCompleteTaskWithoutExpense = async (data: {
    ruleId: string;
    date: string;
    adaptFutureDates: boolean;
  }) => {
    const targetRule = recurringRules.find((r) => r.id === data.ruleId);
    if (!targetRule) return;

    const completedDates = Array.from(new Set([...(targetRule.completedDates || []), data.date]));
    let updatedRule: RecurringRule = {
      ...targetRule,
      lastGeneratedDate: data.date,
      completedDates,
    };

    if (data.adaptFutureDates && data.date) {
      const parts = data.date.split('-');
      const newDay = parseInt(parts[2], 10);
      const newMonth = parseInt(parts[1], 10);
      if (!isNaN(newDay) && newDay >= 1 && newDay <= 31) {
        updatedRule.dayOfMonth = newDay;
      }
      if (updatedRule.frequency === 'yearly' && !isNaN(newMonth)) {
        updatedRule.monthOfYear = newMonth;
      }
    }

    await DBService.saveRecurringRule(updatedRule);
    await loadData();
    await NotificationService.scheduleRecurringBillReminders(
      recurringRules.map((r) => (r.id === updatedRule.id ? updatedRule : r))
    );
  };

  const handleToggleTip = async (tipId: string) => {
    await DBService.toggleTipApplied(tipId);
    const updatedTips = await DBService.getTips();
    setTips(updatedTips);
  };

  // CRUD Metas de Ahorro
  const handleSaveSavingsGoal = async (goal: SavingsGoal) => {
    await DBService.saveSavingsGoal(goal);
    await loadData();
  };

  const handleDeleteSavingsGoal = async (id: string) => {
    await DBService.deleteSavingsGoal(id);
    await loadData();
  };

  const handleAddGoalContribution = async (
    goalId: string,
    amount: number,
    source: 'manual' | 'rollover' | 'safe_to_spend_surplus',
    notes?: string
  ) => {
    await DBService.addGoalContribution(goalId, amount, source, notes);
    await loadData();
  };

  // CRUD Ingresos Extras
  const handleSaveExtraIncome = async (income: ExtraIncome) => {
    await DBService.saveExtraIncome(income);
    await loadData();
  };

  const handleDeleteExtraIncome = async (id: string) => {
    await DBService.deleteExtraIncome(id);
    await loadData();
  };

  if (isLocked) {
    return (
      <>
        <AuthScreen
          onUnlocked={handleUnlocked}
          onRequestExit={() => setExitModalOpen(true)}
        />
        <ExitConfirmModal
          isOpen={exitModalOpen}
          onClose={() => setExitModalOpen(false)}
        />
      </>
    );
  }

  // Cálculos para la cabecera y motor Safe-to-Spend
  const currentMonthPrefix = new Date().toISOString().substring(0, 7);
  const totalExpensesMonth = expenses
    .filter((e) => (e.date || '').startsWith(currentMonthPrefix))
    .reduce((sum, e) => sum + e.amount, 0);

  // Computar ingresos extras del mes (puntuales del mes + recurrentes activos)
  const extraIncomes = settings.extraIncomes || [];
  const punctualExtraIncome = extraIncomes
    .filter((inc) => inc.isActive !== false && inc.type === 'punctual' && (inc.date || '').startsWith(currentMonthPrefix))
    .reduce((sum, inc) => sum + inc.amount, 0);

  const recurringExtraIncome = extraIncomes
    .filter((inc) => inc.isActive !== false && inc.type === 'recurring')
    .reduce((sum, inc) => sum + inc.amount, 0);

  const totalExtraIncomeMonth = punctualExtraIncome + recurringExtraIncome;
  const effectiveMonthlyIncome = (settings.monthlyIncome || 0) + totalExtraIncomeMonth;

  const safeMetrics = SafeToSpendService.calculate(
    expenses,
    recurringRules,
    buckets,
    effectiveMonthlyIncome,
    new Date(),
    savingsGoals
  );

  return (
    <PrivacyProvider>
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
        settings={{ ...settings, monthlyIncome: effectiveMonthlyIncome }}
        totalExpensesMonth={totalExpensesMonth}
        dailySafeToSpend={safeMetrics.dailySafeToSpend}
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
        onLock={handleManualLock}
        onOpenSettings={() => setSettingsModalOpen(true)}
        onOpenBackup={() => setBackupModalOpen(true)}
        onOpenGoals={() => setGoalsModalOpen(true)}
      />

      {/* Contenido Principal */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-3 sm:p-6 pb-20 md:pb-8">
        {currentTab === 'dashboard' && (
          <Dashboard
            expenses={expenses}
            buckets={buckets}
            recurringRules={recurringRules}
            savingsGoals={savingsGoals}
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
            onOpenGoalsModal={() => setGoalsModalOpen(true)}
            onOpenReports={() => setReportsModalOpen(true)}
            onOpenIncomeModal={() => setIncomeModalOpen(true)}
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
            onOpenGoals={() => setGoalsModalOpen(true)}
          />
        )}

        {currentTab === 'recurring' && (
          <RecurringView
            rules={recurringRules}
            expenses={expenses}
            buckets={buckets}
            currency={settings.currency || '€'}
            onSaveRule={handleSaveRecurringRule}
            onDeleteRule={handleDeleteRecurringRule}
            onApplyRuleNow={handleApplyRecurringNow}
            onRequestConfirmRecurring={handleOpenConfirmRecurring}
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
            onRequestConfirmRecurring={handleOpenConfirmRecurring}
            onRevertExpense={handleRevertExpense}
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
          onOpenReports={() => setReportsModalOpen(true)}
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

      {/* Modal de Metas & Sinking Funds */}
      {goalsModalOpen && (
        <GoalsModal
          isOpen={goalsModalOpen}
          onClose={() => setGoalsModalOpen(false)}
          goals={savingsGoals}
          buckets={buckets}
          currency={settings.currency || '€'}
          surplusAvailable={safeMetrics.netAvailable}
          onSaveGoal={handleSaveSavingsGoal}
          onDeleteGoal={handleDeleteSavingsGoal}
          onAddContribution={handleAddGoalContribution}
          onRefresh={loadData}
        />
      )}

      {/* Modal de Informes Ejecutivos & Fiscalidad */}
      {reportsModalOpen && (
        <ReportsModal
          isOpen={reportsModalOpen}
          onClose={() => setReportsModalOpen(false)}
          expenses={expenses}
          buckets={buckets}
          settings={settings}
          goals={savingsGoals}
          currency={settings.currency || '€'}
        />
      )}

      {/* Modal de Confirmación y Ajuste de Actos Recurrentes */}
      {confirmModalOpen && confirmRule && (
        <ConfirmRecurringExpenseModal
          isOpen={confirmModalOpen}
          onClose={() => {
            setConfirmModalOpen(false);
            setConfirmRule(null);
          }}
          rule={confirmRule}
          initialDate={confirmDate}
          buckets={buckets}
          currency={settings.currency || '€'}
          onConfirmExpense={handleConfirmExpenseFromRecurring}
          onCompleteTaskWithoutExpense={handleCompleteTaskWithoutExpense}
        />
      )}

      {/* Modal de Ingresos Extras (Puntuales y Recurrentes) */}
      {incomeModalOpen && (
        <ExtraIncomeModal
          isOpen={incomeModalOpen}
          onClose={() => setIncomeModalOpen(false)}
          extraIncomes={settings.extraIncomes || []}
          currency={settings.currency || '€'}
          monthlyBaseIncome={settings.monthlyIncome || 0}
          onSaveIncome={handleSaveExtraIncome}
          onDeleteIncome={handleDeleteExtraIncome}
        />
      )}

      {/* Modal de Confirmación de Salida Segura */}
      <ExitConfirmModal
        isOpen={exitModalOpen}
        onClose={() => setExitModalOpen(false)}
      />
    </div>
  </PrivacyProvider>
  );
};
