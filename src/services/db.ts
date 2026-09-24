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
    id: 'bucket-vivienda',
    name: 'Vivienda & Hipoteca / Alquiler',
    budgetLimit: 650,
    color: '#3b82f6', // blue
    icon: 'Home',
    isBuffer: false,
    notes: 'Cuota de hipoteca o alquiler mensual, IBI y comunidad',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'bucket-suministros',
    name: 'Suministros (Luz, Gas, Agua)',
    budgetLimit: 160,
    color: '#f59e0b', // amber
    icon: 'Zap',
    isBuffer: false,
    notes: 'Electricidad, gas natural, agua y tasa de basuras',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'bucket-super',
    name: 'Alimentación y Supermercado',
    budgetLimit: 380,
    color: '#10b981', // emerald
    icon: 'ShoppingCart',
    isBuffer: false,
    notes: 'Alimentación, droguería y compras básicas del hogar',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'bucket-transporte',
    name: 'Combustible y Movilidad',
    budgetLimit: 150,
    color: '#06b6d4', // cyan
    icon: 'Car',
    isBuffer: false,
    notes: 'Gasolina, diésel, transporte público, parkings y peajes',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'bucket-seguros',
    name: 'Seguros (Coche, Hogar, Salud)',
    budgetLimit: 95,
    color: '#8b5cf6', // purple
    icon: 'ShieldCheck',
    isBuffer: false,
    notes: 'Pólizas de seguro de auto, vivienda, decesos y coberturas médicas',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'bucket-teleco',
    name: 'Telecomunicaciones y Fibra',
    budgetLimit: 70,
    color: '#ec4899', // pink
    icon: 'Smartphone',
    isBuffer: false,
    notes: 'Fibra óptica en casa, líneas móviles y plataformas streaming',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'bucket-ocio',
    name: 'Ocio y Restauración',
    budgetLimit: 180,
    color: '#f97316', // orange
    icon: 'Utensils',
    isBuffer: false,
    notes: 'Restaurantes, cafés, cine, escapadas y caprichos personales',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'bucket-colchon',
    name: 'Colchón de Ahorro e Imprevistos',
    budgetLimit: 250,
    color: '#14b8a6', // teal
    icon: 'PiggyBank',
    isBuffer: true,
    notes: 'Bolsa amortiguadora para imprevistos, averías y acumulación de ahorro',
    createdAt: new Date().toISOString(),
  },
];

