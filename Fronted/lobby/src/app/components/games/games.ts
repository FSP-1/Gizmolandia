import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { BrickBreakerComponent } from './brick-breaker/brick-breaker';
import { TetrisComponent } from './tetris/tetris';
import { SnakeComponent } from './snake/snake';
import { PingPongComponent } from './ping-pong/ping-pong';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SessionStateService } from '../../services/session-state.service';
import { UsuarioApiService } from '../../services/usuario-api.service';

@Component({
  selector: 'app-games',
  standalone: true,
  imports: [CommonModule, TranslateModule, BrickBreakerComponent, TetrisComponent, SnakeComponent, PingPongComponent],
  templateUrl: './games.html',
  styleUrls: ['./games.css']
})
export class GamesComponent implements OnInit, OnDestroy {
  private readonly allowedGames = ['brick-breaker', 'tetris', 'snake', 'ping-pong'] as const;
  private routeSub?: Subscription;

  @Input() userPhoto: string = '';
  @Output() backToHome = new EventEmitter<void>();
  selectedGame: string | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly sessionStateService: SessionStateService,
    private readonly usuarioApiService: UsuarioApiService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const sessionUser = this.sessionStateService.getUser();
    if (!sessionUser) {
      this.router.navigate(['/auth']);
      return;
    }

    if (!this.userPhoto) {
      this.userPhoto = sessionUser.foto || '';
    }

    // Route-based access can happen without Home refresh; hydrate missing photo directly.
    if (!this.userPhoto && sessionUser.id) {
      this.usuarioApiService.buscarPorId(sessionUser.id).subscribe({
        next: (usuario) => {
          this.userPhoto = usuario.foto || this.userPhoto;
          this.sessionStateService.saveUser({
            ...sessionUser,
            ...usuario
          });
        }
      });
    }

    this.routeSub = this.route.paramMap.subscribe((params) => {
      const routeGame = params.get('game');
      if (!routeGame) {
        this.selectedGame = null;
        return;
      }

      if (this.isValidGame(routeGame)) {
        this.selectedGame = routeGame;
      } else {
        this.router.navigate(['/home/games']);
      }
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  selectGame(game: string) {
    if (!this.isValidGame(game)) {
      return;
    }
    this.router.navigate(['/home/games', game]);
  }

  backToLibrary() {
    if (this.selectedGame) {
      this.router.navigate(['/home/games']);
    } else {
      if (this.backToHome.observed) {
        this.backToHome.emit();
      } else {
        this.router.navigate(['/home']);
      }
    }
  }

  private isValidGame(game: string): boolean {
    return (this.allowedGames as readonly string[]).includes(game);
  }
}
