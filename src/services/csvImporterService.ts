import { Expense, Bucket, SmartRule, ExtraIncome, MonthlySalaryOverride } from '../types';
import * as XLSX from 'xlsx';

export const isPayrollConcept = (concept: string): boolean => {
  const norm = (concept || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
  return /NOMINA|SALARIO|HABERES|SUELDO|RETRIBUCION|TRANSFERENCIA NOMINA|PAGA EXTRA|LIQUIDACION HABERES/.test(norm);
};

/**
 * Determina el mes presupuestario al que se imputa una nómina según su fecha de cobro.
 * Criterio financiero canónico de CronoCash:
 * - Cobro a partir del día 20 (día >= 20): Imputa al MES SIGUIENTE (ej. 28 de septiembre -> octubre).
 * - Cobro antes del día 20 (día < 20): Imputa al MES EN CURSO (ej. 2 de octubre -> octubre).
 * - Fin de año: Si el cobro es el 28 de diciembre, imputa a enero del año siguiente (YYYY+1-01).
 *
 * @param dateStr Fecha en formato YYYY-MM-DD o ISO string
 * @returns Clave del mes objetivo en formato 'YYYY-MM'
 */
export const resolveTargetSalaryMonth = (dateStr: string): string => {
  if (!dateStr) {
    return new Date().toISOString().substring(0, 7);
  }

  const clean = dateStr.trim().split('T')[0];
  const parts = clean.split('-');

  if (parts.length >= 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10); // 1 - 12
    const day = parseInt(parts[2], 10);

    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      if (day >= 20) {
        // Imputación al mes siguiente (financiación del presupuesto próximo)
        if (month === 12) {
          return `${year + 1}-01`;
        }
        return `${year}-${String(month + 1).padStart(2, '0')}`;
      } else {
        // Imputación al mes en curso (cobro a mes vencido a primeros de mes)
        return `${year}-${String(month).padStart(2, '0')}`;
      }
    }
  }

  // Fallback si la cadena tuviese otro formato parseable por Date
  const d = new Date(clean);
  if (!isNaN(d.getTime())) {
    const day = d.getDate();
    if (day >= 20) {
      d.setMonth(d.getMonth() + 1);
    }
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  return clean.substring(0, 7) || new Date().toISOString().substring(0, 7);
};

/**
 * Formatea una clave 'YYYY-MM' a un texto legible en español (ej: "2026-10" -> "Octubre 2026")
 */
export const formatMonthName = (monthStr: string): string => {
  if (!monthStr || !monthStr.includes('-')) return monthStr || '';
  const [yearStr, mStr] = monthStr.split('-');
  const m = parseInt(mStr, 10);
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  if (m >= 1 && m <= 12) {
    return `${months[m - 1]} ${yearStr}`;
  }
  return monthStr;
};

export interface RawBankTransaction {
  id: string;
  rawDate: string;
  rawConcept: string;
  rawAmount: number;
  parsedDate: string;
  cleanConcept: string;
  amount: number;
  isIncome?: boolean;
  rawHash: string;
  balance?: number;
  currency?: string;
}

export interface AnalyzedTransaction extends RawBankTransaction {
  isDuplicate: boolean;
  duplicateReason?: string;
  suggestedBucketId: string;
  matchedRuleId?: string;
  matchedRulePattern?: string;
  isInvoice?: boolean;
  selected: boolean;
  incomeCategoryMode?: 'salary' | 'extra'; // 'salary' para Nómina Mensual blindada, 'extra' para Ingreso Extra
  targetSalaryMonth?: string; // 'YYYY-MM' mes al que imputa el salario (regla >= 20 -> mes siguiente)
  targetExtraMonth?: string; // 'YYYY-MM' mes al que imputa el ingreso extra (por defecto mes actual de la tx)
  targetBucketId?: string; // ID opcional de la bolsa a la que se destina
  allocationMode?: 'general' | 'bucket_budget' | 'bucket_refund'; // Inyección a techo vs compensación de gasto
}

export interface BatchAnalysisResult {
  totalRows: number;
  validRows: AnalyzedTransaction[];
  duplicates: AnalyzedTransaction[];
  ruleMatchedCount: number;
  unassignedCount: number;
  allTransactions: AnalyzedTransaction[];
}

