import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { GameLeaderboardComponent } from '../game-leaderboard/game-leaderboard';
import { PuntuacionApiService } from '../../../services/puntuacion-api.service';
import {
  PingPongKickedEvent,
  PingPongLobbyEvent,
  PingPongQueueEvent,
  PingPongQueueFullEvent,
  PingPongRealtimeEvent,
  PingPongRealtimeService,
  PingPongRealtimeState
} from '../../../services/ping-pong-realtime.service';

interface LocalMatchState {
  leftPaddleY: number;
  rightPaddleY: number;
  ballX: number;
  ballY: number;
  ballVX: number;
  ballVY: number;
  scoreLeft: number;
  scoreRight: number;
  status: 'WAITING' | 'PREVIEW' | 'PLAYING' | 'FINISHED';
  winner: '' | 'LEFT' | 'RIGHT';
}

@Component({
  selector: 'app-ping-pong',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, GameLeaderboardComponent],
  templateUrl: './ping-pong.html',
  styleUrls: ['./ping-pong.css']
})
export class PingPongComponent implements OnInit, OnDestroy {
  @ViewChild('gameCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @Input() userPhoto = '';

  mode: 'bot' | 'online' | null = null;
  botDifficulty: 'easy' | 'medium' | 'hard' = 'medium';
  username = 'Jugador';

  targetScore = 7;
  statusText = '';
  queuePosition: number | null = null;
  usedRooms = 0;
  totalRooms = 10;
  queueSize = 0;
  maxQueue = 20;

  private readonly paddleHalf = 0.12;
  private readonly ballRadius = 0.015;
  private readonly leftPaddleX = 0.03;
  private readonly rightPaddleX = 0.97;

  private ctx!: CanvasRenderingContext2D;
  private animationId: number | null = null;
  private lastFrameTime = 0;
  private moveDirection = 0;
  private desiredPaddleY = 0.5;

  private realtimeSub?: Subscription;
  private realtimeState: PingPongRealtimeState | null = null;
  private scorePersisted = false;

  // Match preview state
  showPreview = false;
  previewOpponentUsername = '';
  previewOpponentPhoto = '';
  previewTimeout = 0;
  private previewTimeoutId: number | null = null;
  private previewIntervalId: number | null = null;
  private previewAcceptedByMe = false;

  private localState: LocalMatchState = {
    leftPaddleY: 0.5,
    rightPaddleY: 0.5,
    ballX: 0.5,
    ballY: 0.5,
    ballVX: 0,
    ballVY: 0,
    scoreLeft: 0,
    scoreRight: 0,
    status: 'WAITING',
    winner: ''
  };

  constructor(
    private cdr: ChangeDetectorRef,
    private puntuacionApiService: PuntuacionApiService,
    private realtimeService: PingPongRealtimeService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.ctx = this.canvasRef.nativeElement.getContext('2d')!;
    const savedName = sessionStorage.getItem('tetrisUsername') || localStorage.getItem('tetrisUsername');
    this.username = (savedName && savedName.trim()) || 'Jugador';
    this.desiredPaddleY = 0.5;

    this.startRenderLoop();
  }

  ngOnDestroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    this.realtimeSub?.unsubscribe();
    this.realtimeService.disconnect();
    this.clearPreviewTimers();
  }

  selectMode(mode: 'bot' | 'online'): void {
    this.mode = mode;
    this.statusText = '';
    this.queuePosition = null;

    if (mode === 'bot') {
      this.disconnectOnline();
      this.localState.status = 'WAITING';
      this.localState.scoreLeft = 0;
      this.localState.scoreRight = 0;
      this.localState.winner = '';
      this.localState.ballX = 0.5;
      this.localState.ballY = 0.5;
      return;
    }

    this.localState.status = 'WAITING';
    this.localState.scoreLeft = 0;
    this.localState.scoreRight = 0;
    this.localState.winner = '';
    this.localState.ballX = 0.5;
    this.localState.ballY = 0.5;
  }

  startBotMatch(): void {
    this.scorePersisted = false;
    this.localState.leftPaddleY = 0.5;
    this.localState.rightPaddleY = 0.5;
    this.localState.scoreLeft = 0;
    this.localState.scoreRight = 0;
    this.localState.winner = '';
    this.localState.status = 'PLAYING';
    this.statusText = '';

    this.resetBall(Math.random() > 0.5 ? 1 : -1);
  }

  connectOnline(): void {
    this.realtimeSub?.unsubscribe();
    this.scorePersisted = false;
    this.queuePosition = null;
    this.statusText = 'Conectando matchmaking...';

    this.realtimeSub = this.realtimeService.connect(this.username).subscribe((event) => {
      this.handleRealtimeEvent(event);
      this.cdr.markForCheck();
    });
  }

