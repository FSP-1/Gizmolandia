import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class GamePhotoCacheService {
  private readonly cache = new Map<string, Promise<string>>();

  loadSrc(photo: string | null | undefined): Promise<string> {
    const value = (photo || '').trim();
    if (!value) {
      return Promise.resolve('/assets/default-avatar.png');
    }

    const cached = this.cache.get(value);
    if (cached) {
      return cached;
    }

    const promise = this.resolveToSrc(value);

    this.cache.set(value, promise);
    return promise;
  }

  private async resolveToSrc(value: string): Promise<string> {
    const lower = value.toLowerCase();

    if (lower.startsWith('data:') || lower.startsWith('blob:')) {
      return value;
    }

    if (lower.startsWith('http://') || lower.startsWith('https://')) {
      try {
        const response = await fetch(value, { cache: 'force-cache' });
        if (!response.ok) {
          return value;
        }

        const blob = await response.blob();
        return URL.createObjectURL(blob);
      } catch {
        return value;
      }
    }

    return '/assets/default-avatar.png';
  }

  clear(photo?: string | null): void {
    if (photo) {
      this.cache.delete(photo.trim());
      return;
    }

    this.cache.clear();
  }
}