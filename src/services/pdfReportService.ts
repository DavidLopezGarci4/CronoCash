import { jsPDF } from 'jspdf';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Expense, Bucket, Settings, SavingsGoal, TaxReport } from '../types';
import { TaxService } from './taxService';
import { SinkingFundsService } from './sinkingFundsService';

export class PdfReportService {
  /**
   * Genera un identificador de verificación hash corto para auditoría del informe
   */
  private static generateChecksum(seed: string): string {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
    return `CC-${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
  }

  /**
   * Dibuja el pie de página institucional en todas las páginas del documento
   */
  private static addFooters(doc: jsPDF, checksum: string) {
    const pageCount = doc.getNumberOfPages();
    const nowStr = new Date().toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const pageHeight = doc.internal.pageSize.getHeight();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Línea divisoria tenue
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

      // Texto de pie de página
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184); // Slate 400

      doc.text(
        `CronoCash v1.12.0 • Sistema Financiero Local • Emisión: ${nowStr} • Verif: ${checksum}`,
        14,
        pageHeight - 7
      );

      doc.text(
        `Página ${i} de ${pageCount}`,
        pageWidth - 14,
        pageHeight - 7,
        { align: 'right' }
      );
    }
  }

  /**
   * Genera el Informe Ejecutivo Financiero Mensual en formato PDF A4 vertical
   */
  static async generateMonthlyReport(
    expenses: Expense[],
    buckets: Bucket[],
    settings: Settings,
    goals: SavingsGoal[],
    monthStr: string
  ): Promise<Blob> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const currency = settings.currency || '€';
    const monthExpenses = expenses.filter((e) => (e.date || '').startsWith(monthStr));

    // Cálculos de KPI
    const monthlyIncome = settings.monthlyIncome || 0;
    const totalExpenses = Math.round(
      monthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0) * 100
    ) / 100;
    const netBalance = Math.round((monthlyIncome - totalExpenses) * 100) / 100;
    const savingsRate = monthlyIncome > 0
      ? Math.max(0, Math.round(((monthlyIncome - totalExpenses) / monthlyIncome) * 1000) / 10)
      : 0;

    const [yearPart, monthPart] = monthStr.split('-');
    const yNum = parseInt(yearPart, 10);
    const mNum = parseInt(monthPart, 10);
    const dateObj = new Date(yNum, mNum - 1, 1);
    const monthName = dateObj.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
    const formattedMonthTitle = monthName.charAt(0).toUpperCase() + monthName.slice(1);

    const totalDaysInMonth = new Date(yNum, mNum, 0).getDate();
    const dailyAverage = totalDaysInMonth > 0 ? Math.round((totalExpenses / totalDaysInMonth) * 100) / 100 : 0;

    // Checksum
    const checksum = this.generateChecksum(`${monthStr}-${monthlyIncome}-${totalExpenses}-${expenses.length}`);

    // --- CABECERA PRINCIPAL (Dark Slate con acento Emerald) ---
    doc.setFillColor(15, 23, 42); // #0f172a
    doc.rect(0, 0, pageWidth, 38, 'F');

    // Acento esmeralda lateral
    doc.setFillColor(16, 185, 129); // #10b981
    doc.rect(0, 0, 6, 38, 'F');

    // Título Marca
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text('CRONOCASH', 14, 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(52, 211, 153); // Emerald 400
    doc.text('INFORME EJECUTIVO DE CONTROL Y DIRECCIÓN', 14, 21);

    // Titular y Periodo (derecha)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text(formattedMonthTitle, pageWidth - 14, 15, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225); // Slate 300
    const titular = settings.companyName || settings.userFullName || 'Titular Principal';
    const taxId = settings.taxId ? ` • NIF: ${settings.taxId}` : '';
    doc.text(`${titular}${taxId}`, pageWidth - 14, 21, { align: 'right' });
    doc.text(`Identificador de Auditoría: ${checksum}`, pageWidth - 14, 27, { align: 'right' });

    let currentY = 46;

    // --- BLOQUE DE KPIS PRINCIPALES (5 Tarjetas) ---
    const kpiCardWidth = (pageWidth - 28 - 12) / 4; // 4 columnas arriba
    const kpisRow1 = [
      { label: 'INGRESOS MES', value: `${monthlyIncome.toFixed(2)} ${currency}`, color: [16, 185, 129] },
      { label: 'GASTOS TOTALES', value: `${totalExpenses.toFixed(2)} ${currency}`, color: [239, 68, 68] },
      { label: 'BALANCE NETO', value: `${netBalance >= 0 ? '+' : ''}${netBalance.toFixed(2)} ${currency}`, color: netBalance >= 0 ? [16, 185, 129] : [239, 68, 68] },
      { label: 'TASA DE AHORRO', value: `${savingsRate.toFixed(1)}%`, color: [59, 130, 246] },
    ];

    kpisRow1.forEach((kpi, idx) => {
      const cardX = 14 + idx * (kpiCardWidth + 4);
      doc.setFillColor(248, 250, 252); // Slate 50
      doc.setDrawColor(226, 232, 240); // Slate 200
      doc.setLineWidth(0.3);
      doc.roundedRect(cardX, currentY, kpiCardWidth, 18, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139); // Slate 500
      doc.text(kpi.label, cardX + 3, currentY + 5.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
      doc.text(kpi.value, cardX + 3, currentY + 13.5);
    });

    currentY += 24;

    // Fila 2 de telemetría: Gasto Diario Medio y Facturas
    const invoicedSum = monthExpenses.filter(e => e.isInvoice).reduce((s, e) => s + e.amount, 0);
    const invoiceCount = monthExpenses.filter(e => e.isInvoice).length;
    
    doc.setFillColor(241, 245, 249); // Slate 100
    doc.roundedRect(14, currentY, pageWidth - 28, 8, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(
      `Asignación Diaria Media Consumida: ${dailyAverage.toFixed(2)} ${currency}/día  |  Días computados: ${totalDaysInMonth}  |  Facturas con desgravación oficial: ${invoiceCount} (${invoicedSum.toFixed(2)} ${currency})`,
      18,
      currentY + 5.5
    );

    currentY += 15;

    // --- SECCIÓN 1: DISTRIBUCIÓN POR BOLSAS (BUCKETS) ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text('1. EJECUCIÓN PRESUPUESTARIA POR BOLSAS DE GASTO', 14, currentY);

    currentY += 4;

    // Encabezado de la tabla de bolsas
    const colX = {
      name: 14,
      limit: 75,
      spent: 110,
      pct: 145,
      rem: 170,
    };

    doc.setFillColor(30, 41, 59);
    doc.rect(14, currentY, pageWidth - 28, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text('BOLSA DE GASTO', colX.name + 2, currentY + 4.2);
    doc.text('LÍMITE PRESUPUESTO', colX.limit, currentY + 4.2);
    doc.text('CONSUMIDO', colX.spent, currentY + 4.2);
    doc.text('% EJECUCIÓN', colX.pct, currentY + 4.2);
    doc.text('SALDO DISPONIBLE', colX.rem, currentY + 4.2);

    currentY += 6;

    buckets.forEach((bucket, bIdx) => {
      const bucketSpent = Math.round(
        monthExpenses.filter((e) => e.bucketId === bucket.id).reduce((s, e) => s + (e.amount || 0), 0) * 100
      ) / 100;
      const limit = bucket.budgetLimit || 0;
      const pct = limit > 0 ? Math.round((bucketSpent / limit) * 100) : (bucketSpent > 0 ? 100 : 0);
      const remaining = limit - bucketSpent;

      // Color de fondo alterno
      if (bIdx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, currentY, pageWidth - 28, 5.5, 'F');
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 41, 59);

      // Nombre de bolsa
      const bTitle = bucket.name.length > 32 ? bucket.name.substring(0, 30) + '...' : bucket.name;
      doc.text(bTitle, colX.name + 2, currentY + 3.8);
      doc.text(`${limit.toFixed(2)} ${currency}`, colX.limit, currentY + 3.8);
      doc.text(`${bucketSpent.toFixed(2)} ${currency}`, colX.spent, currentY + 3.8);

      // Porcentaje con color según sobregasto
      if (pct > 100) {
        doc.setTextColor(220, 38, 38);
        doc.setFont('helvetica', 'bold');
      } else if (pct > 85) {
        doc.setTextColor(217, 119, 6);
      } else {
        doc.setTextColor(16, 185, 129);
      }
      doc.text(`${pct}%`, colX.pct, currentY + 3.8);

      // Saldo restante
      doc.setFont('helvetica', 'bold');
      if (remaining < 0) {
        doc.setTextColor(220, 38, 38);
      } else {
        doc.setTextColor(15, 23, 42);
      }
      doc.text(`${remaining.toFixed(2)} ${currency}`, colX.rem, currentY + 3.8);

      currentY += 5.5;
    });

    currentY += 8;

    // --- SECCIÓN 2: METAS DE AHORRO Y SINKING FUNDS ---
    if (goals.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      doc.text('2. ESTADO DE METAS DE AHORRO & SINKING FUNDS', 14, currentY);

      currentY += 4;

      const goalColX = {
        name: 14,
        target: 75,
        current: 110,
        pct: 140,
        cruise: 165,
      };

      doc.setFillColor(79, 70, 229); // Indigo 600
      doc.rect(14, currentY, pageWidth - 28, 6, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);
      doc.text('OBJETIVO / META', goalColX.name + 2, currentY + 4.2);
      doc.text('OBJETIVO', goalColX.target, currentY + 4.2);
      doc.text('ACUMULADO', goalColX.current, currentY + 4.2);
      doc.text('% PROGRESO', goalColX.pct, currentY + 4.2);
      doc.text('RITMO CRUCERO/MES', goalColX.cruise, currentY + 4.2);

      currentY += 6;

      goals.slice(0, 5).forEach((goal, gIdx) => {
        const pace = SinkingFundsService.calculateCruisePace(goal, dateObj);
        const gPct = goal.targetAmount > 0
          ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
          : 0;

        if (gIdx % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(14, currentY, pageWidth - 28, 5.5, 'F');
        }

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(30, 41, 59);

        const gTitle = goal.title.length > 32 ? goal.title.substring(0, 30) + '...' : goal.title;
        doc.text(gTitle, goalColX.name + 2, currentY + 3.8);
        doc.text(`${goal.targetAmount.toFixed(2)} ${currency}`, goalColX.target, currentY + 3.8);
        doc.text(`${goal.currentAmount.toFixed(2)} ${currency}`, goalColX.current, currentY + 3.8);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(99, 102, 241); // Indigo
        doc.text(`${gPct}%`, goalColX.pct, currentY + 3.8);

        doc.setTextColor(30, 41, 59);
        doc.text(
          goal.isCompleted ? 'Completada' : `${pace.monthlyContribution.toFixed(2)} ${currency}/m`,
          goalColX.cruise,
          currentY + 3.8
        );

        currentY += 5.5;
      });

      currentY += 8;
    }

    // --- SECCIÓN 3: TOP 5 MAYORES GASTOS DEL PERIODO ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text('3. TOP 5 MAYORES DESEMBOLSOS DEL MES', 14, currentY);

    currentY += 4;

    const topExpenses = [...monthExpenses]
      .sort((a, b) => (b.amount || 0) - (a.amount || 0))
      .slice(0, 5);

    const topColX = {
      rank: 14,
      date: 24,
      title: 50,
      bucket: 120,
      amount: 170,
    };

    doc.setFillColor(51, 65, 85); // Slate 700
    doc.rect(14, currentY, pageWidth - 28, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text('#', topColX.rank + 2, currentY + 4.2);
    doc.text('FECHA', topColX.date, currentY + 4.2);
    doc.text('CONCEPTO / PROVEEDOR', topColX.title, currentY + 4.2);
    doc.text('BOLSA ASIGNADA', topColX.bucket, currentY + 4.2);
    doc.text('IMPORTE', topColX.amount, currentY + 4.2);

    currentY += 6;

    if (topExpenses.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('No se han registrado transacciones en este mes.', 18, currentY + 4);
      currentY += 6;
    } else {
      topExpenses.forEach((exp, idx) => {
        const bucketMatch = buckets.find((b) => b.id === exp.bucketId);
        const bName = bucketMatch ? bucketMatch.name : 'Sin asignar';

        if (idx % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(14, currentY, pageWidth - 28, 5.5, 'F');
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(`${idx + 1}`, topColX.rank + 2, currentY + 3.8);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(30, 41, 59);
        doc.text(exp.date || '', topColX.date, currentY + 3.8);

        const expLabel = `${exp.title}${exp.supplier ? ` (${exp.supplier})` : ''}`;
        doc.text(
          expLabel.length > 38 ? expLabel.substring(0, 36) + '...' : expLabel,
          topColX.title,
          currentY + 3.8
        );

        doc.text(
          bName.length > 25 ? bName.substring(0, 23) + '...' : bName,
          topColX.bucket,
          currentY + 3.8
        );

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(220, 38, 38);
        doc.text(`${exp.amount.toFixed(2)} ${currency}`, topColX.amount, currentY + 3.8);

        currentY += 5.5;
      });
    }

    // Pie de página institucional
    this.addFooters(doc, checksum);

    return doc.output('blob');
  }

  /**
   * Genera el Informe Fiscal Trimestral para Liquidación de Modelos 130 (IRPF) y 303 (IVA)
   */
  static async generateQuarterlyTaxReport(
    taxReport: TaxReport,
    settings: Settings
  ): Promise<Blob> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const currency = settings.currency || '€';
    const checksum = this.generateChecksum(
      `TAX-${taxReport.quarter}T-${taxReport.year}-${taxReport.grossIncome}-${taxReport.deductibleExpenses}`
    );

    // --- CABECERA FISCAL EJECUTIVA (Navy Dark con acento Azul Fiscal) ---
    doc.setFillColor(15, 23, 42); // Slate 900
    doc.rect(0, 0, pageWidth, 38, 'F');

    // Barra lateral de acento azul
    doc.setFillColor(37, 99, 235); // Blue 600
    doc.rect(0, 0, 6, 38, 'F');

    // Título Marca
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    doc.setTextColor(255, 255, 255);
    doc.text('CRONOCASH FISCAL SUITE', 14, 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(147, 197, 253); // Blue 300
    doc.text('CUADRO FISCAL TRIMESTRAL • MODELO 130 (IRPF) & MODELO 303 (IVA)', 14, 21);

    // Datos Trimestre (derecha)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text(`${taxReport.quarter}º TRIMESTRE ${taxReport.year}`, pageWidth - 14, 15, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    const titular = settings.companyName || settings.userFullName || 'Titular / Autónomo';
    const taxId = settings.taxId ? ` • NIF/CIF: ${settings.taxId}` : ' • NIF/CIF: No especificado';
    doc.text(`${titular}${taxId}`, pageWidth - 14, 21, { align: 'right' });
    doc.text(`Periodo: ${taxReport.startDate} a ${taxReport.endDate}`, pageWidth - 14, 27, { align: 'right' });

    let currentY = 44;

    // --- BANNER DE PLAZO OFICIAL AEAT ---
    const isOverdue = taxReport.isDeadlinePassed;
    if (isOverdue) {
      doc.setFillColor(254, 242, 242); // Red 50
      doc.setDrawColor(248, 113, 113); // Red 400
    } else {
      doc.setFillColor(240, 253, 244); // Green 50
      doc.setDrawColor(74, 222, 128); // Green 400
    }
    doc.setLineWidth(0.4);
    doc.roundedRect(14, currentY, pageWidth - 28, 11, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    if (isOverdue) {
      doc.setTextColor(185, 28, 28); // Red 700
      doc.text(
        `PLAZO OFICIAL VENCIDO EN LA AEAT: Fecha límite era el ${taxReport.deadlineDate}.`,
        18,
        currentY + 5
      );
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text(
        'Las declaraciones fuera de plazo pueden generar recargos según el art. 27 de la Ley General Tributaria.',
        18,
        currentY + 8.8
      );
    } else {
      doc.setTextColor(21, 128, 61); // Green 700
      doc.text(
        `PLAZO OFICIAL AEAT EN VIGOR: Fecha límite de presentación ${taxReport.deadlineDate}.`,
        18,
        currentY + 5
      );
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text(
        `Tiempo restante para liquidar sin recargo: ${taxReport.daysUntilDeadline} días naturales disponibles.`,
        18,
        currentY + 8.8
      );
    }

    currentY += 17;

    // --- MODELO 130 vs MODELO 303 (Dos Columnas Ejecutivas) ---
    const colWidth = (pageWidth - 28 - 6) / 2;

    // TARJETA MODELO 130 (IRPF)
    const card130X = 14;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.roundedRect(card130X, currentY, colWidth, 48, 2, 2, 'FD');

    // Header tarjeta Mod 130
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(card130X, currentY, colWidth, 7, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('MODELO 130 • IRPF ESTIMACIÓN DIRECTA', card130X + 4, currentY + 4.8);

    const m130Items = [
      { l: 'Ingresos Brutos del Trimestre:', v: `${taxReport.grossIncome.toFixed(2)} ${currency}` },
      { l: 'Gastos Deducibles Justificados:', v: `-${taxReport.deductibleExpenses.toFixed(2)} ${currency}` },
      { l: 'Rendimiento Neto Trimestral:', v: `${taxReport.netYield.toFixed(2)} ${currency}` },
      { l: 'Tipo Pago Fraccionado Oficial:', v: '20.0%' },
    ];

    let subY = currentY + 12;
    m130Items.forEach((item) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text(item.l, card130X + 4, subY);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(item.v, card130X + colWidth - 4, subY, { align: 'right' });
      subY += 5.5;
    });

    // Casilla final Mod 130
    doc.setFillColor(238, 242, 255); // Indigo 50
    doc.rect(card130X + 2, currentY + 36, colWidth - 4, 9, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(67, 56, 202);
    doc.text('Estimado a Ingresar Mod. 130:', card130X + 4, currentY + 41.5);
    doc.setFontSize(10.5);
    doc.text(`${taxReport.model130EstimatedTax.toFixed(2)} ${currency}`, card130X + colWidth - 4, currentY + 42, {
      align: 'right',
    });

    // TARJETA MODELO 303 (IVA)
    const card303X = 14 + colWidth + 6;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.roundedRect(card303X, currentY, colWidth, 48, 2, 2, 'FD');

    // Header tarjeta Mod 303
    doc.setFillColor(15, 118, 110); // Teal 700
    doc.roundedRect(card303X, currentY, colWidth, 7, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('MODELO 303 • AUTOLIQUIDACIÓN IVA', card303X + 4, currentY + 4.8);

    const m303Items = [
      { l: 'IVA Repercutido (Ingresos 21%):', v: `${taxReport.ivaRepercutido.toFixed(2)} ${currency}` },
      { l: 'IVA Soportado (Facturas Recibidas):', v: `-${taxReport.ivaSoportado.toFixed(2)} ${currency}` },
      { l: 'Nº Facturas Deducibles:', v: `${taxReport.invoiceCount} facturas` },
      { l: 'Gastos sin factura (no deducibles):', v: `${taxReport.nonDeductibleExpenses.toFixed(2)} ${currency}` },
    ];

    subY = currentY + 12;
    m303Items.forEach((item) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text(item.l, card303X + 4, subY);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(item.v, card303X + colWidth - 4, subY, { align: 'right' });
      subY += 5.5;
    });

    // Casilla final Mod 303
    const isToPay = taxReport.model303Result >= 0;
    if (isToPay) {
      doc.setFillColor(254, 242, 242);
    } else {
      doc.setFillColor(236, 253, 245);
    }
    doc.rect(card303X + 2, currentY + 36, colWidth - 4, 9, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    if (isToPay) {
      doc.setTextColor(185, 28, 28);
    } else {
      doc.setTextColor(21, 128, 61);
    }
    doc.text(isToPay ? 'Resultado IVA (A Ingresar):' : 'Resultado IVA (A Compensar):', card303X + 4, currentY + 41.5);
    doc.setFontSize(10.5);
    doc.text(
      `${Math.abs(taxReport.model303Result).toFixed(2)} ${currency}`,
      card303X + colWidth - 4,
      currentY + 42,
      { align: 'right' }
    );

    currentY += 54;

    // --- SECCIÓN: LIBRO REGISTRO DE FACTURAS RECIBIDAS ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('LIBRO REGISTRO OFICIAL DE FACTURAS RECIBIDAS (GASTOS DEDUCIBLES)', 14, currentY);

    currentY += 4;

    const invColX = {
      date: 14,
      invNum: 33,
      supplier: 58,
      concept: 98,
      base: 138,
      rate: 156,
      tax: 170,
      total: 186,
    };

    const drawTableHeader = (y: number) => {
      doc.setFillColor(30, 41, 59);
      doc.rect(14, y, pageWidth - 28, 6, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(255, 255, 255);
      doc.text('FECHA', invColX.date + 1, y + 4.2);
      doc.text('Nº FACTURA', invColX.invNum, y + 4.2);
      doc.text('PROVEEDOR', invColX.supplier, y + 4.2);
      doc.text('CONCEPTO', invColX.concept, y + 4.2);
      doc.text('BASE IMP.', invColX.base, y + 4.2);
      doc.text('IVA %', invColX.rate, y + 4.2);
      doc.text('CUOTA', invColX.tax, y + 4.2);
      doc.text('TOTAL', invColX.total, y + 4.2);
    };

    drawTableHeader(currentY);
    currentY += 6;

    if (taxReport.invoices.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('No hay facturas con casilla de deducción oficial registradas en este trimestre.', 18, currentY + 5);
      currentY += 8;
    } else {
      taxReport.invoices.forEach((inv, index) => {
        // Paginación si excede el límite
        if (currentY > 265) {
          doc.addPage();
          currentY = 20;
          drawTableHeader(currentY);
          currentY += 6;
        }

        const { baseAmount, taxRate, taxAmount } = TaxService.getExpenseTaxAmount(inv);

        if (index % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(14, currentY, pageWidth - 28, 5.2, 'F');
        }

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(30, 41, 59);

        doc.text(inv.date || '', invColX.date + 1, currentY + 3.6);

        const num = (inv.invoiceNumber || 'S/N').substring(0, 12);
        doc.text(num, invColX.invNum, currentY + 3.6);

        const supp = (inv.supplier || 'Varios').substring(0, 20);
        doc.text(supp, invColX.supplier, currentY + 3.6);

        const concept = (inv.title || '').substring(0, 22);
        doc.text(concept, invColX.concept, currentY + 3.6);

        doc.text(`${baseAmount.toFixed(2)}`, invColX.base, currentY + 3.6);
        doc.text(`${taxRate}%`, invColX.rate, currentY + 3.6);
        doc.text(`${taxAmount.toFixed(2)}`, invColX.tax, currentY + 3.6);

        doc.setFont('helvetica', 'bold');
        doc.text(`${(inv.amount || 0).toFixed(2)}`, invColX.total, currentY + 3.6);

        currentY += 5.2;
      });

      // Fila de totales
      if (currentY > 265) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFillColor(226, 232, 240); // Slate 200
      doc.rect(14, currentY, pageWidth - 28, 6, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(15, 23, 42);
      doc.text('TOTALES DEDUCIBLES CONSOLIDADOS', invColX.date + 1, currentY + 4.2);

      const totalBase = Math.max(0, Math.round((taxReport.deductibleExpenses - taxReport.ivaSoportado) * 100) / 100);
      doc.text(`${totalBase.toFixed(2)}`, invColX.base, currentY + 4.2);
      doc.text(`${taxReport.ivaSoportado.toFixed(2)}`, invColX.tax, currentY + 4.2);
      doc.text(`${taxReport.deductibleExpenses.toFixed(2)} ${currency}`, invColX.total, currentY + 4.2);

      currentY += 8;
    }

    // Pie de página institucional
    this.addFooters(doc, checksum);

    return doc.output('blob');
  }

  /**
   * Comparte o descarga el archivo PDF según la plataforma (Capacitor Android o Navegador Web)
   */
  static async shareOrDownloadPdf(pdfData: Blob | Uint8Array, filename: string): Promise<void> {
    const isNative = Capacitor.isNativePlatform();

    if (isNative) {
      // Conversión de Blob / Uint8Array a Base64
      let base64 = '';
      if (pdfData instanceof Blob) {
        base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            const b64 = result.split(',')[1] || '';
            resolve(b64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(pdfData);
        });
      } else {
        const chunkSize = 8192;
        let binary = '';
        for (let i = 0; i < pdfData.length; i += chunkSize) {
          const chunk = pdfData.subarray(i, i + chunkSize);
          binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
        }
        base64 = btoa(binary);
      }

      // Guardar en la caché de Android con Capacitor Filesystem
      const fileResult = await Filesystem.writeFile({
        path: filename,
        data: base64,
        directory: Directory.Cache,
      });

      // Abrir la hoja de compartir nativa de Android
      await Share.share({
        title: filename,
        text: `Informe Financiero CronoCash: ${filename}`,
        url: fileResult.uri,
        dialogTitle: 'Compartir o Guardar Informe PDF',
      });
    } else {
      // Descarga directa en navegador Web / PWA
      const blob = pdfData instanceof Blob ? pdfData : new Blob([pdfData as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }

  /**
   * Descarga directa de archivos de texto / CSV en Web o Capacitor
   */
  static async shareOrDownloadCsv(csvContent: string, filename: string): Promise<void> {
    const isNative = Capacitor.isNativePlatform();

    if (isNative) {
      const fileResult = await Filesystem.writeFile({
        path: filename,
        data: csvContent,
        directory: Directory.Cache,
      });

      await Share.share({
        title: filename,
        text: `Libro de Facturas CronoCash: ${filename}`,
        url: fileResult.uri,
        dialogTitle: 'Exportar Libro de Facturas (CSV)',
      });
    } else {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }
}