  get previewOpponentPhotoSrc(): string {
    const photo = (this.previewOpponentPhoto || '').trim();
    if (!photo) {
      return '/assets/default-avatar.png';
    }
    const lower = photo.toLowerCase();
    if (lower.startsWith('data:image/') || lower.startsWith('http://') || lower.startsWith('https://')) {
      return photo;
    }
    // Prevent invalid URL fetches like "GET data:image/jpeg;base...".
    return '/assets/default-avatar.png';
  }

  disconnectOnline(): void {
    this.realtimeSub?.unsubscribe();
    this.realtimeSub = undefined;
    this.realtimeState = null;
    this.realtimeService.disconnect();
  }

  acceptRematch(): void {
    if (this.mode !== 'online') {
      return;
    }
    this.realtimeService.sendRematchDecision(true);
    this.statusText = this.t('GAMES.PING_PONG.STATUS.WAITING_REMATCH_RESPONSE');
  }

  declineRematch(): void {
    if (this.mode !== 'online') {
      return;
    }

    // Close modal instantly on local UI to avoid stale FINISHED modal
    // while the server processes the decline and closes/reassigns the socket.
    if (this.realtimeState) {
      this.realtimeState = {
        ...this.realtimeState,
        status: 'WAITING',
        leftRematch: null,
        rightRematch: null
      };
    }

    this.realtimeService.sendRematchDecision(false);
    this.statusText = this.t('GAMES.PING_PONG.STATUS.SEARCHING_NEW_OPPONENT');
  }

  onMouseMove(event: MouseEvent): void {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const y = (event.clientY - rect.top) / rect.height;
    this.desiredPaddleY = this.clamp(y, this.paddleHalf, 1 - this.paddleHalf);

    if (this.mode === 'online' && this.realtimeState) {
      this.realtimeService.sendPaddle(this.desiredPaddleY);
      return;
    }

    // Bot mode: move the player's (left) paddle directly.
    if (this.mode === 'bot') {
      this.localState.leftPaddleY = this.desiredPaddleY;
    }
  }

  get scoreLeft(): number {
    if (this.mode === 'online' && this.realtimeState) {
      return this.realtimeState.scoreLeft;
    }
    return this.localState.scoreLeft;
  }

  get scoreRight(): number {
    if (this.mode === 'online' && this.realtimeState) {
      return this.realtimeState.scoreRight;
    }
    return this.localState.scoreRight;
  }

  get onlineSide(): string {
    return this.realtimeState?.yourSide || '-';
  }

  get canShowRematch(): boolean {
    return this.mode === 'online' && this.realtimeState?.status === 'FINISHED';
  }

  get rematchWon(): boolean {
    return this.realtimeState?.winner === this.realtimeState?.yourSide;
  }

  private toPhotoSrc(photo: string | undefined | null): string {
    const value = (photo || '').trim();
    if (!value) {
      return '/assets/default-avatar.png';
    }
    const lower = value.toLowerCase();
    if (lower.startsWith('data:image/') || lower.startsWith('http://') || lower.startsWith('https://')) {
      return value;
    }
    return '/assets/default-avatar.png';
  }

  get rematchLeftPhotoSrc(): string {
    return this.toPhotoSrc(this.realtimeState?.leftPlayerPhoto);
  }

  get rematchRightPhotoSrc(): string {
    return this.toPhotoSrc(this.realtimeState?.rightPlayerPhoto);
  }

  get rematchLeftName(): string {
    return this.realtimeState?.leftPlayer || '';
  }

  get rematchRightName(): string {
    return this.realtimeState?.rightPlayer || '';
  }

  private decisionLabel(accepted: boolean | null | undefined): string {
    if (accepted === null || accepted === undefined) {
      return this.t('GAMES.PING_PONG.DECISIONS.PENDING');
    }
    return accepted
      ? this.t('GAMES.PING_PONG.DECISIONS.ACCEPTED')
      : this.t('GAMES.PING_PONG.DECISIONS.REJECTED');
  }

  get rematchLeftDecisionLabel(): string {
    return this.decisionLabel(this.realtimeState?.leftRematch);
  }

  get rematchRightDecisionLabel(): string {
    return this.decisionLabel(this.realtimeState?.rightRematch);
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
    }

