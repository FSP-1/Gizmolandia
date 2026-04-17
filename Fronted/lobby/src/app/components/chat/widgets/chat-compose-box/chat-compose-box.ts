import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ChatRoomType, ChatScoreOption } from '../../../../services/api.models';

export interface ChatComposePayload {
  commentText: string;
  mediaUrl: string | null;
  puntuacionId: number | null;
}

@Component({
  selector: 'app-chat-compose-box',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './chat-compose-box.html',
  styleUrls: ['./chat-compose-box.css']
})
export class ChatComposeBoxComponent {
  private readonly maxMediaBytes = 4500000;

  @Input() activeRoom: ChatRoomType = 'NORMAL';
  @Input() scoreOptions: ChatScoreOption[] = [];
  @Input() sending = false;
  @Output() submitMessage = new EventEmitter<ChatComposePayload>();

  commentText = '';
  selectedScoreId: number | null = null;
  mediaUrl: string | null = null;
  error = '';

  constructor(
    private readonly translate: TranslateService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  get wordCount(): number {
    const trimmed = this.commentText.trim();
    if (!trimmed) {
      return 0;
    }
    return trimmed.split(/\s+/).length;
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) {
      return;
    }

    const mime = file.type.toLowerCase();
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
    if (!allowed.includes(mime)) {
      this.error = this.translate.instant('CHAT.ERRORS.ONLY_IMAGE_OR_GIF');
      target.value = '';
      return;
    }

    if (file.size > this.maxMediaBytes) {
      this.error = this.translate.instant('CHAT.ERRORS.MEDIA_TOO_LARGE');
      target.value = '';
      this.mediaUrl = null;
      this.cdr.detectChanges();
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.mediaUrl = typeof reader.result === 'string' ? reader.result : null;
      this.error = '';
      this.cdr.detectChanges();
    };
    reader.onerror = () => {
      this.error = this.translate.instant('CHAT.ERRORS.MEDIA_READ_FAILED');
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  clearMedia(): void {
    this.mediaUrl = null;
  }

  send(): void {
    this.error = '';

    if (this.wordCount === 0) {
      this.error = this.translate.instant('CHAT.ERRORS.WRITE_COMMENT');
      return;
    }

    if (this.wordCount > 500) {
      this.error = this.translate.instant('CHAT.ERRORS.MAX_WORDS');
      return;
    }

    if (this.activeRoom === 'JUEGOS' && !this.selectedScoreId) {
      this.error = this.translate.instant('CHAT.ERRORS.SCORE_REQUIRED');
      return;
    }

    this.submitMessage.emit({
      commentText: this.commentText.trim(),
      mediaUrl: this.mediaUrl,
      puntuacionId: this.activeRoom === 'JUEGOS' ? this.selectedScoreId : null
    });

    this.commentText = '';
    this.mediaUrl = null;
    this.selectedScoreId = null;
    this.cdr.detectChanges();
  }
}
