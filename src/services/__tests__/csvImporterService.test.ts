import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { CsvImporterService } from '../csvImporterService';

/**
 * Fixture sintético con la MISMA estructura que el extracto real exportado por Bankinter
 * (título con IBAN, bloque de movimientos pendientes, filtros de la consulta, cabecera
 * consolidada y relleno vacío). Todos los conceptos, importes e IBAN son inventados.
 */
const BLANK = ['', '', '', '', '', ''];
const bankinterRows: (string | number)[][] = [
  ['MOVIMIENTOS DE LA CUENTA ES00 0000 0000 0000 0000 0000', '', '', '', '', ''],
  BLANK,
  ['MOVIMIENTOS PENDIENTES -12,50 EUR', '', '', '', '', ''],
  BLANK,
  ['Fecha', 'Descripción', 'Importe', 'Divisa', '', ''],
  ['16/10/2026', 'Kiosko demo          15/10/26', -2.5, 'EUR', '', ''],
  ['15/10/2026', 'Cafeteria demo       15/10/26', -4, 'EUR', '', ''],
  ['14/10/2026', 'Super demo   14/10/26', -6, 'EUR', '', ''],
  BLANK,
  ['MOVIMIENTOS', '', '', '', '', ''],
  ['Concepto', '-', '', '', '', ''],
  ['Fecha', '18/07/2026 - 16/10/2026', '', '', '', ''],
  ['Tipo de movimiento', '-', '', '', '', ''],
  ['Importe', 'Desde 0,00 hasta -', '', '', '', ''],
  BLANK,
  ['Fecha contable', 'Fecha valor', 'Descripción', 'Importe', 'Saldo', 'Divisa'],
  ['16/10/2026', '16/10/2026', 'Farmacia demo', -1.93, 64.46, 'EUR'],
  ['15/10/2026', '14/10/2026', 'Nomina empresa demo', 1250, 66.39, 'EUR'],
  ['13/10/2026', '13/10/2026', 'Recibo luz demo', -1234.56, -1183.61, 'EUR'],
  ['12/10/2026', '12/10/2026', 'Bizum de prueba', 15, 51.05, 'EUR'],
  ['10/10/2026', '09/10/2026', 'Gasolinera demo', -40.1, 36.05, 'EUR'],
  ...Array.from({ length: 20 }, () => BLANK),
];

const toXlsxBuffer = (rows: (string | number)[][]): ArrayBuffer => {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Movimientos');
  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
};

describe('Extracto Bankinter (.xlsx)', () => {
  const result = CsvImporterService.parseExcel(toXlsxBuffer(bankinterRows));

  it('detecta el perfil Bankinter y localiza la cabecera consolidada', () => {
    expect(result.report.profileId).toBe('bankinter');
    expect(result.report.headerRowIndex).toBe(15);
  });

  it('importa solo los 5 movimientos consolidados, nunca los pendientes ni los filtros', () => {
    expect(result.transactions).toHaveLength(5);
    expect(result.report.skippedPendingRows).toBe(3);
    const concepts = result.transactions.map((t) => t.cleanConcept);
    expect(concepts).not.toContain('Kiosko demo 15/10/26');
    expect(concepts.some((c) => c === '-' || c.startsWith('18/07/2026'))).toBe(false);
  });

  it('usa la fecha valor, la descripción, el importe con signo y el saldo', () => {
    expect(
      result.transactions.map((t) => ({
        date: t.parsedDate,
        concept: t.cleanConcept,
        rawAmount: t.rawAmount,
        amount: t.amount,
        isIncome: t.isIncome,
        balance: t.balance,
        currency: t.currency,
      }))
    ).toEqual([
      { date: '2026-10-16', concept: 'Farmacia demo', rawAmount: -1.93, amount: 1.93, isIncome: false, balance: 64.46, currency: 'EUR' },
      { date: '2026-10-14', concept: 'Nomina empresa demo', rawAmount: 1250, amount: 1250, isIncome: true, balance: 66.39, currency: 'EUR' },
      { date: '2026-10-13', concept: 'Recibo luz demo', rawAmount: -1234.56, amount: 1234.56, isIncome: false, balance: -1183.61, currency: 'EUR' },
      { date: '2026-10-12', concept: 'Bizum de prueba', rawAmount: 15, amount: 15, isIncome: true, balance: 51.05, currency: 'EUR' },
      { date: '2026-10-09', concept: 'Gasolinera demo', rawAmount: -40.1, amount: 40.1, isIncome: false, balance: 36.05, currency: 'EUR' },
    ]);
  });
});

