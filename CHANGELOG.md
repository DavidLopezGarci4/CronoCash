# Changelog — Gastos Facturación 📝

Todas las modificaciones notables en este proyecto serán documentadas en este archivo.
El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y este proyecto se adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-09-24

### Added
- **Arquitectura base:** Configuración integral de React 19, Vite 6, Tailwind CSS v4, TypeScript 5.7 y Capacitor 7.
- **Persistencia IndexedDB:** Motor nativo `IndexedDB` (`GastosFacturacionDB`) con soporte de almacenes para gastos, bolsas, reglas recurrentes, ajustes y consejos con fallback transparente a `localStorage`.
- **Autenticación Biométrica Nativa:** Plugin interno `BiometricPlugin.java` con Android Jetpack `androidx.biometric:1.1.0` y fallback para desarrollo web.
- **Pantalla de Seguridad (AuthScreen):** Acceso por huella dactilar, teclado táctil PIN numérico de respuesta instantánea, auto-bloqueo al pasar a segundo plano y opción de auto-login en el dispositivo.
- **UI Shell & Adaptabilidad Móvil:** Insets de `safe-area` para notch superior e inferior, estilos oscuros de alto contraste y corrección para evitar bloqueos en teclados virtuales de Android (`user-select: text !important`).
- **Iconografía y Logotipo:** Logotipo oficial en alta resolución (`public/logo.jpg`) con diseño squircle compatible con Verticons.
- **Artefactos de Release:** Script de compilación `scripts/build-apk.cjs` y generación del APK firmado `android/app/release/app-v1.0.0-release.apk` (3.80 MB).
