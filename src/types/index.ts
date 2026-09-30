export interface Bucket {
  id: string;
  name: string;
  budgetLimit: number;
  color: string;
  icon: string;
  isBuffer: boolean;
  rolloverSurplus?: boolean; // Si true, trasvasa y acumula el saldo no gastado en esta misma bolsa (Sinking Fund)
  accumulatedSurplus?: number; // Saldo acumulado arrastrado de meses previos
  notes?: string;
  order?: number; // Índice de ordenación manual
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
  | 'bill'              // Suministros, facturas, alquiler
  | 'subscription'      // Suscripciones, streaming, gimnasio
  | 'financial_future'  // Futuro Financiero: inversiones, planes de ahorro, jubilación, aportaciones
  | 'insurance'         // Seguros y pólizas (coche, hogar, salud privada, vida, decesos)
  | 'education'         // Educación, matrículas, cursos, libros
  | 'transport'         // Transporte y movilidad (abonos, peajes, parking)
  | 'health'            // Lentillas, medicación, citas médicas, clínica
  | 'maintenance'       // Revisiones, ITV, taller, veterinario, vacunas
  | 'leisure'           // Ocio, cultura, viajes periódicos
  | 'donation'          // Donaciones, ONGs, cuotas asociativas
  | 'personal'          // Cumpleaños, aniversarios, celebraciones
  | 'tax';              // Impuestos, tasas, IBI, tributos

export interface FunctionalCategory {
  id: string;               // Identificador único (ej. 'financial_future', 'cat_1727648392')
  name: string;             // Nombre visible (ej. 'Futuro Financiero', 'Mascotas')
  icon: string;             // Nombre de icono Lucide (ej. 'TrendingUp', 'Heart', 'Car')
  color?: string;           // Color distintivo hexadecimal
  isSystem?: boolean;       // true si es del catálogo maestro del sistema, false si es del usuario
  order?: number;           // Orden para visualización y jerarquía
  description?: string;     // Descripción o notas opcionales
}

export const DEFAULT_FUNCTIONAL_CATEGORIES: FunctionalCategory[] = [
  { id: 'financial_future', name: 'Futuro Financiero (Inversiones)', icon: 'TrendingUp', color: '#10b981', isSystem: true, order: 1, description: 'Inversiones, fondos indexados, planes de pensiones y compras de valor' },
  { id: 'bill', name: 'Recibos y Facturas', icon: 'CreditCard', color: '#3b82f6', isSystem: true, order: 2, description: 'Luz, agua, gas, comunidad, internet y alquiler' },
  { id: 'insurance', name: 'Seguros y Pólizas', icon: 'ShieldCheck', color: '#06b6d4', isSystem: true, order: 3, description: 'Seguro de coche, hogar, vida, salud privada y decesos' },
  { id: 'subscription', name: 'Suscripciones y Software', icon: 'Repeat', color: '#8b5cf6', isSystem: true, order: 4, description: 'Streaming, gimnasio, software y almacenamiento cloud' },
  { id: 'tax', name: 'Impuestos y Tributos', icon: 'ReceiptText', color: '#f59e0b', isSystem: true, order: 5, description: 'IBI, modelos AEAT, tasas municipales y vados' },
  { id: 'transport', name: 'Transporte y Movilidad', icon: 'Car', color: '#0284c7', isSystem: true, order: 6, description: 'Abono de transporte, peajes, parking y combustible' },
  { id: 'education', name: 'Educación y Formación', icon: 'GraduationCap', color: '#6366f1', isSystem: true, order: 7, description: 'Cursos, matrículas, libros y academias' },
  { id: 'health', name: 'Salud y Cuidado Personal', icon: 'Stethoscope', color: '#ec4899', isSystem: true, order: 8, description: 'Lentillas, dentista, farmacia y consultas médicas' },
  { id: 'pets', name: 'Mascotas y Animales', icon: 'PawPrint', color: '#14b8a6', isSystem: true, order: 9, description: 'Veterinario, alimentación animal, cuidados y accesorios' },
  { id: 'transfer', name: 'Transferencias entre Cuentas', icon: 'ArrowLeftRight', color: '#3b82f6', isSystem: true, order: 10, description: 'Traspasos entre cuentas, regularizaciones e importes interbancarios' },
  { id: 'maintenance', name: 'Mantenimiento del Hogar', icon: 'Wrench', color: '#eab308', isSystem: true, order: 11, description: 'ITV, revisiones de vehículo y reparaciones hogar' },
  { id: 'leisure', name: 'Ocio y Recreación', icon: 'Sparkles', color: '#d946ef', isSystem: true, order: 12, description: 'Clubes, hobbies, salidas y actividades periódicas' },
  { id: 'donation', name: 'Donaciones y Solidaridad', icon: 'HeartHandshake', color: '#ef4444', isSystem: true, order: 13, description: 'Cuotas de ONG, voluntariado y proyectos sociales' },
  { id: 'personal', name: 'Personal y Familia', icon: 'Gift', color: '#f97316', isSystem: true, order: 14, description: 'Cumpleaños, aniversarios, celebraciones y compromisos familiares' },
];

export interface RecurringRule {
  id: string;
  title: string;
  amount: number;
  costType?: RecurringCostType;
  categoryType?: RecurringCategoryType | string;
  bucketId: string;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  interval?: number; // Intervalo de repetición: cada X semanas o cada X meses (default: 1)
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
  completedDates?: string[]; // Fechas YYYY-MM-DD en las que se ha completado esta regla/tarea
  noticePeriodDays?: 0 | 30 | 60 | 90; // Días de preaviso para renegociación o cancelación de pólizas/contratos
  order?: number; // Índice de ordenación manual
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

export type IncomeAllocationMode = 'general' | 'bucket_budget' | 'bucket_refund';

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
  rawHash?: string;           // Hash SHA-256 para deduplicación bancaria
  createdAt: string;
  targetBucketId?: string;    // ID opcional de la bolsa a la que se destina
  allocationMode?: IncomeAllocationMode; // 'general' (liquidez general) | 'bucket_budget' (inyección a presupuesto de bolsa) | 'bucket_refund' (reembolso/minoración de gasto en bolsa)
}

export interface MonthlySalaryOverride {
  amount: number; // Importe neto real de la nómina para el mes específico
  source: 'manual' | 'bank_import'; // Fijado a mano o importado de extracto bancario
  concept?: string; // Concepto o descripción (ej. Nómina Octubre)
  date?: string; // Fecha de percepción (YYYY-MM-DD)
  rawHash?: string; // Hash SHA-256 para deduplicación bancaria
  updatedAt: string; // Timestamp ISO
}

export interface Settings {
  id: string;
  pinSeguridad?: string;
  bloqueoPinActivo: boolean;
  biometriaActiva: boolean;
  guardarContrasenaAuto: boolean;
  currency: string;
  monthlyIncome: number;
  monthlySalaries?: Record<string, MonthlySalaryOverride>; // Salarios reales blindados por mes ('YYYY-MM')
  savingsBuffer?: number; // Importe del Colchón de Ahorro / Imprevistos blindado
  savingsBufferBucketId?: string; // ID de la bolsa designada como colchón
  extraIncomes?: ExtraIncome[]; // Ingresos extras (puntuales y recurrentes)
  customFunctionalCategories?: FunctionalCategory[]; // Categorías funcionales dinámicas (CRUD)
  userFullName?: string;
  companyName?: string;
  taxId?: string; // NIF / CIF
  notificationsEnabled: boolean;
  notificationHour?: string;
  hapticsEnabled?: boolean;
  theme: 'system' | 'dark' | 'light';
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

