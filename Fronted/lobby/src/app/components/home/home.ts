import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CustomizationComponent } from '../customization/customization';
import { GamesComponent } from '../games/games';
import { UsuarioApiService } from '../../services/usuario-api.service';
import { UsuarioPersonalizacionRequest } from '../../services/api.models';

interface HomeCustomizationConfig {
  backgroundColor: string;
  leftImage: string;
  rightImage: string;
  profileImage: string;
  userStatus: string;
  nameColor: string;
  language: 'es' | 'en';
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, TranslateModule, CustomizationComponent, GamesComponent],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent implements OnInit, OnChanges {
  @Input() userId: number | null = null;
  @Input() userName = '';
  @Input() userProfile = '';
  @Input() userPhoto = '';
  @Input() nationality = '';
  @Input() initialBackgroundColor = '';
  @Input() initialLeftImage = '';
  @Input() initialRightImage = '';
  @Input() initialUserStatus = '';
  @Input() initialNameColor = '';
  @Input() initialLanguage: 'es' | 'en' | '' = '';
  
  showCustomization = false;
  showGames = false;
  backgroundColor = '#667eea';
  leftImage = '';
  rightImage = '';
  profileImage = '';
  userStatus = 'Listo para jugar';
  nameColor = '#ffffff';
  currentLanguage: 'es' | 'en' = 'es';

  private readonly nationalityEmojiMap: Record<string, string> = {
    ES: '🇪🇸',
    MX: '🇲🇽',
    AR: '🇦🇷',
    CO: '🇨🇴',
    CL: '🇨🇱',
    PE: '🇵🇪',
    US: '🇺🇸',
    BR: '🇧🇷',
    FR: '🇫🇷',
    DE: '🇩🇪',
    IT: '🇮🇹',
    JP: '🇯🇵',
    OTRA: '🌍'
  };

  private customizationSnapshot: HomeCustomizationConfig | null = null;

  constructor(
    private translate: TranslateService,
    private usuarioApiService: UsuarioApiService
  ) {
    const savedLanguage = localStorage.getItem('appLanguage');
    this.currentLanguage = savedLanguage === 'en' ? 'en' : 'es';
  }

  ngOnInit(): void {
    this.applyCustomizationFromInputs();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['userId'] ||
      changes['userName'] ||
      changes['initialBackgroundColor'] ||
      changes['initialLeftImage'] ||
      changes['initialRightImage'] ||
      changes['initialUserStatus'] ||
      changes['initialNameColor'] ||
      changes['initialLanguage']
    ) {
      this.applyCustomizationFromInputs();
    }
  }

  get nationalityFlag(): string {
    if (!this.nationality) {
      return '';
    }

    return this.nationalityEmojiMap[this.nationality.toUpperCase()] || '🌐';
  }

  get nationalityFlagIconUrl(): string {
    if (!this.nationality || this.nationality.toUpperCase() === 'OTRA') {
      return '';
    }

    const code = this.nationality.toLowerCase().slice(0, 2);
    return `https://flagcdn.com/w40/${code}.png`;
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
      this.currentLanguage = config.language === 'en' ? 'en' : 'es';
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

    if (reason === 'apply') {
      this.persistCustomization();
    }

    this.showCustomization = false;
    this.customizationSnapshot = null;
  }

  private persistCustomization(): void {
    if (!this.userId) {
      return;
    }

    const payload: UsuarioPersonalizacionRequest = {
      backgroundColor: this.backgroundColor,
      leftImage: this.leftImage,
      rightImage: this.rightImage,
      userStatus: this.userStatus,
      nameColor: this.nameColor,
      language: this.currentLanguage,
      profileImage: this.userPhoto
    };

    this.usuarioApiService.guardarPersonalizacion(this.userId, payload).subscribe({
      next: (usuarioActualizado) => {
        this.userPhoto = usuarioActualizado.foto || this.userPhoto;
      }
    });
  }

  private applyCustomizationFromInputs(): void {
    this.backgroundColor = this.initialBackgroundColor || '#667eea';
    this.leftImage = this.initialLeftImage || '';
    this.rightImage = this.initialRightImage || '';
    this.userStatus = this.initialUserStatus || 'Listo para jugar';
    this.nameColor = this.initialNameColor || '#ffffff';

    if (this.initialLanguage) {
      this.currentLanguage = this.initialLanguage === 'en' ? 'en' : 'es';
      localStorage.setItem('appLanguage', this.currentLanguage);
      this.translate.use(this.currentLanguage);
    }
  }
}
