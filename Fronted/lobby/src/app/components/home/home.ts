import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CustomizationComponent } from '../customization/customization';
import { GamesComponent } from '../games/games';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, TranslateModule, CustomizationComponent, GamesComponent],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent {
  @Input() userName = '';
  @Input() userProfile = '';
  @Input() userPhoto = '';
  @Input() nationality = '';
  
  showCustomization = false;
  showGames = false;
  backgroundColor = '#667eea';
  leftImage = '';
  rightImage = '';
  profileImage = '';
  userStatus = 'Listo para jugar';
  nameColor = '#ffffff';
  currentLanguage = 'es';

  private customizationSnapshot: any = null;

  constructor(private translate: TranslateService) {
    this.currentLanguage = localStorage.getItem('appLanguage') || 'es';
  }

  get nationalityFlag(): string {
    if (!this.nationality) {
      return '';
    }

    if (this.nationality === 'OTRA') {
      return '🌍';
    }

    return this.nationality
      .toUpperCase()
      .slice(0, 2)
      .split('')
      .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
      .join('');
  }

  toggleCustomization() {
    if (!this.showCustomization) {
      this.customizationSnapshot = {
        backgroundColor: this.backgroundColor,
        leftImage: this.leftImage,
        rightImage: this.rightImage,
        profileImage: this.userPhoto,
        userStatus: this.userStatus,
        nameColor: this.nameColor,
        language: this.currentLanguage
      };
    }
    this.showCustomization = !this.showCustomization;
  }

  toggleGames() {
    this.showGames = !this.showGames;
  }

  onCustomizationChange(config: any) {
    this.backgroundColor = config.backgroundColor;
    this.leftImage = config.leftImage;
    this.rightImage = config.rightImage;
    this.userStatus = config.userStatus ?? this.userStatus;
    this.nameColor = config.nameColor ?? this.nameColor;
    if (config.language && config.language !== this.currentLanguage) {
      this.currentLanguage = config.language;
      localStorage.setItem('appLanguage', config.language);
      this.translate.use(config.language);
    }
    if (config.profileImage) {
      this.userPhoto = config.profileImage;
    }
    if (config.profileImage === '') {
      this.userPhoto = '';
    }
  }

  onCustomizationClose(reason: 'cancel' | 'apply') {
    if (reason === 'cancel' && this.customizationSnapshot) {
      this.backgroundColor = this.customizationSnapshot.backgroundColor;
      this.leftImage = this.customizationSnapshot.leftImage;
      this.rightImage = this.customizationSnapshot.rightImage;
      this.userPhoto = this.customizationSnapshot.profileImage;
      this.userStatus = this.customizationSnapshot.userStatus;
      this.nameColor = this.customizationSnapshot.nameColor;
      this.currentLanguage = this.customizationSnapshot.language;
      localStorage.setItem('appLanguage', this.currentLanguage);
      this.translate.use(this.currentLanguage);
    }

    this.showCustomization = false;
    this.customizationSnapshot = null;
  }
}
