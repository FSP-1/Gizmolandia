import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PhotoUploadComponent } from '../photo-upload/photo-upload';
import { HomeComponent } from '../home/home';

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

  constructor(
    private cdr: ChangeDetectorRef,
    private translate: TranslateService
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
    this.registering = true;
    this.cdr.detectChanges();
    console.log('Usuario registrado:', this.user);
    // Guardar usuario en localStorage
    localStorage.setItem('tetrisUsername', this.user.nombre);
    localStorage.setItem('tetrisProfile', this.user.userProfile);
    localStorage.setItem('tetrisNationality', this.user.nacionalidad);
    localStorage.setItem('tetrisAge', String(this.user.edad));
    setTimeout(() => {
      this.registering = false;
      this.submitted = true;
      this.cdr.detectChanges();
      setTimeout(() => {
        this.submitted = false;
        this.showHome = true;
        this.cdr.detectChanges();
      }, 2000);
    }, 1500);
  }

  resetForm() {
    this.user = {
      nombre: '',
      userProfile: '',
      nacionalidad: '',
      edad: null,
      foto: ''
    };
  }
}