import { Component, OnInit, OnDestroy, ElementRef, ViewChild, HostListener, ChangeDetectorRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Shape {
  x: number;
  y: number;
  color: number;
  shape: number[][];
  height: number;
  width: number;
}

@Component({
  selector: 'app-tetris',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tetris.html',
  styleUrls: ['./tetris.css']
})
export class TetrisComponent implements OnInit, OnDestroy {
  @ViewChild('gameCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @Input() userPhoto: string = '';
  
  private ctx!: CanvasRenderingContext2D;
  private grid: number[][] = [];
  private currentShape!: Shape;
  private animationId: any = null;
  private blockSize = 25;
  private cols = 12;
  private rows = 24;
  private baseGameSpeed = 500;
  private gameSpeed = 500;
  private lastMoveTime = 0;
  private lastComboTime = 0;
  private comboThreshold = 3000; // 3 segundos entre líneas para mantener combo
  
  score = 0;
  gameOver = false;
  isStarted = false;
  highScore = 0;
  username = 'Usuario';
  userProfileImage = '';
  combo = 0;
  linesCleared = 0;
  difficulty = 1;

  private shapeTemplates = [
    [[1, 1], [1, 1]], // square
    [[1, 1, 1, 1]], // horizontal line
    [[1], [1], [1], [1]], // vertical line
    [[1, 0, 0, 0], [1, 1, 1, 1]], // left L
    [[0, 0, 0, 1], [1, 1, 1, 1]], // right L
    [[1, 1, 0], [0, 1, 1]], // left S
    [[0, 1, 1], [1, 1, 0]], // right S
    [[0, 1, 0], [1, 1, 1]], // T
    [[1, 1, 1], [0, 1, 0]] // T normal
  ];

  private colors = ['#000', '#00f0f0', '#0000f0', '#f0a000', '#f0f000', '#00f000', '#a000f0', '#f00000', '#808080', '#a05020', '#f0a0f0'];

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.initGrid();
    this.createNewShape();
    this.loadHighScore();
    this.loadUserData();
    // Store profile image if passed
    if (this.userPhoto) {
      this.userProfileImage = this.userPhoto;
    }
  }

  ngOnDestroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  private initGrid() {
    this.grid = [];
    for (let i = 0; i < this.rows; i++) {
      this.grid.push(new Array(this.cols).fill(0));
    }
  }

  private loadHighScore() {
    const saved = localStorage.getItem('tetrisHighScore');
    if (saved) {
      this.highScore = parseInt(saved, 10);
    }
  }

  private loadUserData() {
    const savedUsername = localStorage.getItem('tetrisUsername');
    if (savedUsername) {
      this.username = savedUsername;
    } else {
      this.username = 'Usuario';
    }
  }

  private saveHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('tetrisHighScore', this.highScore.toString());
    }
  }

  startGame() {
    this.isStarted = true;
    this.gameOver = false;
    this.score = 0;
    this.combo = 0;
    this.linesCleared = 0;
    this.difficulty = 1;
    this.gameSpeed = this.baseGameSpeed;
    this.initGrid();
    this.createNewShape();
    this.lastMoveTime = 0;
    this.lastComboTime = Date.now();
    this.cdr.markForCheck();
    
    // Focus canvas
    setTimeout(() => {
      const canvas = this.canvasRef.nativeElement;
      if (canvas) {
        canvas.focus();
      }
    }, 0);
    
    this.startGameLoop();
  }

  private createNewShape(): void {
    const shapeTemplate = this.shapeTemplates[Math.floor(Math.random() * this.shapeTemplates.length)];
    this.currentShape = {
      x: Math.floor((this.cols - shapeTemplate[0].length) / 2),
      y: 0,
      color: Math.floor(Math.random() * 10) + 1,
      shape: shapeTemplate.map(row => [...row]),
      height: shapeTemplate.length,
      width: shapeTemplate[0].length
    };
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    // Prevenir scroll por defecto para todas las teclas de juego
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) {
      event.preventDefault();
    }

    if (!this.isStarted || this.gameOver) return;
    
    switch (event.key) {
      case 'ArrowLeft':
        this.moveLeft();
        break;
      case 'ArrowRight':
        this.moveRight();
        break;
      case 'ArrowDown':
        this.moveDown();
        break;
      case 'ArrowUp':
      case ' ':
        this.rotate();
        break;
    }
  }

  private moveLeft() {
    if (this.currentShape.x > 0 && this.canMoveTo(this.currentShape.x - 1, this.currentShape.y)) {
      this.currentShape.x--;
    }
  }

  private moveRight() {
    if (this.currentShape.x + this.currentShape.width < this.cols && 
        this.canMoveTo(this.currentShape.x + 1, this.currentShape.y)) {
      this.currentShape.x++;
    }
  }

  private moveDown() {
    if (this.canMoveTo(this.currentShape.x, this.currentShape.y + 1)) {
      this.currentShape.y++;
    } else {
      this.lockShape();
    }
  }

  private canMoveTo(newX: number, newY: number): boolean {
    for (let y = 0; y < this.currentShape.height; y++) {
      for (let x = 0; x < this.currentShape.width; x++) {
        if (this.currentShape.shape[y][x] === 1) {
          const gridX = newX + x;
          const gridY = newY + y;

          // Check bounds
          if (gridX < 0 || gridX >= this.cols || gridY >= this.rows) {
            return false;
          }

          // Check collision with existing blocks
          if (gridY >= 0 && this.grid[gridY][gridX] !== 0) {
            return false;
          }
        }
      }
    }
    return true;
  }

  private rotate() {
    const originalShape = this.currentShape.shape;
    const originalWidth = this.currentShape.width;
    const originalHeight = this.currentShape.height;

    // Rotate the shape
    const rotated: number[][] = [];
    for (let x = 0; x < this.currentShape.width; x++) {
      const newRow: number[] = [];
      for (let y = this.currentShape.height - 1; y >= 0; y--) {
        newRow.push(this.currentShape.shape[y][x]);
      }
      rotated.push(newRow);
    }

    this.currentShape.shape = rotated;
    this.currentShape.height = rotated.length;
    this.currentShape.width = rotated[0]?.length || 0;

    // Check if rotation is valid
    if (!this.canMoveTo(this.currentShape.x, this.currentShape.y)) {
      // Restore original shape if rotation is invalid
      this.currentShape.shape = originalShape;
      this.currentShape.width = originalWidth;
      this.currentShape.height = originalHeight;
    }
  }

  private drawShape() {
    for (let y = 0; y < this.currentShape.height; y++) {
      for (let x = 0; x < this.currentShape.width; x++) {
        if (this.currentShape.shape[y][x] === 1) {
          const gridY = this.currentShape.y + y;
          const gridX = this.currentShape.x + x;
          if (gridY >= 0 && gridY < this.rows && gridX >= 0 && gridX < this.cols) {
            this.grid[gridY][gridX] = this.currentShape.color;
          }
        }
      }
    }
  }

  private eraseShape() {
    for (let y = 0; y < this.currentShape.height; y++) {
      for (let x = 0; x < this.currentShape.width; x++) {
        if (this.currentShape.shape[y][x] === 1) {
          const gridY = this.currentShape.y + y;
          const gridX = this.currentShape.x + x;
          if (gridY >= 0 && gridY < this.rows && gridX >= 0 && gridX < this.cols) {
            this.grid[gridY][gridX] = 0;
          }
        }
      }
    }
  }

  private lockShape() {
    // Draw the shape permanently on the grid
    for (let y = 0; y < this.currentShape.height; y++) {
      for (let x = 0; x < this.currentShape.width; x++) {
        if (this.currentShape.shape[y][x] === 1) {
          const gridY = this.currentShape.y + y;
          const gridX = this.currentShape.x + x;
          if (gridY >= 0 && gridY < this.rows && gridX >= 0 && gridX < this.cols) {
            this.grid[gridY][gridX] = this.currentShape.color;
          }
        }
      }
    }
    
    // Check for complete lines
    this.checkLines();
    
    // Create new shape
    this.createNewShape();
    
    // Check if new shape can be placed
    if (!this.canMoveTo(this.currentShape.x, this.currentShape.y)) {
      this.gameOver = true;
      this.isStarted = false;
      this.saveHighScore();
    }
    
    this.cdr.markForCheck();
  }

  private checkLines() {
    let y = this.rows - 1;
    let linesInThisClear = 0;
    const currentTime = Date.now();
    
    while (y >= 0) {
      const isFullLine = this.grid[y].every(cell => cell !== 0);
      
      if (isFullLine) {
        linesInThisClear++;
        this.linesCleared++;
        
        // Remove the full line
        this.grid.splice(y, 1);
        // Add a new empty line at the top
        this.grid.unshift(new Array(this.cols).fill(0));
        // Check same y again since line above shifted down
        y++;
        this.cdr.markForCheck();
      }
      y--;
    }
    
    // Actualizar combo y puntuación
    if (linesInThisClear > 0) {
      // Verificar si mantiene el combo (dentro del tiempo límite)
      if (currentTime - this.lastComboTime < this.comboThreshold) {
        this.combo += linesInThisClear;
      } else {
        this.combo = linesInThisClear;
      }
      this.lastComboTime = currentTime;
      
      // Calcular puntos con multiplicador de combo
      const basePoints = linesInThisClear * 10;
      const comboMultiplier = 1 + (this.combo - 1) * 0.5; // Multiplicador de combo
      this.score += Math.floor(basePoints * comboMultiplier);
      
      // Aumentar dificultad cada 4 líneas
      if (this.linesCleared % 4 === 0) {
        this.increaseDifficulty();
      }
    } else {
      // Resetear combo si no completa líneas
      this.combo = 0;
    }
  }
  
  private increaseDifficulty() {
    this.difficulty = 1 + Math.floor(this.linesCleared / 4) * 0.2;
    // Reducir gameSpeed (menos tiempo = más rápido)
    this.gameSpeed = Math.max(200, this.baseGameSpeed - (this.difficulty - 1) * 50);
  }

  private drawGrid() {
    this.ctx.clearRect(0, 0, this.canvasRef.nativeElement.width, this.canvasRef.nativeElement.height);
    
    // Draw grid blocks
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const colorIndex = this.grid[y][x];
        const color = this.colors[colorIndex];
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x * this.blockSize, y * this.blockSize, this.blockSize, this.blockSize);
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 0.5;
        this.ctx.strokeRect(x * this.blockSize, y * this.blockSize, this.blockSize, this.blockSize);
      }
    }

    // Draw current falling shape
    for (let y = 0; y < this.currentShape.height; y++) {
      for (let x = 0; x < this.currentShape.width; x++) {
        if (this.currentShape.shape[y][x] === 1) {
          const gridX = this.currentShape.x + x;
          const gridY = this.currentShape.y + y;
          const color = this.colors[this.currentShape.color];
          this.ctx.fillStyle = color;
          this.ctx.fillRect(gridX * this.blockSize, gridY * this.blockSize, this.blockSize, this.blockSize);
          this.ctx.strokeStyle = '#333';
          this.ctx.lineWidth = 0.5;
          this.ctx.strokeRect(gridX * this.blockSize, gridY * this.blockSize, this.blockSize, this.blockSize);
        }
      }
    }
  }

  private startGameLoop = () => {
    const gameLoopFn = (timestamp: number) => {
      if (this.gameOver) {
        return;
      }

      if (timestamp - this.lastMoveTime > this.gameSpeed) {
        this.moveDown();
        this.lastMoveTime = timestamp;
      }

      this.drawGrid();
      this.animationId = requestAnimationFrame(gameLoopFn);
    };
    
    this.animationId = requestAnimationFrame(gameLoopFn);
  }

  restart() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.startGame();
  }
  
  getComboDisplay(): string {
    if (this.combo === 0) return '';
    if (this.combo === 1) return '¡Inicio!';
    if (this.combo <= 3) return `¡Combo x${this.combo}!`;
    if (this.combo <= 5) return `¡¡Combo x${this.combo}!!`;
    return `¡¡¡Combo x${this.combo}!!!`;
  }
}
