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

  get homeWrapperStyles(): Record<string, string> {
    const theme = this.getButtonTheme(this.backgroundColor);

    return {
      'background-color': this.backgroundColor,
      '--home-btn-text': theme.text,
      '--home-btn-border': theme.border,
      '--customize-btn-start': theme.customizeStart,
      '--customize-btn-end': theme.customizeEnd,
      '--customize-btn-shadow': theme.customizeShadow,
      '--customize-btn-shadow-hover': theme.customizeShadowHover,
      '--games-btn-start': theme.gamesStart,
      '--games-btn-end': theme.gamesEnd,
      '--games-btn-shadow': theme.gamesShadow,
      '--games-btn-shadow-hover': theme.gamesShadowHover
    };
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

  private getButtonTheme(background: string): {
    text: string;
    border: string;
    customizeStart: string;
    customizeEnd: string;
    customizeShadow: string;
    customizeShadowHover: string;
    gamesStart: string;
    gamesEnd: string;
    gamesShadow: string;
    gamesShadowHover: string;
  } {
    const rgb = this.parseColor(background) ?? { r: 102, g: 126, b: 234 };
    const luminance = this.relativeLuminance(rgb);
    const isLightBackground = luminance > 0.55;

    if (isLightBackground) {
      return {
        text: '#f8fafc',
        border: 'rgba(255, 255, 255, 0.18)',
        customizeStart: '#1f2937',
        customizeEnd: '#0f172a',
        customizeShadow: '0 5px 20px rgba(15, 23, 42, 0.45)',
        customizeShadowHover: '0 8px 30px rgba(15, 23, 42, 0.62)',
        gamesStart: '#374151',
        gamesEnd: '#111827',
        gamesShadow: '0 5px 20px rgba(17, 24, 39, 0.45)',
        gamesShadowHover: '0 8px 30px rgba(17, 24, 39, 0.62)'
      };
    }

    return {
      text: '#0f172a',
      border: 'rgba(15, 23, 42, 0.2)',
      customizeStart: '#f8fafc',
      customizeEnd: '#dbeafe',
      customizeShadow: '0 5px 20px rgba(248, 250, 252, 0.32)',
      customizeShadowHover: '0 8px 30px rgba(248, 250, 252, 0.46)',
      gamesStart: '#fef3c7',
      gamesEnd: '#fed7aa',
      gamesShadow: '0 5px 20px rgba(254, 243, 199, 0.35)',
      gamesShadowHover: '0 8px 30px rgba(254, 243, 199, 0.5)'
    };
  }

  private parseColor(color: string): { r: number; g: number; b: number } | null {
    const value = (color || '').trim();
    if (!value) {
      return null;
    }

    if (value.startsWith('#')) {
      return this.parseHexColor(value);
    }

    const rgbMatch = value.match(/^rgba?\((\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(?:\d*\.?\d+))?\)$/i);
    if (!rgbMatch) {
      return null;
    }

    return {
      r: this.clampChannel(Number(rgbMatch[1])),
      g: this.clampChannel(Number(rgbMatch[2])),
      b: this.clampChannel(Number(rgbMatch[3]))
    };
  }

  private parseHexColor(hex: string): { r: number; g: number; b: number } | null {
    const normalized = hex.replace('#', '').trim();
    if (normalized.length === 3) {
      const r = Number.parseInt(normalized[0] + normalized[0], 16);
      const g = Number.parseInt(normalized[1] + normalized[1], 16);
      const b = Number.parseInt(normalized[2] + normalized[2], 16);
      return { r, g, b };
    }

    if (normalized.length === 6) {
      const r = Number.parseInt(normalized.slice(0, 2), 16);
      const g = Number.parseInt(normalized.slice(2, 4), 16);
      const b = Number.parseInt(normalized.slice(4, 6), 16);
      return { r, g, b };
    }

    return null;
  }

  private clampChannel(value: number): number {
    return Math.max(0, Math.min(255, Math.round(value)));
  }

  private relativeLuminance(rgb: { r: number; g: number; b: number }): number {
    const r = this.channelToLinear(rgb.r);
    const g = this.channelToLinear(rgb.g);
    const b = this.channelToLinear(rgb.b);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  private channelToLinear(channel: number): number {
    const c = channel / 255;
    if (c <= 0.03928) {
      return c / 12.92;
    }
    return Math.pow((c + 0.055) / 1.055, 2.4);
  }
}
