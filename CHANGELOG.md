# Changelog — CronoCash 📝

Todas las modificaciones notables en este proyecto serán documentadas en este archivo.
El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y este proyecto se adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.28.0] - 2026-10-01

### Added
- **Snapshot Integral en Copias de Seguridad (`GoogleDriveBackupService` & `BackupModal.tsx`):**
  - **Inclusión de Metas de Ahorro y Reglas Inteligentes:** Las exportaciones a Google Drive (ranuras `CronoCash_Actual.json` y `CronoCash_Previa.json`) y las descargas JSON locales empaquetan íntegramente las colecciones `savingsGoals` y `smartRules`.
  - **Métricas e Inspección Previa:** Extracción de `savingsGoalsCount` y `smartRulesCount` tanto en paquetes modernos v1.5.0 como en envelopes tradicionales v1.0.0.
  - **Matriz Comparativa Lado a Lado (Side-by-Side):** Nuevas filas dedicadas a *"Metas / Fondos"* y *"Reglas Smart"* con cálculo dinámico de deltas (`+` / `-`) para verificar visualmente los cambios antes de ejecutar la restauración.
- **Blindaje Anti-Sobreescritura e Inmutabilidad de Semillas (`DBService`):**
  - **Tombstone de Inicialización (`hasEverSeeded` & `hasSeededDefaults`):** Protección de persistencia que impide la re-inyección automática de semillas de fábrica (`DEFAULT_SAVINGS_GOALS_SEEDS`, `INITIAL_SMART_RULES`, `DEFAULT_BUCKETS`) al abrir la base de datos o instalar nuevas versiones/actualizaciones de la APK.
  - **Respeto a Eliminaciones Voluntarias:** `getSavingsGoals()` devuelve limpiamente `[]` cuando el usuario ha purgado sus metas, eliminando la resurrección no deseada de metas borradas.
  - **Restauración Atómica (`clearAndRestore`):** Purga y sobreescritura atómica garantizada en IndexedDB y `localStorage` incluso con arrays vacíos (`length === 0`).
  - **Importación Canónica (`importBackupEnvelope`):** Sincronización íntegra y delegación en `clearAndRestore` para evitar mezclar semillas previas con copias importadas.
- **Carga Voluntaria de Plantilla Oficial de Metas (`GoalsModal.tsx`):**
  - **Botón "Plantilla" en Toolbar y Estado Vacío:** Permite incorporar o restaurar las metas recomendadas (Fondo de Emergencia, Mantenimiento Hogar, Averías/Imprevistos) en cualquier momento mediante `DBService.applySavingsGoalsSeeds('append' | 'replace')` sin destruir las metas personalizadas existentes.
  - **Defensiva Anti-Desborde:** Clases de contención elástica (`min-w-0 flex-1 truncate shrink-0`) para evitar solapamientos o desbordes verticales en pantallas estrechas.

## [1.27.0] - 2026-10-01

### Added
- **Nómina Real Blindada del Mes (`monthlySalaries`) y Conexión de Ingresos:**
  - **Selector de Modo en `ExtraIncomeModal.tsx`:** Conmutador interactivo entre `[ 🏦 Nómina del Mes | 🎁 Ingreso Extra ]`.
  - **Criterio Inteligente de Imputación (Día ≥ 20):** Al registrar la nómina percibida, el sistema sugiere financiar el mes siguiente (`YYYY-MM+1`) si el cobro ocurre a partir del día 20, o el mes en curso si se cobra antes.
  - **Acceso Rápido `⏩ Mes +1`:** Permite desplazar la fecha de cobro al primer día del mes siguiente con 1 solo toque.
  - **Cálculo en `Dashboard.tsx`:** Sustitución del salario base estático por `DBService.getEffectiveMonthlySalary(settings, currentMonthPrefix)`, garantizando que el saldo disponible, el Safe-to-Spend y el margen del mes reflejen la nómina real blindada sin duplicarse con ingresos extras.
  - **Historial Unificado y Reversible:** Gestión de nóminas blindadas (`monthlySalaries`) con identificación de origen (Manual o Extracto Bancario) y botón de retrocesión individual para restaurar el salario base por defecto.
- **Auto-categorización Inteligente y Detección de Recurrentes en `ExpenseModal.tsx`:**
  - **Evaluación en Vivo de `SmartRules`:** Al escribir el concepto o título del gasto, la app evalúa en tiempo real las reglas inteligentes activas (`startsWith`, `contains`, `exact`, `regex`) para auto-asignar la bolsa de presupuesto adecuada y conmutar el estado de factura con IVA.
  - **Detección Heurística de Coincidencias con `RecurringRules`:** Compara importe ($\pm 0.01$ €) y título/concepto con las reglas periódicas activas.
  - **Vinculación y Supresión de Duplicados en `App.tsx`:** Checkbox para vincular el gasto a la regla recurrente (`recurringRuleId`), agregando la fecha del desembolso a `completedDates` y purgando automáticamente cualquier cargo automático pre-generado duplicado en el mismo mes.

## [1.26.0] - 2026-09-30

### Added
- **Ajustes Puntuales de Bolsas por Mes (Vasos Comunicantes & Sobregiros sin Contaminar Meses Futuros):**
  - **Modelado en `Bucket` (`src/types/index.ts`):**
    - Nuevo campo canónico `monthlyAdjustments?: Record<string, number>` indexado por clave de mes (`YYYY-MM`).
    - Función pura `getBucketMonthLimit(bucket: Bucket, monthPrefix?: string): number` que computa el límite mensual efectivo (`budgetLimit + adjustment`) sin alterar el límite maestro template `bucket.budgetLimit`.
  - **Métodos Atómicos en `DBService` (`src/services/db.ts`):**
    - `transferBucketMonthlyBalance(fromId, toId, amount, monthPrefix)`: Trasvase puntual de vasos comunicantes acotado a un mes con suma cero ($\sum \Delta = 0$).
    - `revertBucketMonthlyAdjustment(bucketId, monthPrefix)`: Retrocesión/eliminación del ajuste puntual de una bolsa para un mes concreto, devolviéndola limpiamente a su límite base maestro.
    - `revertAllMonthlyAdjustments(monthPrefix)`: Retrocesión atómica de todos los ajustes puntuales del mes seleccionado.
    - Delegación automática en `transferBucketBalance` cuando se suministra `monthPrefix`.
  - **Asistente de Sobregiro Acotado (`CoverOverspendingModal.tsx`):**
    - Al reequilibrar sobregiros mediante colchón, bolsa con mayor superávit o prorrateo proporcional, escribe exclusivamente en `monthlyAdjustments[targetMonthPrefix]`, garantizando que los meses siguientes conserven sus parámetros originales inalterados.
  - **Integración Visual y Botones de Retrocesión en `BucketsView.tsx`:**
    - Indicador visual `⚡ Puntual (+X € / -X €)` en tarjetas de bolsas calibradas con tooltip detallado.
    - Botón de retrocesión individual `↩` en cada tarjeta de bolsa para restaurar su límite base en 1 toque.
    - Banner interactivo de ajustes puntuales activos con botón global `↩ Revertir Ajustes` para todo el mes.
    - Modal de Vasos Comunicantes actualizado con nota explicativa sobre calibración puntual y desglose del límite del mes.
  - **Sincronización en `BudgetCapacityService` (`src/services/budgetCapacityService.ts`):**
    - Cálculo de capacidad presupuestaria y asignación real usando `getBucketMonthLimit(b, monthKey)`.

## [1.25.0] - 2026-09-30

### Added
- **Imputación Dual de Gastos (Dual Date: Fecha de Origen / Pago vs Mes Efectivo de Imputación a Bolsa):**
  - **Modelado en `Expense` (`src/types/index.ts`):**
    - Nuevo campo canónico opcional `effectiveMonth?: string` (formato `YYYY-MM`).
    - Función pura `getExpenseEffectiveMonth(expense: Expense): string` que retorna `effectiveMonth` si está presente, o `date.substring(0, 7)` como fallback defensivo.
  - **Modal de Creación y Edición de Gastos (`ExpenseModal.tsx`):**
    - Selector ergonómico de imputación presupuestaria con botón de acceso rápido *"⏩ Mes +1"* y selector de mes nativo (`<input type="month">`).
    - Botón de restablecimiento al mes de compra real.
    - Sincronización automática de fecha física de desembolso con el mes contable cuando no se personaliza.
  - **Sincronización Integral en Bolsas de Presupuesto (`BucketsView.tsx`, `BucketMovementsModal.tsx`, `CoverOverspendingModal.tsx`):**
    - Filtrado de gastos mensuales y anuales por `getExpenseEffectiveMonth(e) === monthPrefix`.
    - En el desglose de movimientos de bolsa (`BucketMovementsModal.tsx`), las compras imputadas a otro mes muestran el distintivo explicativo: `🗓️ Compra DD/MM -> Imputado a Mes`.
    - Los asistentes de sobregiro respetan el mes efectivo de imputación contable.
  - **Integración en Importador Bancario (`CsvImportModal.tsx`):**
    - Nuevo conmutador por fila para gastos que permite imputar directamente al mes entrante (`⏩ Imputa al Mes +1`) antes de asentar en la base de datos.
    - Persistencia automática de `effectiveMonth` en los gastos importados.
  - **Calendario Reactivo (`CalendarView.tsx`):**
    - Los gastos mantienen su presencia física en el día en que se produjo la salida de dinero, incorporando la insignia `⏩ Imputado YYYY-MM` en el detalle diario para total transparencia de liquidez y contabilidad.
