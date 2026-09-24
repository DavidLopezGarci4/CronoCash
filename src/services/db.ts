import { Expense, Bucket, RecurringRule, Settings, FinancialTip, BackupEnvelope } from '../types';

const DB_NAME = 'GastosFacturacionDB';
const DB_VERSION = 1;

const STORES = {
  EXPENSES: 'expenses',
  BUCKETS: 'buckets',
  RECURRING_RULES: 'recurring_rules',
  SETTINGS: 'settings',
  TIPS: 'tips',
} as const;

export const DEFAULT_SETTINGS: Settings = {
  id: 'default_settings',
  pinSeguridad: '',
  bloqueoPinActivo: false,
  biometriaActiva: false,
  guardarContrasenaAuto: false,
  currency: '€',
  monthlyIncome: 2200,
  userFullName: 'Usuario',
  companyName: '',
  taxId: '',
  notificationsEnabled: true,
  theme: 'dark',
  updatedAt: new Date().toISOString(),
};

export const DEFAULT_BUCKETS: Bucket[] = [
  {
    id: 'bucket-fijos',
    name: 'Facturas y Suministros',
    budgetLimit: 750,
    color: '#3b82f6', // blue
    icon: 'FileText',
    isBuffer: false,
    notes: 'Luz, agua, internet, alquiler y suscripciones obligatorias',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'bucket-super',
    name: 'Alimentación y Hogar',
    budgetLimit: 450,
    color: '#10b981', // emerald
    icon: 'ShoppingCart',
    isBuffer: false,
    notes: 'Supermercado, droguería y compras básicas',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'bucket-transporte',
    name: 'Transporte y Movilidad',
    budgetLimit: 180,
    color: '#f59e0b', // amber
    icon: 'Car',
    isBuffer: false,
    notes: 'Combustible, billetes de transporte, parking y peajes',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'bucket-ocio',
    name: 'Ocio y Estilo de Vida',
    budgetLimit: 250,
    color: '#ec4899', // pink
    icon: 'Coffee',
    isBuffer: false,
    notes: 'Restaurantes, salidas, cine y caprichos personales',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'bucket-colchon',
    name: 'Colchón de Imprevistos',
    budgetLimit: 300,
    color: '#8b5cf6', // purple
    icon: 'ShieldAlert',
    isBuffer: true,
    notes: 'Fondo de emergencia para averías y contingencias inmediatas',
    createdAt: new Date().toISOString(),
  },
];

export const DEFAULT_TIPS: FinancialTip[] = [
  {
    id: 'tip-1',
    title: 'La Regla de las Bolsas 50/30/20',
    category: 'presupuesto',
    impact: 'alto',
    content: 'Distribuye tus ingresos netos: 50% en necesidades básicas y facturas, 30% en ocio y desarrollo personal, y al menos 20% destinado al ahorro o amortización de deudas.',
  },
  {
    id: 'tip-2',
    title: 'Bolsa de Imprevistos (Buffer)',
    category: 'ahorro',
    impact: 'alto',
    content: 'Tener una bolsa amortiguadora de 300€-600€ evita tener que recurrir a tarjetas de crédito con alto interés ante averías mecánicas o visitas imprevistas al médico.',
  },
  {
    id: 'tip-3',
    title: 'Facturas con CIF/NIF Desgravables',
    category: 'fiscal',
    impact: 'medio',
    content: 'Si eres autónomo o teletrabajas, solicita siempre factura formal completa (con NIF, razón social y desglose de IVA) para justificar y deducir gastos afectos a tu actividad.',
  },
  {
    id: 'tip-4',
    title: 'Auditoría de Suscripciones Ocultas',
    category: 'facturacion',
    impact: 'medio',
    content: 'Revisa trimestralmente tus gastos recurrentes. Cancelar plataformas o membresías de poco uso puede liberar más de 40€ al mes para tu colchón de ahorro.',
  },
];

export class DBService {
  private static dbPromise: Promise<IDBDatabase> | null = null;
  private static cachedSettings: Settings = { ...DEFAULT_SETTINGS };
  private static settingsLoaded = false;

