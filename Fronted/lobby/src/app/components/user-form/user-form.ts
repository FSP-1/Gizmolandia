import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PhotoUploadComponent } from '../photo-upload/photo-upload';
import { HomeComponent } from '../home/home';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, FormsModule, PhotoUploadComponent, HomeComponent],
  templateUrl: './user-form.html',
  styleUrls: ['./user-form.css']
})
export class UserFormComponent {
  user = {
    nombre: '',
    userProfile: '',
    edad: null as number | null,
    foto: ''
  };

  submitted = false;
  showHome = false;
  registering = false;

  constructor(private cdr: ChangeDetectorRef) {}

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
      edad: null,
      foto: ''
    };
  }
}