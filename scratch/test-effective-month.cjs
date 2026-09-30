const assert = require('assert');

function getExpenseEffectiveMonth(expense) {
  if (expense.effectiveMonth && /^\d{4}-\d{2}$/.test(expense.effectiveMonth)) {
    return expense.effectiveMonth;
  }
  return (expense.date || '').substring(0, 7) || new Date().toISOString().substring(0, 7);
}

console.log('--- TEST 1: Resolución de mes efectivo de imputación ---');
const expNormal = { id: '1', title: 'Compra super', amount: 50, date: '2026-09-28' };
assert.strictEqual(getExpenseEffectiveMonth(expNormal), '2026-09', 'Gasto estándar debe imputar al mes de su fecha');

const expPostponed = { id: '2', title: 'Oportunidad compra abrigo', amount: 120, date: '2026-09-28', effectiveMonth: '2026-10' };
assert.strictEqual(getExpenseEffectiveMonth(expPostponed), '2026-10', 'Gasto diferido debe imputar a 2026-10');
console.log('✅ TEST 1 PASADO: getExpenseEffectiveMonth resuelve con precisión.');

console.log('\n--- TEST 2: Filtrado presupuestario de bolsa por mes ---');
const allExpenses = [
  expNormal,
  expPostponed,
  { id: '3', title: 'Compra de octubre', amount: 40, date: '2026-10-02' }
];

// Cálculo de gastos para Septiembre 2026
const sepExpenses = allExpenses.filter(e => getExpenseEffectiveMonth(e) === '2026-09');
assert.strictEqual(sepExpenses.length, 1, 'En septiembre solo debe figurar expNormal');
assert.strictEqual(sepExpenses[0].id, '1');
const sepTotal = sepExpenses.reduce((s, e) => s + e.amount, 0);
assert.strictEqual(sepTotal, 50, 'El total consumido de septiembre no debe incluir la compra aplazada (50€)');

// Cálculo de gastos para Octubre 2026
const octExpenses = allExpenses.filter(e => getExpenseEffectiveMonth(e) === '2026-10');
assert.strictEqual(octExpenses.length, 2, 'En octubre deben figurar la compra aplazada y la compra de octubre');
const octTotal = octExpenses.reduce((s, e) => s + e.amount, 0);
assert.strictEqual(octTotal, 160, 'El total consumido de octubre debe ser 120 + 40 = 160€');
console.log('✅ TEST 2 PASADO: El presupuesto de septiembre no se sobreinfla y octubre imputa con exactitud.');

console.log('\n🎉 TODOS LOS TESTS DE FECHA DUAL / IMPUTACIÓN EFECTIVA PASADOS EXITOSAMENTE.');
