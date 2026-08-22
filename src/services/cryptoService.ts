/**
 * Web Crypto API AES-GCM 256-bit encryption module for local cooperative data persistence.
 * Provides client-side zero-knowledge security for member financial records and offline stores.
 */

const DEFAULT_SALT = new Uint8Array([75, 111, 111, 112, 83, 101, 99, 117, 114, 101, 50, 48, 50, 53, 33, 36]); // "KoopSecure2025!$"
const DEFAULT_PASSPHRASE = 'COOPERATIVE_OFFLINE_SECURE_VAULT_KEY_2025';

class CryptoService {
  private activeKey: CryptoKey | null = null;
  private currentPassphrase: string = DEFAULT_PASSPHRASE;

  /**
   * Derive a 256-bit AES-GCM CryptoKey using PBKDF2
   */
  private async deriveKey(passphrase: string, salt: Uint8Array = DEFAULT_SALT): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(passphrase),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Initialize or switch encryption passphrase
   */
  public async setPassphrase(passphrase: string): Promise<boolean> {
    try {
      this.currentPassphrase = passphrase || DEFAULT_PASSPHRASE;
      this.activeKey = await this.deriveKey(this.currentPassphrase);
      return true;
    } catch (e) {
      console.error('Failed to set passphrase:', e);
      return false;
    }
  }

  /**
   * Ensure encryption key is loaded
   */
  private async getKey(): Promise<CryptoKey> {
    if (!this.activeKey) {
      this.activeKey = await this.deriveKey(this.currentPassphrase);
    }
    return this.activeKey;
  }

  /**
   * Encrypt arbitrary JSON serializable payload to AES-GCM ciphertext (Base64)
   */
  public async encryptData<T>(data: T): Promise<{ cipherText: string; iv: string; checksum: string }> {
    try {
      const key = await this.getKey();
      const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV recommended for AES-GCM
      const encodedData = new TextEncoder().encode(JSON.stringify(data));

      const encryptedBuffer = await window.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        key,
        encodedData
      );

      const cipherText = this.arrayBufferToBase64(encryptedBuffer);
      const ivBase64 = this.arrayBufferToBase64(iv.buffer);
      const checksum = await this.generateSha256(JSON.stringify(data));

      return {
        cipherText,
        iv: ivBase64,
        checksum,
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt local cooperative data.');
    }
  }

  /**
   * Decrypt AES-GCM Base64 ciphertext back to JSON data
   */
  public async decryptData<T>(cipherText: string, ivBase64: string): Promise<T> {
    try {
      const key = await this.getKey();
      const encryptedBuffer = this.base64ToArrayBuffer(cipherText);
      const iv = new Uint8Array(this.base64ToArrayBuffer(ivBase64));

      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        key,
        encryptedBuffer
      );

      const decodedString = new TextDecoder().decode(decryptedBuffer);
      return JSON.parse(decodedString) as T;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data. Invalid key or corrupted ciphertext.');
    }
  }

  /**
   * Quick SHA-256 hash generator for data integrity checks
   */
  public async generateSha256(text: string): Promise<string> {
    const data = new TextEncoder().encode(text);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

export const cryptoService = new CryptoService();
