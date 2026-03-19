import { Injectable } from '@angular/core';
import { UsuarioResponse } from './api.models';

const USER_STORAGE_KEY = 'gizmolandia.session.user';

@Injectable({ providedIn: 'root' })
export class SessionStateService {
  saveUser(user: UsuarioResponse): void {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
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
}