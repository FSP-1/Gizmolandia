export interface UsuarioRequest {
  nombre: string;
  userProfile: string;
  nacionalidad: string;
  edad: number;
  foto: string;
  password: string;
}

export interface UsuarioPersonalizacionRequest {
  backgroundColor: string;
  leftImage: string;
  rightImage: string;
  userStatus: string;
  nameColor: string;
  language: 'es' | 'en';
  profileImage: string;
}

export interface UsuarioResponse {
  id: number;
  nombre: string;
  userProfile: string;
  nacionalidad: string;
  edad: number;
  foto: string;
  homeBackgroundColor?: string;
  homeLeftImage?: string;
  homeRightImage?: string;
  homeStatus?: string;
  homeNameColor?: string;
  preferredLanguage?: 'es' | 'en';
  fechaRegistro: string;
}

export interface PuntuacionRequest {
  usuarioId: number;
  juego: 'TETRIS' | 'SNAKE' | 'BRICK_BREAKER' | 'PING_PONG';
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

export type ChatRoomType = 'NORMAL' | 'JUEGOS' | 'NERD_STUFF';
export type ChatMediaType = 'IMAGE' | 'GIF';

export interface ChatJoinResponse {
  roomType: ChatRoomType;
  usuarioId: number;
  activeUsers: number;
  maxUsers: number;
  joined: boolean;
}

export interface ChatMessageRequest {
  usuarioId: number;
  roomType: ChatRoomType;
  commentText: string;
  mediaUrl?: string | null;
  puntuacionId?: number | null;
}

export interface ChatMessageResponse {
  id: number;
  roomType: ChatRoomType;
  usuarioId: number;
  nombreUsuario: string;
  userProfile: string;
  fotoUsuario: string;
  commentText: string;
  wordCount: number;
  mediaUrl?: string | null;
  mediaType?: ChatMediaType | null;
  puntuacionId?: number | null;
  scoreGame?: string | null;
  scoreValue?: number | null;
  createdAt: string;
}

export interface ChatScoreOption {
  puntuacionId: number;
  juego: string;
  puntuacion: number;
  fechaPartida: string;
}
