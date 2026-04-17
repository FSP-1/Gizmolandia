import { Component, Input } from '@angular/core';
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
export class ChatMessageListComponent {
  @Input() messages: ChatMessageResponse[] = [];
  @Input() currentUserId: number | null = null;

  trackByMessageId(_: number, item: ChatMessageResponse): number {
    return item.id;
  }

  isOwnMessage(msg: ChatMessageResponse): boolean {
    return this.currentUserId !== null && msg.usuarioId === this.currentUserId;
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