export const DEFAULT_RECURRING_SEEDS: RecurringRule[] = [
  {
    id: 'rec-hipoteca',
    title: 'Hipoteca / Alquiler Vivienda',
    amount: 650,
    bucketId: 'bucket-vivienda',
    frequency: 'monthly',
    dayOfMonth: 1,
    startDate: new Date().toISOString().split('T')[0],
    isActive: true,
    autoCreateExpense: true,
    icon: 'Home',
    notes: 'Recibo domiciliado de cuota hipotecaria o arrendamiento',
  },
  {
    id: 'rec-luz',
    title: 'Electricidad y Suministros (Luz)',
    amount: 75,
    bucketId: 'bucket-suministros',
    frequency: 'monthly',
    dayOfMonth: 10,
    startDate: new Date().toISOString().split('T')[0],
    isActive: true,
    autoCreateExpense: true,
    icon: 'Zap',
    notes: 'Factura mensual de luz en mercado regulado/libre',
  },
  {
    id: 'rec-agua',
    title: 'Recibo de Agua y Saneamiento',
    amount: 32,
    bucketId: 'bucket-suministros',
    frequency: 'monthly',
    dayOfMonth: 15,
    startDate: new Date().toISOString().split('T')[0],
    isActive: true,
    autoCreateExpense: true,
    icon: 'Zap',
    notes: 'Canal de distribución de agua y tasa de basuras',
  },
  {
    id: 'rec-fibra',
    title: 'Fibra Óptica + 2 Líneas Móvil',
    amount: 48,
    bucketId: 'bucket-teleco',
    frequency: 'monthly',
    dayOfMonth: 5,
    startDate: new Date().toISOString().split('T')[0],
    isActive: true,
    autoCreateExpense: true,
    icon: 'Smartphone',
    notes: 'Operador de telecomunicaciones (Fibra y datos ilimitados)',
  },
  {
    id: 'rec-seguro-coche',
    title: 'Seguro Anual del Vehículo',
    amount: 320,
    bucketId: 'bucket-seguros',
    frequency: 'yearly',
    dayOfMonth: 20,
    startDate: new Date().toISOString().split('T')[0],
    isActive: true,
    autoCreateExpense: true,
    icon: 'Car',
    notes: 'Póliza de seguro a todo riesgo o terceros con lunas',
  },
  {
    id: 'rec-gimnasio',
    title: 'Cuota Gimnasio / Salud Deportiva',
    amount: 39.9,
    bucketId: 'bucket-ocio',
    frequency: 'monthly',
    dayOfMonth: 2,
    startDate: new Date().toISOString().split('T')[0],
    isActive: true,
    autoCreateExpense: true,
    icon: 'Utensils',
    notes: 'Membresía mensual deportiva',
  },
  {
    id: 'rec-streaming',
    title: 'Suscripción Streaming Multimedia',
    amount: 12.99,
    bucketId: 'bucket-teleco',
    frequency: 'monthly',
    dayOfMonth: 8,
    startDate: new Date().toISOString().split('T')[0],
    isActive: true,
    autoCreateExpense: true,
    icon: 'Smartphone',
    isVampire: true,
    notes: 'Gasto vampiro: susceptible de migración a plan anual con 2 meses gratis',
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

  /**
   * Carga o fusiona la Plantilla Maestra de 8 Bolsas (Smart Seeds)
   */
  static async applyMasterSeeds(mode: 'replace' | 'append' = 'append'): Promise<Bucket[]> {
    let result: Bucket[];
    if (mode === 'replace') {
      result = [...DEFAULT_BUCKETS];
    } else {
      const current = await this.getBuckets();
      const currentNames = new Set(current.map((b) => b.name.toLowerCase()));
      const toAdd = DEFAULT_BUCKETS.filter((b) => !currentNames.has(b.name.toLowerCase()));
      result = [...current, ...toAdd];
    }

    this.setLocalStorageItem('gastos_buckets', result);
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORES.BUCKETS, 'readwrite');
        const store = tx.objectStore(STORES.BUCKETS);
        if (mode === 'replace') {
          store.clear();
        }
        for (const b of result) {
          store.put(b);
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.warn('[DBService] Error al aplicar semillas maestras en IndexedDB:', e);
    }
    return result;
  }

  /**
   * Vasos Comunicantes: Trasvase elástico de límite presupuestario entre dos bolsas
   */
  static async transferBucketBalance(
    fromBucketId: string,
    toBucketId: string,
    amount: number
  ): Promise<{ fromBucket: Bucket; toBucket: Bucket }> {
    if (amount <= 0) throw new Error('El importe a transferir debe ser mayor a 0');
    if (fromBucketId === toBucketId) throw new Error('No puedes transferir a la misma bolsa');

    const buckets = await this.getBuckets();
    const fromIdx = buckets.findIndex((b) => b.id === fromBucketId);
    const toIdx = buckets.findIndex((b) => b.id === toBucketId);

    if (fromIdx < 0 || toIdx < 0) throw new Error('Una de las bolsas seleccionadas no existe');

    const fromBucket = { ...buckets[fromIdx] };
    const toBucket = { ...buckets[toIdx] };

    // Disminuir límite en origen y aumentarlo en destino
    fromBucket.budgetLimit = Math.max(0, Math.round((fromBucket.budgetLimit - amount) * 100) / 100);
    toBucket.budgetLimit = Math.round((toBucket.budgetLimit + amount) * 100) / 100;

    buckets[fromIdx] = fromBucket;
    buckets[toIdx] = toBucket;

    this.setLocalStorageItem('gastos_buckets', buckets);

    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORES.BUCKETS, 'readwrite');
        const store = tx.objectStore(STORES.BUCKETS);
        store.put(fromBucket);
        store.put(toBucket);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.warn('[DBService] Error al registrar vasos comunicantes en IndexedDB:', e);
    }

    return { fromBucket, toBucket };
  }

  /**
   * Rollover de Ahorro: Suma los remanentes no consumidos de las bolsas del mes y los transfiere al Colchón de Ahorro
   */
  static async executeMonthlyRollover(
    currentMonthPrefix: string,
    targetBufferBucketId?: string
  ): Promise<{ surplusTotal: number; transferredTo: string; bucketCount: number }> {
    const buckets = await this.getBuckets();
    const expenses = await this.getExpenses();
    const monthExpenses = expenses.filter((e) => (e.date || '').startsWith(currentMonthPrefix));

    // Buscar la bolsa amortiguadora de destino (o la primera con isBuffer === true)
    let bufferBucket = targetBufferBucketId
      ? buckets.find((b) => b.id === targetBufferBucketId)
      : buckets.find((b) => b.isBuffer);

    if (!bufferBucket && buckets.length > 0) {
      bufferBucket = buckets[buckets.length - 1];
    }

    if (!bufferBucket) {
      throw new Error('No existe una bolsa de Colchón o Ahorro para recibir el rollover');
    }

    let surplusTotal = 0;
    let countedBuckets = 0;

    // Calcular remanentes positivos de bolsas que no sean el colchón
    for (const b of buckets) {
      if (b.id === bufferBucket.id) continue;
      const spent = monthExpenses
        .filter((e) => e.bucketId === b.id)
        .reduce((sum, e) => sum + e.amount, 0);
      const remaining = b.budgetLimit - spent;
      if (remaining > 0) {
        surplusTotal += remaining;
        countedBuckets++;
      }
    }

    surplusTotal = Math.round(surplusTotal * 100) / 100;

    if (surplusTotal > 0) {
      bufferBucket.budgetLimit = Math.round((bufferBucket.budgetLimit + surplusTotal) * 100) / 100;
      await this.saveBucket(bufferBucket);
    }

    return {
      surplusTotal,
      transferredTo: bufferBucket.name,
      bucketCount: countedBuckets,
    };
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

  /**
   * Carga o fusiona las Facturas Recurrentes Maestras (Smart Seeds)
   */
  static async applyRecurringSeeds(mode: 'replace' | 'append' = 'append'): Promise<RecurringRule[]> {
    let result: RecurringRule[];
    if (mode === 'replace') {
      result = [...DEFAULT_RECURRING_SEEDS];
    } else {
      const current = await this.getRecurringRules();
      const currentTitles = new Set(current.map((r) => r.title.toLowerCase()));
      const toAdd = DEFAULT_RECURRING_SEEDS.filter((r) => !currentTitles.has(r.title.toLowerCase()));
      result = [...current, ...toAdd];
    }

    this.setLocalStorageItem('gastos_recurring_rules', result);
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORES.RECURRING_RULES, 'readwrite');
        const store = tx.objectStore(STORES.RECURRING_RULES);
        if (mode === 'replace') {
          store.clear();
        }
        for (const r of result) {
          store.put(r);
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.warn('[DBService] Error al aplicar semillas de recurrentes:', e);
    }
    return result;
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

  /**
   * Sobrescribe de forma atómica y completa la base de datos (IndexedDB y localStorage)
   */
  static async clearAndRestore(data: {
    expenses: Expense[];
    buckets: Bucket[];
    recurringRules: RecurringRule[];
    settings?: Settings;
    tips?: FinancialTip[];
  }): Promise<void> {
    this.setLocalStorageItem('gastos_expenses', data.expenses);
    this.setLocalStorageItem('gastos_buckets', data.buckets);
    this.setLocalStorageItem('gastos_recurring_rules', data.recurringRules);
    if (data.settings) {
      this.cachedSettings = { ...DEFAULT_SETTINGS, ...data.settings };
      this.setLocalStorageItem('gastos_settings', this.cachedSettings);
    }
    if (data.tips && data.tips.length > 0) {
      this.setLocalStorageItem('gastos_tips', data.tips);
    }

    try {
      const db = await this.getDB();
      const tx = db.transaction(
        [STORES.EXPENSES, STORES.BUCKETS, STORES.RECURRING_RULES, STORES.SETTINGS, STORES.TIPS],
        'readwrite'
      );

      tx.objectStore(STORES.EXPENSES).clear();
      tx.objectStore(STORES.BUCKETS).clear();
      tx.objectStore(STORES.RECURRING_RULES).clear();
      if (data.tips && data.tips.length > 0) {
        tx.objectStore(STORES.TIPS).clear();
      }

      if (data.settings) {
        tx.objectStore(STORES.SETTINGS).put(this.cachedSettings!);
      }

      const expStore = tx.objectStore(STORES.EXPENSES);
      for (const e of data.expenses) {
        expStore.put(e);
      }

      const bStore = tx.objectStore(STORES.BUCKETS);
      for (const b of data.buckets) {
        bStore.put(b);
      }

      const rStore = tx.objectStore(STORES.RECURRING_RULES);
      for (const r of data.recurringRules) {
        rStore.put(r);
      }

      if (data.tips && data.tips.length > 0) {
        const tStore = tx.objectStore(STORES.TIPS);
        for (const t of data.tips) {
          tStore.put(t);
        }
      }

      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(new Error('Transacción abortada'));
      });
    } catch (e) {
      console.warn('[DBService] Advertencia en IndexedDB al restaurar, fallback local asegurado:', e);
    }
  }

  /**
   * Fusiona registros entrantes con los existentes preservando IDs únicos
   */
  static async mergeAndRestore(data: {
    expenses: Expense[];
    buckets: Bucket[];
    recurringRules: RecurringRule[];
    settings?: Settings;
    tips?: FinancialTip[];
  }): Promise<void> {
    const [currentExpenses, currentBuckets, currentRules] = await Promise.all([
      this.getExpenses(),
      this.getBuckets(),
      this.getRecurringRules(),
    ]);

    const expMap = new Map<string, Expense>();
    currentExpenses.forEach((e) => expMap.set(e.id, e));
    data.expenses.forEach((e) => expMap.set(e.id, e));

    const bucketMap = new Map<string, Bucket>();
    currentBuckets.forEach((b) => bucketMap.set(b.id, b));
    data.buckets.forEach((b) => bucketMap.set(b.id, b));

    const ruleMap = new Map<string, RecurringRule>();
    currentRules.forEach((r) => ruleMap.set(r.id, r));
    data.recurringRules.forEach((r) => ruleMap.set(r.id, r));

    await this.clearAndRestore({
      expenses: Array.from(expMap.values()),
      buckets: Array.from(bucketMap.values()),
      recurringRules: Array.from(ruleMap.values()),
      settings: data.settings || this.getSettings(),
      tips: data.tips,
    });
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
