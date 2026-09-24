import React, { useState, useEffect } from 'react';
import { AuthService } from '../../services/auth';
import {
  Fingerprint,
  Delete,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  CheckSquare,
  Square,
  ArrowRight,
  Shield,
  RefreshCw,
} from 'lucide-react';

interface AuthScreenProps {
  onUnlocked: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onUnlocked }) => {
  const [isConfigured, setIsConfigured] = useState(() => AuthService.isPasswordConfigured());
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => AuthService.isAutoLoginEnabled());
  const [errorMsg, setErrorMsg] = useState('');
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [isAuthenticatingBiometric, setIsAuthenticatingBiometric] = useState(false);

  useEffect(() => {
    // Comprobar soporte biométrico nativo (sensor de huella Android o WebAuthn)
    AuthService.isBiometricSupported().then((supported) => {
      setIsBiometricAvailable(supported);
      // Si la contraseña está configurada, solicitar huella automáticamente al montar
      if (supported && AuthService.isPasswordConfigured()) {
        triggerBiometricAuth();
      }
    });
  }, []);

  const triggerBiometricAuth = async () => {
    setIsAuthenticatingBiometric(true);
    setErrorMsg('');
    try {
      const ok = await AuthService.authenticateWithBiometrics();
      if (ok) {
        onUnlocked();
      } else {
        setIsAuthenticatingBiometric(false);
      }
    } catch {
      setIsAuthenticatingBiometric(false);
    }
  };

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (!password) {
      setErrorMsg('Por favor, introduce tu contraseña o código PIN.');
      return;
    }

    if (!isConfigured) {
      if (password.length < 4) {
        setErrorMsg('La contraseña o PIN debe tener al menos 4 caracteres o dígitos.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Las contraseñas no coinciden.');
        return;
      }

      AuthService.setPassword(password, true);
      AuthService.unlockWithPassword(password, rememberMe);
      onUnlocked();
      return;
    }

    const success = AuthService.unlockWithPassword(password, rememberMe);
    if (success) {
      onUnlocked();
    } else {
      setErrorMsg('Contraseña o PIN incorrecto.');
      setPassword('');
    }
  };

  const handleNumpadPress = (digit: string) => {
    if (password.length >= 12) return;
    setErrorMsg('');
    const newPass = password + digit;
    setPassword(newPass);

    const configured = AuthService.getConfiguredPassword();
    if (isConfigured && configured && newPass.length === configured.length) {
      if (AuthService.unlockWithPassword(newPass, rememberMe)) {
        onUnlocked();
      } else {
        setErrorMsg('Código PIN incorrecto.');
        setTimeout(() => {
          setPassword('');
          setErrorMsg('');
        }, 500);
      }
    }
  };

  const handleDeleteDigit = () => {
    setPassword((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#090d16] flex flex-col items-center justify-between p-6 text-white overflow-y-auto"
      style={{
        paddingTop: 'calc(max(0.7cm, env(safe-area-inset-top, 0px)) + 1rem)',
        paddingBottom: 'calc(max(0.7cm, env(safe-area-inset-bottom, 0px)) + 1rem)',
      }}
    >
      {/* Franja superior fija para reloj y barra de estado */}
      <div
        className="fixed top-0 left-0 right-0 z-50 pointer-events-none"
        style={{
          height: 'max(0.7cm, env(safe-area-inset-top, 0px))',
          backgroundColor: '#050811',
        }}
      />

      {/* Franja inferior fija para barra del sistema */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none"
        style={{
          height: 'max(0.7cm, env(safe-area-inset-bottom, 0px))',
          backgroundColor: '#050811',
        }}
      />

      <div className="w-full max-w-sm flex flex-col items-center space-y-5 my-auto">
        {/* Cabecera & Logotipo de la App */}
        <div className="flex flex-col items-center space-y-3 text-center">
          <div className="relative">
            <img
              src="/logo.jpg"
              alt="Gastos Facturación"
              className="w-20 h-20 rounded-3xl object-cover shadow-2xl border-2 border-emerald-500/40 shadow-emerald-500/20"
            />
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1 text-slate-950 shadow-md">
              <Shield className="w-3.5 h-3.5 fill-current" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-1.5">
              <span>Gastos Facturación</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {isConfigured
                ? 'Bóveda protegida con biometría y PIN'
                : 'Configura tu PIN de seguridad para empezar'}
            </p>
          </div>
        </div>

        {/* Mensaje de Error */}
        {errorMsg && (
          <div className="w-full p-3 bg-rose-500/15 border border-rose-500/30 rounded-2xl flex items-center space-x-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleLogin} className="w-full space-y-4">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center px-1">
              <label className="text-[11px] font-bold text-slate-300 tracking-wide uppercase">
                {isConfigured ? 'PIN de Acceso' : 'Nuevo PIN / Clave'}
              </label>
              {password.length > 0 && (
                <span className="text-[11px] text-emerald-400 font-mono">
                  {password.length} dígitos
                </span>
              )}
            </div>

            <div className="relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isConfigured ? '••••' : 'Mínimo 4 dígitos'}
                autoFocus
                className="w-full h-13 px-4 pr-12 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-lg text-emerald-400 placeholder:text-slate-600 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono font-bold text-center tracking-widest shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 p-1.5 text-slate-400 hover:text-white transition-colors"
                title={showPassword ? 'Ocultar PIN' : 'Ver PIN'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Confirmar PIN en primer arranque */}
          {!isConfigured && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 tracking-wide uppercase px-1">
                Confirmar PIN
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite el PIN..."
                className="w-full h-13 px-4 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-lg text-emerald-400 placeholder:text-slate-600 focus:outline-hidden focus:border-emerald-500 transition-all font-mono font-bold text-center tracking-widest"
              />
            </div>
          )}

          {/* Auto-login checkbox */}
          <div
            onClick={() => setRememberMe(!rememberMe)}
            className="flex items-center space-x-2.5 p-2 rounded-xl hover:bg-slate-800/40 cursor-pointer transition-colors"
          >
            <button type="button" className="text-emerald-400 transition-colors shrink-0">
              {rememberMe ? (
                <CheckSquare className="w-5 h-5 text-emerald-400" />
              ) : (
                <Square className="w-5 h-5 text-slate-600" />
              )}
            </button>
            <span className="text-xs text-slate-300 font-medium select-none">
              Recordar acceso en este dispositivo
            </span>
          </div>

          {/* Botón principal */}
          <button
            type="submit"
            className="w-full h-13 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-98 text-slate-950 font-extrabold rounded-2xl flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
          >
            <span>{isConfigured ? 'Desbloquear Bóveda' : 'Guardar PIN y Entrar'}</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </form>

        {/* Teclado numérico táctil y botón de huella si ya está configurado */}
        {isConfigured && (
          <div className="w-full pt-1 flex flex-col items-center space-y-3">
            <div className="grid grid-cols-3 gap-2 w-full max-w-[270px]">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleNumpadPress(digit)}
                  className="h-12 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-92 text-lg font-bold text-white transition-all border border-slate-700/50 flex items-center justify-center shadow-xs"
                >
                  {digit}
                </button>
              ))}

              {/* Botón táctil de huella dactilar */}
              <button
                type="button"
                onClick={triggerBiometricAuth}
                className="h-12 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 active:scale-92 text-emerald-400 hover:text-emerald-300 transition-all border border-emerald-500/40 flex items-center justify-center shadow-sm"
                title="Acceso biométrico"
              >
                <Fingerprint className="w-6 h-6 animate-pulse" />
              </button>

              <button
                type="button"
                onClick={() => handleNumpadPress('0')}
                className="h-12 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-92 text-lg font-bold text-white transition-all border border-slate-700/50 flex items-center justify-center shadow-xs"
              >
                0
              </button>

              <button
                type="button"
                onClick={handleDeleteDigit}
                className="h-12 rounded-xl bg-slate-800/50 hover:bg-slate-700 active:scale-92 text-slate-300 hover:text-white transition-all border border-slate-700/30 flex items-center justify-center"
                title="Borrar dígito"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>

            {/* Reintentar huella */}
            <button
              type="button"
              onClick={triggerBiometricAuth}
              disabled={isAuthenticatingBiometric}
              className="flex items-center space-x-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 py-1.5 px-3 rounded-xl hover:bg-slate-800/50 transition-all"
            >
              {isAuthenticatingBiometric ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  <span>Esperando huella...</span>
                </>
              ) : (
                <>
                  <Fingerprint className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Verificar con Huella Dactilar</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Pie de pantalla */}
      <div className="text-center pt-2">
        <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Almacenamiento local cifrado e independiente</span>
        </p>
      </div>
    </div>
  );
};
