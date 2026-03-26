# 📚 Guía General de Gizmolandia

## 📋 Índice

- [Visión General](#visión-general)
- [Stack Tecnológico](#stack-tecnológico)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Flujo de Datos](#flujo-de-datos)
- [Cómo Ejecutar el Proyecto](#cómo-ejecutar-el-proyecto)
- [Conceptos Clave](#conceptos-clave)

---

## 🎯 Visión General

**Gizmolandia** es una plataforma de lobby para juegos online con características de:

- ✅ **Sistema de Autenticación**: Login de usuarios
- ✅ **Gestión de Perfiles**: Personalización de avatares, colores y temas
- ✅ **Múltiples Juegos**: Tetris, Snake, Brick Breaker, Ping Pong
- ✅ **Sistema de Ranking**: Puntuaciones globales por juego
- ✅ **Multijugador en Tiempo Real**: Ping Pong con WebSocket

La aplicación está dividida en dos capas principales:

- **Frontend**: Angular (TypeScript) - Interfaz visual
- **Backend**: Spring Boot (Java) - Lógica de negocio, API REST, WebSocket

---

## 🛠️ Stack Tecnológico

### Frontend

```
├── Framework: Angular 17+
├── Lenguaje: TypeScript
├── Estilos: CSS3
├── HTTP: HttpClient + RxJS
├── i18n: ngx-translate
├── Routing: Angular Router
└── WebSocket: RxJS WebSocket
```

### Backend

```
├── Framework: Spring Boot 4.0.5
├── Java: OpenJDK 21
├── ORM: Spring Data JPA + Hibernate
├── Base de Datos: MySQL 8.0+
├── Build: Maven
├── WebSocket: Spring WebSocket + Stomp
├── Validación: Jakarta Validation (JSR-303)
└── Seguridad: Spring Security + BCrypt
```

### Base de Datos

```
├── Motor: MySQL 8.0+
├── Gestión: Docker
├── Contenedor BD: `db` en localhost:3306
└── Usuario: root / root
```

---

## 📁 Estructura del Proyecto

```
Gizmolandia/
│
├── Backend/
│   └── api/                          # Aplicación Spring Boot
│       ├── src/main/java/com/gizmolandia/api/
│       │   ├── controller/           # Endpoints REST
│       │   ├── service/              # Lógica de negocio
│       │   ├── repository/           # Acceso a BD
│       │   ├── model/                # Entidades JPA
│       │   ├── dto/                  # Objetos de transferencia
│       │   ├── exception/            # Manejo de errores
│       │   ├── config/               # Configuración (Security, WebSocket, CORS)
│       │   └── realtime/             # Lógica de WebSocket para juegos
│       ├── pom.xml                   # Dependencias Maven
│       └── application.properties    # Configuración del servidor
│
├── Fronted/                          # Frontend Angular
│   └── lobby/
│       ├── src/
│       │   ├── app/
│       │   │   ├── components/       # Componentes Angular
│       │   │   ├── services/         # Servicios HTTP y lógica
│       │   │   ├── app.routes.ts     # Rutas principales
│       │   │   └── app.ts            # Componente raíz
│       │   ├── assets/               # Imágenes, audios, etc.
│       │   └── styles/               # Estilos globales
│       ├── angular.json              # Configuración Angular
│       ├── package.json              # Dependencias NPM
│       └── tsconfig.json             # Configuración TypeScript
│
└── documentacion/                    # Documentación del proyecto
    ├── 00-guia-general.md           # Este archivo
    ├── 01-arquitectura-angular-spring.md
    ├── 02-api-rest-endpoints.md
    └── 03-estructura-spring-boot.md
```

---

## 🔄 Flujo de Datos

### 1. Flujo de Autenticación

```
┌─────────────────┐
│  Angular App    │
│  (Navegador)    │
└────────┬────────┘
         │
         │ POST /api/auth/login
         │ { usuario, contraseña }
         │
         ▼
┌──────────────────────┐
│  Spring Boot Backend │
│  AuthController      │
└────────┬─────────────┘
         │
         │ AuthService.login()
         │
         ▼
┌──────────────────────┐
│  UsuarioRepository   │
│  (Base de Datos)     │
└────────┬─────────────┘
         │
         │ Usuario encontrado
         │ Contraseña validada
         │
         ▼
┌──────────────────────┐
│  UsuarioResponseDTO  │
│ { id, nombre, datos} │
└────────┬─────────────┘
         │
         │ Response 200 OK
         │
         ▼
┌─────────────────┐
│  Guardar datos  │
│  sessionStorage │
└─────────────────┘
```

### 2. Flujo de Juego Multijugador (Ping Pong)

```
┌──────────────┐              ┌──────────────┐
│  Jugador 1   │              │  Jugador 2   │
│  (Angular)   │              │  (Angular)   │
└──────┬───────┘              └───────┬──────┘
       │                              │
       │  ws://localhost:8080/ws/     │
       │  ping-pong?player=John       │
       │                              │
       └──────────────┬───────────────┘
                      │
                      ▼
          ┌─────────────────────────┐
          │  Spring WebSocket       │
          │  Handler                │
          └────────┬────────────────┘
                   │
                   │ Matchmaking
                   │
                   ▼
          ┌─────────────────────────┐
          │  PingPongRealtimeService│
          │  Sala (Room State)       │
          └────────┬────────────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
         ▼                   ▼
      PREVIEW              PLAYING
   (Confirmar)          (Juego en vivo)
         │                   │
         └─────────┬─────────┘
                   │
                   ▼
              FINISHED
           (Ver rematch)
```

### 3. Actualización de Puntuaciones

```
Jugador termina partida
        │
        ▼
POST /api/puntuaciones
        │
        ▼
PuntuacionController
        │
        ▼
PuntuacionService.guardar()
        │
        ▼
PuntuacionRepository
        │
        ▼
BD: tabla `puntuacion`
        │
        ▼
Response 201 Created
```

---


## 📌 Conceptos Clave

### DTO (Data Transfer Object)

Clases que representan los datos que se intercambian entre frontend y backend. Separan la estructura de la API del modelo interno.

**Ejemplo:**

```
LoginRequestDTO: { usuario, contraseña }
UsuarioResponseDTO: { id, usuario, email, fotoPerfil, ... }
```

### Entity (Modelo)

Clases que representan las tablas en la base de datos. Anotadas con `@Entity` de JPA.

**Ejemplo:**

```java
@Entity
public class Usuario {
  @Id private Long id;
  private String usuario;
  private String email;
  // ...
}
```

### Service

Capa intermedia que contiene la lógica de negocio. Los controllers delegan en los services.

**Patrón:**

```
Controller (recibe solicitud)
   ↓
Service (procesa lógica)
   ↓
Repository (accede a BD)
   ↓
Response al cliente
```

### WebSocket

Conexión bidireccional en tiempo real. Utilizada para juegos multijugador.

**Ventajas:**

- Comunicación en ambas direcciones
- Baja latencia
- Ideal para juegos y actualizaciones en tiempo real

### CORS (Cross-Origin Resource Sharing)

Configuración que permite al frontend en `localhost:4200` comunicarse con el backend en `localhost:8080`.

---

## 📖 Documentos Relacionados

1. **[Arquitectura Angular-Spring](01-arquitectura-angular-spring.md)** - Detalles de cómo se comunican
2. **[API REST Endpoints](02-api-rest-endpoints.md)** - Todas las rutas disponibles
3. **[Estructura Spring Boot](03-estructura-spring-boot.md)** - Detalle de cada paquete

---

## ⚙️ Configuración Importante

### Backend (application.properties)

```properties
# Puerto del servidor
server.port=8080

# Base de datos MySQL
spring.datasource.url=jdbc:mysql://localhost:3306/db
spring.datasource.username=root
spring.datasource.password=root

# Información de BD en consola
spring.jpa.show-sql=true
```

### Frontend (environment)

```typescript
// src/environments/environment.ts
export const environment = {
  apiUrl: 'http://localhost:8080/api',
  production: false
};
```

---

## 🐛 Troubleshooting

| Problema                            | Solución                                                                   |
| ----------------------------------- | --------------------------------------------------------------------------- |
| "Connection refused" en puerto 8080 | Spring Boot no está ejecutándose. Verifica:`.\mvnw.cmd spring-boot:run` |
| "CORS error"                        | Backend CORS mal configurado. Verifica SecurityConfig.java                  |
| "Cannot connect to database"        | MySQL no está corriendo. Inicia MySQL o Docker                             |
| "404 en API"                        | La ruta no existe. Verifica en documentos de API REST                       |
| "WebSocket error"                   | Firewall bloqueando puerto. Verifica configuración.                        |

---

**Última actualización**: Marzo 2026
**Versión**: 1.0
