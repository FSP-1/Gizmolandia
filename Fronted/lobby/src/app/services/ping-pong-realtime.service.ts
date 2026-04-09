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
  leftPlayerPhoto: string;
  rightPlayerPhoto: string;
  yourSide: 'LEFT' | 'RIGHT';
  scoreLeft: number;
  scoreRight: number;
  leftPaddleY: number;
  rightPaddleY: number;
  ballX: number;
  ballY: number;
  leftRematch: boolean;
  rightRematch: boolean;
  usedRooms: number;
  totalRooms: number;
  queueSize: number;
  maxQueue: number;
}

export interface PingPongQueueEvent {
  type: 'queue';
  position: number;
  queueSize: number;
  maxQueue: number;
}

export interface PingPongLobbyEvent {
  type: 'lobby';
  usedRooms: number;
  totalRooms: number;
  queueSize: number;
  maxQueue: number;
}

export interface PingPongQueueFullEvent {
  type: 'queue_full';
  maxQueue: number;
}

export interface PingPongKickedEvent {
  type: 'kicked';
  reason: string;
}

export interface PingPongMatchPreviewEvent {
  type: 'match_preview';
  opponentUsername: string;
  opponentPhoto: string;
  timeoutSeconds: number;
}

export type PingPongRealtimeEvent =
  | PingPongRealtimeState
  | PingPongQueueEvent
  | PingPongLobbyEvent
  | PingPongQueueFullEvent
  | PingPongKickedEvent
  | PingPongMatchPreviewEvent;

@Injectable({ providedIn: 'root' })
export class PingPongRealtimeService {
  private socket: WebSocket | null = null;
  private eventSubject = new Subject<PingPongRealtimeEvent>();

  connect(playerName: string): Observable<PingPongRealtimeEvent> {
    this.disconnect();

    const wsUrl = this.buildWsUrl(playerName);
    this.socket = new WebSocket(wsUrl);

    this.socket.onmessage = (event: MessageEvent<string>) => {
      try {
        const parsed = JSON.parse(event.data) as PingPongRealtimeEvent;
        if (parsed && typeof parsed === 'object' && 'type' in parsed) {
          this.eventSubject.next(parsed);
        }
      } catch {
        // Ignore malformed messages to keep the game alive.
      }
    };

    this.socket.onclose = () => {
      this.socket = null;
    };

    return this.eventSubject.asObservable();
  }

  sendPaddle(y: number): void {
    this.send({
      type: 'paddle',
      y
    });
  }

  sendRematchDecision(accept: boolean): void {
    this.send({
      type: 'rematch',
      accept
    });
  }

  sendPreviewDecision(accept: boolean): void {
    this.send({
      type: 'preview_decision',
      accept
    });
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

  private buildWsUrl(playerName: string): string {
    const apiUrl = new URL(API_BASE_URL);
    const protocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:';
    const player = encodeURIComponent((playerName || 'Jugador').trim() || 'Jugador');

    return `${protocol}//${apiUrl.host}/ws/ping-pong?player=${player}`;
  }
}
