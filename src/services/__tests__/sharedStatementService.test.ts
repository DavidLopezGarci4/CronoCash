import { describe, it, expect } from 'vitest';
import {
  detectStatementKind,
  sharedStatementFileName,
  base64ToBytes,
} from '../sharedStatementService';

const bytes = (...b: number[]) => new Uint8Array(b);
const ZIP_HEAD = bytes(0x50, 0x4b, 0x03, 0x04, 0x14, 0x00);
const OLE_HEAD = bytes(0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1);
const CSV_HEAD = new TextEncoder().encode('Fecha;Concepto;Importe\n16/10/2026;DEMO;-1,93');

describe('detectStatementKind', () => {
  it('reconoce .xlsx por su firma ZIP aunque llegue sin extensión ni tipo MIME útil', () => {
    expect(detectStatementKind('document', 'application/octet-stream', ZIP_HEAD)).toBe('xlsx');
  });

  it('reconoce .xls por su firma OLE', () => {
    expect(detectStatementKind('movimientos.xls', 'application/vnd.ms-excel', OLE_HEAD)).toBe('xls');
  });

  it('acepta CSV de texto por extensión o tipo MIME', () => {
    expect(detectStatementKind('extracto.csv', 'application/octet-stream', CSV_HEAD)).toBe('csv');
    expect(detectStatementKind('export', 'text/csv', CSV_HEAD)).toBe('csv');
  });

  it('rechaza binarios que se hacen pasar por CSV y ficheros de otro tipo', () => {
    expect(detectStatementKind('extracto.csv', 'text/csv', bytes(0x00, 0x01, 0x02, 0x00))).toBeNull();
    expect(detectStatementKind('foto.jpg', 'image/jpeg', bytes(0xff, 0xd8, 0xff, 0xe0))).toBeNull();
    expect(detectStatementKind('notas.txt', 'text/plain', CSV_HEAD)).toBeNull();
  });
});

describe('sharedStatementFileName', () => {
  it('conserva el nombre si ya tiene la extensión correcta', () => {
    expect(sharedStatementFileName('Movimientos Bankinter.xlsx', 'xlsx')).toBe('Movimientos Bankinter.xlsx');
  });

  it('añade la extensión que espera el importador si falta o no coincide', () => {
    expect(sharedStatementFileName('document', 'xlsx')).toBe('document.xlsx');
    expect(sharedStatementFileName('', 'csv')).toBe('extracto-compartido.csv');
    expect(sharedStatementFileName('export.bin', 'xls')).toBe('export.bin.xls');
  });

  it('elimina rutas para que el nombre nunca contenga directorios', () => {
    expect(sharedStatementFileName('../../secret/extracto.xlsx', 'xlsx')).toBe('extracto.xlsx');
  });
});

describe('base64ToBytes', () => {
  it('decodifica el contenido enviado por el puente nativo', () => {
    expect(Array.from(base64ToBytes('UEsDBA=='))).toEqual([0x50, 0x4b, 0x03, 0x04]);
  });
});
