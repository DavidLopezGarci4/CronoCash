# Roadmap del Proyecto — CronoCash 🗺️

Aplicación móvil Android para la gestión inteligente de gastos, facturación recurrente, bolsas de presupuesto ("envelopes") con vasos comunicantes, calendario de cash-flow y copias de seguridad de alta confiabilidad.

---

## Estado Actual: v1.7.0 — Release Final & Entrega Definitiva (Completado) 🏆
- [x] **Auditoría Integral de Rendimiento & Bundle Optimization:** Verificación exhaustiva de todos los módulos (Dashboard, Bolsas, Recurrentes, Calendario, Notificaciones, Google Drive Backup y Estrategias). Cero errores de TypeScript, compilación ultra-optimizada con Vite 6 y Tailwind v4.
- [x] **Documentación Maestra de Usuario (`docs/FAQ.md`):** Generación de la guía exhaustiva de preguntas frecuentes y manual de uso operativo estructurado en 8 secciones temáticas concisas sin datos obsoletos.
- [x] **Suite de Seguridad y Privacidad Local:** Autenticación biométrica nativa de huella (`androidx.biometric:1.1.0`), PIN numérico en teclado táctil virtual integrado, auto-bloqueo preventivo en segundo plano y candado manual instantáneo.
- [x] **Sistema de Presupuesto Elastic Envelopes:** 8 bolsas maestras precargadas, vasos comunicantes hápticos para rebalanceo de límites y rollover mensual de excedentes hacia colchón de ahorro.
- [x] **Motor Predictivo de Recurrentes y Gastos Vampiro:** Cálculo de vencimientos con badges semafóricos (*¡Vence HOY!*, *¡Mañana!*, *En X días*), asentamiento en 1 toque y panel de auditoría de suscripciones con cálculo de ahorro anual.
- [x] **Calendario Reactivo y Runway de Cash-Flow:** Vistas dinámicas de mes y semana con `date-fns` v4, semáforo de liquidez proyectada a fin de mes e histórico comparativo interanual (YoY).
- [x] **Sistema de Alarmas Exactas Android:** 3 canales dedicados, preavisos a 3 días y día de cobro, repaso diario nocturno (21:30) y deep-linking directo al abrir notificaciones.
- [x] **Copias de Seguridad en Google Drive (2 Ranuras):** Ranura principal `CronoCash_Actual.json` y secundaria `CronoCash_Previa.json` vía SAF (`@capacitor/share`), checksum determinista y comparador inteligente lado a lado (Side-by-Side).
- [x] **Módulo de Estrategias y Escudo Anti-Estafas:** 14 guías prácticas de ahorro, renegociación, excedentes en Wallapop, deducciones autonómicas, cuentas remuneradas con FGD, fondos monetarios y prevención de fraudes con registro CNMV e INCIBE.
- [x] **Iconografía Oficial y Verticons:** Iconos Android adaptativos en todas las densidades de mipmap y tarjeta vertical Verticons 2:3 en alta resolución con visor integrado.
- [x] **Compilación y Firma Release:** Generación del APK final firmado `app-v1.7.0-release.apk` con `versionCode 10700` y `versionName "1.7.0"`.

---

## Historial Completo de Versiones

### 📦 v1.6.0 (Completado)
- [x] Suite de 14 Estrategias Financieras Maestras (Ahorro, Dinero Rápido, Dinero Pasivo y Escudo Anti-Estafas).
- [x] Horquillas de ahorro económico y respaldo legal oficial (CNMC, Ley 50/1980, AEAT, CNMV, FGD).
- [x] Filtros temáticos, buscador instantáneo, pasos desplegables y botón persistente de marcado.

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
