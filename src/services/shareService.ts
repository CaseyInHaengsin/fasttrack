import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

class ShareService {
  private isNative = Capacitor.isNativePlatform();

  async shareText(title: string, text: string, url?: string): Promise<void> {
    if (this.isNative) {
      await Share.share({
        title,
        text,
        url,
        dialogTitle: 'Share FastTrack Data'
      });
    } else {
      // Fallback for web
      if (navigator.share) {
        await navigator.share({ title, text, url });
      } else {
        // Copy to clipboard as fallback
        await navigator.clipboard.writeText(text);
        alert('Data copied to clipboard!');
      }
    }
  }

  async shareFile(filename: string, data: string, mimeType: string = 'text/csv'): Promise<void> {
    if (this.isNative) {
      // Write file first
      await Filesystem.writeFile({
        path: filename,
        data,
        directory: Directory.Cache,
        encoding: Encoding.UTF8
      });

      // Get file URI
      const fileUri = await Filesystem.getUri({
        directory: Directory.Cache,
        path: filename
      });

      // Share file
      await Share.share({
        title: 'FastTrack Export',
        text: 'Your FastTrack data export',
        url: fileUri.uri,
        dialogTitle: 'Share FastTrack Data'
      });
    } else {
      // Fallback for web - download file
      const blob = new Blob([data], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }

  async canShare(): Promise<boolean> {
    if (this.isNative) {
      return true; // Capacitor Share plugin is always available
    } else {
      return 'share' in navigator || 'clipboard' in navigator;
    }
  }
}

export const shareService = new ShareService();