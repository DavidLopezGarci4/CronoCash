package com.gastosfacturacion.app;

import android.content.ContentResolver;
import android.content.Context;
import android.database.Cursor;
import android.net.Uri;
import android.provider.OpenableColumns;
import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;

/**
 * "Compartir a CronoCash": guarda EN MEMORIA el extracto bancario compartido desde otra app
 * (ACTION_SEND / ACTION_VIEW) hasta que la interfaz lo recoge con consume().
 * Nunca escribe el fichero en disco. Solo acepta URIs content:// y como máximo 10 MB.
 */
@CapacitorPlugin(name = "SharedStatement")
public class SharedStatementPlugin extends Plugin {

    static final int MAX_BYTES = 10 * 1024 * 1024;

    private static SharedStatementPlugin instance;

    // Extracto pendiente de recoger (uno solo: el último compartido sustituye al anterior)
    private static String pendingName;
    private static String pendingMime;
    private static byte[] pendingBytes;
    private static String pendingError;
    private static boolean hasPending = false;

    @Override
    public void load() {
        instance = this;
    }

    /** Lee el contenido del URI compartido en segundo plano y lo deja pendiente para la interfaz. */
    static void receive(Context context, Uri uri, String mimeType) {
        new Thread(() -> {
            ContentResolver resolver = context.getContentResolver();
            String name = "";
            long declaredSize = -1;

            try (Cursor cursor = resolver.query(uri, null, null, null, null)) {
                if (cursor != null && cursor.moveToFirst()) {
                    int nameIdx = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                    int sizeIdx = cursor.getColumnIndex(OpenableColumns.SIZE);
                    if (nameIdx >= 0 && !cursor.isNull(nameIdx)) name = cursor.getString(nameIdx);
                    if (sizeIdx >= 0 && !cursor.isNull(sizeIdx)) declaredSize = cursor.getLong(sizeIdx);
                }
            } catch (Exception ignored) {
                // Algunos proveedores no exponen metadatos; se continúa sin nombre
            }

            String mime = mimeType != null ? mimeType : resolver.getType(uri);

            if (declaredSize > MAX_BYTES) {
                setPending(name, mime, null, "too_large");
                return;
            }

            try (InputStream in = resolver.openInputStream(uri)) {
                if (in == null) {
                    setPending(name, mime, null, "read_failed");
                    return;
                }
                ByteArrayOutputStream out = new ByteArrayOutputStream();
                byte[] buffer = new byte[16 * 1024];
                int total = 0;
                int read;
                while ((read = in.read(buffer)) != -1) {
                    total += read;
                    if (total > MAX_BYTES) {
                        setPending(name, mime, null, "too_large");
                        return;
                    }
                    out.write(buffer, 0, read);
                }
                setPending(name, mime, out.toByteArray(), null);
            } catch (Exception e) {
                setPending(name, mime, null, "read_failed");
            }
        }).start();
    }

    private static void setPending(String name, String mime, byte[] bytes, String error) {
        synchronized (SharedStatementPlugin.class) {
            pendingName = name;
            pendingMime = mime;
            pendingBytes = bytes;
            pendingError = error;
            hasPending = true;
        }
        SharedStatementPlugin plugin = instance;
        if (plugin != null) {
            plugin.notifyListeners("sharedStatementAvailable", new JSObject(), true);
        }
    }

    /** Entrega el extracto pendiente (si lo hay) y lo borra de memoria. */
    @PluginMethod
    public void consume(PluginCall call) {
        JSObject ret = new JSObject();
        synchronized (SharedStatementPlugin.class) {
            if (!hasPending) {
                ret.put("available", false);
                call.resolve(ret);
                return;
            }
            ret.put("available", true);
            ret.put("fileName", pendingName != null ? pendingName : "");
            ret.put("mimeType", pendingMime != null ? pendingMime : "");
            if (pendingError != null) {
                ret.put("error", pendingError);
            } else if (pendingBytes != null) {
                ret.put("base64", Base64.encodeToString(pendingBytes, Base64.NO_WRAP));
            }
            pendingName = null;
            pendingMime = null;
            pendingBytes = null;
            pendingError = null;
            hasPending = false;
        }
        call.resolve(ret);
    }
}
