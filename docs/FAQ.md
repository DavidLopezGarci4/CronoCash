# Preguntas Frecuentes y Guía de Herramientas (FAQ) — CronoCash 📖

> Guía de referencia rápida, operativa y resolución de dudas sobre todas las funciones y herramientas activas en la versión oficial de **CronoCash** (Android APK y PWA).  
> **Versión Actual:** `v1.27.0` (Build 12700) • **Actualizado:** 1 de Octubre de 2026 • **Módulos Auditados:** 14/14 • **Guías Operativas:** 55

---

## Índice Rápido

1. [Seguridad y Acceso Biométrico / PIN](#1-seguridad-y-acceso-biométrico--pin)
2. [Bolsas de Presupuesto, Vasos Comunicantes y Rollover](#2-bolsas-de-presupuesto-vasos-comunicantes-y-rollover)
3. [Gastos Recurrentes y Detector de Gastos Vampiro](#3-gastos-recurrentes-y-detector-de-gastos-vampiro)
4. [Calendario Reactivo, Cash-Flow Runway y Comparador YoY](#4-calendario-reactivo-cash-flow-runway-y-comparador-yoy)
5. [Notificaciones y Alarmas Exactas de Cobro](#5-notificaciones-y-alarmas-exactas-de-cobro)
6. [Copias de Seguridad en Google Drive (2 Ranuras) y Comparador Lado a Lado](#6-copias-de-seguridad-en-google-drive-2-ranuras-y-comparador-lado-a-lado)
7. [Estrategias Financieras, Ingresos Pasivos y Escudo Anti-Estafas](#7-estrategias-financieras-ingresos-pasivos-y-escudo-anti-estafas)
8. [Iconografía Oficial Android y Tarjeta Verticons](#8-iconografía-oficial-android-y-tarjeta-verticons)
9. [Arquitectura del Stack y Salud en Tiempo Real](#9-arquitectura-del-stack-y-salud-en-tiempo-real)
10. [Motor Safe-to-Spend y Asistente Cover Overspending](#10-motor-safe-to-spend-y-asistente-cover-overspending)
11. [Importador Universal Bancario Offline (Excel/CSV) y Deduplicación Bidireccional](#11-importador-universal-bancario-offline-excelcsv-y-deduplicación-bidireccional)
12. [Metas de Ahorro y Fondos de Amortización ("Sinking Funds")](#12-metas-de-ahorro-y-fondos-de-amortización-sinking-funds)
13. [Informes Ejecutivos PDF y Cuadro Fiscal Trimestral (Mod. 130/303)](#13-informes-ejecutivos-pdf-y-cuadro-fiscal-trimestral-mod-130303)
14. [Centro Acerca de y Novedades de la App](#14-centro-acerca-de-y-novedades-de-la-app)

---

## 1. Seguridad y Acceso Biométrico / PIN

### ¿Cómo protege CronoCash la privacidad de mis datos?
* **Bóveda Cifrada en Reposo (AES-GCM-256):** Todos tus gastos, presupuestos, reglas recurrentes y metas se cifran con clave maestra de 256 bits derivada localmente mediante Web Crypto API nativa. Los datos en IndexedDB y almacenamiento local quedan blindados criptográficamente ante extracciones o filtraciones no autorizadas.
* **Cifrado y descifrado transparente:** La información se descifra en milisegundos en la memoria volátil del dispositivo solo durante el uso activo de la aplicación. Incluye test de integridad en Ajustes.
* **Biometría nativa obligatoria al inicio:** Al iniciar la app o volver desde segundo plano, se invoca de forma inmediata el lector de huella dactilar nativo de Android (`androidx.biometric:1.1.0`) para un acceso instantáneo sin teclear.
* **Teclado PIN táctil como respaldo seguro:** Solo si decides retroceder o cancelar el diálogo nativo de huella dactilar, se muestra el teclado numérico virtual integrado para evitar espionajes de teclados de terceros.
* **Diálogo seguro de confirmación de salida:** Al pulsar el botón "Atrás" de Android en la vista principal o los botones táctiles de salida en la UI, un pop-up interactivo te solicita confirmación para evitar cierres accidentales.
* **Modo Privacidad en 1 toque:** Oculta con asteriscos (`••••`) los importes sensibles del panel principal y el saldo proyectado a fin de mes en el calendario.
* **Auto-bloqueo preventivo:** Al minimizar la aplicación o apagar la pantalla (`visibilitychange`), la sesión se bloquea automáticamente para salvaguardar tu saldo.
* **Bloqueo manual inmediato:** Puedes pulsar el candado situado en la cabecera superior en cualquier momento para bloquear la sesión en 1 toque.
* **Respuesta háptica táctil y control On/Off:** Cada pulsación del teclado PIN, confirmación de pagos o cambio de pestaña emite vibración táctil nativa precisa con opción de activarla o apagarla en cualquier momento desde Ajustes.

---

## 2. Bolsas de Presupuesto, Vasos Comunicantes y Rollover

### ¿Qué es el sistema de Bolsas ("Envelopes")?
* **Distribución por categorías:** Asigna tus ingresos mensuales a 8 bolsas maestras (Vivienda, Suministros, Supermercado, Movilidad, Seguros, Telecomunicaciones, Ocio y Colchón de Ahorro).
* **Plantilla inteligente (Smart Seeds):** Puedes cargar la plantilla oficial precargada con importes realistas adaptados al coste de vida en España y Europa.

### ¿Cómo funcionan los "Vasos Comunicantes"?
* **Reequilibrio elástico:** Si una bolsa supera su límite (déficit), el sistema te permite transferir saldo sobrante desde una bolsa con superávit sin alterar tu presupuesto total del mes.
* **Interacción háptica:** Ajusta los límites mediante el botón de Vasos Comunicantes en la pestaña de Bolsas para compensar desvíos con respuesta táctil.

### ¿Qué ocurre con el dinero no gastado a fin de mes (Rollover)?
* **Acumulación de ahorro:** El superávit mensual no consumido no desaparece; se transfiere automáticamente a la bolsa amortiguadora de *Colchón de Ahorro e Imprevistos*.

### ¿Cómo puedo ordenar mis Bolsas y personalizar sus iconos y colores?
* **Ordenación flexible a medida:** Puedes ordenar tus bolsas por orden manual personalizado (con botones para subir y bajar de posición y feedback táctil), por orden alfabético de título (A-Z y Z-A) o por importe de límite asignado.
* **Persistencia de orden:** Al mover una bolsa arriba o abajo en modo manual, el orden se consolida de inmediato en IndexedDB para mantenerse idéntico en tus próximas sesiones.
* **Nuevos iconos de inversión y coleccionismo:** Dispones de una galería ampliada con iconos Lucide específicos para inversiones y finanzas (`TrendingUp`, `Coins`, `LineChart`, `Landmark`, `Gem`) y coleccionismo o hobbies (`Bot`, `Gamepad2`, `Package`, `Trophy`, `Crown`).
* **Paleta cromática de 16 colores:** 7 nuevos colores distintivos (Índigo, Violeta, Lima, Oro, Fucsia, Bosque y Cielo) sincronizados entre Bolsas y Metas de ahorro.

### ¿Cómo consultar los totales mensuales y la proyección anual de las Bolsas?
* **Navegador mensual interactivo:** Encima del panel de bolsas dispones de una barra de navegación con flechas (`< [Mes Año] >`) y botón *"Hoy"* para auditar el presupuesto y los gastos reales de cualquier mes histórico o futuro.
* **Conmutador Mes / Proyección Anual:** Puedes alternar en 1 toque entre la vista mensual (límite y gasto del mes activo) y la *"Proyección Anual"*, que multiplica tu asignación mensual por 12 meses y la compara con el total acumulado del año natural.
* **Remanente anual estimado:** La tarjeta de resumen anual computa al instante cuánto margen presupuestario te queda para el resto del año.

### ¿Cómo funciona el trasvase de remanente al mes siguiente (Sinking Fund) en una Bolsa?
* **Ahorro acumulativo por bolsa:** En lugar de derivar todo el sobrante a fin de mes al Colchón general, puedes activar en cualquier bolsa la opción *"Trasvasar remanente al siguiente mes (Sinking Fund)"*.
* **Ideal para gastos no mensuales:** Perfecto para seguros (anuales, semestrales o trimestrales), revisiones de coche o impuestos periódicos. La bolsa retiene y acumula su remanente no gastado mes tras mes.
* **Límite elástico efectivo:** En el mes en curso, el límite disponible de la bolsa será su asignación base más todo el remanente acumulado que traiga de periodos anteriores.
* **Ajuste manual del remanente:** Dentro del modal de edición de la bolsa puedes corregir o inicializar el remanente acumulado actual con precisión de céntimos.

### ¿Puedo imputar un gasto al presupuesto del mes siguiente (Fecha de Compra vs Mes Efectivo)?
* **Fecha física vs Mes contable:** Ahora puedes realizar una compra a finales de mes o aprovechar una oferta puntual e imputar su gasto al sobre presupuestario del mes siguiente.
* **Sin sobreinflar la bolsa actual:** La compra queda registrada en el día real que se desembolsó en el calendario y extracto bancario, pero su importe computa y descuenta límite en la bolsa del mes siguiente (identificada con la insignia `🗓️ Compra DD/MM -> Imputado a Mes`).
* **Selector rápido en 1 toque:** En el modal de gasto o al importar desde el banco, dispones del botón *"⏩ Mes +1"* para diferir la imputación contable al instante sin cálculos manuales.

### ¿Cómo funcionan los reembolsos e inyecciones directas en una bolsa?
* **Reembolsos y Devoluciones:** Minoran directamente los gastos acumulados en la bolsa (`netSpent = gastos - reembolsos`), reflejando la realidad contable de Bizums o devoluciones sin inflar tus ingresos brutos.
* **Inyecciones extraordinarias:** Incrementan temporalmente el límite asignado a la bolsa durante ese mes sin alterar el límite maestro ni el salario base configurado.
* **Desglose unificado de movimientos:** Al pulsar sobre cualquier bolsa, puedes ver la lista cronológica completa de gastos y reembolsos con su neto exacto.

### ¿Los ajustes de Vasos Comunicantes y Sobregiros modifican los meses futuros?
* **Aislamiento mensual estricto:** Las calibraciones de Vasos Comunicantes y el reequilibrio de sobregiros son estrictamente puntuales y quedan acotados al mes seleccionado (`YYYY-MM`).
* **Límites base inmutables:** Los límites maestros que configuraste en tus bolsas no se modifican ni se contaminan; los meses siguientes conservan sus techos base originales de forma automática.
* **Insignia de Ajuste Puntual:** En las bolsas calibradas se muestra el distintivo `⚡ Puntual (+X € / -X €)` y el desglose de su límite base maestro original.
* **Botón de Retrocesión individual y global:** Puedes pulsar el botón `↩ Revertir` en cualquier bolsa o el botón de la cabecera para deshacer todos los ajustes del mes y restablecer los límites originales en 1 toque.

### ¿Cómo registro la Nómina Real del mes y en qué se diferencia de un Ingreso Extra?
* **Nómina Real Blindada por Mes (`monthlySalaries`):** Ahora puedes registrar el cobro de tu nómina o sueldo real tanto desde el importador bancario como pulsando el botón `+ Ingreso` en el Dashboard. Al elegir **"🏦 Nómina del Mes"**, este importe sustituye de forma exacta al salario base estimado de ese mes específico en tus cálculos de liquidez y Safe-to-Spend, sin sumarse doble como si fuera un ingreso extra.
* **Criterio Inteligente de Imputación (Día ≥ 20):** Si tu nómina se percibe a partir del día 20 del mes, CronoCash sugiere automáticamente imputarla al presupuesto del **mes siguiente** (ej. cobro el 28 de septiembre financia octubre). Si se cobra antes del día 20 (cobro a mes vencido a primeros de mes), se imputa al mes en curso. Puedes modificar el mes financiado en cualquier momento.
* **Botón rápido `⏩ Mes +1`:** Permite desplazar en 1 toque la fecha de cualquier ingreso puntual al primer día del mes siguiente para planificar compras o aportaciones futuras.
* **Historial segregado y reversible:** En la pestaña Historial puedes visualizar todas tus nóminas mensuales blindadas con su origen (Manual o Extracto Bancario) y restablecerlas al salario base configurado cuando lo desees con 1 toque.

---

## 3. Gastos Recurrentes, Tareas Periódicas y Detector Vampiro

### ¿Cómo gestiona CronoCash las tareas periódicas, facturas y costes estimados?
* **Tipos de coste flexibles:** Permite definir *Gastos Fijos* (recibos estables), *Costes Estimados* (facturas de importe variable, visitas veterinarias, regalos de cumpleaños) y *Tareas sin Coste* (cambio de lentillas, citas médicas, desparasitación de mascotas).
* **Categoría "Futuro Financiero":** Nueva categoría funcional de primer nivel orientada a inversiones periódicas, planes de pensiones, fondos indexados y ahorro patrimonial.
* **Categorías funcionales completas:** Clasificación visual y jerárquica limpia entre *Futuro Financiero*, *Seguros*, *Educación*, *Transporte*, *Ocio*, *Donaciones*, *Recibos*, *Suscripciones*, *Impuestos*, *Salud*, *Mantenimiento* y *Personal*.
* **¿Dónde se configuran las categorías funcionales?:** En el modal de *Crear o Editar Acto Recurrente*, justo debajo de la modalidad de coste, encontrarás el selector desplegable *"Categoría Funcional \*"*.
* **Catálogo de 40 iconos 100% Lucide React:** Extensa galería de iconos vectoriales para identificar visualmente cualquier servicio (`Wifi`, `Tv`, `Hogar`, `Llaves`, `Farmacia`, `Visión`, `Carro`, `Tren`, `Libros`, etc.).
* **Soporte anual y mensual exacto:** Para compromisos anuales (seguro del coche, IBI, cumpleaños) permite indicar tanto el mes del año como el día de cobro exacto.
* **Cuenta atrás semafórica y estado completado:** Cada acto muestra una insignia dinámica con su proximidad (🔴 *¡Toca HOY!*, 🟠 *¡Mañana!*, 🟡 *En X días*) y al cumplirse exhibe el estado *"✓ Completada hoy"* con indicador esmeralda.

### ¿Puedo crear, modificar o eliminar Categorías Funcionales sin dañar mis datos?
* **Gestor Dinámico Integrado:** Puedes acceder pulsando el botón *"Categorías"* en la cabecera de Recurrentes o mediante el acceso directo *"Gestionar Categorías"* junto al selector del formulario.
* **Crear y Personalizar:** Añade tantas categorías como necesites indicando su nombre, asignándole un icono entre los 40 iconos oficiales de Lucide React y un color distintivo de la paleta de 16 colores.
* **Modificar y Reordenar:** Puedes editar el nombre o aspecto de cualquier categoría y moverla arriba o abajo con los botones táctiles de flecha para que aparezca en el orden que prefieras.
* **Borrado Seguro con Reasignación Anti-Huérfanos:** Si intentas borrar una categoría que tiene compromisos activos, la app te solicitará elegir una categoría de destino (ej. Recibos o Personal) para transferirlos automáticamente, evitando que queden gastos huérfanos.
* **Fallback Defensivo Garantizado:** Si una regla tuviese una categoría eliminada o desconocida, la app nunca se bloquea ni genera error; se mostrará bajo la etiqueta *"General"* con icono neutro.
* **Catálogo del Sistema Protegido:** Las 12 categorías nativas vienen respaldadas por el sistema y dispones de un botón en el pie del gestor para *"Restablecer categorías del sistema"* a sus valores canónicos en cualquier momento.
* **Persistencia en Bóveda Cifrada y Backups:** Las categorías dinámicas se guardan en el almacén de configuración cifrado con AES-GCM en reposo y se transfieren íntegramente en las copias de seguridad de Google Drive (2 ranuras).

### ¿Cómo funciona el desplazamiento adaptativo de fechas futuras?
* **Adaptación automática al día real:** Si tienes programado un cambio de lentillas el día 27, pero lo realizas el 29 e indicas esa fecha, las recurrencias y notificaciones de los meses siguientes se moverán automáticamente al día 29.
* **Flexibilidad total:** Si en cualquier ocasión te adelantas o te retrasas unos días, al confirmar la fecha real el sistema reprograma todas las alertas futuras con los mismos preavisos fijados (1 mes, 1 semana, mismo día).
* **Opción de control:** Puedes activar o desactivar este comportamiento adaptativo de forma individual en cada tarea.

### ¿Cómo se confirma o actualiza el coste estimado el día del acto?
* **Modal de validación rápida:** Al pulsar sobre la notificación o en el botón *"Confirmar / Ajustar"* del calendario o de la lista de recurrentes, se abre el modal interactivo.
* **Importe editable:** Muestra el importe estimado inicialmente; si el recibo o la consulta veterinaria vino por un valor distinto, puedes corregirlo en el momento antes de guardarlo.
* **Registro atómico por fecha:** Al completar una tarea, queda asentada para esa fecha específica sin alterar ni duplicar los ciclos venideros.
* **Completar tareas sin gasto:** Si es una tarea sin coste (ej. lentillas o revisión en garantía), se marca completada con dot verde en calendario sin restar dinero de tus presupuestos.

### ¿Qué es el Detector de Gastos Vampiro?
* **Auditoría de suscripciones zombi:** Identifica servicios de streaming, membresías de gimnasio u ocio infrautilizados o duplicados.
* **Cálculo de ahorro anual:** Proyecta cuánto dinero liberas al año al cancelar o migrar planes mensuales a modalidades anuales con descuento.

### ¿Cómo funcionan los intervalos personalizados (Cada X semanas o meses)?
* **Frecuencia elástica a medida:** Puedes configurar que un gasto o tarea se repita cada X semanas (ej. cada 2 semanas para cobros quincenales) o cada X meses (ej. cada 2 meses para gas bimestral, cada 3 meses para trimestres, cada 6 meses para pólizas semestrales).
* **Proyección exacta en Calendario:** El motor de calendario computa las semanas y meses transcurridos desde la fecha de inicio módulo el intervalo fijado, evitando pintar el gasto en periodos que no corresponden.
* **Reserva inteligente en Safe-to-Spend:** Los gastos con intervalo mensual (X > 1) solo reservan saldo diario en el mes en el que efectivamente se produce el cobro, sin restar disponibilidad en los meses intermedios.
* **Alertas puntuales:** Las notificaciones programadas calculan con exactitud la fecha del próximo vencimiento efectivo respetando el intervalo.

### ¿Por qué es crucial la Fecha de Inicio en los gastos recurrentes y cómo se calcula?
* **Desacoplamiento de la fecha de registro:** CronoCash nunca asume que un gasto recurrente comenzó el día en que lo diste de alta en la app. Puedes introducir hoy una póliza o suscripción que empezó hace meses o que comenzará el mes que viene.
* **Anclaje exacto de intervalos:** La fecha de inicio actúa como el pivote canónico para computar las frecuencias (cada X semanas o meses), garantizando que las proyecciones caigan en las fechas legítimas.
* **Protección contra deducciones prematuras:** Si la fecha de inicio es futura, el motor de Safe-to-Spend no restará saldo diario en el mes actual ni saturará el calendario antes de que el compromiso entre en vigor.
* **Sincronización asistida sin bloqueo:** Al seleccionar una fecha de inicio, la app te sugiere automáticamente el día del mes y mes preferido, pero te permite modificarlos si lo necesitas.

### ¿Cómo funciona el Cobro Automático por defecto y la opción de Procesamiento Manual?
* **Cobro automático al vencimiento (Por defecto):** Cada gasto recurrente se contabiliza automáticamente como gasto ejecutado al llegar la fecha de cobro, sin requerir confirmación manual.
* **Reversión o ajuste con 1 toque:** Si un recibo se cobró de forma errónea o cambia su importe, puedes pulsar *"Revertir"* en el Calendario para anular el gasto y restaurar el compromiso.
* **Modalidad de Procesamiento Manual:** Puedes configurar reglas como manuales si prefieres pulsar *"Registrar Pago"* tú mismo al verificar la cuenta.
* **Alerta destacada de No Pagado:** Si un cobro manual vence sin haber sido registrado, el Calendario y la lista de Recurrentes lo alertan con badge prominente *"⚠️ No pagado"* y dot de atención visual animado.

### ¿Cómo funciona el Cese de Recurrencia y el cambio de cuotas futuras?
* **Cese limpio de compromisos:** Al dar de baja un servicio o suscripción, pulsa *"Cesar Recurrencia"*. La app marca el cese con fecha de hoy y cancela las proyecciones futuras en Calendario y Safe-to-Spend.
* **Historial inmutable garantizado:** Todos los gastos pasados generados por esa regla se conservan íntegros en tu base de datos con sus importes reales intactos.
* **Pestaña de Cesadas / Históricas:** Puedes consultar en cualquier momento tus compromisos cesados y reactivarlos con 1 toque si vuelves a contratarlos.
* **Modificación de importes futuros:** Modificar la cuota de una regla aplica únicamente a los pagos futuros, sin tocar jamás el coste de los gastos ya registrados.

### ¿Qué opciones de ordenación existen para las tarjetas (Categorías, Bolsas y Recurrentes)?
* **Drag & Drop con pestaña lateral táctil (Nuevo v1.21.0):** Mantén presionada la pestaña lateral izquierda (`GripVertical`) de cualquier tarjeta para levantarla y arrastrarla libremente arriba o abajo. Cuenta con aislamiento de scroll (`touch-action: none`) para evitar desplazamientos accidentales en móvil y vibra hápticamente al reordenar.
* **Próximo cobro inminente (Por defecto en recurrentes):** Prioriza automáticamente los pagos y tareas más cercanos a la fecha actual.
* **Orden manual con controles táctiles:** Permite situar las reglas en la posición exacta que desees con botones de subida/bajada y respuesta háptica, guardándose de forma permanente en IndexedDB.
* **Por categoría jerárquica:** Agrupa los compromisos según su criticidad contable (Recibos básicos, Suscripciones, Impuestos, Salud y Cuidado, Mantenimiento y Hogar, y Personal).
* **Por orden alfabético:** Disponible tanto por orden alfabético de categorías como por título (A-Z y Z-A).
* **Por importe:** Clasifica los cobros de mayor a menor importe (o viceversa) para un control estricto de las salidas de dinero más voluminosas.

### ¿Cómo conciliar o eliminar un gasto del extracto sin borrar la regla recurrente configurada? (Doble Paso de Conformidad)
* **Protección de recurrencias:** Al importar un extracto bancario con un gasto que ya estaba previsto en tus reglas recurrentes (ej. hipoteca, seguro o fibra), puedes conciliarlo con 1 solo toque o eliminar el apunte duplicado si correspondiera.
* **Doble paso de conformidad anti-errores:** Para impedir toques involuntarios con el pulgar en pantallas móviles, el sistema exige un doble paso de confirmación ("¿Estás seguro?" + botón de acción definitiva irreversible).
* **Regla intacta:** Eliminar un gasto puntual o apunte bancario duplicado jamás elimina ni altera la regla recurrente periódica configurada ni su historial.

### ¿Cómo interactúa "Nuevo Gasto" con las Reglas Inteligentes y los Cargos Recurrentes?
* **Auto-categorización inteligente en tiempo real:** Al escribir el concepto del gasto en el modal de *Nuevo Gasto*, CronoCash evalúa al vuelo tus reglas inteligentes configuradas (`SmartRules`) para auto-asignar la bolsa de presupuesto correcta y marcar si es factura con IVA.
* **Detección heurística de cargos recurrentes (±0.01 € y concepto):** Si el importe o nombre del gasto coincide con una regla recurrente programada activa (ej. recibo de luz, hipoteca o fibra), el formulario despliega una tarjeta de coincidencia destacada.
* **Vinculación y prevención de duplicados:** Al marcar la casilla de vinculación, el gasto se asocia a la regla recurrente (`recurringRuleId`), se anota la fecha en su registro de pagos completados (`completedDates`) y se elimina automáticamente cualquier cargo recurrente pre-generado duplicado en el mismo mes, garantizando cuentas limpias sin desembolsos dobles.

---

## 4. Calendario Reactivo, Cash-Flow Runway y Comparador YoY

### ¿Qué información ofrece el Calendario reactivo y cómo navegarlo?
* **Navegación ergonómica superior:** El selector interactivo de cambio de mes y semana se encuentra inmediatamente encima de los días del mes para una exploración táctil ágil con el pulgar.
* **Vista dual Mes y Semana:** Motor ultraligero con `date-fns` v4 que muestra puntos de actividad diferenciados por color (azul para facturas, violeta para salud/tareas, verde para tareas completadas y gastos reales).
* **Proyección estricta de periodicidades:** Las reglas anuales y trimestrales solo se pintan en el mes y día exactos que corresponden a su vencimiento.
* **Desglose diario interactivo:** Al tocar cualquier celda del calendario, el panel inferior permite ver los gastos ejecutados, validar tareas pendientes o consultar los actos ya cumplidos con badge visual *"✓ Completada"*.

### ¿Qué es el "Cash-Flow Runway" y cómo se protege en Modo Privacidad?
* **Previsión de liquidez a fin de mes:** Calcula en tiempo real tu saldo proyectado (`Ingresos - Gastos Reales - Recibos Comprometidos`) con semáforo de viabilidad financiera.
* **Blindaje bajo Modo Privacidad:** Al activar el botón del Ojo en la cabecera superior, tanto el saldo proyectado a fin de mes como los importes de Cash-Flow Runway se ofuscan automáticamente con asteriscos (`••••`).

### ¿Cómo funciona el Comparador Anual (YoY - Year over Year)?
* **Comparativa interanual:** Permite contrastar el gasto acumulado entre dos años cualesquiera, mostrando la tasa de variación porcentual y barras comparativas mes a mes.

---

## 5. Notificaciones y Alarmas Exactas de Cobro

### ¿Cómo se configuran los avisos en Android?
* **4 canales oficiales de notificación:** `crono_bills_alerts` (Cobros bancarios y seguros), `crono_tasks_alerts` (Tareas, salud y recordatorios preventivos), `crono_daily_review` (Cierre nocturno diario) y `crono_budget_alerts` (Límites de bolsa).
* **Compatibilidad Android 13+:** Solicita permisos en tiempo de ejecución (`POST_NOTIFICATIONS`) y opera con alarmas de precisión con `SCHEDULE_EXACT_ALARM`.

### ¿Qué opciones de aviso escalonado con antelación ofrece CronoCash?
* **Preavisos multietapa configurables:** Puedes elegir para cada acto avisos con el mismo día, 1 día antes, 3 días antes, 1 semana antes, 2 semanas antes, 1 mes antes (vital para cancelar seguros) o 1 trimestre antes (para provisionar gastos grandes).
* **Hora preferida:** Permite fijar la hora exacta de la alarma (ej. 09:00 AM) para no recibir notificaciones en horarios inoportunos.
* **Plazos fiscales automáticos:** Sincroniza automáticamente los plazos oficiales de la Agencia Tributaria (Modelos 130 y 303) avisándote 1 mes, 1 semana y el mismo día límite.
* **Deep-linking interactivo:** Tocar la notificación abre inmediatamente el modal de confirmación para validar o corregir el importe cobrado con un solo toque.

---

## 6. Copias de Seguridad en Google Drive (2 Ranuras) y Comparador Lado a Lado

### ¿En qué consiste la estrategia canónica de 2 ranuras?
* **Ranura 1 (`CronoCash_Actual.json`):** Tu copia principal y más reciente. Sobrescribe la copia anterior de forma inmediata y persistente, manteniendo siempre una única versión vigente y actualizada sin generar duplicados ni desloguear tu sesión al restaurar.
* **Ranura 2 (`CronoCash_Previa.json`):** Copia de seguridad histórica congelada para emergencias.
* **Integración SAF sin APIs invasivas:** Utiliza la hoja nativa de compartir de Android (`@capacitor/share` + `@capacitor/filesystem`) para guardar en Google Drive sin requerir claves de desarrollador ni sufrir tokens caducados.
* **Protección del Ciclo de Vida Móvil (Anti-Expulsión):** La apertura del selector de archivos del sistema o Google Drive cuenta con detección de selector activo y periodo de gracia, impidiendo que la aplicación bloquee la sesión o te expulse a la pantalla de PIN al elegir copias de respaldo.

### ¿Cómo me protege el Comparador Lado a Lado (Side-by-Side)?
* **Inspección de integridad previa:** Al seleccionar un archivo `.json`, se valida su estructura y checksum determinista.
* **Matriz comparativa:** Muestra en columnas paralelas los datos del teléfono frente a los de la copia (número de gastos, bolsas, metas, reglas inteligentes, recurrentes, total gastado y fechas) destacando los deltas (+/-).
* **Modos de restauración:** Permite elegir entre *Sobrescribir Completo* (reemplazo íntegro atómico) o *Fusionar Registros*.
* **Confirmación obligatoria:** Requiere marcar una casilla de verificación antes de tocar la base de datos para impedir pérdidas involuntarias.

### ¿Se respaldan mis Metas de Ahorro y Reglas Inteligentes en las Copias de Seguridad?
* **Snapshot Integral 100%:** Tanto la ranura en Google Drive (`CronoCash_Actual.json` / `Previa.json`) como las descargas JSON locales empaquetan íntegramente tus Metas & Sinking Funds y tus Reglas Inteligentes de categorización.
* **Blindaje contra reaparición involuntaria (Tombstone):** Si decides eliminar o modificar tus fondos de ahorro o reglas, tus decisiones son definitivas. Al instalar una nueva versión de la APK o actualizar la app, el sistema no volverá a regenerar ni forzar las semillas de fábrica.
* **Comparador de restauración enriquecido:** La comparativa lado a lado visualiza el total de metas y reglas de tu teléfono versus la copia para una verificación total.
* **Carga voluntaria de Plantilla Oficial:** En caso de desear restaurar las metas oficiales recomendadas (Fondo de Emergencia, Mantenimiento Hogar, Averías/Imprevistos), dispones de un botón directo "Plantilla" en el panel de Metas para incorporarlas en 1 toque.

---

## 7. Estrategias Financieras, Ingresos Pasivos y Escudo Anti-Estafas

### ¿Qué incluye el módulo de Estrategias (`TipsView`)?
* **14 estrategias maestras:** Cubre renegociación de contratos (luz, gas, telecomunicaciones y seguros con preaviso legal según Ley 50/1980), erradicación de comisiones bancarias y la regla de los 30 días.
* **Dinero rápido legal:** Métodos de venta optimizada de excedentes domésticos en Wallapop/Vinted (regla de las 3 cajas) y rescate de deducciones autonómicas en el IRPF.
* **Dinero pasivo protegido:** Cuentas remuneradas con garantía del FGD hasta 100.000€, fondos monetarios con diferimiento fiscal e inversión indexada periódica global (DCA).
* **Escudo Anti-Estafas:** Consulta en el registro oficial de la CNMV, regla de oro contra rentabilidades imposibles y defensa activa contra smishing y falsos asesores de Telegram.
* **Seguimiento activo:** Acordeones con pasos de acción numerados y botón *"Marcar como Aplicado"* para llevar el recuento de ahorro conseguido.

---

## 8. Iconografía Oficial Android y Tarjeta Verticons

### ¿Dónde se descargan y configuran los iconos de la aplicación?
* **Centro de Personalización en Ajustes:** Trasladado desde Bolsas a la sección de Ajustes para centralizar toda la identidad visual y descargas de recursos.
* **Icono Squircle Oficial APK:** Imagen JPG de alta resolución lista para guardar o compartir.
* **Edición Verticons Pack:** Tarjeta vertical en proporción 2:3 en ultra alta definición con marco de neón esmeralda al ras del borde y textura de fibra de carbono aeroespacial, disponible en PNG transparente (800x1200) y JPG con fondo negro.
* **Compatibilidad total:** Descarga directa a la galería o carpetas locales para personalizar tu pantalla de inicio mediante lanzadores compatibles (Nova Launcher, Niagara, Smart Launcher, etc.).

---

## 9. Arquitectura del Stack y Salud en Tiempo Real

### ¿Qué es el Grafo de Arquitectura y Salud del Stack?
* **Visualizador Canvas 2D interactivo:** Representa las 6 tecnologías nucleares de CronoCash (React 19, Capacitor, IndexedDB, Google Drive, Tailwind CSS/Lucide y Biometría/Alarmas) mediante esferas flotantes unidas por cables tensados con curvas Bézier y pulsos de energía.
* **Física táctil adaptativa:** Las esferas responden al arrastre con el dedo o ratón con cinemática suave a 60 FPS sin escapar de la pantalla.
* **Cero impacto en rendimiento:** Utiliza carga diferida (`React.lazy` y `<Suspense>`) con un peso de solo 6.57 kB comprimido, ejecutándose únicamente cuando abres la herramienta en Ajustes.

### ¿Qué indican los anillos de salud en tiempo real?
* **Verde (Óptimo):** Componente activo y respondiendo con telemetría en milisegundos (ej. latencia de lectura/escritura en IndexedDB, React 19 concurrente y Capacitor nativo en Android).
* **Ámbar (Modo Local / Desconectado):** El dispositivo no cuenta con conexión a Internet para copias en Google Drive, funcionando en modo 100% autónomo y seguro.
* **Índigo (Estático / Compilado):** Capas de diseño y librerías de interfaz empaquetadas en producción sin dependencias de red.

### ¿Cómo realizar un diagnóstico en caliente?
* **Inspección individual:** Toca cualquier esfera del mapa para desplegar su cajón de diagnóstico con versión, rol arquitectónico y latencia.
* **Re-ejecución pasiva:** Pulsa el botón *"Re-ejecutar Diagnóstico"* para medir de nuevo en caliente el tiempo de respuesta del almacenamiento y las conexiones.

---

## 10. Motor Safe-to-Spend y Asistente Cover Overspending

### ¿Qué es el límite "Safe-to-Spend" (Gasto Seguro Diario)?
* **Métrica predictiva anti-sorpresas:** Calcula exactamente cuánto dinero puedes gastar al día hasta el último día del mes sin comprometer tus facturas pendientes ni tocar tu colchón de emergencia.
* **Fórmula matemática transparente:** `Gasto Diario Seguro = (Ingresos - Gastos Pagados - Recurrentes Pendientes - Colchón Blindado) / Días Restantes del Mes`.
* **Aislamiento de compromisos futuros:** Si tienes facturas programadas a fin de mes (alquiler, luz, seguros), el motor las reserva de inmediato para que jamás te creas más solvente de lo que realmente eres.
* **Protección del Colchón:** El saldo asignado a bolsas de ahorro o imprevistos marcadas como amortiguador (`isBuffer: true`) queda aislado del cómputo diario.

### ¿Qué significa el Ritmo de Consumo (Burn-Rate)?
* **Comparador de velocidad de gasto:** Compara el porcentaje real consumido del presupuesto frente al porcentaje de días transcurridos del mes.
* **Semáforo de ritmo:**
  * 🟢 **Ritmo Óptimo:** Tu gasto avanza por debajo o igual al calendario; vas a cerrar el mes con superávit.
  * 🟡 **En Ritmo:** Consumo ligeramente superior al calendario; conviene moderar compras no prioritarias.
  * 🔴 **Alerta de Agotamiento:** Gasto acelerado; el motor te avisa antes de que entres en números rojos.

### ¿Cómo funciona el Simulador de Compras por Impulso?
* **Ensayo de gasto sin riesgo:** En la tarjeta de Safe-to-Spend del Dashboard, puedes pulsar botones rápidos (+20€, +50€, +100€) o introducir un importe arbitrario.
* **Simulación en tiempo real:** Muestra de forma inmediata cómo quedaría tu límite diario y cuántos días de supervivencia mantendrías si decides realizar ese desembolso imprevisto.

### ¿Qué es el Asistente "Cover Overspending" y cómo equilibra las bolsas?
* **Detección proactiva de desvíos:** Si alguna categoría supera su límite presupuestado, aparece automáticamente un aviso destacado en la vista de Bolsas.
* **Reequilibrio en 1 toque:** Al pulsar *"Equilibrar"*, el asistente te ofrece 3 vías inteligentes:
  1. *Compensar desde Colchón de Emergencias:* Absorbe el sobrecoste sin tocar las asignaciones de otras categorías operativas.
  2. *Compensar desde Mayor Superávit:* Extrae los fondos sobrantes de la bolsa que tenga mayor holgura acumulada.
  3. *Prorratear entre Bolsas con Margen:* Reparte la compensación de forma equitativa y proporcional entre todas las bolsas saludables.
* **Presupuesto Base Cero intacto:** Ningún euro se crea ni se destruye; el asistente ajusta los límites entre sobres garantizando que la suma total mensual se mantenga cuadrada.

---

## 11. Importador Universal Bancario Offline (Excel/CSV) y Deduplicación Bidireccional

### ¿Cómo funciona el Importador de Extractos Bancarios Excel y CSV?
* **Privacidad 100% offline:** El extracto bancario se procesa de forma íntegra en la memoria de tu dispositivo mediante Web Workers y Web Crypto API; ningún dato bancario o personal sale a Internet.
* **Compatibilidad con hojas Excel y CSV:** Acepta archivos `.xlsx`, `.xls`, `.csv` y `.tsv` de cualquier entidad nacional o internacional (Santander, BBVA, CaixaBank, ING, Sabadell, Openbank, Revolut, N26, etc.).
* **Omisión automática de preámbulos y resúmenes:** Escanea las filas del documento saltando automáticamente metadatos iniciales, resúmenes globales y movimientos no consolidados hasta dar con la cabecera canónica bancaria (`Fecha contable`, `Fecha valor`, `Descripción`, `Importe`, `Saldo`, `Divisa`).
* **Prioridad en Fecha Valor:** Asigna como fecha de liquidación real la "Fecha valor" para reflejar con fidelidad la salida o entrada de fondos.
* **Protección del Ciclo de Vida al Elegir Archivos:** Navegar hacia Google Drive o exploradores de archivos externos no bloquea la sesión ni expulsa al usuario al PIN gracias al periodo de gracia y al rastreo de selector activo.

### ¿Cómo previene CronoCash que se dupliquen gastos o ingresos ya existentes?
* **Deduplicador determinista bidireccional SHA-256:** Cada movimiento genera una firma criptográfica única basada en su fecha, concepto normalizado e importe.
* **Doble cotejo de seguridad:** Compara las transacciones entrantes tanto con el registro histórico de gastos como con la base de ingresos extras ya asentados.
* **Descarte automático de solapamientos:** Si importas un extracto con días solapados, el sistema detecta las transacciones coincidentes, las marca como duplicadas y las deselecciona por defecto.

### ¿Qué es la Bandeja de Revisión y cómo maneja Gastos e Ingresos?
* **Revisión en Lote de Alta Precisión (Sin ir uno a uno):** En lugar de forzarte a introducir transacciones individualmente, el sistema agrupa en un panel de staging todos los movimientos válidos pre-clasificados por las reglas inteligentes (SmartRules), permitiendo validar cientos de apuntes bancarios en segundos con 1 solo toque.
* **Diferenciación visual inmediata:** Muestra en la tabla insignias coloreadas para distinguir con claridad `+XX.XX € Ingreso / Abono` en tono esmeralda de `-XX.XX € Gasto` en tono rosa/blanco.
* **Control antes de asentar:** Tabla interactiva con contadores en tiempo real: movimientos detectados, nuevos válidos, duplicados descartados y auto-clasificados por regla.
* **Asentamiento segregado:** Al confirmar la importación, los gastos se incorporan a tu bolsa correspondiente y los ingresos positivos se integran en los ingresos del mes, garantizando cuentas exactas sin inflar gastos ficticios.
* **Creación de reglas al vuelo:** Puedes activar la casilla *"Guardar asignaciones como nuevas reglas automáticas"* para que el sistema recuerde la bolsa elegida en futuros extractos bancarios.

### ¿Cómo configurar las Reglas Inteligentes de Auto-Categorización?
* **Reglas semánticas por prioridad:** Asocia patrones de texto en el concepto (ej. `"MERCADONA"`, `"REPSOL"`, `"IBERDROLA"`) con su bolsa presupuestaria correspondiente.
* **Semillas maestras españolas:** La app incluye más de una docena de reglas precargadas para las principales cadenas de alimentación, gasolineras, suministros, telecomunicaciones, plataformas de streaming y seguros en España.
* **Gestor completo:** Accesible desde el Dashboard, Bolsas y Ajustes para consultar, activar, pausar o crear reglas personalizadas.

---

## 12. Metas de Ahorro y Fondos de Amortización ("Sinking Funds")

### ¿Tiene sentido usar Sinking Funds en una app offline sin conexión bancaria?
* **Elimina la ilusión de liquidez bancaria:** Si ves 1.500€ en tu banco, puedes creer que los tienes libres; pero si en 3 meses vence un seguro de 600€, 200€ ya no te pertenecen.
* **Blindaje del gasto diario (Safe-to-Spend):** Al reservar esa cuota mensual en CronoCash, tu disponible para gastar hoy se protege automáticamente, impidiendo compras impulsivas con dinero comprometido.
* **Soberanía sin riesgos:** No expones tus claves de acceso bancario ni sufres cortes de conexión de APIs de terceros.
* **Transformación de sobresaltos en rutina:** Convierte pagos anuales o semestrales angustiosos en una cómoda tarifa plana mensual.

### ¿Qué son los "Sinking Funds" (Fondos de Amortización)?
* **Ahorro previsor para gastos fijos no mensuales:** Permiten planificar desembolsos de periodicidad aperiódica o anual (seguro del vehículo, IBI, vacaciones, gastos escolares o reparaciones imprevistas) dividiendo el coste total en cuotas mensuales asumibles.
* **Prevención de quiebras presupuestarias:** Evitan que la llegada de un recibo anual de 500€ destruya el balance financiero de ese mes.
* **Interfaz compacta y purga ágil:** Cabecera con 3 KPIs de perfil bajo para conceder el máximo espacio a la lista y botón de papelera directo (`Trash2`) para descartar metas de ejemplo en 1 toque.

### ¿Cómo calcula el sistema el "Ritmo de Crucero"?
* **Fórmula matemática dinámica:** `Cuota Mensual = (Importe Objetivo - Saldo Acumulado) / Meses Restantes hasta la Fecha Límite`.
* **Recálculo reactivo:** Cada vez que realizas una aportación puntual o avanza el calendario, el motor actualiza la cuota requerida por mes y por día.
* **Semáforos de salud:** Cada meta muestra si marchas `En ritmo` (verde), `Requiere atención` (ámbar si te has quedado atrás en el calendario) o `¡Vencida/Crítica!` (rojo).

### ¿Cómo se conectan las metas con el motor Safe-to-Spend?
* **Blindaje automático del ahorro:** Al activar el interruptor *"Proteger en Safe-to-Spend"*, la cuota de crucero mensual de esa meta se resta automáticamente del disponible diario.
* **Gasto sin culpa:** El dinero destinado a tus metas queda blindado; lo que el semáforo diario de Safe-to-Spend te dice que puedes gastar hoy es dinero 100% libre y seguro.

### ¿Qué es el Asistente "Sweep & Fund" (Barrido de Superávit)?
* **Reparto de excedentes con 1 toque:** Al finalizar el mes, si has acumulado superávit en tu Safe-to-Spend, este asistente distribuye el saldo sobrante entre tus metas activas.
* **Ponderación por prioridad:** Las metas esenciales (Prioridad 1) reciben 3 veces más ponderación que las de ocio (Prioridad 3), asegurando que los compromisos críticos se cubran primero.

---

## 13. Informes Ejecutivos PDF y Cuadro Fiscal Trimestral (Mod. 130/303)

### ¿Cómo genero un Informe Ejecutivo Mensual en PDF?
* **Generación 100% offline:** Utiliza el motor vectorial cliente `jspdf` para construir en milisegundos un documento institucional A4 sin enviar datos a ningún servidor externo.
* **Diseño institucional de alta fidelidad:** Contiene cabecera con datos de la empresa o titular, NIF/CIF, tarjeta de 5 KPIs financieros (Ingresos, Gastos Totales, Balance Neto, Tasa de Ahorro y Gasto Diario Seguro Medio), tabla de ejecución por Bolsas, estado de Sinking Funds y Top 5 mayores gastos.
* **Descarga y compartición directa:** En dispositivos Android, el PDF se genera en memoria y activa la hoja de compartir nativa (`@capacitor/share`), permitiendo enviarlo por WhatsApp, guardarlo en Google Drive o archivarlo en Descargas. En navegador web, inicia una descarga directa.

### ¿Qué incluye el Cuadro Fiscal Trimestral para Autónomos y Particulares?
* **Agrupación por trimestres oficiales (1T, 2T, 3T, 4T):** Filtra automáticamente las facturas e ingresos comprendidos en cada periodo natural de la Agencia Tributaria (AEAT).
* **Semáforo de plazos oficiales:** Muestra los días naturales que restan hasta el vencimiento oficial de la presentación (20 de abril, 20 de julio, 20 de octubre, 30 de enero) con avisos de urgencia.
* **Simulador Modelo 130 (IRPF Fraccionado Estimación Directa):**
  * Computa ingresos brutos, resta gastos debidamente justificados con factura (`isInvoice: true`) y calcula el rendimiento neto acumulado.
  * Estima el pago a cuenta oficial del 20% (Casilla 07) para evitar sorpresas tributarias a fin de trimestre.
* **Simulador Modelo 303 (Liquidación Trimestral de IVA):**
  * Desglosa el IVA devengado/repercutido al 21% y el IVA soportado/deducible de las facturas registradas.
  * Ofrece el resultado líquido con calificación transparente: *"A Ingresar"* (si repercutiste más IVA del que soportaste) o *"A Compensar / Devolver"* (si tienes saldo a tu favor).

### ¿Cómo exportar el Libro Registro Oficial de Facturas?
* **Descarga en CSV normalizado:** Puedes pulsar *"Descargar Libro de Facturas (CSV)"* para obtener un archivo estructurado con BOM UTF-8 (compatible con Excel y software contable) que desglosa Fecha, Número de Factura, Proveedor, Concepto, Base Imponible, Tipo impositivo de IVA (%), Cuota de IVA y Total.

---

## 14. Centro Acerca de y Novedades de la App

### ¿Qué es el Centro "Acerca de & Novedades"?
* **Ficha de identidad transparente:** Te muestra en cualquier momento la versión instalada en tu dispositivo (`v1.18.0`), el número de compilación interno (`Build 11800`), la plataforma de ejecución y el certificado de privacidad (100% local sin servidores).
* **Novedades de la versión instalada:** Al actualizar la aplicación, puedes abrir este panel en Ajustes para ver de un vistazo qué funciones nuevas tienes disponibles.

### ¿Cómo funciona el Historial Explicado para Humanos?
* **Cero tecnicismos:** A diferencia del registro técnico de programación, este historial describe cada versión en lenguaje sencillo, directo y conciso (de 1 a 3 viñetas por versión) enfocado en lo que puedes hacer como usuario.
* **Exploración cronológica:** Cuenta con un desplegable interactivo para consultar la evolución de la app desde la versión 1.0.0 hasta la actualidad.

### ¿Cómo acceder al monitor de arquitectura y salud?
* **Enlace directo al stack:** Desde la propia pantalla de "Acerca de", dispones de un acceso directo para abrir el grafo visual 2D y verificar la salud de tu base de datos y la velocidad de respuesta del sistema en tiempo real.


