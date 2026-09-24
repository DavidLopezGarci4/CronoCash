# Roadmap del Proyecto — Gastos Facturación 🗺️

Aplicación móvil Android para la gestión inteligente de gastos, facturación recurrente, bolsas de presupuesto ("envelopes") con vasos comunicantes, calendario de cash-flow y copias de seguridad de alta confiabilidad.

---

## Estado Actual: v1.0.0 (Completado) 🚀
- [x] Arquitectura base: React 19 + Vite 6 + Tailwind CSS v4 + TypeScript + Capacitor 7.
- [x] Persistencia en IndexedDB estructurado con auto-sembrado inicial y fallback a LocalStorage.
- [x] Autenticación biométrica nativa (`androidx.biometric:1.1.0` en Android Jetpack) con fallback a PIN numérico táctil.
- [x] Bloqueo de seguridad automático al pasar la aplicación a segundo plano (`visibilitychange`) y auto-login opcional.
- [x] Layout móvil con insets de `safe-area`, corrección de teclado Android y navegación accesible.
- [x] Logotipo oficial integrado (estilo Verticons squircle con bóveda y flecha ascendente esmeralda).
- [x] Script de compilación y empaquetado de APK release firmado con `apksigner`: `app-v1.0.0-release.apk`.

---

## Próximas Versiones Planificadas

### 🎯 Versión v1.1.0 (En progreso) — Bolsas de Gastos ("Envelopes") & Smart Seeds
- [ ] Onboarding rápido con 1 clic: Plantilla precargada para España/Europa (8 bolsas maestras: Hipoteca/Alquiler, Luz/Suministros, Gasolina/Transporte, Supermercado, Seguros, Telecomunicaciones, Ocio, Fondo Ahorro).
- [ ] Tarjetas interactivas de bolsas con porcentaje de uso, colores dinámicos y advertencias hápticas.
- [ ] Lógica de **Vasos Comunicantes**: compensación elástica de saldos entre bolsas cuando una supera su techo.
- [ ] Mecanismo de **Rollover** automático del excedente mensual hacia la bolsa de ahorro.

### 🎯 Versión v1.2.0 — Gastos Recurrentes y Detección de Gastos Vampiro
- [ ] Gestor de recibos periódicos (mensual, bimestral, trimestral, semestral, anual).
- [ ] Cálculo automático del próximo cobro y anillo visual de días restantes.
- [ ] Detección de gastos vampiro (suscripciones poco usadas o duplicadas).
- [ ] Registro ágil de gastos imprevistos y compras diarias.

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
