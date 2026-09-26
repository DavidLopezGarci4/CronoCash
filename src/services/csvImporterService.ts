import { Expense, Bucket, SmartRule } from '../types';

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
}

export interface AnalyzedTransaction extends RawBankTransaction {
  isDuplicate: boolean;
  duplicateReason?: string;
  suggestedBucketId: string;
  matchedRuleId?: string;
  matchedRulePattern?: string;
  isInvoice?: boolean;
  selected: boolean;
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
   * Parsea el contenido CSV sin procesar y extrae las transacciones bancarias
   */
  static parseCsv(fileContent: string): RawBankTransaction[] {
    if (!fileContent || !fileContent.trim()) return [];

    const rawLines = fileContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (rawLines.length === 0) return [];

    const delimiter = this.detectDelimiter(rawLines.slice(0, 10));

    // Buscar la fila de cabecera bancaria (puede no ser la primera línea debido a metadatos de extractos)
    let headerRowIdx = -1;
    let dateCol = -1;
    let conceptCol = -1;
    let amountCol = -1;
    let debeCol = -1;
    let haberCol = -1;

    const dateKeywords = ['fecha', 'f.valor', 'f.operacion', 'f.valoracion', 'date', 'f. valor', 'f. operacion'];
    const conceptKeywords = ['concepto', 'descripcion', 'movimiento', 'detalle', 'beneficiario', 'description', 'asunto'];
    const amountKeywords = ['importe', 'cantidad', 'monto', 'amount', 'total'];
    const debeKeywords = ['debe', 'cargo', 'gastos', 'salidas', 'debit'];
    const haberKeywords = ['haber', 'abono', 'ingresos', 'entradas', 'credit'];

    for (let i = 0; i < Math.min(rawLines.length, 15); i++) {
      const cols = this.tokenizeLine(rawLines[i], delimiter).map((c) =>
        c.toLowerCase().trim().replace(/^["']|["']$/g, '')
      );

      const dIdx = cols.findIndex((c) => dateKeywords.some((k) => c.includes(k)));
      const cIdx = cols.findIndex((c) => conceptKeywords.some((k) => c.includes(k)));
      const aIdx = cols.findIndex((c) => amountKeywords.some((k) => c === k || c.startsWith(k)));
      const debIdx = cols.findIndex((c) => debeKeywords.some((k) => c === k || c.startsWith(k)));
      const habIdx = cols.findIndex((c) => haberKeywords.some((k) => c === k || c.startsWith(k)));

      if (dIdx !== -1 && (cIdx !== -1 || aIdx !== -1 || debIdx !== -1)) {
        headerRowIdx = i;
        dateCol = dIdx;
        conceptCol = cIdx !== -1 ? cIdx : (dIdx === 0 ? 1 : 0);
        amountCol = aIdx;
        debeCol = debIdx;
        haberCol = habIdx;
        break;
      }
    }

    // Si no se encontró cabecera explícita, usar heurística por posición
    if (headerRowIdx === -1) {
      headerRowIdx = 0;
      dateCol = 0;
      conceptCol = 1;
      amountCol = 2;
    }

    const transactions: RawBankTransaction[] = [];
    const rows = rawLines.slice(headerRowIdx + 1);

    for (let r = 0; r < rows.length; r++) {
      const cols = this.tokenizeLine(rows[r], delimiter);
      if (cols.length <= 1) continue;

      const rawDate = cols[dateCol] || '';
      const rawConcept = cols[conceptCol] || 'Movimiento bancario';
      let rawAmount = 0;
      let isIncome = false;

      if (amountCol !== -1 && cols[amountCol] !== undefined) {
        rawAmount = this.parseAmount(cols[amountCol]);
        if (rawAmount > 0 && debeCol === -1) {
          // Si el importe es positivo y no hay columna debe/haber,
          // puede ser ingreso o extracto de tarjeta donde todo es positivo
          isIncome = false;
        } else if (rawAmount < 0) {
          isIncome = false;
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
          if (c !== dateCol && c !== conceptCol) {
            const val = this.parseAmount(cols[c]);
            if (val !== 0) {
              rawAmount = val;
              break;
            }
          }
        }
      }

      if (rawAmount === 0 && !rawConcept) continue;

      const parsedDate = this.parseDate(rawDate);
      const cleanConcept = rawConcept
        .replace(/\s+/g, ' ')
        .replace(/^["']|["']$/g, '')
        .trim();

      // Convertir siempre a importe positivo para el modelo de gasto de CronoCash
      const expenseAmount = Math.abs(rawAmount);

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
      });
    }

    return transactions;
  }

  /**
   * Analiza un lote de transacciones aplicando deduplicación inteligente y motor de reglas
   */
  static async analyzeBatch(
    rows: RawBankTransaction[],
    existingExpenses: Expense[],
    rules: SmartRule[],
    buckets: Bucket[]
  ): Promise<BatchAnalysisResult> {
    const activeRules = [...rules]
      .filter((r) => r.isActive)
      .sort((a, b) => b.priority - a.priority);

    const validBucketIds = new Set(buckets.map((b) => b.id));
    const fallbackBucketId = buckets[0]?.id || 'bucket-super';

    // Crear mapa de gastos existentes por hash y por tupla (fecha + importe + concepto normalizado)
    const existingHashSet = new Set<string>();
    const existingTupleSet = new Set<string>();

    for (const exp of existingExpenses) {
      if (exp.rawHash) {
        existingHashSet.add(exp.rawHash);
      }
      const tupleKey = `${(exp.date || '').trim()}|${(exp.title || '').trim().toUpperCase()}|${(exp.amount || 0).toFixed(2)}`;
      existingTupleSet.add(tupleKey);
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

      const analyzed: AnalyzedTransaction = {
        ...row,
        rawHash: hash,
        isDuplicate,
        duplicateReason: isDuplicate ? 'Movimiento idéntico ya existente en historial' : undefined,
        suggestedBucketId,
        matchedRuleId,
        matchedRulePattern,
        isInvoice,
        selected: !isDuplicate,
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
