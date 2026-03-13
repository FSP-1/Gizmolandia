import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-photo-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './photo-upload.html',
  styleUrls: ['./photo-upload.css', '../../../styles/photo-upload-shared.css']
})
export class PhotoUploadComponent {
  @Output() photoSelected = new EventEmitter<string>();
  photoPreview: string | null = null;

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.photoPreview = e.target.result;
        this.photoSelected.emit(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  }
}