- **Protección Táctil con Doble Paso de Conformidad:**
  - En `BucketMovementsModal.tsx`, la eliminación de gastos y conciliación de movimientos bancarios duplicados con recibos recurrentes implementa confirmación estricta en dos pasos para salvaguardar la integridad de las reglas y evitar toques accidentales en pantallas móviles.
- **Blindaje Visual Anti-Desborde y Anti-Sobreposición:**
  - Arquitectura defensiva flexbox (`min-w-0 flex-1`, `truncate`, `shrink-0`, `flex-wrap`) para impedir colisiones o desbordes de texto en orientaciones verticales o pantallas reducidas.

## [1.24.0] - 2026-09-30

### Added
- **Direccionamiento de Ingresos a Bolsas (Inyecciones de Presupuesto y Reembolsos de Gastos):**
  - **Servicio Desacoplado `IncomeAllocationService` (`src/services/incomeAllocationService.ts`):**
    - Métodos puros para calcular inyecciones temporales de límite (`getBucketInjectedBudget`) y reembolsos de gasto (`getBucketRefunds`).
    - Exclusión automática de reembolsos en los ingresos brutos del mes para evitar el doble cómputo en `BudgetCapacityService` y `SafeToSpendService`.
  - **Modelado en `ExtraIncome` (`src/types/index.ts`):**
    - Campos opcionales no invasivos `targetBucketId?: string` y `allocationMode?: 'general' | 'bucket_budget' | 'bucket_refund'`.
  - **Modal de Ingresos Extras (`ExtraIncomeModal.tsx`):**
    - Selector desplegable para destinar un ingreso extra directamente a una bolsa de presupuesto existente.
    - Selector de modo: 🚀 *Inyección Presupuestaria* (incrementa el techo de la bolsa) vs 🔄 *Reembolso / Compensación* (minora directamente los gastos registrados en la bolsa, ideal para Bizums y devoluciones).
    - Visualización de insignias de asignación a bolsa en el listado de ingresos registrados.
  - **Visualización y Cuadre Contable en Bolsas (`BucketsView.tsx`):**
    - Cálculo de gasto neto (`grossSpent - refunds`) y límite efectivo ajustado (`budgetLimit + surplus + injected`).
    - Insignias dinámicas en las tarjetas de bolsas: `Extra +X €` y `Reembolso -X €`.
    - Desglose contable transparente de gasto neto y reembolsos recibidos.
  - **Integración en Importador de Extractos Bancarios (`CsvImportModal.tsx`):**
    - Clasificación con 1 solo toque de transferencias o cobros entrantes como reembolsos o inyecciones a bolsas directamente desde el extracto bancario CSV / Excel.

## [1.23.0] - 2026-09-30

### Added
- **Control de Capacidad Presupuestaria y Asignación de Ingresos a Bolsas (Zero-Based Envelopes):**
  - **Motor de Balance Presupuestario (`budgetCapacityService.ts`):** Servicio reactivo para calcular la capacidad presupuestaria mensual y anual, confrontando el salario real/base y los ingresos extras del mes con la suma total de límites de bolsas.
  - **Widget de Balance de Presupuesto Real en Bolsas (`BucketsView.tsx`):**
    - Desglose trilateral: Ingresos Estimados del Mes vs Límite Total en Bolsas vs Margen Libre o Sobre-presupuestado.
    - Detección visual automática: Alertas en tono rojo/rosa ante sobresignación de presupuesto (ej. bolsas de 2.000 € con ingresos de 1.500 € = +500 € excedido) y tono esmeralda cuando existe margen libre para asignar o ahorrar.
    - Barra de progreso de asignación porcentual sobre ingresos con semáforo cromático.
    - Selectores rápidos de 1 toque: `[ Mes en curso ]` y `[ Mes siguiente ]` para auditar la holgura financiera en ambos horizontes temporales de forma inmediata.
  - **Simulador en Tiempo Real en Modal Crear/Editar Bolsa (`BucketsView.tsx`):**
    - Píldora interactiva bajo el campo de límite mensual que recalcula en vivo cómo impactará el nuevo valor en el presupuesto global del mes (si superará los ingresos o cuánto margen libre quedará).
  - **Telemetría de Salud Presupuestaria en Grafo de Arquitectura (`AppArchitectureGraph.tsx`):**
    - Monitoreo en tiempo real del balance ingresos vs bolsas en el nodo de persistencia IndexedDB.

## [1.22.0] - 2026-09-30

### Added
- **Modo Claro Nativo Integral (Light Mode) con Volteado Semántico Completo:**
  - **Motor de Temas (`themeService.ts`):** Servicio reactivo para gestión y alternancia de temas (`system` | `light` | `dark`), con persistencia cifrada en `Settings`, actualización atómica de clases `.dark` / `.light` en `document.documentElement`, `.dark-theme` / `.light-theme` en `body`, `<meta name="theme-color">` y control del StatusBar de Capacitor.
  - **Sincronización Automática con Sistema:** Detección y escucha activa de `prefers-color-scheme: dark` para cambiar dinámicamente según la preferencia del sistema operativo cuando está en modo `system`.
  - **Selector de Tema Visual en Configuración (`SettingsModal.tsx`):** Selector de 3 botones en la subsección Preferencias con vista previa instantánea sin recarga.
  - **Adaptación Visual Exhaustiva en Todos los Módulos:**
    - **Navegación y Cabeceras:** `Header.tsx`, `BottomNav.tsx`, `App.tsx` y `index.html`.
    - **Dashboard y Transacciones:** `Dashboard.tsx`, `SafeToSpendWidget.tsx`, `ExpenseModal.tsx`, `ExtraIncomeModal.tsx`, `ExitConfirmModal.tsx`.
    - **Bolsas y Metas:** `BucketsView.tsx`, `CoverOverspendingModal.tsx`, `GoalsModal.tsx`, `GoalFormModal.tsx`, `SweepSurplusModal.tsx`, `QuickContributeModal.tsx`.
    - **Recurrentes y Calendario:** `RecurringView.tsx`, `FunctionalCategoriesModal.tsx`, `ConfirmRecurringExpenseModal.tsx`, `CalendarView.tsx`.
    - **Modales del Sistema:** `BackupModal.tsx`, `CsvImportModal.tsx`, `SmartRulesModal.tsx`, `ReportsModal.tsx`, `FAQModal.tsx`, `AboutModal.tsx`, `AppArchitectureGraph.tsx`.
  - **Accesibilidad y Contraste WCAG AA:** Semáforos contables legibles (verde esmeralda, ámbar y carmesí con luminosidad calibrada para fondos blancos y oscuros), contrastes tipográficos nítidos y selectores de fecha nativos con selector adaptativo.

## [1.21.0] - 2026-09-29

### Added
- **Reordenación Drag & Drop con Pestaña Lateral Táctil (`useTouchSortable.ts`, `FunctionalCategoriesModal.tsx`, `BucketsView.tsx`, `RecurringView.tsx`):**
  - **Hook Universal `useTouchSortable`:** Motor de reordenación basado en Pointer Events y captura (`setPointerCapture`) con soporte unificado para pantallas táctiles móviles (Android APK / Capacitor) y ordenadores de escritorio (ratón).
  - **Pestaña Lateral de Agarre Dedicada:** Cada tarjeta (Categoría, Bolsa y Recurrente en modo manual) cuenta con un tirador vertical estilizado en su lateral izquierdo con icono 100% Lucide `GripVertical`.
  - **Aislamiento de Scroll Móvil (`touch-action: none`):** Previene interferencias con el scroll vertical de la pantalla en dispositivos táctiles, activando el arrastre únicamente al presionar la pestaña lateral.
  - **Feedback Háptico y Visual Flotante:** Emisión de vibración táctil al iniciar el agarre (`HapticService.selection()`), elevación de la tarjeta con sombra profunda y aro luminoso, e inserción dinámica en la posición destino.
  - **Persistencia Atómica Inmediata:** Al soltar la tarjeta se confirma la ordenación con vibración de éxito (`HapticService.notificationSuccess()`) y se sincroniza instantáneamente en IndexedDB.

