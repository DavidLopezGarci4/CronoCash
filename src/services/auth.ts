import { DBService } from './db';
import { NativeBiometricService } from './nativeBiometric';

export class AuthService {
  private static SESSION_KEY = 'gastos_unlocked_session_v1';
  private static AUTO_LOGIN_KEY = 'gastos_auto_login_active_v1';
  private static SAVED_CREDENTIAL_KEY = 'gastos_saved_credential_v1';

  /**
   * Comprueba si el usuario tiene una contraseña o PIN configurado
   */
  static isPasswordConfigured(): boolean {
    const settings = DBService.getSettings();
    return Boolean(settings.pinSeguridad && settings.pinSeguridad.trim().length > 0);
  }

  /**
   * Obtiene la contraseña / PIN configurada actualmente
   */
  static getConfiguredPassword(): string {
    const settings = DBService.getSettings();
    return settings.pinSeguridad || '';
  }

  /**
   * Comprueba si la sesión actual está desbloqueada en la memoria volátil
   */
  static isUnlocked(): boolean {
    try {
      if (typeof sessionStorage === 'undefined') return false;
      return sessionStorage.getItem(this.SESSION_KEY) === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Comprueba si el usuario ha activado el acceso automático en este dispositivo
   */
  static isAutoLoginEnabled(): boolean {
    try {
      if (typeof localStorage === 'undefined') return false;
      const localFlag = localStorage.getItem(this.AUTO_LOGIN_KEY) === 'true';
      const settings = DBService.getSettings();
      return localFlag || Boolean(settings.guardarContrasenaAuto);
    } catch {
      return false;
    }
  }

  /**
   * Obtiene la credencial guardada si se configuró auto-login
   */
  static getSavedCredential(): string {
    try {
      if (typeof localStorage === 'undefined') return '';
      return localStorage.getItem(this.SAVED_CREDENTIAL_KEY) || '';
    } catch {
      return '';
    }
  }

  /**
   * Comprueba si la app puede acceder automáticamente sin pedir credenciales
   */
  static canAutoUnlock(): boolean {
    if (!this.isPasswordConfigured()) {
      return false;
    }

    if (!this.isAutoLoginEnabled()) {
      return false;
    }

    const savedCred = this.getSavedCredential();
    const currentPass = this.getConfiguredPassword();
    return Boolean(savedCred && savedCred === currentPass);
  }

  /**
   * Valida la contraseña / PIN introducido y opcionalmente recuerda la credencial
   */
  static unlockWithPassword(inputPassword: string, rememberOnDevice: boolean = false): boolean {
    const settings = DBService.getSettings();
    const correctPassword = settings.pinSeguridad || '';

    // Si aún no hay contraseña fijada y se pasa una no vacía (mínimo 4 caracteres), se inicializa
    if (!correctPassword && inputPassword.trim().length >= 4) {
      this.setPassword(inputPassword.trim(), true);
      this.markSessionUnlocked(rememberOnDevice, inputPassword.trim());
      return true;
    }

    if (inputPassword === correctPassword) {
      this.markSessionUnlocked(rememberOnDevice, inputPassword);
      return true;
    }

    return false;
  }

  /**
   * Registra el desbloqueo y guarda la credencial si se solicitó recordar
   */
  private static markSessionUnlocked(remember: boolean, credential?: string): void {
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(this.SESSION_KEY, 'true');
      }
      if (typeof localStorage !== 'undefined') {
        if (remember && credential) {
          localStorage.setItem(this.AUTO_LOGIN_KEY, 'true');
          localStorage.setItem(this.SAVED_CREDENTIAL_KEY, credential);
        } else {
          localStorage.removeItem(this.AUTO_LOGIN_KEY);
          localStorage.removeItem(this.SAVED_CREDENTIAL_KEY);
        }
      }

      const settings = DBService.getSettings();
      settings.guardarContrasenaAuto = remember;
      DBService.saveSettings(settings);
    } catch {
      // Entornos sin storage
    }
  }

  /**
   * Cierra la sesión y bloquea la aplicación.
   * Si manualLogout es true (ej. clic en el candado del Header), desactiva el auto-login temporalmente para pedir credenciales.
   * Si manualLogout es false (ej. paso a segundo plano), solo limpia la sesión volátil si no tiene auto-login activo.
   */
  static lock(manualLogout: boolean = false): void {
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(this.SESSION_KEY);
      }
      if (manualLogout && typeof localStorage !== 'undefined') {
        localStorage.removeItem(this.AUTO_LOGIN_KEY);
        localStorage.removeItem(this.SAVED_CREDENTIAL_KEY);
        const settings = DBService.getSettings();
        settings.guardarContrasenaAuto = false;
        DBService.saveSettings(settings);
      }
    } catch {
      // Manejo seguro
    }
  }

  /**
   * Configura una nueva contraseña / PIN maestro
   */
  static setPassword(newPassword: string, activate: boolean = true): void {
    const settings = DBService.getSettings();
    settings.pinSeguridad = newPassword;
    settings.bloqueoPinActivo = activate && Boolean(newPassword);
    DBService.saveSettings(settings);
    this.lock(false);
  }

  /**
   * Alias de compatibilidad
   */
  static setPin(newPin: string, activate: boolean = true): void {
    this.setPassword(newPin, activate);
  }

  static unlockWithPin(pin: string): boolean {
    return this.unlockWithPassword(pin, false);
  }

  /**
   * Activa o desactiva la biometría
   */
  static setBiometric(activate: boolean): void {
    const settings = DBService.getSettings();
    settings.biometriaActiva = activate;
    DBService.saveSettings(settings);
  }

  /**
   * Comprueba si el dispositivo soporta biometría (sensor nativo de huella o WebAuthn)
   */
  static async isBiometricSupported(): Promise<boolean> {
    try {
      return await NativeBiometricService.isAvailable();
    } catch {
      return false;
    }
  }

  /**
   * Autenticación con huella dactilar nativa del sistema (Android BiometricPrompt)
   */
  static async authenticateWithBiometrics(): Promise<boolean> {
    try {
      const settings = DBService.getSettings();
      if (!this.isPasswordConfigured()) {
        return false;
      }

      const res = await NativeBiometricService.authenticate({
        title: 'Acceso a Gastos Facturación',
        subtitle: 'Verifica tu huella para acceder al panel financiero',
        cancelText: 'Usar Contraseña / PIN',
      });

      if (res.success) {
        this.markSessionUnlocked(this.isAutoLoginEnabled(), settings.pinSeguridad);
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }
}
