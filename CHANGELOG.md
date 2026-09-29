# Changelog — CronoCash 📝

Todas las modificaciones notables en este proyecto serán documentadas en este archivo.
El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y este proyecto se adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
  - **Diseño Anti-Desbordamiento en Celdas de Calendario:** Reducción semántica a máximo 1 punto por tipología (esmeralda para actividad ejecutada, azul para facturas pendientes y violeta para citas/salud), dimensionamiento ultra-compacto (`w-1.5 h-1.5`, `gap-0.5`) y contención `overflow-hidden` para erradicar cualquier invasión hacia días contiguos.
  - **Gestión Precisa de Ocurrencias Semanales en Safe-to-Spend:** Descuento exclusivo de las semanas pendientes restantes del mes, sin penalizaciones duplicadas.

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
