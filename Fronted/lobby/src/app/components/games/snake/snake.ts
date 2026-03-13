import { Component, OnDestroy, OnInit, ElementRef, ViewChild, HostListener, Input, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

type Direction = 'up' | 'down' | 'left' | 'right';

type FruitType = 'apple' | 'banana' | 'grape' | 'alfajor';

interface Cell {
  x: number;
  y: number;
}

interface Fruit {
  x: number;
  y: number;
  type: FruitType;
}

@Component({
  selector: 'app-snake',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './snake.html',
  styleUrls: ['./snake.css']
})
export class SnakeComponent implements OnInit, OnDestroy {
  @ViewChild('gameCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @Input() userPhoto: string = '';

  private ctx!: CanvasRenderingContext2D;
  private animationId: number | null = null;
  private readonly cols = 20;
  private readonly rows = 20;
  private readonly cellSize = 20;
  private readonly baseSpeed = 160;
  private speedMs = 160;
  private lastTick = 0;
  private direction: Direction = 'right';
  private nextDirection: Direction = 'right';
  private snake: Cell[] = [];
  private fruit!: Fruit;
  private profileImage: HTMLImageElement | null = null;

  score = 0;
  highScore = 0;
  username = 'Usuario';
  gameOver = false;
  isStarted = false;
  useUserSkin = true;
  difficulty = 1;

  ngOnInit(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;

    this.loadUserData();
    this.loadHighScore();
    this.loadUserSkin();
    this.resetState();
    this.draw();
  }

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnDestroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  private loadUserData(): void {
    const savedUsername = localStorage.getItem('tetrisUsername');
    if (savedUsername) {
      this.username = savedUsername;
    }
  }

  private loadHighScore(): void {
    const saved = localStorage.getItem('snakeHighScore');
    if (saved) {
      this.highScore = parseInt(saved, 10);
    }
  }

  private saveHighScore(): void {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('snakeHighScore', String(this.highScore));
    }
  }

  private loadUserSkin(): void {
    if (!this.userPhoto) {
      this.profileImage = null;
      return;
    }

    const image = new Image();
    image.src = this.userPhoto;
    image.onload = () => {
      this.profileImage = image;
    };
    image.onerror = () => {
      this.profileImage = null;
    };
  }

  startGame(): void {
    this.resetState();
    this.isStarted = true;
    this.gameOver = false;
    this.lastTick = 0;

    setTimeout(() => {
      this.canvasRef.nativeElement.focus();
    }, 0);

    this.startLoop();
    this.cdr.markForCheck();
  }

  restart(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.startGame();
  }

  toggleSkin(): void {
    this.useUserSkin = !this.useUserSkin;
    this.draw();
  }

  @HostListener('window:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) {
      event.preventDefault();
    }

    if (!this.isStarted || this.gameOver) {
      return;
    }

    switch (event.key) {
      case 'ArrowUp':
        if (this.direction !== 'down') this.nextDirection = 'up';
        break;
      case 'ArrowDown':
        if (this.direction !== 'up') this.nextDirection = 'down';
        break;
      case 'ArrowLeft':
        if (this.direction !== 'right') this.nextDirection = 'left';
        break;
      case 'ArrowRight':
        if (this.direction !== 'left') this.nextDirection = 'right';
        break;
    }
  }

  private resetState(): void {
    this.score = 0;
    this.difficulty = 1;
    this.speedMs = this.baseSpeed;
    this.direction = 'right';
    this.nextDirection = 'right';

    const centerX = Math.floor(this.cols / 2);
    const centerY = Math.floor(this.rows / 2);

    this.snake = [
      { x: centerX - 2, y: centerY },
      { x: centerX - 1, y: centerY },
      { x: centerX, y: centerY }
    ];

    this.spawnFruit();
  }

  private startLoop(): void {
    const loop = (timestamp: number): void => {
      if (this.gameOver) {
        return;
      }

      if (!this.lastTick) {
        this.lastTick = timestamp;
      }

      if (timestamp - this.lastTick >= this.speedMs) {
        this.tick();
        this.lastTick = timestamp;
      }

      this.draw();
      this.animationId = requestAnimationFrame(loop);
    };

    this.animationId = requestAnimationFrame(loop);
  }

  private tick(): void {
    this.direction = this.nextDirection;

    const head = this.snake[this.snake.length - 1];
    const nextHead = { ...head };

    if (this.direction === 'up') nextHead.y -= 1;
    if (this.direction === 'down') nextHead.y += 1;
    if (this.direction === 'left') nextHead.x -= 1;
    if (this.direction === 'right') nextHead.x += 1;

    if (this.isCollision(nextHead)) {
      this.gameOver = true;
      this.isStarted = false;
      this.saveHighScore();
      this.cdr.markForCheck();
      return;
    }

    this.snake.push(nextHead);

    if (nextHead.x === this.fruit.x && nextHead.y === this.fruit.y) {
      this.score += this.getPointsForFruit(this.fruit.type);
      this.updateDifficulty();
      this.spawnFruit();
      this.cdr.markForCheck();
      return;
    }

    this.snake.shift();
  }

  private getPointsForFruit(type: FruitType): number {
    if (type === 'apple') return 1;
    if (type === 'banana') return 2;
    if (type === 'grape') return 3;
    // Alfajor: doble de puntos respecto a fruta base
    return 4;
  }

  private updateDifficulty(): void {
    this.difficulty = 1 + Math.floor(this.score / 8) * 0.2;
    this.speedMs = Math.max(70, this.baseSpeed - Math.floor(this.score / 5) * 6);
  }

  private spawnFruit(): void {
    const type = this.randomFruitType();

    let x = 0;
    let y = 0;
    let isOnSnake = true;

    while (isOnSnake) {
      x = Math.floor(Math.random() * this.cols);
      y = Math.floor(Math.random() * this.rows);
      isOnSnake = this.snake.some(segment => segment.x === x && segment.y === y);
    }

    this.fruit = { x, y, type };
  }

  private randomFruitType(): FruitType {
    const value = Math.random();
    if (value < 0.45) return 'apple';
    if (value < 0.75) return 'banana';
    if (value < 0.92) return 'grape';
    return 'alfajor';
  }

  private isCollision(cell: Cell): boolean {
    if (cell.x < 0 || cell.y < 0 || cell.x >= this.cols || cell.y >= this.rows) {
      return true;
    }

    return this.snake.some(segment => segment.x === cell.x && segment.y === cell.y);
  }

  private draw(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);

    this.drawBoard();
    this.drawFruit();
    this.drawSnake();
  }

  private drawBoard(): void {
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(0, 0, this.cols * this.cellSize, this.rows * this.cellSize);

    this.ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
    this.ctx.lineWidth = 1;

    for (let x = 0; x <= this.cols; x++) {
      this.ctx.beginPath();
      this.ctx.moveTo(x * this.cellSize, 0);
      this.ctx.lineTo(x * this.cellSize, this.rows * this.cellSize);
      this.ctx.stroke();
    }

    for (let y = 0; y <= this.rows; y++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y * this.cellSize);
      this.ctx.lineTo(this.cols * this.cellSize, y * this.cellSize);
      this.ctx.stroke();
    }
  }

  private drawSnake(): void {
    this.snake.forEach((segment, index) => {
      const px = segment.x * this.cellSize;
      const py = segment.y * this.cellSize;

      if (this.useUserSkin && this.profileImage && this.profileImage.complete) {
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.roundRect(px + 1, py + 1, this.cellSize - 2, this.cellSize - 2, 6);
        this.ctx.clip();
        this.ctx.drawImage(this.profileImage, px, py, this.cellSize, this.cellSize);
        this.ctx.restore();
      } else {
        this.ctx.fillStyle = index === this.snake.length - 1 ? '#22c55e' : '#16a34a';
        this.ctx.fillRect(px + 1, py + 1, this.cellSize - 2, this.cellSize - 2);
      }

      this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
      this.ctx.strokeRect(px + 1, py + 1, this.cellSize - 2, this.cellSize - 2);
    });
  }

  private drawFruit(): void {
    const px = this.fruit.x * this.cellSize;
    const py = this.fruit.y * this.cellSize;

    if (this.fruit.type === 'apple') this.ctx.fillStyle = '#ef4444';
    if (this.fruit.type === 'banana') this.ctx.fillStyle = '#facc15';
    if (this.fruit.type === 'grape') this.ctx.fillStyle = '#a855f7';
    if (this.fruit.type === 'alfajor') this.ctx.fillStyle = '#f59e0b';

    this.ctx.beginPath();
    this.ctx.arc(px + this.cellSize / 2, py + this.cellSize / 2, this.cellSize / 2.6, 0, Math.PI * 2);
    this.ctx.fill();

    if (this.fruit.type === 'alfajor') {
      this.ctx.fillStyle = '#78350f';
      this.ctx.font = 'bold 10px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('x2', px + this.cellSize / 2, py + this.cellSize / 2 + 3);
    }
  }
}