### Removed
- **Limpieza de Badge Residual en Informes y Fiscalidad (`ReportsModal.tsx`):**
  - Eliminado el banner residual de versión `v1.12.0` de la cabecera para mantener la interfaz despejada y profesional.

## [1.20.0] - 2026-09-29

### Added
- **Gestor Dinámico de Categorías Funcionales (`FunctionalCategoriesModal.tsx`, `types/index.ts`, `services/db.ts`):**
  - **CRUD Completo de Categorías:** Ventana modal interactiva para Crear, Editar, Eliminar y Reordenar categorías para los compromisos y actos periódicos.
  - **Integridad Referencial y Borrado Seguro Anti-Huérfanos:** Detección de compromisos vinculados antes de eliminar una categoría con diálogo obligatorio para reasignarlos a una categoría de destino existente.
  - **Fallback Defensivo en Renderizado:** Protección integral ante IDs de categoría desconocidos o eliminados, renderizando bajo la etiqueta "General" con icono neutro sin generar errores.
  - **Personalización Visual:** Asignación de cualquiera de los 40 iconos vectoriales oficiales de `lucide-react` y de los 16 colores de la paleta.
  - **Catálogo Base Oficial y Función Restablecer:** Las 12 categorías nativas vienen respaldadas por el sistema (`isSystem: true`) con botón de restauración a valores canónicos.
  - **Integración Transversal y Persistencia:** Almacenamiento seguro en `Settings` cifrado con AES-GCM en reposo, compatible con backups de 2 ranuras en Google Drive y JSON local.
  - **Acceso Rápido Ergonómico:** Botón "Categorías" en la cabecera de Recurrentes y acceso directo "Gestionar Categorías" junto al selector desplegable en el formulario de regla recurrente.

## [1.19.0] - 2026-09-29

### Added
- **Navegación Mensual y Totales por Mes en Bolsas (`BucketsView.tsx`):**
  - **Barra de Navegación Temporal:** Selector interactivo mes a mes con botones `ChevronLeft`, `ChevronRight` y acceso rápido a "Hoy", formateado en español con `date-fns`.
  - **Cálculo de Totales por Periodo:** Filtrado dinámico de los gastos del mes seleccionado para comparar el límite mensual asignado con el consumo real exacto de dicho periodo.

- **Proyección Anual de Bolsas de Presupuesto (`BucketsView.tsx`):**
  - **Selector de Modo de Vista (`viewMode`):** Alternador en 1 toque entre `Mes` y `Proyección Anual`.
  - **Cálculo de Asignación y Consumo Anual:** Proyección del límite total presupuestado a 12 meses frente al total consumido en el año natural en curso, mostrando el remanente disponible proyectado y porcentaje de ejecución.

- **Trasvase de Remanente Acumulable (Sinking Fund en Bolsa) (`BucketsView.tsx`, `types/index.ts`, `services/db.ts`):**
  - **Configuración Opcional por Bolsa:** Nuevos atributos `rolloverSurplus?: boolean` y `accumulatedSurplus?: number` en el modelo `Bucket`.
  - **Protección en Rollover Mensual:** En `DBService.executeMonthlyRollover`, las bolsas con Sinking Fund retienen su remanente positivo en lugar de transferirlo al Colchón general, sumándolo a su propio saldo acumulado.
  - **Límite Efectivo Dinámico:** El límite visible y computable de la bolsa incluye la suma de su asignación mensual más el remanente acumulado transferido de meses previos, identificado con badge esmeralda `Hucha Sinking Fund`.
  - **Control en Modal de Edición:** Checkbox táctil y campo numérico para consultar o ajustar el remanente acumulado.

- **Categoría Funcional "Futuro Financiero" para Inversiones (`RecurringView.tsx`, `types/index.ts`):**
  - **Categoría de Primer Nivel:** Incorporación del tipo `financial_future` destinado a inversiones, planes de ahorro sistemático, jubilación y compras patrimoniales.
  - **Icono Vectorial Lucide:** Representación visual con `TrendingUp` en badges, modales y listas.

- **Categorías Funcionales Expandidas y Catálogo de 40 Iconos Lucide (`RecurringView.tsx`):**
  - **Ampliación Integral:** Adición de categorías estándar `insurance` (Seguros), `education` (Educación), `transport` (Transporte), `leisure` (Ocio) y `donation` (Donaciones) junto a las existentes (`bill`, `subscription`, `tax`, `health`, `maintenance`, `personal`).
  - **Jerarquía y Ordenación:** Soporte completo en el motor de ordenación jerárquico y alfabético por categoría.
  - **Iconografía 100% Lucide React:** Ampliación a 40 iconos vectoriales (`ShieldCheck`, `GraduationCap`, `HeartHandshake`, `BookOpen`, `Wifi`, `Tv`, `Building2`, `Key`, `Pill`, `Eye`, `Fuel`, `Bus`, `Train`, `Scissors`, `Dumbbell`, `FileCheck`, etc.).

## [1.18.0] - 2026-09-29

### Added
- **Iconos Lucide para Inversiones y Figuras de Coleccionismo (`BucketsView.tsx`):**
  - **10 Iconos Temáticos Oficiales:** Adición de `TrendingUp`, `Coins`, `LineChart`, `Landmark`, `Gem` (para finanzas, inversión, bolsa y patrimonio) y `Bot`, `Gamepad2`, `Package`, `Trophy`, `Crown` (para coleccionismo, figuras, hobbies y gaming).
  - **Selector Modal Expandido:** Rejilla responsiva con scroll suave adaptada a móviles para seleccionar con comodidad cualquiera de los iconos sin desbordamientos de pantalla.
  - **Cumplimiento Estricto de Iconografía:** Todos los iconos nuevos y existentes provienen exclusivamente de `lucide-react`.

- **Paleta Cromática Ampliada a 16 Colores Distintivos (`BucketsView.tsx`, `GoalFormModal.tsx`):**
  - **7 Nuevos Tonos Seleccionables:** Inclusión de Índigo (`#6366f1`), Violeta (`#a855f7`), Lima (`#84cc16`), Oro (`#eab308`), Fucsia (`#d946ef`), Verde Bosque (`#14532d`) y Azul Cielo (`#0284c7`).
  - **Sincronización Transversal:** Paleta idéntica de 16 colores aplicada tanto a las Bolsas de presupuesto como a las Metas de Ahorro y Sinking Funds.

- **Motor de Ordenación y Reordenación Manual de Bolsas (`BucketsView.tsx`, `types/index.ts`, `services/db.ts`):**
  - **Modelo y Persistencia Local:** Atributo opcional `order?: number` en la interfaz `Bucket` y método atómico `DBService.updateBucketsOrder()` para consolidar el orden en IndexedDB.
  - **Controles Táctiles con Feedback Háptico:** Botones interactivos `ChevronUp` y `ChevronDown` en cada tarjeta de bolsa en modo manual con vibración háptica al cambiar de posición.
  - **Criterios de Ordenación:** Selector con modos de orden manual, alfabético (A-Z y Z-A) y por límite asignado (mayor o menor).
  - **Persistencia de Preferencia:** La opción seleccionada se guarda en `localStorage` (`cronocash_buckets_sort_mode`) para recordarse entre sesiones.

- **Motor de Ordenación Multicriterio de Gastos Recurrentes (`RecurringView.tsx`, `types/index.ts`, `services/db.ts`):**
  - **Modelo y Cifrado AES-GCM en Reposo:** Atributo `order?: number` en `RecurringRule` y método `DBService.updateRecurringRulesOrder()` que cifra individualmente cada regla con la clave maestra de la bóveda antes de escribir en IndexedDB.
  - **8 Modos de Ordenación:** Próximo cobro (inminente), orden manual personalizado, categoría jerárquica (Recibos, Suscripciones, Impuestos, Salud, Mantenimiento, Personal), categoría alfabética (A-Z), título alfabético (A-Z y Z-A) y mayor o menor importe.
  - **Barra de Herramientas Ergonómica:** Selector desplegable con icono `ArrowUpDown` y botones de reordenación táctil en modo manual.
  - **Persistencia de Preferencia:** Almacenamiento persistente en `localStorage` (`cronocash_recurring_sort_mode`).

## [1.17.0] - 2026-09-29

### Added
- **Motor de Cobro Automático por Defecto y Reversión en 1 Toque (`recurringEngineService.ts`, `App.tsx`, `CalendarView.tsx`):**
  - **Cobro Idempotente al Vencimiento:** Al cumplirse la fecha de una regla recurrente, el nuevo `RecurringEngineService` genera automáticamente el gasto real en la base de datos sin requerir interacción manual del usuario.
  - **Reversión Inmediata:** Acción de reversión en el Calendario y desglose diario para anular cobros automáticos erróneos o modificados, eliminando el gasto y restaurando el compromiso en la regla.
  - **Selector de Modalidad:** Configuración en cada regla entre *⚡ Cobro Automático (Por defecto)* y *✋ Procesamiento Manual*.

