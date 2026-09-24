import { registerPlugin, Capacitor } from '@capacitor/core';

export interface NativeBiometricPlugin {
  isAvailable(): Promise<{ isAvailable: boolean; status?: number; error?: string }>;
  authenticate(options?: {
    title?: string;
    subtitle?: string;
    cancelText?: string;
  }): Promise<{ success: boolean; errorCode?: number; errorMessage?: string }>;
}

const NativeBiometric = registerPlugin<NativeBiometricPlugin>('NativeBiometric');

export class NativeBiometricService {
  /**
   * Comprueba si el dispositivo físico soporta y tiene configurado sensor biométrico (huella)
   */
  static async isAvailable(): Promise<boolean> {
    try {
      if (Capacitor.isNativePlatform()) {
        const result = await NativeBiometric.isAvailable();
        return Boolean(result && result.isAvailable);
      }

      // En navegador web (fallback WebAuthn)
      if (
        typeof window !== 'undefined' &&
        window.PublicKeyCredential &&
        window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable
      ) {
        return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * Dispara el diálogo nativo oficial de Android BiometricPrompt con la animación y lector de huella
   */
  static async authenticate(options?: {
    title?: string;
    subtitle?: string;
    cancelText?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      if (Capacitor.isNativePlatform()) {
        const res = await NativeBiometric.authenticate({
          title: options?.title || 'Acceso a Gastos Facturación',
          subtitle: options?.subtitle || 'Usa tu huella dactilar para acceder a tus finanzas',
          cancelText: options?.cancelText || 'Usar Contraseña / PIN',
        });
        return {
          success: Boolean(res && res.success),
          error: res?.errorMessage,
        };
      }

      // Fallback navegador / pruebas web
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Error en sensor biométrico' };
    }
  }
}
