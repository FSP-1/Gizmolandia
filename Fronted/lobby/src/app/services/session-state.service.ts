import { Injectable } from '@angular/core';
import { UsuarioResponse } from './api.models';

const USER_STORAGE_KEY = 'gizmolandia.session.user';
const MAX_PERSISTED_FIELD_LENGTH = 120_000;

@Injectable({ providedIn: 'root' })
export class SessionStateService {
  saveUser(user: UsuarioResponse): void {
    const sanitized = this.sanitizeLargeFields(user);

    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(sanitized));
    } catch {
      // Keep a minimal session shape if storage is almost full.
      const fallback: UsuarioResponse = {
        ...sanitized,
        foto: '',
        homeLeftImage: '',
        homeRightImage: ''
      };
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(fallback));
    }
  }

  getUser(): UsuarioResponse | null {
    const rawValue = localStorage.getItem(USER_STORAGE_KEY);
    if (!rawValue) {
      return null;
    }

    try {
      return JSON.parse(rawValue) as UsuarioResponse;
    } catch {
      return null;
    }
  }

  hasUserSession(): boolean {
    return this.getUser() !== null;
  }

  clear(): void {
    localStorage.removeItem(USER_STORAGE_KEY);
  }

  private sanitizeLargeFields(user: UsuarioResponse): UsuarioResponse {
    return {
      ...user,
      foto: this.trimLargeField(user.foto),
      homeLeftImage: this.trimLargeField(user.homeLeftImage),
      homeRightImage: this.trimLargeField(user.homeRightImage)
    };
  }

  private trimLargeField(value: string | undefined): string {
    if (!value) {
      return '';
    }

    return value.length > MAX_PERSISTED_FIELD_LENGTH ? '' : value;
  }
}