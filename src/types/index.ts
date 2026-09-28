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

export type RecurringCostType = 'fixed' | 'estimated' | 'none';

export type ReminderOffset =
  | 'same_day'
  | '1_day'
  | '3_days'
  | '1_week'
  | '2_weeks'
  | '1_month'
  | '1_quarter';

export type RecurringCategoryType =
  | 'bill'          // Suministros, facturas, alquiler
  | 'subscription'  // Suscripciones, streaming, gimnasio
  | 'tax'           // Impuestos, tasas, IBI, trimestres AEAT
  | 'health'        // Lentillas, medicación, citas médicas
  | 'maintenance'   // Revisiones, ITV, veterinario, vacunas
  | 'personal';     // Cumpleaños, aniversarios, celebraciones

export interface RecurringRule {
  id: string;
  title: string;
  amount: number;
  costType?: RecurringCostType;
  categoryType?: RecurringCategoryType;
  bucketId: string;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  dayOfMonth?: number; // 1 - 31
  monthOfYear?: number; // 1 - 12 (específico para periodicidad anual)
  dayOfWeek?: number; // 0 - 6
  startDate: string;
  endDate?: string;
  isActive: boolean;
  autoCreateExpense: boolean;
  notes?: string;
  lastGeneratedDate?: string;
  isVampire?: boolean;
  icon?: string;
  reminderOffsets?: ReminderOffset[];
  reminderTime?: string; // 'HH:MM'
  autoAdaptNextDates?: boolean; // Si al completar/registrar se adapta automáticamente el ciclo futuro
}

export type ExtraIncomeType = 'punctual' | 'recurring';

export type ExtraIncomeCategory =
  | 'gift'        // Regalo en efectivo o transferencia
  | 'sale'        // Venta de artículos (Wallapop, segunda mano, etc.)
  | 'rental'      // Alquiler recibido (vivienda, plaza de garaje, trastero)
  | 'freelance'   // Trabajo extra, freelance o puntual
  | 'bonus'       // Paga extra, bonus laboral o gratificación
  | 'investment'  // Dividendos o rentabilidad de inversiones
  | 'other';      // Otros ingresos

export interface ExtraIncome {
  id: string;
  title: string;
  amount: number;
  type: ExtraIncomeType;
  category: ExtraIncomeCategory;
  date: string;               // YYYY-MM-DD (fecha del ingreso puntual o fecha de inicio)
  dayOfMonth?: number;        // 1-31 (para ingresos recurrentes mensuales)
  frequency?: 'monthly' | 'quarterly' | 'yearly';
  isActive: boolean;
  notes?: string;
  createdAt: string;
}

export interface Settings {
  id: string;
  pinSeguridad?: string;
  bloqueoPinActivo: boolean;
  biometriaActiva: boolean;
  guardarContrasenaAuto: boolean;
  currency: string;
  monthlyIncome: number;
  savingsBuffer?: number; // Importe del Colchón de Ahorro / Imprevistos blindado
  savingsBufferBucketId?: string; // ID de la bolsa designada como colchón
  extraIncomes?: ExtraIncome[]; // Ingresos extras (puntuales y recurrentes)
  userFullName?: string;
  companyName?: string;
  taxId?: string; // NIF / CIF
  notificationsEnabled: boolean;
  notificationHour?: string;
  hapticsEnabled?: boolean;
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

export interface GoalContribution {
  id: string;
  amount: number;
  date: string; // ISO 'YYYY-MM-DD'
  notes?: string;
  source: 'manual' | 'rollover' | 'safe_to_spend_surplus';
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // ISO 'YYYY-MM-DD'
  category: 'essential' | 'maintenance' | 'lifestyle' | 'emergency';
  priority: number; // 1 (alta), 2 (media), 3 (baja)
  color: string;
  icon: string;
  bucketId?: string;
  autoDeductFromSafeToSpend: boolean;
  isCompleted: boolean;
  notes?: string;
  contributions: GoalContribution[];
  createdAt: string;
  updatedAt?: string;
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
  savingsGoals?: SavingsGoal[];
}

export type Quarter = 1 | 2 | 3 | 4;

export interface TaxReport {
  quarter: Quarter;
  year: number;
  startDate: string;
  endDate: string;
  deadlineDate: string;
  daysUntilDeadline: number;
  isDeadlinePassed: boolean;
  grossIncome: number;
  deductibleExpenses: number;
  nonDeductibleExpenses: number;
  netYield: number;
  model130EstimatedTax: number;
  ivaRepercutido: number;
  ivaSoportado: number;
  model303Result: number;
  invoiceCount: number;
  invoices: Expense[];
}

