import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

class StorageService {
  private isNative = Capacitor.isNativePlatform();

  // Store simple key-value data
  async setItem(key: string, value: string): Promise<void> {
    if (this.isNative) {
      await Preferences.set({ key, value });
    } else {
      localStorage.setItem(key, value);
    }
  }

  async getItem(key: string): Promise<string | null> {
    if (this.isNative) {
      const result = await Preferences.get({ key });
      return result.value;
    } else {
      return localStorage.getItem(key);
    }
  }

  async removeItem(key: string): Promise<void> {
    if (this.isNative) {
      await Preferences.remove({ key });
    } else {
      localStorage.removeItem(key);
    }
  }

  async clear(): Promise<void> {
    if (this.isNative) {
      await Preferences.clear();
    } else {
      localStorage.clear();
    }
  }

  // Store complex data as JSON
  async setObject(key: string, value: any): Promise<void> {
    await this.setItem(key, JSON.stringify(value));
  }

  async getObject<T>(key: string): Promise<T | null> {
    const value = await this.getItem(key);
    if (!value) return null;
    
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  // File operations for larger data
  async writeFile(filename: string, data: string): Promise<void> {
    if (this.isNative) {
      await Filesystem.writeFile({
        path: filename,
        data,
        directory: Directory.Data,
        encoding: Encoding.UTF8
      });
    } else {
      // Fallback to localStorage for web
      await this.setItem(`file_${filename}`, data);
    }
  }

  async readFile(filename: string): Promise<string | null> {
    if (this.isNative) {
      try {
        const result = await Filesystem.readFile({
          path: filename,
          directory: Directory.Data,
          encoding: Encoding.UTF8
        });
        return result.data as string;
      } catch {
        return null;
      }
    } else {
      // Fallback to localStorage for web
      return await this.getItem(`file_${filename}`);
    }
  }

  async deleteFile(filename: string): Promise<void> {
    if (this.isNative) {
      try {
        await Filesystem.deleteFile({
          path: filename,
          directory: Directory.Data
        });
      } catch {
        // File doesn't exist, ignore
      }
    } else {
      // Fallback to localStorage for web
      await this.removeItem(`file_${filename}`);
    }
  }

  async fileExists(filename: string): Promise<boolean> {
    if (this.isNative) {
      try {
        await Filesystem.stat({
          path: filename,
          directory: Directory.Data
        });
        return true;
      } catch {
        return false;
      }
    } else {
      // Fallback to localStorage for web
      const value = await this.getItem(`file_${filename}`);
      return value !== null;
    }
  }
}

export const storageService = new StorageService();