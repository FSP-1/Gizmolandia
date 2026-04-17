import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ChatRoomType } from '../../../../services/api.models';

interface RoomTab {
  room: ChatRoomType;
  labelKey: string;
}

@Component({
  selector: 'app-chat-room-tabs',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './chat-room-tabs.html',
  styleUrls: ['./chat-room-tabs.css']
})
export class ChatRoomTabsComponent {
  @Input() activeRoom: ChatRoomType = 'NORMAL';
  @Input() disabled = false;
  @Output() roomSelected = new EventEmitter<ChatRoomType>();

  readonly tabs: RoomTab[] = [
    { room: 'NORMAL', labelKey: 'CHAT.ROOMS.NORMAL' },
    { room: 'JUEGOS', labelKey: 'CHAT.ROOMS.JUEGOS' },
    { room: 'NERD_STUFF', labelKey: 'CHAT.ROOMS.NERD_STUFF' }
  ];

  select(room: ChatRoomType): void {
    if (this.disabled || room === this.activeRoom) {
      return;
    }
    this.roomSelected.emit(room);
  }
}