- **Procesamiento Manual con Alerta Destacada de No Pagado (`RecurringView.tsx`, `CalendarView.tsx`):**
  - **Detección de Impagos:** Si una regla manual alcanza o supera su fecha sin que el usuario confirme el pago, se marca con badge de advertencia *"⚠️ No pagado"* en rojo/ámbar.
  - **Puntos de Alerta en Calendario:** Visualización de dots de atención animados en las celdas del calendario para los días con recibos manuales vencidos no abonados.
  - **Botón Directo "Pagar Ahora":** Botón de acción rápida en tonos rosa/rojo en Calendario y Recurrentes para regularizar el cobro pendiente al instante.

- **Cese de Recurrencias y Pestaña de Históricas (`RecurringView.tsx`, `safeToSpendService.ts`):**
  - **Baja Limpia con Fecha de Cese:** Botón de acción para cesar un compromiso recurrente fijando su `endDate` a la fecha actual y `isActive: false`, deteniendo proyecciones futuras en Calendario y Safe-to-Spend.
  - **Pestañas de Filtrado de Estado:** Selector entre *Activas*, *Cesadas / Históricas* y *Todas* con contadores en tiempo real.
  - **Opción de Reactivación:** Botón *"Reactivar"* en compromisos cesados para volver a computarlos a partir de la fecha de hoy con un solo toque.

- **Historial Contable Inalterable y Preservación de Importes Pasados (`RecurringView.tsx`, `safeToSpendService.ts`):**
  - **Independencia Histórica:** Modificar el importe o cuota de una regla afecta exclusivamente a los cobros venideros; los gastos ya registrados en la base de datos conservan inalterado su importe histórico.
  - **Micro-copy de Garantía:** Mensaje explicativo en el formulario modal para informar al usuario de que los cambios de tarifa no distorsionan la contabilidad pasada.

- **Fecha de Inicio Canónica y Desacoplamiento de Registro en Gastos Recurrentes (`RecurringView.tsx`):**
  - **Campo `startDate` explícito y editable:** Capacidad de definir la fecha real de origen o devengo de cualquier gasto o tarea recurrente (`<input type="date">`), desvinculando por completo el inicio contable del compromiso del día en que se registra en la aplicación.
  - **Sincronización asistida no intrusiva:** Al elegir una fecha de inicio, la app recomienda y sincroniza reactivamente el día del mes (`dayOfMonth`) o mes del año (`monthOfYear`), permitiendo personalización manual sin bloqueos.
  - **Insignias y Metadatos en Lista de Reglas:** Muestra de "Inicio: DD/MM/AAAA", insignia visual *"Programada"* en tonos violeta para compromisos futuros, y badges informativos de recurrencia.

- **Protección Safe-to-Spend, Calendario Reactivo y Anclaje de Intervalos (`RecurringView.tsx`, `CalendarView.tsx`, `safeToSpendService.ts`, `notificationService.ts`):**
  - **Blindaje contra deducciones prematuras:** El motor de Safe-to-Spend (`calculate`) descarta reglas cuyo `startDate` pertenezca a un mes futuro, protegiendo el saldo diario de gastos no vigentes.
  - **Proyecciones estrictas en Calendario:** `monthlyRecurringTotal` y el renderizado diario ignoran reglas cuya vigencia no haya comenzado o haya expirado.
  - **Anclaje de Intervalos:** Las frecuencias elásticas cada $X$ semanas o meses pivotan de manera inmutable sobre `startDate`.
  - **Alarmas y Notificaciones:** `computeNextOccurrence` respeta la fecha de inicio, programando avisos únicamente a partir de la vigencia del compromiso.

- **Semántica Contable de Fecha de Origen en Registro de Gastos (`ExpenseModal.tsx`):**
  - **Desacoplamiento Fecha Contable vs Timestamp Técnico:** Etiquetado explícito como "Fecha de Origen / Pago *" con indicador dinámico (ej. *"Hoy"* vs *"DD/MM/AAAA"*) y micro-copy aclaratorio.
  - **Sincronización reactiva del formulario:** Implementación de `useEffect` dependiente de `[isOpen, initialExpense, buckets]` para garantizar estado limpio y fechas correctas tanto al crear como al editar gastos.

- **Idempotencia de Pagos, Contabilidad Fiel y Blindaje UX/UI en Calendario (`App.tsx`, `CalendarView.tsx`, `RecurringView.tsx`, `safeToSpendService.ts`):**
  - **Desduplicación Estricta de Gastos:** `handleConfirmExpenseFromRecurring` actualiza el registro existente en lugar de duplicarlo si ya existe un gasto para esa regla y fecha; `loadData()` auto-sanea duplicados preexistentes en la base de datos local.
  - **Propagación Inmediata de Estados:** Al registrar o pagar un compromiso en Recurrentes o Calendario, todas las vistas marcan la regla como completada/registrada, suprimiendo botones de acción duplicados.
  - **Contabilidad Exacta del Total del Día:** `CalendarView` discrimina entre compromisos cumplidos y pendientes, evitando sumar dos veces el importe de un gasto ya ejecutado.
### Fixed
- **Bypass de Selector de Archivos y Blindaje del Ciclo de Vida Móvil (`App.tsx`, `auth.ts`, `CsvImportModal.tsx`, `BackupModal.tsx`, `SettingsModal.tsx`):**
  - **Prevención de Bloqueo por PIN:** Implementado seguimiento de actividad de selección de ficheros (`AuthService.isPickingFile`) y periodo de gracia de 60 segundos en `handleVisibilityChange` de `App.tsx` para evitar que la app se bloquee y desmonte modales al abrir selectores del sistema nativo o Google Drive.
  - **Persistencia de Sesión al Restaurar Base de Datos:** `AuthService.keepSessionUnlockedAfterRestore()` garantiza que la sesión de usuario activa permanezca autenticada tras importar una copia de seguridad sin expulsar al usuario al PIN.
  - **Sobreescritura Atómica de Ranura 1 de Copias de Seguridad (`googleDriveBackup.ts`, `BackupModal.tsx`):** La generación de una copia en la ranura `actual` reemplaza de inmediato los datos locales y en caché de forma idempotente, sin generar copias duplicadas ni alterar ranuras previas.

### Removed
- **Limpieza de Banners Redundantes de la Interfaz:**
  - Eliminado banner publicitario `Google Drive 2 ranuras` en `BackupModal.tsx`.
  - Eliminado badge `Por defecto` en la modalidad de cobro/pago en `RecurringView.tsx`.
  - Eliminado banner `100% Offline` en `CsvImportModal.tsx`.

---

## [1.16.0] - 2026-09-29

### Added
- **Intervalos Flexibles en Gastos y Tareas Recurrentes (`RecurringView.tsx`, `CalendarView.tsx`, `safeToSpendService.ts`, `notificationService.ts`):**
  - **Propiedad `interval` en `RecurringRule`:** Soporte numérico para periodos elásticos cada $X$ semanas (quincenal: 2 semanas, 3 semanas) o cada $X$ meses (bimestral: 2 meses, trimestral: 3 meses, semestral: 6 meses).
  - **Formulario Dinámico:** Selector numérico "Repetir cada [ X ] semanas / meses" integrado reactivamente según la frecuencia elegida, con etiquetas descriptivas en el listado de reglas.
  - **Cómputo en Calendario:** Evaluación precisa módulo $X$ semanas y meses desde la fecha de inicio en `isRuleOnDate` y `monthlyRecurringTotal`.
  - **Reserva Inteligente en Safe-to-Spend:** Los compromisos con periodicidad mensual e intervalo $X > 1$ reservan liquidez exclusivamente en los meses efectivos de cobro.
  - **Alarmas y Notificaciones:** Programación de la próxima ocurrencia real en `NotificationService` sincronizada con el intervalo.

- **Importador Universal Bancario Offline Excel (.xlsx / .xls) y CSV (`csvImporterService.ts`, `CsvImportModal.tsx`):**
  - **Motor Binario `xlsx` (SheetJS):** Deserialización de libros de trabajo Excel en hojas normalizadas procesadas 100% en memoria local sin librerías invasivas.
  - **Escaneo Dinámico de Cabeceras Bancarias:** Omisión inteligente de hasta 150+ filas de metadatos iniciales, resúmenes de cuenta, datos del titular o movimientos no consolidados.
  - **Reconocimiento Canónico de Columnas:** Detección de `Fecha contable`, `Fecha valor`, `Descripción`, `Importe`, `Saldo` y `Divisa`, priorizando `Fecha valor` como fecha de liquidación real.
  - **Soporte Drag-and-Drop y Selector:** Admisión universal de archivos `.xlsx`, `.xls`, `.csv` y `.tsv`.

