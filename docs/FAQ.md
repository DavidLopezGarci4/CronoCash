# Preguntas Frecuentes y Guía de Herramientas (FAQ) — CronoCash 📖

> Guía de referencia rápida, operativa y resolución de dudas sobre todas las funciones y herramientas activas en la versión oficial de **CronoCash** (Android APK y PWA).

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

---

## 1. Seguridad y Acceso Biométrico / PIN

### ¿Cómo protege CronoCash la privacidad de mis datos?
* **Cifrado local:** Todos los datos bancarios y personales se almacenan en el dispositivo mediante IndexedDB nativo; no se envían a ningún servidor externo.
* **Biometría nativa:** Utiliza la librería oficial de Android Jetpack `androidx.biometric:1.1.0` para acceso por huella dactilar de máxima seguridad.
* **Teclado PIN táctil:** Cuenta con teclado numérico virtual integrado para evitar que teclados de terceros capturen tu clave secreta.
* **Auto-bloqueo preventivo:** Al minimizar la aplicación o apagar la pantalla (`visibilitychange`), la sesión se bloquea automáticamente salvo que actives explícitamente el auto-desbloqueo.
* **Bloqueo manual inmediato:** Puedes pulsar el candado situado en la cabecera superior en cualquier momento para bloquear la sesión en 1 toque.

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

---

## 3. Gastos Recurrentes y Detector de Gastos Vampiro

### ¿Cómo gestiona CronoCash las suscripciones y facturas fijas?
* **Periodicidades flexibles:** Permite programar recibos semanales, mensuales, trimestrales o anuales indicando el día de cobro exacto.
* **Cuenta atrás semafórica:** Cada recibo muestra una insignia dinámica con su proximidad (🔴 *¡Vence HOY!*, 🟠 *¡Mañana!*, 🟡 *En X días*).
* **Asentamiento en 1 toque:** Al pulsar *"Registrar Pago"*, el recibo se convierte de forma automática en un gasto real deducido de su bolsa presupuestaria.

### ¿Qué es el Detector de Gastos Vampiro?
* **Auditoría de suscripciones zombi:** Identifica servicios de streaming, membresías de gimnasio u ocio infrautilizados o duplicados.
* **Cálculo de ahorro anual:** Proyecta cuánto dinero liberas al año al cancelar o migrar planes mensuales a modalidades anuales con descuento.

---

## 4. Calendario Reactivo, Cash-Flow Runway y Comparador YoY

### ¿Qué información ofrece el Calendario reactivo?
* **Vista dual Mes y Semana:** Motor ultraligero con `date-fns` v4 que muestra puntos de actividad e importes diarios sin ralentizar el terminal.
* **Desglose diario interactivo:** Al tocar cualquier celda del calendario, se abre el panel inferior con los gastos ejecutados ese día y los cargos programados con opción directa de pago.

### ¿Qué es el "Cash-Flow Runway"?
* **Previsión de liquidez a fin de mes:** Calcula en tiempo real tu saldo proyectado (`Ingresos - Gastos Reales - Recibos Comprometidos`) con semáforo de viabilidad financiera.

### ¿Cómo funciona el Comparador Anual (YoY - Year over Year)?
* **Comparativa interanual:** Permite contrastar el gasto acumulado entre dos años cualesquiera, mostrando la tasa de variación porcentual y barras comparativas mes a mes.

---

## 5. Notificaciones y Alarmas Exactas de Cobro

### ¿Cómo se configuran los avisos en Android?
* **3 canales oficiales de notificación:** `crono_bills_alerts` (Cobros), `crono_daily_review` (Cierre diario) y `crono_budget_alerts` (Límites de bolsa).
* **Compatibilidad Android 13+:** Solicita permisos en tiempo de ejecución (`POST_NOTIFICATIONS`) y opera con alarmas de precisión con `SCHEDULE_EXACT_ALARM`.

### ¿Cuáles son las alertas preprogramadas?
* **Preaviso a 3 días:** Alerta a las 09:30 AM recordando el importe y fecha del próximo recibo para verificar fondos en tu banco.
* **Aviso el día de cobro:** Alarma a las 09:00 AM el mismo día que entra la factura.
* **Repaso diario nocturno:** Notificación a las 21:30 (configurable en Ajustes) para recordar anotar gastos menores en efectivo o tarjeta.
* **Deep-linking:** Tocar cualquier notificación abre CronoCash y navega inmediatamente a la vista de Recurrentes.

---

## 6. Copias de Seguridad en Google Drive (2 Ranuras) y Comparador Lado a Lado

### ¿En qué consiste la estrategia canónica de 2 ranuras?
* **Ranura 1 (`CronoCash_Actual.json`):** Tu copia principal y más reciente de uso continuado.
* **Ranura 2 (`CronoCash_Previa.json`):** Copia de seguridad histórica congelada para emergencias.
* **Integración SAF sin APIs invasivas:** Utiliza la hoja nativa de compartir de Android (`@capacitor/share` + `@capacitor/filesystem`) para guardar en Google Drive sin requerir claves de desarrollador ni sufrir tokens caducados.

### ¿Cómo me protege el Comparador Lado a Lado (Side-by-Side)?
* **Inspección de integridad previa:** Al seleccionar un archivo `.json`, se valida su estructura y checksum determinista.
* **Matriz comparativa:** Muestra en columnas paralelas los datos del teléfono frente a los de la copia (número de gastos, bolsas, reglas, total gastado y fechas) destacando los deltas (+/-).
* **Modos de restauración:** Permite elegir entre *Sobrescribir Completo* (reemplazo íntegro atómico) o *Fusionar Registros*.
* **Confirmación obligatoria:** Requiere marcar una casilla de verificación antes de tocar la base de datos para impedir pérdidas involuntarias.

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

### ¿Dónde se ubican los iconos de la aplicación?
* **Mipmaps nativos:** Iconos redondos, adaptativos y cuadrados generados en todas las densidades de pantalla (`mdpi`, `hdpi`, `xhdpi`, `xxhdpi`, `xxxhdpi`).
* **Edición Verticons Pack:** Tarjeta vertical en proporción 2:3 de alta resolución con acabado en fibra de carbono y marco de neón esmeralda ubicada en `public/verticon-icon.jpg`.
* **Visor integrado:** Accesible desde la app para previsualizar y guardar los iconos en tu galería para lanzadores personalizados (Nova Launcher, Niagara, etc.).

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
