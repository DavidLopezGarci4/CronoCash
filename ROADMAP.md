# Roadmap del Proyecto — CronoCash 🗺️

Aplicación móvil Android para la gestión inteligente de gastos, facturación recurrente, bolsas de presupuesto ("envelopes") con vasos comunicantes, calendario de cash-flow y copias de seguridad de alta confiabilidad.

---

## Estado Actual: v1.3.0 (Completado) 🚀
- [x] **Calendario Reactivo Puro con `date-fns` v4:** Vistas intercambiables entre rejilla mensual y vista semanal sin dependencias pesadas.
- [x] **Runway de Cash-Flow & Semáforo de Liquidez:** Estimación del saldo remanente a fin de mes cotejando ingresos, gastos ejecutados y facturas comprometidas pendientes.
- [x] **Interacción y Desglose por Día:** Al pulsar cualquier día del calendario, panel inferior con gastos registrados y vencimientos previstos con acción directa "Pagar".
- [x] **Comparador Anual (YoY - Year over Year):** Pestaña especializada para contrastar el gasto de dos años (ej. 2026 vs 2025), variación porcentual total y desglose gráfico mes a mes.
- [x] **Compilación y Firma Release:** Generación del APK firmado `app-v1.3.0-release.apk` con `versionCode 10300` y `versionName "1.3.0"`.

---

## Historial de Versiones Anteriores

### 📦 v1.2.0 (Completado)
- [x] Gestor avanzado de gastos recurrentes con cálculo predictivo de vencimientos y cuenta atrás semafórica.
- [x] Panel de auditoría y detector de gastos vampiro con cálculo de ahorro anual acumulado.
- [x] Smart Seeds de 7 facturas clave con asignación automática a bolsas.
- [x] Acción inmediata de asentamiento de pago hacia el libro de gastos reales.

### 📦 v1.1.0 (Completado)
- [x] Iconografía oficial Android en todos los mipmap y edición Verticons Card Pack 2:3.
- [x] Visor de iconos con opción de descarga en galería.
- [x] Smart Seeds de 8 Bolsas de Presupuesto con Vasos Comunicantes y Rollover de ahorro mensual.

### 📦 v1.0.0 (Completado)
- [x] Arquitectura base: React 19 + Vite 6 + Tailwind CSS v4 + TypeScript + Capacitor 7.
- [x] Persistencia en IndexedDB estructurado con auto-sembrado inicial y fallback a LocalStorage.
- [x] Autenticación biométrica nativa (`androidx.biometric:1.1.0` en Android Jetpack) con fallback a PIN numérico táctil y auto-bloqueo.
- [x] Layout móvil con insets de `safe-area`, corrección de teclado Android y navegación accesible.

---

## Próximas Versiones Planificadas

### 🎯 Versión v1.4.0 — Motor de Notificaciones Exactas
- [ ] Notificaciones locales con canales Android y soporte para `SCHEDULE_EXACT_ALARM`.
- [ ] Alertas escalonadas (3 días antes y el día del cargo).
- [ ] Notificación nocturna de cierre diario (21:30) para registrar movimientos del día.

### 🎯 Versión v1.5.0 — Copias de Seguridad en Google Drive (2 Ranuras Canónicas)
- [ ] Respaldo a Google Drive mediante SAF y Share Sheet (`@capacitor/share` + `@capacitor/filesystem`).
- [ ] 2 ranuras canónicas: `Gastos_Actual.json` y `Gastos_Previa.json`.
- [ ] Pantalla comparativa lado a lado antes de restaurar con verificación de checksum.

### 🎯 Versión v1.6.0 — Consejos de Ahorro e Ideas Legales de Ingresos Pasivos
- [ ] Guías de renegociación de contratos (luz, fibra, seguros).
- [ ] Métodos 50/30/20 y Kakebo.
- [ ] Vías legales de ingresos rápidos y pasivos (cuentas remuneradas FGD, fondos monetarios, venta de excedentes).
- [ ] Escudo anti-estafas financieras.
