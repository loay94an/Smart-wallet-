import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

/** Save exports through Android's native share sheet instead of unreliable WebView downloads. */
export async function saveExportBlob(blob: Blob, fileName: string, title = fileName): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error || new Error('Could not read export file'));
      reader.onload = () => resolve(String(reader.result));
      reader.readAsDataURL(blob);
    });
    const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
    const saved = await Filesystem.writeFile({
      path: fileName,
      data: base64,
      directory: Directory.Cache,
      encoding: Encoding.Base64,
      recursive: true,
    });
    await Share.share({
      title,
      text: fileName,
      files: [saved.uri],
      dialogTitle: 'حفظ أو مشاركة الملف',
    });
    return;
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}
