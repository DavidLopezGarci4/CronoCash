const assert = require('assert');

function getBucketMonthLimit(bucket, monthPrefix) {
  if (!monthPrefix) return Number(bucket.budgetLimit) || 0;
  const adj = bucket.monthlyAdjustments?.[monthPrefix] || 0;
  return Math.max(0, Math.round(((Number(bucket.budgetLimit) || 0) + adj) * 100) / 100);
}

function transferBucketMonthlyBalance(fromBucket, toBucket, amount, monthPrefix) {
  if (amount <= 0) throw new Error('El importe debe ser > 0');
  if (fromBucket.id === toBucket.id) throw new Error('Bolsas iguales');

  const fromAdj = fromBucket.monthlyAdjustments || {};
  const toAdj = toBucket.monthlyAdjustments || {};

  fromBucket.monthlyAdjustments = {
    ...fromAdj,
    [monthPrefix]: Math.round(((fromAdj[monthPrefix] || 0) - amount) * 100) / 100
  };

  toBucket.monthlyAdjustments = {
    ...toAdj,
    [monthPrefix]: Math.round(((toAdj[monthPrefix] || 0) + amount) * 100) / 100
  };
}

function revertBucketMonthlyAdjustment(bucket, monthPrefix) {
  if (!bucket.monthlyAdjustments || !(monthPrefix in bucket.monthlyAdjustments)) {
    return;
  }
  const next = { ...bucket.monthlyAdjustments };
  delete next[monthPrefix];
  bucket.monthlyAdjustments = Object.keys(next).length > 0 ? next : undefined;
}

console.log('--- TEST 1: Límite base maestro y ajuste puntual acotado a un mes ---');
const bucketMunecos = {
  id: 'b_munecos',
  name: 'Muñecos',
  budgetLimit: 150,
};

const bucketOcio = {
  id: 'b_ocio',
  name: 'Ocio',
  budgetLimit: 500,
};

// 1. Antes de cualquier ajuste
assert.strictEqual(getBucketMonthLimit(bucketMunecos, '2026-09'), 150, 'En septiembre el límite inicial debe ser 150€');
assert.strictEqual(getBucketMonthLimit(bucketMunecos, '2026-10'), 150, 'En octubre el límite inicial debe ser 150€');

// 2. Aplicar ajuste puntual de reequilibrio en septiembre (trasvase de 262.98€ de Ocio a Muñecos)
transferBucketMonthlyBalance(bucketOcio, bucketMunecos, 262.98, '2026-09');

// Comprobaciones para Septiembre 2026
assert.strictEqual(getBucketMonthLimit(bucketMunecos, '2026-09'), 412.98, 'Muñecos en septiembre debe tener 150 + 262.98 = 412.98€');
assert.strictEqual(getBucketMonthLimit(bucketOcio, '2026-09'), 237.02, 'Ocio en septiembre debe tener 500 - 262.98 = 237.02€');

// Comprobaciones críticas para Octubre 2026 (MES SIGUIENTE NO DEBE CONTAMINARSE)
assert.strictEqual(getBucketMonthLimit(bucketMunecos, '2026-10'), 150, 'Muñecos en octubre DEBE MANTENERSE EN SU LÍMITE BASE (150€)');
assert.strictEqual(getBucketMonthLimit(bucketOcio, '2026-10'), 500, 'Ocio en octubre DEBE MANTENERSE EN SU LÍMITE BASE (500€)');
assert.strictEqual(bucketMunecos.budgetLimit, 150, 'El budgetLimit maestro de Muñecos no debe haber sido mutado');
assert.strictEqual(bucketOcio.budgetLimit, 500, 'El budgetLimit maestro de Ocio no debe haber sido mutado');
console.log('✅ TEST 1 PASADO: Ajuste acotado a septiembre sin contaminar octubre ni mutar budgetLimit.');

console.log('\n--- TEST 2: Retrocesión / Reversión del ajuste puntual del mes ---');
revertBucketMonthlyAdjustment(bucketMunecos, '2026-09');
revertBucketMonthlyAdjustment(bucketOcio, '2026-09');

assert.strictEqual(getBucketMonthLimit(bucketMunecos, '2026-09'), 150, 'Al revertir, Muñecos en septiembre vuelve exactamente a 150€');
assert.strictEqual(getBucketMonthLimit(bucketOcio, '2026-09'), 500, 'Al revertir, Ocio en septiembre vuelve exactamente a 500€');
assert.strictEqual(bucketMunecos.monthlyAdjustments, undefined, 'monthlyAdjustments queda limpio');
console.log('✅ TEST 2 PASADO: Retrocesión limpia y exacta.');

console.log('\n🎉 TODOS LOS TESTS DE AJUSTES PUNTUALES Y RETROCESIÓN PASADOS EXITOSAMENTE.');
