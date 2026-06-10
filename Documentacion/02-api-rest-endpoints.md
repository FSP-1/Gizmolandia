# 🔌 API REST Endpoints - Gizmolandia

## 📋 Índice

- [Introducción](#introducción)
- [Autenticación](#autenticación)
- [Usuarios](#usuarios)
- [Puntuaciones](#puntuaciones)
- [Chat General](#chat-general)
- [WebSocket](#websocket)
- [Códigos de Estado](#códigos-de-estado)
- [Ejemplos cURL](#ejemplos-curl)

---

## 🎯 Introducción

### Base URL

```
http://localhost:8080/api
```

### Headers Requeridos

```
Content-Type: application/json
Accept: application/json
```

### CORS

- **Origen permitido**: `http://localhost:4200` (desarrollo)
- **Métodos permitidos**: GET, POST, PUT, PATCH, DELETE, OPTIONS

---

## 💬 Chat General

Base:

```
http://localhost:8080/api/chat
```

### POST /api/chat/{roomType}/join?usuarioId={id}

Descripcion: marca usuario activo en la sala.

### POST /api/chat/{roomType}/leave?usuarioId={id}

Descripcion: marca usuario inactivo en la sala.

### GET /api/chat/{roomType}/mensajes?limit=60

Descripcion: devuelve ultimos mensajes de la sala.

### POST /api/chat/mensajes

Descripcion: crea mensaje de chat.

Request ejemplo:

```json
{
  "usuarioId": 1,
  "roomType": "NORMAL",
  "commentText": "Hola",
  "mediaUrl": "http://localhost:8080/api/chat/media/archivo.jpg",
  "puntuacionId": null
}
```

Validaciones clave:

- commentText obligatorio
- mediaUrl opcional y corta (no base64)
- en sala JUEGOS, puntuacionId obligatorio

### POST /api/chat/media/upload

Descripcion: sube imagen/GIF del chat por multipart.

Tipo: multipart/form-data

Campo requerido:

- file

Response ejemplo:

```json
{
  "mediaUrl": "http://localhost:8080/api/chat/media/abc123.jpg",
  "mediaType": "IMAGE",
  "fileName": "abc123.jpg"
}
```

### GET /api/chat/media/{fileName}

Descripcion: sirve el archivo guardado para renderizar en UI.

### GET /api/chat/juegos/puntuaciones/{usuarioId}

Descripcion: devuelve puntuaciones del usuario para habilitar la sala JUEGOS.

Para detalle funcional completo, ver: [04 - Chat General y Media Upload](04-chat-general-media-upload.md)

Para diagramas de secuencia por endpoint (join, upload, send, list, load media, leave y score options), ver seccion "Diagramas de secuencia por endpoint" en [04 - Chat General y Media Upload](04-chat-general-media-upload.md#diagramas-de-secuencia-por-endpoint)

---

## 🔐 Autenticación

### POST /api/auth/login

**Descripción**: Iniciar sesión con usuario y contraseña

**Request Body**:

```json
{
  "usuario": "john",
  "contraseña": "123456"
}
```

**Response (200 OK)**:

```json
{
  "id": 1,
  "usuario": "john",
  "email": "john@example.com",
  "fotoPerfil": "avatar1.png",
  "colorPrimario": "#FF5733",
  "colorSecundario": "#33FF57",
  "temaNoche": false
}
```

**Response (404 Not Found)**:

```json
{
  "timestamp": "2026-03-26T10:30:00.000Z",
  "status": 404,
  "mensaje": "Usuario no encontrado"
}
```

**Response (401 Unauthorized)**:

```json
{
  "timestamp": "2026-03-26T10:30:00.000Z",
  "status": 401,
  "mensaje": "Contraseña incorrecta"
}
```

**cURL**:

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usuario":"john","contraseña":"123456"}'
```

---

## 👥 Usuarios

### POST /api/usuarios

**Descripción**: Crear nuevo usuario (registro)

**Request Body**:

```json
{
  "usuario": "jane",
  "email": "jane@example.com",
  "contraseña": "securePass123"
}
```

**Response (201 Created)**:

```json
{
  "id": 2,
  "usuario": "jane",
  "email": "jane@example.com",
  "fotoPerfil": "default_avatar.png",
  "colorPrimario": "#0066FF",
  "colorSecundario": "#00FF99",
  "temaNoche": false
}
```

**Response (400 Bad Request)**:

```json
{
  "timestamp": "2026-03-26T10:30:00.000Z",
  "status": 400,
  "errores": {
    "usuario": "El usuario ya existe",
    "email": "El email ya está registrado"
  }
}
```

**cURL**:

```bash
curl -X POST http://localhost:8080/api/usuarios \
  -H "Content-Type: application/json" \
  -d '{
    "usuario":"jane",
    "email":"jane@example.com",
    "contraseña":"securePass123"
  }'
```

---

### GET /api/usuarios

**Descripción**: Listar todos los usuarios

**Response (200 OK)**:

```json
[
  {
    "id": 1,
    "usuario": "john",
    "email": "john@example.com",
    "fotoPerfil": "avatar1.png",
    "colorPrimario": "#FF5733",
    "colorSecundario": "#33FF57",
    "temaNoche": false
  },
  {
    "id": 2,
    "usuario": "jane",
    "email": "jane@example.com",
    "fotoPerfil": "avatar2.png",
    "colorPrimario": "#0066FF",
    "colorSecundario": "#00FF99",
    "temaNoche": true
  }
]
```

**cURL**:

```bash
curl http://localhost:8080/api/usuarios
```

---

### GET /api/usuarios/

**Descripción**: Obtener usuario por ID

**Parámetros**:

- `id` (path): ID del usuario (número)

**Response (200 OK)**:

```json
{
  "id": 1,
  "usuario": "john",
  "email": "john@example.com",
  "fotoPerfil": "avatar1.png",
  "colorPrimario": "#FF5733",
  "colorSecundario": "#33FF57",
  "temaNoche": false
}
```

**Response (404 Not Found)**:

```json
{
  "timestamp": "2026-03-26T10:30:00.000Z",
  "status": 404,
  "mensaje": "Usuario no encontrado"
}
```

**cURL**:

```bash
curl http://localhost:8080/api/usuarios/1
```

---

### GET /api/usuarios/perfil-publico/{userProfile}

**Descripción**: Obtener los datos necesarios para renderizar el home publico de otro usuario usando su nombre de perfil publico, no su ID.

**Parámetros**:

- `userProfile` (path): nombre publico del perfil.

**Response (200 OK)**:

```json
{
  "id": 2,
  "nombre": "player_2",
  "userProfile": "Player Two",
  "nacionalidad": "ES",
  "edad": 25,
  "foto": "data:image/png;base64,...",
  "homeBackgroundColor": "#667eea",
  "homeLeftImage": "",
  "homeRightImage": "",
  "homeStatus": "Listo para jugar",
  "homeNameColor": "#ffffff",
  "preferredLanguage": "es",
  "fechaRegistro": "2026-06-10T10:30:00"
}
```

**Uso frontend**:

- Ruta: `/home/profile/{userProfile}`
- No se abre para el usuario de la sesion actual.
- La ruta publica rechaza valores numericos puros para evitar recorrer perfiles con `/profile/1`, `/profile/2`, etc.
- La vista no muestra acciones privadas como personalizar, juegos, coding, chat, music creation o logout.

**cURL**:

```bash
curl http://localhost:8080/api/usuarios/perfil-publico/PlayerTwo
```

---

### GET /api/usuarios/perfil/

**Descripción**: Obtener usuario por nombre de perfil (username)

**Parámetros**:

- `userProfile` (path): Nombre de usuario

**Response (200 OK)**:

```json
{
  "id": 1,
  "usuario": "john",
  "email": "john@example.com",
  "fotoPerfil": "avatar1.png",
  "colorPrimario": "#FF5733",
  "colorSecundario": "#33FF57",
  "temaNoche": false
}
```

**Response (404 Not Found)**:

```json
{
  "timestamp": "2026-03-26T10:30:00.000Z",
  "status": 404,
  "mensaje": "Usuario 'notfound' no encontrado"
}
```

**cURL**:

```bash
curl http://localhost:8080/api/usuarios/perfil/john
```

---

### PUT /api/usuarios/

**Descripción**: Actualizar usuario completo

**Parámetros**:

- `id` (path): ID del usuario

**Request Body**:

```json
{
  "usuario": "john_updated",
  "email": "newemail@example.com",
  "contraseña": "newPassword123",
  "fotoPerfil": "avatar_new.png"
}
```

**Response (200 OK)**:

```json
{
  "id": 1,
  "usuario": "john_updated",
  "email": "newemail@example.com",
  "fotoPerfil": "avatar_new.png",
  "colorPrimario": "#FF5733",
  "colorSecundario": "#33FF57",
  "temaNoche": false
}
```

**cURL**:

```bash
curl -X PUT http://localhost:8080/api/usuarios/1 \
  -H "Content-Type: application/json" \
  -d '{
    "usuario":"john_updated",
    "email":"newemail@example.com",
    "contraseña":"newPassword123",
    "fotoPerfil":"avatar_new.png"
  }'
```

---

### PATCH /api/usuarios//personalizacion

**Descripción**: Actualizar solo los datos de personalización del usuario

**Parámetros**:

- `id` (path): ID del usuario

**Request Body** (cualquiera de estos campos):

```json
{
  "fotoPerfil": "avatar_premium.png",
  "colorPrimario": "#FF00FF",
  "colorSecundario": "#00FFFF",
  "temaNoche": true
}
```

**Response (200 OK)**:

```json
{
  "id": 1,
  "usuario": "john",
  "email": "john@example.com",
  "fotoPerfil": "avatar_premium.png",
  "colorPrimario": "#FF00FF",
  "colorSecundario": "#00FFFF",
  "temaNoche": true
}
```

**cURL**:

```bash
curl -X PATCH http://localhost:8080/api/usuarios/1/personalizacion \
  -H "Content-Type: application/json" \
  -d '{
    "fotoPerfil":"avatar_premium.png",
    "colorPrimario":"#FF00FF",
    "temaNoche":true
  }'
```

---

### DELETE /api/usuarios/

**Descripción**: Eliminar usuario

**Parámetros**:

- `id` (path): ID del usuario

**Response (204 No Content)**:

```
(Sin body)
```

**Response (404 Not Found)**:

```json
{
  "timestamp": "2026-03-26T10:30:00.000Z",
  "status": 404,
  "mensaje": "Usuario no encontrado"
}
```

**cURL**:

```bash
curl -X DELETE http://localhost:8080/api/usuarios/1
```

---

## 🏆 Puntuaciones

### POST /api/puntuaciones

**Descripción**: Guardar puntuación de una partida

**Request Body**:

```json
{
  "usuarioId": 1,
  "juego": "PING_PONG",
  "puntos": 15,
  "tiempoJuego": 120,
  "resultado": "VICTORIA",
  "oponente": "jane"
}
```

**Valores válidos para `juego`**:

- `TETRIS`
- `SNAKE`
- `BRICK_BREAKER`
- `PING_PONG`

**Valores válidos para `resultado`**:

- `VICTORIA`
- `DERROTA`
- `EMPATE`

**Response (201 Created)**:

```json
{
  "id": 1,
  "usuarioId": 1,
  "juego": "PING_PONG",
  "puntos": 15,
  "tiempoJuego": 120,
  "resultado": "VICTORIA",
  "oponente": "jane",
  "fechaCreacion": "2026-03-26T10:30:00.000Z"
}
```

**Response (400 Bad Request)**:

```json
{
  "timestamp": "2026-03-26T10:30:00.000Z",
  "status": 400,
  "errores": {
    "juego": "El valor 'INVALIDO' no es válido. Valores permitidos: TETRIS, SNAKE, BRICK_BREAKER, PING_PONG"
  }
}
```

**cURL**:

```bash
curl -X POST http://localhost:8080/api/puntuaciones \
  -H "Content-Type: application/json" \
  -d '{
    "usuarioId":1,
    "juego":"PING_PONG",
    "puntos":15,
    "tiempoJuego":120,
    "resultado":"VICTORIA",
    "oponente":"jane"
  }'
```

---

### GET /api/puntuaciones/usuario/

**Descripción**: Obtener historial de puntuaciones de un usuario

**Parámetros**:

- `usuarioId` (path): ID del usuario

**Query Parameters** (opcional):

- `juego` (query): Filtrar por juego (TETRIS, SNAKE, BRICK_BREAKER, PING_PONG)
- `limit` (query): Número máximo de resultados (default: 100)

**Response (200 OK)**:

```json
[
  {
    "id": 1,
    "usuarioId": 1,
    "juego": "PING_PONG",
    "puntos": 15,
    "tiempoJuego": 120,
    "resultado": "VICTORIA",
    "oponente": "jane",
    "fechaCreacion": "2026-03-26T10:30:00.000Z"
  },
  {
    "id": 2,
    "usuarioId": 1,
    "juego": "TETRIS",
    "puntos": 2500,
    "tiempoJuego": 180,
    "resultado": "VICTORIA",
    "oponente": null,
    "fechaCreacion": "2026-03-26T09:15:30.000Z"
  }
]
```

**cURL**:

```bash
# Obtener todas las puntuaciones del usuario 1
curl http://localhost:8080/api/puntuaciones/usuario/1

# Obtener solo puntuaciones de PING_PONG
curl "http://localhost:8080/api/puntuaciones/usuario/1?juego=PING_PONG"

# Obtener últimas 10 puntuaciones
curl "http://localhost:8080/api/puntuaciones/usuario/1?limit=10"
```

---

### GET /api/puntuaciones/ranking/

**Descripción**: Obtener ranking global de un juego (TOP N jugadores)

**Parámetros**:

- `juego` (path): Nombre del juego
  - `TETRIS`
  - `SNAKE`
  - `BRICK_BREAKER`
  - `PING_PONG`

**Query Parameters** (opcional):

- `limit` (query): Número de jugadores en el ranking (default: 10)

**Response (200 OK)**:

```json
[
  {
    "id": 1,
    "usuarioId": 1,
    "usuario": "john",
    "juego": "PING_PONG",
    "puntos": 500,
    "tiempoJuego": 1200,
    "resultado": "VICTORIA",
    "oponente": null,
    "fechaCreacion": "2026-03-26T10:30:00.000Z"
  },
  {
    "id": 3,
    "usuarioId": 2,
    "usuario": "jane",
    "juego": "PING_PONG",
    "puntos": 480,
    "tiempoJuego": 950,
    "resultado": "VICTORIA",
    "oponente": null,
    "fechaCreacion": "2026-03-26T10:25:00.000Z"
  },
  {
    "id": 5,
    "usuarioId": 3,
    "usuario": "bob",
    "juego": "PING_PONG",
    "puntos": 450,
    "tiempoJuego": 1100,
    "resultado": "VICTORIA",
    "oponente": null,
    "fechaCreacion": "2026-03-26T10:20:00.000Z"
  }
]
```

**Response (400 Bad Request)**:

```json
{
  "timestamp": "2026-03-26T10:30:00.000Z",
  "status": 400,
  "mensaje": "El juego 'INVALIDO' no existe. Juegos válidos: TETRIS, SNAKE, BRICK_BREAKER, PING_PONG"
}
```

**cURL**:

```bash
# Top 10 de PING_PONG
curl http://localhost:8080/api/puntuaciones/ranking/PING_PONG

# Top 20 de TETRIS
curl "http://localhost:8080/api/puntuaciones/ranking/TETRIS?limit=20"

# Top 5 de SNAKE
curl "http://localhost:8080/api/puntuaciones/ranking/SNAKE?limit=5"
```

---

## 🎮 WebSocket

### Conectar

```
ws://localhost:8080/ws/ping-pong?player=<playerName>
```

**Parámetros**:

- `player` (query): Nombre del jugador

**Ejemplo**:

```javascript
const ws = new WebSocket('ws://localhost:8080/ws/ping-pong?player=john');

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Mensaje recibido:', message);
};

ws.onerror = (error) => {
  console.log('Error WebSocket:', error);
};

ws.onclose = () => {
  console.log('WebSocket cerrado');
};
```

### Mensajes del Cliente → Servidor

#### 1. Movimiento del Paddle

```json
{
  "type": "paddle",
  "y": 0.45
}
```

- `y`: Posición vertical del paddle (0.0 - 1.0, donde 0.5 es centro)

#### 2. Decisión de Preview

```json
{
  "type": "preview_decision",
  "accept": true
}
```

- `accept`: true = aceptar juego, false = rechazar

#### 3. Decisión de Rematch

```json
{
  "type": "rematch",
  "accept": true
}
```

- `accept`: true = aceptar rematch, false = rechazar

### Mensajes del Servidor → Cliente

#### Estado del Juego

```json
{
  "type": "state",
  "status": "PLAYING",
  "roomId": "room_123",
  "previewLeftName": "john",
  "previewRightName": "jane",
  "previewLeftAccepted": true,
  "previewRightAccepted": false,
  "leftPaddle": 0.5,
  "rightPaddle": 0.3,
  "ballX": 0.5,
  "ballY": 0.4,
  "ballVelocityX": 0.02,
  "ballVelocityY": 0.01,
  "leftScore": 5,
  "rightScore": 3,
  "previewTimeout": 8000,
  "isLeftPlayer": true
}
```

**Valores de `status`**:

- `WAITING`: Esperando jugador
- `PREVIEW`: Mostrando preview antes de jugar
- `PLAYING`: Juego en vivo
- `FINISHED`: Juego terminado

#### Mensajes de Control

**Desconexión limpia**:

```json
{
  "type": "disconnect",
  "message": "El oponente se desconectó"
}
```

**Error**:

```json
{
  "type": "error",
  "message": "Error en el servidor del juego"
}
```

---

## 📊 Códigos de Estado HTTP

| Código       | Significado           | Descripción                                |
| ------------- | --------------------- | ------------------------------------------- |
| **200** | OK                    | Solicitud exitosa, datos retornados         |
| **201** | Created               | Recurso creado exitosamente                 |
| **204** | No Content            | Solicitud exitosa, sin contenido            |
| **400** | Bad Request           | Parámetros inválidos o formato incorrecto |
| **401** | Unauthorized          | Autenticación fallida                      |
| **404** | Not Found             | Recurso no encontrado                       |
| **409** | Conflict              | Conflicto (ej: usuario ya existe)           |
| **500** | Internal Server Error | Error en el servidor                        |
| **503** | Service Unavailable   | Servidor no disponible                      |

---

## 📝 Ejemplos cURL

### 1. Registro de Usuario

```bash
curl -X POST http://localhost:8080/api/usuarios \
  -H "Content-Type: application/json" \
  -d '{
    "usuario": "newuser",
    "email": "newuser@example.com",
    "contraseña": "SecurePass123!"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "usuario": "newuser",
    "contraseña": "SecurePass123!"
  }'
```

### 3. Obtener Perfil

```bash
curl http://localhost:8080/api/usuarios/1
```

### 4. Actualizar Personalización

```bash
curl -X PATCH http://localhost:8080/api/usuarios/1/personalizacion \
  -H "Content-Type: application/json" \
  -d '{
    "colorPrimario": "#FF0000",
    "temaNoche": true
  }'
```

### 5. Guardar Puntuación

```bash
curl -X POST http://localhost:8080/api/puntuaciones \
  -H "Content-Type: application/json" \
  -d '{
    "usuarioId": 1,
    "juego": "PING_PONG",
    "puntos": 20,
    "tiempoJuego": 180,
    "resultado": "VICTORIA",
    "oponente": "jane"
  }'
```

### 6. Ver Ranking de PING_PONG

```bash
curl http://localhost:8080/api/puntuaciones/ranking/PING_PONG?limit=5
```

### 7. Ver Historial del Usuario

```bash
curl http://localhost:8080/api/puntuaciones/usuario/1
```

---

---

**Última actualización**: Marzo 2026
**Versión**: 1.0
