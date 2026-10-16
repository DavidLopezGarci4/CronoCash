package com.gastosfacturacion.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(BiometricPlugin.class);
        registerPlugin(SharedStatementPlugin.class);
        super.onCreate(savedInstanceState);
        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_SECURE,
            WindowManager.LayoutParams.FLAG_SECURE
        );
        // Solo en el arranque real: una recreación de la actividad no debe volver a importar el mismo extracto
        if (savedInstanceState == null) {
            handleSharedStatement(getIntent());
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleSharedStatement(intent);
    }

    /** "Compartir a CronoCash": recoge el extracto bancario enviado por otra app (solo content://). */
    private void handleSharedStatement(Intent intent) {
        if (intent == null) return;
        String action = intent.getAction();
        Uri uri = null;

        if (Intent.ACTION_SEND.equals(action)) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                uri = intent.getParcelableExtra(Intent.EXTRA_STREAM, Uri.class);
            } else {
                uri = intent.getParcelableExtra(Intent.EXTRA_STREAM);
            }
        } else if (Intent.ACTION_VIEW.equals(action)) {
            uri = intent.getData();
        }

        if (uri == null || !"content".equals(uri.getScheme())) return;
        SharedStatementPlugin.receive(getApplicationContext(), uri, intent.getType());
    }
}
