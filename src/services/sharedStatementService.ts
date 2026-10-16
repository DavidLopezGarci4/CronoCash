import { Capacitor, registerPlugin, PluginListenerHandle } from '@capacitor/core';

/**
 * "Compartir a CronoCash": recibe en memoria el extracto que el usuario comparte desde la app o la
 * web de su banco (Android ACTION_SEND / ACTION_VIEW) y lo entrega al importador bancario.
 * El fichero nunca se escribe en disco ni sale del teléfono.
 */

interface SharedStatementPayload {
  available: boolean;
  fileName?: string;
  mimeType?: string;
  base64?: string;
  error?: 'too_large' | 'read_failed';
}

interface SharedStatementPlugin {
  consume(): Promise<SharedStatementPayload>;
  addListener(event: 'sharedStatementAvailable', callback: () => void): Promise<PluginListenerHandle>;
}

const SharedStatement = registerPlugin<SharedStatementPlugin>('SharedStatement');

export type StatementKind = 'xlsx' | 'xls' | 'csv';

/** Límite de tamaño aplicado también en el lado nativo antes de leer el fichero. */
export const MAX_SHARED_STATEMENT_BYTES = 10 * 1024 * 1024;

const CSV_MIME_TYPES = ['text/csv', 'text/comma-separated-values', 'application/csv'];

const hasPrefix = (head: Uint8Array, signature: number[]) =>
  head.length >= signature.length && signature.every((b, i) => head[i] === b);

/** Texto plano: sin bytes NUL en el primer bloque. */
const looksLikeText = (head: Uint8Array) => !head.subarray(0, 512).includes(0);

const extensionOf = (fileName: string) => {
  const match = /\.([a-z0-9]+)$/i.exec(fileName || '');
  return match ? match[1].toLowerCase() : '';
};

/**
 * Determina el tipo real del extracto compartido. La firma binaria manda sobre el nombre y el MIME,
 * porque muchas apps comparten como "application/octet-stream" o sin extensión.
 * Devuelve null si no es un extracto que el importador sepa leer.
 */
export function detectStatementKind(fileName: string, mimeType: string, head: Uint8Array): StatementKind | null {
  if (hasPrefix(head, [0x50, 0x4b, 0x03, 0x04])) return 'xlsx';
  if (hasPrefix(head, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) return 'xls';

  const ext = extensionOf(fileName);
  const declaredCsv = ext === 'csv' || ext === 'tsv' || CSV_MIME_TYPES.includes((mimeType || '').toLowerCase());
  if (declaredCsv && looksLikeText(head)) return 'csv';

  return null;
}

/**
 * Nombre seguro para el File en memoria: sin rutas y con la extensión que el importador
 * usa para elegir entre lector Excel y lector CSV.
 */
export function sharedStatementFileName(fileName: string, kind: StatementKind): string {
  const base = (fileName || '').split(/[\\/]/).pop()?.trim() || '';
  if (!base) return `extracto-compartido.${kind}`;
  const ext = extensionOf(base);
  if (ext === kind || (kind === 'csv' && ext === 'tsv')) return base;
  return `${base}.${kind}`;
}

export function base64ToBytes(base64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(base64);
  const out = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

export type SharedStatementResult = { file: File } | { error: string } | null;

const MIME_BY_KIND: Record<StatementKind, string> = {
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xls: 'application/vnd.ms-excel',
  csv: 'text/csv',
};

export const SharedStatementService = {
  /**
   * Recoge (y vacía) el extracto compartido pendiente en el lado nativo.
   * null si no hay ninguno o si no se ejecuta en Android.
   */
  async consume(): Promise<SharedStatementResult> {
    if (!Capacitor.isNativePlatform()) return null;
    try {
      const payload = await SharedStatement.consume();
      if (!payload.available) return null;

      if (payload.error === 'too_large') {
        return { error: 'El archivo compartido supera los 10 MB y no se ha abierto.' };
      }
      if (payload.error || !payload.base64) {
        return { error: 'No se ha podido leer el archivo compartido. Prueba a compartirlo de nuevo.' };
      }

      const data = base64ToBytes(payload.base64);
      const kind = detectStatementKind(payload.fileName || '', payload.mimeType || '', data);
      if (!kind) {
        return { error: 'El archivo compartido no es un extracto Excel (.xlsx, .xls) ni CSV.' };
      }

      const name = sharedStatementFileName(payload.fileName || '', kind);
      return { file: new File([data], name, { type: MIME_BY_KIND[kind] }) };
    } catch (err) {
      console.warn('[SharedStatement] No disponible:', err);
      return null;
    }
  },

  /** Avisa cuando llega un extracto compartido con la app ya abierta. Devuelve la función de baja. */
  async onAvailable(callback: () => void): Promise<() => void> {
    if (!Capacitor.isNativePlatform()) return () => undefined;
    try {
      const handle = await SharedStatement.addListener('sharedStatementAvailable', callback);
      return () => {
        handle.remove();
      };
    } catch {
      return () => undefined;
    }
  },
};
