const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const androidDir = path.join(rootDir, 'android');
const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
const version = pkg.version || '1.0.0';

console.log(`\n📦 INICIANDO COMPILACIÓN DUAL DE APKs RELEASE (v${version})...\n`);

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

const psExe = fs.existsSync('C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe')
  ? 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe'
  : 'powershell';

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

const releaseDir = path.join(androidDir, 'app', 'release');
if (!fs.existsSync(releaseDir)) {
  fs.mkdirSync(releaseDir, { recursive: true });
}

const possibleSigners = [
  path.join(androidSdk, 'build-tools', '34.0.0', 'apksigner.bat'),
  path.join(androidSdk, 'build-tools', '35.0.0', 'apksigner.bat'),
];
const sdkBuildTools = possibleSigners.find((p) => fs.existsSync(p)) || possibleSigners[0];
const keystore = path.join(process.env.USERPROFILE, '.android', 'debug.keystore');

function getUnsignedApk() {
  const possibleUnsigned = [
    'C:\\Users\\dace8\\.gradle_builds\\GastosFacturacion\\app\\outputs\\apk\\release\\app-release-unsigned.apk',
    'C:\\Users\\dace8\\.gradle_builds\\GastosFacturacion\\app\\outputs\\apk\\release\\app-release.apk',
    path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release-unsigned.apk'),
    path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk'),
  ];
  return possibleUnsigned.find((p) => fs.existsSync(p));
}

// =========================================================================
// PASO 1: COMPILAR VERSIÓN ESTÁNDAR
// =========================================================================
console.log('\n------------------------------------------------------------');
console.log('🎨 PASO 1/2: Generando APK con Icono Estándar (Squircle)');
console.log('------------------------------------------------------------');

execSync(`"${psExe}" -ExecutionPolicy Bypass -File .\\scripts\\generate-standard-icons.ps1`, {
  cwd: rootDir,
  env,
  stdio: 'inherit',
});

console.log('⚡ Ejecutando gradlew assembleRelease para Icono Estándar...');
execSync('.\\gradlew.bat assembleRelease --no-daemon', {
  cwd: androidDir,
  env,
  stdio: 'inherit',
});

const unsignedStandard = getUnsignedApk();
if (!unsignedStandard) {
  console.error('❌ No se encontró app-release-unsigned.apk generado por Gradle.');
  process.exit(1);
}

const targetStandardApk = path.join(releaseDir, `app-v${version}-release.apk`);
const targetStandardNamed = path.join(releaseDir, `app-v${version}-standard-release.apk`);
const targetReleaseApk = path.join(releaseDir, 'app-release.apk');
const targetCronoNamed = path.join(releaseDir, `crono-cash-v${version}-release.apk`);

console.log('🔑 Firmando APK Estándar...');
const signCmdStandard = `"${sdkBuildTools}" sign --ks "${keystore}" --ks-pass pass:android --key-pass pass:android --ks-key-alias androiddebugkey --out "${targetStandardApk}" "${unsignedStandard}"`;
execSync(signCmdStandard, { env, stdio: 'inherit' });

fs.copyFileSync(targetStandardApk, targetStandardNamed);
fs.copyFileSync(targetStandardApk, targetReleaseApk);
fs.copyFileSync(targetStandardApk, targetCronoNamed);

const statsStandard = fs.statSync(targetStandardApk);
const sizeStandardMb = (statsStandard.size / (1024 * 1024)).toFixed(2);
console.log(`✅ APK Estándar generado: ${path.basename(targetStandardApk)} (${sizeStandardMb} MB)`);

// =========================================================================
// PASO 2: COMPILAR VERSIÓN VERTICONS (Tarjeta 2:3)
// =========================================================================
console.log('\n------------------------------------------------------------');
console.log('💎 PASO 2/2: Generando APK con Icono Verticons (Card 2:3)');
console.log('------------------------------------------------------------');

execSync(`"${psExe}" -ExecutionPolicy Bypass -File .\\scripts\\generate-verticon-icons.ps1`, {
  cwd: rootDir,
  env,
  stdio: 'inherit',
});

// Forzar re-empaquetado de recursos en Gradle para que tome los nuevos mipmaps
console.log('⚡ Ejecutando gradlew assembleRelease para Icono Verticons...');
execSync('.\\gradlew.bat assembleRelease --no-daemon', {
  cwd: androidDir,
  env,
  stdio: 'inherit',
});

const unsignedVerticon = getUnsignedApk();
if (!unsignedVerticon) {
  console.error('❌ No se encontró app-release-unsigned.apk para Verticons.');
  process.exit(1);
}

const targetVerticonApk = path.join(releaseDir, `app-v${version}-verticon-release.apk`);
const targetVerticonNamed = path.join(releaseDir, `crono-cash-v${version}-verticon-release.apk`);

console.log('🔑 Firmando APK Verticons...');
const signCmdVerticon = `"${sdkBuildTools}" sign --ks "${keystore}" --ks-pass pass:android --key-pass pass:android --ks-key-alias androiddebugkey --out "${targetVerticonApk}" "${unsignedVerticon}"`;
execSync(signCmdVerticon, { env, stdio: 'inherit' });

fs.copyFileSync(targetVerticonApk, targetVerticonNamed);

const statsVerticon = fs.statSync(targetVerticonApk);
const sizeVerticonMb = (statsVerticon.size / (1024 * 1024)).toFixed(2);
console.log(`✅ APK Verticons generado: ${path.basename(targetVerticonApk)} (${sizeVerticonMb} MB)`);

// =========================================================================
// RESTAURAR ICONOS ESTÁNDAR PARA EL REPOSITORIO
// =========================================================================
execSync(`"${psExe}" -ExecutionPolicy Bypass -File .\\scripts\\generate-standard-icons.ps1`, {
  cwd: rootDir,
  env,
  stdio: 'inherit',
});

console.log('\n============================================================');
console.log('🎉 ¡AMBAS VERSIONES DE APK RELEASE GENERADAS Y FIRMADAS!');
console.log('============================================================');
console.log(`1. 📱 APK Versión Estándar:`);
console.log(`   - Archivo:       ${path.basename(targetStandardApk)}`);
console.log(`   - Tamaño:        ${sizeStandardMb} MB (${statsStandard.size} bytes)`);
console.log(`   - Ruta:          ${targetStandardApk}`);
console.log(`2. 💎 APK Versión Verticons (Card 2:3):`);
console.log(`   - Archivo:       ${path.basename(targetVerticonApk)}`);
console.log(`   - Tamaño:        ${sizeVerticonMb} MB (${statsVerticon.size} bytes)`);
console.log(`   - Ruta:          ${targetVerticonApk}`);
console.log('============================================================\n');
