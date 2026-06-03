import { ChangeDetectorRef, Component, OnDestroy,ChangeDetectionStrategy} 
from '@angular/core';import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-music-creation',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './music-creation.html',
  styleUrl: './music-creation.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MusicCreationComponent implements OnDestroy {
currentStep = 0;

isPlaying = false;

private playInterval?: number;

constructor(
  private cdr: ChangeDetectorRef
) {}

  readonly instruments = [
    'Kick',
    'Snare',
    'HiHat',
    'Bass',
    'Synth',
    'Voice'
  ];

  readonly cols = 12;

  tempo = 120;

  grid: boolean[][] = Array.from(
    { length: this.instruments.length },
    () => Array(this.cols).fill(false)
  );

  private audioMap: Record<string, HTMLAudioElement> = {
    Kick: new Audio('assets/sounds/kick.wav'),
    Snare: new Audio('assets/sounds/snare.wav'),
    HiHat: new Audio('assets/sounds/hihat.wav'),
    Bass: new Audio('assets/sounds/bass.wav'),
    Synth: new Audio('assets/sounds/synth.wav'),
    Voice: new Audio('assets/sounds/voice.wav')
  };

  toggleCell(row: number, col: number): void {
    this.grid[row][col] = !this.grid[row][col];
    this.playInstrument(this.instruments[row]);
  }

  playInstrument(instrument: string): void {
    const audio = this.audioMap[instrument];

    audio.pause();
    audio.currentTime = 0;

    audio.play().catch(() => {});
  }
  play(): void {

  if (this.isPlaying) {
    return;
  }

  this.isPlaying = true;

  const intervalMs = (60 / this.tempo) * 1000;

  this.playInterval = window.setInterval(() => {

    this.playColumn(this.currentStep);

    this.currentStep++;

    if (this.currentStep >= this.cols) {
      this.currentStep = 0;
    }
  this.cdr.markForCheck();

  }, intervalMs);
  }
  stop(): void {

    this.isPlaying = false;

    if (this.playInterval) {
      clearInterval(this.playInterval);
    }

    this.currentStep = 0;
    this.cdr.markForCheck();
  }

  playColumn(col: number): void {

  for (let row = 0; row < this.instruments.length; row++) {

    if (this.grid[row][col]) {

      this.playInstrument(
        this.instruments[row]
      );

    }
  }
}
  ngOnDestroy(): void {

    if (this.playInterval) {
      clearInterval(this.playInterval);
    }

  }
}