import { AppState } from '../types';
import { Capacitor } from '@capacitor/core';

function apiUrl(path: string, serverUrl?: string): string {
  const configured = (serverUrl || import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\\/+$/, '');
  if (!configured) {
    if (Capacitor.isNativePlatform()) throw new Error('Android يحتاج رابط خادم المزامنة HTTPS. أدخل عنوان الخادم في نافذة المزامنة.');
    return path;
  }
  let parsed: URL;
  try { parsed = new URL(configured); } catch { throw new Error('رابط خادم المزامنة غير صالح'); }
  if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(parsed.hostname))) {
    throw new Error('يجب أن يستخدم خادم المزامنة HTTPS');
  }
  return configured + path;
}

export interface CloudSyncResult {
  success: boolean;
  message?: string;
  updatedAt?: string;
  version?: number;
  data?: AppState;
  deviceName?: string;
}

interface EncryptedEnvelope {
  format: 'smart-wallet-encrypted';
  version: 1;
  kdf: 'PBKDF2-SHA-256';
  iterations: number;
  salt: string;
  iv: string;
  ciphertext: string;
}

const KDF_ITERATIONS = 310000;

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function deriveKey(syncKey: string, salt: Uint8Array, iterations: number): Promise<CryptoKey> {
  if (!globalThis.crypto?.subtle) throw new Error('Web Crypto غير متاح؛ يلزم اتصال آمن HTTPS');
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(syncKey), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptState(syncKey: string, data: AppState): Promise<EncryptedEnvelope> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(syncKey, salt, KDF_ITERATIONS);
  const plaintext = new TextEncoder().encode(JSON.stringify(data));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);
  return {
    format: 'smart-wallet-encrypted',
    version: 1,
    kdf: 'PBKDF2-SHA-256',
    iterations: KDF_ITERATIONS,
    salt: toBase64(salt),
    iv: toBase64(iv),
    ciphertext: toBase64(new Uint8Array(encrypted)),
  };
}

async function decryptState(syncKey: string, envelope: EncryptedEnvelope): Promise<AppState> {
  if (envelope.format !== 'smart-wallet-encrypted' || envelope.version !== 1 ||
      envelope.kdf !== 'PBKDF2-SHA-256' || !Number.isInteger(envelope.iterations) ||
      envelope.iterations < 100000 || envelope.iterations > 1000000) {
    throw new Error('صيغة النسخة المشفرة غير مدعومة');
  }
  const key = await deriveKey(syncKey, fromBase64(envelope.salt), envelope.iterations);
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(envelope.iv) as BufferSource },
    key,
    fromBase64(envelope.ciphertext) as BufferSource
  );
  const parsed = JSON.parse(new TextDecoder().decode(plaintext));
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('بيانات المزامنة غير صالحة');
  return parsed as AppState;
}

export class CloudSyncService {
  async pushToCloud(syncKey: string, data: AppState, deviceName?: string, serverUrl?: string): Promise<CloudSyncResult> {
    try {
      const key = syncKey.trim();
      if (!/^SW-[A-F0-9]{64}$/.test(key)) return { success: false, message: 'رمز المزامنة غير صالح أو قديم. أنشئ رمزاً جديداً قبل المزامنة.' };
      const encryptedData = await encryptState(key, data);
      const response = await fetch(apiUrl('/api/sync/push', serverUrl), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syncKey: key, data: encryptedData, deviceName: deviceName || this.getDeviceName() }),
      });
      const json = await response.json();
      if (!response.ok) return { success: false, message: json.error || 'فشل في رفع البيانات إلى السحابة' };
      return { success: true, updatedAt: json.updatedAt, version: json.version };
    } catch (err: any) {
      return { success: false, message: err.name === 'OperationError' ? 'تعذر فك/تشفير البيانات. تحقق من رمز المزامنة.' : (err.message || 'تعذر الاتصال بخادم المزامنة') };
    }
  }

  async pullFromCloud(syncKey: string, serverUrl?: string): Promise<CloudSyncResult> {
    try {
      const key = syncKey.trim();
      if (!/^SW-[A-F0-9]{64}$/.test(key)) return { success: false, message: 'رمز المزامنة غير صالح أو قديم. أنشئ رمزاً جديداً قبل المزامنة.' };
      const response = await fetch(apiUrl('/api/sync/pull', serverUrl), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syncKey: key }),
      });
      const json = await response.json();
      if (!response.ok) return { success: false, message: json.error || 'لم يتم العثور على نسخة سحابية بهذا الرمز' };
      if (!json.data || json.data.format !== 'smart-wallet-encrypted') {
        return { success: false, message: 'هذه نسخة سحابية قديمة غير مشفرة. صدّرها يدوياً ثم أنشئ رمزاً جديداً وارفع نسخة مشفرة.' };
      }
      const data = await decryptState(key, json.data);
      return { success: true, data, updatedAt: json.updatedAt, version: json.version, deviceName: json.deviceName };
    } catch (err: any) {
      return { success: false, message: err.name === 'OperationError' || err.name === 'SyntaxError' ? 'فشل التحقق من النسخة. رمز المزامنة غير صحيح أو البيانات تالفة.' : (err.message || 'تعذر الاتصال بخادم المزامنة') };
    }
  }

  async checkCloudStatus(syncKey: string, serverUrl?: string): Promise<{ exists: boolean; updatedAt?: string; version?: number; deviceName?: string }> {
    try {
      const response = await fetch(apiUrl('/api/sync/status', serverUrl), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syncKey: syncKey.trim() }),
      });
      if (!response.ok) return { exists: false };
      return await response.json();
    } catch {
      return { exists: false };
    }
  }

  private getDeviceName(): string {
    if (typeof navigator === 'undefined') return 'جهاز ويب';
    const ua = navigator.userAgent;
    if (/Android/i.test(ua)) return 'هاتف Android';
    if (/iPhone|iPad/i.test(ua)) return 'جهاز Apple iOS';
    if (/Macintosh/i.test(ua)) return 'كمبيوتر Mac';
    if (/Windows/i.test(ua)) return 'كمبيوتر Windows';
    if (/Linux/i.test(ua)) return 'كمبيوتر Linux';
    return 'متصفح ويب';
  }
}

export const cloudSyncService = new CloudSyncService();
