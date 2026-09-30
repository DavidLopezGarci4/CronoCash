// Test determinista de verificación para Conciliación, Eliminación Segura y Alertas de Preaviso
const assert = require('assert');

// 1. Simulación de RecurringEngineService y completedDates
function isRuleOnDate(rule, date) {
  const dateStr = date.toISOString().split('T')[0];
  const dayOfMonth = rule.dayOfMonth || 1;
  const currentDay = date.getDate();
  return currentDay === dayOfMonth;
}

function processDueRecurringRules(rules, existingExpenses, referenceDate = new Date('2026-09-25T12:00:00Z')) {
  const todayStr = referenceDate.toISOString().split('T')[0];
  const newExpenses = [];
  const updatedRulesMap = new Map();

  const existingExpenseKeys = new Set();
  for (const exp of existingExpenses) {
    if (exp.recurringRuleId && exp.date) {
      existingExpenseKeys.add(`${exp.recurringRuleId}_${exp.date}`);
    } else if (exp.title && exp.date) {
      existingExpenseKeys.add(`${exp.title.toLowerCase()}_${exp.date}`);
    }
  }

  const activeRules = rules.filter((r) => r.isActive !== false && r.autoCreateExpense !== false && r.amount > 0);

  for (const rule of activeRules) {
    const completedDatesSet = new Set(rule.completedDates || []);
    let ruleModified = false;

    // Evaluamos el día 22 de septiembre 2026
    const testDate = new Date('2026-09-22T00:00:00Z');
    const dateStr = '2026-09-22';

    if (isRuleOnDate(rule, testDate)) {
      const ruleKey = `${rule.id}_${dateStr}`;
      const titleKey = `${rule.title.toLowerCase()}_${dateStr}`;

      const alreadyInExpenses = existingExpenseKeys.has(ruleKey) || existingExpenseKeys.has(titleKey);
      const alreadyInCompleted = completedDatesSet.has(dateStr);

      if (!alreadyInExpenses && !alreadyInCompleted) {
        newExpenses.push({
          id: `exp_rec_auto_${rule.id}_${dateStr}`,
          title: rule.title,
          amount: rule.amount,
          date: dateStr,
          bucketId: rule.bucketId,
          recurringRuleId: rule.id,
        });
        completedDatesSet.add(dateStr);
        ruleModified = true;
      }
    }

    if (ruleModified) {
      updatedRulesMap.set(rule.id, {
        ...rule,
        completedDates: Array.from(completedDatesSet),
      });
    }
  }

  return {
    newExpenses,
    updatedRules: rules.map((r) => updatedRulesMap.get(r.id) || r),
  };
}

console.log('--- TEST 1: Generación inicial de recurrente de Hipoteca ---');
const initialRule = {
  id: 'rule_hipoteca',
  title: 'Hipoteca / Alquiler Vivienda',
  amount: 619.82,
  bucketId: 'bucket_vivienda',
  dayOfMonth: 22,
  isActive: true,
  autoCreateExpense: true,
  completedDates: [],
};

const run1 = processDueRecurringRules([initialRule], []);
assert.strictEqual(run1.newExpenses.length, 1, 'Debe generar el gasto automático');
assert.strictEqual(run1.newExpenses[0].amount, 619.82);
assert.strictEqual(run1.newExpenses[0].recurringRuleId, 'rule_hipoteca');
console.log('✅ TEST 1 PASADO: Gasto automático generado con éxito.');

console.log('\n--- TEST 2: Importación de extracto bancario con duplicidad ---');
const autoExpense = run1.newExpenses[0];
const updatedRuleAfterAuto = run1.updatedRules[0];

// Ahora el usuario importa del banco la transacción oficial
const bankExpense = {
  id: 'exp_imp_bank_999',
  title: 'LIQUID. CUOTA PTMO. 510798483-0001',
  amount: 619.82,
  date: '2026-09-22',
  bucketId: 'bucket_vivienda',
  rawHash: 'sha256_mock_hash',
};

// En la bolsa temporalmente hay 2 gastos (duplicado)
let expensesInDb = [autoExpense, bankExpense];
const grossTotalBeforeMerge = expensesInDb.reduce((sum, e) => sum + e.amount, 0);
assert.strictEqual(Math.round(grossTotalBeforeMerge * 100) / 100, 1239.64, 'La suma antes de conciliar duplica el coste');
console.log(`Gasto bruto antes de conciliar: ${grossTotalBeforeMerge.toFixed(2)} € (Duplicado)`);

