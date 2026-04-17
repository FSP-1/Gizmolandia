import { AfterViewInit, Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ChatMessageResponse } from '../../../../services/api.models';

@Component({
  selector: 'app-chat-message-list',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './chat-message-list.html',
  styleUrls: ['./chat-message-list.css']
})
export class ChatMessageListComponent implements OnChanges, AfterViewInit {
  @ViewChild('messagesWrapper') messagesWrapper?: ElementRef<HTMLDivElement>;
  @Input() messages: ChatMessageResponse[] = [];
  @Input() currentUserId: number | null = null;

  private readonly bottomThresholdPx = 80;

  ngAfterViewInit(): void {
    this.scrollToBottom();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['messages']) {
      const shouldAutoScroll = this.isNearBottom();
      setTimeout(() => {
        if (shouldAutoScroll) {
          this.scrollToBottom();
        }
      });
    }
  }

  trackByMessageId(_: number, item: ChatMessageResponse): number {
    return item.id;
  }

  isOwnMessage(msg: ChatMessageResponse): boolean {
    return this.currentUserId !== null && msg.usuarioId === this.currentUserId;
  }

  private scrollToBottom(): void {
    const wrapper = this.messagesWrapper?.nativeElement;
    if (!wrapper) {
      return;
    }

    wrapper.scrollTop = wrapper.scrollHeight;
  }

  private isNearBottom(): boolean {
    const wrapper = this.messagesWrapper?.nativeElement;
    if (!wrapper) {
      return true;
    }

    const distanceToBottom = wrapper.scrollHeight - wrapper.scrollTop - wrapper.clientHeight;
    return distanceToBottom <= this.bottomThresholdPx;
  }

  formatDate(value: string): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit'
    }).format(date);
  }
}
