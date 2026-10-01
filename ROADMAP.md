# Roadmap del Proyecto — CronoCash 🗺️

Aplicación móvil Android para la gestión inteligente de gastos, facturación recurrente, bolsas de presupuesto ("envelopes") con vasos comunicantes, calendario de cash-flow y copias de seguridad de alta confiabilidad.

---

## Estado Actual: v1.28.0 — Persistencia Total en Copias de Seguridad y Blindaje de Metas y Reglas ante Actualizaciones de la APK 🎯
- [x] **Snapshot Integral en Copias de Seguridad:** Respaldo completo en Google Drive (`CronoCash_Actual.json` / `Previa.json`) y archivos locales JSON incluyendo `savingsGoals` y `smartRules`.
- [x] **Blindaje Anti-Sobreescritura (Tombstone):** Persistencia indeleble (`hasEverSeeded` y `hasSeededDefaults`) que garantiza que metas o reglas eliminadas o modificadas no reaparezcan al abrir la app o actualizar la versión de la APK.
- [x] **Comparador Lado a Lado Enriquecido:** Inspección previa con conteo de Metas y Reglas y visualización de deltas (`+` / `-`).
- [x] **Botón de Plantilla Voluntaria:** Acceso directo en el panel de Metas para incorporar o reponer la plantilla recomendada de fondos sin pisar metas existentes.
- [x] **Restauración Atómica sin Huérfanos:** Purga efectiva de colecciones vacías en IndexedDB y `localStorage`.
- [x] **Sincronización SemVer Global:** `v1.28.0` (Build 12800) en manifiestos, FAQ, Acerca de y documentación.

---

## Historial Completo de Versiones

### 📦 v1.27.0 (Completado)
- [x] Nómina Real del Mes desde Dashboard: Selector en `+ Ingreso` para fijar la nómina como salario neto real blindado del mes (`monthlySalaries`) que sustituye el valor base sin duplicarse como ingreso extra.
- [x] Imputación Inteligente de Salario (Día ≥ 20): Sugerencia automática del mes financiado (día ≥ 20 financia el mes siguiente; día < 20 financia el mes en curso) con acceso rápido `⏩ Mes +1`.
- [x] Auto-categorización en Nuevo Gasto: Evaluación en tiempo real de `SmartRules` para auto-asignar la bolsa y clasificar facturas con IVA.
- [x] Detección y Vinculación de Cargos Recurrentes: Detección de coincidencias por importe (±0.01 €) o título, marcando `completedDates` y purgando cobros duplicados automáticos.
- [x] Historial Reversible y Segregado: Consulta y eliminación individual de nóminas blindadas para restablecer el salario base por defecto en 1 toque.
- [x] Sincronización SemVer Global: `v1.27.0` (Build 12700) en manifiestos, FAQ, Acerca de y documentación.

### 📦 v1.26.0 (Completado)
- [x] Ajustes Puntuales Acotados por Mes: Reequilibrio de sobregiros y vasos comunicantes asignados exclusivamente al mes seleccionado (`YYYY-MM`).
- [x] Límites Maestros Base 100% Inmutables: Los meses siguientes conservan sus techos base originales sin contaminación cruzada.
- [x] Insignias y Desglose Informativo: Distintivo `⚡ Puntual (+X € / -X €)` y notas de límite base en tarjetas de bolsas.
- [x] Botones de Retrocesión en 1 Toque: Reversión individual por bolsa y reversión global para todo el mes seleccionado.
- [x] Sincronización en Motor Presupuestario: `BudgetCapacityService` calcula la capacidad real respetando ajustes puntuales.

### 📦 v1.25.0 (Completado)
- [x] Imputación a Bolsa del Mes Siguiente (Dual Date): Fecha física de pago vs mes efectivo de imputación a bolsa.
- [x] Selector Rápido "⏩ Mes +1" en gastos manuales y extracto bancario.
- [x] Insignias informativas y conciliación con doble paso de conformidad.
- [x] Blindaje tipográfico anti-desborde en vista vertical.

