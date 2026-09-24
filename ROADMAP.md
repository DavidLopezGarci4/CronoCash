# Roadmap del Proyecto — CronoCash 🗺️

Aplicación móvil Android para la gestión inteligente de gastos, facturación recurrente, bolsas de presupuesto ("envelopes") con vasos comunicantes, calendario de cash-flow y copias de seguridad de alta confiabilidad.

---

## Estado Actual: v1.1.0 (Completado) 🚀
- [x] **Iconografía Oficial Completa:** Generación de todos los assets de launcher para Android (`mipmap-mdpi`, `hdpi`, `xhdpi`, `xxhdpi`, `xxxhdpi` con adaptive icon `ic_launcher_foreground.png` y fondo obsidian `#0B111E`).
- [x] **Edición Verticons:** Creación de tarjeta vertical 2:3 en alta resolución con marco de neón esmeralda y fibra de carbono para compatibilidad con el pack de iconos Verticons.
- [x] **Visor de Iconografía en la App:** Modal interactivo para visualizar y descargar el icono squircle y la tarjeta Verticons en el teléfono.
- [x] **Smart Seeds (Plantilla Maestra en 1 clic):** Onboarding instantáneo con las 8 bolsas maestras preconfiguradas para España y Europa (Vivienda/Hipoteca, Suministros, Supermercado, Movilidad, Seguros, Telecomunicaciones, Ocio y Colchón de Ahorro).
- [x] **Vasos Comunicantes (Compensación Elástica):** Modal de trasvase interactivo de presupuestos entre bolsas con superávit y bolsas en tensión con feedback háptico.
- [x] **Rollover de Ahorro Mensual:** Motor automático que calcula el excedente no consumido del mes y lo traslada a la bolsa amortiguadora de ahorro.
- [x] **Selector Dinámico de Iconos Lucide:** Catálogo visual de iconos temáticos (`Home`, `Zap`, `ShoppingCart`, `Car`, `ShieldCheck`, `Smartphone`, `Utensils`, `PiggyBank`, etc.) y paleta de colores.
- [x] **Compilación y Firma Release:** Generación del APK firmado `app-v1.1.0-release.apk` con `versionCode 10100` y `versionName "1.1.0"`.

---

## Historial de Versiones Anteriores

### 📦 v1.0.0 (Completado)
- [x] Arquitectura base: React 19 + Vite 6 + Tailwind CSS v4 + TypeScript + Capacitor 7.
- [x] Persistencia en IndexedDB estructurado con auto-sembrado inicial y fallback a LocalStorage.
- [x] Autenticación biométrica nativa (`androidx.biometric:1.1.0` en Android Jetpack) con fallback a PIN numérico táctil.
- [x] Bloqueo de seguridad automático al pasar la aplicación a segundo plano (`visibilitychange`) y auto-login opcional.
- [x] Layout móvil con insets de `safe-area`, corrección de teclado Android y navegación accesible.

---

## Próximas Versiones Planificadas

### 🎯 Versión v1.2.0 — Gastos Recurrentes y Detección de Gastos Vampiro
- [ ] Gestor de recibos periódicos (mensual, bimestral, trimestral, semestral, anual).
- [ ] Cálculo automático del próximo cobro y anillo visual de días restantes.
- [ ] Detección de gastos vampiro (suscripciones poco usadas o duplicadas).
- [ ] Registro ágil de gastos imprevistos y compras diarias con desglose de IVA desgravable.

### 🎯 Versión v1.3.0 — Calendario Predictivo & Runway de Cash-Flow
- [ ] Calendario reactivo basado en `date-fns` v4 (vista mensual y semanal).
- [ ] Visualización de saldo proyectado día a día según vencimientos programados.
- [ ] Comparador anual (YoY - Year over Year) para evaluar evolución del gasto respecto al año previo.

### 🎯 Versión v1.4.0 — Motor de Notificaciones Exactas
- [ ] Notificaciones locales con canales Android y soporte para `SCHEDULE_EXACT_ALARM`.
- [ ] Alertas escalonadas (3 días antes y el día del cargo).
- [ ] Notificación nocturna de cierre diario (21:30) para registrar movimientos del día.

### 🎯 Versión v1.5.0 — Copias de Seguridad en Google Drive (2 Ranuras Canónicas)
- [ ] Respaldo a Google Drive mediante SAF y Share Sheet (`@capacitor/share` + `@capacitor/filesystem`).
- [ ] 2 ranuras canónicas: `Gastos_Actual.json` y `Gastos_Previa.json`.
- [ ] Pantalla comparativa lado a lado antes de restaurar con verificación de checksum.

### 🎯 Versión v1.6.0 — Consejos de Ahorro e Ideas Legales de Ingresos Pasivos
- [ ] Guías de renegociación de contratos (luz, fibra, seguros).
- [ ] Métodos 50/30/20 y Kakebo.
- [ ] Vías legales de ingresos rápidos y pasivos (cuentas remuneradas FGD, fondos monetarios, venta de excedentes).
- [ ] Escudo anti-estafas financieras.
