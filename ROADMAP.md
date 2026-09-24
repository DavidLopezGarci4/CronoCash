# Roadmap del Proyecto — CronoCash 🗺️

Aplicación móvil Android para la gestión inteligente de gastos, facturación recurrente, bolsas de presupuesto ("envelopes") con vasos comunicantes, calendario de cash-flow y copias de seguridad de alta confiabilidad.

---

## Estado Actual: v1.2.0 (Completado) 🚀
- [x] **Gestor Avanzado de Gastos Recurrentes:** Soporte completo para frecuencias semanal, mensual, trimestral y anual con asignación de día de cobro.
- [x] **Motor Predictivo de Fechas & Cuenta Atrás:** Algoritmo que calcula la fecha exacta del próximo cobro y los días restantes con semáforo de proximidad ("¡Vence HOY!", "¡Mañana!", "En X días").
- [x] **Auditoría & Detector de Gastos Vampiro:** Módulo de análisis que detecta suscripciones prescindibles, calcula el impacto anual acumulado y el potencial de ahorro al migrar a planes anuales o cancelar.
- [x] **Dashboard de Compromisos Financieros:** Visualización superior de gasto recurrente mensual comprometido, proyección anual total y ficha de cobro inminente.
- [x] **Smart Seeds de Recurrentes en 1 Clic:** Plantilla maestra precargada con 7 recibos indispensables (Hipoteca, Luz, Agua, Fibra, Seguro Coche, Gimnasio y Streaming).
- [x] **Acción de Pago Inmediato:** Botón "Registrar Pago" para asentar el recibo directamente en el libro de gastos reales con 1 toque.
- [x] **Compilación y Firma Release:** Generación del APK firmado `app-v1.2.0-release.apk` con `versionCode 10200` y `versionName "1.2.0"`.

---

## Historial de Versiones Anteriores

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

### 🎯 Versión v1.3.0 — Calendario Predictivo & Runway de Cash-Flow
- [ ] Calendario reactivo basado en `date-fns` v4 (vista mensual y semanal).
- [ ] Visualización de saldo proyectado día a día según vencimientos programados.
- [ ] Comparador anual (YoY - Year over Year) para evaluar evolución del gasto respecto al año previo.

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
