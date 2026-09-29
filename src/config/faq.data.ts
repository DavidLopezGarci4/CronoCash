import { FAQSection } from '../types/faq';

export const FAQ_DATA: FAQSection[] = [
  {
    id: 'seguridad',
    title: '1. Seguridad y Acceso Biométrico / PIN',
    iconName: 'ShieldCheck',
    description: 'Privacidad local en IndexedDB, biometría Jetpack obligatoria, PIN de respaldo y salida segura',
    items: [
      {
        id: 'privacidad-datos',
        question: '¿Cómo protege CronoCash la privacidad de mis datos?',
        bullets: [
          'Bóveda Cifrada en Reposo (AES-GCM-256): Todos tus gastos, presupuestos, reglas recurrentes y metas se cifran con clave maestra de 256 bits derivada localmente mediante Web Crypto API nativa. Los datos en IndexedDB y almacenamiento local quedan blindados criptográficamente ante extracciones o filtraciones no autorizadas.',
          'Cifrado y descifrado transparente: La información se descifra en milisegundos en la memoria volátil del dispositivo solo durante el uso activo de la aplicación. Incluye test de integridad en Ajustes.',
          'Biometría nativa obligatoria al inicio: Al iniciar la app o volver desde segundo plano, se invoca de forma inmediata el lector de huella dactilar nativo de Android (BiometricPrompt Jetpack) para un acceso instantáneo sin teclear.',
          'Teclado PIN táctil como respaldo seguro: Solo si decides retroceder o cancelar el diálogo nativo de huella dactilar, se muestra el teclado numérico virtual integrado para evitar espionajes de teclados de terceros.',
          'Diálogo seguro de confirmación de salida: Al pulsar el botón "Atrás" de Android en la vista principal o los botones táctiles de salida en la UI, un pop-up interactivo te solicita confirmación para evitar cierres accidentales.',
          'Modo Privacidad en 1 toque: Oculta con asteriscos (••••) los importes sensibles del panel principal y el saldo proyectado a fin de mes en el calendario.',
          'Auto-bloqueo preventivo: Al minimizar la aplicación o apagar la pantalla (visibilitychange), la sesión se bloquea automáticamente para salvaguardar tu saldo.',
          'Bloqueo manual inmediato: Puedes pulsar el candado situado en la cabecera superior en cualquier momento para bloquear la sesión en 1 toque.',
          'Respuesta háptica táctil y control On/Off: Cada pulsación del teclado PIN, confirmación de pagos o cambio de pestaña emite vibración táctil nativa precisa con opción de activarla o apagarla en cualquier momento desde Ajustes.',
        ],
        tags: ['seguridad', 'pin', 'biometría', 'huella', 'privacidad', 'cifrado', 'aes-gcm', 'bóveda', 'bloqueo', 'salida', 'modo privacidad', 'local', 'háptica', 'vibración'],
        badge: 'Cifrado AES-GCM',
      },
    ],
  },
  {
    id: 'bolsas',
    title: '2. Bolsas de Presupuesto, Vasos Comunicantes y Rollover',
    iconName: 'PieChart',
    description: 'Presupuesto base cero (Envelopes), transferencias elásticas y acumulación de ahorro',
    items: [
      {
        id: 'sistema-bolsas',
        question: '¿Qué es el sistema de Bolsas ("Envelopes")?',
        bullets: [
          'Distribución por categorías: Asigna tus ingresos mensuales a 8 bolsas maestras (Vivienda, Suministros, Supermercado, Movilidad, Seguros, Telecomunicaciones, Ocio y Colchón de Ahorro).',
          'Plantilla inteligente (Smart Seeds): Puedes cargar la plantilla oficial precargada con importes realistas adaptados al coste de vida en España y Europa.',
        ],
        tags: ['bolsas', 'presupuesto', 'sobres', 'categorías', 'semillas', 'seeds'],
      },
      {
        id: 'vasos-comunicantes',
        question: '¿Cómo funcionan los "Vasos Comunicantes"?',
        bullets: [
          'Reequilibrio elástico: Si una bolsa supera su límite (déficit), el sistema te permite transferir saldo sobrante desde una bolsa con superávit sin alterar tu presupuesto total del mes.',
          'Interacción háptica: Ajusta los límites mediante el botón de Vasos Comunicantes en la pestaña de Bolsas para compensar desvíos con respuesta táctil.',
        ],
        tags: ['vasos comunicantes', 'reequilibrio', 'déficit', 'superávit', 'transferencia'],
      },
      {
        id: 'rollover',
        question: '¿Qué ocurre con el dinero no gastado a fin de mes (Rollover)?',
        bullets: [
          'Acumulación de ahorro: El superávit mensual no consumido no desaparece; se transfiere automáticamente a la bolsa amortiguadora de Colchón de Ahorro e Imprevistos.',
        ],
        tags: ['rollover', 'ahorro', 'sobrante', 'colchón', 'fin de mes'],
      },
    ],
  },
  {
    id: 'recurrentes',
    title: '3. Gastos Recurrentes, Tareas Periódicas y Detector Vampiro',
    iconName: 'Repeat',
    description: 'Recibos fijos, costes estimados, tareas de salud sin coste, ciclo adaptativo y estado de cumplimiento',
    items: [
      {
        id: 'gestion-recibos',
        question: '¿Cómo gestiona CronoCash las tareas periódicas, facturas y costes estimados?',
        bullets: [
          'Tipos de coste flexibles: Permite definir Gastos Fijos (recibos estables), Costes Estimados (facturas variables, visitas veterinarias, regalos) y Tareas sin Coste (cambio de lentillas, citas médicas, desparasitación de mascotas).',
          'Categorías funcionales limpias: Clasificación visual entre Recibos, Suscripciones, Impuestos, Salud, Mantenimiento y Personal, sin etiquetas redundantes.',
          'Soporte anual y mensual exacto: Para pagos anuales (seguro del coche, IBI, cumpleaños) permite indicar tanto el mes del año como el día de cobro exacto.',
          'Cuenta atrás semafórica y estado completado: Cada acto muestra una insignia dinámica con su proximidad (🔴 ¡Toca HOY!, 🟠 ¡Mañana!, 🟡 En X días) y al cumplirse exhibe el estado "✓ Completada hoy" con indicador esmeralda.',
        ],
        tags: ['recurrentes', 'recibos', 'facturas', 'lentillas', 'veterinario', 'coste estimado', 'tareas', 'completada hoy'],
      },
      {
        id: 'desplazamiento-adaptativo',
        question: '¿Cómo funciona el desplazamiento adaptativo de fechas futuras?',
        bullets: [
          'Adaptación automática al día real: Si tienes programado un cambio de lentillas el día 27, pero lo realizas el 29 e indicas esa fecha, las recurrencias y notificaciones de los meses siguientes se moverán automáticamente al día 29.',
          'Flexibilidad total: Si en cualquier ocasión te adelantas o te retrasas unos días, al confirmar la fecha real el sistema reprograma todas las alertas futuras con los mismos preavisos fijados (1 mes, 1 semana, mismo día).',
          'Opción de control: Puedes activar o desactivar este comportamiento adaptativo de forma individual en cada tarea.',
        ],
        tags: ['adaptativo', 'desplazamiento', 'fechas futuras', 'lentillas', 'reprogramar', 'ciclo'],
        badge: 'Inteligente',
      },
      {
        id: 'confirmar-ajustar-coste',
        question: '¿Cómo se confirma o actualiza el coste estimado el día del acto?',
        bullets: [
          'Modal de validación rápida: Al pulsar sobre la notificación o en el botón "Confirmar / Ajustar" del calendario o de la lista de recurrentes, se abre el modal interactivo.',
          'Importe editable: Muestra el importe estimado inicialmente; si el recibo o la consulta veterinaria vino por un valor distinto, puedes corregirlo en el momento antes de guardarlo.',
          'Registro atómico por fecha: Al completar una tarea, queda asentada para esa fecha específica sin alterar ni duplicar los ciclos venideros.',
          'Completar tareas sin gasto: Si es una tarea sin coste (ej. lentillas o revisión en garantía), se marca completada con dot verde en calendario sin restar dinero de tus presupuestos.',
        ],
        tags: ['confirmar coste', 'ajustar importe', 'factura real', 'estimado', 'completar fecha'],
      },
      {
        id: 'gastos-vampiro',
        question: '¿Qué es el Detector de Gastos Vampiro?',
        bullets: [
          'Auditoría de suscripciones zombi: Identifica servicios de streaming, membresías de gimnasio u ocio infrautilizados o duplicados.',
          'Cálculo de ahorro anual: Proyecta cuánto dinero liberas al año al cancelar o migrar planes mensuales a modalidades anuales con descuento.',
        ],
        tags: ['vampiro', 'suscripciones', 'ahorro anual', 'streaming', 'cancelar'],
        badge: 'Detector Pro',
      },
      {
        id: 'intervalos-recurrentes',
        question: '¿Cómo funcionan los intervalos personalizados (Cada X semanas o meses)?',
        bullets: [
          'Frecuencia elástica a medida: Puedes configurar que un gasto o tarea se repita cada X semanas (ej. cada 2 semanas para cobros quincenales) o cada X meses (ej. cada 2 meses para gas bimestral, cada 3 meses para trimestres, cada 6 meses para pólizas semestrales).',
          'Proyección exacta en Calendario: El motor de calendario computa las semanas y meses transcurridos desde la fecha de inicio módulo el intervalo fijado, evitando pintar el gasto en periodos que no corresponden.',
          'Reserva inteligente en Safe-to-Spend: Los gastos con intervalo mensual (X > 1) solo reservan saldo diario en el mes en el que efectivamente se produce el cobro, sin restar disponibilidad en los meses intermedios.',
          'Alertas puntuales: Las notificaciones programadas calculan con exactitud la fecha del próximo vencimiento efectivo respetando el intervalo.',
        ],
        tags: ['intervalos', 'quincenal', 'bimestral', 'trimestral', 'semestral', 'cada x semanas', 'cada x meses'],
        badge: 'Flexibilidad X',
      },
      {
        id: 'fecha-inicio-origen',
        question: '¿Por qué es crucial la Fecha de Inicio en los gastos recurrentes y cómo se calcula?',
        bullets: [
          'Desacoplamiento de la fecha de registro: CronoCash nunca asume que un gasto recurrente comenzó el día en que lo diste de alta en la app. Puedes introducir hoy una póliza o suscripción que empezó hace meses o que comenzará el mes que viene.',
          'Anclaje exacto de intervalos: La fecha de inicio actúa como el pivote canónico para computar las frecuencias (cada X semanas o meses), garantizando que las proyecciones caigan en las fechas legítimas.',
          'Protección contra deducciones prematuras: Si la fecha de inicio es futura, el motor de Safe-to-Spend no restará saldo diario en el mes actual ni saturará el calendario antes de que el compromiso entre en vigor.',
          'Sincronización asistida sin bloqueo: Al seleccionar una fecha de inicio, la app te sugiere automáticamente el día del mes y mes preferido, pero te permite modificarlos si lo necesitas.',
        ],
        tags: ['fecha inicio', 'origen', 'desacoplamiento', 'registro', 'intervalo', 'safe to spend'],
        badge: 'Canónico',
      },
      {
        id: 'cobro-automatico-vs-manual',
        question: '¿Cómo funciona el Cobro Automático por defecto y la opción de Procesamiento Manual?',
        bullets: [
          'Cobro automático al vencimiento (Por defecto): Cada gasto recurrente se contabiliza automáticamente como gasto ejecutado al llegar la fecha de cobro, sin requerir confirmación manual.',
          'Reversión o ajuste con 1 toque: Si un recibo se cobró de forma errónea o cambia su importe, puedes pulsar "Revertir" en el Calendario para anular el gasto y restaurar el compromiso.',
          'Modalidad de Procesamiento Manual: Puedes configurar reglas como manuales si prefieres pulsar "Registrar Pago" tú mismo al verificar la cuenta.',
          'Alerta destacada de No Pagado: Si un cobro manual vence sin haber sido registrado, el Calendario y la lista de Recurrentes lo alertan con badge prominente "⚠️ No pagado" y dot de atención visual animado.',
        ],
        tags: ['cobro automatico', 'procesamiento manual', 'no pagado', 'revertir', 'alerta impago', 'vencimiento'],
        badge: 'Automatización 2.0',
      },
      {
        id: 'cese-recurrencia-historico',
        question: '¿Cómo funciona el Cese de Recurrencia y el cambio de cuotas futuras?',
        bullets: [
          'Cese limpio de compromisos: Al dar de baja un servicio o suscripción, pulsa "Cesar Recurrencia". La app marca el cese con fecha de hoy y cancela las proyecciones futuras en Calendario y Safe-to-Spend.',
          'Historial inmutable garantizado: Todos los gastos pasados generados por esa regla se conservan íntegros en tu base de datos con sus importes reales intactos.',
          'Pestaña de Cesadas / Históricas: Puedes consultar en cualquier momento tus compromisos cesados y reactivarlos con 1 toque si vuelves a contratarlos.',
          'Modificación de importes futuros: Modificar la cuota de una regla aplica únicamente a los pagos futuros, sin tocar jamás el coste de los gastos ya registrados.',
        ],
        tags: ['cesar recurrencia', 'baja', 'histórico', 'inmutable', 'importes futuros', 'reactivar'],
        badge: 'Auditoría Fiel',
      },
    ],
  },
  {
    id: 'calendario',
    title: '4. Calendario Reactivo, Cash-Flow Runway y Comparador YoY',
    iconName: 'Calendar',
    description: 'Cronograma visual ergonómico, previsión de liquidez mensual blindada y análisis interanual',
    items: [
      {
        id: 'info-calendario',
        question: '¿Qué información ofrece el Calendario reactivo y cómo navegarlo?',
        bullets: [
          'Navegación ergonómica superior: El selector interactivo de cambio de mes y semana se encuentra inmediatamente encima de los días del mes para una exploración táctil ágil con el pulgar.',
          'Vista dual Mes y Semana: Motor ultraligero con date-fns v4 que muestra puntos de actividad diferenciados por color (azul para facturas, violeta para salud/tareas, verde para tareas completadas y gastos reales).',
          'Proyección estricta de periodicidades: Las reglas anuales y trimestrales solo se pintan en el mes y día exactos que corresponden a su vencimiento.',
          'Desglose diario interactivo: Al tocar cualquier celda del calendario, el panel inferior permite ver los gastos ejecutados, validar tareas pendientes o consultar los actos ya cumplidos con badge visual "✓ Completada".',
        ],
        tags: ['calendario', 'vista mes', 'semana', 'ergonomía', 'gastos diarios', 'salud', 'navegación'],
      },
      {
        id: 'cashflow-runway',
        question: '¿Qué es el "Cash-Flow Runway" y cómo se protege en Modo Privacidad?',
        bullets: [
          'Previsión de liquidez a fin de mes: Calcula en tiempo real tu saldo proyectado (Ingresos - Gastos Reales - Recibos Comprometidos) con semáforo de viabilidad financiera.',
          'Blindaje bajo Modo Privacidad: Al activar el botón del Ojo en la cabecera superior, tanto el saldo proyectado a fin de mes como los importes de Cash-Flow Runway se ofuscan automáticamente con asteriscos (••••).',
        ],
        tags: ['cash-flow', 'runway', 'liquidez', 'previsión', 'saldo proyectado', 'privacidad'],
      },
      {
        id: 'comparador-yoy',
        question: '¿Cómo funciona el Comparador Anual (YoY - Year over Year)?',
        bullets: [
          'Comparativa interanual: Permite contrastar el gasto acumulado entre dos años cualesquiera, mostrando la tasa de variación porcentual y barras comparativas mes a mes.',
        ],
        tags: ['yoy', 'interanual', 'comparativa', 'años', 'evolución'],
      },
    ],
  },
  {
    id: 'notificaciones',
    title: '5. Notificaciones y Alarmas Exactas de Cobro',
    iconName: 'Bell',
    description: 'Canales Android, preavisos escalonados personalizables y plazos fiscales',
    items: [
      {
        id: 'config-avisos',
        question: '¿Cómo se configuran los avisos en Android?',
        bullets: [
          '4 canales oficiales de notificación de alta prioridad: crono_bills_alerts (Cobros bancarios y seguros), crono_tasks_alerts (Tareas, salud y recordatorios preventivos), crono_daily_review (Cierre nocturno diario) y crono_budget_alerts (Límites de bolsa).',
          'Compatibilidad Android 13+: Solicita permisos en tiempo de ejecución (POST_NOTIFICATIONS) y opera con alarmas de precisión con SCHEDULE_EXACT_ALARM.',
        ],
        tags: ['notificaciones', 'alarmas', 'android 13', 'permisos', 'canales', 'tareas'],
      },
      {
        id: 'alertas-preprogramadas',
        question: '¿Qué opciones de aviso escalonado con antelación ofrece CronoCash?',
        bullets: [
          'Preavisos multietapa configurables: Puedes elegir para cada acto avisos con el mismo día, 1 día antes, 3 días antes, 1 semana antes, 2 semanas antes, 1 mes antes (vital para cancelar seguros) o 1 trimestre antes (para provisionar gastos grandes).',
          'Hora preferida: Permite fijar la hora exacta de la alarma (ej. 09:00 AM) para no recibir notificaciones en horarios inoportunos.',
          'Plazos fiscales automáticos: Sincroniza automáticamente los plazos oficiales de la Agencia Tributaria (Modelos 130 y 303) avisándote 1 mes, 1 semana y el mismo día límite.',
          'Deep-linking interactivo: Tocar la notificación abre inmediatamente el modal de confirmación para validar o corregir el importe cobrado con un solo toque.',
        ],
        tags: ['preaviso', 'aviso escalonado', 'trimestre', 'seguros', 'aeat', 'deep-linking'],
        badge: 'Escalonado',
      },
    ],
  },
  {
    id: 'backup',
    title: '6. Copias de Seguridad en Google Drive (2 Ranuras) y Comparador Lado a Lado',
    iconName: 'Cloud',
    description: 'Ranuras Actual y Previa, integración SAF sin APIs invasivas y validación SHA-256',
    items: [
      {
        id: 'dos-ranuras',
        question: '¿En qué consiste la estrategia canónica de 2 ranuras?',
        bullets: [
          'Ranura 1 (CronoCash_Actual.json): Tu copia principal y más reciente de uso continuado.',
          'Ranura 2 (CronoCash_Previa.json): Copia de seguridad histórica congelada para emergencias.',
          'Integración SAF sin APIs invasivas: Utiliza la hoja nativa de compartir de Android (@capacitor/share + @capacitor/filesystem) para guardar en Google Drive sin requerir claves de desarrollador ni sufrir tokens caducados.',
        ],
        tags: ['backup', 'copia de seguridad', 'google drive', 'ranuras', 'saf', 'json'],
        badge: 'Estrategia 2 Ranuras',
      },
      {
        id: 'comparador-lado-a-lado',
        question: '¿Cómo me protege el Comparador Lado a Lado (Side-by-Side)?',
        bullets: [
          'Inspección de integridad previa: Al seleccionar un archivo .json, se valida su estructura y checksum determinista.',
          'Matriz comparativa: Muestra en columnas paralelas los datos del teléfono frente a los de la copia (número de gastos, bolsas, reglas, total gastado y fechas) destacando los deltas (+/-).',
          'Modos de restauración: Permite elegir entre Sobrescribir Completo (reemplazo íntegro atómico) o Fusionar Registros.',
          'Confirmación obligatoria: Requiere marcar una casilla de verificación antes de tocar la base de datos para impedir pérdidas involuntarias.',
        ],
        tags: ['comparador', 'side-by-side', 'restauración', 'checksum', 'fusión'],
      },
    ],
  },
  {
    id: 'estrategias',
    title: '7. Estrategias Financieras, Ingresos Pasivos y Escudo Anti-Estafas',
    iconName: 'Lightbulb',
    description: '14 métodos legales de ahorro, optimización de contratos y protección patrimonial',
    items: [
      {
        id: 'modulo-estrategias',
        question: '¿Qué incluye el módulo de Estrategias (TipsView)?',
        bullets: [
          '14 estrategias maestras: Cubre renegociación de contratos (luz, gas, telecomunicaciones y seguros con preaviso legal según Ley 50/1980), erradicación de comisiones bancarias y la regla de los 30 días.',
          'Dinero rápido legal: Métodos de venta optimizada de excedentes domésticos en Wallapop/Vinted (regla de las 3 cajas) y rescate de deducciones autonómicas en el IRPF.',
          'Dinero pasivo protegido: Cuentas remuneradas con garantía del FGD hasta 100.000€, fondos monetarios con diferimiento fiscal e inversión indexada periódica global (DCA).',
          'Escudo Anti-Estafas: Consulta en el registro oficial de la CNMV, regla de oro contra rentabilidades imposibles y defensa activa contra smishing y falsos asesores de Telegram.',
          'Seguimiento activo: Acordeones con pasos de acción numerados y botón "Marcar como Aplicado" para llevar el recuento de ahorro conseguido.',
        ],
        tags: ['estrategias', 'tips', 'ahorro', 'ingresos pasivos', 'anti-estafas', 'cnmv', 'contratos'],
      },
    ],
  },
  {
    id: 'verticons',
    title: '8. Iconografía Oficial Android y Tarjeta Verticons',
    iconName: 'Smartphone',
    description: 'Mipmaps adaptativos y empaque de tarjeta vertical 2:3 en ultra alta definición',
    items: [
      {
        id: 'iconos-verticons',
        question: '¿Dónde se descargan y configuran los iconos de la aplicación?',
        bullets: [
          'Centro de Personalización en Ajustes: Trasladado desde Bolsas a la sección de Ajustes para centralizar toda la identidad visual y descargas de recursos.',
          'Icono Squircle Oficial APK: Imagen JPG de alta resolución lista para guardar o compartir.',
          'Edición Verticons Pack: Tarjeta vertical en proporción 2:3 en ultra alta definición con marco de neón esmeralda al ras del borde y textura de fibra de carbono aeroespacial, disponible en PNG transparente (800x1200) y JPG con fondo negro.',
          'Compatibilidad total: Descarga directa a la galería o carpetas locales para personalizar tu pantalla de inicio mediante lanzadores compatibles (Nova Launcher, Niagara, Smart Launcher, etc.).',
        ],
        tags: ['iconos', 'verticons', 'mipmap', 'launcher', 'tarjeta vertical', 'ajustes', 'personalización'],
      },
    ],
  },
  {
    id: 'arquitectura',
    title: '9. Arquitectura del Stack y Salud en Tiempo Real',
    iconName: 'Cpu',
    description: 'Grafo Canvas 2D a 60 FPS, telemetría de latencias y diagnóstico en caliente',
    items: [
      {
        id: 'grafo-arquitectura',
        question: '¿Qué es el Grafo de Arquitectura y Salud del Stack?',
        bullets: [
          'Visualizador Canvas 2D interactivo: Representa las 6 tecnologías nucleares de CronoCash (React 19, Capacitor, IndexedDB, Google Drive, Tailwind CSS/Lucide y Biometría/Alarmas) mediante esferas flotantes unidas por curvas Bézier y pulsos de energía.',
          'Física táctil adaptativa: Las esferas responden al arrastre con el dedo o ratón con cinemática suave a 60 FPS sin escapar de la pantalla.',
          'Cero impacto en rendimiento: Utiliza carga diferida (React.lazy y Suspense) con un peso de solo 6.57 kB comprimido, ejecutándose únicamente cuando abres la herramienta en Ajustes.',
        ],
        tags: ['arquitectura', 'grafo', 'stack', 'salud', 'canvas', 'react 19', 'telemetría'],
      },
      {
        id: 'anillos-salud',
        question: '¿Qué indican los anillos de salud en tiempo real?',
        bullets: [
          'Verde (Óptimo): Componente activo y respondiendo con telemetría en milisegundos (ej. latencia en IndexedDB, React 19 concurrente y Capacitor nativo en Android).',
          'Ámbar (Modo Local / Desconectado): El terminal no cuenta con conexión a Internet para copias en Google Drive, funcionando en modo 100% autónomo y seguro.',
          'Índigo (Estático / Compilado): Capas de diseño y librerías de interfaz empaquetadas en producción sin dependencias de red.',
        ],
        tags: ['anillos', 'salud', 'óptimo', 'latencia', 'modo local'],
      },
      {
        id: 'diagnostico-caliente',
        question: '¿Cómo realizar un diagnóstico en caliente?',
        bullets: [
          'Inspección individual: Toca cualquier esfera del mapa para desplegar su cajón de diagnóstico con versión, rol arquitectónico y latencia.',
          'Re-ejecución pasiva: Pulsa el botón "Re-ejecutar Diagnóstico" para medir de nuevo en caliente el tiempo de respuesta del almacenamiento y las conexiones.',
        ],
        tags: ['diagnóstico', 're-ejecutar', 'inspección'],
      },
    ],
  },
  {
    id: 'safetospend',
    title: '10. Motor Safe-to-Spend y Asistente Cover Overspending',
    iconName: 'Sparkles',
    description: 'Límite de gasto diario predictivo, semáforo de burn-rate y simulador de compras',
    items: [
      {
        id: 'limite-safetospend',
        question: '¿Qué es el límite "Safe-to-Spend" (Gasto Seguro Diario)?',
        bullets: [
          'Métrica predictiva anti-sorpresas: Calcula exactamente cuánto dinero puedes gastar al día hasta el último día del mes sin comprometer tus facturas pendientes ni tocar tu colchón de emergencia.',
          'Fórmula matemática transparente: Gasto Diario Seguro = (Ingresos - Gastos Pagados - Recurrentes Pendientes - Colchón Blindado) / Días Restantes del Mes.',
          'Aislamiento de compromisos futuros: Si tienes facturas programadas a fin de mes (alquiler, luz, seguros), el motor las reserva de inmediato para que jamás te creas más solvente de lo que realmente eres.',
          'Protección del Colchón: El saldo asignado a bolsas de ahorro o imprevistos marcadas como amortiguador (isBuffer: true) queda aislado del cómputo diario.',
        ],
        tags: ['safe-to-spend', 'gasto seguro', 'límite diario', 'fórmula', 'previsión'],
        badge: 'Motor Núcleo',
      },
      {
        id: 'ritmo-burnrate',
        question: '¿Qué significa el Ritmo de Consumo (Burn-Rate)?',
        bullets: [
          'Comparador de velocidad de gasto: Compara el porcentaje real consumido del presupuesto frente al porcentaje de días transcurridos del mes.',
          '🟢 Ritmo Óptimo: Tu gasto avanza por debajo o igual al calendario; vas a cerrar el mes con superávit.',
          '🟡 En Ritmo: Consumo ligeramente superior al calendario; conviene moderar compras no prioritarias.',
          '🔴 Alerta de Agotamiento: Gasto acelerado; el motor te avisa antes de que entres en números rojos.',
        ],
        tags: ['burn-rate', 'ritmo', 'velocidad', 'semáforo', 'consumo'],
      },
      {
        id: 'simulador-impulsos',
        question: '¿Cómo funciona el Simulador de Compras por Impulso?',
        bullets: [
          'Ensayo de gasto sin riesgo: En la tarjeta de Safe-to-Spend del Dashboard, puedes pulsar botones rápidos (+20€, +50€, +100€) o introducir un importe arbitrario.',
          'Simulación en tiempo real: Muestra de forma inmediata cómo quedaría tu límite diario y cuántos días de supervivencia mantendrías si decides realizar ese desembolso imprevisto.',
        ],
        tags: ['simulador', 'compras por impulso', 'ensayo', 'impacto diario'],
      },
      {
        id: 'cover-overspending',
        question: '¿Qué es el Asistente "Cover Overspending" y cómo equilibra las bolsas?',
        bullets: [
          'Detección proactiva de desvíos: Si alguna categoría supera su límite presupuestado, aparece automáticamente un aviso destacado en la vista de Bolsas.',
          'Compensar desde Colchón de Emergencias: Absorbe el sobrecoste sin tocar las asignaciones de otras categorías operativas.',
          'Compensar desde Mayor Superávit: Extrae los fondos sobrantes de la bolsa que tenga mayor holgura acumulada.',
          'Prorratear entre Bolsas con Margen: Reparte la compensación de forma equitativa y proporcional entre todas las bolsas saludables.',
          'Presupuesto Base Cero intacto: Ningún euro se crea ni se destruye; el asistente ajusta los límites entre sobres garantizando que la suma total mensual se mantenga cuadrada.',
        ],
        tags: ['cover overspending', 'reequilibrio', 'desvíos', 'asistente', 'compensación'],
      },
    ],
  },
  {
    id: 'importer',
    title: '11. Importador Universal Bancario Offline (Excel/CSV) y Deduplicación Bidireccional',
    iconName: 'Upload',
    description: 'Procesamiento offline privado, omisión de preámbulo, detección de cabeceras, soporte de ingresos y gastos',
    items: [
      {
        id: 'importador-csv',
        question: '¿Cómo funciona el Importador de Extractos Bancarios Excel y CSV?',
        bullets: [
          'Privacidad 100% offline: El extracto bancario se procesa de forma íntegra en la memoria de tu dispositivo mediante Web Workers y Web Crypto API; ningún dato bancario o personal sale a Internet.',
          'Compatibilidad con hojas Excel y CSV: Acepta archivos .xlsx, .xls, .csv y .tsv de cualquier banco nacional e internacional (Santander, BBVA, CaixaBank, ING, Sabadell, Openbank, Revolut, N26, etc.).',
          'Omisión automática de preámbulos y resúmenes: Escanea las filas del documento saltando automáticamente metadatos iniciales, resúmenes globales y movimientos no consolidados hasta dar con la cabecera canónica bancaria (Fecha contable, Fecha valor, Descripción, Importe, Saldo, Divisa).',
          'Prioridad en Fecha Valor: Asigna como fecha de liquidación real la "Fecha valor" para reflejar con fidelidad la salida o entrada de fondos.',
        ],
        tags: ['importador', 'excel', 'xlsx', 'xls', 'csv', 'bancos', 'extractos', 'offline', 'privacidad', 'cabeceras', 'fecha valor'],
      },
      {
        id: 'deduplicador-sha256',
        question: '¿Cómo previene CronoCash que se dupliquen gastos o ingresos ya existentes?',
        bullets: [
          'Deduplicador determinista bidireccional SHA-256: Cada movimiento genera una firma criptográfica única basada en su fecha, concepto normalizado e importe.',
          'Doble cotejo de seguridad: Compara las transacciones entrantes tanto con el registro histórico de gastos como con la base de ingresos extras ya asentados.',
          'Descarte automático de solapamientos: Si importas un extracto con días solapados, el sistema detecta las transacciones coincidentes, las marca como duplicadas y las deselecciona por defecto.',
        ],
        tags: ['deduplicación', 'sha256', 'duplicados', 'ingresos', 'gastos', 'criptografía', 'solapamientos'],
      },
      {
        id: 'staging-table',
        question: '¿Qué es la Bandeja de Revisión y cómo maneja Gastos e Ingresos?',
        bullets: [
          'Diferenciación visual inmediata: Muestra en la tabla insignias coloreadas para distinguir con claridad "+XX.XX € Ingreso / Abono" en tono esmeralda de "-XX.XX € Gasto" en tono rosa/blanco.',
          'Control antes de asentar: Tabla interactiva con contadores en tiempo real: movimientos detectados, nuevos válidos, duplicados descartados y auto-clasificados por regla.',
          'Asentamiento segregado: Al confirmar la importación, los gastos se incorporan a tu bolsa correspondiente y los ingresos positivos se integran en los ingresos del mes, garantizando cuentas exactas sin inflar gastos ficticios.',
          'Creación de reglas al vuelo: Puedes activar la casilla "Guardar asignaciones como nuevas reglas automáticas" para que el sistema recuerde la bolsa elegida en futuros extractos bancarios.',
        ],
        tags: ['staging', 'bandeja de revisión', 'asentar', 'ingresos', 'abonos', 'gastos', 'revisión', 'contadores'],
      },
      {
        id: 'reglas-inteligentes',
        question: '¿Cómo configurar las Reglas Inteligentes de Auto-Categorización?',
        bullets: [
          'Reglas semánticas por prioridad: Asocia patrones de texto en el concepto (ej. "MERCADONA", "REPSOL", "IBERDROLA") con su bolsa presupuestaria correspondiente.',
          'Semillas maestras españolas: La app incluye más de una docena de reglas precargadas para las principales cadenas de alimentación, gasolineras, suministros, telecomunicaciones, plataformas de streaming y seguros en España.',
          'Gestor completo: Accesible desde el Dashboard, Bolsas y Ajustes para consultar, activar, pausar o crear reglas personalizadas.',
        ],
        tags: ['reglas inteligentes', 'auto-categorización', 'semillas', 'patrones'],
      },
    ],
  },
  {
    id: 'goals',
    title: '12. Metas de Ahorro y Fondos de Amortización ("Sinking Funds")',
    iconName: 'Target',
    description: 'Ahorro aperiódico previsor, cálculo de ritmo de crucero, blindaje Safe-to-Spend y gestión compacta',
    items: [
      {
        id: 'sinking-funds-offline',
        question: '¿Tiene sentido usar Sinking Funds en una app offline sin conexión bancaria?',
        bullets: [
          'Elimina la ilusión de liquidez bancaria: Si ves 1.500€ en tu banco, puedes creer que los tienes libres; pero si en 3 meses vence un seguro de 600€, 200€ ya no te pertenecen.',
          'Blindaje del gasto diario (Safe-to-Spend): Al reservar esa cuota mensual en CronoCash, tu disponible para gastar hoy se protege automáticamente, impidiendo compras impulsivas con dinero comprometido.',
          'Soberanía sin riesgos: No expones tus claves de acceso bancario ni sufres cortes de conexión de APIs de terceros.',
          'Transformación de sobresaltos en rutina: Convierte pagos anuales o semestrales angustiosos en una cómoda tarifa plana mensual.',
        ],
        tags: ['offline', 'sinking funds', 'banco', 'ilusión liquidez', 'safe-to-spend', 'soberanía'],
        badge: 'Esencial Offline',
      },
      {
        id: 'sinking-funds',
        question: '¿Qué son los "Sinking Funds" (Fondos de Amortización)?',
        bullets: [
          'Ahorro previsor para gastos fijos no mensuales: Permiten planificar desembolsos aperiódicos o anuales (seguro de coche, IBI, vacaciones, gastos escolares o reparaciones) dividiendo el coste total en cuotas mensuales asumibles.',
          'Prevención de quiebras presupuestarias: Evitan que la llegada de un recibo anual de 500€ destruya el balance financiero de ese mes.',
          'Interfaz compacta y purga ágil: Cabecera con 3 KPIs de perfil bajo para conceder el máximo espacio a la lista y botón de papelera directo (Trash2) para descartar metas de ejemplo en 1 toque.',
        ],
        tags: ['sinking funds', 'metas', 'fondos amortización', 'gastos anuales', 'ibi', 'seguro', 'kpi compacto'],
      },
      {
        id: 'ritmo-crucero',
        question: '¿Cómo calcula el sistema el "Ritmo de Crucero"?',
        bullets: [
          'Fórmula matemática dinámica: Cuota Mensual = (Importe Objetivo - Saldo Acumulado) / Meses Restantes hasta la Fecha Límite.',
          'Recálculo reactivo: Cada vez que realizas una aportación puntual o avanza el calendario, el motor actualiza la cuota requerida por mes y por día.',
          'Semáforos de salud: Cada meta muestra si marchas En ritmo (verde), Requiere atención (ámbar si te has quedado atrás) o ¡Vencida/Crítica! (rojo).',
        ],
        tags: ['ritmo de crucero', 'cuota mensual', 'fórmula', 'cálculo', 'semáforo'],
      },
      {
        id: 'conexion-safetospend',
        question: '¿Cómo se conectan las metas con el motor Safe-to-Spend?',
        bullets: [
          'Blindaje automático del ahorro: Al activar el interruptor "Proteger en Safe-to-Spend", la cuota de crucero mensual de esa meta se resta automáticamente del disponible diario.',
          'Gasto sin culpa: El dinero destinado a tus metas queda blindado; lo que el semáforo diario de Safe-to-Spend te dice que puedes gastar hoy es dinero 100% libre y seguro.',
        ],
        tags: ['protección', 'blindaje', 'safe-to-spend', 'metas'],
      },
      {
        id: 'sweep-and-fund',
        question: '¿Qué es el Asistente "Sweep & Fund" (Barrido de Superávit)?',
        bullets: [
          'Reparto de excedentes con 1 toque: Al finalizar el mes, si has acumulado superávit en tu Safe-to-Spend, este asistente distribuye el saldo sobrante entre tus metas activas.',
          'Ponderación por prioridad: Las metas esenciales (Prioridad 1) reciben 3 veces más ponderación que las de ocio (Prioridad 3), asegurando que los compromisos críticos se cubran primero.',
        ],
        tags: ['sweep and fund', 'barrido', 'superávit', 'reparto excedentes', 'prioridad'],
      },
    ],
  },
  {
    id: 'reports',
    title: '13. Informes Ejecutivos PDF y Cuadro Fiscal Trimestral (Mod. 130/303)',
    iconName: 'FileText',
    description: 'Generación client-side con jspdf, simulación fiscal IRPF/IVA y libro de facturas CSV',
    items: [
      {
        id: 'informe-pdf',
        question: '¿Cómo genero un Informe Ejecutivo Mensual en PDF?',
        bullets: [
          'Generación 100% offline: Utiliza el motor vectorial cliente jspdf para construir en milisegundos un documento institucional A4 sin enviar datos a ningún servidor externo.',
          'Diseño institucional de alta fidelidad: Contiene cabecera con datos de la empresa o titular, NIF/CIF, tarjeta de 5 KPIs financieros, tabla de ejecución por Bolsas, estado de Sinking Funds y Top 5 mayores gastos.',
          'Descarga y compartición directa: En Android, activa la hoja de compartir nativa (@capacitor/share) para enviarlo por WhatsApp o archivarlo. En web, inicia descarga directa.',
        ],
        tags: ['pdf', 'informe ejecutivo', 'jspdf', 'kpi', 'descarga'],
        badge: 'Exportación A4',
      },
      {
        id: 'cuadro-fiscal',
        question: '¿Qué incluye el Cuadro Fiscal Trimestral para Autónomos y Particulares?',
        bullets: [
          'Agrupación por trimestres oficiales (1T, 2T, 3T, 4T): Filtra automáticamente facturas e ingresos comprendidos en cada periodo natural de la Agencia Tributaria (AEAT).',
          'Semáforo de plazos oficiales: Muestra los días naturales que restan hasta el vencimiento oficial de la presentación (20 de abril, 20 de julio, 20 de octubre, 30 de enero).',
          'Simulador Modelo 130 (IRPF Fraccionado): Computa ingresos brutos, resta gastos debidamente justificados con factura y calcula el pago a cuenta oficial del 20% (Casilla 07).',
          'Simulador Modelo 303 (IVA Trimestral): Desglosa IVA devengado/repercutido al 21% e IVA soportado/deducible, ofreciendo el resultado líquido "A Ingresar" o "A Compensar".',
        ],
        tags: ['cuadro fiscal', 'aeat', 'modelo 130', 'modelo 303', 'irpf', 'iva', 'trimestre'],
      },
      {
        id: 'libro-facturas',
        question: '¿Cómo exportar el Libro Registro Oficial de Facturas?',
        bullets: [
          'Descarga en CSV normalizado: Puedes pulsar "Descargar Libro de Facturas (CSV)" para obtener un archivo estructurado con BOM UTF-8 (compatible con Excel y software contable) que desglosa Fecha, Número de Factura, Proveedor, Concepto, Base Imponible, Tipo de IVA (%), Cuota de IVA y Total.',
        ],
        tags: ['libro registro', 'facturas', 'csv', 'contabilidad', 'excel'],
      },
    ],
  },
  {
    id: 'acerca-de',
    title: '14. Centro Acerca de y Novedades de la App',
    iconName: 'Sparkles',
    description: 'Ficha de identidad de la versión v1.17.0, historial para humanos y telemetría',
    items: [
      {
        id: 'centro-acerca-de',
        question: '¿Qué es el Centro "Acerca de & Novedades"?',
        bullets: [
          'Ficha de identidad transparente: Te muestra en cualquier momento la versión instalada en tu dispositivo (v1.17.0), número de compilación interno (Build 11700), plataforma de ejecución y certificado de privacidad local.',
          'Novedades de la versión instalada: Al actualizar la aplicación, puedes abrir este panel en Ajustes para ver de un vistazo qué funciones nuevas tienes disponibles.',
        ],
        tags: ['acerca de', 'versión', 'novedades', 'build', 'identidad'],
      },
      {
        id: 'historial-humanos',
        question: '¿Cómo funciona el Historial Explicado para Humanos?',
        bullets: [
          'Cero tecnicismos: Describe cada versión en lenguaje sencillo, directo y conciso (de 1 a 3 viñetas por versión) enfocado en lo que puedes hacer como usuario.',
          'Exploración cronológica: Cuenta con un desplegable interactivo para consultar la evolución de la app desde la versión 1.0.0 hasta la actualidad.',
        ],
        tags: ['historial', 'changelog', 'humanos', 'versiones anteriores'],
      },
      {
        id: 'acceso-stack',
        question: '¿Cómo acceder al monitor de arquitectura y salud?',
        bullets: [
          'Enlace directo al stack: Desde la propia pantalla de "Acerca de", dispones de un acceso directo para abrir el grafo visual 2D y verificar la salud de tu base de datos y la velocidad de respuesta del sistema en tiempo real.',
        ],
        tags: ['monitor', 'salud', 'stack', 'grafo 2d'],
      },
    ],
  },
];
