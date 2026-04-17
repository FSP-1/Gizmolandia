import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  ChatMessageRequest,
  ChatMessageResponse,
  ChatRoomType,
  ChatScoreOption,
  UsuarioResponse
} from '../../../services/api.models';
import { ChatApiService } from '../../../services/chat-api.service';
import { SessionStateService } from '../../../services/session-state.service';
import { ChatRoomTabsComponent } from '../widgets/chat-room-tabs/chat-room-tabs';
import { ChatMessageListComponent } from '../widgets/chat-message-list/chat-message-list';
import {
  ChatComposeBoxComponent,
  ChatComposePayload
} from '../widgets/chat-compose-box/chat-compose-box';
import { Router } from '@angular/router';

@Component({
  selector: 'app-general-chat',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    ChatRoomTabsComponent,
    ChatMessageListComponent,
    ChatComposeBoxComponent
  ],
  templateUrl: './general-chat.html',
  styleUrls: ['./general-chat.css']
})
export class GeneralChatComponent implements OnInit, OnDestroy {
  @Input() userId: number | null = null;
  @Output() backToHome = new EventEmitter<void>();

  activeRoom: ChatRoomType = 'NORMAL';
  messages: ChatMessageResponse[] = [];
  scoreOptions: ChatScoreOption[] = [];

  activeUsers = 0;
  maxUsers = 10;
  loading = false;
  sending = false;
  errorMessage = '';

  private sessionUser: UsuarioResponse | null = null;
  private messageRefreshTimerId: number | null = null;
  private latestMessageId: number | null = null;

  constructor(
    private readonly chatApiService: ChatApiService,
    private readonly sessionStateService: SessionStateService,
    private readonly translate: TranslateService,
    private readonly cdr: ChangeDetectorRef,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.sessionUser = this.sessionStateService.getUser();
    if (!this.userId && this.sessionUser?.id) {
      this.userId = this.sessionUser.id;
    }

    if (!this.userId) {
      this.errorMessage = this.translate.instant('CHAT.ERRORS.NO_SESSION');
      this.cdr.markForCheck();
      return;
    }

    this.enterRoom(this.activeRoom);
  }

  ngOnDestroy(): void {
    this.stopMessageRefresh();
    this.leaveActiveRoom();
  }

  onRoomSelected(room: ChatRoomType): void {
    if (room === this.activeRoom) {
      return;
    }

    this.stopMessageRefresh();
    this.leaveActiveRoom();
    this.activeRoom = room;
    this.messages = [];
    this.latestMessageId = null;
    this.errorMessage = '';
    this.enterRoom(room);
    this.cdr.markForCheck();
  }

  onBack(): void {
    if (this.backToHome.observed) {
      this.backToHome.emit();
      return;
    }

    this.router.navigate(['/home']);
  }

  onSend(payload: ChatComposePayload): void {
    if (!this.userId) {
      return;
    }

    this.sending = true;
    this.errorMessage = '';

    const request: ChatMessageRequest = {
      usuarioId: this.userId,
      roomType: this.activeRoom,
      commentText: payload.commentText,
      mediaUrl: payload.mediaUrl,
      puntuacionId: payload.puntuacionId
    };

    this.chatApiService.sendMessage(request).subscribe({
      next: (sentMessage) => {
        this.sending = false;
        this.upsertMessages([sentMessage]);
      },
      error: (error) => {
        this.sending = false;
        this.errorMessage = error?.error?.mensaje || error?.error?.errores?.commentText || this.translate.instant('CHAT.ERRORS.SEND_FAILED');
        this.cdr.markForCheck();
      }
    });
  }

  private enterRoom(room: ChatRoomType): void {
    if (!this.userId) {
      return;
    }

    this.loading = true;

    this.chatApiService.joinRoom(room, this.userId).subscribe({
      next: (joinData) => {
        this.activeUsers = joinData.activeUsers;
        this.maxUsers = joinData.maxUsers;
        this.fetchMessages();
        this.startMessageRefresh();

        if (room === 'JUEGOS') {
          this.chatApiService.listScoreOptions(this.userId!).subscribe({
            next: (scores) => {
              this.scoreOptions = scores;
              this.loading = false;
              this.cdr.markForCheck();
            },
            error: () => {
              this.scoreOptions = [];
              this.loading = false;
              this.cdr.markForCheck();
            }
          });
        } else {
          this.scoreOptions = [];
          this.loading = false;
          this.cdr.markForCheck();
        }
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.loading = false;
        this.messages = [];
        this.errorMessage = error?.error?.mensaje || this.translate.instant('CHAT.ERRORS.JOIN_FAILED');
        this.cdr.markForCheck();
      }
    });
  }

  private fetchMessages(): void {
    this.chatApiService.listMessages(this.activeRoom, 60).subscribe({
      next: (messages) => {
        this.messages = messages;
        this.latestMessageId = messages.length > 0 ? messages[messages.length - 1].id : null;
        this.cdr.markForCheck();
      }
    });
  }

  private fetchNewMessages(): void {
    if (!this.latestMessageId) {
      return;
    }

    this.chatApiService.listMessages(this.activeRoom, 60, this.latestMessageId).subscribe({
      next: (messages) => {
        this.upsertMessages(messages);
      }
    });
  }

  private startMessageRefresh(): void {
    this.stopMessageRefresh();
    this.messageRefreshTimerId = window.setInterval(() => {
      this.fetchNewMessages();
    }, 2500);
  }

  private upsertMessages(incoming: ChatMessageResponse[]): void {
    if (!incoming.length) {
      return;
    }

    const lastId = this.latestMessageId ?? 0;
    const newMessages = incoming.filter((message) => message.id > lastId);
    if (!newMessages.length) {
      return;
    }

    this.messages = [...this.messages, ...newMessages].slice(-120);
    this.latestMessageId = this.messages[this.messages.length - 1].id;
    this.cdr.markForCheck();
  }

  private stopMessageRefresh(): void {
    if (this.messageRefreshTimerId !== null) {
      window.clearInterval(this.messageRefreshTimerId);
      this.messageRefreshTimerId = null;
    }
  }

  private leaveActiveRoom(): void {
    if (!this.userId) {
      return;
    }

    this.chatApiService.leaveRoom(this.activeRoom, this.userId).subscribe({
      next: () => {
        // no-op
      },
      error: () => {
        // no-op
      }
    });
  }
}
