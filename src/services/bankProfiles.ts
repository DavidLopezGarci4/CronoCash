/**
 * Perfiles de extractos bancarios con formato conocido.
 *
 * Cada perfil reconoce un fichero concreto por su "huella" (título + cabecera exacta)
 * y devuelve el mapeo exacto de columnas del bloque de movimientos consolidados.
 * Los ficheros que no encajan con ningún perfil se procesan en modo genérico
 * dentro de CsvImporterService.parseMatrix.
 */

/** Índices de columna (0-based) del bloque a importar. -1 = columna inexistente. */
export interface StatementColumnMap {
  date: number;
  valueDate: number;
  concept: number;
  amount: number;
  debit: number;
  credit: number;
  balance: number;
  currency: number;
}

export interface BankProfileMatch {
  profileId: string;
  profileName: string;
  /** Fila (0-based) de la cabecera del bloque consolidado. */
  headerRowIndex: number;
  columns: StatementColumnMap;
  /** Movimientos del bloque de pendientes (no imputados) que se omiten. */
  pendingRows: number;
}

export interface BankStatementProfile {
  id: string;
  name: string;
  match(rows: string[][]): BankProfileMatch | null;
}

/** Normaliza una celda para comparar textos de cabecera: minúsculas, sin tildes ni espacios extra. */
export const normalizeCell = (value: string): string =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^["']|["']$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const DATE_CELL = /^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$|^\d{4}[/-]\d{1,2}[/-]\d{1,2}$/;

/** Número de celdas no vacías de una fila. */
export const nonEmptyCount = (row: string[]): number =>
  (row || []).reduce((n, c) => (c && c.trim() ? n + 1 : n), 0);

/**
 * Bankinter — verificado con un extracto real exportado desde la banca online (.xlsx):
 *   fila 0  : "MOVIMIENTOS DE LA CUENTA ES.."
 *   bloque  : "MOVIMIENTOS PENDIENTES <total> EUR" + tabla Fecha | Descripción | Importe | Divisa
 *   bloque  : "MOVIMIENTOS" + filtros de la consulta (Concepto, Fecha, Tipo de movimiento, Importe)
 *   cabecera: Fecha contable | Fecha valor | Descripción | Importe | Saldo | Divisa
 *   datos   : movimientos consolidados (importe y saldo numéricos)
 */
const BANKINTER_HEADER = ['fecha contable', 'fecha valor', 'descripcion', 'importe', 'saldo', 'divisa'];

export const bankinterProfile: BankStatementProfile = {
  id: 'bankinter',
  name: 'Bankinter',
  match(rows) {
    const scan = Math.min(rows.length, 60);

    const titleRow = rows
      .slice(0, scan)
      .find((r) => nonEmptyCount(r) > 0);
    const title = titleRow ? normalizeCell(titleRow.find((c) => c && c.trim()) || '') : '';
    if (!title.startsWith('movimientos de la cuenta')) return null;

    let headerRowIndex = -1;
    let cols: number[] = [];
    for (let i = 0; i < scan; i++) {
      const norm = (rows[i] || []).map(normalizeCell);
      const idx = BANKINTER_HEADER.map((h) => norm.indexOf(h));
      if (idx.every((x) => x !== -1)) {
        headerRowIndex = i;
        cols = idx;
        break;
      }
    }
    if (headerRowIndex === -1) return null;

    // Contar los movimientos del bloque de pendientes (filas con fecha bajo "MOVIMIENTOS PENDIENTES")
    let pendingRows = 0;
    let inPending = false;
    for (let i = 0; i < headerRowIndex; i++) {
      const first = normalizeCell((rows[i] || [])[0] || '');
      if (first.startsWith('movimientos pendientes')) {
        inPending = true;
        continue;
      }
      if (inPending && nonEmptyCount(rows[i]) === 1 && first.startsWith('movimientos')) {
        inPending = false;
        continue;
      }
      if (inPending && DATE_CELL.test(first)) pendingRows++;
    }

    const [fechaContable, fechaValor, descripcion, importe, saldo, divisa] = cols;
    return {
      profileId: this.id,
      profileName: this.name,
      headerRowIndex,
      pendingRows,
      columns: {
        date: fechaContable,
        valueDate: fechaValor,
        concept: descripcion,
        amount: importe,
        debit: -1,
        credit: -1,
        balance: saldo,
        currency: divisa,
      },
    };
  },
};

export const BANK_STATEMENT_PROFILES: BankStatementProfile[] = [bankinterProfile];

export const matchBankProfile = (rows: string[][]): BankProfileMatch | null => {
  for (const profile of BANK_STATEMENT_PROFILES) {
    const match = profile.match(rows);
    if (match) return match;
  }
  return null;
};
