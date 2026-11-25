import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createHash } from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface SyncRecord {
  data: { format: 'smart-wallet-encrypted'; version: number; [key: string]: unknown };
  updatedAt: string;
  deviceName?: string;
  version: number;
}

const syncStore = new Map<string, SyncRecord>();
const BACKUP_FILE = path.join(__dirname, '.sync_data.json');

function hashSyncKey(key: string): string {
  return createHash('sha256').update(key.trim(), 'utf8').digest('hex');
}

try {
  if (fs.existsSync(BACKUP_FILE)) {
    fs.chmodSync(BACKUP_FILE, 0o600);
    const parsed = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf-8'));
    const legacyPlaintext: Record<string, unknown> = {};
    Object.entries(parsed).forEach(([storedKey, value]) => {
      const legacy = value as any;
      if (legacy?.data?.format !== 'smart-wallet-encrypted') {
        // Keep a restricted local migration copy; never expose or re-serve plaintext records.
        legacyPlaintext[storedKey] = legacy;
        return;
      }
      const keyHash = /^[a-f0-9]{64}$/i.test(storedKey) ? storedKey : hashSyncKey(String(legacy.syncKey || storedKey));
      const { syncKey: _discardedSecret, ...record } = legacy;
      syncStore.set(keyHash, record as SyncRecord);
    });
    if (Object.keys(legacyPlaintext).length > 0) {
      const legacyPath = BACKUP_FILE + '.legacy.json';
      if (!fs.existsSync(legacyPath)) {
        fs.writeFileSync(legacyPath, JSON.stringify(legacyPlaintext), { encoding: 'utf-8', mode: 0o600 });
      }
    }
  }
} catch (error) {
  console.warn('Could not read existing sync store file:', error);
}

function persistStore(): void {
  try {
    const obj: Record<string, SyncRecord> = {};
    syncStore.forEach((value, key) => { obj[key] = value; });
    const tempFile = BACKUP_FILE + '.tmp';
    fs.writeFileSync(tempFile, JSON.stringify(obj), { encoding: 'utf-8', mode: 0o600 });
    fs.renameSync(tempFile, BACKUP_FILE);
  } catch (error) {
    console.error('Could not persist encrypted sync records:', error);
    throw error;
  }
}

function readSyncKey(req: Request, res: Response): string | null {
  const key = req.body?.syncKey;
  if (typeof key !== 'string' || !/^SW-[A-F0-9]{64}$/.test(key.trim())) {
    res.status(400).json({ error: 'رمز المزامنة غير صالح. استخدم الرمز الآمن الذي يبدأ بـ SW-.' });
    return null;
  }
  return key.trim();
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  app.use(express.json({ limit: '25mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString() });
  });

  app.post('/api/sync/pull', (req: Request, res: Response) => {
    const key = readSyncKey(req, res);
    if (!key) return;
    const record = syncStore.get(hashSyncKey(key));
    if (!record) return res.status(404).json({ error: 'No cloud record found for this sync key' });
    return res.json({
      success: true,
      data: record.data,
      updatedAt: record.updatedAt,
      version: record.version,
      deviceName: record.deviceName || 'مجهول',
    });
  });

  app.post('/api/sync/status', (req: Request, res: Response) => {
    const key = readSyncKey(req, res);
    if (!key) return;
    const record = syncStore.get(hashSyncKey(key));
    if (!record) return res.json({ exists: false });
    return res.json({ exists: true, updatedAt: record.updatedAt, version: record.version, deviceName: record.deviceName || 'جهاز آخر' });
  });

  app.post('/api/sync/push', (req: Request, res: Response) => {
    const key = readSyncKey(req, res);
    if (!key) return;
    const { data, deviceName } = req.body || {};
    if (!data || data.format !== 'smart-wallet-encrypted' || data.version !== 1 ||
        typeof data.salt !== 'string' || typeof data.iv !== 'string' || typeof data.ciphertext !== 'string' || !data.ciphertext.length) {
      return res.status(400).json({ error: 'يرفض الخادم البيانات غير المشفرة. حدّث التطبيق وأنشئ نسخة مشفرة.' });
    }

    const storageKey = hashSyncKey(key);
    const existing = syncStore.get(storageKey);
    const now = new Date().toISOString();
    const record: SyncRecord = {
      data,
      updatedAt: now,
      deviceName: typeof deviceName === 'string' ? deviceName.slice(0, 80) : 'متصفح الويب',
      version: (existing?.version || 0) + 1,
    };

    syncStore.set(storageKey, record);
    try {
      persistStore();
    } catch {
      if (existing) syncStore.set(storageKey, existing);
      else syncStore.delete(storageKey);
      return res.status(500).json({ error: 'تعذر حفظ النسخة المشفرة على الخادم' });
    }

    return res.json({ success: true, updatedAt: now, version: record.version });
  });

  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Smart Wallet server listening on port ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