  private static getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB no está disponible'));
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(STORES.EXPENSES)) {
          const expenseStore = db.createObjectStore(STORES.EXPENSES, { keyPath: 'id' });
          expenseStore.createIndex('date', 'date', { unique: false });
          expenseStore.createIndex('bucketId', 'bucketId', { unique: false });
          expenseStore.createIndex('isInvoice', 'isInvoice', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.BUCKETS)) {
          db.createObjectStore(STORES.BUCKETS, { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains(STORES.RECURRING_RULES)) {
          db.createObjectStore(STORES.RECURRING_RULES, { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS, { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains(STORES.TIPS)) {
          db.createObjectStore(STORES.TIPS, { keyPath: 'id' });
        }
      };

      request.onsuccess = async () => {
        const db = request.result;
        resolve(db);
        // Sembrar datos iniciales si la BD está vacía
        await DBService.seedDefaultsIfEmpty(db);
      };

      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  private static async seedDefaultsIfEmpty(db: IDBDatabase): Promise<void> {
    try {
      // 1. Buckets
      const bucketTx = db.transaction(STORES.BUCKETS, 'readonly');
      const bucketStore = bucketTx.objectStore(STORES.BUCKETS);
      const countReq = bucketStore.count();
      countReq.onsuccess = async () => {
        if (countReq.result === 0) {
          const writeTx = db.transaction(STORES.BUCKETS, 'readwrite');
          const writeStore = writeTx.objectStore(STORES.BUCKETS);
          for (const b of DEFAULT_BUCKETS) {
            writeStore.put(b);
          }
        }
      };

      // 2. Settings
      const settingsTx = db.transaction(STORES.SETTINGS, 'readonly');
      const settingsStore = settingsTx.objectStore(STORES.SETTINGS);
      const settingsReq = settingsStore.get(DEFAULT_SETTINGS.id);
      settingsReq.onsuccess = () => {
        if (settingsReq.result) {
          this.cachedSettings = { ...DEFAULT_SETTINGS, ...settingsReq.result };
          this.settingsLoaded = true;
        } else {
          // Inicializar desde localStorage si existe o defaults
          const localSettings = this.getLocalStorageItem<Settings>('gastos_settings', DEFAULT_SETTINGS);
          const writeTx = db.transaction(STORES.SETTINGS, 'readwrite');
          writeTx.objectStore(STORES.SETTINGS).put(localSettings);
          this.cachedSettings = localSettings;
          this.settingsLoaded = true;
        }
      };

      // 3. Tips
      const tipsTx = db.transaction(STORES.TIPS, 'readonly');
      const tipsStore = tipsTx.objectStore(STORES.TIPS);
      const tipsCount = tipsStore.count();
      tipsCount.onsuccess = () => {
        if (tipsCount.result === 0) {
          const writeTx = db.transaction(STORES.TIPS, 'readwrite');
          const writeStore = writeTx.objectStore(STORES.TIPS);
          for (const t of DEFAULT_TIPS) {
            writeStore.put(t);
          }
        }
      };
    } catch (e) {
      console.warn('[DBService] Advertencia sembrando defaults:', e);
    }
  }

  // --- SETTINGS (Lectura síncrona desde cache con persistencia async) ---
  static getSettings(): Settings {
    if (!this.settingsLoaded) {
      // Si la BD aún no ha respondido, leer de localStorage de respaldo
      const fromLocal = this.getLocalStorageItem<Settings>('gastos_settings', DEFAULT_SETTINGS);
      this.cachedSettings = { ...DEFAULT_SETTINGS, ...fromLocal };
    }
    return this.cachedSettings;
  }

  static async saveSettings(settings: Settings): Promise<void> {
    const updated: Settings = {
      ...settings,
      updatedAt: new Date().toISOString(),
    };
    this.cachedSettings = updated;
    this.settingsLoaded = true;

    // Guardar en localStorage inmediatamente
    this.setLocalStorageItem('gastos_settings', updated);

    // Guardar en IndexedDB
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORES.SETTINGS, 'readwrite');
        const store = tx.objectStore(STORES.SETTINGS);
        const req = store.put(updated);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('[DBService] Guardado en localStorage exitoso, fallo en IndexedDB:', e);
    }
  }

  // --- EXPENSES ---
  static async getExpenses(): Promise<Expense[]> {
    try {
      const db = await this.getDB();
      return await new Promise<Expense[]>((resolve, reject) => {
        const tx = db.transaction(STORES.EXPENSES, 'readonly');
        const store = tx.objectStore(STORES.EXPENSES);
        const req = store.getAll();
        req.onsuccess = () => {
          const list: Expense[] = req.result || [];
          list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
          resolve(list);
        };
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('[DBService] Fallback localStorage para expenses:', e);
      return this.getLocalStorageItem<Expense[]>('gastos_expenses', []);
    }
  }

  static async saveExpense(expense: Expense): Promise<void> {
    const expenses = await this.getExpenses();
    const idx = expenses.findIndex((e) => e.id === expense.id);
    if (idx >= 0) {
      expenses[idx] = expense;
    } else {
      expenses.unshift(expense);
    }
    this.setLocalStorageItem('gastos_expenses', expenses);

    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORES.EXPENSES, 'readwrite');
        const store = tx.objectStore(STORES.EXPENSES);
        const req = store.put(expense);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('[DBService] Guardado en localStorage completado, fallo en IndexedDB:', e);
    }
  }

  static async deleteExpense(id: string): Promise<void> {
    const expenses = await this.getExpenses();
    const filtered = expenses.filter((e) => e.id !== id);
    this.setLocalStorageItem('gastos_expenses', filtered);

    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORES.EXPENSES, 'readwrite');
        const store = tx.objectStore(STORES.EXPENSES);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('[DBService] Borrado en fallback ejecutado:', e);
    }
  }

  // --- BUCKETS (Bolsas) ---
  static async getBuckets(): Promise<Bucket[]> {
    try {
      const db = await this.getDB();
      return await new Promise<Bucket[]>((resolve, reject) => {
        const tx = db.transaction(STORES.BUCKETS, 'readonly');
        const store = tx.objectStore(STORES.BUCKETS);
        const req = store.getAll();
        req.onsuccess = () => {
          const list: Bucket[] = req.result || [];
          if (list.length === 0) {
            resolve(DEFAULT_BUCKETS);
          } else {
            resolve(list);
          }
        };
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('[DBService] Fallback localStorage para buckets:', e);
      return this.getLocalStorageItem<Bucket[]>('gastos_buckets', DEFAULT_BUCKETS);
    }
  }

  static async saveBucket(bucket: Bucket): Promise<void> {
    const buckets = await this.getBuckets();
    const idx = buckets.findIndex((b) => b.id === bucket.id);
    if (idx >= 0) {
      buckets[idx] = bucket;
    } else {
      buckets.push(bucket);
    }
    this.setLocalStorageItem('gastos_buckets', buckets);

    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORES.BUCKETS, 'readwrite');
        const store = tx.objectStore(STORES.BUCKETS);
        const req = store.put(bucket);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('[DBService] Error al guardar bolsa en IndexedDB:', e);
    }
  }

  static async deleteBucket(id: string): Promise<void> {
    const buckets = await this.getBuckets();
    const filtered = buckets.filter((b) => b.id !== id);
    this.setLocalStorageItem('gastos_buckets', filtered);

    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORES.BUCKETS, 'readwrite');
        const store = tx.objectStore(STORES.BUCKETS);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('[DBService] Error al borrar bolsa:', e);
    }
  }

  // --- RECURRING RULES ---
  static async getRecurringRules(): Promise<RecurringRule[]> {
    try {
      const db = await this.getDB();
      return await new Promise<RecurringRule[]>((resolve, reject) => {
        const tx = db.transaction(STORES.RECURRING_RULES, 'readonly');
        const store = tx.objectStore(STORES.RECURRING_RULES);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      return this.getLocalStorageItem<RecurringRule[]>('gastos_recurring_rules', []);
    }
  }

  static async saveRecurringRule(rule: RecurringRule): Promise<void> {
    const rules = await this.getRecurringRules();
    const idx = rules.findIndex((r) => r.id === rule.id);
    if (idx >= 0) {
      rules[idx] = rule;
    } else {
      rules.push(rule);
    }
    this.setLocalStorageItem('gastos_recurring_rules', rules);

    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORES.RECURRING_RULES, 'readwrite');
        const store = tx.objectStore(STORES.RECURRING_RULES);
        const req = store.put(rule);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('[DBService] Error al guardar regla recurrente:', e);
    }
  }

  static async deleteRecurringRule(id: string): Promise<void> {
    const rules = await this.getRecurringRules();
    const filtered = rules.filter((r) => r.id !== id);
    this.setLocalStorageItem('gastos_recurring_rules', filtered);

    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORES.RECURRING_RULES, 'readwrite');
        const store = tx.objectStore(STORES.RECURRING_RULES);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('[DBService] Error al borrar regla recurrente:', e);
    }
  }

  // --- TIPS ---
  static async getTips(): Promise<FinancialTip[]> {
    try {
      const db = await this.getDB();
      return await new Promise<FinancialTip[]>((resolve, reject) => {
        const tx = db.transaction(STORES.TIPS, 'readonly');
        const store = tx.objectStore(STORES.TIPS);
        const req = store.getAll();
        req.onsuccess = () => {
          const list: FinancialTip[] = req.result || [];
          resolve(list.length > 0 ? list : DEFAULT_TIPS);
        };
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      return this.getLocalStorageItem<FinancialTip[]>('gastos_tips', DEFAULT_TIPS);
    }
  }

  // --- BACKUP & EXPORT/IMPORT ---
  static async exportBackupEnvelope(): Promise<BackupEnvelope> {
    const [expenses, buckets, recurringRules, tips] = await Promise.all([
      this.getExpenses(),
      this.getBuckets(),
      this.getRecurringRules(),
      this.getTips(),
    ]);

    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      expenses,
      buckets,
      recurringRules,
      settings: this.getSettings(),
      tips,
    };
  }

  static async importBackupEnvelope(envelope: BackupEnvelope): Promise<void> {
    if (!envelope || !envelope.version) {
      throw new Error('Estructura de copia de seguridad no válida.');
    }

    if (envelope.settings) {
      await this.saveSettings(envelope.settings);
    }

    if (Array.isArray(envelope.buckets)) {
      for (const b of envelope.buckets) {
        await this.saveBucket(b);
      }
    }

    if (Array.isArray(envelope.expenses)) {
      for (const e of envelope.expenses) {
        await this.saveExpense(e);
      }
    }

    if (Array.isArray(envelope.recurringRules)) {
      for (const r of envelope.recurringRules) {
        await this.saveRecurringRule(r);
      }
    }
  }

  // --- HELPERS LOCALSTORAGE ---
  private static getLocalStorageItem<T>(key: string, defaultValue: T): T {
    try {
      if (typeof localStorage === 'undefined') return defaultValue;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private static setLocalStorageItem<T>(key: string, value: T): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch {
      // Ignorar quota errors
    }
  }
}
