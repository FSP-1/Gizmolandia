import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api.config';
import { PuntuacionRequest, PuntuacionResponse } from './api.models';

@Injectable({ providedIn: 'root' })
export class PuntuacionApiService {
  private readonly baseUrl = `${API_BASE_URL}/puntuaciones`;

  constructor(private readonly http: HttpClient) {}

  guardarPuntuacion(payload: PuntuacionRequest): Observable<PuntuacionResponse> {
    return this.http.post<PuntuacionResponse>(this.baseUrl, payload);
  }

  listarPorUsuario(usuarioId: number): Observable<PuntuacionResponse[]> {
    return this.http.get<PuntuacionResponse[]>(`${this.baseUrl}/usuario/${usuarioId}`);
  }

  rankingPorJuego(juego: 'TETRIS' | 'SNAKE' | 'BRICK_BREAKER' | 'PING_PONG'): Observable<PuntuacionResponse[]> {
    return this.http.get<PuntuacionResponse[]>(`${this.baseUrl}/ranking/${juego}`);
  }
}