- **Deduplicación Bidireccional de Ingresos y Gastos (`csvImporterService.ts`, `CsvImportModal.tsx`):**
  - **Clasificación por Signo de Importe:** Mapeo de transacciones positivas a `isIncome: true` (`+XX.XX € Ingreso / Abono` en tono esmeralda) y negativas a `isIncome: false` (`-XX.XX € Gasto` en tono rosa/blanco).
  - **Doble Cotejo Determinista SHA-256:** Prevención de duplicados contra el historial de gastos (`expenses`) y contra la base de ingresos adicionales (`extraIncomes`) mediante hashes criptográficos y tuplas de fecha, concepto e importe.
  - **Asentamiento Segregado:** Los gastos se guardan en el repositorio de gastos y los ingresos positivos se registran en ingresos extras del mes, sin distorsionar el balance presupuestario.

- **Bóveda Cifrada Local en Reposo AES-GCM-256 (`vaultCryptoService.ts`, `db.ts`, `SettingsModal.tsx`):**
  - **Criptografía Militar NIST SP 800-38D:** Generación y gestión de claves simétricas AES-GCM de 256 bits mediante Web Crypto API nativa (`window.crypto.subtle`) con IV aleatorio de 96 bits por registro.
  - **Cifrado Transparente en Almacenes Críticos:** Cifrado automático en escritura y descifrado en lectura para `expenses`, `settings`, `recurring_rules` y `savings_goals` en IndexedDB y `localStorage`.
  - **Preservación de Clave Primaria:** Campo `id` preservado en texto plano en la raíz del sobre cifrado para mantener búsquedas e indexación $O(1)$ sin migraciones de esquema.
  - **Monitor de Seguridad en Ajustes:** Indicador visual de bóveda cifrada en reposo con botón de verificación y diagnóstico de hardware criptográfico en tiempo real.

---

## [1.15.0] - 2026-09-28

### Added
- **Desbloqueo Biométrico Instantáneo y Diálogo de Salida Seguro (`@capacitor/app`, `ExitConfirmModal.tsx`, `AuthScreen.tsx`):**
  - **Invocación Biometría Obligatoria en Arranque:** `App.tsx` y `AuthScreen.tsx` disparan automáticamente `triggerNativeBiometrics()` al montar la app o despertar de segundo plano si la biometría está habilitada, eliminando el bypass previo.
  - **Teclado PIN Virtual como Respaldo Seguro:** El teclado numérico táctil se muestra exclusivamente si el usuario pulsa retroceder o cancelar en el diálogo nativo de huella dactilar.
  - **Diálogo Seguro de Confirmación de Salida (`ExitConfirmModal.tsx`):** Intercepción del botón Atrás de Android y de los botones táctiles de salida en la UI mediante `@capacitor/app` (`App.exitApp()`), requiriendo confirmación explícita para evitar pérdidas involuntarias de sesión.

- **Modo Privacidad Perfeccionado y Ergonomía en Calendario (`CalendarView.tsx`):**
  - **Enmascaramiento de Saldo Proyectado:** El saldo proyectado a fin de mes y los cálculos de liquidez de Cash-Flow Runway se enmascaran automáticamente con asteriscos (`••••`) cuando el Modo Privacidad está activo.
  - **Navegación Superior Inmediata:** Reubicación del selector de mes y semana inmediatamente encima de los días del mes para una exploración fluida y directa con el pulgar.
  - **Depuración de Badges Redundantes:** Simplificación de etiquetas en tareas periódicas, eliminando sufijos redundantes (ej. `🩺 Salud` en lugar de `Salud/lentillas`).

- **Ciclo de Vida y Estado de Cumplimiento de Tareas Recurrentes (`RecurringView.tsx`, `types/index.ts`):**
  - **Persistencia Atómica por Fecha (`completedDates: string[]`):** Registro de las fechas exactas en que se cumplió cada tarea periódica sin alterar el cómputo de ciclos futuros.
  - **Indicador de Cumplimiento en Calendario y Recurrentes:** Punto verde en las celdas del calendario para días con tareas completadas, badge `✓ Completada` al inspeccionar el día y estado visual destacado `"✓ Completada hoy"` en la lista de recurrentes.
  - **Limpieza de Categorías en Tareas sin Coste:** Asignación automática de la bolsa `Recordatorio` o `Sin bolsa` para tareas de 0€, evitando asignaciones erróneas al Colchón de Ahorro.

- **Centralización de Iconografía Oficial y Verticons en Ajustes (`SettingsModal.tsx`, `BucketsView.tsx`):**
  - Reubicación del visor y gestor de descargas de iconos desde la pestaña de Bolsas a la sección de Ajustes y Personalización.
  - Descarga y compartición nativa de la imagen squircle oficial APK (JPG) y la tarjeta vertical Verticons 2:3 en PNG transparente (800x1200) y JPG con fondo negro.

- **Rediseño Ergonómico de Metas & Sinking Funds (`GoalsModal.tsx`):**
  - **KPIs Superiores de Bajo Perfil:** Reducción sustancial de la altura de las tres tarjetas estadísticas superiores (*Total Ahorrado*, *Crucero* y *Cumplidas*), concediendo el máximo espacio a la lista desplazable.
  - **Corrección de Fragmentación de Líneas en Móviles:** Reestructuración de la cabecera de las tarjetas para evitar puntos huérfanos y saltos de línea antiestéticos en pantallas estrechas.
  - **Botón de Borrado Directo (`Trash2`):** Acceso inmediato para eliminar o purgar metas de ejemplo sin requerir desplegar el acordeón.

---

## [1.14.0] - 2026-09-27

### Added
- **Sistema de Tareas Recurrentes, Costes Estimados y Notificaciones Escalonadas Multi-Fase:**
  - **Tipología de Costes (`costType`):** Soporte integral para `fixed` (recibos fijos), `estimated` (costes aproximados de suministros, consultas o regalos) y `none` (tareas periódicas de salud, lentillas o revisiones sin impacto financiero).
  - **Categorías Funcionales (`categoryType`):** Clasificación en `bill` (recibos/suministros), `subscription` (streaming/gimnasio), `tax` (impuestos/tasas), `health` (lentillas, medicación, citas médicas), `maintenance` (ITV, revisiones, veterinario/vacunas) y `personal` (cumpleaños, aniversarios).
  - **Preavisos Escalonados Configurables (`reminderOffsets` & `reminderTime`):** Configuración individual para alertas el mismo día, 1 día antes, 3 días antes, 1 semana antes, 2 semanas antes, 1 mes antes (preaviso para cancelación de seguros) o 1 trimestre antes (90 días para previsión de gastos cuantiosos).
  - **Desplazamiento Dinámico y Adaptativo de Fechas Futuras (`autoAdaptNextDates`):** Al completar o registrar una tarea en una fecha distinta a la prevista (ej. cambio de lentillas el día 29 en vez del 27), el sistema adapta automáticamente la base del ciclo para los meses siguientes, manteniendo los preavisos configurados.
  - **Nuevo Canal de Notificaciones Android de Alta Prioridad (`crono_tasks_alerts`):** Canal nativo dedicado para tareas, salud y recordatorios preventivos con sonido, vibración y visualización flotante.
  - **Modal Interactivo "Confirmar / Ajustar Coste" (`ConfirmRecurringExpenseModal.tsx`):** Permite validar el coste estimado en un solo toque, ajustar el importe definitivo de la factura o completar la tarea sin coste, actualizando las alarmas pendientes.
  - **Sincronización Automática de Plazos Fiscales AEAT (`TaxService` & `NotificationService`):** Agendamiento automático de alarmas escalonadas (1 mes, 1 semana y día de vencimiento) para los 4 trimestres del Modelo 130 y 303.
  - **Corrección de Proyección en Calendario (`CalendarView.tsx`):** Helper `isRuleOnDate` para proyectar reglas anuales y trimestrales únicamente en el mes y día correspondiente, con badges y puntos de actividad cromáticos.
  - **Aislamiento en Safe-to-Spend (`SafeToSpendService.ts`):** Exclusión de tareas sin coste del débito de liquidez diaria y reserva preventiva para costes estimados pendientes del mes en curso.

---

## [1.13.0] - 2026-09-26

