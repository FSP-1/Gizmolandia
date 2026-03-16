export interface UsuarioRequest {
  nombre: string;
  userProfile: string;
  nacionalidad: string;
  edad: number;
  foto: string;
}

export interface UsuarioResponse {
  id: number;
  nombre: string;
  userProfile: string;
  nacionalidad: string;
  edad: number;
  foto: string;
  fechaRegistro: string;
}

export interface PuntuacionRequest {
  usuarioId: number;
  juego: 'TETRIS' | 'SNAKE' | 'BRICK_BREAKER';
  puntuacion: number;
}

export interface PuntuacionResponse {
  id: number;
  usuarioId: number;
  nombreUsuario: string;
  juego: string;
  puntuacion: number;
  fechaPartida: string;
}

export interface ApiValidationError {
  timestamp?: string;
  status?: number;
  mensaje?: string;
  errores?: Record<string, string>;
}
