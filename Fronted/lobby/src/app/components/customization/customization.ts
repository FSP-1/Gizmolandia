import { Component, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-customization',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './customization.html',
  styleUrls: ['./customization.css', '../../../styles/photo-upload-shared.css']
})
export class CustomizationComponent {
  @Input() currentConfig: any = {};
  @Output() configChange = new EventEmitter<any>();
  @Output() close = new EventEmitter<'cancel' | 'apply'>();

  constructor(
    private cdr: ChangeDetectorRef,
    private translate: TranslateService
  ) {}

  backgroundColor = '#667eea';
  leftImage = '';
  rightImage = '';
  profileImage = '';
  userStatus = 'Listo para jugar';
  nameColor = '#ffffff';
  currentLanguage = 'es';
  loadingLeft = false;
  loadingRight = false;
  loadingProfile = false;
  errorMessage = '';

  private maxSize = 25 * 1024 * 1024; // 25MB

  predefinedColors = [
    '#667eea', '#764ba2', '#f093fb', '#4facfe',
    '#43e97b', '#fa709a', '#fee140', '#30cfd0'
  ];

  ngOnInit() {
    this.backgroundColor = this.currentConfig.backgroundColor || '#667eea';
    this.leftImage = this.currentConfig.leftImage || '';
    this.rightImage = this.currentConfig.rightImage || '';
    this.profileImage = this.currentConfig.profileImage || '';
    this.userStatus = this.currentConfig.userStatus || 'Listo para jugar';
    this.nameColor = this.currentConfig.nameColor || '#ffffff';
    this.currentLanguage = this.currentConfig.language || localStorage.getItem('appLanguage') || 'es';
  }

  selectColor(color: string) {
    this.backgroundColor = color;
    this.emitPreview();
    this.cdr.detectChanges();
  }

  onBackgroundColorChanged() {
    this.emitPreview();
  }

  onStatusChanged() {
    this.emitPreview();
  }

  onNameColorChanged() {
    this.emitPreview();
  }

  onLanguageChanged() {
    localStorage.setItem('appLanguage', this.currentLanguage);
    this.translate.use(this.currentLanguage);
    this.emitPreview();
  }

  onLeftImageUpload(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > this.maxSize) {
        this.errorMessage = 'La imagen es demasiado grande. Máximo 25MB.';
        return;
      }
      this.errorMessage = '';
      this.loadingLeft = true;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const img = new Image();
        img.onload = () => {
          this.leftImage = e.target.result;
          this.loadingLeft = false;
          this.emitPreview();
          this.cdr.detectChanges();
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  onRightImageUpload(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > this.maxSize) {
        this.errorMessage = 'La imagen es demasiado grande. Máximo 25MB.';
        return;
      }
      this.errorMessage = '';
      this.loadingRight = true;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const img = new Image();
        img.onload = () => {
          this.rightImage = e.target.result;
          this.loadingRight = false;
          this.emitPreview();
          this.cdr.detectChanges();
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  clearLeftImage() {
    this.leftImage = '';
    this.emitPreview();
    this.cdr.detectChanges();
  }

  clearRightImage() {
    this.rightImage = '';
    this.emitPreview();
    this.cdr.detectChanges();
  }

  onProfileImageUpload(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > this.maxSize) {
        this.errorMessage = 'La imagen es demasiado grande. Máximo 25MB.';
        return;
      }
      this.errorMessage = '';
      this.loadingProfile = true;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const img = new Image();
        img.onload = () => {
          this.profileImage = e.target.result;
          this.loadingProfile = false;
          this.emitPreview();
          this.cdr.detectChanges();
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  clearProfileImage() {
    this.profileImage = '';
    this.emitPreview();
    this.cdr.detectChanges();
  }

  apply() {
    this.emitPreview();
    this.close.emit('apply');
  }

  cancel() {
    this.close.emit('cancel');
  }

  private emitPreview() {
    this.configChange.emit({
      backgroundColor: this.backgroundColor,
      leftImage: this.leftImage,
      rightImage: this.rightImage,
      profileImage: this.profileImage,
      userStatus: this.userStatus,
      nameColor: this.nameColor,
      language: this.currentLanguage
    });
  }
}