console.log('\n--- TEST 3: Conciliación / Fusión de Apuntes ---');
function reconcileExpenses(bankId, recurringId, allExpenses, rules) {
  const bankExp = allExpenses.find((e) => e.id === bankId);
  const recExp = allExpenses.find((e) => e.id === recurringId);
  const ruleId = recExp.recurringRuleId || bankExp.recurringRuleId;

  // Actualizar apunte bancario
  const reconciledBankExp = {
    ...bankExp,
    recurringRuleId: ruleId,
    notes: `Conciliado con regla: ${recExp.title}`,
  };

  // Asegurar que completedDates de la regla contenga la fecha
  const updatedRules = rules.map((r) => {
    if (r.id === ruleId) {
      const dates = new Set(r.completedDates || []);
      dates.add(bankExp.date);
      return { ...r, completedDates: Array.from(dates) };
    }
    return r;
  });

  // Retirar el apunte recurrente duplicado
  const remainingExpenses = allExpenses
    .filter((e) => e.id !== recurringId)
    .map((e) => (e.id === bankId ? reconciledBankExp : e));

  return { remainingExpenses, updatedRules };
}

const mergeResult = reconcileExpenses(bankExpense.id, autoExpense.id, expensesInDb, [updatedRuleAfterAuto]);
expensesInDb = mergeResult.remainingExpenses;
const rulesInDb = mergeResult.updatedRules;

assert.strictEqual(expensesInDb.length, 1, 'Debe quedar exactamente un solo apunte tras conciliar');
assert.strictEqual(expensesInDb[0].id, bankExpense.id, 'Debe conservar el ID del apunte bancario');
assert.strictEqual(expensesInDb[0].recurringRuleId, 'rule_hipoteca', 'Debe estar vinculado a la regla');
assert.strictEqual(expensesInDb[0].amount, 619.82);

const grossTotalAfterMerge = expensesInDb.reduce((sum, e) => sum + e.amount, 0);
assert.strictEqual(grossTotalAfterMerge, 619.82, 'El gasto bruto se ajusta exactamente a 619.82 €');
console.log(`✅ TEST 3 PASADO: Gasto bruto corregido a ${grossTotalAfterMerge.toFixed(2)} €.`);

console.log('\n--- TEST 4: Idempotencia - RecurringEngineService no vuelve a regenerar el gasto ---');
const run2 = processDueRecurringRules(rulesInDb, expensesInDb);
assert.strictEqual(run2.newExpenses.length, 0, 'No debe generar ningún gasto nuevo porque completedDates contiene la fecha y el apunte ya existe');
console.log('✅ TEST 4 PASADO: Cero duplicados en recargas subsecuentes.');

console.log('\n--- TEST 5: Eliminación Segura preservando completedDates ---');
// Si el usuario elimina un gasto que tiene recurringRuleId
function safeDeleteExpense(expenseId, allExpenses, rules) {
  const target = allExpenses.find((e) => e.id === expenseId);
  let updatedRules = [...rules];
  if (target && target.recurringRuleId) {
    updatedRules = rules.map((r) => {
      if (r.id === target.recurringRuleId) {
        const dates = new Set(r.completedDates || []);
        dates.add(target.date);
        return { ...r, completedDates: Array.from(dates) };
      }
      return r;
    });
  }
  const remaining = allExpenses.filter((e) => e.id !== expenseId);
  return { remainingExpenses: remaining, updatedRules };
}

const deleteResult = safeDeleteExpense(bankExpense.id, expensesInDb, rulesInDb);
assert.strictEqual(deleteResult.remainingExpenses.length, 0, 'El gasto se ha eliminado de la bolsa');
assert.strictEqual(deleteResult.updatedRules[0].completedDates.includes('2026-09-22'), true, 'La fecha debe permanecer en completedDates');
assert.strictEqual(deleteResult.updatedRules[0].isActive, true, 'La regla sigue activa');

// Al volver a evaluar el motor con 0 gastos, ¿se regenera?
const run3 = processDueRecurringRules(deleteResult.updatedRules, deleteResult.remainingExpenses);
assert.strictEqual(run3.newExpenses.length, 0, 'No se regenera automáticamente porque completedDates retiene la fecha suprimida');
console.log('✅ TEST 5 PASADO: Eliminación segura completada sin regeneración ni desactivación de regla.');

console.log('\n--- TEST 6: Alerta de Preaviso (30, 60, 90 días) ---');
function checkNoticeAlert(rule, daysUntilDue) {
  if (!rule.noticePeriodDays || rule.noticePeriodDays <= 0) return false;
  return daysUntilDue <= rule.noticePeriodDays;
}

const ruleWithNotice = { ...initialRule, noticePeriodDays: 60 };
assert.strictEqual(checkNoticeAlert(ruleWithNotice, 45), true, 'Debe alertar si faltan 45 días (dentro de ventana 60d)');
assert.strictEqual(checkNoticeAlert(ruleWithNotice, 75), false, 'No debe alertar si faltan 75 días (fuera de ventana 60d)');
assert.strictEqual(checkNoticeAlert({ ...initialRule, noticePeriodDays: 0 }, 10), false, 'Sin ventana no debe alertar');
console.log('✅ TEST 6 PASADO: Semáforo de preaviso validado con precisión.');

console.log('\n🎉 TODOS LOS TESTS DE CONCILIACIÓN, SEGURIDAD Y PREAVISO HAN PASADO EXITOSAMENTE.');
