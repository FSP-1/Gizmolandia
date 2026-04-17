import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { PuntuacionResponse } from '../../../services/api.models';
import { PuntuacionApiService } from '../../../services/puntuacion-api.service';

@Component({
  selector: 'app-game-leaderboard',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './game-leaderboard.html',
  styleUrls: ['./game-leaderboard.css']
})
export class GameLeaderboardComponent implements OnInit, OnChanges {
  @Input() juego: 'TETRIS' | 'SNAKE' | 'BRICK_BREAKER' | 'PING_PONG' = 'TETRIS';
  @Input() top = 5;

  loading = false;
  ranking: PuntuacionResponse[] = [];

  constructor(
    private puntuacionApiService: PuntuacionApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadRanking();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['juego'] && !changes['juego'].firstChange) {
      this.loadRanking();
    }
  }

  refresh(): void {
    this.loadRanking();
  }

  initials(name: string): string {
    return (name || '?').slice(0, 1).toUpperCase();
  }

  private loadRanking(): void {
    this.loading = true;
    this.puntuacionApiService.rankingPorJuego(this.juego).subscribe({
      next: (rows) => {
        this.ranking = rows.slice(0, this.top);
        this.loading = false;
        setTimeout(() => this.cdr.detectChanges());
      },
      error: () => {
        this.ranking = [];
        this.loading = false;
        setTimeout(() => this.cdr.detectChanges());
      }
    });
  }
}
