# Changelog — CronoCash 📝

Todas las modificaciones notables en este proyecto serán documentadas en este archivo.
El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y este proyecto se adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.0] - 2026-09-24

### Added
- **Gestor Completo de Gastos Recurrentes:** Soporte flexible de periodicidades (semanal, mensual, trimestral y anual) con asignación de día de cargo y bolsa.
- **Motor Predictivo de Cobros & Cuenta Atrás:** Algoritmo dinámico que calcula la fecha de vencimiento más próxima y los días restantes con badges semafóricos inteligentes ("¡Vence HOY!", "¡Mañana!", "En X días").
- **Detector & Auditoría de Gastos Vampiro:** Panel interactivo para auditar suscripciones inactivas o repetidas, calculando el ahorro potencial al migrar a planes anuales o dar de baja.
- **Smart Seeds de Recurrentes en 1 Clic:** Plantilla maestra con 7 recibos clave precargados para España y Europa (Hipoteca/Alquiler, Luz, Agua, Fibra/Móvil, Seguro Coche, Gimnasio y Streaming).
- **Acción Inmediata de Asentamiento:** Botón "Registrar Pago" para convertir de forma inmediata un recibo en un gasto real deducido en su bolsa presupuestaria.
- **Artefacto Release Firmado:** Compilación del APK firmado `app-v1.2.0-release.apk` (`versionCode 10200`, `versionName "1.2.0"`).

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
