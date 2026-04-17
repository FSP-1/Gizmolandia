import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, interval } from 'rxjs';
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
  private refreshSub?: Subscription;

  constructor(
    private readonly chatApiService: ChatApiService,
    private readonly sessionStateService: SessionStateService,
    private readonly translate: TranslateService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.sessionUser = this.sessionStateService.getUser();
    if (!this.userId && this.sessionUser?.id) {
      this.userId = this.sessionUser.id;
    }

    if (!this.userId) {
      this.errorMessage = this.translate.instant('CHAT.ERRORS.NO_SESSION');
      this.cdr.detectChanges();
      return;
    }

    this.enterRoom(this.activeRoom);
    this.refreshSub = interval(4000).subscribe(() => this.fetchMessages());
  }

  ngOnDestroy(): void {
    this.refreshSub?.unsubscribe();
    this.leaveActiveRoom();
  }

  onRoomSelected(room: ChatRoomType): void {
    if (room === this.activeRoom) {
      return;
    }

    this.leaveActiveRoom();
    this.activeRoom = room;
    this.messages = [];
    this.errorMessage = '';
    this.enterRoom(room);
    this.cdr.detectChanges();
  }

  onBack(): void {
    this.backToHome.emit();
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
      next: () => {
        this.sending = false;
        this.fetchMessages();
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.sending = false;
        this.errorMessage = error?.error?.mensaje || error?.error?.errores?.commentText || this.translate.instant('CHAT.ERRORS.SEND_FAILED');
        this.cdr.detectChanges();
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

        if (room === 'JUEGOS') {
          this.chatApiService.listScoreOptions(this.userId!).subscribe({
            next: (scores) => {
              this.scoreOptions = scores;
              this.loading = false;
              this.cdr.detectChanges();
            },
            error: () => {
              this.scoreOptions = [];
              this.loading = false;
              this.cdr.detectChanges();
            }
          });
        } else {
          this.scoreOptions = [];
          this.loading = false;
          this.cdr.detectChanges();
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.messages = [];
        this.errorMessage = error?.error?.mensaje || this.translate.instant('CHAT.ERRORS.JOIN_FAILED');
        this.cdr.detectChanges();
      }
    });
  }

  private fetchMessages(): void {
    this.chatApiService.listMessages(this.activeRoom, 60).subscribe({
      next: (messages) => {
        this.messages = messages;
        this.cdr.detectChanges();
      }
    });
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