### Added
- **Skill Global de Novedades y Acerca de (`app-about-changelog`, `AboutModal.tsx`, `changelog.user.json`):**
  - **Manifiesto Declarativo de Usuario (`src/config/changelog.user.json`):** Historial completo y desacoplado del changelog técnico de desarrollo, con explicaciones directas, comprensibles y sin jerga de las 14 versiones lanzadas (v1.0.0 a v1.13.0).
  - **Modal Interactivo "Acerca de CronoCash & Novedades" (`AboutModal.tsx`):**
    - Ficha de identidad con logotipo oficial, versión SemVer visible, número de compilación interno, estado de privacidad (100% Local & Seguro) y plataforma.
    - Tarjeta heroica con las novedades destacadas de la versión instalada en la APK.
    - Acordeón cronológico interactivo para explorar el historial de versiones anteriores con un solo toque.
    - Enlace directo al monitor de telemetría y salud del stack (`AppArchitectureGraph`).
    - Ficha legal de licencia abierta y compromiso de privacidad sin servidores externos.
  - **Integración en Ajustes (`SettingsModal.tsx`):** Acceso prioritario directo con badge interactivo "NUEVO" y acceso unificado.
  - **Artefactos Release Dual v1.13.0 Firmados:** Compilación y firma de `app-v1.13.0-release.apk` (Estándar) y `app-v1.13.0-verticon-release.apk` (Verticons Card 2:3) con `versionCode 11300` y `versionName "1.13.0"`.

---

## [1.12.0] - 2026-09-26

### Added
- **Executive PDF Reports & Quarterly Tax Board Mod. 130 / 303 (`taxService.ts`, `pdfReportService.ts`, `ReportsModal.tsx`):**
  - **Servicio de Cálculo Fiscal Trimestral (`TaxService`):**
    - Desglose por trimestres oficiales (1T: Ene-Mar, 2T: Abr-Jun, 3T: Jul-Sep, 4T: Oct-Dic) con determinación automática de plazos de la AEAT (20 de Abril, 20 de Julio, 20 de Octubre y 30 de Enero del año siguiente).
    - Detección reactiva de días naturales restantes para liquidación o aviso semafórico de plazo vencido con prevención de recargos art. 27 LGT.
    - Cuadro resumen para el **Modelo 130** (IRPF Autónomos en Estimación Directa): ingresos computables, gastos deducibles justificados con factura, rendimiento neto y cálculo del pago fraccionado a cuenta al 20% (Casilla 07).
    - Cuadro resumen para el **Modelo 303** (Autoliquidación Periódica IVA): IVA devengado/repercutido al 21%, IVA deducible/soportado en facturas recibidas y resultado neto con calificación automática ("A Ingresar" vs "A Compensar").
    - Exportación oficial del **Libro Registro de Facturas Recibidas en CSV** con BOM UTF-8 (compatible con Excel y asesorías contables).
  - **Servicio de Generación de Informes PDF Ejecutivos (`PdfReportService`):**
    - Motor 100% offline basado en `jspdf` con diseño institucional *dark-accent / clean slate* en formato A4 vertical.
    - **Informe Ejecutivo Mensual:** Portada ejecutiva con identificación de empresa/titular y NIF, tarjeta de 5 KPIs (Ingresos, Gastos Totales, Balance Neto, Tasa de Ahorro y Asignación Diaria Media), tabla completa de ejecución presupuestaria por Bolsas, estado de Sinking Funds y Top 5 mayores desembolsos del mes.
    - **Informe Fiscal Trimestral:** Cabecera azul fiscal, banner de plazo AEAT, tarjetas comparativas de Modelos 130 y 303, y tabla paginada con desglose línea a línea de facturas deducibles (Fecha, Nº Factura, Proveedor, Concepto, Base, IVA %, Cuota y Total).
    - Paginación dinámica institucional ("Página X de Y") y sello criptográfico de verificación/auditoría checksum (`CC-XXXX-YYYY`).
    - Puente de distribución multiplataforma: descarga directa en Web/PWA y guardado nativo con hoja de compartir de Android (`@capacitor/filesystem` y `@capacitor/share`).
  - **Componente de UI Modal de Informes & Fiscalidad (`ReportsModal.tsx`):**
    - Modal en dark mode con 2 pestañas: *Informe Ejecutivo Mensual* (con selector de mes/año, KPIs reactivos y progreso de bolsas) y *Cuadro Fiscal Trimestral* (con selector de trimestre 1T-4T, semáforo de plazos AEAT, desglose de modelos 130/303 y visor de facturas).
    - Botones de acción con spinners interactivos: *"Descargar / Compartir Informe PDF"*, *"Exportar Informe Fiscal PDF"* y *"Descargar Libro de Facturas (CSV)"*.
  - **Navegación e Integración Global:**
    - Botón de acceso directo *"Informes & Fiscalidad"* en la botonera de acciones del Dashboard.
    - Acceso dedicado en el panel de Ajustes y Bóveda (`SettingsModal`).
    - Enrutado de estado reactivo en `App.tsx`.

---

## [1.11.0] - 2026-09-26

### Added
- **Sinking Funds Engine & Autonomous Savings Goals (`sinkingFundsService.ts`, `GoalsModal.tsx`, `GoalFormModal.tsx`, `SweepSurplusModal.tsx`, `QuickContributeModal.tsx`):**
  - **Cálculo Autónomo de Ritmo de Crucero (`calculateCruisePace`):** Determinación precisa de cuota mensual y ritmo diario recomendado en función de la fecha límite (`targetDate`) y saldo acumulado, con telemetría semafórica (`on_track`, `behind`, `completed`, `critical`).
  - **Blindaje Integrado en Motor Safe-to-Spend (`safeToSpendService.ts`):** Deducción matemática de cuotas de crucero mensuales activas (`autoDeductFromSafeToSpend: true`) en el cálculo de liquidez disponible neta, visualizado en el desglose matemático con la línea `🛡️ Metas de Ahorro Protegidas (Crucero): -XX.XX €`.
  - **Sweep & Fund — Reparto Proporcional de Excedentes:** Distribución de superávit mensual ponderada por prioridad (Prioridad 1 peso 3x, Prioridad 2 peso 2x, Prioridad 3 peso 1x) con previsualización reactiva y asignación instantánea.
  - **Persistencia en IndexedDB v3 (`db.ts`):** Almacén `savings_goals` con índices por categoría y estado de compleción, fallback en `localStorage`, integración completa en `BackupEnvelope` e inyección de 4 semillas maestras (Seguro Coche, IBI, Vacaciones y Averías).
  - **Experiencia de Usuario Integral:** Widget de acceso rápido en Dashboard con acumulado en tiempo real, accesos directos desde Header y vista de Bolsas, y panel de aportaciones táctiles en 1 toque (`QuickContributeModal`).
  - **Artefactos Release Dual v1.11.0 Firmados:** Compilación y firma simultánea de `app-v1.11.0-release.apk` (Estándar) y `app-v1.11.0-verticon-release.apk` (Verticons Card 2:3) con `versionCode 11100` y `versionName "1.11.0"`.

---

## [1.10.0] - 2026-09-26

### Added
- **Importador Universal Bancario Offline CSV (`csvImporterService.ts`, `CsvImportModal.tsx`):**
  - **Heurística de Ingesta Inteligente:** Detección automática del delimitador (`;`, `,`, `\t`), juego de caracteres y formatos de fecha habituales en entidades bancarias españolas (`DD/MM/YYYY`, `DD-MM-YYYY`, `YYYY-MM-DD`).
  - **Tratamiento Avanzado de Importes:** Soporte completo de coma decimal española (`1.250,50` o `-45,99`) y normalización de columnas separadas `Debe`/`Haber` o importe único firmado.
  - **Deduplicador Criptográfico SHA-256:** Generación determinista de hash SHA-256 por cada movimiento bancario (`fecha + concepto + importe`) mediante Web Crypto API para descartar de forma transparente transacciones previamente registradas o solapadas.
  - **Bandeja de Entrada Pre-Asentamiento (Staging Table):** Tabla interactiva con métricas en tiempo real de gastos detectados, válidos, duplicados y auto-clasificados, con selector de bolsas por fila, toggle de factura desgravable y asignación en bloque con 1 toque.
  - **Generación de Reglas al Vuelo:** Interruptor interactivo en la bandeja de importación para persistir automáticamente las asociaciones comercio-bolsa realizadas como nuevas reglas para futuros extractos.
- **Motor de Reglas Inteligentes Declarativas (`SmartRulesModal.tsx`, `db.ts`):**
  - **Almacén `smart_rules` en IndexedDB v2:** Nueva tabla con índice y sincronización dual con `localStorage`.
  - **Semillas Maestras para el Mercado Español:** Reglas precargadas cubriendo supermercados (Mercadona, Carrefour, Lidl, Dia), movilidad (Repsol, Cepsa, BP, Renfe, Metro), suministros (Iberdrola, Endesa, Naturgy, Canal de Isabel II), telecomunicaciones (Movistar, Vodafone, Orange, Digi), ocio (Netflix, Spotify, Prime Video), seguros (Mapfre, Sanitas, Mutua Madrileña) y vivienda (Hipoteca, Alquiler, Comunidad).
  - **Gestor Visual de Reglas:** Interfaz completa para consultar, activar/desactivar, filtrar por bolsa, crear reglas personalizadas o restablecer las semillas oficiales recomendadas.
