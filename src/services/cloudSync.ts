import { AppState } from '../types';

export interface CloudSyncResult {
  success: boolean;
  message?: string;
  updatedAt?: string;
  version?: number;
  data?: AppState;
  deviceName?: string;
}

export class CloudSyncService {
  // Push local state to cloud
  async pushToCloud(syncKey: string, data: AppState, deviceName?: string): Promise<CloudSyncResult> {
    try {
      const response = await fetch('/api/sync/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          syncKey: syncKey.trim(),
          data,
          deviceName: deviceName || this.getDeviceName(),
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        return {
          success: false,
          message: json.error || 'فشل في رفع البيانات إلى السحابة',
        };
      }

      return {
        success: true,
        updatedAt: json.updatedAt,
        version: json.version,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'تعذر الاتصال بخادم المزامنة السحابية',
      };
    }
  }

  // Pull state from cloud
  async pullFromCloud(syncKey: string): Promise<CloudSyncResult> {
    try {
      const response = await fetch(`/api/sync/pull/${encodeURIComponent(syncKey.trim())}`);
      const json = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: json.error || 'لم يتم العثور على نسخة سحابية بهذا الرمز',
        };
      }

      return {
        success: true,
        data: json.data,
        updatedAt: json.updatedAt,
        version: json.version,
        deviceName: json.deviceName,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'تعذر الاتصال بخادم المزامنة السحابية',
      };
    }
  }

  // Check status
  async checkCloudStatus(syncKey: string): Promise<{ exists: boolean; updatedAt?: string; version?: number; deviceName?: string }> {
    try {
      const response = await fetch(`/api/sync/status/${encodeURIComponent(syncKey.trim())}`);
      if (!response.ok) return { exists: false };
      return await response.json();
    } catch (e) {
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
