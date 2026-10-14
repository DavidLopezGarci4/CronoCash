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
          title: options?.title || 'Acceso a CronoCash',
          subtitle: options?.subtitle || 'Usa tu huella dactilar para acceder a tus finanzas',
          cancelText: options?.cancelText || 'Usar Teclado PIN',
        });
        return {
          success: Boolean(res && res.success),
          error: res?.errorMessage,
        };
      }

      // En navegador web: verificar mediante WebAuthn de plataforma si existe credencial local o rechazar (fail-closed)
      if (
        typeof window !== 'undefined' &&
        window.PublicKeyCredential &&
        navigator.credentials &&
        typeof navigator.credentials.create === 'function'
      ) {
        const available = await this.isAvailable();
        if (!available) {
          return {
            success: false,
            error: 'Autenticador biométrico de plataforma no disponible en este navegador',
          };
        }
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);
        const userId = new Uint8Array(16);
        window.crypto.getRandomValues(userId);

        const cred = await navigator.credentials.create({
          publicKey: {
            challenge,
            rp: { name: 'CronoCash Vault' },
            user: {
              id: userId,
              name: 'cronocash-local-user',
              displayName: 'Titular CronoCash',
            },
            pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
            authenticatorSelection: {
              authenticatorAttachment: 'platform',
              userVerification: 'required',
            },
            timeout: 30000,
          },
        });
        return { success: Boolean(cred) };
      }

      return {
        success: false,
        error: 'Sensor biométrico nativo disponible únicamente en la app Android',
      };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Error en sensor biométrico' };
    }
  }
}
