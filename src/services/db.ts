import { Expense, Bucket, RecurringRule, Settings, FinancialTip, BackupEnvelope, SmartRule } from '../types';

const DB_NAME = 'GastosFacturacionDB';
const DB_VERSION = 2;

const STORES = {
  EXPENSES: 'expenses',
  BUCKETS: 'buckets',
  RECURRING_RULES: 'recurring_rules',
  SETTINGS: 'settings',
  TIPS: 'tips',
  SMART_RULES: 'smart_rules',
} as const;

export const DEFAULT_SETTINGS: Settings = {
  id: 'default_settings',
  pinSeguridad: '',
  bloqueoPinActivo: false,
  biometriaActiva: false,
  guardarContrasenaAuto: false,
  currency: '€',
  monthlyIncome: 2200,
  userFullName: 'Usuario',
  companyName: '',
  taxId: '',
  notificationsEnabled: true,
  theme: 'dark',
  updatedAt: new Date().toISOString(),
};

export const DEFAULT_BUCKETS: Bucket[] = [
  {
    id: 'bucket-vivienda',
    name: 'Vivienda & Hipoteca / Alquiler',
    budgetLimit: 650,
    color: '#3b82f6', // blue
    icon: 'Home',
    isBuffer: false,
    notes: 'Cuota de hipoteca o alquiler mensual, IBI y comunidad',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'bucket-suministros',
    name: 'Suministros (Luz, Gas, Agua)',
    budgetLimit: 160,
    color: '#f59e0b', // amber
    icon: 'Zap',
    isBuffer: false,
    notes: 'Electricidad, gas natural, agua y tasa de basuras',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'bucket-super',
    name: 'Alimentación y Supermercado',
    budgetLimit: 380,
    color: '#10b981', // emerald
    icon: 'ShoppingCart',
    isBuffer: false,
    notes: 'Alimentación, droguería y compras básicas del hogar',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'bucket-transporte',
    name: 'Combustible y Movilidad',
    budgetLimit: 150,
    color: '#06b6d4', // cyan
    icon: 'Car',
    isBuffer: false,
    notes: 'Gasolina, diésel, transporte público, parkings y peajes',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'bucket-seguros',
    name: 'Seguros (Coche, Hogar, Salud)',
    budgetLimit: 95,
    color: '#8b5cf6', // purple
    icon: 'ShieldCheck',
    isBuffer: false,
    notes: 'Pólizas de seguro de auto, vivienda, decesos y coberturas médicas',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'bucket-teleco',
    name: 'Telecomunicaciones y Fibra',
    budgetLimit: 70,
    color: '#ec4899', // pink
    icon: 'Smartphone',
    isBuffer: false,
    notes: 'Fibra óptica en casa, líneas móviles y plataformas streaming',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'bucket-ocio',
    name: 'Ocio y Restauración',
    budgetLimit: 180,
    color: '#f97316', // orange
    icon: 'Utensils',
    isBuffer: false,
    notes: 'Restaurantes, cafés, cine, escapadas y caprichos personales',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'bucket-colchon',
    name: 'Colchón de Ahorro e Imprevistos',
    budgetLimit: 250,
    color: '#14b8a6', // teal
    icon: 'PiggyBank',
    isBuffer: true,
    notes: 'Bolsa amortiguadora para imprevistos, averías y acumulación de ahorro',
    createdAt: new Date().toISOString(),
  },
];

export const DEFAULT_RECURRING_SEEDS: RecurringRule[] = [
  {
    id: 'rec-hipoteca',
    title: 'Hipoteca / Alquiler Vivienda',
    amount: 650,
    bucketId: 'bucket-vivienda',
    frequency: 'monthly',
    dayOfMonth: 1,
    startDate: new Date().toISOString().split('T')[0],
    isActive: true,
    autoCreateExpense: true,
    icon: 'Home',
    notes: 'Recibo domiciliado de cuota hipotecaria o arrendamiento',
  },
  {
    id: 'rec-luz',
    title: 'Electricidad y Suministros (Luz)',
    amount: 75,
    bucketId: 'bucket-suministros',
    frequency: 'monthly',
    dayOfMonth: 10,
    startDate: new Date().toISOString().split('T')[0],
    isActive: true,
    autoCreateExpense: true,
    icon: 'Zap',
    notes: 'Factura mensual de luz en mercado regulado/libre',
  },
  {
    id: 'rec-agua',
    title: 'Recibo de Agua y Saneamiento',
    amount: 32,
    bucketId: 'bucket-suministros',
    frequency: 'monthly',
    dayOfMonth: 15,
    startDate: new Date().toISOString().split('T')[0],
    isActive: true,
    autoCreateExpense: true,
    icon: 'Zap',
    notes: 'Canal de distribución de agua y tasa de basuras',
  },
  {
    id: 'rec-fibra',
    title: 'Fibra Óptica + 2 Líneas Móvil',
    amount: 48,
    bucketId: 'bucket-teleco',
    frequency: 'monthly',
    dayOfMonth: 5,
    startDate: new Date().toISOString().split('T')[0],
    isActive: true,
    autoCreateExpense: true,
    icon: 'Smartphone',
    notes: 'Operador de telecomunicaciones (Fibra y datos ilimitados)',
  },
  {
    id: 'rec-seguro-coche',
    title: 'Seguro Anual del Vehículo',
    amount: 320,
    bucketId: 'bucket-seguros',
    frequency: 'yearly',
    dayOfMonth: 20,
    startDate: new Date().toISOString().split('T')[0],
    isActive: true,
    autoCreateExpense: true,
    icon: 'Car',
    notes: 'Póliza de seguro a todo riesgo o terceros con lunas',
  },
  {
    id: 'rec-gimnasio',
    title: 'Cuota Gimnasio / Salud Deportiva',
    amount: 39.9,
    bucketId: 'bucket-ocio',
    frequency: 'monthly',
    dayOfMonth: 2,
    startDate: new Date().toISOString().split('T')[0],
    isActive: true,
    autoCreateExpense: true,
    icon: 'Utensils',
    notes: 'Membresía mensual deportiva',
  },
  {
    id: 'rec-streaming',
    title: 'Suscripción Streaming Multimedia',
    amount: 12.99,
    bucketId: 'bucket-teleco',
    frequency: 'monthly',
    dayOfMonth: 8,
    startDate: new Date().toISOString().split('T')[0],
    isActive: true,
    autoCreateExpense: true,
    icon: 'Smartphone',
    isVampire: true,
    notes: 'Gasto vampiro: susceptible de migración a plan anual con 2 meses gratis',
  },
];

