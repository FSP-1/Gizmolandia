import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PhotoUploadComponent } from '../photo-upload/photo-upload';
import { HomeComponent } from '../home/home';
import { ApiValidationError, UsuarioRequest } from '../../services/api.models';
import { AuthApiService } from '../../services/auth-api.service';
import { UsuarioApiService } from '../../services/usuario-api.service';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, PhotoUploadComponent, HomeComponent],
  templateUrl: './user-form.html',
  styleUrls: ['./user-form.css']
})
export class UserFormComponent {
  authMode: 'register' | 'login' = 'register';

  user = {
    nombre: '',
    userProfile: '',
    nacionalidad: '',
    edad: null as number | null,
    foto: '',
    password: '',
    confirmPassword: ''
  };

  submitted = false;
  showHome = false;
  registering = false;
  currentLanguage = 'es';
  apiError = '';

  constructor(
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
    private authApiService: AuthApiService,
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

  setAuthMode(mode: 'register' | 'login') {
    this.authMode = mode;
    this.apiError = '';
    this.submitted = false;
    this.registering = false;
  }

  isRegisterMode(): boolean {
    return this.authMode === 'register';
  }

  passwordMismatch(): boolean {
    return this.isRegisterMode() && this.user.confirmPassword.length > 0 && this.user.password !== this.user.confirmPassword;
  }

  onSubmit(event: Event) {
    event.preventDefault();
    this.apiError = '';

    if (this.passwordMismatch()) {
      this.apiError = this.translate.instant('FORM.ERRORS.PASSWORD_MISMATCH');
      this.cdr.detectChanges();
      return;
    }

    this.registering = true;
    this.cdr.detectChanges();

    if (this.isRegisterMode()) {
      this.submitRegister();
      return;
    }

    this.submitLogin();
  }

  private submitRegister() {
    const payload: UsuarioRequest = {
      nombre: this.user.nombre,
      userProfile: this.user.userProfile,
      nacionalidad: this.user.nacionalidad,
      edad: this.user.edad ?? 0,
      foto: this.user.foto || '',
      password: this.user.password
    };

    this.usuarioApiService.crearUsuario(payload).subscribe({
      next: (usuarioCreado) => {
        this.persistUserSession(usuarioCreado);

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

  private submitLogin() {
    this.authApiService.login({
      nombre: this.user.nombre,
      password: this.user.password
    }).subscribe({
      next: (usuario) => {
        this.persistUserSession(usuario);
        this.registering = false;
        this.showHome = true;
        this.cdr.detectChanges();
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
      foto: '',
      password: '',
      confirmPassword: ''
    };
    this.apiError = '';
  }

  private persistUserSession(usuario: {
    id: number;
    nombre: string;
    userProfile: string;
    nacionalidad: string;
    edad: number;
    foto: string;
  }) {
    localStorage.setItem('usuarioId', String(usuario.id));
    localStorage.setItem('tetrisUsername', usuario.nombre);
    localStorage.setItem('tetrisProfile', usuario.userProfile);
    localStorage.setItem('tetrisNationality', usuario.nacionalidad);
    localStorage.setItem('tetrisAge', String(usuario.edad));
    localStorage.setItem('tetrisPhoto', usuario.foto || '');

    this.user.nombre = usuario.nombre;
    this.user.userProfile = usuario.userProfile;
    this.user.nacionalidad = usuario.nacionalidad;
    this.user.edad = usuario.edad;
    this.user.foto = usuario.foto || '';
    this.user.password = '';
    this.user.confirmPassword = '';
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