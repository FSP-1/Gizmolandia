# Chat General y Subida de Media

## Objetivo

Este documento describe la arquitectura y el flujo actual del Chat General, incluyendo la separacion entre:

- envio de comentario (JSON liviano)
- subida de archivo (multipart)

Tambien documenta reglas de negocio, validaciones y errores frecuentes.

---

## Resumen funcional

El chat en Home se organiza en tres salas:

- NORMAL
- JUEGOS
- NERD_STUFF

Reglas activas:

- maximo 10 usuarios activos por sala
- maximo 500 palabras por comentario
- en sala JUEGOS es obligatorio enviar puntuacion asociada
- solo imagenes o GIF para media
- la media ya no se envia en base64 dentro del comentario

---

## Cambio importante del flujo

Antes:

- el frontend convertia la imagen a data URL base64
- el comentario enviaba ese string largo en mediaUrl

Ahora:

- el frontend sube primero el archivo por multipart
- backend guarda archivo en disco y devuelve mediaUrl corta
- el comentario se envia despues con esa URL corta

Beneficios:

- payload del comentario mucho mas pequeno
- menos errores de validacion por longitud de mediaUrl
- separacion clara entre transporte de archivo y dominio del chat

---

## Arquitectura por capas

Frontend:

- componente contenedor: GeneralChatComponent
- componente de composicion: ChatComposeBoxComponent
- servicio HTTP: ChatApiService

Backend:

- controlador REST: ChatController
- logica de negocio: ChatServiceImpl
- DTO upload response: ChatMediaUploadResponseDTO
- DTO mensaje: ChatMessageRequestDTO

Persistencia:

- tabla chat_messages guarda mediaUrl (URL corta)
- archivos de media en uploads/chat-media

---

## Endpoints del modulo Chat

Base:

- http://localhost:8080/api/chat

### 1) Entrar a sala

- POST /{roomType}/join?usuarioId={id}

Response:

```json
{
  "roomType": "NORMAL",
  "usuarioId": 1,
  "activeUsers": 3,
  "maxUsers": 10,
  "joined": true
}
```

### 2) Salir de sala

- POST /{roomType}/leave?usuarioId={id}

### 3) Listar mensajes

- GET /{roomType}/mensajes?limit=60

### 4) Enviar mensaje

- POST /mensajes
- Content-Type: application/json

Request:

```json
{
  "usuarioId": 1,
  "roomType": "NORMAL",
  "commentText": "Hola a todos",
  "mediaUrl": "http://localhost:8080/api/chat/media/a1b2c3d4.jpg",
  "puntuacionId": null
}
```

Notas:

- mediaUrl es opcional
- en sala JUEGOS, puntuacionId es obligatorio

### 5) Subir media

- POST /media/upload
- Content-Type: multipart/form-data
- campo requerido: file

Response:

```json
{
  "mediaUrl": "http://localhost:8080/api/chat/media/a1b2c3d4.jpg",
  "mediaType": "IMAGE",
  "fileName": "a1b2c3d4.jpg"
}
```

### 6) Servir media

- GET /media/{fileName}

Devuelve el archivo con content-type detectado.

### 7) Puntuaciones para sala JUEGOS

- GET /juegos/puntuaciones/{usuarioId}

---

## Flujo completo de envio con imagen

1. Usuario selecciona archivo en ChatComposeBoxComponent.
2. Front valida MIME permitido y limite de peso.
3. Front llama uploadMedia(file).
4. Backend valida archivo, guarda en uploads/chat-media y responde mediaUrl.
5. Front habilita envio de comentario con esa mediaUrl.
6. Front llama sendMessage con JSON.
7. Backend valida reglas de sala y guarda ChatMessage.

---

## Diagramas de secuencia por endpoint (estilo ASCII)

### 1) Join room: POST /api/chat/{roomType}/join

```
Usuario
  │
  │ entra al chat / cambia de sala
  ▼
GeneralChatComponent
  │ joinRoom(roomType, usuarioId)
  ▼
ChatApiService
  │ POST /api/chat/{roomType}/join?usuarioId=...
  ▼
ChatController
  │ joinRoom(...)
  ▼
ChatServiceImpl
  │ findByRoomTypeAndUsuarioId
  │ countByRoomTypeAndActiveIsTrue
  │ save(presence activa)
  ▼
ChatJoinResponseDTO (activeUsers/maxUsers)
  │
  └──> UI actualiza capacidad de sala
```

### 2) Upload media: POST /api/chat/media/upload

```
Usuario selecciona archivo
  │
  ▼
ChatComposeBoxComponent
  │ valida MIME y tamano (max 4.5 MB)
  │ uploadMedia(file)
  ▼
ChatApiService
  │ POST /api/chat/media/upload (multipart/form-data)
  ▼
ChatController
  │ uploadMedia(file)
  ▼
ChatServiceImpl
  │ valida archivo (max 5 MB)
  │ resuelve tipo + extension
  │ guarda en uploads/chat-media/UUID.ext
  ▼
ChatMediaUploadResponseDTO
  │ mediaUrl corta
  └──> UI habilita envio del comentario
```

### 3) Send message: POST /api/chat/mensajes

```
Usuario (click enviar)
  │
  ▼
ChatComposeBoxComponent
  │ valida reglas locales (500 palabras, score en JUEGOS)
  │ emite payload
  ▼
GeneralChatComponent
  │ arma ChatMessageRequest
  │ sendMessage(request)
  ▼
ChatApiService
  │ POST /api/chat/mensajes
  ▼
ChatController
  │ sendMessage(dto)
  ▼
ChatServiceImpl
  │ valida presencia en sala
  │ valida comentario y mediaUrl
  │ save(ChatMessage)
  ▼
ChatMessageResponseDTO
  │
  └──> GeneralChatComponent refresca listMessages()
```

