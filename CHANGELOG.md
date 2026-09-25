# Changelog — CronoCash 📝

Todas las modificaciones notables en este proyecto serán documentadas en este archivo.
El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y este proyecto se adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
