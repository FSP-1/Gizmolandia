# 📚 Documentación de Gizmolandia

Bienvenido a la documentación completa del proyecto **Gizmolandia**, una plataforma de lobby para juegos online.

## 📖 Documentos Disponibles

### 1. [00 - Guía General](00-guia-general.md) 📋
**Punto de partida recomendado para nuevos desarrolladores**

Aquí encontrarás:
- ✅ Visión general del proyecto
- ✅ Stack tecnológico (Angular, Spring Boot, MySQL)
- ✅ Estructura de carpetas
- ✅ Flujo de datos general
- ✅ Cómo ejecutar el proyecto localmente
- ✅ Conceptos clave (DTO, Entity, Service, WebSocket, CORS)

**¿Cuándo leerlo?**  
Cuando acabas de descargar el proyecto y quieres entender qué es esto.

---

### 2. [01 - Arquitectura Angular-Spring](01-arquitectura-angular-spring.md) 🏗️
**Cómo se comunican Frontend y Backend**

Aquí encontrarás:
- ✅ Diagrama de arquitectura general
- ✅ Flujo completo de una solicitud HTTP
- ✅ Cómo funcionan los servicios HTTP en Angular
- ✅ Comunicación WebSocket para juegos multijugador
- ✅ Flujo de juego Ping Pong paso a paso
- ✅ Manejo de errores
- ✅ Configuración CORS y seguridad

**¿Cuándo leerlo?**  
Cuando quieres entender cómo se comunican Angular y Spring Boot, o cómo funcionan los juegos en tiempo real.

---

### 3. [02 - API REST Endpoints](02-api-rest-endpoints.md) 🔌
**Referencia práctica de todas las rutas y API**

Aquí encontrarás:
- ✅ Todas las rutas REST disponibles
- ✅ Métodos HTTP (GET, POST, PUT, PATCH, DELETE)
- ✅ Parámetros y validaciones
- ✅ Ejemplos de Request/Response
- ✅ Mensajes WebSocket
- ✅ Ejemplos cURL para probar
- ✅ Códigos de estado HTTP

**¿Cuándo leerlo?**  
Cuando necesitas hacer una llamada a la API o quieres saber qué endpoints existen. Es tu referencia técnica.

---

### 4. [03 - Estructura Spring Boot](03-estructura-spring-boot.md) 🏗️
**Cómo está organizado el backend**

Aquí encontrarás:
- ✅ Convención de paquetes (controller, service, repository, etc.)
- ✅ Responsabilidades de cada capa
- ✅ Flujo detallado de una solicitud HTTP
- ✅ Ejemplos de código reales
- ✅ Patrones de diseño
- ✅ Configuración (Security, WebSocket)
- ✅ Ejemplo completo paso a paso

**¿Cuándo leerlo?**  
Cuando necesitas entender la estructura interna de Spring Boot, o cuando vas a agregar nuevas funcionalidades al backend.

---

### 5. [04 - Chat General y Media Upload](04-chat-general-media-upload.md) 💬
**Documentacion completa del chat con subida de imagen/GIF separada**

Aqui encontraras:
- ✅ Flujo nuevo: upload multipart + envio de comentario con URL corta
- ✅ Endpoints de chat actualizados
- ✅ Validaciones frontend y backend
- ✅ Errores esperados y troubleshooting
- ✅ Checklist de pruebas manuales

**¿Cuándo leerlo?**  
Cuando trabajas en el chat, en la subida de imagenes o en incidencias de mediaUrl.

---

### 6. [05 - Optimizacion Chat Incremental e INP](05-optimizacion-chat-incremental-inp.md) ⚡
**Resumen de mejoras de rendimiento en chat y avatar**

Aqui encontraras:
- ✅ Polling incremental por afterId
- ✅ Endpoint de avatar liviano para evitar base64 gigante en cada mensaje
- ✅ Ajustes frontend para reducir trabajo de render y mejorar INP
- ✅ Checklist de validacion post-cambios

**¿Cuándo leerlo?**
Cuando estes midiendo rendimiento del chat o revisando transferencias y tiempos de interaccion.

---

## 🎯 Guía Rápida por Escenario

### "Acabo de descargar el proyecto, ¿por dónde empiezo?"
1. Lee: [00 - Guía General](00-guia-general.md)
2. Ejecuta: Las instrucciones en "Cómo Ejecutar el Proyecto"
3. Verifica: Accede a http://localhost:4200

### "Quiero entender cómo se comunican Angular y Spring"
→ Lee: [01 - Arquitectura Angular-Spring](01-arquitectura-angular-spring.md)

### "Necesito llamar a una API diferente"
→ Lee: [02 - API REST Endpoints](02-api-rest-endpoints.md)

### "Voy a agregar un nuevo endpoint en Spring Boot"
→ Lee: [03 - Estructura Spring Boot](03-estructura-spring-boot.md)