### 4) List messages: GET /api/chat/{roomType}/mensajes

```
GeneralChatComponent
  │ listMessages(roomType, limit)
  ▼
ChatApiService
  │ GET /api/chat/{roomType}/mensajes?limit=60
  ▼
ChatController
  │ listMessages(...)
  ▼
ChatServiceImpl
  │ findTop100ByRoomTypeOrderByCreatedAtDesc
  │ ordena + aplica limite seguro
  ▼
Lista de ChatMessageResponseDTO
  │
  └──> UI renderiza historial
```

### 5) Load media file: GET /api/chat/media/{fileName}

```
Navegador (img src)
  │ GET /api/chat/media/{fileName}
  ▼
ChatController
  │ loadMedia(fileName)
  ▼
ChatServiceImpl
  │ normaliza path
  │ busca archivo en uploads/chat-media
  ├─ si existe -> devuelve Resource + content-type
  └─ si no existe -> 404 Not Found
```

### 6) Leave room: POST /api/chat/{roomType}/leave

```
Usuario sale del chat / cambia de sala
  │
  ▼
GeneralChatComponent
  │ leaveRoom(roomType, usuarioId)
  ▼
ChatApiService
  │ POST /api/chat/{roomType}/leave?usuarioId=...
  ▼
ChatController
  │ leaveRoom(...)
  ▼
ChatServiceImpl
  │ findByRoomTypeAndUsuarioId
  │ save(presence inactive)
  │ countByRoomTypeAndActiveIsTrue
  ▼
ChatJoinResponseDTO (joined=false)
```

### 7) Score options: GET /api/chat/juegos/puntuaciones/{usuarioId}

```
GeneralChatComponent (al entrar a JUEGOS)
  │ listScoreOptions(usuarioId)
  ▼
ChatApiService
  │ GET /api/chat/juegos/puntuaciones/{usuarioId}
  ▼
ChatController
  │ listScoreOptions(usuarioId)
  ▼
ChatServiceImpl
  │ findTop100ByUsuarioIdOrderByFechaPartidaDesc
  │ mapea a ChatScoreOptionDTO
  ▼
Lista de ChatScoreOptionDTO
  │
  └──> UI llena el select de puntuaciones
```

---

## Validaciones activas

Frontend (compose):

- tipos permitidos: image/png, image/jpeg, image/jpg, image/webp, image/gif
- limite de tamano: 4.5 MB
- bloqueo de boton mientras uploadingMedia=true
- maximo 500 palabras
- en JUEGOS requiere selectedScoreId

Backend (chat):

- MAX_USERS_PER_ROOM = 10
- MAX_WORDS_PER_MESSAGE = 500
- MAX_MEDIA_BYTES upload = 5,000,000
- ChatMessageRequestDTO.mediaUrl max 2000 caracteres
- validacion de extension/tipo para imagen y gif

---

## Errores esperados

Mensajes de negocio mas comunes:

- Debes seleccionar una imagen
- La imagen es demasiado grande
- Solo se permite subir imagen normal o GIF
- Debes unirte a la sala antes de enviar mensajes
- En la sala JUEGOS debes seleccionar una puntuacion jugada
- El comentario excede 500 palabras

Formato general de errores:

```json
{
  "timestamp": "2026-04-17T19:02:38.004+02:00",
  "status": 400,
  "mensaje": "La imagen es demasiado grande"
}
```

Para errores de validacion DTO:

```json
{
  "timestamp": "2026-04-17T19:02:38.004+02:00",
  "status": 400,
  "errores": {
    "mediaUrl": "La URL de media es demasiado larga"
  }
}
```

---

## Ubicacion de archivos clave

Backend:

- Backend/api/src/main/java/com/gizmolandia/api/controller/ChatController.java
- Backend/api/src/main/java/com/gizmolandia/api/service/impl/ChatServiceImpl.java
- Backend/api/src/main/java/com/gizmolandia/api/dto/ChatMessageRequestDTO.java
- Backend/api/src/main/java/com/gizmolandia/api/dto/ChatMediaUploadResponseDTO.java

Frontend:

- Fronted/lobby/src/app/components/chat/general-chat/general-chat.ts
- Fronted/lobby/src/app/components/chat/widgets/chat-compose-box/chat-compose-box.ts
- Fronted/lobby/src/app/services/chat-api.service.ts
- Fronted/lobby/src/app/services/api.models.ts

---

## Checklist de pruebas manuales

1. Entrar a sala NORMAL y enviar texto sin media.
2. Subir PNG menor a 4.5 MB y enviar comentario.
3. Subir GIF menor a 4.5 MB y enviar comentario.
4. Intentar subir archivo no imagen y validar error.
5. Intentar enviar mientras la imagen se esta subiendo.
6. En sala JUEGOS, intentar enviar sin puntuacion y validar bloqueo.
7. Recargar pantalla y confirmar que mediaUrl renderiza correctamente desde /api/chat/media/{fileName}.

---

## Operacion y mantenimiento

- Limpieza de archivos: uploads/chat-media puede crecer con el tiempo.
- Si se despliega en contenedor, montar volumen persistente para uploads/chat-media.
- Si se migra a almacenamiento cloud, mantener contrato: upload retorna mediaUrl corta reutilizable por sendMessage.
