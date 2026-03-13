# Gizmolandia

Proyecto de lobby con juegos y personalizacion de perfil.

Stack actual:

- Frontend: Angular (en progreso)
- Backend: Spring Boot (en progreso)
- Base de datos: MySQL (con Docker)

## Backend Spring Boot

Se preparara una API REST con arquitectura MVC para CRUD de entidades.

Estructura recomendada de paquetes:

- `controller`
- `service`
- `repository`
- `model` o `entity`
- `dto` (opcional)
- `config`

Dependencias base recomendadas:

- Spring Web
- Spring Data JPA
- MySQL Driver
- Validation
- Lombok
- Spring Boot DevTools

Notas:

- Spring Boot gestionara la creacion de tablas inicialmente via JPA/Hibernate.
- MySQL correra en Docker en la siguiente fase.