export const DEFAULT_TIPS: FinancialTip[] = [
  // --- AHORRO Y RENEGOCIACIÓN ESTRATÉGICA ---
  {
    id: 'tip-luz-gas',
    title: 'Auditoría de Luz: Potencia y Comparador CNMC',
    category: 'ahorro',
    impact: 'alto',
    estimatedSavingsOrEarning: '180€ - 420€ / año',
    timeNeeded: '20 min',
    difficulty: 'fácil',
    riskLevel: 'cero_riesgo',
    officialSourceOrLegalBasis: 'Comparador de Ofertas de Energía de la CNMC (comparador.cnmc.gob.es)',
    content: 'La mayoría de hogares tienen contratada más potencia de la necesaria (ej. 4.6 kW o 5.7 kW cuando 3.45 kW es suficiente). Bajar un tramo de potencia ahorra de 40€ a 70€ anuales en el término fijo de por vida. Además, revisa si pagas "servicios de mantenimiento de urgencia" ocultos de 5€ a 9€/mes que casi nunca se usan.',
    actionSteps: [
      'Revisa el pico de potencia máxima demandada en tu distribuidora (i-DE, e-distribución, etc.).',
      'Si nunca has superado 3.3 kW, solicita a tu comercializadora bajar la potencia contratada.',
      'Sube tu factura al comparador oficial CNMC y descarta comercializadoras con servicios de mantenimiento forzosos.',
    ],
  },
  {
    id: 'tip-teleco-amago',
    title: 'Optimización de Fibra y Móvil (Amago Legal)',
    category: 'ahorro',
    impact: 'alto',
    estimatedSavingsOrEarning: '240€ - 480€ / año',
    timeNeeded: '30 min',
    difficulty: 'fácil',
    riskLevel: 'cero_riesgo',
    officialSourceOrLegalBasis: 'Ley 11/2022 General de Telecomunicaciones (Portabilidad gratuita)',
    content: 'Las grandes telecos reservan descuentos de hasta el 50% durante 12 meses para retenciones. Si pagas más de 35€/mes por fibra y una línea móvil, o bien llamas pidiendo igualar precios de operadoras low-cost (Digi, O2, Simyo) o inicias una solicitud de portabilidad para que retenciones te aplique la tarifa oculta fidelizada.',
    actionSteps: [
      'Verifica que no tengas permanencia activa en tu factura actual.',
      'Compara precios de operadores directos (ej. Fibra 300Mb + 50GB por ~20-25€/mes).',
      'Llama a fidelización de tu operador o tramita portabilidad a otra compañía para activar la contraoferta al 50%.',
    ],
  },
  {
    id: 'tip-seguros-preaviso',
    title: 'Preaviso Legal de 1 Mes en Seguros (Ley 50/1980)',
    category: 'facturacion',
    impact: 'alto',
    estimatedSavingsOrEarning: '120€ - 350€ / año',
    timeNeeded: '1 hora',
    difficulty: 'medio',
    riskLevel: 'cero_riesgo',
    officialSourceOrLegalBasis: 'Artículo 22 de la Ley 50/1980 de Contrato de Seguro',
    content: 'Las aseguradoras suelen subir la prima de auto u hogar de forma tácita un 10%-25% anual. La ley te ampara para cancelar o renegociar con al menos 1 mes de preaviso antes de la fecha de vencimiento. Cotiza con 40 días de margen en comparadores y exige a tu compañía que iguale la prima del nuevo mercado.',
    actionSteps: [
      'Identifica la fecha de renovación de tu póliza en CronoCash.',
      'Pon una alarma a 45 días antes del vencimiento.',
      'Solicita cotizaciones alternativas y envía escrito fehaciente (email certificado o web) si no igualan el precio.',
    ],
  },
  {
    id: 'tip-regla-30-dias',
    title: 'Regla de los 30 Días contra Compras Impulsivas',
    category: 'presupuesto',
    impact: 'alto',
    estimatedSavingsOrEarning: '400€ - 1.200€ / año',
    timeNeeded: 'Inmediato',
    difficulty: 'fácil',
    riskLevel: 'cero_riesgo',
    officialSourceOrLegalBasis: 'Psicología conductual aplicada al consumo financiero',
    content: 'Antes de comprar cualquier artículo no esencial superior a 50€, anótalo en una lista de deseos y espera 30 días naturales. Si trascurrido el mes aún sientes la necesidad real y cabe en tu bolsa de Ocio, cómpralo; en más del 70% de las ocasiones el impulso dopaminérgico se disipa por completo.',
    actionSteps: [
      'Añade una nota en tu móvil: "Lista de espera 30 días" con fecha y precio.',
      'Elimina las tarjetas guardadas en plataformas de ecommerce para añadir fricción de pago.',
      'Si tras 30 días lo compras, traslada el importe a tu bolsa correspondiente.',
    ],
  },
  {
    id: 'tip-cero-comisiones',
    title: 'Erradicación de Comisiones Bancarias Ocultas',
    category: 'ahorro',
    impact: 'medio',
    estimatedSavingsOrEarning: '60€ - 240€ / año',
    timeNeeded: '15 min',
    difficulty: 'fácil',
    riskLevel: 'cero_riesgo',
    officialSourceOrLegalBasis: 'Fondo de Garantía de Depósitos (FGD) y Banco de España',
    content: 'Pagar comisión de mantenimiento, cuota anual por tarjeta de débito o transferencias ordinarias es totalmente prescindible. Existen entidades con solvencia máxima y respaldo del FGD que ofrecen cuenta 100% gratuita sin requisitos de nómina obligatoria (Openbank, ING, BBVA Online, Sabadell Online, N26).',
    actionSteps: [
      'Revisa tu extracto bancario de los últimos 6 meses en busca de comisiones de liquidación.',
      'Si tu banco te cobra, solicita la exoneración o abre una cuenta online sin comisiones.',
      'Traspasa recibos domiciliados cómodamente con el servicio gratuito de cambio de cuenta bancaria.',
    ],
  },

  // --- GENERACIÓN DE DINERO RÁPIDO (LEGAL Y ACTIVO) ---
  {
    id: 'tip-segunda-mano-wallapop',
    title: 'Venta Optimizada de Excedentes (Método de las 3 Cajas)',
    category: 'dinero_rapido',
    impact: 'alto',
    estimatedSavingsOrEarning: '150€ - 800€ en 1-2 semanas',
    timeNeeded: '2 horas',
    difficulty: 'fácil',
    riskLevel: 'cero_riesgo',
    officialSourceOrLegalBasis: 'Venta de bienes usados entre particulares (no sujeta a IRPF si no hay plusvalía comercial)',
    content: 'En casi cualquier hogar hay entre 300€ y 1.000€ inmovilizados en dispositivos electrónicos en desuso, ropa sin estrenar, herramientas y libros. Venderlos en Wallapop, Vinted o Cash Converters es legal, rápido y desahoga espacio.',
    actionSteps: [
      'Aplica la regla de las 3 cajas en casa: Guardar, Donar, Vender.',
      'Limpia los objetos y haz fotos con luz natural diurna sobre fondo blanco o neutro.',
      'Fija un precio 10%-15% por encima de lo que deseas para dar margen al comprador y usa envíos protegidos.',
    ],
  },
  {
    id: 'tip-deducciones-autonomicas',
    title: 'Rescate de Deducciones Autonómicas en el IRPF',
    category: 'fiscal',
    impact: 'alto',
    estimatedSavingsOrEarning: '150€ - 1.200€ por ejercicio',
    timeNeeded: '45 min',
    difficulty: 'medio',
    riskLevel: 'cero_riesgo',
    officialSourceOrLegalBasis: 'Agencia Estatal de Administración Tributaria (AEAT) y normativas autonómicas',
    content: 'El borrador automático de la Renta de Hacienda NO incluye por defecto muchas deducciones autonómicas: gastos de alquiler de vivienda habitual, material escolar, gastos de guardería, abono de transporte, donaciones (desgravan hasta el 80% en los primeros 250€) o mejoras de eficiencia energética.',
    actionSteps: [
      'Entra en el manual de IRPF de tu Comunidad Autónoma en la web de la AEAT.',
      'Localiza si cumples requisitos por límite de renta para deducción por alquiler o hijos.',
      'Conserva las facturas y comprobantes bancarios para adjuntarlos a tu borrador.',
    ],
  },
  {
    id: 'tip-microservicios-habilidades',
    title: 'Monetización de Habilidades Locales y Remotas',
    category: 'dinero_rapido',
    impact: 'medio',
    estimatedSavingsOrEarning: '100€ - 600€ / mes',
    timeNeeded: 'Flexible',
    difficulty: 'medio',
    riskLevel: 'cero_riesgo',
    officialSourceOrLegalBasis: 'Prestación de servicios profesionales y límites de habitualidad tributaria',
    content: 'Ofrecer servicios de valor directo a tu comunidad o en plataformas online: clases particulares de idiomas/refuerzo escolar, formateo y mantenimiento de ordenadores para pymes locales, transcripción o soporte administrativo digital.',
    actionSteps: [
      'Identifica tu habilidad con mayor demanda local (informática, idiomas, fotografía, trámites).',
      'Publica anuncios en portales locales (Superprof, Milanuncios, tablones comunitarios).',
      'Registra los ingresos y consulta los umbrales de facturación periódica y Seguridad Social.',
    ],
  },

  // --- GENERACIÓN DE DINERO PASIVO (100% PROTEGIDO Y SIN HUMO) ---
  {
    id: 'tip-cuentas-remuneradas-fgd',
    title: 'Cuentas Remuneradas Respaldadas por el FGD',
    category: 'dinero_pasivo',
    impact: 'alto',
    estimatedSavingsOrEarning: '3% - 4% TAE asegurado',
    timeNeeded: '15 min de alta',
    difficulty: 'fácil',
    riskLevel: 'cero_riesgo',
    officialSourceOrLegalBasis: 'Fondo de Garantía de Depósitos (hasta 100.000€ por depositante y banco)',
    content: 'Tener el colchón de ahorro o el fondo de imprevistos a interés 0% en una cuenta corriente convencional hace que pierda poder adquisitivo por la inflación. Cuentas remuneradas con ficha bancaria europea y FGD remuneran el saldo a la vista con disponibilidad del dinero en cualquier segundo.',
    actionSteps: [
      'Verifica que la entidad tenga código bancario oficial y esté bajo FGD europeo.',
      'Ingresa tu colchón de ahorro de 3 a 6 meses de gastos en la cuenta remunerada.',
      'Los intereses se abonan mensual o trimestralmente de forma automática y con retención fiscal transparente.',
    ],
  },
  {
    id: 'tip-fondos-monetarios',
    title: 'Fondos Monetarios: Máxima Eficiencia Fiscal',
    category: 'dinero_pasivo',
    impact: 'alto',
    estimatedSavingsOrEarning: 'Rendimiento cercano a tipos del BCE con diferimiento fiscal',
    timeNeeded: '30 min',
    difficulty: 'medio',
    riskLevel: 'bajo',
    officialSourceOrLegalBasis: 'Régimen de traspasos sin peaje fiscal (Art. 94 Ley 35/2006 del IRPF)',
    content: 'Los fondos monetarios invierten en deuda pública y pagarés a cortísimo plazo de máxima solvencia (AAA). En España cuentan con una ventaja colosal: el traspaso entre fondos no tributa. Puedes reinvertir o mover dinero entre fondos sin pagar el 19%-26% de IRPF hasta que lo retires a tu cuenta.',
    actionSteps: [
      'Accede a una comercializadora de fondos sin custodia (MyInvestor, IronIA, etc.).',
      'Busca fondos monetarios en euros de gestoras de primer nivel (Groupama, AXA, DWS).',
      'Aporta tu ahorro excedente con volatilidad prácticamente nula y acumulación de interés.',
    ],
  },
  {
    id: 'tip-fondos-indexados-dca',
    title: 'Inversión Indexada Pasiva a Largo Plazo (DCA)',
    category: 'dinero_pasivo',
    impact: 'alto',
    estimatedSavingsOrEarning: '7% - 9% media histórica anualizada (horizonte > 8 años)',
    timeNeeded: 'Automático 100%',
    difficulty: 'medio',
    riskLevel: 'bajo',
    officialSourceOrLegalBasis: 'Teoría moderna de carteras e inversión indexada de muy bajo coste (Bogleheads)',
    content: 'En lugar de intentar adivinar qué acción individual subirá o bajará, el método más probado y premiado con el Nobel es comprar el mundo entero mediante un fondo indexado global (MSCI World / S&P 500) con comisiones microscópicas (<0,18% anual). Aportando una cantidad fija cada mes (DCA), compras más cuando baja y menos cuando sube.',
    actionSteps: [
      'Asegúrate de tener ya constituido tu colchón de imprevistos de 3-6 meses.',
      'Configura una orden de transferencia periódica el día 2 de cada mes (ej. 50€ a 200€).',
      'No mires la cotización diaria: la paciencia y el interés compuesto a 10 años hacen el trabajo pesado.',
    ],
  },

  // --- ESCUDO ANTI-ESTAFAS FINANCIERAS ---
  {
    id: 'tip-chiringuitos-cnmv',
    title: 'Escudo Anti-Chiringuitos: Consulta el Registro de la CNMV',
    category: 'anti_estafas',
    impact: 'crucial',
    estimatedSavingsOrEarning: 'Protección del 100% de tu patrimonio',
    timeNeeded: '2 min de chequeo',
    difficulty: 'fácil',
    riskLevel: 'alerta_estafa',
    officialSourceOrLegalBasis: 'Comisión Nacional del Mercado de Valores (cnmv.es) y Banco de España',
    content: 'Un "chiringuito financiero" es una entidad no autorizada que capta fondos prometiendo inversiones mágicas y desaparece. Antes de confiar dinero a cualquier plataforma, broker o empresa de inversión, introduce su nombre en el buscador de entidades advertidas de la CNMV. Si no está inscrita, es ilegal y una estafa inminente.',
    actionSteps: [
      'Accede a cnmv.es -> Inversores -> Advertencias de la CNMV.',
      'Introduce el nombre de la empresa, dominio web o plataforma sospechosa.',
      'Si no figura en el registro oficial de Empresas de Servicios de Inversión (ESI), jamás transfieras un solo céntimo.',
    ],
  },
  {
    id: 'tip-regla-oro-rentabilidad',
    title: 'La Regla de Oro: Rentabilidad Alta sin Riesgo = Estafa Segura',
    category: 'anti_estafas',
    impact: 'crucial',
    estimatedSavingsOrEarning: 'Evita perder los ahorros de toda tu vida',
    timeNeeded: 'Principio inquebrantable',
    difficulty: 'fácil',
    riskLevel: 'alerta_estafa',
    officialSourceOrLegalBasis: 'Leyes matemáticas y financieras universales',
    content: 'Cualquier oferta que te prometa un "10% mensual garantizado", "ganancias sin riesgo con trading algorítmico o cripto", o "duplicar tu dinero en 3 meses" es un esquema Ponzi matemático. Los estafadores usan los fondos de los nuevos inversores para pagar espejismos a los antiguos hasta que el sistema colapsa.',
    actionSteps: [
      'Compara siempre contra la tasa libre de riesgo oficial (letras del tesoro al ~3%-3.5%).',
      'Si alguien te ofrece 5 veces más sin riesgo, desconfía al 100%.',
      'Bloquea inmediatamente a quien te contacte por redes sociales prometiendo libertad financiera fácil.',
    ],
  },
  {
    id: 'tip-senales-alerta-fraudes',
    title: 'Anatomía de los Fraudes Modernos (Telegram, WhatsApp y Smishing)',
    category: 'anti_estafas',
    impact: 'crucial',
    estimatedSavingsOrEarning: 'Defensa activa contra ciberdelincuencia',
    timeNeeded: 'Atención continua',
    difficulty: 'fácil',
    riskLevel: 'alerta_estafa',
    officialSourceOrLegalBasis: 'INCIBE (Instituto Nacional de Ciberseguridad - Teléfono 017 gratuito)',
    content: 'Patrones inequívocos de estafa: 1) Grupos de Telegram donde todos muestran supuestas ganancias y capturas retocadas; 2) Falsos asesores que te presionan con "urgencia porque la ventana se cierra hoy"; 3) La trampa del rescate: cuando intentas retirar tu dinero, te exigen pagar un "15% de impuestos o tasas de desbloqueo" adicionales.',
    actionSteps: [
      'Tu banco NUNCA te llamará pidiéndote códigos SMS de verificación (OTP). Si lo hacen, cuelga de inmediato.',
      'Jamás pagues dinero extra para "desbloquear" una supuesta ganancia retenida.',
      'Ante cualquier duda con un mensaje o llamada, consulta gratis al 017 de INCIBE.',
    ],
  },
];