export class CsvImporterService {
  /**
   * Detecta automáticamente el delimitador más probable en el archivo CSV (;, ,, o \t)
   */
  static detectDelimiter(sampleLines: string[]): string {
    const delimiters = [';', ',', '\t'];
    let bestDelimiter = ';';
    let maxConsistency = -1;

    for (const delim of delimiters) {
      const counts = sampleLines
        .filter((line) => line.trim().length > 0)
        .map((line) => (line.split(delim).length - 1));

      if (counts.length === 0) continue;

      // Calcular si el delimitador aparece regularmente y con cuenta > 0
      const firstCount = counts[0];
      const isConsistent = counts.every((c) => c > 0 && Math.abs(c - firstCount) <= 1);
      const avg = counts.reduce((a, b) => a + b, 0) / counts.length;

      if (isConsistent && avg > maxConsistency) {
        maxConsistency = avg;
        bestDelimiter = delim;
      } else if (avg > maxConsistency && maxConsistency === -1) {
        bestDelimiter = delim;
      }
    }

    return bestDelimiter;
  }

  /**
   * Tokeniza una línea CSV respetando comillas y delimitadores escapados
   */
  static tokenizeLine(line: string, delimiter: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"' || char === "'") {
        if (inQuotes && nextChar === char) {
          current += char;
          i++; // saltar comilla escapada
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  /**
   * Parsea fechas españolas o ISO comunes:
   * DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, DD/MM/YY
   */
  static parseDate(dateStr: string): string {
    if (!dateStr) return new Date().toISOString().split('T')[0];
    const cleaned = dateStr.trim().replace(/^["']|["']$/g, '').split(' ')[0]; // Quitar horas si vienen incluidas

    // Formato DD/MM/YYYY o DD-MM-YYYY
    const dmyMatch = cleaned.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
    if (dmyMatch) {
      const day = dmyMatch[1].padStart(2, '0');
      const month = dmyMatch[2].padStart(2, '0');
      let year = dmyMatch[3];
      if (year.length === 2) {
        year = `20${year}`;
      }
      return `${year}-${month}-${day}`;
    }

    // Formato YYYY/MM/DD o YYYY-MM-DD
    const ymdMatch = cleaned.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
    if (ymdMatch) {
      const year = ymdMatch[1];
      const month = ymdMatch[2].padStart(2, '0');
      const day = ymdMatch[3].padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    // Fallback: Date.parse si es legible
    const parsed = new Date(cleaned);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }

    return new Date().toISOString().split('T')[0];
  }

  /**
   * Parsea importes en formato español (1.250,50 o -45,99) o internacional (-45.99)
   */
  static parseAmount(amountStr: string): number {
    if (!amountStr) return 0;
    let s = amountStr
      .trim()
      .replace(/^["']|["']$/g, '')
      .replace(/[€$£EUR\s]/gi, '');

    if (!s) return 0;

    // Caso 1: Formato español con puntos de miles y coma decimal (ej: 1.250,50 o -1.250,50)
    if (s.includes(',') && s.includes('.')) {
      if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
        // Puntos son miles, coma es decimal
        s = s.replace(/\./g, '').replace(',', '.');
      } else {
        // Comas son miles, punto es decimal
        s = s.replace(/,/g, '');
      }
    } else if (s.includes(',')) {
      // Solo contiene coma -> es el separador decimal
      s = s.replace(',', '.');
    }

    const num = parseFloat(s);
    return isNaN(num) ? 0 : num;
  }

  /**
   * Genera hash SHA-256 determinista para deduplicación exacta
   */
  static async computeSha256(date: string, concept: string, amount: number): Promise<string> {
    const normConcept = concept.trim().toUpperCase().replace(/\s+/g, ' ');
    const str = `${date.trim()}|${normConcept}|${amount.toFixed(2)}`;

    if (typeof crypto !== 'undefined' && crypto.subtle && typeof TextEncoder !== 'undefined') {
      try {
        const data = new TextEncoder().encode(str);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      } catch {
        // Fallback a hash determinista
      }
    }

    // Fallback determinista de 64-bit seguro
    let h1 = 0xdeadbeef;
    let h2 = 0x41c6ce57;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(16, '0');
  }

  /**
   * Parsea un libro de Excel (.xlsx / .xls) convirtiendo la primera hoja a matriz de transacciones
   */
  static parseExcel(data: ArrayBuffer): RawBankTransaction[] {
    try {
      const wb = XLSX.read(data, { type: 'array', cellDates: true });
      if (!wb.SheetNames || wb.SheetNames.length === 0) return [];
      const firstSheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(firstSheet, {
        header: 1,
        raw: false,
        dateNF: 'yyyy-mm-dd',
        defval: '',
      }) as (string | number)[][];

      // Normalizar cada celda a string limpio
      const matrix: string[][] = rows.map((r) =>
        r.map((cell) => (cell !== null && cell !== undefined ? String(cell).trim() : ''))
      );

      return this.parseMatrix(matrix);
    } catch (e) {
      console.error('[CsvImporterService] Error al parsear archivo Excel:', e);
      return [];
    }
  }

  /**
   * Parsea el contenido CSV/TSV y extrae las transacciones bancarias
   */
  static parseCsv(fileContent: string): RawBankTransaction[] {
    if (!fileContent || !fileContent.trim()) return [];

    const rawLines = fileContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (rawLines.length === 0) return [];

    const delimiter = this.detectDelimiter(rawLines.slice(0, 15));
    const matrix: string[][] = rawLines.map((line) => this.tokenizeLine(line, delimiter));

    return this.parseMatrix(matrix);
  }

  /**
   * Parsea una matriz de filas buscando dinámicamente la cabecera canónica bancaria:
   * "Fecha contable | Fecha valor | Descripción | Importe | Saldo | Divisa"
   * Omitiendo de forma segura el preámbulo inicial de resúmenes de cuenta o movimientos no consolidados.
   */
  static parseMatrix(rawRows: string[][]): RawBankTransaction[] {
    if (!rawRows || rawRows.length === 0) return [];

    let headerRowIdx = -1;
    let fechaValorCol = -1;
    let fechaContableCol = -1;
    let conceptCol = -1;
    let amountCol = -1;
    let saldoCol = -1;
    let divisaCol = -1;
    let debeCol = -1;
    let haberCol = -1;

    const fechaValorKeywords = ['fecha valor', 'f.valor', 'f. valor', 'value date'];
    const fechaContableKeywords = ['fecha contable', 'f.contable', 'f. contable', 'fecha operacion', 'f.operacion', 'f. operacion', 'fecha', 'date'];
    const conceptKeywords = ['descripcion', 'descripción', 'concepto', 'movimiento', 'detalle', 'beneficiario', 'description', 'asunto', 'texto'];
    const amountKeywords = ['importe', 'cantidad', 'monto', 'amount', 'total'];
    const saldoKeywords = ['saldo', 'balance'];
    const divisaKeywords = ['divisa', 'moneda', 'currency'];
    const debeKeywords = ['debe', 'cargo', 'gastos', 'salidas', 'debit'];
    const haberKeywords = ['haber', 'abono', 'ingresos', 'entradas', 'credit'];

    // Escanear hasta 150 filas para omitir resúmenes de cuenta, datos de titular y movimientos no consolidados
    const maxScanLines = Math.min(rawRows.length, 150);

    for (let i = 0; i < maxScanLines; i++) {
      const cols = rawRows[i].map((c) =>
        (c || '').toLowerCase().trim().replace(/^["']|["']$/g, '')
      );
      if (cols.length <= 1) continue;

      const fvIdx = cols.findIndex((c) => fechaValorKeywords.some((k) => c.includes(k)));
      const fcIdx = cols.findIndex((c) => fechaContableKeywords.some((k) => c.includes(k)));
      const cIdx = cols.findIndex((c) => conceptKeywords.some((k) => c.includes(k)));
      const aIdx = cols.findIndex((c) => amountKeywords.some((k) => c === k || c.startsWith(k)));
      const sIdx = cols.findIndex((c) => saldoKeywords.some((k) => c === k || c.startsWith(k)));
      const divIdx = cols.findIndex((c) => divisaKeywords.some((k) => c === k || c.startsWith(k)));
      const debIdx = cols.findIndex((c) => debeKeywords.some((k) => c === k || c.startsWith(k)));
      const habIdx = cols.findIndex((c) => haberKeywords.some((k) => c === k || c.startsWith(k)));

      const hasDate = fvIdx !== -1 || fcIdx !== -1;
      const hasConcept = cIdx !== -1;
      const hasAmountOrDebit = aIdx !== -1 || debIdx !== -1 || habIdx !== -1;

      // Si encontramos la combinación bancaria típica (fecha + concepto + importe/saldo)
      if (hasDate && (hasConcept || hasAmountOrDebit)) {
        headerRowIdx = i;
        fechaValorCol = fvIdx;
        fechaContableCol = fcIdx;
        conceptCol = cIdx;
        amountCol = aIdx;
        saldoCol = sIdx;
        divisaCol = divIdx;
        debeCol = debIdx;
        haberCol = habIdx;
        break;
      }
    }

    // Si no se encontró cabecera explícita, usar heurística por posición
    if (headerRowIdx === -1) {
      headerRowIdx = 0;
      fechaValorCol = 0;
      conceptCol = 1;
      amountCol = 2;
    }

    // Priorizar 'Fecha valor' como fecha real de liquidación del cargo/abono
    const dateCol = fechaValorCol !== -1 ? fechaValorCol : (fechaContableCol !== -1 ? fechaContableCol : 0);
    const resolvedConceptCol = conceptCol !== -1 ? conceptCol : (dateCol === 0 ? 1 : 0);

    const transactions: RawBankTransaction[] = [];
    const rows = rawRows.slice(headerRowIdx + 1);

    for (let r = 0; r < rows.length; r++) {
      const cols = rows[r];
      if (!cols || cols.length <= 1) continue;

      const rawDate = cols[dateCol] || (fechaContableCol !== -1 ? cols[fechaContableCol] : '') || '';
      const rawConcept = cols[resolvedConceptCol] || 'Movimiento bancario';
      let rawAmount = 0;
      let isIncome = false;

      if (amountCol !== -1 && cols[amountCol] !== undefined && cols[amountCol] !== '') {
        rawAmount = this.parseAmount(cols[amountCol]);
        if (debeCol === -1) {
          // Si el importe es positivo es un abono/ingreso (+), si es negativo es gasto (-)
          isIncome = rawAmount > 0;
        }
      } else if (debeCol !== -1) {
        const debeVal = cols[debeCol] ? this.parseAmount(cols[debeCol]) : 0;
        const haberVal = haberCol !== -1 && cols[haberCol] ? this.parseAmount(cols[haberCol]) : 0;
        if (Math.abs(debeVal) > 0) {
          rawAmount = -Math.abs(debeVal);
          isIncome = false;
        } else if (Math.abs(haberVal) > 0) {
          rawAmount = Math.abs(haberVal);
          isIncome = true;
        }
      } else {
        // Probar cualquier columna numérica
        for (let c = 0; c < cols.length; c++) {
          if (c !== dateCol && c !== resolvedConceptCol) {
            const val = this.parseAmount(cols[c]);
            if (val !== 0) {
              rawAmount = val;
              isIncome = val > 0;
              break;
            }
          }
        }
      }

      if (rawAmount === 0 && (!rawConcept || rawConcept === 'Movimiento bancario')) continue;

      // Omitir posibles pies de página o totales
      const lowerConcept = rawConcept.toLowerCase();
      if (
        lowerConcept.includes('saldo final') ||
        lowerConcept.includes('total movimientos') ||
        lowerConcept.includes('fin de extracto')
      ) {
        continue;
      }

      const parsedDate = this.parseDate(rawDate);
      const cleanConcept = rawConcept
        .replace(/\s+/g, ' ')
        .replace(/^["']|["']$/g, '')
        .trim();

      // Convertir siempre a importe absoluto para cálculo en CronoCash, preservando isIncome
      const expenseAmount = Math.abs(rawAmount);
      const rawBalance = saldoCol !== -1 && cols[saldoCol] ? this.parseAmount(cols[saldoCol]) : undefined;
      const rawCurrency = divisaCol !== -1 && cols[divisaCol] ? cols[divisaCol].trim() : undefined;

      transactions.push({
        id: `raw_tx_${Date.now()}_${r}`,
        rawDate,
        rawConcept,
        rawAmount,
        parsedDate,
        cleanConcept,
        amount: Math.round(expenseAmount * 100) / 100,
        isIncome,
        rawHash: '',
        balance: rawBalance,
        currency: rawCurrency,
      });
    }

    return transactions;
  }

  /**
   * Analiza un lote de transacciones aplicando deduplicación inteligente y motor de reglas.
   * Deduplica tanto contra el historial de gastos (expenses) como contra ingresos (extraIncomes).
   */
  static async analyzeBatch(
    rows: RawBankTransaction[],
    existingExpenses: Expense[],
    rules: SmartRule[],
    buckets: Bucket[],
    existingExtraIncomes: ExtraIncome[] = [],
    existingSalaries: Record<string, MonthlySalaryOverride> = {}
  ): Promise<BatchAnalysisResult> {
    const activeRules = [...rules]
      .filter((r) => r.isActive)
      .sort((a, b) => b.priority - a.priority);

    const validBucketIds = new Set(buckets.map((b) => b.id));
    const fallbackBucketId = buckets[0]?.id || 'bucket-super';

    // Crear mapa de gastos, ingresos y nóminas existentes por hash y por tupla (fecha + concepto + importe)
    const existingHashSet = new Set<string>();
    const existingTupleSet = new Set<string>();

    for (const exp of existingExpenses) {
      if (exp.rawHash) {
        existingHashSet.add(exp.rawHash);
      }
      const tupleKey = `${(exp.date || '').trim()}|${(exp.title || '').trim().toUpperCase()}|${(exp.amount || 0).toFixed(2)}`;
      existingTupleSet.add(tupleKey);
    }

    for (const inc of existingExtraIncomes) {
      if (inc.rawHash) {
        existingHashSet.add(inc.rawHash);
      }
      const tupleKey = `${(inc.date || '').trim()}|${(inc.title || '').trim().toUpperCase()}|${(inc.amount || 0).toFixed(2)}`;
      existingTupleSet.add(tupleKey);
    }

    for (const sal of Object.values(existingSalaries)) {
      if (sal.rawHash) {
        existingHashSet.add(sal.rawHash);
      }
      if (sal.date) {
        const tupleKey = `${(sal.date || '').trim()}|${(sal.concept || '').trim().toUpperCase()}|${(sal.amount || 0).toFixed(2)}`;
        existingTupleSet.add(tupleKey);
      }
    }

    const analyzedList: AnalyzedTransaction[] = [];
    const duplicates: AnalyzedTransaction[] = [];
    const validRows: AnalyzedTransaction[] = [];
    let ruleMatchedCount = 0;
    let unassignedCount = 0;

    for (const row of rows) {
      const hash = await this.computeSha256(row.parsedDate, row.cleanConcept, row.amount);
      const tupleKey = `${row.parsedDate.trim()}|${row.cleanConcept.trim().toUpperCase()}|${row.amount.toFixed(2)}`;

      const isDuplicate = existingHashSet.has(hash) || existingTupleSet.has(tupleKey);

      // Evaluación del motor de reglas
      let suggestedBucketId = fallbackBucketId;
      let matchedRuleId: string | undefined;
      let matchedRulePattern: string | undefined;
      let isInvoice = false;

      const upperConcept = row.cleanConcept.toUpperCase();

      for (const rule of activeRules) {
        const pat = rule.pattern.trim().toUpperCase();
        let isMatch = false;

        switch (rule.matchType) {
          case 'exact':
            isMatch = upperConcept === pat;
            break;
          case 'startsWith':
            isMatch = upperConcept.startsWith(pat);
            break;
          case 'regex':
            try {
              isMatch = new RegExp(rule.pattern, 'i').test(row.cleanConcept);
            } catch {
              isMatch = false;
            }
            break;
          case 'contains':
          default:
            isMatch = upperConcept.includes(pat);
            break;
        }

        if (isMatch) {
          // Verificar que la bolsa asignada exista
          suggestedBucketId = validBucketIds.has(rule.bucketId) ? rule.bucketId : fallbackBucketId;
          matchedRuleId = rule.id;
          matchedRulePattern = rule.pattern;
          isInvoice = Boolean(rule.isInvoice);
          break;
        }
      }

      if (matchedRuleId) {
        ruleMatchedCount++;
      } else {
        unassignedCount++;
      }

      const txMonth = row.parsedDate ? row.parsedDate.substring(0, 7) : new Date().toISOString().substring(0, 7);
      const isPayroll = row.isIncome ? isPayrollConcept(row.cleanConcept || row.rawConcept) : false;
      const incomeCategoryMode: 'salary' | 'extra' | undefined = row.isIncome
        ? (isPayroll ? 'salary' : 'extra')
        : undefined;

      // Criterio financiero de CronoCash:
      // Nómina: si el cobro es >= día 20, financia el mes siguiente; si es < día 20, financia el mes actual.
      // Ingreso Extra: computa por defecto para el mes en curso (mes de la transacción).
      const targetSalaryMonth = resolveTargetSalaryMonth(row.parsedDate);
      const targetExtraMonth = txMonth;

      const analyzed: AnalyzedTransaction = {
        ...row,
        rawHash: hash,
        isDuplicate,
        duplicateReason: isDuplicate
          ? (row.isIncome ? 'Ingreso o nómina idéntica ya integrada en CronoCash' : 'Gasto idéntico ya registrado en historial')
          : undefined,
        suggestedBucketId,
        matchedRuleId,
        matchedRulePattern,
        isInvoice,
        selected: !isDuplicate,
        incomeCategoryMode,
        targetSalaryMonth,
        targetExtraMonth,
      };

      analyzedList.push(analyzed);

      if (isDuplicate) {
        duplicates.push(analyzed);
      } else {
        validRows.push(analyzed);
      }
    }

    return {
      totalRows: rows.length,
      validRows,
      duplicates,
      ruleMatchedCount,
      unassignedCount,
      allTransactions: analyzedList,
    };
  }
}
