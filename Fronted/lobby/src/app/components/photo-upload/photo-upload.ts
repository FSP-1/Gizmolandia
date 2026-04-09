import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-photo-upload',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './photo-upload.html',
  styleUrls: ['./photo-upload.css', '../../../styles/photo-upload-shared.css']
})
export class PhotoUploadComponent {
  @Output() photoSelected = new EventEmitter<string>();
  photoPreview: string | null = null;

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) {
      return;
    }

    const optimized = await this.compressImage(file);
    this.photoPreview = optimized;
    this.photoSelected.emit(optimized);
  }

  private async compressImage(file: File): Promise<string> {
    const dataUrl = await this.readFileAsDataUrl(file);

    
    //Saltando la compresión para GIFs para preservar la animación
    if (file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif')) {
      return dataUrl;
    }

    const image = await this.loadImage(dataUrl);
    const maxSide = 1024;
    const ratio = Math.min(maxSide / image.width, maxSide / image.height, 1);

    const width = Math.max(1, Math.round(image.width * ratio));
    const height = Math.max(1, Math.round(image.height * ratio));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) {
      return dataUrl;
    }

    context.drawImage(image, 0, 0, width, height);

    const compressed = canvas.toDataURL('image/jpeg', 0.82);
    return compressed.length < dataUrl.length ? compressed : dataUrl;
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
      reader.readAsDataURL(file);
    });
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('No se pudo procesar la imagen.'));
      image.src = src;
    });
  }
}
