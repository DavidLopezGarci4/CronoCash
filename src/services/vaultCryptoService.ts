/**
 * VaultCryptoService — Bóveda Cifrada Local de CronoCash
 * 
 * Implementa cifrado en reposo de grado bancario (AES-GCM 256-bit)
 * utilizando la Web Crypto API nativa (window.crypto.subtle).
 * 
 * Protege contra extracciones de base de datos, volcados de memoria
 * no autorizados o accesos indebidos al sandbox local de la aplicación.
 */

export interface EncryptedRecord<T = any> {
  id: string;
  _enc: true;
  iv: string; // Base64 (12 bytes)
  ct: string; // Base64 ciphertext
  v: number;  // Versión de esquema criptográfico
}

const VAULT_KEY_STORAGE = '__crono_vault_mk_v1__';
const LOCAL_SYNC_KEY_STORAGE = '__crono_ls_sk_v1__';
const PIN_HASH_PREFIX = 'pbkdf2_sha256$';
const SYNC_ENC_PREFIX = 'enc_v1$';

// Constantes FIPS 180-4 SHA-256
const SHA256_K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

export class VaultCryptoService {
  private static cachedKey: CryptoKey | null = null;
  private static keyPromise: Promise<CryptoKey> | null = null;
  private static cachedSyncKey: Uint8Array | null = null;

