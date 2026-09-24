package com.gastosfacturacion.app;

import androidx.annotation.NonNull;
import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.concurrent.Executor;

@CapacitorPlugin(name = "NativeBiometric")
public class BiometricPlugin extends Plugin {

    @PluginMethod
    public void isAvailable(PluginCall call) {
        try {
            BiometricManager biometricManager = BiometricManager.from(getContext());
            int canAuthenticate = biometricManager.canAuthenticate(
                BiometricManager.Authenticators.BIOMETRIC_STRONG | BiometricManager.Authenticators.BIOMETRIC_WEAK
            );

            boolean isAvailable = (canAuthenticate == BiometricManager.BIOMETRIC_SUCCESS);
            JSObject ret = new JSObject();
            ret.put("isAvailable", isAvailable);
            ret.put("status", canAuthenticate);
            call.resolve(ret);
        } catch (Exception e) {
            JSObject ret = new JSObject();
            ret.put("isAvailable", false);
            ret.put("error", e.getMessage());
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void authenticate(PluginCall call) {
        String title = call.getString("title", "Acceso Seguro");
        String subtitle = call.getString("subtitle", "Verifica tu identidad con tu huella dactilar");
        String cancelText = call.getString("cancelText", "Usar PIN o Contraseña");

        getActivity().runOnUiThread(() -> {
            try {
                Executor executor = ContextCompat.getMainExecutor(getContext());

                BiometricPrompt biometricPrompt = new BiometricPrompt(
                    getActivity(),
                    executor,
                    new BiometricPrompt.AuthenticationCallback() {
                        @Override
                        public void onAuthenticationError(int errorCode, @NonNull CharSequence errString) {
                            super.onAuthenticationError(errorCode, errString);
                            JSObject ret = new JSObject();
                            ret.put("success", false);
                            ret.put("errorCode", errorCode);
                            ret.put("errorMessage", errString.toString());
                            call.resolve(ret);
                        }

                        @Override
                        public void onAuthenticationSucceeded(@NonNull BiometricPrompt.AuthenticationResult result) {
                            super.onAuthenticationSucceeded(result);
                            JSObject ret = new JSObject();
                            ret.put("success", true);
                            call.resolve(ret);
                        }

                        @Override
                        public void onAuthenticationFailed() {
                            super.onAuthenticationFailed();
                            // Intento fallido pero el sensor sigue activo en la ventana de Android
                        }
                    }
                );

                BiometricPrompt.PromptInfo promptInfo = new BiometricPrompt.PromptInfo.Builder()
                    .setTitle(title)
                    .setSubtitle(subtitle)
                    .setNegativeButtonText(cancelText)
                    .setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG | BiometricManager.Authenticators.BIOMETRIC_WEAK)
                    .build();

                biometricPrompt.authenticate(promptInfo);
            } catch (Exception e) {
                JSObject ret = new JSObject();
                ret.put("success", false);
                ret.put("errorMessage", e.getMessage());
                call.resolve(ret);
            }
        });
    }
}
