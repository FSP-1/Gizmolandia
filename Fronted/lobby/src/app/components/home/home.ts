import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomizationComponent } from '../customization/customization';
import { GamesComponent } from '../games/games';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, CustomizationComponent, GamesComponent],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent {
  @Input() userName = '';
  @Input() userProfile = '';
  @Input() userPhoto = '';
  
  showCustomization = false;
  showGames = false;
  backgroundColor = '#667eea';
  leftImage = '';
  rightImage = '';
  profileImage = '';
  userStatus = 'Listo para jugar';
  nameColor = '#ffffff';

  private customizationSnapshot: any = null;

  toggleCustomization() {
    if (!this.showCustomization) {
      this.customizationSnapshot = {
        backgroundColor: this.backgroundColor,
        leftImage: this.leftImage,
        rightImage: this.rightImage,
        profileImage: this.userPhoto,
        userStatus: this.userStatus,
        nameColor: this.nameColor
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
    }

    this.showCustomization = false;
    this.customizationSnapshot = null;
  }
}