### 📦 v1.24.0 (Completado)
- [x] Direccionamiento de Ingresos a Bolsas (Inyecciones y Reembolsos).
- [x] Reembolso / Compensación de Gastos (Bizums y Devoluciones).
- [x] Inyecciones a Presupuesto (Top-Up) sin dilución en el gasto diario.
- [x] Integración en Importador Bancario (CSV / Excel).
- [x] Servicio desacoplado `IncomeAllocationService` anti-doble cómputo.

### 📦 v1.23.0 (Completado)
- [x] Balance de Presupuesto Real (Zero-Based Envelopes) comparando capacidad de ingresos y límites de bolsas.
- [x] Detección Instantánea de Sobre-presupuesto y Margen Libre con alertas cromáticas.
- [x] Alternador Inmediato Mes en Curso / Mes Siguiente.
- [x] Simulador en Vivo en Modal Crear/Editar Bolsa.
- [x] Telemetría en Grafo de Arquitectura y corrección de contraste en modo oscuro.

### 📦 v1.22.0 (Completado)
- [x] Modo Claro Nativo & Volteado Semántico Completo en el 100% de la aplicación.
- [x] Selector de Tema Visual en Configuración (Sistema / Claro / Oscuro) con previsualización en vivo.
- [x] Calibración de contraste y semáforos contables según WCAG AA.
- [x] Coordinación con Barra de Estado del Dispositivo Android y meta theme-color.

### 📦 v1.21.0 (Completado)
- [x] Segmentación Desplegable en Configuración por subsecciones temáticas.
- [x] Nóminas Mensuales Blindadas (Manual y Extracto) por mes sin duplicar ingresos.
- [x] Tarjetas de Importación Bancaria Perfeccionadas con contenedor independiente y padding óptimo.
- [x] Reordenación Drag & Drop con Pestaña Lateral Táctil en Categorías, Bolsas y Recurrentes.
- [x] Limpieza Visual y Desahogo Estético de Banners obsoletos.

### 📦 v1.20.0 (Completado)
- [x] Gestor Dinámico de Categorías Funcionales (CRUD Completo y Borrado Seguro Anti-Huérfanos).
- [x] Integridad Referencial y Reasignación Obligatoria al eliminar categorías en uso.
- [x] Fallback Defensivo en Renderizado ("General" con icono neutro).
- [x] Personalización con 40 iconos vectoriales oficiales de `lucide-react` y 16 colores.
- [x] Catálogo Base Oficial y Restablecimiento en 1 toque.

### 📦 v1.19.0 (Completado)
- [x] Navegación Mensual y Totales por Mes en Bolsas.
- [x] Proyección Anual de Bolsas (12x límite asignado vs consumo anual).
- [x] Trasvase de Remanente Acumulable (Sinking Fund en Bolsa).
- [x] Categoría Funcional "Futuro Financiero" para Inversiones.
- [x] Categorías Funcionales Expandidas y Catálogo de 40 Iconos Lucide.

### 📦 v1.18.0 (Completado)
- [x] 10 Nuevos Iconos Lucide (Inversión & Coleccionismo) en Bolsas y Metas.
- [x] Paleta Cromática Ampliada a 16 Colores seleccionables.
- [x] Motor de Ordenación de Bolsas (manual con controles táctiles, alfabético, límite).
- [x] Motor de Ordenación de Recurrentes (8 criterios de ordenación con cifrado AES-GCM).
- [x] Persistencia de Preferencias de Ordenación en `localStorage`.

### 📦 v1.17.0 (Completado)
- [x] Motor de Cobro Automático por Defecto (`RecurringEngineService`) y reversión en 1 toque.
- [x] Procesamiento Manual con Alerta "⚠️ No pagado" y dot de atención visual en Calendario.
- [x] Cese Limpio de Recurrencias con fecha de cese a hoy y pestaña de compromisos históricos.
- [x] Historial Contable Inmutable al modificar tarifas o cuotas futuras.
- [x] Fecha de Inicio Canónica (`startDate`) desacoplada de la fecha de registro.
- [x] Sincronización Asistida de Frecuencia y protección contra deducciones prematuras en Safe-to-Spend.
- [x] Blindaje del Ciclo de Vida WebView (Anti-Expulsión en selector SAF y Google Drive).
- [x] Sobreescritura Atómica en Ranura 1 y persistencia de sesión al restaurar copias de seguridad.