    if (event.key === 'ArrowUp') {
      this.moveDirection = -1;
    }
    if (event.key === 'ArrowDown') {
      this.moveDirection = 1;
    }
  }

  @HostListener('window:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent): void {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      this.moveDirection = 0;
    }
  }

  private handleRealtimeEvent(event: PingPongRealtimeEvent): void {
    if (event.type === 'state') {
      this.handleStateEvent(event);
      return;
    }

    if (event.type === 'queue') {
      this.handleQueueEvent(event);
      return;
    }

    if (event.type === 'lobby') {
      this.handleLobbyEvent(event);
      return;
    }

    if (event.type === 'queue_full') {
      this.handleQueueFullEvent(event);
      return;
    }

    if (event.type === 'kicked') {
      this.handleKickedEvent(event);
      return;
    }

    if (event.type === 'match_preview') {
      this.handleMatchPreviewEvent(event);
    }
  }

  private handleStateEvent(state: PingPongRealtimeState): void {
    this.realtimeState = state;
    this.targetScore = state.targetScore;
    this.usedRooms = state.usedRooms;
    this.totalRooms = state.totalRooms;
    this.queueSize = state.queueSize;
    this.maxQueue = state.maxQueue;
    this.queuePosition = null;

    this.desiredPaddleY = state.yourSide === 'LEFT' ? state.leftPaddleY : state.rightPaddleY;

    switch (state.status) {
      case 'PREVIEW':
        this.statusText = this.previewAcceptedByMe
          ? this.t('GAMES.PING_PONG.STATUS.WAITING_OPPONENT_ACCEPT')
          : this.t('GAMES.PING_PONG.STATUS.MATCH_FOUND_CONFIRM');
        return;

      case 'WAITING':
        this.enterWaitingState(state.roomId);
        return;

      case 'PLAYING':
        this.enterPlayingState(state.roomId);
        return;

      case 'FINISHED':
        this.enterFinishedState(state);
        return;
    }
  }

  private enterWaitingState(roomId: string): void {
    this.previewAcceptedByMe = false;
    this.hidePreview();
    this.statusText = this.t('GAMES.PING_PONG.STATUS.WAITING_IN_ROOM', { roomId });
    this.scorePersisted = false;
  }

  private enterPlayingState(roomId: string): void {
    this.previewAcceptedByMe = false;
    this.hidePreview();
    this.statusText = this.t('GAMES.PING_PONG.STATUS.PLAYING_IN_ROOM', { roomId });
    this.scorePersisted = false;
  }

  private enterFinishedState(state: PingPongRealtimeState): void {
    this.previewAcceptedByMe = false;
    if (state.winner === state.yourSide) {
      this.statusText = this.t('GAMES.PING_PONG.STATUS.WON_REMATCH');
      this.persistOnlineWinIfNeeded();
    } else {
      this.statusText = this.t('GAMES.PING_PONG.STATUS.LOST_REMATCH');
    }
  }

  private handleQueueEvent(event: PingPongQueueEvent): void {
    this.queuePosition = event.position;
    this.queueSize = event.queueSize;
    this.maxQueue = event.maxQueue;
    this.statusText = `Salas llenas. En cola: ${event.position}/${event.maxQueue}`;
  }

  private handleLobbyEvent(event: PingPongLobbyEvent): void {
    this.usedRooms = event.usedRooms;
    this.totalRooms = event.totalRooms;
    this.queueSize = event.queueSize;
    this.maxQueue = event.maxQueue;
  }

  private handleQueueFullEvent(event: PingPongQueueFullEvent): void {
    this.maxQueue = event.maxQueue;
    this.statusText = this.t('GAMES.PING_PONG.STATUS.QUEUE_FULL');
  }

  private handleKickedEvent(_event: PingPongKickedEvent): void {
    this.statusText = this.t('GAMES.PING_PONG.STATUS.KICKED_SEARCHING');
  }

  private startRenderLoop(): void {
    const loop = (time: number): void => {
      if (!this.lastFrameTime) {
        this.lastFrameTime = time;
      }

      let dt = (time - this.lastFrameTime) / 1000;
      this.lastFrameTime = time;
      if (dt > 0.05) {
        dt = 0.05;
      }

      if (this.mode === 'bot') {
        this.updateLocalBotMatch(dt);
      }

      if (this.mode === 'online') {
        this.updateOnlineControl(dt);
      }

      this.draw();
      this.animationId = requestAnimationFrame(loop);
    };

    this.animationId = requestAnimationFrame(loop);
  }

  private updateLocalBotMatch(dt: number): void {
    if (this.localState.status !== 'PLAYING') {
      return;
    }

    const playerSpeed = 0.95;
    this.localState.leftPaddleY = this.clamp(
      this.localState.leftPaddleY + this.moveDirection * playerSpeed * dt,
      this.paddleHalf,
      1 - this.paddleHalf
    );

    const botProfile = this.botConfig();
    const randomNoise = (Math.random() - 0.5) * botProfile.noise;
    const botTarget = this.clamp(this.localState.ballY + randomNoise, this.paddleHalf, 1 - this.paddleHalf);

    if (botTarget > this.localState.rightPaddleY) {
      this.localState.rightPaddleY = Math.min(this.localState.rightPaddleY + botProfile.speed * dt, botTarget);
    } else {
      this.localState.rightPaddleY = Math.max(this.localState.rightPaddleY - botProfile.speed * dt, botTarget);
    }

    this.localState.ballX += this.localState.ballVX * dt;
    this.localState.ballY += this.localState.ballVY * dt;

    if (this.localState.ballY - this.ballRadius <= 0) {
      this.localState.ballY = this.ballRadius;
      this.localState.ballVY = Math.abs(this.localState.ballVY);
    }

    if (this.localState.ballY + this.ballRadius >= 1) {
      this.localState.ballY = 1 - this.ballRadius;
      this.localState.ballVY = -Math.abs(this.localState.ballVY);
    }

    const leftCollision =
      this.localState.ballVX < 0 &&
      this.localState.ballX - this.ballRadius <= this.leftPaddleX &&
      Math.abs(this.localState.ballY - this.localState.leftPaddleY) <= this.paddleHalf;

    const rightCollision =
      this.localState.ballVX > 0 &&
      this.localState.ballX + this.ballRadius >= this.rightPaddleX &&
      Math.abs(this.localState.ballY - this.localState.rightPaddleY) <= this.paddleHalf;

    if (leftCollision) {
      const impact = (this.localState.ballY - this.localState.leftPaddleY) / this.paddleHalf;
      this.localState.ballX = this.leftPaddleX + this.ballRadius;
      this.localState.ballVX = Math.abs(this.localState.ballVX) * 1.04;
      this.localState.ballVY += impact * 0.22;
    }

    if (rightCollision) {
      const impact = (this.localState.ballY - this.localState.rightPaddleY) / this.paddleHalf;
      this.localState.ballX = this.rightPaddleX - this.ballRadius;
      this.localState.ballVX = -Math.abs(this.localState.ballVX) * 1.04;
      this.localState.ballVY += impact * 0.22;
    }

    if (this.localState.ballX < -0.03) {
      this.localState.scoreRight += 1;
      this.handleLocalPointEnd(-1);
    }

    if (this.localState.ballX > 1.03) {
      this.localState.scoreLeft += 1;
      this.handleLocalPointEnd(1);
    }
  }

  private updateOnlineControl(dt: number): void {
    if (!this.realtimeState || this.realtimeState.status !== 'PLAYING') {
      return;
    }

    if (this.moveDirection === 0) {
      return;
    }

    const speed = 0.95;
    this.desiredPaddleY = this.clamp(this.desiredPaddleY + this.moveDirection * speed * dt, this.paddleHalf, 1 - this.paddleHalf);
    this.realtimeService.sendPaddle(this.desiredPaddleY);
  }

  private handleLocalPointEnd(direction: 1 | -1): void {
    if (this.localState.scoreLeft >= this.targetScore) {
      this.localState.status = 'FINISHED';
      this.localState.winner = 'LEFT';
      this.statusText = this.t('GAMES.PING_PONG.STATUS.WON_BOT');
      return;
    }

    if (this.localState.scoreRight >= this.targetScore) {
      this.localState.status = 'FINISHED';
      this.localState.winner = 'RIGHT';
      this.statusText = 'El bot ganó';
      return;
    }

    this.resetBall(direction);
  }

  private resetBall(direction: 1 | -1): void {
    this.localState.ballX = 0.5;
    this.localState.ballY = 0.5;
    this.localState.ballVX = 0.42 * direction;
    this.localState.ballVY = (Math.random() - 0.5) * 0.3;
  }

  private botConfig(): { speed: number; noise: number } {
    if (this.botDifficulty === 'easy') {
      return { speed: 0.55, noise: 0.32 };
    }
    if (this.botDifficulty === 'hard') {
      return { speed: 1.05, noise: 0.08 };
    }
    return { speed: 0.8, noise: 0.18 };
  }

  private persistOnlineWinIfNeeded(): void {
    if (this.scorePersisted) {
      return;
    }

    const usuarioIdRaw = sessionStorage.getItem('usuarioId') || localStorage.getItem('usuarioId');
    if (!usuarioIdRaw) {
      return;
    }

    const usuarioId = Number(usuarioIdRaw);
    if (!Number.isFinite(usuarioId) || usuarioId <= 0) {
      return;
    }

    this.scorePersisted = true;
    this.puntuacionApiService.guardarPuntuacion({
      usuarioId,
      juego: 'PING_PONG',
      puntuacion: 1
    }).subscribe({
      error: () => {
        this.scorePersisted = false;
      }
    });
  }

  private draw(): void {
    const canvas = this.canvasRef.nativeElement;
    const ctx = this.ctx;

    const width = canvas.width;
    const height = canvas.height;

    const state = this.currentRenderState();

    ctx.clearRect(0, 0, width, height);

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#020617');
    gradient.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(226, 232, 240, 0.25)';
    ctx.setLineDash([10, 12]);
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();
    ctx.setLineDash([]);

    const paddleHeight = this.paddleHalf * 2 * height;
    const paddleWidth = 14;

    ctx.fillStyle = '#60a5fa';
    ctx.fillRect(this.leftPaddleX * width, state.leftPaddleY * height - paddleHeight / 2, paddleWidth, paddleHeight);

    ctx.fillStyle = '#f472b6';
    ctx.fillRect(this.rightPaddleX * width - paddleWidth, state.rightPaddleY * height - paddleHeight / 2, paddleWidth, paddleHeight);

    ctx.beginPath();
    ctx.fillStyle = '#f8fafc';
    ctx.arc(state.ballX * width, state.ballY * height, this.ballRadius * width, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f8fafc';
    ctx.font = '700 40px Arial';
    ctx.fillText(String(state.scoreLeft), width * 0.38, 56);
    ctx.fillText(String(state.scoreRight), width * 0.58, 56);

    if (state.status !== 'PLAYING') {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f8fafc';
      ctx.font = '700 30px Arial';
      const text = state.status === 'WAITING'
        ? this.t('GAMES.PING_PONG.CANVAS.WAITING_PLAYER')
        : this.t('GAMES.PING_PONG.CANVAS.MATCH_FINISHED');
      const textWidth = ctx.measureText(text).width;
      ctx.fillText(text, (width - textWidth) / 2, height / 2);
    }
  }

  private currentRenderState(): LocalMatchState {
    if (this.mode === 'online' && this.realtimeState) {
      return {
        leftPaddleY: this.realtimeState.leftPaddleY,
        rightPaddleY: this.realtimeState.rightPaddleY,
        ballX: this.realtimeState.ballX,
        ballY: this.realtimeState.ballY,
        ballVX: 0,
        ballVY: 0,
        scoreLeft: this.realtimeState.scoreLeft,
        scoreRight: this.realtimeState.scoreRight,
        status: this.realtimeState.status,
        winner: this.realtimeState.winner
      };
    }

    return this.localState;
  }

  private handleMatchPreviewEvent(event: any): void {
    this.showPreview = true;
    this.previewAcceptedByMe = false;
    this.previewOpponentUsername = event.opponentUsername;
    this.previewOpponentPhoto = event.opponentPhoto;
    this.previewTimeout = event.timeoutSeconds;
    this.statusText = this.t('GAMES.PING_PONG.STATUS.OPPONENT_FOUND', {
      opponent: event.opponentUsername
    });

    this.clearPreviewTimers();

    this.previewIntervalId = window.setInterval(() => {
      this.previewTimeout = Math.max(0, this.previewTimeout - 1);
      this.cdr.markForCheck();
    }, 1000);

    // Auto-reject if time runs out
    this.previewTimeoutId = setTimeout(() => {
      if (this.showPreview) {
        this.declinePreview();
      }
    }, event.timeoutSeconds * 1000);
  }

  acceptPreview(): void {
    if (!this.showPreview) {
      return;
    }

    this.previewAcceptedByMe = true;
    this.hidePreview();

    this.realtimeService.sendPreviewDecision(true);
    this.statusText = this.t('GAMES.PING_PONG.STATUS.ACCEPTED_LOADING');
  }

  declinePreview(): void {
    if (!this.showPreview) {
      return;
    }

    this.previewAcceptedByMe = false;
    this.hidePreview();

    this.realtimeService.sendPreviewDecision(false);
    this.statusText = this.t('GAMES.PING_PONG.STATUS.REJECTED_SEARCHING');
  }

  private hidePreview(): void {
    this.showPreview = false;
    this.clearPreviewTimers();
  }

  private clearPreviewTimers(): void {
    if (this.previewTimeoutId) {
      clearTimeout(this.previewTimeoutId);
      this.previewTimeoutId = null;
    }

    if (this.previewIntervalId) {
      clearInterval(this.previewIntervalId);
      this.previewIntervalId = null;
    }
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  private t(key: string, params?: Record<string, unknown>): string {
    return this.translate.instant(key, params);
  }
}
