export interface Bucket {
  id: string;
  name: string;
  budgetLimit: number;
  color: string;
  icon: string;
  isBuffer: boolean;
  notes?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  date: string; // ISO date 'YYYY-MM-DD' o timestamp
  bucketId: string;
  isInvoice: boolean; // Si cuenta con factura oficial / desgravable
  invoiceNumber?: string;
  supplier?: string; // Proveedor / Acreedor / Comercio
  taxRate?: number; // IVA % (ej: 21, 10, 4, 0)
  taxAmount?: number;
  notes?: string;
  receiptUri?: string;
  status: 'paid' | 'pending';
  recurringRuleId?: string;
  rawHash?: string;
  importBatchId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SmartRule {
  id: string;
  pattern: string; // Ej: "MERCADONA"
  matchType: 'contains' | 'exact' | 'startsWith' | 'regex';
  bucketId: string;
  isInvoice?: boolean;
  priority: number;
  isActive: boolean;
  createdAt: string;
}

export interface RecurringRule {
  id: string;
  title: string;
  amount: number;
  bucketId: string;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  dayOfMonth?: number; // 1 - 31
  dayOfWeek?: number; // 0 - 6
  startDate: string;
  endDate?: string;
  isActive: boolean;
  autoCreateExpense: boolean;
  notes?: string;
  lastGeneratedDate?: string;
  isVampire?: boolean;
  icon?: string;
}

export interface Settings {
  id: string;
  pinSeguridad?: string;
  bloqueoPinActivo: boolean;
  biometriaActiva: boolean;
  guardarContrasenaAuto: boolean;
  currency: string;
  monthlyIncome: number;
  userFullName?: string;
  companyName?: string;
  taxId?: string; // NIF / CIF
  notificationsEnabled: boolean;
  notificationHour?: string;
  theme: 'dark' | 'light';
  updatedAt: string;
}

export interface FinancialTip {
  id: string;
  title: string;
  category: 'ahorro' | 'facturacion' | 'presupuesto' | 'fiscal' | 'dinero_rapido' | 'dinero_pasivo' | 'anti_estafas';
  impact: 'alto' | 'medio' | 'bajo' | 'crucial';
  content: string;
  estimatedSavingsOrEarning?: string;
  timeNeeded?: string;
  difficulty?: 'fácil' | 'medio' | 'avanzado';
  actionSteps?: string[];
  riskLevel?: 'cero_riesgo' | 'bajo' | 'alerta_estafa';
  officialSourceOrLegalBasis?: string;
  isApplied?: boolean;
  isRead?: boolean;
}

export interface BackupEnvelope {
  version: string;
  exportedAt: string;
  expenses: Expense[];
  buckets: Bucket[];
  recurringRules: RecurringRule[];
  settings: Settings;
  tips: FinancialTip[];
  smartRules?: SmartRule[];
}
