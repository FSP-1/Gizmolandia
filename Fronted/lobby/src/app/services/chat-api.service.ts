import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api.config';
import {
  ChatJoinResponse,
  ChatMediaUploadResponse,
  ChatMessageRequest,
  ChatMessageResponse,
  ChatRoomType,
  ChatScoreOption
} from './api.models';

@Injectable({ providedIn: 'root' })
export class ChatApiService {
  private readonly baseUrl = `${API_BASE_URL}/chat`;

  constructor(private readonly http: HttpClient) {}

  joinRoom(roomType: ChatRoomType, usuarioId: number): Observable<ChatJoinResponse> {
    return this.http.post<ChatJoinResponse>(`${this.baseUrl}/${roomType}/join?usuarioId=${usuarioId}`, {});
  }

  leaveRoom(roomType: ChatRoomType, usuarioId: number): Observable<ChatJoinResponse> {
    return this.http.post<ChatJoinResponse>(`${this.baseUrl}/${roomType}/leave?usuarioId=${usuarioId}`, {});
  }

  listMessages(roomType: ChatRoomType, limit = 60, afterId?: number): Observable<ChatMessageResponse[]> {
    let url = `${this.baseUrl}/${roomType}/mensajes?limit=${limit}`;
    if (typeof afterId === 'number' && afterId > 0) {
      url += `&afterId=${afterId}`;
    }
    return this.http.get<ChatMessageResponse[]>(url);
  }

  uploadMedia(file: File): Observable<ChatMediaUploadResponse> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post<ChatMediaUploadResponse>(`${this.baseUrl}/media/upload`, formData);
  }

  sendMessage(payload: ChatMessageRequest): Observable<ChatMessageResponse> {
    return this.http.post<ChatMessageResponse>(`${this.baseUrl}/mensajes`, payload);
  }

  listScoreOptions(usuarioId: number): Observable<ChatScoreOption[]> {
    return this.http.get<ChatScoreOption[]>(`${this.baseUrl}/juegos/puntuaciones/${usuarioId}`);
  }
}
