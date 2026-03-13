import { Component, OnInit, OnDestroy, ElementRef, ViewChild, Input, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
  isColliding: boolean;
}

@Component({
  selector: 'app-brick-breaker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './brick-breaker.html',
  styleUrls: ['./brick-breaker.css']
})
export class BrickBreakerComponent implements OnInit, OnDestroy {
  @ViewChild('gameCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @Input() userPhoto: string = '';

  constructor(private cdr: ChangeDetectorRef) {}
  
  private ctx!: CanvasRenderingContext2D;
  private ballRadius = 20;
  private balls: Ball[] = [];
  private animationId: any;
  private ballImage: HTMLImageElement | null = null;
  private collisionSound: HTMLAudioElement | null = null;
  
  speed = 2;
  ballCount = 1;

  ngOnInit() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    
    if (this.userPhoto) {
      this.ballImage = new Image();
      this.ballImage.src = this.userPhoto;
      this.ballImage.onload = () => {
        this.initBalls();
        this.draw();
      };
    } else {
      this.initBalls();
      this.draw();
    }
  }

  ngOnDestroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  private initBalls() {
    const canvas = this.canvasRef.nativeElement;
    this.balls = [];
    for (let i = 0; i < this.ballCount; i++) {
      this.balls.push({
        x: canvas.width / 2 + (i * 50),
        y: canvas.height - 30 - (i * 30),
        dx: this.speed * (Math.random() > 0.5 ? 1 : -1),
        dy: -this.speed,
        isColliding: false
      });
    }
  }

  updateSpeed() {
    this.balls.forEach(ball => {
      const angle = Math.atan2(ball.dy, ball.dx);
      ball.dx = Math.cos(angle) * this.speed;
      ball.dy = Math.sin(angle) * this.speed;
    });
  }

  updateBallCount() {
    this.initBalls();
  }

  onSoundUpload(event: any) {
    const file = event.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      this.collisionSound = new Audio(url);
    }
  }

  private playCollisionSound() {
    if (this.collisionSound) {
      const sound = this.collisionSound.cloneNode(true) as HTMLAudioElement;
      sound.play().catch(() => {});
    }
  }

  private drawBall(ball: Ball) {
    this.ctx.beginPath();
    this.ctx.arc(ball.x, ball.y, this.ballRadius, 0, Math.PI * 2);
    
    if (this.ballImage && this.ballImage.complete) {
      this.ctx.save();
      this.ctx.clip();
      this.ctx.drawImage(
        this.ballImage,
        ball.x - this.ballRadius,
        ball.y - this.ballRadius,
        this.ballRadius * 2,
        this.ballRadius * 2
      );
      this.ctx.restore();
    } else {
      this.ctx.fillStyle = '#0095DD';
      this.ctx.fill();
    }
    
    this.ctx.closePath();
  }

  private draw = () => {
    const canvas = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    this.balls.forEach(ball => {
      this.drawBall(ball);

      let collided = false;

      if (ball.x + ball.dx > canvas.width - this.ballRadius || ball.x + ball.dx < this.ballRadius) {
        ball.dx = -ball.dx;
        collided = true;
      }
      if (ball.y + ball.dy > canvas.height - this.ballRadius || ball.y + ball.dy < this.ballRadius) {
        ball.dy = -ball.dy;
        collided = true;
      }

      if (collided && !ball.isColliding) {
        this.playCollisionSound();
        this.cdr.detectChanges();
        ball.isColliding = true;
      } else if (!collided) {
        ball.isColliding = false;
      }

      ball.x += ball.dx;
      ball.y += ball.dy;
    });

    this.animationId = requestAnimationFrame(this.draw);
  }
}
