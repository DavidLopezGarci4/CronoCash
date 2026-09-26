# Roadmap del Proyecto — CronoCash 🗺️

Aplicación móvil Android para la gestión inteligente de gastos, facturación recurrente, bolsas de presupuesto ("envelopes") con vasos comunicantes, calendario de cash-flow y copias de seguridad de alta confiabilidad.

---

## Estado Actual: v1.10.0 — Importador Universal Bancario Offline CSV & Smart Rules Engine ⚡
- [x] **Parser Bancario Heurístico (`csvImporterService.ts`):** Detección automática de delimitador (`;`, `,`, `\t`), fechas españolas (`DD/MM/YYYY`) e importes (`1.250,50 €`, columnas separadas Debe/Haber o importe único con signo).
- [x] **Deduplicador Criptográfico SHA-256:** Generación de hash determinista por movimiento bancario (`fecha + concepto + importe`) mediante Web Crypto API para descartar transacciones solapadas.
- [x] **Motor de Reglas Inteligentes (`SmartRulesModal.tsx`):** Almacén `smart_rules` en IndexedDB v2 con 12+ semillas de comercios españoles (Mercadona, Repsol, Iberdrola, Vodafone, Netflix, etc.) y asignación automática por prioridad.
- [x] **Bandeja de Entrada Pre-Asentamiento (`CsvImportModal.tsx`):** Staging con contadores en tiempo real (válidos, duplicados, auto-asignados), selector de bolsas, toggle de factura y guardado de reglas al vuelo.
- [x] **Compilación y Firma Release Dual v1.10.0:** Generación y firma de ambos APKs `app-v1.10.0-release.apk` (Estándar) y `app-v1.10.0-verticon-release.apk` (Verticons 2:3) con `versionCode 11000` y `versionName "1.10.0"`.

---

## Cola de Mejoras Planificadas (Post-Benchmarking Scout)

### 🎯 Fase 11: Metas de Ahorro "Sinking Funds" con Ritmo de Crucero (Próxima)
- [ ] Fondos de amortización para gastos previsibles futuros (Vacaciones, IBI, Seguro Anual, Navidad, Reparaciones).
- [ ] Cálculo automático de aportación periódica recomendada y barra de progreso temporal.
- [ ] Asignación de excedentes mensuales con 1 toque hacia metas prioritarias.

### 📊 Fase 12: Generador Ejecutivo de Informes PDF & Cuadro Fiscal Trimestral
- [ ] Exportación de informes mensuales y trimestrales ejecutivos en PDF descargables.
- [ ] Cuadro fiscal preliminar para autónomos y profesionales (Mod. 130 IRPF y Mod. 303 IVA estimado).
- [ ] Resumen gráfico de facturas emitidas, recibidas y retenciones aplicadas.

---

## Historial Completo de Versiones

### 📦 v1.9.0 (Completado)
- [x] Motor Predictivo Safe-to-Spend (`safeToSpendService.ts`) y Widget de Ritmo de Consumo (`SafeToSpendWidget.tsx`).
- [x] Simulador de Compras por Impulso (+20€, +50€, +100€) y Píldora heroica "Hoy: XX.XX €" en Header.
- [x] Asistente Cover Overspending (`CoverOverspendingModal.tsx`) con 3 estrategias de reequilibrio.

### 📦 v1.8.2 (Completado)
- [x] Puente Nativo de Descarga/Guardado (`BucketsView.tsx`) con `@capacitor/filesystem` y `@capacitor/share`.
- [x] Compatibilidad total de descarga de iconos en WebView de Android.

### 📦 v1.8.1 (Completado)
- [x] Bordes de neón al ras perimetral en Verticons Pack 2:3 sin marco negro plano.
- [x] Acabado en fibra de carbono en esquinas y variante PNG con transparencia 800x1200.

### 📦 v1.8.0 (Completado)
- [x] Manifiesto declarativo TecnoRed `stack.config.json` con las 6 tecnologías nucleares.
- [x] Componente interactivo `AppArchitectureGraph.tsx` con física de partículas a 60 FPS y anillos de salud.
- [x] Carga diferida ultra-optimizada en `SettingsModal.tsx` con chunk aislado de 6.57 kB (gzip).

### 📦 v1.7.0 (Completado)
- [x] Release final previa y manual maestro de usuario `docs/FAQ.md` en 8 ejes temáticos.
- [x] Soporte nativo dual de APKs para iconos estándar y tarjeta Verticons 2:3.
- [x] Auditoría integral de rendimiento y optimización de bundles.

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
