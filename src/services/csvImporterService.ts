import { Expense, Bucket, SmartRule, ExtraIncome, MonthlySalaryOverride, RecurringRule } from '../types';
import * as XLSX from 'xlsx';
import { matchBankProfile, nonEmptyCount, normalizeCell, StatementColumnMap } from './bankProfiles';

/**
 * Valida que una expresión regular de usuario o respaldo sea segura contra ataques ReDoS
 * (rechaza cuantificadores anidados, retroreferencias y patrones excesivamente largos).
 */
export const isSafeRegexPattern = (pattern: string): boolean => {
  if (!pattern || typeof pattern !== 'string') return false;
  const trimmed = pattern.trim();
  if (trimmed.length === 0 || trimmed.length > 120) return false;
  // Rechazar cuantificadores anidados sobre grupos: ej. (a+)+, (.*)*, (a|aa)+ y retroreferencias \1
  if (/(\+|\*|\{[0-9,]+\})\s*\)\s*(\+|\*|\{[0-9,]+\}|\?)/.test(trimmed)) return false;
  if (/\\[1-9]/.test(trimmed)) return false;
  try {
    new RegExp(trimmed, 'i');
    return true;
  } catch {
    return false;
  }
};

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
  matchedRecurringRuleId?: string;
  matchedRecurringRuleTitle?: string;
  isInvoice?: boolean;
  selected: boolean;
  incomeCategoryMode?: 'salary' | 'extra'; // 'salary' para Nómina Mensual blindada, 'extra' para Ingreso Extra
  targetSalaryMonth?: string; // 'YYYY-MM' mes al que imputa el salario (regla >= 20 -> mes siguiente)
  targetExtraMonth?: string; // 'YYYY-MM' mes al que imputa el ingreso extra (por defecto mes actual de la tx)
  targetExpenseMonth?: string; // 'YYYY-MM' mes efectivo de imputación a bolsa para gastos
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

/** Resumen de cómo se ha leído un extracto, para informar al usuario en la previsualización. */
export interface StatementParseReport {
  /** 'bankinter' si el fichero coincide con el perfil verificado, 'generic' en otro caso. */
  profileId: string;
  profileName: string;
  /** Fila (0-based, sin contar líneas vacías en CSV) de la cabecera usada. -1 si no se encontró. */
  headerRowIndex: number;
  /** Filas no vacías anteriores a la cabecera (título, IBAN, filtros…), sin contar pendientes. */
  skippedPreambleRows: number;
  /** Movimientos pendientes (aún no imputados) que se han omitido. */
  skippedPendingRows: number;
  /** Filas tras la cabecera descartadas por no ser movimientos (sin fecha, importe 0, totales…). */
  skippedInvalidRows: number;
}

export interface StatementParseResult {
  transactions: RawBankTransaction[];
  report: StatementParseReport;
}

export class CsvImporterService {
  /**
   * Detecta el delimitador del CSV (;, , o tabulador).
   * Para cada candidato calcula el número de separadores por línea (fuera de comillas) y se queda
   * con el recuento más repetido. Gana el delimitador cuyo recuento modal aparece en más líneas, de modo
   * que un preámbulo bancario (titular, IBAN, saldo) es ruido minoritario y no invalida la detección.
   * En empate se prioriza ';' (exportaciones bancarias españolas), luego ',' y luego tabulador.
   */
  static detectDelimiter(sampleLines: string[]): string {
    const lines = sampleLines.filter((line) => line.trim().length > 0).slice(0, 200);
    const delimiters = [';', ',', '\t'];
    let bestDelimiter = ';';
    let bestScore = 0;

    for (const delim of delimiters) {
      const frequency = new Map<number, number>();
      for (const line of lines) {
        const count = this.countDelimiter(line, delim);
        if (count > 0) frequency.set(count, (frequency.get(count) || 0) + 1);
      }
      let score = 0;
      frequency.forEach((lineCount) => {
        if (lineCount > score) score = lineCount;
      });
      if (score > bestScore) {
        bestScore = score;
        bestDelimiter = delim;
      }
    }

    return bestDelimiter;
  }

