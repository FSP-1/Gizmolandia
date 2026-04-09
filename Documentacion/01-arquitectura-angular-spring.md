# 🏗️ Arquitectura Angular - Spring Boot

## 📋 Índice
- [Visión General](#visión-general)
- [Comunicación HTTP](#comunicación-http)
- [Comunicación WebSocket](#comunicación-websocket)
- [Flujo Completo](#flujo-completo)
- [Manejo de Errores](#manejo-de-errores)
- [Seguridad CORS](#seguridad-cors)

---

## 🎯 Visión General

Gizmolandia usa una arquitectura **cliente-servidor** con dos canales de comunicación:

```
┌──────────────────────┐
│   CLIENTE ANGULAR    │
│   (localhost:4200)   │
└──────────┬───────────┘
           │
     ┌─────┴─────┐
     │           │
     ▼           ▼
  HTTP         WebSocket
  REST         (Real Time)
     │           │
     └─────┬─────┘
           │
┌──────────▼───────────┐
│  SERVIDOR SPRING BOOT │
│  (localhost:8080)    │
└──────────┬───────────┘
           │
    ┌──────┴──────┐
    │             │
    ▼             ▼
Database      File System
(MySQL)       (Imágenes)
```

---

## 🌐 Comunicación HTTP

### 1. Configuración Base

**Frontend - `api.config.ts`:**
```typescript
export const API_BASE_URL = 'http://localhost:8080/api';
```

**Backend - `SecurityConfig.java`:**
```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:4200"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
```

### 2. Flujo de una Solicitud HTTP

```
┌─────────────────────────────────────────────────────────────┐
│  PASO 1: Angular Service prepara la solicitud               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  const payload = { usuario: 'john', contraseña: '123' };    │
│  return this.http.post(url, payload);                       │
│                                                               │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  PASO 2: HttpClient envía petición HTTP                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  POST /api/auth/login HTTP/1.1                              │
│  Host: localhost:8080                                        │
│  Content-Type: application/json                              │
│  Origin: http://localhost:4200                               │
│                                                               │
│  { "usuario": "john", "contraseña": "123" }                 │
│                                                               │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  PASO 3: Spring valida CORS                                 │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ✓ Origin es localhost:4200 → PERMITIDO                     │
│  ✓ Método POST está permitido                               │
│  ✓ Headers válidos                                           │
│                                                               │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  PASO 4: AuthController procesa solicitud                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  @PostMapping("/login")                                      │
│  public ResponseEntity<UsuarioResponseDTO> login(...) {     │
│    return ResponseEntity.ok(authService.login(dto));        │
│  }                                                            │
│                                                               │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  PASO 5: AuthService ejecuta lógica de negocio              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. Buscar usuario en BD                                     │
│  2. Validar contraseña (BCrypt)                              │
│  3. Si OK → retornar UsuarioResponseDTO                      │
│  4. Si NO → lanzar excepción                                 │
│                                                               │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  PASO 6: Response HTTP con status 200                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  HTTP/1.1 200 OK                                             │
│  Access-Control-Allow-Origin: http://localhost:4200          │
│  Content-Type: application/json                              │
│                                                               │
│  {                                                           │
│    "id": 1,                                                  │
│    "usuario": "john",                                        │
│    "email": "john@example.com",                              │
│    "fotoPerfil": "avatar1.png"                               │
│  }                                                            │
│                                                               │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  PASO 7: Angular recibe respuesta                           │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  this.authService.login(data).subscribe({                   │
│    next: (response) => {                                     │
│      // Guardar datos en sessionStorage                      │
│      // Redirigir a /home                                    │
│    },                                                        │
│    error: (error) => {                                       │
│      // Mostrar mensaje de error                             │
│    }                                                         │
│  });                                                         │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 3. Servicios HTTP en Angular

#### AuthApiService
```typescript
@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly baseUrl = `${API_BASE_URL}/auth`;
  
  constructor(private readonly http: HttpClient) {}
  
  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, payload);
  }
}
```

**Uso:**
```typescript
this.authService.login({ usuario: 'john', contraseña: '123' })
  .subscribe(response => {
    this.usuario = response;
  });
```

#### UsuarioApiService
```typescript
@Injectable({ providedIn: 'root' })
export class UsuarioApiService {
  private readonly baseUrl = `${API_BASE_URL}/usuarios`;
  
  constructor(private readonly http: HttpClient) {}
  
  crearUsuario(payload: UsuarioRequest): Observable<UsuarioResponse> {
    return this.http.post<UsuarioResponse>(this.baseUrl, payload);
  }
  
  listarUsuarios(): Observable<UsuarioResponse[]> {
    return this.http.get<UsuarioResponse[]>(this.baseUrl);
  }
  
  buscarPorId(id: number): Observable<UsuarioResponse> {
    return this.http.get<UsuarioResponse>(`${this.baseUrl}/${id}`);
  }
  
  buscarPorPerfil(userProfile: string): Observable<UsuarioResponse> {
    return this.http.get<UsuarioResponse>(`${this.baseUrl}/perfil/${encodeURIComponent(userProfile)}`);
  }
  
  guardarPersonalizacion(
    usuarioId: number, 
    payload: UsuarioPersonalizacionRequest
  ): Observable<UsuarioResponse> {
    return this.http.patch<UsuarioResponse>(
      `${this.baseUrl}/${usuarioId}/personalizacion`, 
      payload
    );
  }
}
```

#### PuntuacionApiService
```typescript
@Injectable({ providedIn: 'root' })
export class PuntuacionApiService {
  private readonly baseUrl = `${API_BASE_URL}/puntuaciones`;
  
  constructor(private readonly http: HttpClient) {}
  
  guardarPuntuacion(payload: PuntuacionRequest): Observable<PuntuacionResponse> {
    return this.http.post<PuntuacionResponse>(this.baseUrl, payload);
  }
  
  listarPorUsuario(usuarioId: number): Observable<PuntuacionResponse[]> {
    return this.http.get<PuntuacionResponse[]>(`${this.baseUrl}/usuario/${usuarioId}`);
  }
  
  rankingPorJuego(
    juego: 'TETRIS' | 'SNAKE' | 'BRICK_BREAKER' | 'PING_PONG'
  ): Observable<PuntuacionResponse[]> {
    return this.http.get<PuntuacionResponse[]>(`${this.baseUrl}/ranking/${juego}`);
  }
}
```

---

## 🔌 Comunicación WebSocket

### 1. Conexión Inicial

**Frontend - `ping-pong-realtime.service.ts`:**
```typescript
connectToWebSocket(playerName: string): Observable<PingPongRealtimeState> {
  return webSocket(`ws://localhost:8080/ws/ping-pong?player=${playerName}`)
    .pipe(
      map(event => this.parseMessage(event as MessageEvent)),
      share(),
      retryWhen(errors => 
        errors.pipe(
          concatMap(error => {
            console.log('WebSocket error, reconnecting...', error);
            return timer(1000, 1000); // Reintentar cada 1s
          }),
          take(5) // Max 5 intentos
        )
      )
    );
}
```

**Backend - `WebSocketConfig.java`:**
```java
@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {
  @Override
  public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
    registry.addHandler(pingPongWebSocketHandler(), "/ws/ping-pong")
            .setAllowedOrigins("*");
  }
}
```

### 2. Flujo de Juego Multijugador

```
JUGADOR 1              SERVIDOR              JUGADOR 2
    │                     │                      │
    │ ws://connect        │                      │
    ├────────────────────>│                      │
    │                     │                      │
    │                     │ Matchmaking          │
    │                     │ (esperando jugador)  │
    │                     │                      │
    │                     │<─ ws://connect       │
    │                     │ (JUGADOR 2)          │
    │                     │                      │
    │  {"status":"PREVIEW"}                      │
    │<────────────────────┤────────────────────>│
    │   (PREVIEW STATE)   │   (PREVIEW STATE)    │
    │                     │                      │
    │   {"type":"preview_decision",             │
    │    "accept": true}                        │
    ├────────────────────>│                      │
    │                     │                      │
    │                     │──┐ Ambos aceptaron?  │
    │                     │  │ SÍ → PLAYING      │
    │                     │<─┘                  │
    │                     │                      │
    │  {"status":"PLAYING"}                      │
    │<────────────────────┤────────────────────>│
    │   Juego comienza    │   Juego comienza    │
    │                     │                      │
    │ {"type":"paddle",   │                      │
    │  "y": 0.5}          │                      │
    ├────────────────────>│ Actualizar posición │
    │                     │ y recalcular física │
    │                     │                      │
    │  {"type":"paddle",  │                      │
    │   "x": 0.1,         │                      │
    │   "y": 0.3, ...}    │                      │
    │<────────────────────┤<─ Jugador 2 movió  │
    │  GAME STATE         │                      │
    │  (pelota, scores)   │                      │
    │                     │                      │
    │   Fin del juego     │                      │
    │<────────────────────┤────────────────────>│
    │  {"status":"FINISHED"}                     │
    │  (mostrar rematch?  │  (mostrar rematch?)  │
    │                     │                      │
    ▼                     ▼                      ▼
```

### 3. Estructura de Mensajes WebSocket

**Mensaje de Estado:**
```json
{
  "type": "state",
  "status": "PREVIEW|PLAYING|FINISHED|WAITING",
  "roomId": "room_123",
  "previewLeftName": "John",
  "previewRightName": "Jane",
  "previewLeftAccepted": false,
  "previewRightAccepted": true,
  "leftPaddle": 0.5,
  "rightPaddle": 0.3,
  "ballX": 0.5,
  "ballY": 0.5,
  "leftScore": 5,
  "rightScore": 3
}
```

**Mensaje de Movimiento:**
```json
{
  "type": "paddle",
  "y": 0.45
}
```

**Mensaje de Decisión Preview:**
```json
{
  "type": "preview_decision",
  "accept": true
}
```

**Mensaje de Decisión Rematch:**
```json
{
  "type": "rematch",
  "accept": true
}
```

---

## 🔄 Flujo Completo: Login → Juego

```
┌─────────────────────────────────────────────────────────────────┐
│ FASE 1: AUTENTICACIÓN (HTTP)                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│ 1. Usuario ingresa: usuario="john", contraseña="123"             │
│ 2. Angular: POST /api/auth/login                                 │
│ 3. Spring: Validar en BD, encriptar contraseña                   │
│ 4. Respuesta: { id: 1, usuario: "john", ... }                   │
│ 5. Angular: Guardar en sessionStorage                            │
│ 6. Redirigir a /home                                             │
│                                                                   │
└──────────────────────┬────────────────────────────────────────┘
                       │
┌──────────────────────▼────────────────────────────────────────┐
│ FASE 2: CARGAR DATOS DE PERFIL (HTTP)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│ 1. Angular: GET /api/usuarios/{usuarioId}                        │
│ 2. Spring: Buscar usuario por ID                                │
│ 3. Respuesta: { fotoPerfil, colorPrimario, ... }                │
│ 4. Angular: Mostrar perfil personalizado                         │
│                                                                   │
└──────────────────────┬──────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│ FASE 3: CARGAR RANKING (HTTP)                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│ 1. Angular: GET /api/puntuaciones/ranking/PING_PONG              │
│ 2. Spring: Consultar TOP 10 jugadores                            │
│ 3. Respuesta: [ { usuario, puntos }, ... ]                       │
│ 4. Angular: Mostrar en tabla de rankings                         │
│                                                                   │
└──────────────────────┬──────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│ FASE 4: INICIAR JUEGO MULTIJUGADOR (WebSocket)                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│ 1. Angular: Conectar a ws://localhost:8080/ws/ping-pong          │
│ 2. Spring: Crear sesión, intentar matchmaking                    │
│ 3. Esperar a un segundo jugador...                               │
│ 4. Ambos jugadores conectados: cambiar a PREVIEW                 │
│ 5. Mostrar modal: "¿Aceptar juego?"                              │
│                                                                   │
└──────────────────────┬──────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│ FASE 5: CONFIRMAR PREVIEW (WebSocket)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│ 1. Angular: Enviar {"type":"preview_decision","accept":true}     │
│ 2. Spring: Guardar decisión en RoomState                         │
│ 3. Si ambos aceptaron: cambiar a PLAYING                         │
│ 4. Iniciar bucle de juego (16ms ticks)                           │
│ 5. Ambos reciben estado del juego cada tick                      │
│                                                                   │
└──────────────────────┬──────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│ FASE 6: JUEGO EN VIVO (WebSocket Bidireccional)                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│ CADA TICK (16ms):                                                 │
│                                                                   │
│ ┌─ Angular J1                                                    │
│ │  1. Detectar movimiento del mouse/teclado                      │
│ │  2. Enviar posición del paddle: {"type":"paddle","y":0.45}    │
│ │  3. Recibir estado del servidor                                │
│ │  4. Renderizar en canvas                                       │
│ │                                                                 │
│ ├─ Spring Boot                                                    │
│ │  1. Recibir inputs de ambos jugadores                          │
│ │  2. Actualizar posiciones de paddles                           │
│ │  3. Calcular colisiones                                        │
│ │  4. Mover pelota                                               │
│ │  5. Verificar goals                                            │
│ │  6. Actualizar scores                                          │
│ │  7. Enviar estado a ambos clientes                             │
│ │                                                                 │
│ └─ Angular J2                                                    │
│    1. Detectar movimiento del mouse/teclado                      │
│    2. Enviar posición del paddle                                 │
│    3. Recibir estado del servidor                                │
│    4. Renderizar en canvas                                       │
│                                                                   │
│ Repetir 60 veces por segundo                                      │
│                                                                   │
└──────────────────────┬──────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│ FASE 7: FIN DEL JUEGO (HTTP + WebSocket)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│ 1. Spring: Detectar que alguien llegó a score máximo             │
│ 2. Cambiar estado a FINISHED                                     │
│ 3. Angular: Mostrar ganador y puntos finales                     │
│ 4. Angular: POST /api/puntuaciones (guardar puntaje)             │
│ 5. Spring: Guardar en BD                                         │
│ 6. Angular: Mostrar modal "¿Rematch?"                            │
│ 7. Esperar decisiones de ambos jugadores                         │
│                                                                   │
└──────────────────────┬──────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│ FASE 8: REMATCH O DESCONEXIÓN                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│ Si ambos aceptan rematch:                                        │
│ • Volver a PLAYING (nuevos scores)                               │
│ • Repetir FASE 6                                                 │
│                                                                   │
│ Si solo uno acepta:                                              │
│ • Desconectar el que rechaza                                     │
│ • El otro vuelve a matchmaking                                   │
│                                                                   │
│ Si nadie acepta:                                                 │
│ • Cerrar WebSocket                                               │
│ • Volver a home                                                  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## ⚠️ Manejo de Errores

### HTTP Errors

```typescript
// Frontend
this.userService.buscarPorId(999).subscribe({
  next: (response) => { /* success */ },
  error: (error) => {
    if (error.status === 404) {
      console.log('Usuario no encontrado');
    } else if (error.status === 400) {
      console.log('Solicitud inválida:', error.error.errores);
    } else if (error.status === 500) {
      console.log('Error del servidor');
    }
  }
});
```

```java
// Backend - GlobalExceptionHandler.java
@RestControllerAdvice
public class GlobalExceptionHandler {
  
  @ExceptionHandler(ResourceNotFoundException.class)
  public ResponseEntity<Map<String, Object>> handleNotFound(
    ResourceNotFoundException ex) {
    return buildError(HttpStatus.NOT_FOUND, ex.getMessage());
  }
  
  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<Map<String, Object>> handleValidation(
    MethodArgumentNotValidException ex) {
    // Validations errors
  }
}
```

### WebSocket Errors

```typescript
// Frontend
this.realtimeService.connect(playerName).subscribe({
  error: (error) => {
    console.log('WebSocket disconnected:', error);
    // Intentar reconectar automáticamente
  }
});
```

```java
// Backend - WebSocketHandler
@Override
public void handleTransportError(WebSocketSession session, Throwable exception) {
  System.out.println("Transport error: " + exception.getMessage());
  // Limpiar sesión
}
```

---

## 🔒 Seguridad CORS

### ¿Qué es CORS?

Cross-Origin Resource Sharing (CORS) permite que un navegador solicite recursos desde un servidor diferente.

**Riesgo:** Sin CORS, malicious websites podrían robar datos.

### Configuración en Spring Boot

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
  
  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    
    // Origen permitido
    config.setAllowedOrigins(List.of(
      "http://localhost:4200",        // Desarrollo
      "https://gizmolandia.com"       // Producción
    ));
    
    // Métodos HTTP permitidos
    config.setAllowedMethods(List.of(
      "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"
    ));
    
    // Headers permitidos
    config.setAllowedHeaders(List.of("*"));
    
    // Permitir cookies
    config.setAllowCredentials(true);
    
    UrlBasedCorsConfigurationSource source = 
      new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
  }
}
```

### Flujo de Validación CORS

```
1. Angular envía: Origin: http://localhost:4200
2. Spring verifica en setAllowedOrigins()
3. Si está permitido:
   ✓ Response con Access-Control-Allow-Origin header
4. Si NO está permitido:
   ✗ Response bloqueado en el navegador
```

---

## 📊 Diagrama de Arquitectura General

```
┌────────────────────────────────────────────────────────────────┐
│                    CLIENTE (NAVEGADOR)                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   ANGULAR 17                             │  │
│  │  ┌──────────────────────────────────────────────────┐   │  │
│  │  │              COMPONENTES                         │   │  │
│  │  │  UserForm  │  Home  │  Games  │ Ping Pong      │   │  │
│  │  └──────────────────────────────────────────────────┘   │  │
│  │  ┌──────────────────────────────────────────────────┐   │  │
│  │  │            SERVICIOS (HTTP + WS)               │   │  │
│  │  │  AuthApiService  │ UsuarioApiService          │   │  │
│  │  │  PuntuacionApiService  │ RealtimeService      │   │  │
│  │  └──────────────────────────────────────────────────┘   │  │
│  │  ┌──────────────────────────────────────────────────┐   │  │
│  │  │          HTTP CLIENT + RxJS                     │   │  │
│  │  └──────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
│              HTTPS + WebSocket (WS)                             │
└─────────────────────────┬──────────────────────────────────────┘
                          │
                    ┌─────┴─────┐
                    │           │
              HTTP REST      WebSocket
              (Port 80)      (Port 8080)
                    │           │
                    ▼           ▼
┌────────────────────────────────────────────────────────────────┐
│              SERVIDOR (SPRING BOOT 4.0.5)                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │            CAPAS DE APLICACIÓN                           │  │
│  │  ┌─────────────────────────────────────────────────┐    │  │
│  │  │ CONTROLLERS (REST Endpoints)                    │    │  │
│  │  │ /api/auth  │ /api/usuarios  │ /api/puntuaciones│    │  │
│  │  │ + WebSocket Handler                            │    │  │
│  │  └─────────────────────────────────────────────────┘    │  │
│  │  ┌─────────────────────────────────────────────────┐    │  │
│  │  │ SERVICIOS (Lógica de Negocio)                  │    │  │
│  │  │ AuthService  │ UsuarioService                  │    │  │
│  │  │ PuntuacionService  │ PingPongRealtimeService   │    │  │
│  │  └─────────────────────────────────────────────────┘    │  │
│  │  ┌─────────────────────────────────────────────────┐    │  │
│  │  │ REPOSITORIES (Acceso a Datos)                  │    │  │
│  │  │ JPA Repositories                               │    │  │
│  │  └─────────────────────────────────────────────────┘    │  │
│  │  ┌─────────────────────────────────────────────────┐    │  │
│  │  │ MODELOS (Entidades JPA)                        │    │  │
│  │  │ Usuario  │ Puntuacion  │ Etc...               │    │  │
│  │  └─────────────────────────────────────────────────┘    │  │
│  │  ┌─────────────────────────────────────────────────┐    │  │
│  │  │ CONFIG (Seguridad, WS, CORS)                  │    │  │
│  │  │ SecurityConfig  │ WebSocketConfig             │    │  │
│  │  └─────────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │             ACCESO A DATOS                               │  │
│  │  ┌────────────────────────────────────────────────┐     │  │
│  │  │  HIBERNATE / JPA                              │     │  │
│  │  └────────────────────────────────────────────────┘     │  │
│  │  ┌────────────────────────────────────────────────┐     │  │
│  │  │  JDBC / DataSource                            │     │  │
│  │  └────────────────────────────────────────────────┘     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────┬──────────────────────┬──────────────────────┘
                  │                      │
              JDBC              Operating System
                  │                      │
                  ▼                      ▼
        ┌──────────────────┐      ┌──────────────────┐
        │    MySQL 8.0+    │      │  File System     │
        │   (localhost:    │      │  (Imágenes,      │
        │    3306)         │      │   assets)        │
        │  ┌────────────┐  │      │                  │
        │  │ db (base)  │  │      │                  │
        │  │ ┌────────┐ │  │      └──────────────────┘
        │  │ │usuario │ │  │
        │  │ │puntuac │ │  │
        │  │ │etc...  │ │  │
        │  │ └────────┘ │  │
        │  └────────────┘  │
        └──────────────────┘
```

---

**Última actualización**: Marzo 2026  
**Versión**: 1.0
