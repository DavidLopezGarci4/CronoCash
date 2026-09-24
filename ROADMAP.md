# Roadmap del Proyecto — CronoCash 🗺️

Aplicación móvil Android para la gestión inteligente de gastos, facturación recurrente, bolsas de presupuesto ("envelopes") con vasos comunicantes, calendario de cash-flow y copias de seguridad de alta confiabilidad.

---

## Estado Actual: v1.5.0 (Completado) 🚀
- [x] **Arquitectura Canónica de 2 Ranuras para Google Drive:** Soporte para `CronoCash_Actual.json` (Slot 1 principal) y `CronoCash_Previa.json` (Slot 2 de salvaguarda histórica).
- [x] **Integración con Storage Access Framework (SAF):** Exportación y compartición fluida con `@capacitor/filesystem` y `@capacitor/share` sin credenciales de API invasivas ni caducidad de tokens.
- [x] **Envelope de Seguridad y Checksum Determinista:** Empaquetado v1.5.0 con hash de integridad, fecha y hora en franja horaria `Europe/Madrid`, y metadatos exhaustivos de registros.
- [x] **Comparador Previo Lado a Lado (Side-by-Side):** Pantalla inteligente de inspección que compara los datos del dispositivo actual frente a la copia seleccionada con indicadores de deltas (+/-), modo sobrescribir/fusionar y checkbox de confirmación obligatoria.
- [x] **Acceso Rápido Integrado:** Acceso directo desde la cabecera (Header) y desde la sección de Bóveda y Ajustes.
- [x] **Compilación y Firma Release:** Generación del APK firmado `app-v1.5.0-release.apk` con `versionCode 10500` y `versionName "1.5.0"`.

---

## Historial de Versiones Anteriores

### 📦 v1.4.0 (Completado)
- [x] Motor de notificaciones locales con 3 canales Android (`crono_bills_alerts`, `crono_daily_review`, `crono_budget_alerts`).
- [x] Alertas escalonadas a 3 días y el día de cobro para facturas y recibos.
- [x] Recordatorio nocturno de cierre diario a las 21:30 configurable.
- [x] Deep-linking interactivo al tocar notificaciones hacia Recurrentes o Dashboard.
- [x] Botón "Probar Alarma" con disparo de notificación de prueba a 3 segundos.

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

### 🎯 Versión v1.6.0 — Consejos de Ahorro e Ideas Legales de Ingresos Pasivos
- [ ] Guías de renegociación de contratos (luz, fibra, seguros).
- [ ] Métodos 50/30/20 y Kakebo.
- [ ] Vías legales de ingresos rápidos y pasivos (cuentas remuneradas FGD, fondos monetarios, venta de excedentes).
- [ ] Escudo anti-estafas financieras.

### 🎯 Versión v1.7.0 — Release Final y Entrega Definitiva
- [ ] Auditoría integral de rendimiento y optimización de bundles.
- [ ] Empaquetado de producción final y documentación exhaustiva de usuario.
