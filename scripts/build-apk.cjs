const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const androidDir = path.join(rootDir, 'android');
const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
const version = pkg.version || '1.0.0';

console.log(`\n📦 INICIANDO COMPILACIÓN Y EMPAQUETADO RELEASE (v${version})...\n`);

// 1. Configurar JDK 21 y Android SDK
const possibleJdks = [
  'C:\\Users\\dace8\\.jdks\\jbr-21.0.11',
  'C:\\Program Files\\Android\\Android Studio\\jbr',
  process.env.JAVA_HOME,
].filter(Boolean);

const javaHome = possibleJdks.find((p) => fs.existsSync(p)) || process.env.JAVA_HOME;
const androidSdk = path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk');

console.log(`☕ Usando JDK: ${javaHome}`);
console.log(`📱 Usando Android SDK: ${androidSdk}`);

const env = {
  ...process.env,
  JAVA_HOME: javaHome,
  ANDROID_HOME: androidSdk,
  ANDROID_SDK_ROOT: androidSdk,
  Path: `${path.join(javaHome, 'bin')};${process.env.Path}`,
};

// 2. Preparar assets fuera de OneDrive para evitar problemas de reparse points
const localAssetsDir = 'C:\\Users\\dace8\\.gradle_builds\\GastosFacturacion\\assets';
const localAssetsPublic = path.join(localAssetsDir, 'public');
const distDir = path.join(rootDir, 'dist');
const mainAssetsDir = path.join(androidDir, 'app', 'src', 'main', 'assets');

try {
  if (!fs.existsSync(localAssetsDir)) {
    fs.mkdirSync(localAssetsDir, { recursive: true });
  }

  // Copiar archivos de configuración y plugins generados por Capacitor
  if (fs.existsSync(mainAssetsDir)) {
    fs.cpSync(mainAssetsDir, localAssetsDir, { recursive: true });
  }

  // Asegurar que public contiene la compilación web (dist) más reciente
  if (fs.existsSync(localAssetsPublic)) {
    fs.rmSync(localAssetsPublic, { recursive: true, force: true });
  }
  fs.mkdirSync(localAssetsPublic, { recursive: true });
  if (fs.existsSync(distDir)) {
    fs.cpSync(distDir, localAssetsPublic, { recursive: true });
  }

  console.log('✅ Assets y plugins sincronizados en almacenamiento local de build.');
} catch (e) {
  console.warn('⚠️ Aviso al preparar assets locales:', e.message);
}

// 3. Ejecutar Gradle assembleRelease
console.log('⚡ Ejecutando gradlew assembleRelease --no-daemon...');
execSync('.\\gradlew.bat assembleRelease --no-daemon', {
  cwd: androidDir,
  env,
  stdio: 'inherit',
});

// 4. Localizar APK unsigned
const possibleUnsigned = [
  'C:\\Users\\dace8\\.gradle_builds\\GastosFacturacion\\app\\outputs\\apk\\release\\app-release-unsigned.apk',
  'C:\\Users\\dace8\\.gradle_builds\\GastosFacturacion\\app\\outputs\\apk\\release\\app-release.apk',
  path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release-unsigned.apk'),
  path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk'),
];

const unsignedApk = possibleUnsigned.find((p) => fs.existsSync(p));
if (!unsignedApk) {
  console.error('❌ No se encontró app-release-unsigned.apk generado por Gradle.');
  process.exit(1);
}

console.log(`📦 APK generado encontrado en: ${unsignedApk}`);

// 5. Firmar con apksigner
const possibleSigners = [
  path.join(androidSdk, 'build-tools', '34.0.0', 'apksigner.bat'),
  path.join(androidSdk, 'build-tools', '35.0.0', 'apksigner.bat'),
];
const sdkBuildTools = possibleSigners.find((p) => fs.existsSync(p)) || possibleSigners[0];
const keystore = path.join(process.env.USERPROFILE, '.android', 'debug.keystore');

const releaseDir = path.join(androidDir, 'app', 'release');
if (!fs.existsSync(releaseDir)) {
  fs.mkdirSync(releaseDir, { recursive: true });
}

// Rutas requeridas por la especificación
const targetVersionedApk = path.join(releaseDir, `app-v${version}-release.apk`);
const targetNamedApk = path.join(releaseDir, `crono-cash-v${version}-release.apk`);
const targetLegacyApk = path.join(releaseDir, `gastos-facturacion-v${version}-release.apk`);
const targetReleaseApk = path.join(releaseDir, 'app-release.apk');

console.log('🔑 Firmando APK de producción con apksigner...');
const signCmd = `"${sdkBuildTools}" sign --ks "${keystore}" --ks-pass pass:android --key-pass pass:android --ks-key-alias androiddebugkey --out "${targetVersionedApk}" "${unsignedApk}"`;
execSync(signCmd, { env, stdio: 'inherit' });

// Copias con nombres estandarizados
fs.copyFileSync(targetVersionedApk, targetReleaseApk);
fs.copyFileSync(targetVersionedApk, targetNamedApk);
fs.copyFileSync(targetVersionedApk, targetLegacyApk);

// 6. Verificación y estadísticas
const stats = fs.statSync(targetVersionedApk);
const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);

console.log('\n============================================================');
console.log(`🎉 ¡APK RELEASE FIRMADO Y GENERADO CON ÉXITO!`);
console.log(`   - Archivo:       ${path.basename(targetVersionedApk)}`);
console.log(`   - Tamaño:        ${sizeMb} MB (${stats.size} bytes)`);
console.log(`   - Ruta Completa: ${targetVersionedApk}`);
console.log(`   - Versión:       v${version}`);
console.log('============================================================\n');