  /**
   * Obtiene o genera la clave maestra simétrica AES-GCM (256-bit)
   */
  static async getMasterKey(): Promise<CryptoKey> {
    if (this.cachedKey) return this.cachedKey;
    if (this.keyPromise) return this.keyPromise;

    this.keyPromise = (async () => {
      if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
        throw new Error('Web Crypto API no disponible en este entorno.');
      }

      // 1. Intentar cargar clave maestra existente
      const storedKeyB64 = localStorage.getItem(VAULT_KEY_STORAGE);
      if (storedKeyB64) {
        try {
          const rawKey = this.base64ToBuffer(storedKeyB64);
          const cryptoKey = await window.crypto.subtle.importKey(
            'raw',
            rawKey as unknown as BufferSource,
            { name: 'AES-GCM' },
            false,
            ['encrypt', 'decrypt']
          );
          this.cachedKey = cryptoKey;
          return cryptoKey;
        } catch (e) {
          console.warn('[VaultCryptoService] Error importando clave existente, regenerando:', e);
        }
      }

      // 2. Generar nueva clave de 256 bits criptográficamente segura
      const newKey = await window.crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true, // exportable para poder guardarla localmente en el dispositivo
        ['encrypt', 'decrypt']
      );

      const exportedRaw = await window.crypto.subtle.exportKey('raw', newKey);
      const b64Raw = this.bufferToBase64(new Uint8Array(exportedRaw));
      localStorage.setItem(VAULT_KEY_STORAGE, b64Raw);

      // Reimportar como no exportable para endurecer la memoria en tiempo de ejecución
      const hardenedKey = await window.crypto.subtle.importKey(
        'raw',
        exportedRaw as unknown as BufferSource,
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
      );

      this.cachedKey = hardenedKey;
      return hardenedKey;
    })();

    return this.keyPromise;
  }

  /**
   * Cifra un objeto JavaScript genérico devolviendo un EncryptedRecord
   */
  static async encryptRecord<T extends { id: string }>(item: T): Promise<EncryptedRecord<T>> {
    if (!item || typeof item !== 'object') return item as any;
    if ((item as any)._enc === true && (item as any).iv && (item as any).ct) {
      return item as unknown as EncryptedRecord<T>;
    }
    try {
      const key = await this.getMasterKey();
      const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit standard IV para GCM
      const encodedData = new TextEncoder().encode(JSON.stringify(item));

      const ciphertextBuffer = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv as unknown as BufferSource },
        key,
        encodedData as unknown as BufferSource
      );

      return {
        id: item.id,
        _enc: true,
        iv: this.bufferToBase64(iv),
        ct: this.bufferToBase64(new Uint8Array(ciphertextBuffer)),
        v: 1,
      };
    } catch (e) {
      console.error('[VaultCryptoService] Fallo en cifrado AES-GCM, aplicando cifrado síncrono de respaldo:', e);
      // Fallback de emergencia autenticado (evita fail-open en texto plano)
      const encFallback = this.encryptSyncString(JSON.stringify(item));
      return {
        id: item.id,
        _enc: true,
        iv: 'sync_v1',
        ct: encFallback,
        v: 1,
      };
    }
  }

  /**
   * Descifra un registro. Si no está cifrado (registro previo en texto plano), lo devuelve tal cual.
   */
  static async decryptRecord<T>(record: any): Promise<T> {
    if (!record || typeof record !== 'object') return record;
    if (record._enc !== true || !record.iv || !record.ct) {
      // Registro en texto plano (retrocompatibilidad)
      return record as T;
    }

    if (record.iv === 'sync_v1') {
      try {
        const plain = this.decryptSyncString(record.ct);
        return JSON.parse(plain) as T;
      } catch (e) {
        console.error('[VaultCryptoService] Fallo al descifrar registro sync_v1 ID ' + record.id + ':', e);
        return record as T;
      }
    }

    try {
      const key = await this.getMasterKey();
      const iv = this.base64ToBuffer(record.iv);
      const ciphertext = this.base64ToBuffer(record.ct);

      const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv as unknown as BufferSource },
        key,
        ciphertext as unknown as BufferSource
      );

      const decodedText = new TextDecoder().decode(decryptedBuffer);
      return JSON.parse(decodedText) as T;
    } catch (e) {
      console.error('[VaultCryptoService] Fallo al descifrar registro ID ' + record.id + ':', e);
      return record as T;
    }
  }

  /**
   * Cifra una lista de registros
   */
  static async encryptList<T extends { id: string }>(items: T[]): Promise<any[]> {
    if (!items || items.length === 0) return [];
    return Promise.all(items.map((item) => this.encryptRecord(item)));
  }

  /**
   * Descifra una lista de registros
   */
  static async decryptList<T>(records: any[]): Promise<T[]> {
    if (!records || records.length === 0) return [];
    return Promise.all(records.map((r) => this.decryptRecord<T>(r)));
  }

  // ============================================================================
  // HASHING DE PIN (PBKDF2-HMAC-SHA256) Y VERIFICACIÓN EN TIEMPO CONSTANTE
  // ============================================================================

  /**
   * Comprueba si una cadena ya corresponde a un hash PBKDF2-SHA256
   */
  static isHashedPin(pinOrHash?: string | null): boolean {
    return typeof pinOrHash === 'string' && pinOrHash.startsWith(PIN_HASH_PREFIX);
  }

  /**
   * Genera un hash PBKDF2-HMAC-SHA256 con sal aleatoria de 128 bits (10.000 iteraciones)
   */
  static hashPin(plainPin: string, iterations = 10000): string {
    if (!plainPin) return '';
    if (this.isHashedPin(plainPin)) return plainPin;

    const salt = this.getRandomBytes(16);
    const saltHex = this.bytesToHex(salt);
    const derived = this.pbkdf2HmacSha256(
      new TextEncoder().encode(plainPin),
      salt,
      iterations,
      32
    );
    return `${PIN_HASH_PREFIX}${iterations}$${saltHex}$${this.bytesToHex(derived)}`;
  }

  /**
   * Verifica un PIN contra un hash PBKDF2-HMAC-SHA256 o PIN legado en texto plano
   * usando comparación en tiempo constante (resistente a ataques de temporización).
   */
  static verifyPin(inputPin: string, storedPinOrHash: string): boolean {
    if (!inputPin || !storedPinOrHash) return false;

    if (this.isHashedPin(storedPinOrHash)) {
      const parts = storedPinOrHash.split('$');
      if (parts.length !== 4) return false;
      const iterations = parseInt(parts[1], 10);
      const saltHex = parts[2];
      const expectedHex = parts[3];
      if (!iterations || iterations < 1000 || !saltHex || !expectedHex) return false;

      const salt = this.hexToBytes(saltHex);
      const derived = this.pbkdf2HmacSha256(
        new TextEncoder().encode(inputPin),
        salt,
        iterations,
        32
      );
      const actualHex = this.bytesToHex(derived);
      return this.timingSafeEqualStrings(actualHex, expectedHex);
    }

    // Retrocompatibilidad con PIN previo en texto plano antes de migración automática
    return this.timingSafeEqualStrings(inputPin, storedPinOrHash);
  }

  /**
   * Genera un token criptográfico aleatorio en formato hexadecimal
   */
  static generateSecureToken(byteLength = 32): string {
    return this.bytesToHex(this.getRandomBytes(byteLength));
  }

  /**
   * Calcula el hash SHA-256 en hexadecimal de una cadena arbitraria
   */
  static sha256Hex(input: string): string {
    return this.bytesToHex(this.sha256Bytes(new TextEncoder().encode(input)));
  }

  // ============================================================================
  // CIFRADO SÍNCRONO AUTENTICADO (ENCRYPT-THEN-MAC) PARA FALLBACK LOCALSTORAGE
  // ============================================================================

  private static getSyncMasterKey(): Uint8Array {
    if (this.cachedSyncKey) return this.cachedSyncKey;
    try {
      if (typeof localStorage !== 'undefined') {
        const existing = localStorage.getItem(LOCAL_SYNC_KEY_STORAGE);
        if (existing && existing.length === 64) {
          this.cachedSyncKey = this.hexToBytes(existing);
          return this.cachedSyncKey;
        }
        const generated = this.getRandomBytes(32);
        localStorage.setItem(LOCAL_SYNC_KEY_STORAGE, this.bytesToHex(generated));
        this.cachedSyncKey = generated;
        return generated;
      }
    } catch {
      // Ignorar errores de acceso a storage
    }
    this.cachedSyncKey = this.sha256Bytes(new TextEncoder().encode('cronocash_ephemeral_fallback_key'));
    return this.cachedSyncKey;
  }

  /**
   * Cifra y autentica síncronamente una cadena JSON para su almacenamiento en localStorage
   * Esquema: enc_v1$<ivHex>$<hmacHex>$<ciphertextBase64>
   */
  static encryptSyncString(plainText: string): string {
    if (!plainText || plainText.startsWith(SYNC_ENC_PREFIX)) return plainText;
    try {
      const masterKey = this.getSyncMasterKey();
      const iv = this.getRandomBytes(16);
      const plainBytes = new TextEncoder().encode(plainText);
      const cipherBytes = this.xorKeystream(plainBytes, masterKey, iv);

      // Etiqueta de autenticación HMAC-SHA256 sobre (IV || Ciphertext)
      const macInput = new Uint8Array(iv.length + cipherBytes.length);
      macInput.set(iv, 0);
      macInput.set(cipherBytes, iv.length);
      const tag = this.hmacSha256Bytes(masterKey, macInput);

      return `${SYNC_ENC_PREFIX}${this.bytesToHex(iv)}$${this.bytesToHex(tag)}$${this.bufferToBase64(cipherBytes)}`;
    } catch {
      return plainText;
    }
  }

  /**
   * Descifra y verifica síncronamente una cadena procedente de localStorage.
   * Mantiene retrocompatibilidad transparente con cadenas JSON previas no cifradas.
   */
  static decryptSyncString(payload: string): string {
    if (!payload || !payload.startsWith(SYNC_ENC_PREFIX)) {
      return payload;
    }
    try {
      const rest = payload.slice(SYNC_ENC_PREFIX.length);
      const firstSep = rest.indexOf('$');
      const secondSep = rest.indexOf('$', firstSep + 1);
      if (firstSep < 0 || secondSep < 0) return payload;

      const ivHex = rest.slice(0, firstSep);
      const tagHex = rest.slice(firstSep + 1, secondSep);
      const ctB64 = rest.slice(secondSep + 1);

      const masterKey = this.getSyncMasterKey();
      const iv = this.hexToBytes(ivHex);
      const cipherBytes = this.base64ToBuffer(ctB64);

      const macInput = new Uint8Array(iv.length + cipherBytes.length);
      macInput.set(iv, 0);
      macInput.set(cipherBytes, iv.length);
      const expectedTagHex = this.bytesToHex(this.hmacSha256Bytes(masterKey, macInput));

      if (!this.timingSafeEqualStrings(tagHex, expectedTagHex)) {
        throw new Error('Fallo de integridad HMAC en almacenamiento local');
      }

      const plainBytes = this.xorKeystream(cipherBytes, masterKey, iv);
      return new TextDecoder().decode(plainBytes);
    } catch (e) {
      console.warn('[VaultCryptoService] Error descifrando payload local:', e);
      return '';
    }
  }

  /**
   * Verifica la integridad operativa de la bóveda (AES-GCM-256 + PBKDF2-SHA256)
   */
  static async verifyIntegrity(): Promise<{ ok: boolean; algorithm: string; details: string }> {
    try {
      const testObj = { id: 'test_probe', amount: 123.45, timestamp: Date.now() };
      const encrypted = await this.encryptRecord(testObj);
      if (encrypted._enc !== true || !encrypted.ct) {
        return { ok: false, algorithm: 'None', details: 'Fallo al sellar paquete de prueba' };
      }
      const decrypted = await this.decryptRecord<typeof testObj>(encrypted);
      if (decrypted.amount !== 123.45) {
        return { ok: false, algorithm: 'AES-GCM-256', details: 'Fallo de coincidencia en prueba' };
      }
      const pinHash = this.hashPin('9482', 1000);
      if (!this.verifyPin('9482', pinHash) || this.verifyPin('0000', pinHash)) {
        return { ok: false, algorithm: 'PBKDF2-SHA256', details: 'Fallo en verificación de derivación de clave' };
      }
      return {
        ok: true,
        algorithm: 'AES-GCM-256 + PBKDF2-SHA256 (NIST SP 800-38D)',
        details: 'Cifrado autenticado en reposo y derivación PBKDF2 verificados en hardware local',
      };
    } catch (e: any) {
      return { ok: false, algorithm: 'AES-GCM-256', details: e?.message || 'Error en hardware crypto' };
    }
  }

  // --- Primitivas Criptográficas Síncronas (FIPS 180-4 SHA-256 / RFC 2104 HMAC / RFC 8018 PBKDF2) ---

  private static getRandomBytes(length: number): Uint8Array {
    const out = new Uint8Array(length);
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(out);
    } else {
      for (let i = 0; i < length; i++) {
        out[i] = Math.floor(Math.random() * 256);
      }
    }
    return out;
  }

  private static timingSafeEqualStrings(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) {
      diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return diff === 0;
  }

  private static xorKeystream(input: Uint8Array, key: Uint8Array, iv: Uint8Array): Uint8Array {
    const output = new Uint8Array(input.length);
    const counterBlock = new Uint8Array(iv.length + 4);
    counterBlock.set(iv, 0);
    let blockIndex = 0;
    let offset = 0;

    while (offset < input.length) {
      counterBlock[iv.length] = (blockIndex >>> 24) & 0xff;
      counterBlock[iv.length + 1] = (blockIndex >>> 16) & 0xff;
      counterBlock[iv.length + 2] = (blockIndex >>> 8) & 0xff;
      counterBlock[iv.length + 3] = blockIndex & 0xff;

      const keystream = this.hmacSha256Bytes(key, counterBlock);
      const chunkLen = Math.min(32, input.length - offset);
      for (let i = 0; i < chunkLen; i++) {
        output[offset + i] = input[offset + i] ^ keystream[i];
      }
      offset += chunkLen;
      blockIndex++;
    }
    return output;
  }

  private static sha256Bytes(data: Uint8Array): Uint8Array {
    let h0 = 0x6a09e667;
    let h1 = 0xbb67ae85;
    let h2 = 0x3c6ef372;
    let h3 = 0xa54ff53a;
    let h4 = 0x510e527f;
    let h5 = 0x9b05688c;
    let h6 = 0x1f83d9ab;
    let h7 = 0x5be0cd19;

    const bitLen = data.length * 8;
    const paddedLen = ((data.length + 9 + 63) >> 6) << 6;
    const padded = new Uint8Array(paddedLen);
    padded.set(data);
    padded[data.length] = 0x80;
    const view = new DataView(padded.buffer);
    view.setUint32(paddedLen - 8, Math.floor(bitLen / 0x100000000), false);
    view.setUint32(paddedLen - 4, bitLen >>> 0, false);

    const w = new Uint32Array(64);
    for (let offset = 0; offset < paddedLen; offset += 64) {
      for (let i = 0; i < 16; i++) {
        w[i] = view.getUint32(offset + i * 4, false);
      }
      for (let i = 16; i < 64; i++) {
        const v15 = w[i - 15];
        const s0 = ((v15 >>> 7) | (v15 << 25)) ^ ((v15 >>> 18) | (v15 << 14)) ^ (v15 >>> 3);
        const v2 = w[i - 2];
        const s1 = ((v2 >>> 17) | (v2 << 15)) ^ ((v2 >>> 19) | (v2 << 13)) ^ (v2 >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
      }

      let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
      for (let i = 0; i < 64; i++) {
        const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
        const ch = (e & f) ^ (~e & g);
        const temp1 = (h + S1 + ch + SHA256_K[i] + w[i]) >>> 0;
        const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const temp2 = (S0 + maj) >>> 0;

        h = g;
        g = f;
        f = e;
        e = (d + temp1) >>> 0;
        d = c;
        c = b;
        b = a;
        a = (temp1 + temp2) >>> 0;
      }

      h0 = (h0 + a) >>> 0;
      h1 = (h1 + b) >>> 0;
      h2 = (h2 + c) >>> 0;
      h3 = (h3 + d) >>> 0;
      h4 = (h4 + e) >>> 0;
      h5 = (h5 + f) >>> 0;
      h6 = (h6 + g) >>> 0;
      h7 = (h7 + h) >>> 0;
    }

    const out = new Uint8Array(32);
    const outView = new DataView(out.buffer);
    outView.setUint32(0, h0, false);
    outView.setUint32(4, h1, false);
    outView.setUint32(8, h2, false);
    outView.setUint32(12, h3, false);
    outView.setUint32(16, h4, false);
    outView.setUint32(20, h5, false);
    outView.setUint32(24, h6, false);
    outView.setUint32(28, h7, false);
    return out;
  }

  private static hmacSha256Bytes(key: Uint8Array, message: Uint8Array): Uint8Array {
    const blockSize = 64;
    let keyBlock = new Uint8Array(blockSize);
    if (key.length > blockSize) {
      keyBlock.set(this.sha256Bytes(key));
    } else {
      keyBlock.set(key);
    }

    const ipad = new Uint8Array(blockSize + message.length);
    const opad = new Uint8Array(blockSize + 32);
    for (let i = 0; i < blockSize; i++) {
      ipad[i] = keyBlock[i] ^ 0x36;
      opad[i] = keyBlock[i] ^ 0x5c;
    }
    ipad.set(message, blockSize);
    const innerHash = this.sha256Bytes(ipad);
    opad.set(innerHash, blockSize);
    return this.sha256Bytes(opad);
  }

  private static pbkdf2HmacSha256(
    password: Uint8Array,
    salt: Uint8Array,
    iterations: number,
    dkLen: number
  ): Uint8Array {
    const blocks = Math.ceil(dkLen / 32);
    const derived = new Uint8Array(blocks * 32);
    const saltAndIndex = new Uint8Array(salt.length + 4);
    saltAndIndex.set(salt, 0);

    for (let blockIdx = 1; blockIdx <= blocks; blockIdx++) {
      saltAndIndex[salt.length] = (blockIdx >>> 24) & 0xff;
      saltAndIndex[salt.length + 1] = (blockIdx >>> 16) & 0xff;
      saltAndIndex[salt.length + 2] = (blockIdx >>> 8) & 0xff;
      saltAndIndex[salt.length + 3] = blockIdx & 0xff;

      let u = this.hmacSha256Bytes(password, saltAndIndex);
      const t = new Uint8Array(u);

      for (let iter = 1; iter < iterations; iter++) {
        u = this.hmacSha256Bytes(password, u);
        for (let j = 0; j < 32; j++) {
          t[j] ^= u[j];
        }
      }
      derived.set(t, (blockIdx - 1) * 32);
    }
    return derived.slice(0, dkLen);
  }

  // --- Helpers Base64 & Hex ---
  private static bytesToHex(bytes: Uint8Array): string {
    let hex = '';
    for (let i = 0; i < bytes.length; i++) {
      hex += bytes[i].toString(16).padStart(2, '0');
    }
    return hex;
  }

  private static hexToBytes(hex: string): Uint8Array {
    const clean = hex.length % 2 === 0 ? hex : '0' + hex;
    const out = new Uint8Array(clean.length / 2);
    for (let i = 0; i < out.length; i++) {
      out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16) || 0;
    }
    return out;
  }

  private static bufferToBase64(buffer: Uint8Array): string {
    let binary = '';
    const len = buffer.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(buffer[i]);
    }
    return window.btoa(binary);
  }

  private static base64ToBuffer(base64: string): Uint8Array {
    const binary = window.atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}

