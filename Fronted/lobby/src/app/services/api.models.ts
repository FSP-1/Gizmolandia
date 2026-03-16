export interface UsuarioRequest {
  nombre: string;
  userProfile: string;
  nacionalidad: string;
  edad: number;
  foto: string;
  password: string;
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
  fotoUsuario: string;
  juego: string;
  puntuacion: number;
  fechaPartida: string;
}

export interface LoginRequest {
  nombre: string;
  password: string;
}

export type LoginResponse = UsuarioResponse;

export interface ApiValidationError {
  timestamp?: string;
  status?: number;
  mensaje?: string;
  errores?: Record<string, string>;
}