export const INITIAL_SMART_RULES: SmartRule[] = [
  // Supermercado / Alimentación
  { id: 'rule-mercadona', pattern: 'MERCADONA', matchType: 'contains', bucketId: 'bucket-super', priority: 10, isActive: true, createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'rule-carrefour', pattern: 'CARREFOUR', matchType: 'contains', bucketId: 'bucket-super', priority: 10, isActive: true, createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'rule-lidl', pattern: 'LIDL', matchType: 'contains', bucketId: 'bucket-super', priority: 10, isActive: true, createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'rule-dia', pattern: 'DIA', matchType: 'contains', bucketId: 'bucket-super', priority: 5, isActive: true, createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'rule-alcampo', pattern: 'ALCAMPO', matchType: 'contains', bucketId: 'bucket-super', priority: 10, isActive: true, createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'rule-eroski', pattern: 'EROSKI', matchType: 'contains', bucketId: 'bucket-super', priority: 10, isActive: true, createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'rule-consum', pattern: 'CONSUM', matchType: 'contains', bucketId: 'bucket-super', priority: 10, isActive: true, createdAt: '2025-01-01T00:00:00.000Z' },

  // Movilidad / Combustible
  { id: 'rule-repsol', pattern: 'REPSOL', matchType: 'contains', bucketId: 'bucket-transporte', priority: 10, isActive: true, createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'rule-cepsa', pattern: 'CEPSA', matchType: 'contains', bucketId: 'bucket-transporte', priority: 10, isActive: true, createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'rule-bp', pattern: 'BP', matchType: 'contains', bucketId: 'bucket-transporte', priority: 5, isActive: true, createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'rule-shell', pattern: 'SHELL', matchType: 'contains', bucketId: 'bucket-transporte', priority: 10, isActive: true, createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'rule-renfe', pattern: 'RENFE', matchType: 'contains', bucketId: 'bucket-transporte', priority: 10, isActive: true, createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'rule-metro', pattern: 'METRO', matchType: 'contains', bucketId: 'bucket-transporte', priority: 8, isActive: true, createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'rule-emt', pattern: 'EMT', matchType: 'contains', bucketId: 'bucket-transporte', priority: 8, isActive: true, createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'rule-gasolinera', pattern: 'GASOLINERA', matchType: 'contains', bucketId: 'bucket-transporte', priority: 10, isActive: true, createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'rule-peaje', pattern: 'PEAJE', matchType: 'contains', bucketId: 'bucket-transporte', priority: 10, isActive: true, createdAt: '2025-01-01T00:00:00.000Z' },

  // Suministros
  { id: 'rule-iberdrola', pattern: 'IBERDROLA', matchType: 'contains', bucketId: 'bucket-suministros', priority: 10, isActive: true, isInvoice: true, createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'rule-endesa', pattern: 'ENDESA', matchType: 'contains', bucketId: 'bucket-suministros', priority: 10, isActive: true, isInvoice: true, createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'rule-naturgy', pattern: 'NATURGY', matchType: 'contains', bucketId: 'bucket-suministros', priority: 10, isActive: true, isInvoice: true, createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'rule-totalenergies', pattern: 'TOTALENERGIES', matchType: 'contains', bucketId: 'bucket-suministros', priority: 10, isActive: true, isInvoice: true, createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'rule-aqualia', pattern: 'AQUALIA', matchType: 'contains', bucketId: 'bucket-suministros', priority: 10, isActive: true, isInvoice: true, createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'rule-canal-isabel', pattern: 'CANAL DE ISABEL', matchType: 'contains', bucketId: 'bucket-suministros', priority: 10, isActive: true, isInvoice: true, createdAt: '2025-01-01T00:00:00.000Z' },

  // Telecomunicaciones
  { id: 'rule-vodafone', pattern: 'VODAFONE', matchType: 'contains', bucketId: 'bucket-teleco', priority: 10, isActive: true, isInvoice: true, createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'rule-movistar', pattern: 'MOVISTAR', matchType: 'contains', bucketId: 'bucket-teleco', priority: 10, isActive: true, isInvoice: true, createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'rule-orange', pattern: 'ORANGE', matchType: 'contains', bucketId: 'bucket-teleco', priority: 10, isActive: true, isInvoice: true, createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'rule-digi', pattern: 'DIGI', matchType: 'contains', bucketId: 'bucket-teleco', priority: 10, isActive: true, isInvoice: true, createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'rule-o2', pattern: 'O2', matchType: 'contains', bucketId: 'bucket-teleco', priority: 6, isActive: true, isInvoice: true, createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'rule-yoigo', pattern: 'YOIGO', matchType: 'contains', bucketId: 'bucket-teleco', priority: 10, isActive: true, isInvoice: true, createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'rule-masmovil', pattern: 'MASMOVIL', matchType: 'contains', bucketId: 'bucket-teleco', priority: 10, isActive: true, isInvoice: true, createdAt: '2025-01-01T00:00:00.000Z' },

  // Ocio & Suscripciones
  { id: 'rule-netflix', pattern: 'NETFLIX', matchType: 'contains', bucketId: 'bucket-ocio', priority: 10, isActive: true, createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'rule-spotify', pattern: 'SPOTIFY', matchType: 'contains', bucketId: 'bucket-ocio', priority: 10, isActive: true, createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'rule-prime', pattern: 'PRIME VIDEO', matchType: 'contains', bucketId: 'bucket-ocio', priority: 10, isActive: true, createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'rule-disney', pattern: 'DISNEY', matchType: 'contains', bucketId: 'bucket-ocio', priority: 10, isActive: true, createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'rule-hbo', pattern: 'HBO', matchType: 'contains', bucketId: 'bucket-ocio', priority: 10, isActive: true, createdAt: '2025-01-01T00:00:00.000Z' },

  // Seguros
  { id: 'rule-mapfre', pattern: 'MAPFRE', matchType: 'contains', bucketId: 'bucket-seguros', priority: 10, isActive: true, isInvoice: true, createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'rule-sanitas', pattern: 'SANITAS', matchType: 'contains', bucketId: 'bucket-seguros', priority: 10, isActive: true, isInvoice: true, createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'rule-adeslas', pattern: 'ADESLAS', matchType: 'contains', bucketId: 'bucket-seguros', priority: 10, isActive: true, isInvoice: true, createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'rule-mutua', pattern: 'MUTUA MAD', matchType: 'contains', bucketId: 'bucket-seguros', priority: 10, isActive: true, isInvoice: true, createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'rule-lineadirecta', pattern: 'LINEA DIRECTA', matchType: 'contains', bucketId: 'bucket-seguros', priority: 10, isActive: true, isInvoice: true, createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'rule-axa', pattern: 'AXA', matchType: 'contains', bucketId: 'bucket-seguros', priority: 10, isActive: true, isInvoice: true, createdAt: '2025-01-01T00:00:00.000Z' },

  // Vivienda
  { id: 'rule-hipoteca', pattern: 'HIPOTECA', matchType: 'contains', bucketId: 'bucket-vivienda', priority: 10, isActive: true, createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'rule-alquiler', pattern: 'ALQUILER', matchType: 'contains', bucketId: 'bucket-vivienda', priority: 10, isActive: true, createdAt: '2025-01-01T00:00:00.000Z' },
  { id: 'rule-comunidad', pattern: 'COMUNIDAD', matchType: 'contains', bucketId: 'bucket-vivienda', priority: 10, isActive: true, createdAt: '2025-01-01T00:00:00.000Z' },
];