### "Quiero entender cómo funcionan los juegos multijugador"
→ Lee: [01 - Arquitectura Angular-Spring](01-arquitectura-angular-spring.md) sección "WebSocket"

### "Necesito debuggear un error"
→ Lee: [02 - API REST Endpoints](02-api-rest-endpoints.md) sección "Códigos de Estado"

### "Quiero entender el flujo nuevo de chat con imagen"
→ Lee: [04 - Chat General y Media Upload](04-chat-general-media-upload.md)

---

## 📊 Flujo General del Proyecto

```
┌─────────────────────────────────────────────────────────────┐
│                   USUARIO EN NAVEGADOR                       │
└────────────────┬────────────────────────┬───────────────────┘
                 │                        │
          ┌──────▼──────┐         ┌───────▼────────┐
          │   ANGULAR   │         │   WEBSOCKET    │
          │   (4200)    │         │   (WS)         │
          └──────┬──────┘         └────────┬───────┘
                 │                        │
                 │ HTTP REST              │ Real-time
                 │                        │
          ┌──────▼────────────────────────▼───────┐
          │        SPRING BOOT (8080)              │
          │      REST Controllers + WebSocket      │
          └──────┬────────────────────────┬────────┘
                 │                        │
                 │ JPA/Hibernate          │
                 │                        │
          ┌──────▼──────────────────────▼────────┐
          │         MySQL DATABASE                 │
          │     (usuarios, puntuaciones, etc)     │
          └────────────────────────────────────────┘
```

---

## 🚀 Requisitos del Sistema

- **Node.js**: 18+ (para Angular)
- **Java**: 21+ (para Spring Boot)
- **Maven**: 3.8+ (incluido en el proyecto: `mvnw.cmd`)
- **MySQL**: 8.0+ (o Docker)

---

## ⚙️ Configuración Rápida

### Backend
```bash
cd Gizmolandia/Backend/api
.\mvnw.cmd spring-boot:run
# Escucha en http://localhost:8080
```

### Frontend
```bash
cd Gizmolandia/Fronted/lobby
npm install
ng serve
# Accede en http://localhost:4200
```

---

## 🆘 Troubleshooting

| Problema | Documentación |
|----------|--------------|
| "Connection refused" en port 8080 | [Guía General](00-guia-general.md#troubleshooting) |
| CORS error | [Arquitectura](01-arquitectura-angular-spring.md#seguridad-cors) |
| API error 404 | [API Endpoints](02-api-rest-endpoints.md) |
| Error en Spring Boot | [Estructura Spring](03-estructura-spring-boot.md#exception-manejo-de-errores) |

---

## 📝 Notación Usada

En toda la documentación encontrarás estos símbolos:

- 📋 = Información general
- 🎯 = Objetivo o propósito
- 🔐 = Seguridad
- 🌐 = HTTP / Web
- 🔌 = API / Endpoints
- 🏗️ = Arquitectura
- 💻 = Código
- ⚠️ = Advertencia importante
- ✅ = Completado
- 🐛 = Debugging

---

## 🎓 Glosario Rápido

| Término | Significado |
|---------|------------|
| **DTO** | Data Transfer Object - Objeto para transferir datos |
| **Entity** | Clase mapeada a tabla en BD |
| **Repository** | Capa que accede a la BD |
| **Service** | Capa con lógica de negocio |
| **Controller** | Capa que recibe solicitudes HTTP |
| **WebSocket** | Conexión bidireccional en tiempo real |
| **CORS** | Cross-Origin Resource Sharing - permite comunicacion entre servidores |
| **JWT** | JSON Web Token - autenticación segura |

---

## 🔗 Enlaces Útiles

- **Angular Docs**: https://angular.io/docs
- **Spring Boot Docs**: https://spring.io/projects/spring-boot
- **JPA Docs**: https://spring.io/projects/spring-data-jpa
- **MySQL Docs**: https://dev.mysql.com/doc/

---

## 📞 Contacto y Soporte

Si tienes dudas sobre la documentación:

1. ✅ Revisa la sección "Guía Rápida por Escenario"
2. ✅ Busca en el glosario
3. ✅ Consulta la documentación específica
4. ✅ Revisa los ejemplos de código

---

**Última actualización**: Marzo 2026  
**Versión**: 1.0  
**Autor**: Documentación de Gizmolandia

---

## 📚 Índice de Documentos

```
documentacion/
├── README.md                              (← You are here)
├── 00-guia-general.md                     ⭐ Comienza aquí
├── 01-arquitectura-angular-spring.md      🏗️ Cómo se comunican
├── 02-api-rest-endpoints.md               🔌 Referencia de APIs
├── 03-estructura-spring-boot.md           📦 Estructura interna
└── 04-chat-general-media-upload.md         💬 Chat y media
```