describe('Modo genérico (CSV de otros orígenes)', () => {
  it('ignora un preámbulo de texto y elige el separador ";"', () => {
    const csv = [
      'Titular: JUAN PRUEBA',
      'IBAN: ES00 0000 0000 0000 0000 0000',
      'Saldo disponible: 1.234,56 EUR',
      'Fecha contable;Fecha valor;Concepto;Importe;Saldo',
      '14/10/2026;14/10/2026;MERCADONA DEMO;-24,80;1.209,76',
      '13/10/2026;13/10/2026;BIZUM DE ANA;15,00;1.234,56',
      'Saldo final;;;;1.209,76',
    ].join('\n');

    const result = CsvImporterService.parseCsv(csv);
    expect(result.report.profileId).toBe('generic');
    expect(result.report.headerRowIndex).toBe(3);
    expect(result.transactions.map((t) => [t.parsedDate, t.cleanConcept, t.rawAmount])).toEqual([
      ['2026-10-14', 'MERCADONA DEMO', -24.8],
      ['2026-10-13', 'BIZUM DE ANA', 15],
    ]);
  });

  it('salta un bloque de pendientes y lee columnas Debe/Haber', () => {
    const csv = [
      'Titular;JUAN PRUEBA',
      'Periodo;01/09/2026;30/09/2026',
      'Movimientos pendientes',
      'Fecha;Concepto;Importe',
      '30/09/2026;COMPRA PENDIENTE DEMO;-9,99',
      'Movimientos',
      'Fecha;Concepto;Debe;Haber;Saldo',
      '29/09/2026;RECIBO GAS DEMO;45,20;;500,00',
      '28/09/2026;TRANSFERENCIA RECIBIDA;;100,00;545,20',
      'Total cargos;;45,20;;',
    ].join('\n');

    const result = CsvImporterService.parseCsv(csv);
    expect(result.report.skippedPendingRows).toBe(1);
    expect(result.transactions.map((t) => [t.cleanConcept, t.rawAmount, t.isIncome])).toEqual([
      ['RECIBO GAS DEMO', -45.2, false],
      ['TRANSFERENCIA RECIBIDA', 100, true],
    ]);
  });

  it('descarta filas sin fecha válida en lugar de importarlas con la fecha de hoy', () => {
    const csv = [
      'Fecha;Concepto;Importe',
      '05/10/2026;CAFE DEMO;-1,50',
      'Comision;MANTENIMIENTO;-3,00',
      '04/10/2026;PAN DEMO;-0,90',
    ].join('\n');

    const result = CsvImporterService.parseCsv(csv);
    expect(result.transactions.map((t) => t.cleanConcept)).toEqual(['CAFE DEMO', 'PAN DEMO']);
    expect(result.report.skippedInvalidRows).toBe(1);
  });
});

describe('detectDelimiter', () => {
  const data = [
    'Fecha contable;Fecha valor;Concepto;Importe;Saldo',
    '14/10/2026;14/10/2026;MERCADONA DEMO;-24,80;1.209,76',
    '13/10/2026;13/10/2026;BIZUM DE ANA;15,00;1.234,56',
  ];

  it('no se deja engañar por un preámbulo de texto', () => {
    expect(CsvImporterService.detectDelimiter(['Titular: JUAN', 'IBAN: ES00', ...data])).toBe(';');
  });

  it('no se deja engañar por un preámbulo delimitado', () => {
    expect(CsvImporterService.detectDelimiter(['Titular;JUAN', 'Periodo;01/09/2026;30/09/2026', ...data])).toBe(';');
  });

  it('detecta CSV con comas y decimales entrecomillados', () => {
    expect(
      CsvImporterService.detectDelimiter([
        'Date,Description,Amount',
        '2026-10-14,"SHOP, DEMO","-24,80"',
        '2026-10-13,COFFEE,"-3,10"',
      ])
    ).toBe(',');
  });
});

describe('parseDate', () => {
  it('acepta dd/mm/aaaa, dd-mm-aa y aaaa-mm-dd', () => {
    expect(CsvImporterService.parseDate('16/10/2026')).toBe('2026-10-16');
    expect(CsvImporterService.parseDate('1-9-26')).toBe('2026-09-01');
    expect(CsvImporterService.parseDate('2026-10-16')).toBe('2026-10-16');
  });

  it('devuelve null con textos que no son fechas o fechas imposibles', () => {
    expect(CsvImporterService.parseDate('Concepto')).toBeNull();
    expect(CsvImporterService.parseDate('-')).toBeNull();
    expect(CsvImporterService.parseDate('31/13/2026')).toBeNull();
    expect(CsvImporterService.parseDate('')).toBeNull();
  });
});
