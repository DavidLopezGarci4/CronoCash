# Roadmap del Proyecto — CronoCash 🗺️

Aplicación móvil Android para la gestión inteligente de gastos, facturación recurrente, bolsas de presupuesto ("envelopes") con vasos comunicantes, calendario de cash-flow y copias de seguridad de alta confiabilidad.

---

## Estado Actual: v1.6.0 (Completado) 🚀
- [x] **Suite de 14 Estrategias Financieras Maestras:** Ampliación exhaustiva del módulo de conocimiento cubriendo Ahorro y Renegociación implacable, Generación Legal de Dinero Rápido, Ingresos Pasivos Protegidos y Escudo Anti-Estafas Financieras.
- [x] **Estimaciones Económicas y Respaldo Legal:** Cada estrategia incluye horquillas reales de ahorro/retorno (ej. 180€-420€ en luz, 3%-4% TAE en cuentas FGD), tiempo de dedicación, nivel de riesgo y fundamento jurídico (CNMC, Ley 50/1980, AEAT, CNMV e INCIBE).
- [x] **Filtros por Categoría y Buscador en Tiempo Real:** Interfaz enriquecida con filtrado por píldoras temáticas y búsqueda instantánea por palabras clave.
- [x] **Pasos de Acción Desplegables y Seguimiento Activo:** Acordeones interactivos con instrucciones paso a paso numeradas y botón persistente "Marcar como Aplicado" para auditar el porcentaje de ejecución y ahorro acumulado.
- [x] **Compilación y Firma Release:** Generación del APK firmado `app-v1.6.0-release.apk` con `versionCode 10600` y `versionName "1.6.0"`.

---

## Historial de Versiones Anteriores

### 📦 v1.5.0 (Completado)
- [x] Arquitectura Canónica de 2 Ranuras para Google Drive (`CronoCash_Actual.json` y `CronoCash_Previa.json`).
- [x] Integración con Storage Access Framework (SAF) y `@capacitor/share` sin claves de API invasivas.
- [x] Envelope de seguridad v1.5.0 con checksum determinista y fecha en franja horaria `Europe/Madrid`.
- [x] Comparador Previo Lado a Lado (Side-by-Side) con indicador de deltas y modos sobrescribir/fusionar.

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

### 🎯 Versión v1.7.0 — Release Final y Entrega Definitiva
- [ ] Auditoría integral de rendimiento y optimización de bundles.
- [ ] Empaquetado de producción final y documentación exhaustiva de usuario.
