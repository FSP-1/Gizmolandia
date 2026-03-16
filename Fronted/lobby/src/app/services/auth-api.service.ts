import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api.config';
import { LoginRequest, LoginResponse } from './api.models';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly baseUrl = `${API_BASE_URL}/auth`;

  constructor(private readonly http: HttpClient) {}

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, payload);
  }
}
