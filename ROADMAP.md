# Roadmap del Proyecto — CronoCash 🗺️

Aplicación móvil Android para la gestión inteligente de gastos, facturación recurrente, bolsas de presupuesto ("envelopes") con vasos comunicantes, calendario de cash-flow y copias de seguridad de alta confiabilidad.

---

## Estado Actual: v1.4.0 (Completado) 🚀
- [x] **Motor de Notificaciones Locales y Canales Android:** Creación de 3 canales nativos de alta prioridad (`crono_bills_alerts`, `crono_daily_review`, `crono_budget_alerts`) con permisos en tiempo de ejecución (Android 13+) y alarmas exactas (`SCHEDULE_EXACT_ALARM`).
- [x] **Avisos Escalonados Pre-Cobro:** Programación de alertas automáticas 3 días antes (a las 09:30 AM) y el día del vencimiento a las 09:00 AM para cada recibo y factura activa.
- [x] **Recordatorio Nocturno de Cierre Diario:** Alarma diaria programable (21:30) para asentar gastos menores o compras del día en las bolsas.
- [x] **Deep Linking Interactivo:** Al pulsar una notificación de recibo, la app se abre y navega directamente a la vista de Recurrentes o Dashboard.
- [x] **Panel de Notificaciones en Ajustes:** Interruptor maestro de avisos, selector de hora de revisión y botón "Probar Alarma" con disparo de prueba en 3 segundos.
- [x] **Compilación y Firma Release:** Generación del APK firmado `app-v1.4.0-release.apk` con `versionCode 10400` y `versionName "1.4.0"`.

---

## Historial de Versiones Anteriores

### 📦 v1.3.0 (Completado)
- [x] Calendario reactivo dual (mes y semana) con `date-fns` v4 sin dependencias pesadas.
- [x] Runway de Cash-Flow y semáforo de liquidez proyectada a fin de mes.
- [x] Desglose interactivo por día y comparador anual (YoY) con evolución mes a mes.

### 📦 v1.2.0 (Completado)
- [x] Gestor avanzado de gastos recurrentes con cálculo predictivo de vencimientos y cuenta atrás semafórica.
- [x] Panel de auditoría y detector de gastos vampiro con cálculo de ahorro anual acumulado.
- [x] Smart Seeds de 7 facturas clave con asignación automática a bolsas y asentamiento con 1 toque.

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

### 🎯 Versión v1.5.0 — Copias de Seguridad en Google Drive (2 Ranuras Canónicas)
- [ ] Respaldo a Google Drive mediante SAF y Share Sheet (`@capacitor/share` + `@capacitor/filesystem`).
- [ ] 2 ranuras canónicas: `Gastos_Actual.json` y `Gastos_Previa.json`.
- [ ] Pantalla comparativa lado a lado antes de restaurar con verificación de checksum.

### 🎯 Versión v1.6.0 — Consejos de Ahorro e Ideas Legales de Ingresos Pasivos
- [ ] Guías de renegociación de contratos (luz, fibra, seguros).
- [ ] Métodos 50/30/20 y Kakebo.
- [ ] Vías legales de ingresos rápidos y pasivos (cuentas remuneradas FGD, fondos monetarios, venta de excedentes).
- [ ] Escudo anti-estafas financieras.
