import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface SyncRecord {
  syncKey: string;
  data: any;
  updatedAt: string;
  deviceName?: string;
  version: number;
}

// In-memory store backed by simple file persistence for dev resilience
const syncStore = new Map<string, SyncRecord>();
const BACKUP_FILE = path.join(__dirname, '.sync_data.json');

try {
  if (fs.existsSync(BACKUP_FILE)) {
    const raw = fs.readFileSync(BACKUP_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    Object.entries(parsed).forEach(([key, val]) => {
      syncStore.set(key, val as SyncRecord);
    });
  }
} catch (e) {
  console.warn('Could not read existing sync store file:', e);
}

function persistStore() {
  try {
    const obj: Record<string, SyncRecord> = {};
    syncStore.forEach((v, k) => {
      obj[k] = v;
    });
    fs.writeFileSync(BACKUP_FILE, JSON.stringify(obj, null, 2), 'utf-8');
  } catch (e) {
    // ignore in read-only environments
  }
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '25mb' }));

  // --- Cloud Sync API Endpoints ---
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString() });
  });

  // Pull cloud data for a given sync key
  app.get('/api/sync/pull/:syncKey', (req: Request, res: Response) => {
    const syncKey = req.params.syncKey?.trim();
    if (!syncKey) {
      return res.status(400).json({ error: 'Sync key is required' });
    }

    const record = syncStore.get(syncKey);
    if (!record) {
      return res.status(404).json({ error: 'No cloud record found for this sync key' });
    }

    return res.json({
      success: true,
      syncKey: record.syncKey,
      data: record.data,
      updatedAt: record.updatedAt,
      version: record.version,
      deviceName: record.deviceName || 'مجهول',
    });
  });

  // Check sync status without fetching large payload
  app.get('/api/sync/status/:syncKey', (req: Request, res: Response) => {
    const syncKey = req.params.syncKey?.trim();
    if (!syncKey) {
      return res.status(400).json({ error: 'Sync key is required' });
    }

    const record = syncStore.get(syncKey);
    if (!record) {
      return res.json({ exists: false });
    }

    return res.json({
      exists: true,
      updatedAt: record.updatedAt,
      version: record.version,
      deviceName: record.deviceName || 'جهاز آخر',
    });
  });

  // Push local data to the cloud
  app.post('/api/sync/push', (req: Request, res: Response) => {
    const { syncKey, data, deviceName } = req.body;
    if (!syncKey || typeof syncKey !== 'string' || !syncKey.trim()) {
      return res.status(400).json({ error: 'Valid sync key is required' });
    }
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: 'Data payload is required' });
    }

    const trimmedKey = syncKey.trim();
    const existing = syncStore.get(trimmedKey);
    const newVersion = (existing?.version || 0) + 1;
    const now = new Date().toISOString();

    const record: SyncRecord = {
      syncKey: trimmedKey,
      data,
      updatedAt: now,
      deviceName: deviceName || 'متصفح الويب',
      version: newVersion,
    };

    syncStore.set(trimmedKey, record);
    persistStore();

    return res.json({
      success: true,
      syncKey: trimmedKey,
      updatedAt: now,
      version: newVersion,
    });
  });

  // Vite middleware in dev or static files in production
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Financial Wallet Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
