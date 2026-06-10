import { CommonModule, Location } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { HomeComponent } from '../home/home';
import { UsuarioResponse } from '../../services/api.models';
import { SessionStateService } from '../../services/session-state.service';
import { UsuarioApiService } from '../../services/usuario-api.service';

@Component({
  selector: 'app-public-profile',
  standalone: true,
  imports: [CommonModule, TranslateModule, HomeComponent],
  templateUrl: './public-profile.html',
  styleUrls: ['./public-profile.css']
})
export class PublicProfileComponent implements OnInit {
  profile: UsuarioResponse | null = null;
  loading = true;
  errorMessage = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly location: Location,
    private readonly sessionStateService: SessionStateService,
    private readonly usuarioApiService: UsuarioApiService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const currentUser = this.sessionStateService.getUser();
    if (!currentUser) {
      this.router.navigate(['/auth']);
      return;
    }

    const userProfile = (this.route.snapshot.paramMap.get('userProfile') || '').trim();
    if (!userProfile || /^\d+$/.test(userProfile)) {
      this.loading = false;
      this.errorMessage = 'Perfil no válido.';
      this.cdr.detectChanges();
      return;
    }

    if (userProfile.toLowerCase() === currentUser.userProfile.toLowerCase()) {
      this.router.navigate(['/home']);
      return;
    }

    this.usuarioApiService.buscarPerfilPublico(userProfile).subscribe({
      next: (profile) => {
        this.profile = profile;
        this.loading = false;
        this.errorMessage = '';
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'No se pudo cargar este perfil.';
        this.cdr.detectChanges();
      }
    });
  }

  goBack(): void {
    this.location.back();
  }
}
