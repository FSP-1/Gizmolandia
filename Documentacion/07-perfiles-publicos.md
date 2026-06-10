# 07 - Perfiles Publicos

## Objetivo

Permitir abrir el home publico de otros usuarios desde zonas sociales de la app, como chat y rankings, sin mostrar acciones privadas del usuario visitado.

## Flujo

1. El usuario hace clic en la foto, placeholder o nombre de otro usuario.
2. El frontend navega a `/home/profile/{userProfile}`.
3. `PublicProfileComponent` comprueba que hay sesion activa y que el perfil no es el propio.
4. El frontend llama a `GET /api/usuarios/perfil-publico/{userProfile}`.
5. La vista reutiliza `HomeComponent` en modo `publicView`.

## Comportamiento de la vista

El perfil publico muestra:

- Foto de perfil o placeholder.
- Nombre visible.
- Nacionalidad.
- Estado del home.
- Color de fondo.
- Imagen lateral izquierda.
- Imagen lateral derecha.

No muestra:

- Personalizar.
- Juegos.
- Coding.
- Chat.
- Music Creation.
- Log out.

Solo aparece el boton `Atras`.

## Entrada desde la app

Actualmente se puede abrir desde:

- Chat general: autor de cada mensaje ajeno.
- Leaderboards de juegos: fila de jugador ajeno.

Si el usuario clicado es el mismo que la sesion actual, no se navega al perfil publico.

La ruta publica no acepta IDs numericos puros, por lo que no se pueden recorrer perfiles manualmente con URLs como `/home/profile/1`, `/home/profile/2`, etc.

## Backend

Endpoint:

```http
GET /api/usuarios/perfil-publico/{userProfile}
```

Devuelve `UsuarioResponseDTO` con los campos necesarios para renderizar el home publico. No devuelve password.

## Frontend

Archivos principales:

- `src/app/components/public-profile/public-profile.ts`
- `src/app/components/home/home.ts`
- `src/app/components/chat/widgets/chat-message-list/*`
- `src/app/components/games/game-leaderboard/*`
- `src/app/services/usuario-api.service.ts`

La ruta se registra como:

```ts
home/profile/:userProfile
```
