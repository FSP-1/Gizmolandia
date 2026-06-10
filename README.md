# Gizmolandia

Gizmolandia es una app de lobby para jugadores hecha con Angular, Spring Boot y MySQL. Incluye registro/login, personalizacion de perfil, juegos con puntuaciones, chat general con salas y subida de imagen/GIF, y un playground de coding para probar templates visuales de HTML + CSS y JavaScript.

## Que tiene

- Frontend Angular con rutas para home, perfil, juegos, chat y coding.
- Backend Spring Boot con API REST para usuarios, autenticacion, puntuaciones y chat.
- Juegos arcade como Snake, Tetris, Brick Breaker y Ping Pong, incluyendo modo en tiempo real para Ping Pong.
- Chat por salas con mensajes, presencia, puntuaciones compartidas y media upload.
- Perfiles publicos de otros usuarios accesibles desde chat y rankings.
- Playground de codigo con previews aislados en iframe sandbox.
- Internacionalizacion en espanol e ingles.

## Documentacion

La documentacion completa esta en [Documentacion/README.md](Documentacion/README.md). Ahi se explica la arquitectura, endpoints, backend, chat, rendimiento y el playground de coding.

## Stack

- Frontend: Angular
- Backend: Spring Boot
- Base de datos: MySQL
- Tiempo real: WebSocket
