import React, { useState, useEffect } from 'react';
import { AuthService } from './services/auth';
import { DBService } from './services/db';
import { Expense, Bucket, RecurringRule, Settings, FinancialTip } from './types';
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

  // Modales
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  // Carga inicial de datos desde IndexedDB
  const loadData = async () => {
    const [eList, bList, rList, tList] = await Promise.all([
      DBService.getExpenses(),
      DBService.getBuckets(),
      DBService.getRecurringRules(),
      DBService.getTips(),
    ]);
    setExpenses(eList);
    setBuckets(bList);
    setRecurringRules(rList);
    setTips(tList);
    setSettings(DBService.getSettings());
  };

  useEffect(() => {
    loadData();
  }, []);

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

  if (isLocked) {
    return <AuthScreen onUnlocked={handleUnlocked} />;
  }

  // Cálculos para la cabecera
  const currentMonthPrefix = new Date().toISOString().substring(0, 7);
  const totalExpensesMonth = expenses
    .filter((e) => (e.date || '').startsWith(currentMonthPrefix))
    .reduce((sum, e) => sum + e.amount, 0);

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
        onLock={handleManualLock}
        onOpenSettings={() => setSettingsModalOpen(true)}
      />

      {/* Contenido Principal */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6">
        {currentTab === 'dashboard' && (
          <Dashboard
            expenses={expenses}
            buckets={buckets}
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
          />
        )}

        {currentTab === 'buckets' && (
          <BucketsView
            buckets={buckets}
            expenses={expenses}
            currency={settings.currency || '€'}
            onSaveBucket={handleSaveBucket}
            onDeleteBucket={handleDeleteBucket}
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
          />
        )}

        {currentTab === 'calendar' && (
          <CalendarView
            expenses={expenses}
            recurringRules={recurringRules}
            buckets={buckets}
            currency={settings.currency || '€'}
          />
        )}

        {currentTab === 'tips' && <TipsView tips={tips} />}
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
          onSettingsSaved={(updated) => setSettings(updated)}
          onDataRestored={loadData}
        />
      )}
    </div>
  );
};
