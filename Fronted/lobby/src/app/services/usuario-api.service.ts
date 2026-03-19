import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api.config';
import { UsuarioPersonalizacionRequest, UsuarioRequest, UsuarioResponse } from './api.models';

@Injectable({ providedIn: 'root' })
export class UsuarioApiService {
  private readonly baseUrl = `${API_BASE_URL}/usuarios`;

  constructor(private readonly http: HttpClient) {}

  crearUsuario(payload: UsuarioRequest): Observable<UsuarioResponse> {
    return this.http.post<UsuarioResponse>(this.baseUrl, payload);
  }

  listarUsuarios(): Observable<UsuarioResponse[]> {
    return this.http.get<UsuarioResponse[]>(this.baseUrl);
  }

  buscarPorId(id: number): Observable<UsuarioResponse> {
    return this.http.get<UsuarioResponse>(`${this.baseUrl}/${id}`);
  }

  buscarPorPerfil(userProfile: string): Observable<UsuarioResponse> {
    return this.http.get<UsuarioResponse>(`${this.baseUrl}/perfil/${encodeURIComponent(userProfile)}`);
  }

  guardarPersonalizacion(usuarioId: number, payload: UsuarioPersonalizacionRequest): Observable<UsuarioResponse> {
    return this.http.patch<UsuarioResponse>(`${this.baseUrl}/${usuarioId}/personalizacion`, payload);
  }
}
