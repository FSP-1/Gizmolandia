import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrickBreakerComponent } from './brick-breaker/brick-breaker';
import { TetrisComponent } from './tetris/tetris';
import { SnakeComponent } from './snake/snake';

@Component({
  selector: 'app-games',
  standalone: true,
  imports: [CommonModule, BrickBreakerComponent, TetrisComponent, SnakeComponent],
  templateUrl: './games.html',
  styleUrls: ['./games.css']
})
export class GamesComponent {
  @Input() userPhoto: string = '';
  @Output() backToHome = new EventEmitter<void>();
  selectedGame: string | null = null;

  selectGame(game: string) {
    this.selectedGame = game;
  }

  backToLibrary() {
    if (this.selectedGame) {
      this.selectedGame = null;
    } else {
      this.backToHome.emit();
    }
  }
}