- **Accesos y Navegación Integrada:**
  - Botón *"Importar Banco (CSV)"* en la cabecera del Dashboard principal.
  - Acceso directo a *"Reglas Inteligentes"* en la barra de herramientas de la vista de Bolsas.
  - Sección dedicada de auto-categorización en Ajustes.
- **Artefactos Release Dual v1.10.0 Firmados:**
  - Compilación y firma simultánea de `app-v1.10.0-release.apk` (Estándar) y `app-v1.10.0-verticon-release.apk` (Verticons Card 2:3) con `versionCode 11000` y `versionName "1.10.0"`.

---

## [1.9.0] - 2026-09-26

### Added
- **Motor "Safe-to-Spend" & Burn-Rate Predictivo en Tiempo Real (`safeToSpendService.ts`, `SafeToSpendWidget.tsx`):**
  - **Cálculo Diario Dinámico:** Algoritmo que calcula con precisión matemática el margen de gasto seguro diario (`dailySafeToSpend = netAvailable / daysRemaining`).
  - **Aislamiento Inteligente de Compromisos:** Deducción automática de facturas recurrentes pendientes del mes para evitar doble cómputo, y salvaguarda blindada del *Colchón de Emergencias* (`isBuffer: true`).
  - **Termómetro de Ritmo de Consumo (Burn-Rate):** Comparador visual del ritmo de gasto actual frente al ritmo teórico esperado según el día del mes, con estados semafóricos (🟢 Óptimo, 🟡 En Ritmo, 🔴 Alerta de Agotamiento).
  - **Simulador Interactivo de Compras por Impulso:** Permite al usuario simular el impacto de compras imprevistas (+20€, +50€, +100€ o importe personalizado) antes de gastar, mostrando cómo se recalculan los días de supervivencia y el margen diario.
  - **Métrica Heroica en Cabecera:** Píldora reflectiva anclada en el `Header` superior (`Hoy: XX.XX €`) para consulta inmediata sin entrar en menús.
- **Asistente Interactivo de Reequilibrio "Cover Overspending" (`CoverOverspendingModal.tsx`, `BucketsView.tsx`):**
  - **Detección Automática de Sobregastos:** Banner contextual reactivo en la vista de Bolsas que alerta de cualquier categoría con saldo negativo o superación del límite.
  - **3 Estrategias de Reequilibrio en 1 Toque:**
    1. *Compensar desde Colchón de Emergencias:* Absorbe el desvío desde la bolsa colchón sin descompensar las categorías operativas del mes.
    2. *Compensar desde Mayor Superávit:* Transfiere automáticamente fondos desde la bolsa que cuenta con mayor margen disponible.
    3. *Prorratear entre Bolsas con Margen:* Distribuye el exceso de gasto de forma proporcional entre todas las bolsas saludables.
  - **Ajuste Atómico Presupuesto Base Cero:** Modifica los límites de las bolsas en IndexedDB manteniendo la suma global de ingresos y gastos 100% equilibrada.
- **Artefactos Release Dual v1.9.0 Firmados:**
  - Compilación y firma simultánea de `app-v1.9.0-release.apk` (Estándar) y `app-v1.9.0-verticon-release.apk` (Verticons Card 2:3) con `versionCode 10900` y `versionName "1.9.0"`.

---

## [1.8.2] - 2026-09-26

### Fixed
- **Descarga Nativa de Iconos en Android (`BucketsView.tsx`):** Sustitución de las etiquetas estándar `<a>` con atributo `download` (inoperativas en WebView de Android) por un puente reactivo que utiliza `@capacitor/filesystem` (conversión a base64 y guardado en almacenamiento accesible) y `@capacitor/share` (hoja de guardado/compartir nativa de Android).
- **Indicador de Carga Interactivo:** Estado reactivo con spinner (`Loader2`) y bloqueo contra toques dobles durante la preparación del activo de imagen.
- **Soporte Universal Multi-Plataforma:** Garantía de guardado para el Icono Launcher Squircle Oficial (`logo.jpg`), Tarjeta Verticons PNG transparente (`verticon-icon.png`) y Tarjeta Verticons JPG al ras (`verticon-icon.jpg`).
- **Artefactos Release Dual v1.8.2:** Compilación y firma de `app-v1.8.2-release.apk` (Estándar) y `app-v1.8.2-verticon-release.apk` (Verticons 2:3) con `versionCode 10802` y `versionName "1.8.2"`.

---

## [1.8.1] - 2026-09-26

### Fixed & Enhanced
- **Bordes al Ras en Edición Verticons Pack:** Eliminación total del marco exterior negro plano sin textura alrededor de la tarjeta Verticons. El marco de neón esmeralda y cian ahora corre exactamente por el límite perimetral de la tarjeta 2:3.
- **Acabado en Fibra de Carbono en Esquinas:** Reemplazo de los bordes vacíos por textura continua de fibra de carbono aeroespacial y placas de titanio oscuro cepillado, garantizando una estética limpia sin vacíos negros.
- **Variante PNG con Transparencia Ultra HD (800x1200):** Generación de `public/verticon-icon.png` con canal alfa 100% transparente en el exterior de las esquinas redondeadas, permitiendo que la tarjeta flote limpiamente sobre cualquier launcher (Nova, Niagara, Smart Launcher) sin cuadros negros de fondo.
- **Generador de Mipmaps Android Refinado (`generate-verticon-icons.ps1`):** Los iconos `ic_launcher.png`, `ic_launcher_round.png` y `ic_launcher_foreground.png` ahora se generan con la tarjeta al ras sin marcos oscuros parásitos.
- **Descarga Dual en Visor de la App (`BucketsView.tsx`):** El modal de iconos ahora ofrece descarga directa tanto en PNG transparente como en JPG al ras en alta definición.
- **Artefactos Release Dual v1.8.1:** Compilación y firma de `app-v1.8.1-release.apk` (Estándar) y `app-v1.8.1-verticon-release.apk` (Verticons 2:3) con `versionCode 10801` y `versionName "1.8.1"`.

---

## [1.8.0] - 2026-09-26

### Added
- **Manifiesto Declarativo TecnoRed (`stack.config.json`):** Registro auditable de las 6 tecnologías maestras que componen CronoCash (React 19, Capacitor Mobile, IndexedDB/Filesystem, Google Drive API, Tailwind CSS/Lucide y Biometría/Alarmas de Hardware).
- **Componente Visual Interactivo (`AppArchitectureGraph.tsx`):** Renderizador Canvas 2D a 60 FPS con física elástica de partículas que no escapan del cursor/toque, conectadas por cables tensados con curvas Bézier oscilantes y pulsos de energía.
- **Anillos de Salud en Tiempo Real & Telemetría en Caliente:** Monitoreo concurrente con anillos concéntricos coloreados (verde/ámbar/índigo) con telemetría de latencia en milisegundos para IndexedDB, runtime de React 19, estado de Capacitor y disponibilidad de red.
- **Cajón de Diagnóstico & Carga Diferida (Lazy Loading):** Inspección detallada al tocar cada nodo tecnológico e integración no invasiva en `SettingsModal.tsx` con `React.lazy` y `<Suspense>` en un chunk aislado de solo 6.57 kB (gzip).
- **Artefactos Release Dual Firmados:** Compilación y firma simultánea de `app-v1.8.0-release.apk` (Estándar) y `app-v1.8.0-verticon-release.apk` (Verticons 2:3) con `versionCode 10800` y `versionName "1.8.0"`.

---

## [1.7.0] - 2026-09-24

### Added
- **Manual de Usuario y Documentación Maestra (`docs/FAQ.md`):** Creación del documento canónico de preguntas frecuentes y guía de herramientas organizado estrictamente en 8 secciones temáticas concisas sin obsolescencias ni datos deprecados (Seguridad biométrica, Bolsas y Rollover, Recurrentes y Gastos Vampiro, Calendario y Runway, Notificaciones y Alarmas exactas, Google Drive Backup 2 ranuras, Estrategias financieras y Escudo Anti-Estafas, e Iconografía oficial/Verticons).
- **Auditoría Integral de Rendimiento & Hardening:** Verificación de integridad de todos los módulos, ausencia de fugas de memoria, comprobación de concurrencia en transacciones IndexedDB y sincronización transparente con `localStorage`.
- **Artefacto Release Final Firmado:** Compilación del APK definitivo de producción `app-v1.7.0-release.apk` (`versionCode 10700`, `versionName "1.7.0"`).

---

## [1.6.0] - 2026-09-24