export class DBService {
  private static dbPromise: Promise<IDBDatabase> | null = null;
  private static cachedSettings: Settings = { ...DEFAULT_SETTINGS };
  private static settingsLoaded = false;

  private static getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB no está disponible'));
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(STORES.EXPENSES)) {
          const expenseStore = db.createObjectStore(STORES.EXPENSES, { keyPath: 'id' });
          expenseStore.createIndex('date', 'date', { unique: false });
          expenseStore.createIndex('bucketId', 'bucketId', { unique: false });
          expenseStore.createIndex('isInvoice', 'isInvoice', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.BUCKETS)) {
          db.createObjectStore(STORES.BUCKETS, { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains(STORES.RECURRING_RULES)) {
          db.createObjectStore(STORES.RECURRING_RULES, { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS, { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains(STORES.TIPS)) {
          db.createObjectStore(STORES.TIPS, { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains(STORES.SMART_RULES)) {
          db.createObjectStore(STORES.SMART_RULES, { keyPath: 'id' });
        }
      };

      request.onsuccess = async () => {
        const db = request.result;
        resolve(db);
        // Sembrar datos iniciales si la BD está vacía
        await DBService.seedDefaultsIfEmpty(db);
      };

      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  private static async seedDefaultsIfEmpty(db: IDBDatabase): Promise<void> {
    try {
      // 1. Buckets
      const bucketTx = db.transaction(STORES.BUCKETS, 'readonly');
      const bucketStore = bucketTx.objectStore(STORES.BUCKETS);
      const countReq = bucketStore.count();
      countReq.onsuccess = async () => {
        if (countReq.result === 0) {
          const writeTx = db.transaction(STORES.BUCKETS, 'readwrite');
          const writeStore = writeTx.objectStore(STORES.BUCKETS);
          for (const b of DEFAULT_BUCKETS) {
            writeStore.put(b);
          }
        }
      };

      // 2. Settings
      const settingsTx = db.transaction(STORES.SETTINGS, 'readonly');
      const settingsStore = settingsTx.objectStore(STORES.SETTINGS);
      const settingsReq = settingsStore.get(DEFAULT_SETTINGS.id);
      settingsReq.onsuccess = () => {
        if (settingsReq.result) {
          this.cachedSettings = { ...DEFAULT_SETTINGS, ...settingsReq.result };
          this.settingsLoaded = true;
        } else {
          // Inicializar desde localStorage si existe o defaults
          const localSettings = this.getLocalStorageItem<Settings>('gastos_settings', DEFAULT_SETTINGS);
          const writeTx = db.transaction(STORES.SETTINGS, 'readwrite');
          writeTx.objectStore(STORES.SETTINGS).put(localSettings);
          this.cachedSettings = localSettings;
          this.settingsLoaded = true;
        }
      };

      // 3. Tips
      const tipsTx = db.transaction(STORES.TIPS, 'readonly');
      const tipsStore = tipsTx.objectStore(STORES.TIPS);
      const tipsCount = tipsStore.count();
      tipsCount.onsuccess = () => {
        if (tipsCount.result === 0) {
          const writeTx = db.transaction(STORES.TIPS, 'readwrite');
          const writeStore = writeTx.objectStore(STORES.TIPS);
          for (const t of DEFAULT_TIPS) {
            writeStore.put(t);
          }
        }
      };

      // 4. Smart Rules
      const rulesTx = db.transaction(STORES.SMART_RULES, 'readonly');
      const rulesStore = rulesTx.objectStore(STORES.SMART_RULES);
      const rulesCount = rulesStore.count();
      rulesCount.onsuccess = () => {
        if (rulesCount.result === 0) {
          const writeTx = db.transaction(STORES.SMART_RULES, 'readwrite');
          const writeStore = writeTx.objectStore(STORES.SMART_RULES);
          for (const r of INITIAL_SMART_RULES) {
            writeStore.put(r);
          }
        }
      };
    } catch (e) {
      console.warn('[DBService] Advertencia sembrando defaults:', e);
    }
  }

  // --- SETTINGS (Lectura síncrona desde cache con persistencia async) ---
  static getSettings(): Settings {
    if (!this.settingsLoaded) {
      // Si la BD aún no ha respondido, leer de localStorage de respaldo
      const fromLocal = this.getLocalStorageItem<Settings>('gastos_settings', DEFAULT_SETTINGS);
      this.cachedSettings = { ...DEFAULT_SETTINGS, ...fromLocal };
    }
    return this.cachedSettings;
  }

  static async saveSettings(settings: Settings): Promise<void> {
    const updated: Settings = {
      ...settings,
      updatedAt: new Date().toISOString(),
    };
    this.cachedSettings = updated;
    this.settingsLoaded = true;

    // Guardar en localStorage inmediatamente
    this.setLocalStorageItem('gastos_settings', updated);

    // Guardar en IndexedDB
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORES.SETTINGS, 'readwrite');
        const store = tx.objectStore(STORES.SETTINGS);
        const req = store.put(updated);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('[DBService] Guardado en localStorage exitoso, fallo en IndexedDB:', e);
    }
  }

  // --- EXPENSES ---
  static async getExpenses(): Promise<Expense[]> {
    try {
      const db = await this.getDB();
      return await new Promise<Expense[]>((resolve, reject) => {
        const tx = db.transaction(STORES.EXPENSES, 'readonly');
        const store = tx.objectStore(STORES.EXPENSES);
        const req = store.getAll();
        req.onsuccess = () => {
          const list: Expense[] = req.result || [];
          list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
          resolve(list);
        };
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('[DBService] Fallback localStorage para expenses:', e);
      return this.getLocalStorageItem<Expense[]>('gastos_expenses', []);
    }
  }

  static async saveExpense(expense: Expense): Promise<void> {
    const expenses = await this.getExpenses();
    const idx = expenses.findIndex((e) => e.id === expense.id);
    if (idx >= 0) {
      expenses[idx] = expense;
    } else {
      expenses.unshift(expense);
    }
    this.setLocalStorageItem('gastos_expenses', expenses);

    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORES.EXPENSES, 'readwrite');
        const store = tx.objectStore(STORES.EXPENSES);
        const req = store.put(expense);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('[DBService] Guardado en localStorage completado, fallo en IndexedDB:', e);
    }
  }

  static async deleteExpense(id: string): Promise<void> {
    const expenses = await this.getExpenses();
    const filtered = expenses.filter((e) => e.id !== id);
    this.setLocalStorageItem('gastos_expenses', filtered);

    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORES.EXPENSES, 'readwrite');
        const store = tx.objectStore(STORES.EXPENSES);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('[DBService] Borrado en fallback ejecutado:', e);
    }
  }

  static async saveExpensesBatch(newExpenses: Expense[]): Promise<void> {
    if (!newExpenses || newExpenses.length === 0) return;
    const current = await this.getExpenses();
    const map = new Map<string, Expense>();
    current.forEach((e) => map.set(e.id, e));
    newExpenses.forEach((e) => map.set(e.id, e));
    const merged = Array.from(map.values());
    merged.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    this.setLocalStorageItem('gastos_expenses', merged);

    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORES.EXPENSES, 'readwrite');
        const store = tx.objectStore(STORES.EXPENSES);
        for (const e of newExpenses) {
          store.put(e);
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(new Error('Transacción de guardado por lotes abortada'));
      });
    } catch (e) {
      console.warn('[DBService] Error en saveExpensesBatch en IndexedDB:', e);
    }
  }

  // --- BUCKETS (Bolsas) ---
  static async getBuckets(): Promise<Bucket[]> {
    try {
      const db = await this.getDB();
      return await new Promise<Bucket[]>((resolve, reject) => {
        const tx = db.transaction(STORES.BUCKETS, 'readonly');
        const store = tx.objectStore(STORES.BUCKETS);
        const req = store.getAll();
        req.onsuccess = () => {
          const list: Bucket[] = req.result || [];
          if (list.length === 0) {
            resolve(DEFAULT_BUCKETS);
          } else {
            resolve(list);
          }
        };
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('[DBService] Fallback localStorage para buckets:', e);
      return this.getLocalStorageItem<Bucket[]>('gastos_buckets', DEFAULT_BUCKETS);
    }
  }

  static async saveBucket(bucket: Bucket): Promise<void> {
    const buckets = await this.getBuckets();
    const idx = buckets.findIndex((b) => b.id === bucket.id);
    if (idx >= 0) {
      buckets[idx] = bucket;
    } else {
      buckets.push(bucket);
    }
    this.setLocalStorageItem('gastos_buckets', buckets);

    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORES.BUCKETS, 'readwrite');
        const store = tx.objectStore(STORES.BUCKETS);
        const req = store.put(bucket);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('[DBService] Error al guardar bolsa en IndexedDB:', e);
    }
  }

  static async deleteBucket(id: string): Promise<void> {
    const buckets = await this.getBuckets();
    const filtered = buckets.filter((b) => b.id !== id);
    this.setLocalStorageItem('gastos_buckets', filtered);

    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORES.BUCKETS, 'readwrite');
        const store = tx.objectStore(STORES.BUCKETS);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('[DBService] Error al borrar bolsa:', e);
    }
  }

  /**
   * Carga o fusiona la Plantilla Maestra de 8 Bolsas (Smart Seeds)
   */
  static async applyMasterSeeds(mode: 'replace' | 'append' = 'append'): Promise<Bucket[]> {
    let result: Bucket[];
    if (mode === 'replace') {
      result = [...DEFAULT_BUCKETS];
    } else {
      const current = await this.getBuckets();
      const currentNames = new Set(current.map((b) => b.name.toLowerCase()));
      const toAdd = DEFAULT_BUCKETS.filter((b) => !currentNames.has(b.name.toLowerCase()));
      result = [...current, ...toAdd];
    }

    this.setLocalStorageItem('gastos_buckets', result);
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORES.BUCKETS, 'readwrite');
        const store = tx.objectStore(STORES.BUCKETS);
        if (mode === 'replace') {
          store.clear();
        }
        for (const b of result) {
          store.put(b);
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.warn('[DBService] Error al aplicar semillas maestras en IndexedDB:', e);
    }
    return result;
  }

  /**
   * Vasos Comunicantes: Trasvase elástico de límite presupuestario entre dos bolsas
   */
  static async transferBucketBalance(
    fromBucketId: string,
    toBucketId: string,
    amount: number
  ): Promise<{ fromBucket: Bucket; toBucket: Bucket }> {
    if (amount <= 0) throw new Error('El importe a transferir debe ser mayor a 0');
    if (fromBucketId === toBucketId) throw new Error('No puedes transferir a la misma bolsa');

    const buckets = await this.getBuckets();
    const fromIdx = buckets.findIndex((b) => b.id === fromBucketId);
    const toIdx = buckets.findIndex((b) => b.id === toBucketId);

    if (fromIdx < 0 || toIdx < 0) throw new Error('Una de las bolsas seleccionadas no existe');

    const fromBucket = { ...buckets[fromIdx] };
    const toBucket = { ...buckets[toIdx] };

    // Disminuir límite en origen y aumentarlo en destino
    fromBucket.budgetLimit = Math.max(0, Math.round((fromBucket.budgetLimit - amount) * 100) / 100);
    toBucket.budgetLimit = Math.round((toBucket.budgetLimit + amount) * 100) / 100;

    buckets[fromIdx] = fromBucket;
    buckets[toIdx] = toBucket;

    this.setLocalStorageItem('gastos_buckets', buckets);

    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORES.BUCKETS, 'readwrite');
        const store = tx.objectStore(STORES.BUCKETS);
        store.put(fromBucket);
        store.put(toBucket);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.warn('[DBService] Error al registrar vasos comunicantes en IndexedDB:', e);
    }

    return { fromBucket, toBucket };
  }

  /**
   * Rollover de Ahorro: Suma los remanentes no consumidos de las bolsas del mes y los transfiere al Colchón de Ahorro
   */
  static async executeMonthlyRollover(
    currentMonthPrefix: string,
    targetBufferBucketId?: string
  ): Promise<{ surplusTotal: number; transferredTo: string; bucketCount: number }> {
    const buckets = await this.getBuckets();
    const expenses = await this.getExpenses();
    const monthExpenses = expenses.filter((e) => (e.date || '').startsWith(currentMonthPrefix));

    // Buscar la bolsa amortiguadora de destino (o la primera con isBuffer === true)
    let bufferBucket = targetBufferBucketId
      ? buckets.find((b) => b.id === targetBufferBucketId)
      : buckets.find((b) => b.isBuffer);

    if (!bufferBucket && buckets.length > 0) {
      bufferBucket = buckets[buckets.length - 1];
    }

    if (!bufferBucket) {
      throw new Error('No existe una bolsa de Colchón o Ahorro para recibir el rollover');
    }

    let surplusTotal = 0;
    let countedBuckets = 0;

    // Calcular remanentes positivos de bolsas que no sean el colchón
    for (const b of buckets) {
      if (b.id === bufferBucket.id) continue;
      const spent = monthExpenses
        .filter((e) => e.bucketId === b.id)
        .reduce((sum, e) => sum + e.amount, 0);
      const remaining = b.budgetLimit - spent;
      if (remaining > 0) {
        surplusTotal += remaining;
        countedBuckets++;
      }
    }

    surplusTotal = Math.round(surplusTotal * 100) / 100;

    if (surplusTotal > 0) {
      bufferBucket.budgetLimit = Math.round((bufferBucket.budgetLimit + surplusTotal) * 100) / 100;
      await this.saveBucket(bufferBucket);
    }

    return {
      surplusTotal,
      transferredTo: bufferBucket.name,
      bucketCount: countedBuckets,
    };
  }


  // --- RECURRING RULES ---
  static async getRecurringRules(): Promise<RecurringRule[]> {
    try {
      const db = await this.getDB();
      return await new Promise<RecurringRule[]>((resolve, reject) => {
        const tx = db.transaction(STORES.RECURRING_RULES, 'readonly');
        const store = tx.objectStore(STORES.RECURRING_RULES);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      return this.getLocalStorageItem<RecurringRule[]>('gastos_recurring_rules', []);
    }
  }

  static async saveRecurringRule(rule: RecurringRule): Promise<void> {
    const rules = await this.getRecurringRules();
    const idx = rules.findIndex((r) => r.id === rule.id);
    if (idx >= 0) {
      rules[idx] = rule;
    } else {
      rules.push(rule);
    }
    this.setLocalStorageItem('gastos_recurring_rules', rules);

    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORES.RECURRING_RULES, 'readwrite');
        const store = tx.objectStore(STORES.RECURRING_RULES);
        const req = store.put(rule);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('[DBService] Error al guardar regla recurrente:', e);
    }
  }

  static async deleteRecurringRule(id: string): Promise<void> {
    const rules = await this.getRecurringRules();
    const filtered = rules.filter((r) => r.id !== id);
    this.setLocalStorageItem('gastos_recurring_rules', filtered);

    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORES.RECURRING_RULES, 'readwrite');
        const store = tx.objectStore(STORES.RECURRING_RULES);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('[DBService] Error al borrar regla recurrente:', e);
    }
  }

  /**
   * Carga o fusiona las Facturas Recurrentes Maestras (Smart Seeds)
   */
  static async applyRecurringSeeds(mode: 'replace' | 'append' = 'append'): Promise<RecurringRule[]> {
    let result: RecurringRule[];
    if (mode === 'replace') {
      result = [...DEFAULT_RECURRING_SEEDS];
    } else {
      const current = await this.getRecurringRules();
      const currentTitles = new Set(current.map((r) => r.title.toLowerCase()));
      const toAdd = DEFAULT_RECURRING_SEEDS.filter((r) => !currentTitles.has(r.title.toLowerCase()));
      result = [...current, ...toAdd];
    }

    this.setLocalStorageItem('gastos_recurring_rules', result);
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORES.RECURRING_RULES, 'readwrite');
        const store = tx.objectStore(STORES.RECURRING_RULES);
        if (mode === 'replace') {
          store.clear();
        }
        for (const r of result) {
          store.put(r);
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.warn('[DBService] Error al aplicar semillas de recurrentes:', e);
    }
    return result;
  }

  // --- TIPS & ESTRATEGIAS FINANCIERAS ---
  static async getTips(): Promise<FinancialTip[]> {
    let list: FinancialTip[] = [];
    try {
      const db = await this.getDB();
      list = await new Promise<FinancialTip[]>((resolve, reject) => {
        const tx = db.transaction(STORES.TIPS, 'readonly');
        const store = tx.objectStore(STORES.TIPS);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch {
      list = this.getLocalStorageItem<FinancialTip[]>('gastos_tips', []);
    }

    // Auto-fusionar con las semillas maestras para que el usuario reciba siempre las estrategias completas
    const map = new Map<string, FinancialTip>();
    DEFAULT_TIPS.forEach((t) => map.set(t.id, { ...t }));
    list.forEach((t) => {
      const existing = map.get(t.id);
      if (existing) {
        map.set(t.id, { ...existing, isApplied: t.isApplied, isRead: t.isRead });
      } else {
        map.set(t.id, t);
      }
    });

    const merged = Array.from(map.values());
    this.setLocalStorageItem('gastos_tips', merged);
    return merged;
  }

  static async toggleTipApplied(id: string): Promise<boolean> {
    const tips = await this.getTips();
    const target = tips.find((t) => t.id === id);
    if (!target) return false;

    target.isApplied = !target.isApplied;
    this.setLocalStorageItem('gastos_tips', tips);

    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORES.TIPS, 'readwrite');
        const store = tx.objectStore(STORES.TIPS);
        store.put(target);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.warn('[DBService] Aviso al alternar tip en IndexedDB:', e);
    }

    return Boolean(target.isApplied);
  }

  // --- SMART RULES (Categorización Inteligente Offline) ---
  static async getSmartRules(): Promise<SmartRule[]> {
    try {
      const db = await this.getDB();
      const list = await new Promise<SmartRule[]>((resolve, reject) => {
        const tx = db.transaction(STORES.SMART_RULES, 'readonly');
        const store = tx.objectStore(STORES.SMART_RULES);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
      if (list.length === 0) {
        await this.applySmartRulesSeeds('replace');
        return INITIAL_SMART_RULES;
      }
      return list;
    } catch (e) {
      const fallback = this.getLocalStorageItem<SmartRule[]>('gastos_smart_rules', INITIAL_SMART_RULES);
      if (!fallback || fallback.length === 0) {
        this.setLocalStorageItem('gastos_smart_rules', INITIAL_SMART_RULES);
        return INITIAL_SMART_RULES;
      }
      return fallback;
    }
  }

  static async saveSmartRule(rule: SmartRule): Promise<void> {
    const rules = await this.getSmartRules();
    const idx = rules.findIndex((r) => r.id === rule.id);
    if (idx >= 0) {
      rules[idx] = rule;
    } else {
      rules.push(rule);
    }
    this.setLocalStorageItem('gastos_smart_rules', rules);

    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORES.SMART_RULES, 'readwrite');
        const store = tx.objectStore(STORES.SMART_RULES);
        const req = store.put(rule);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('[DBService] Error al guardar regla inteligente en IndexedDB:', e);
    }
  }

  static async deleteSmartRule(id: string): Promise<void> {
    const rules = await this.getSmartRules();
    const filtered = rules.filter((r) => r.id !== id);
    this.setLocalStorageItem('gastos_smart_rules', filtered);

    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORES.SMART_RULES, 'readwrite');
        const store = tx.objectStore(STORES.SMART_RULES);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('[DBService] Error al borrar regla inteligente:', e);
    }
  }

  static async applySmartRulesSeeds(mode: 'replace' | 'append' = 'append'): Promise<SmartRule[]> {
    let result: SmartRule[];
    if (mode === 'replace') {
      result = [...INITIAL_SMART_RULES];
    } else {
      const current = await this.getSmartRules();
      const currentPatterns = new Set(current.map((r) => r.pattern.toLowerCase()));
      const toAdd = INITIAL_SMART_RULES.filter((r) => !currentPatterns.has(r.pattern.toLowerCase()));
      result = [...current, ...toAdd];
    }

    this.setLocalStorageItem('gastos_smart_rules', result);
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORES.SMART_RULES, 'readwrite');
        const store = tx.objectStore(STORES.SMART_RULES);
        if (mode === 'replace') {
          store.clear();
        }
        for (const r of result) {
          store.put(r);
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.warn('[DBService] Error al aplicar semillas de smart rules en IndexedDB:', e);
    }
    return result;
  }

  // --- BACKUP & EXPORT/IMPORT ---
  static async exportBackupEnvelope(): Promise<BackupEnvelope> {
    const [expenses, buckets, recurringRules, tips, smartRules] = await Promise.all([
      this.getExpenses(),
      this.getBuckets(),
      this.getRecurringRules(),
      this.getTips(),
      this.getSmartRules(),
    ]);

    return {
      version: '1.10.0',
      exportedAt: new Date().toISOString(),
      expenses,
      buckets,
      recurringRules,
      settings: this.getSettings(),
      tips,
      smartRules,
    };
  }

  static async importBackupEnvelope(envelope: BackupEnvelope): Promise<void> {
    if (!envelope || !envelope.version) {
      throw new Error('Estructura de copia de seguridad no válida.');
    }

    if (envelope.settings) {
      await this.saveSettings(envelope.settings);
    }

    if (Array.isArray(envelope.buckets)) {
      for (const b of envelope.buckets) {
        await this.saveBucket(b);
      }
    }

    if (Array.isArray(envelope.expenses)) {
      for (const e of envelope.expenses) {
        await this.saveExpense(e);
      }
    }

    if (Array.isArray(envelope.recurringRules)) {
      for (const r of envelope.recurringRules) {
        await this.saveRecurringRule(r);
      }
    }

    if (Array.isArray(envelope.smartRules)) {
      for (const rule of envelope.smartRules) {
        await this.saveSmartRule(rule);
      }
    }
  }

  /**
   * Sobrescribe de forma atómica y completa la base de datos (IndexedDB y localStorage)
   */
  static async clearAndRestore(data: {
    expenses: Expense[];
    buckets: Bucket[];
    recurringRules: RecurringRule[];
    settings?: Settings;
    tips?: FinancialTip[];
    smartRules?: SmartRule[];
  }): Promise<void> {
    this.setLocalStorageItem('gastos_expenses', data.expenses);
    this.setLocalStorageItem('gastos_buckets', data.buckets);
    this.setLocalStorageItem('gastos_recurring_rules', data.recurringRules);
    if (data.settings) {
      this.cachedSettings = { ...DEFAULT_SETTINGS, ...data.settings };
      this.setLocalStorageItem('gastos_settings', this.cachedSettings);
    }
    if (data.tips && data.tips.length > 0) {
      this.setLocalStorageItem('gastos_tips', data.tips);
    }
    if (data.smartRules && data.smartRules.length > 0) {
      this.setLocalStorageItem('gastos_smart_rules', data.smartRules);
    }

    try {
      const db = await this.getDB();
      const storesToTransact = [
        STORES.EXPENSES,
        STORES.BUCKETS,
        STORES.RECURRING_RULES,
        STORES.SETTINGS,
        STORES.TIPS,
        STORES.SMART_RULES,
      ];
      const tx = db.transaction(storesToTransact, 'readwrite');

      tx.objectStore(STORES.EXPENSES).clear();
      tx.objectStore(STORES.BUCKETS).clear();
      tx.objectStore(STORES.RECURRING_RULES).clear();
      if (data.tips && data.tips.length > 0) {
        tx.objectStore(STORES.TIPS).clear();
      }
      if (data.smartRules && data.smartRules.length > 0) {
        tx.objectStore(STORES.SMART_RULES).clear();
      }

      if (data.settings) {
        tx.objectStore(STORES.SETTINGS).put(this.cachedSettings!);
      }

      const expStore = tx.objectStore(STORES.EXPENSES);
      for (const e of data.expenses) {
        expStore.put(e);
      }

      const bStore = tx.objectStore(STORES.BUCKETS);
      for (const b of data.buckets) {
        bStore.put(b);
      }

      const rStore = tx.objectStore(STORES.RECURRING_RULES);
      for (const r of data.recurringRules) {
        rStore.put(r);
      }

      if (data.tips && data.tips.length > 0) {
        const tStore = tx.objectStore(STORES.TIPS);
        for (const t of data.tips) {
          tStore.put(t);
        }
      }

      if (data.smartRules && data.smartRules.length > 0) {
        const sStore = tx.objectStore(STORES.SMART_RULES);
        for (const rule of data.smartRules) {
          sStore.put(rule);
        }
      }

      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(new Error('Transacción abortada'));
      });
    } catch (e) {
      console.warn('[DBService] Advertencia en IndexedDB al restaurar, fallback local asegurado:', e);
    }
  }

  /**
   * Fusiona registros entrantes con los existentes preservando IDs únicos
   */
  static async mergeAndRestore(data: {
    expenses: Expense[];
    buckets: Bucket[];
    recurringRules: RecurringRule[];
    settings?: Settings;
    tips?: FinancialTip[];
    smartRules?: SmartRule[];
  }): Promise<void> {
    const [currentExpenses, currentBuckets, currentRules, currentSmartRules] = await Promise.all([
      this.getExpenses(),
      this.getBuckets(),
      this.getRecurringRules(),
      this.getSmartRules(),
    ]);

    const expMap = new Map<string, Expense>();
    currentExpenses.forEach((e) => expMap.set(e.id, e));
    data.expenses.forEach((e) => expMap.set(e.id, e));

    const bucketMap = new Map<string, Bucket>();
    currentBuckets.forEach((b) => bucketMap.set(b.id, b));
    data.buckets.forEach((b) => bucketMap.set(b.id, b));

    const ruleMap = new Map<string, RecurringRule>();
    currentRules.forEach((r) => ruleMap.set(r.id, r));
    data.recurringRules.forEach((r) => ruleMap.set(r.id, r));

    const smartMap = new Map<string, SmartRule>();
    currentSmartRules.forEach((s) => smartMap.set(s.id, s));
    if (data.smartRules) {
      data.smartRules.forEach((s) => smartMap.set(s.id, s));
    }

    await this.clearAndRestore({
      expenses: Array.from(expMap.values()),
      buckets: Array.from(bucketMap.values()),
      recurringRules: Array.from(ruleMap.values()),
      settings: data.settings || this.getSettings(),
      tips: data.tips,
      smartRules: Array.from(smartMap.values()),
    });
  }

  // --- HELPERS LOCALSTORAGE ---
  private static getLocalStorageItem<T>(key: string, defaultValue: T): T {
    try {
      if (typeof localStorage === 'undefined') return defaultValue;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private static setLocalStorageItem<T>(key: string, value: T): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch {
      // Ignorar quota errors
    }
  }
}
