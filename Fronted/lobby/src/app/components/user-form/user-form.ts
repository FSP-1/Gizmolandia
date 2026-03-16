import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PhotoUploadComponent } from '../photo-upload/photo-upload';
import { HomeComponent } from '../home/home';
import { ApiValidationError, UsuarioRequest } from '../../services/api.models';
import { UsuarioApiService } from '../../services/usuario-api.service';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, PhotoUploadComponent, HomeComponent],
  templateUrl: './user-form.html',
  styleUrls: ['./user-form.css']
})
export class UserFormComponent {
  user = {
    nombre: '',
    userProfile: '',
    nacionalidad: '',
    edad: null as number | null,
    foto: ''
  };

  submitted = false;
  showHome = false;
  registering = false;
  currentLanguage = 'es';
  apiError = '';

  constructor(
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
    private usuarioApiService: UsuarioApiService
  ) {
    const browserLang = this.translate.getBrowserLang();
    const savedLang = localStorage.getItem('appLanguage');
    const initialLang = savedLang || (browserLang === 'en' ? 'en' : 'es');

    this.translate.addLangs(['es', 'en']);
    this.translate.setDefaultLang('es');
    this.currentLanguage = initialLang;
    this.translate.use(initialLang);
  }

  setLanguage(lang: string) {
    this.currentLanguage = lang;
    localStorage.setItem('appLanguage', lang);
    this.translate.use(lang);
  }

  onPhotoSelected(photo: string) {
    this.user.foto = photo;
  }

  onSubmit(event: Event) {
    event.preventDefault();
    this.apiError = '';
    this.registering = true;
    this.cdr.detectChanges();

    const payload: UsuarioRequest = {
      nombre: this.user.nombre,
      userProfile: this.user.userProfile,
      nacionalidad: this.user.nacionalidad,
      edad: this.user.edad ?? 0,
      foto: this.user.foto || ''
    };

    this.usuarioApiService.crearUsuario(payload).subscribe({
      next: (usuarioCreado) => {
        localStorage.setItem('usuarioId', String(usuarioCreado.id));
        localStorage.setItem('tetrisUsername', usuarioCreado.nombre);
        localStorage.setItem('tetrisProfile', usuarioCreado.userProfile);
        localStorage.setItem('tetrisNationality', usuarioCreado.nacionalidad);
        localStorage.setItem('tetrisAge', String(usuarioCreado.edad));

        this.registering = false;
        this.submitted = true;
        this.cdr.detectChanges();
        setTimeout(() => {
          this.submitted = false;
          this.showHome = true;
          this.cdr.detectChanges();
        }, 1400);
      },
      error: (error: HttpErrorResponse) => {
        this.registering = false;
        this.apiError = this.buildApiErrorMessage(error);
        this.cdr.detectChanges();
      }
    });
  }

  resetForm() {
    this.user = {
      nombre: '',
      userProfile: '',
      nacionalidad: '',
      edad: null,
      foto: ''
    };
    this.apiError = '';
  }

  private buildApiErrorMessage(error: HttpErrorResponse): string {
    if (!error.error) {
      return this.translate.instant('FORM.ERRORS.BACKEND_GENERIC');
    }

    const apiError = error.error as ApiValidationError;
    if (apiError.errores) {
      const firstKey = Object.keys(apiError.errores)[0];
      if (firstKey && apiError.errores[firstKey]) {
        return apiError.errores[firstKey];
      }
    }

    if (apiError.mensaje) {
      return apiError.mensaje;
    }

    return this.translate.instant('FORM.ERRORS.BACKEND_GENERIC');
  }
}