### Added
- **Suite de 14 Estrategias Financieras Maestras:** Incorporación de guías prácticas de alto impacto cubriendo Ahorro en Suministros (auditoría de potencia contratada y comparador CNMC), Telecomunicaciones (amago legal con operadoras directas), Seguros (preaviso legal de 1 mes según Ley 50/1980), Erradicación de Comisiones Bancarias Ocultas y Regla de los 30 Días contra compras impulsivas.
- **Módulo Legal de Dinero Rápido y Excedentes:** Métodos sin riesgo para monetización de excedentes domésticos (estrategia de las 3 cajas en Wallapop/Vinted), aprovechamiento de deducciones autonómicas olvidadas en el IRPF y prestación de microservicios locales y digitales.
- **Estrategias Protegidas de Dinero Pasivo:** Explicación y guía práctica de Cuentas Remuneradas garantizadas hasta 100.000€ por el Fondo de Garantía de Depósitos (FGD), Fondos Monetarios con diferimiento fiscal en España (art. 94 Ley 35/2006) e Inversión Indexada Global a largo plazo mediante aportaciones periódicas automatizadas (DCA).
- **Escudo Anti-Estafas Financieras & CNMV:** Mecanismos de detección y defensa activa frente a chiringuitos financieros no regulados (consulta en registro oficial de la CNMV), regla de oro contra promesas de rentabilidad irreal y prevención de fraudes por suplantación bancaria (smishing, llamadas fraudulentas y grupos de Telegram).
- **Interfaz Interactiva de Estrategias (`TipsView.tsx`):** Filtros por píldoras temáticas, buscador en tiempo real por palabras clave, acordeones con pasos de acción numerados, tarjetas con estimaciones económicas destacadas y botón de persistencia "Marcar como Aplicado" con métricas de progreso.
- **Artefacto Release Firmado:** Compilación del APK de producción `app-v1.6.0-release.apk` (`versionCode 10600`, `versionName "1.6.0"`).

---

## [1.5.0] - 2026-09-24

### Added
- **Arquitectura Canónica de 2 Ranuras para Google Drive:** Soporte estructurado para `CronoCash_Actual.json` (ranura principal de uso continuo) y `CronoCash_Previa.json` (ranura secundaria de salvaguarda histórica).
- **Integración con Storage Access Framework (SAF):** Exportación limpia mediante `@capacitor/filesystem` a caché y `@capacitor/share` para abrir la hoja de compartir nativa de Android, permitiendo al usuario guardar directamente en Google Drive sin requerir credenciales de API ni tokens OAuth perecederos.
- **Envelope de Seguridad con Checksum Determinista:** Empaquetado v1.5.0 con hash de integridad, metadatos enriquecidos de conteos, totales económicos y formateo de marcas temporales en franja horaria `Europe/Madrid`.
- **Comparador Previo Lado a Lado (Side-by-Side):** Pantalla interactiva previa a la restauración que audita y contrasta la base de datos actual del dispositivo contra la copia seleccionada, detallando variaciones en gastos, bolsas y reglas recurrentes con indicadores de deltas (+/-).
- **Modos de Restauración Dual:** Opciones seleccionables para *Sobrescribir Completo* (reemplazo atómico íntegro en IndexedDB y localStorage) o *Fusionar Registros* (combinación no destructiva con control de duplicados).
- **Nuevo Modal Dedicado (`BackupModal.tsx`):** Interfaz completa con pestañas para Google Drive, Exportación Local fechada y Restauración/Comparador, accesible tanto desde la cabecera como desde Bóveda/Ajustes.
- **Artefacto Release Firmado:** Generación del APK de producción `app-v1.5.0-release.apk` (`versionCode 10500`, `versionName "1.5.0"`).

---

## [1.4.0] - 2026-09-24

### Added
- **Motor de Notificaciones Locales y Canales Android:** Creación de 3 canales nativos de alta prioridad (`crono_bills_alerts`, `crono_daily_review`, `crono_budget_alerts`) con permisos en tiempo de ejecución (Android 13+) y alarmas exactas (`SCHEDULE_EXACT_ALARM`).
- **Avisos Escalonados Pre-Cobro:** Programación de alertas automáticas 3 días antes (a las 09:30 AM) y el día del vencimiento a las 09:00 AM para cada recibo y factura activa.
- **Recordatorio Nocturno de Cierre Diario:** Alarma diaria programable (21:30) para asentar gastos menores o compras del día en las bolsas.
- **Deep Linking Interactivo:** Al pulsar una notificación de recibo, la app se abre y navega directamente a la vista de Recurrentes o Dashboard.
- **Panel de Notificaciones en Ajustes:** Interruptor maestro de avisos, selector de hora de revisión y botón "Probar Alarma" con disparo de prueba en 3 segundos.
- **Artefacto Release Firmado:** Compilación del APK firmado `app-v1.4.0-release.apk` (`versionCode 10400`, `versionName "1.4.0"`).

---

## [1.3.0] - 2026-09-24

### Added
- **Calendario Reactivo Dual (Mes y Semana):** Motor de calendario adaptativo con `date-fns` v4 sin librerías pesadas, con puntos de actividad e importes resumidos por celda.
- **Runway de Cash-Flow en Tiempo Real:** Cálculo proyectado del saldo remanente a fin de mes cotejando ingresos configurados, gastos reales y facturas recurrentes pendientes.
- **Interacción y Desglose por Día:** Panel inferior interactivo al seleccionar cualquier día con lista de gastos y vencimientos programados con acción "Pagar" para asentamiento con 1 toque.
- **Comparador Anual (YoY - Year over Year):** Pestaña analítica para comparar el gasto total de dos ejercicios anuales, tasa de variación interanual y evolución mes a mes con barras comparativas.

---

## [1.2.0] - 2026-09-24

### Added
- **Gestor Completo de Gastos Recurrentes:** Soporte flexible de periodicidades (semanal, mensual, trimestral y anual) con asignación de día de cargo y bolsa.
- **Motor Predictivo de Cobros & Cuenta Atrás:** Algoritmo dinámico que calcula la fecha de vencimiento más próxima y los días restantes con badges semafóricos inteligentes ("¡Vence HOY!", "¡Mañana!", "En X días").
- **Detector & Auditoría de Gastos Vampiro:** Panel interactivo para auditar suscripciones inactivas o repetidas, calculando el ahorro potencial al migrar a planes anuales o dar de baja.
- **Smart Seeds de Recurrentes en 1 Clic:** Plantilla maestra con 7 recibos clave precargados para España y Europa.
- **Acción Inmediata de Asentamiento:** Botón "Registrar Pago" para convertir de forma inmediata un recibo en un gasto real deducido en su bolsa presupuestaria.

---

## [1.1.0] - 2026-09-24

### Added
- **Iconografía Oficial Completa de Android:** Generación de todos los tamaños `mipmap-mdpi`, `hdpi`, `xhdpi`, `xxhdpi`, `xxxhdpi` (`ic_launcher.png`, `ic_launcher_round.png` y `ic_launcher_foreground.png` con padding adaptativo y fondo `#0B111E`).
- **Edición Verticons Pack:** Creación de la tarjeta vertical en proporción 2:3 en alta resolución con marco de neón esmeralda y fibra de carbono para compatibilidad con el pack de iconos Verticons en Android.
- **Visor Interactivo de Iconos:** Modal en la app para previsualizar y descargar tanto el icono oficial squircle como la edición Verticons con guía de instalación en launchers Android.
- **Smart Seeds (Plantilla Maestra en 1 Clic):** Onboarding instantáneo con 8 bolsas maestras para España y Europa.
- **Lógica de Vasos Comunicantes:** Sistema interactivo de trasvase elástico de saldos y límites presupuestarios entre bolsas con superávit y bolsas en déficit con retroalimentación háptica.
- **Mecanismo de Rollover Mensual:** Cálculo y transferencia automática del excedente de gasto no consumido hacia la bolsa amortiguadora de ahorro.

---

## [1.0.0] - 2026-09-24

### Added
- **Arquitectura base:** Configuración integral de React 19, Vite 6, Tailwind CSS v4, TypeScript 5.7 y Capacitor 7.
- **Persistencia IndexedDB:** Motor nativo `IndexedDB` (`GastosFacturacionDB`) con soporte de almacenes para gastos, bolsas, reglas recurrentes, ajustes y consejos con fallback transparente a `localStorage`.
- **Autenticación Biométrica Nativa:** Plugin interno `BiometricPlugin.java` con Android Jetpack `androidx.biometric:1.1.0` y fallback para desarrollo web.
- **Pantalla de Seguridad (AuthScreen):** Acceso por huella dactilar, teclado táctil PIN numérico de respuesta instantánea, auto-bloqueo al pasar a segundo plano y opción de auto-login en el dispositivo.
- **UI Shell & Adaptabilidad Móvil:** Insets de `safe-area` para notch superior e inferior, estilos oscuros de alto contraste y corrección para evitar bloqueos en teclados virtuales de Android (`user-select: text !important`).
