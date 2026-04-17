# 05 - Optimizacion de chat incremental, avatar y INP

Fecha: 2026-04-17

## Objetivo

Reducir transferencia y mejorar respuesta visual del chat:

- Cargar historial una vez.
- Consultar solo mensajes nuevos.
- Mantener fotos de perfil visibles sin enviar base64 gigante en cada respuesta.
- Reducir trabajo de render para mejorar INP.

## Cambios backend

### 1) Mensajes incrementales por afterId

Endpoint:

- GET /api/chat/{roomType}/mensajes?limit=60&afterId={ultimoId}

Comportamiento:

- Sin afterId: devuelve historial (hasta limite).
- Con afterId: devuelve solo mensajes con id mayor al indicado.

Archivos:

- Backend/api/src/main/java/com/gizmolandia/api/controller/ChatController.java
- Backend/api/src/main/java/com/gizmolandia/api/service/ChatService.java
- Backend/api/src/main/java/com/gizmolandia/api/service/impl/ChatServiceImpl.java
- Backend/api/src/main/java/com/gizmolandia/api/repository/ChatMessageRepository.java

### 2) Avatar liviano para chat

Nuevo endpoint:

- GET /api/chat/avatars/{usuarioId}

Comportamiento:

- Si la foto del usuario esta guardada como data:image base64, el endpoint la decodifica y la sirve como bytes con content type correcto.
- Cache-Control publico de larga duracion para reducir recargas.

Archivos:

- Backend/api/src/main/java/com/gizmolandia/api/controller/ChatController.java
- Backend/api/src/main/java/com/gizmolandia/api/service/ChatService.java
- Backend/api/src/main/java/com/gizmolandia/api/service/impl/ChatServiceImpl.java
- Backend/api/src/main/java/com/gizmolandia/api/dto/ChatAvatarContentDTO.java

### 3) Foto en mensajes de chat

En el DTO de mensajes:

- Si fotoUsuario es data:image y supera el limite interno, se reemplaza por URL de avatar:
  /api/chat/avatars/{usuarioId}
- Resultado: la imagen se sigue viendo, pero el payload de mensajes no arrastra base64 enorme.

## Cambios frontend

### 1) Polling incremental

- Carga inicial: listMessages(room, 60)
- Refresco: listMessages(room, 60, latestMessageId)
- Insercion: append solo mensajes nuevos.

Archivo:

- Fronted/lobby/src/app/components/chat/general-chat/general-chat.ts

### 2) Menos costo de render

- Se evita trabajo extra en actualizaciones de chat.
- Se optimiza el append de mensajes para evitar ordenamientos completos cada refresco.

Archivo:

- Fronted/lobby/src/app/components/chat/general-chat/general-chat.ts

### 3) Imagenes con pistas de decodificacion

- Avatar y media con loading lazy y decoding async.
- Avatar con width y height para estabilizar dibujo.

Archivo:

- Fronted/lobby/src/app/components/chat/widgets/chat-message-list/chat-message-list.html

## Impacto esperado

- Menos trafico de red por polling.
- Menor trabajo de pintura y render.
- Mejora de INP en escenarios de chat activo.
- Fotos de perfil visibles sin penalizar tamaño de respuesta.

## Verificacion hecha

1. Abrir 2 sesiones de usuario en la misma sala.
2. Confirmar carga inicial de historial una sola vez.
3. Enviar mensajes desde la sesion B y validar que la sesion A solo descarga nuevos.
4. Comprobar que foto de perfil aparece en mensajes.
5. Repetir medicion local de rendimiento (INP) en mismo flujo de uso.