  /** Cuenta las apariciones de un delimitador fuera de comillas dobles. */
  private static countDelimiter(line: string, delimiter: string): number {
    let count = 0;
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') i++;
        else inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        count++;
      }
    }
    return count;
  }

  /**
   * Tokeniza una línea CSV respetando comillas dobles y comillas escapadas ("").
   * El apóstrofo no actúa como comilla, para no romper comercios como "McDonald's".
   */
  static tokenizeLine(line: string, delimiter: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
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
   * Parsea fechas españolas o ISO comunes: DD/MM/YYYY, DD-MM-YYYY, DD/MM/YY y YYYY-MM-DD.
   * Devuelve null si el texto no es una fecha real (nunca sustituye por la fecha de hoy,
   * para que subtítulos, filtros o totales del extracto no se cuelen como movimientos).
   */
  static parseDate(dateStr: string): string | null {
    if (!dateStr) return null;
    const cleaned = dateStr.trim().replace(/^["']|["']$/g, '').split(/[ T]/)[0]; // Quitar horas si vienen incluidas

    let year: number;
    let month: number;
    let day: number;

    const dmyMatch = cleaned.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2}|\d{4})$/);
    const ymdMatch = cleaned.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
    if (dmyMatch) {
      day = parseInt(dmyMatch[1], 10);
      month = parseInt(dmyMatch[2], 10);
      year = parseInt(dmyMatch[3].length === 2 ? `20${dmyMatch[3]}` : dmyMatch[3], 10);
    } else if (ymdMatch) {
      year = parseInt(ymdMatch[1], 10);
      month = parseInt(ymdMatch[2], 10);
      day = parseInt(ymdMatch[3], 10);
    } else {
      return null;
    }

    const daysInMonth = new Date(year, month, 0).getDate();
    if (month < 1 || month > 12 || day < 1 || day > daysInMonth) return null;

    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
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
   * Parsea un libro de Excel (.xlsx / .xls) a partir de su primera hoja.
   * Lee importes y saldos como número de la celda (raw) para evitar la ambigüedad
   * entre separadores de miles y decimales del texto formateado ("1,234" vs "1.234").
   */
  static parseExcel(data: ArrayBuffer): StatementParseResult {
    try {
      const wb = XLSX.read(data, { type: 'array', cellDates: true });
      if (!wb.SheetNames || wb.SheetNames.length === 0) return this.emptyResult();
      const firstSheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(firstSheet, {
        header: 1,
        raw: true,
        defval: '',
      }) as unknown[][];

      const matrix: string[][] = rows.map((r) => r.map((cell) => this.cellToString(cell)));
      return this.parseMatrix(matrix);
    } catch (e) {
      console.error('[CsvImporterService] Error al parsear archivo Excel:', e);
      return this.emptyResult();
    }
  }

  /**
   * Convierte una celda cruda de SheetJS a texto normalizado.
   * Las fechas de Excel se desplazan 12 h antes de leer sus componentes locales para que
   * los desfases de zona horaria de la conversión de SheetJS nunca cambien el día.
   */
  private static cellToString(cell: unknown): string {
    if (cell === null || cell === undefined) return '';
    if (cell instanceof Date) {
      if (isNaN(cell.getTime())) return '';
      const d = new Date(cell.getTime() + 12 * 60 * 60 * 1000);
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${d.getFullYear()}-${mm}-${dd}`;
    }
    if (typeof cell === 'number') return Number.isFinite(cell) ? String(cell) : '';
    return String(cell).trim();
  }

  /**
   * Parsea el contenido CSV/TSV y extrae las transacciones bancarias
   */
  static parseCsv(fileContent: string): StatementParseResult {
    if (!fileContent || !fileContent.trim()) return this.emptyResult();

    const rawLines = fileContent
      .replace(/^\uFEFF/, '')
      .split(/\r?\n/)
      .filter((l) => l.trim().length > 0);
    if (rawLines.length === 0) return this.emptyResult();

    const delimiter = this.detectDelimiter(rawLines);
    const matrix: string[][] = rawLines.map((line) => this.tokenizeLine(line, delimiter));

    return this.parseMatrix(matrix);
  }

  /** Títulos de sección cuyos movimientos aún no están imputados y nunca se importan. */
  private static readonly PENDING_SECTION = /pendiente|retenid|no consolidad|en curso|autorizacion/;

  /** Conceptos de pie de extracto (saldos y totales) que no son movimientos. */
  private static readonly FOOTER_CONCEPT =
    /^(saldo (final|inicial|anterior|actual|disponible)|total|suma|fin de extracto)/;

  private static emptyResult(): StatementParseResult {
    return {
      transactions: [],
      report: {
        profileId: 'generic',
        profileName: 'Genérico',
        headerRowIndex: -1,
        skippedPreambleRows: 0,
        skippedPendingRows: 0,
        skippedInvalidRows: 0,
      },
    };
  }

  /**
   * Parsea una matriz de filas de un extracto bancario.
   * 1. Si el fichero coincide con un perfil conocido (Bankinter), usa su mapeo exacto.
   * 2. Si no, busca una cabecera genérica validada por las filas que la siguen,
   *    saltando preámbulos y bloques de movimientos pendientes.
   * Solo se devuelven filas con fecha válida e importe distinto de cero.
   */
  static parseMatrix(rawRows: string[][]): StatementParseResult {
    if (!rawRows || rawRows.length === 0) return this.emptyResult();

    let profileId = 'generic';
    let profileName = 'Genérico';
    let headerRowIndex = -1;
    let pendingRows = 0;
    let columns: StatementColumnMap = {
      date: 0,
      valueDate: -1,
      concept: 1,
      amount: 2,
      debit: -1,
      credit: -1,
      balance: -1,
      currency: -1,
    };

    const profileMatch = matchBankProfile(rawRows);
    if (profileMatch) {
      profileId = profileMatch.profileId;
      profileName = profileMatch.profileName;
      headerRowIndex = profileMatch.headerRowIndex;
      pendingRows = profileMatch.pendingRows;
      columns = profileMatch.columns;
    } else {
      const generic = this.findGenericHeader(rawRows);
      if (generic) {
        headerRowIndex = generic.headerRowIndex;
        pendingRows = generic.pendingRows;
        columns = generic.columns;
      }
      // Sin cabecera reconocible: se mantiene la heurística por posición (fecha | concepto | importe)
      // y la validación estricta de filas descarta todo lo que no sea un movimiento.
    }

    const { transactions, skippedInvalidRows } = this.extractRows(rawRows, headerRowIndex, columns);
    const nonEmptyBefore = rawRows
      .slice(0, Math.max(0, headerRowIndex))
      .filter((r) => nonEmptyCount(r) > 0).length;

    return {
      transactions,
      report: {
        profileId,
        profileName,
        headerRowIndex,
        skippedPreambleRows: Math.max(0, nonEmptyBefore - pendingRows),
        skippedPendingRows: pendingRows,
        skippedInvalidRows,
      },
    };
  }

  /**
   * Identifica las columnas de una fila candidata a cabecera.
   * Solo cuenta celdas cortas que no son datos (ni fechas ni números), de modo que líneas del
   * preámbulo como "Movimientos desde fecha 01/09/2026" no se confunden con una cabecera.
   */
  private static detectHeaderColumns(row: string[]): StatementColumnMap | null {
    const cols = (row || []).map(normalizeCell);
    const isLabel = (c: string) =>
      c.length > 0 && c.length <= 30 && this.parseDate(c) === null && !/^[-+]?[\d.,\s€]+$/.test(c);

    const findIncludes = (keywords: string[], exclude = -1) =>
      cols.findIndex((c, idx) => idx !== exclude && isLabel(c) && keywords.some((k) => c.includes(k)));
    const findPrefix = (keywords: string[]) =>
      cols.findIndex((c) => isLabel(c) && keywords.some((k) => c === k || c.startsWith(k)));

    const valueDate = findIncludes(['fecha valor', 'f.valor', 'f. valor', 'value date']);
    const date = findIncludes(
      ['fecha contable', 'f.contable', 'f. contable', 'fecha operacion', 'f.operacion', 'f. operacion', 'fecha', 'date'],
      valueDate
    );
    const concept = findIncludes([
      'descripcion', 'concepto', 'movimiento', 'detalle', 'beneficiario', 'description', 'asunto', 'texto',
    ]);
    const amount = findPrefix(['importe', 'cantidad', 'monto', 'amount']);
    const balance = findPrefix(['saldo', 'balance']);
    const currency = findPrefix(['divisa', 'moneda', 'currency']);
    const debit = findPrefix(['debe', 'cargo', 'gastos', 'salidas', 'debit']);
    const credit = findPrefix(['haber', 'abono', 'ingresos', 'entradas', 'credit']);

    const hasDate = date !== -1 || valueDate !== -1;
    const hasAmount = amount !== -1 || debit !== -1 || credit !== -1;
    if (!hasDate || !hasAmount) return null;

    return { date, valueDate, concept, amount, debit, credit, balance, currency };
  }

  /**
   * Busca la cabecera genérica del bloque de movimientos consolidados.
   * Una cabecera solo se acepta si las filas siguientes son movimientos reales;
   * los bloques titulados como pendientes/retenidos se cuentan y se saltan.
   */
  private static findGenericHeader(
    rows: string[][]
  ): { headerRowIndex: number; columns: StatementColumnMap; pendingRows: number } | null {
    const maxScan = Math.min(rows.length, 150);
    let pendingRows = 0;
    let sectionTitle = '';

    for (let i = 0; i < maxScan; i++) {
      const row = rows[i] || [];
      const filled = nonEmptyCount(row);
      if (filled === 0) continue;
      if (filled === 1) {
        sectionTitle = normalizeCell(row.find((c) => c && c.trim()) || '');
        continue;
      }

      const columns = this.detectHeaderColumns(row);
      if (!columns) continue;

      // Validar con las filas de datos que siguen a la cabecera
      const blockRows: string[][] = [];
      for (let j = i + 1; j < rows.length; j++) {
        const next = rows[j] || [];
        const nextFilled = nonEmptyCount(next);
        if (nextFilled === 0) continue;
        if (nextFilled === 1 || this.detectHeaderColumns(next)) break;
        blockRows.push(next);
      }
      const sample = blockRows.slice(0, 3);
      const validSample = sample.filter((r) => this.readDataRow(r, columns) !== null).length;
      if (validSample === 0 || (sample.length >= 2 && validSample < 2)) continue;

      if (this.PENDING_SECTION.test(sectionTitle)) {
        pendingRows += blockRows.filter((r) => this.readDataRow(r, columns) !== null).length;
        sectionTitle = '';
        continue;
      }

      return { headerRowIndex: i, columns, pendingRows };
    }
    return null;
  }

  /**
   * Lee una fila de datos con el mapeo de columnas indicado.
   * Devuelve null si no es un movimiento: sin fecha válida, importe cero o pie de extracto.
   */
  private static readDataRow(
    cols: string[],
    columns: StatementColumnMap
  ): { rawDate: string; parsedDate: string; rawConcept: string; rawAmount: number; balance?: number; currency?: string } | null {
    const primaryDateCol = columns.valueDate !== -1 ? columns.valueDate : columns.date;
    let rawDate = primaryDateCol !== -1 ? cols[primaryDateCol] || '' : '';
    let parsedDate = this.parseDate(rawDate);
    if (!parsedDate && columns.date !== -1 && columns.date !== primaryDateCol) {
      rawDate = cols[columns.date] || '';
      parsedDate = this.parseDate(rawDate);
    }
    if (!parsedDate) return null;

    const conceptCol = columns.concept !== -1 ? columns.concept : primaryDateCol === 0 ? 1 : 0;
    const rawConcept = (cols[conceptCol] || '').trim();

    let rawAmount = 0;
    const amountCell = columns.amount !== -1 ? (cols[columns.amount] || '').trim() : '';
    if (amountCell !== '') {
      rawAmount = this.parseAmount(amountCell);
    } else if (columns.debit !== -1 || columns.credit !== -1) {
      const debit = columns.debit !== -1 ? Math.abs(this.parseAmount(cols[columns.debit] || '')) : 0;
      const credit = columns.credit !== -1 ? Math.abs(this.parseAmount(cols[columns.credit] || '')) : 0;
      rawAmount = debit > 0 ? -debit : credit;
    } else if (columns.amount === -1) {
      // Sin columna de importe identificada: primera columna numérica que no sea fecha, concepto ni saldo
      for (let c = 0; c < cols.length; c++) {
        if (c === primaryDateCol || c === columns.date || c === conceptCol || c === columns.balance) continue;
        const val = this.parseAmount(cols[c] || '');
        if (val !== 0) {
          rawAmount = val;
          break;
        }
      }
    }
    if (rawAmount === 0) return null;
    if (this.FOOTER_CONCEPT.test(normalizeCell(rawConcept))) return null;

    const balanceCell = columns.balance !== -1 ? (cols[columns.balance] || '').trim() : '';
    const currencyCell = columns.currency !== -1 ? (cols[columns.currency] || '').trim() : '';
    return {
      rawDate,
      parsedDate,
      rawConcept,
      rawAmount,
      balance: balanceCell !== '' ? this.parseAmount(balanceCell) : undefined,
      currency: currencyCell || undefined,
    };
  }

  /** Extrae los movimientos que siguen a la cabecera hasta el final o hasta una sección de pendientes. */
  private static extractRows(
    rows: string[][],
    headerRowIndex: number,
    columns: StatementColumnMap
  ): { transactions: RawBankTransaction[]; skippedInvalidRows: number } {
    const transactions: RawBankTransaction[] = [];
    let skippedInvalidRows = 0;
    const batchStamp = Date.now();

    for (let r = headerRowIndex + 1; r < rows.length; r++) {
      const cols = rows[r] || [];
      const filled = nonEmptyCount(cols);
      if (filled === 0) continue;

      if (filled === 1) {
        const title = normalizeCell(cols.find((c) => c && c.trim()) || '');
        if (this.PENDING_SECTION.test(title)) break;
        skippedInvalidRows++;
        continue;
      }

      const row = this.readDataRow(cols, columns);
      if (!row) {
        skippedInvalidRows++;
        continue;
      }

      const cleanConcept =
        row.rawConcept.replace(/\s+/g, ' ').replace(/^["']|["']$/g, '').trim() || 'Movimiento bancario';

      transactions.push({
        id: `raw_tx_${batchStamp}_${r}`,
        rawDate: row.rawDate,
        rawConcept: row.rawConcept || cleanConcept,
        rawAmount: row.rawAmount,
        parsedDate: row.parsedDate,
        cleanConcept,
        // Importe siempre absoluto en CronoCash; el signo se conserva en rawAmount e isIncome
        amount: Math.round(Math.abs(row.rawAmount) * 100) / 100,
        isIncome: row.rawAmount > 0,
        rawHash: '',
        balance: row.balance,
        currency: row.currency,
      });
    }

    return { transactions, skippedInvalidRows };
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
    existingSalaries: Record<string, MonthlySalaryOverride> = {},
    recurringRules: RecurringRule[] = []
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

      // Evaluación del motor de reglas inteligentes
      let suggestedBucketId = fallbackBucketId;
      let matchedRuleId: string | undefined;
      let matchedRulePattern: string | undefined;
      let matchedRecurringRuleId: string | undefined;
      let matchedRecurringRuleTitle: string | undefined;
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
              if (isSafeRegexPattern(rule.pattern)) {
                isMatch = new RegExp(rule.pattern, 'i').test(row.cleanConcept.slice(0, 256));
              }
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
          suggestedBucketId = validBucketIds.has(rule.bucketId) ? rule.bucketId : fallbackBucketId;
          matchedRuleId = rule.id;
          matchedRulePattern = rule.pattern;
          isInvoice = Boolean(rule.isInvoice);
          break;
        }
      }

      // Evaluación heurística de coincidencia con Reglas Recurrentes (solo gastos)
      if (!row.isIncome && recurringRules.length > 0) {
        const rowDateStr = row.parsedDate || '';
        const rowMonth = rowDateStr.substring(0, 7);

        for (const rRule of recurringRules) {
          if (rRule.isActive === false || rRule.costType === 'none' || rRule.amount <= 0) continue;

          // Coincidencia exacta de importe (±0.01 €)
          const isSameAmount = Math.abs(rRule.amount - row.amount) < 0.01;
          const isTitleInConcept =
            rRule.title &&
            (upperConcept.includes(rRule.title.toUpperCase()) ||
              rRule.title.toUpperCase().includes(upperConcept.substring(0, 8)));

          if (isSameAmount && (rowMonth || isTitleInConcept)) {
            matchedRecurringRuleId = rRule.id;
            matchedRecurringRuleTitle = rRule.title;
            // Pre-asignar la bolsa de la regla recurrente si no fue fijada por regla inteligente
            if (!matchedRuleId && validBucketIds.has(rRule.bucketId)) {
              suggestedBucketId = rRule.bucketId;
            }
            break;
          }
        }
      }

      if (matchedRuleId || matchedRecurringRuleId) {
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
        matchedRecurringRuleId,
        matchedRecurringRuleTitle,
        isInvoice,
        selected: !isDuplicate,
        incomeCategoryMode,
        targetSalaryMonth,
        targetExtraMonth,
        targetExpenseMonth: txMonth,
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
