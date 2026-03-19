import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { API_BASE_URL } from './api.config';

export interface PingPongRealtimeState {
  type: 'state';
  roomId: string;
  status: 'WAITING' | 'PLAYING' | 'FINISHED';
  winner: '' | 'LEFT' | 'RIGHT';
  targetScore: number;
  playersConnected: number;
  leftPlayer: string;
  rightPlayer: string;
  yourSide: 'LEFT' | 'RIGHT';
  scoreLeft: number;
  scoreRight: number;
  leftPaddleY: number;
  rightPaddleY: number;
  ballX: number;
  ballY: number;
}

@Injectable({ providedIn: 'root' })
export class PingPongRealtimeService {
  private socket: WebSocket | null = null;
  private stateSubject = new Subject<PingPongRealtimeState>();

  connect(roomId: string, playerName: string): Observable<PingPongRealtimeState> {
    this.disconnect();

    const wsUrl = this.buildWsUrl(roomId, playerName);
    this.socket = new WebSocket(wsUrl);

    this.socket.onmessage = (event: MessageEvent<string>) => {
      try {
        const parsed = JSON.parse(event.data) as PingPongRealtimeState;
        if (parsed.type === 'state') {
          this.stateSubject.next(parsed);
        }
      } catch {
        // Ignore malformed messages to keep the game alive.
      }
    };

    this.socket.onclose = () => {
      this.socket = null;
    };

    return this.stateSubject.asObservable();
  }

  sendPaddle(y: number): void {
    this.send({
      type: 'paddle',
      y
    });
  }

  sendRestart(): void {
    this.send({ type: 'restart' });
  }

  disconnect(): void {
    if (!this.socket) {
      return;
    }

    try {
      this.socket.close();
    } finally {
      this.socket = null;
    }
  }

  private send(payload: Record<string, unknown>): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    this.socket.send(JSON.stringify(payload));
  }

  private buildWsUrl(roomId: string, playerName: string): string {
    const apiUrl = new URL(API_BASE_URL);
    const protocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:';

    const room = encodeURIComponent((roomId || 'public').trim() || 'public');
    const player = encodeURIComponent((playerName || 'Jugador').trim() || 'Jugador');

    return `${protocol}//${apiUrl.host}/ws/ping-pong?room=${room}&player=${player}`;
  }
}