### 📦 v1.16.0 (Completado)
- [x] Intervalos Personalizados en Recurrentes cada $X$ semanas o meses.
- [x] Importador Universal Bancario Excel (.xlsx / .xls) y CSV con omisión dinámica de preámbulo.
- [x] Deduplicación Bidireccional de Ingresos y Gastos con doble cotejo SHA-256.
- [x] Bóveda Cifrada Local en Reposo (AES-GCM-256) con Web Crypto API en IndexedDB.

### 📦 v1.15.0 (Completado)
- [x] Desbloqueo Biométrico Obligatorio en Arranque (`androidx.biometric:1.1.0`) y teclado PIN táctil de respaldo.
- [x] Diálogo Seguro de Confirmación de Salida con intercepción del botón Atrás de Android y `@capacitor/app`.
- [x] Modo Privacidad en Calendario con ofuscación de saldo proyectado a fin de mes (`••••`).
- [x] Navegación Ergonómica de Calendario con selector de mes/semana sobre los días del mes.
- [x] Ciclo de Vida de Tareas y Marcado "Completada hoy" con registro atómico por fecha (`completedDates`).
- [x] Centralización de Iconografía Oficial y Verticons en Ajustes & Personalización.
- [x] Rediseño Ergonómico de Metas & Sinking Funds con KPIs de bajo perfil y botón de borrado directo.
- [x] Sistema de Tareas Recurrentes con tipología de costes (`fixed`, `estimated`, `none`) y categorías funcionales (`bill`, `subscription`, `tax`, `health`, `maintenance`, `personal`).
- [x] Preavisos escalonados multietapa (mismo día, 1-3 días, 1-2 semanas, 1 mes, 90 días) y canal nativo `crono_tasks_alerts`.
- [x] Desplazamiento dinámico y adaptativo de fechas futuras (`autoAdaptNextDates`) al cumplir tareas en días alternativos.
- [x] Modal interactivo "Confirmar / Ajustar Coste" (`ConfirmRecurringExpenseModal.tsx`) y plazos fiscales AEAT.

### 📦 v1.13.0 (Completado)
- [x] Skill Global Obligatoria (`app-about-changelog`) y manifiesto declarativo de usuario (`changelog.user.json`).
- [x] Componente interactivo `AboutModal.tsx` con historial humano y enlace al monitor de salud del stack.
- [x] Integración en Ajustes (`SettingsModal.tsx`) con acceso unificado.

### 📦 v1.12.0 (Completado)
- [x] Servicio de Cálculo Fiscal Trimestral (`taxService.ts`) con plazos AEAT y simulador Mod. 130 / Mod. 303.
- [x] Generador de Informes Ejecutivos en PDF (`pdfReportService.ts`) y Libro de Facturas en CSV.
- [x] Modal Interactivo de Informes & Fiscalidad (`ReportsModal.tsx`) y soporte de compartir nativo Android.

### 📦 v1.11.0 (Completado)
- [x] Motor de Ritmo de Crucero (`sinkingFundsService.ts`) y Blindaje Safe-to-Spend.
- [x] Asistente "Sweep & Fund" (`SweepSurplusModal.tsx`) y Persistencia IndexedDB v3 (`db.ts`).
- [x] Suite de UI para Metas (`GoalsModal.tsx`, `GoalFormModal.tsx`, `QuickContributeModal.tsx`).
- [x] Compilación y firma release dual v1.11.0 (`versionCode 11100`).

### 📦 v1.10.0 (Completado)
- [x] Parser Bancario Heurístico (`csvImporterService.ts`) y Deduplicador Criptográfico SHA-256.
- [x] Motor de Reglas Inteligentes (`SmartRulesModal.tsx`) y Bandeja de Entrada Pre-Asentamiento (`CsvImportModal.tsx`).
- [x] Compilación y firma release dual v1.10.0 (`versionCode 11000`).

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
