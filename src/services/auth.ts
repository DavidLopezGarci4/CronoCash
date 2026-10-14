import { DBService } from './db';
import { NativeBiometricService } from './nativeBiometric';
import { VaultCryptoService } from './vaultCryptoService';

export class AuthService {
  private static SESSION_KEY = 'gastos_unlocked_session_v1';
  private static AUTO_LOGIN_KEY = 'gastos_auto_login_active_v1';
  private static SAVED_CREDENTIAL_KEY = 'gastos_saved_credential_v1';
  private static SAVED_VERIFIER_KEY = 'gastos_saved_token_verifier_v1';
  private static FAILED_ATTEMPTS_KEY = 'gastos_auth_failed_attempts_v1';
  private static LOCKOUT_UNTIL_KEY = 'gastos_auth_lockout_until_v1';
  private static MAX_FAILED_ATTEMPTS = 5;
  private static LOCKOUT_DURATION_MS = 30_000;
  private static isPickingFile = false;

  /**
   * Marca si el usuario está interactuando con un selector de archivos externo (SAF / Google Drive)
   */
  static setPickingFile(active: boolean): void {
    this.isPickingFile = active;
  }

  static isFilePickerActive(): boolean {
    return this.isPickingFile;
  }

  /**
   * Mantiene o renueva la sesión activa tras una restauración de datos para no expulsar al usuario
   */
  static keepSessionUnlockedAfterRestore(): void {
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(this.SESSION_KEY, 'true');
      }
    } catch {
      // Ignorar si no hay storage
    }
  }

  /**
   * Comprueba si el usuario tiene una contraseña o PIN configurado
   */
  static isPasswordConfigured(): boolean {
    const settings = DBService.getSettings();
    return Boolean(settings.pinSeguridad && settings.pinSeguridad.trim().length > 0);
  }

  /**
   * Devuelve cuántos segundos restan de bloqueo temporal por intentos fallidos (0 si no está bloqueado)
   */
  static getLockoutRemainingSeconds(): number {
    try {
      if (typeof localStorage === 'undefined') return 0;
      const untilRaw = localStorage.getItem(this.LOCKOUT_UNTIL_KEY);
      if (!untilRaw) return 0;
      const untilMs = parseInt(untilRaw, 10) || 0;
      const diffMs = untilMs - Date.now();
      if (diffMs <= 0) {
        localStorage.removeItem(this.LOCKOUT_UNTIL_KEY);
        return 0;
      }
      return Math.ceil(diffMs / 1000);
    } catch {
      return 0;
    }
  }

  /**
   * Obtiene el número de intentos fallidos acumulados
   */
  static getFailedAttempts(): number {
    try {
      if (typeof localStorage === 'undefined') return 0;
      return parseInt(localStorage.getItem(this.FAILED_ATTEMPTS_KEY) || '0', 10) || 0;
    } catch {
      return 0;
    }
  }

  private static recordFailedAttempt(): void {
    try {
      if (typeof localStorage === 'undefined') return;
      const current = this.getFailedAttempts() + 1;
      localStorage.setItem(this.FAILED_ATTEMPTS_KEY, String(current));
      if (current >= this.MAX_FAILED_ATTEMPTS) {
        const multiplier = Math.min(4, Math.floor(current / this.MAX_FAILED_ATTEMPTS));
        const lockoutUntil = Date.now() + this.LOCKOUT_DURATION_MS * multiplier;
        localStorage.setItem(this.LOCKOUT_UNTIL_KEY, String(lockoutUntil));
      }
    } catch {
      // Ignorar
    }
  }

  static resetLockout(): void {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.removeItem(this.FAILED_ATTEMPTS_KEY);
      localStorage.removeItem(this.LOCKOUT_UNTIL_KEY);
    } catch {
      // Ignorar
    }
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
   * Comprueba si la app puede acceder automáticamente sin pedir credenciales
   * utilizando un token de dispositivo vinculado al hash del PIN (sin guardar el PIN en claro).
   */
  static canAutoUnlock(): boolean {
    if (!this.isPasswordConfigured()) {
      return false;
    }

    if (!this.isAutoLoginEnabled()) {
      return false;
    }

    if (this.getLockoutRemainingSeconds() > 0) {
      return false;
    }

    try {
      if (typeof localStorage === 'undefined') return false;
      const savedToken = localStorage.getItem(this.SAVED_CREDENTIAL_KEY) || '';
      const savedVerifier = localStorage.getItem(this.SAVED_VERIFIER_KEY) || '';
      const settings = DBService.getSettings();
      const configuredHash = settings.pinSeguridad || '';

      if (!savedToken || !configuredHash) return false;

      if (savedVerifier) {
        const expectedVerifier = VaultCryptoService.sha256Hex(`${savedToken}:${configuredHash}`);
        return expectedVerifier === savedVerifier;
      }

      // Migración transparente de credencial legada si existía de versiones previas
      if (VaultCryptoService.verifyPin(savedToken, configuredHash)) {
        if (!VaultCryptoService.isHashedPin(configuredHash)) {
          settings.pinSeguridad = VaultCryptoService.hashPin(savedToken);
          DBService.saveSettings(settings);
        }
        this.markSessionUnlocked(true);
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * Valida la contraseña / PIN introducido y opcionalmente recuerda la sesión en el dispositivo
   */
  static unlockWithPassword(inputPassword: string, rememberOnDevice: boolean = false): boolean {
    if (this.getLockoutRemainingSeconds() > 0) {
      return false;
    }

    const settings = DBService.getSettings();
    const configuredPinOrHash = settings.pinSeguridad || '';

    // Si aún no hay contraseña fijada y se pasa una no vacía (mínimo 4 caracteres), se inicializa
    if (!configuredPinOrHash && inputPassword.trim().length >= 4) {
      this.setPassword(inputPassword.trim(), true);
      this.resetLockout();
      this.markSessionUnlocked(rememberOnDevice);
      return true;
    }

    if (VaultCryptoService.verifyPin(inputPassword, configuredPinOrHash)) {
      // Si el PIN almacenado aún estaba en texto plano legado, migrarlo automáticamente a PBKDF2-SHA256
      if (!VaultCryptoService.isHashedPin(configuredPinOrHash)) {
        settings.pinSeguridad = VaultCryptoService.hashPin(inputPassword);
        DBService.saveSettings(settings);
      }
      this.resetLockout();
      this.markSessionUnlocked(rememberOnDevice);
      return true;
    }

    this.recordFailedAttempt();
    return false;
  }

  /**
   * Registra el desbloqueo y emite un token criptográfico efímero si se solicitó recordar dispositivo
   */
  private static markSessionUnlocked(remember: boolean): void {
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(this.SESSION_KEY, 'true');
      }
      const settings = DBService.getSettings();
      if (typeof localStorage !== 'undefined') {
        if (remember && settings.pinSeguridad) {
          const deviceToken = VaultCryptoService.generateSecureToken(32);
          const verifier = VaultCryptoService.sha256Hex(`${deviceToken}:${settings.pinSeguridad}`);
          localStorage.setItem(this.AUTO_LOGIN_KEY, 'true');
          localStorage.setItem(this.SAVED_CREDENTIAL_KEY, deviceToken);
          localStorage.setItem(this.SAVED_VERIFIER_KEY, verifier);
        } else {
          localStorage.removeItem(this.AUTO_LOGIN_KEY);
          localStorage.removeItem(this.SAVED_CREDENTIAL_KEY);
          localStorage.removeItem(this.SAVED_VERIFIER_KEY);
        }
      }

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
        localStorage.removeItem(this.SAVED_VERIFIER_KEY);
        const settings = DBService.getSettings();
        settings.guardarContrasenaAuto = false;
        DBService.saveSettings(settings);
      }
    } catch {
      // Manejo seguro
    }
  }

  /**
   * Configura una nueva contraseña / PIN maestro almacenando únicamente su hash PBKDF2-SHA256
   */
  static setPassword(newPassword: string, activate: boolean = true): string {
    const settings = DBService.getSettings();
    const hashed = newPassword ? VaultCryptoService.hashPin(newPassword.trim()) : '';
    settings.pinSeguridad = hashed;
    settings.bloqueoPinActivo = activate && Boolean(hashed);
    DBService.saveSettings(settings);
    this.resetLockout();
    this.lock(false);
    return hashed;
  }

  /**
   * Alias de compatibilidad
   */
  static setPin(newPin: string, activate: boolean = true): string {
    return this.setPassword(newPin, activate);
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
      if (!this.isPasswordConfigured()) {
        return false;
      }

      const res = await NativeBiometricService.authenticate({
        title: 'Acceso a CronoCash',
        subtitle: 'Verifica tu identidad biométrica para abrir la bóveda cifrada',
        cancelText: 'Usar Contraseña / PIN',
      });

      if (res.success) {
        this.resetLockout();
        this.markSessionUnlocked(this.isAutoLoginEnabled());
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }
}

