# 🏗️ Estructura de Spring Boot - Gizmolandia

## 📋 Índice
- [Visión General](#visión-general)
- [Convenciones de Paquetes](#convenciones-de-paquetes)
- [Flujo de una Solicitud](#flujo-de-una-solicitud)
- [Capas de la Aplicación](#capas-de-la-aplicación)
- [Patrones de Diseño](#patrones-de-diseño)
- [Configuración](#configuración)
- [Ejemplo Completo](#ejemplo-completo)

---

## 🎯 Visión General

La estructura de Spring Boot sigue la arquitectura **MVC (Model-View-Controller)** adaptada a una API REST.

```
Backend/api/
├── src/main/java/com/gizmolandia/api/
│   ├── ApiApplication.java          # Punto de entrada
│   ├── controller/                  # API Endpoints (REST)
│   ├── service/                     # Lógica de negocio
│   ├── repository/                  # Acceso a datos (JPA)
│   ├── model/                       # Entidades JPA
│   ├── dto/                         # Objetos de transferencia
│   ├── exception/                   # Manejo de excepciones
│   ├── config/                      # Configuración
│   └── realtime/                    # WebSocket y tiempo real
│
└── src/main/resources/
    ├── application.properties       # Configuración del servidor
    └── application-*.properties     # Configs específicas por ambiente
```

---

## 📦 Convenciones de Paquetes

### Tabla de Responsabilidades

| Paquete | Responsabilidad | Ejemplos |
|---------|-----------------|----------|
| **controller** | Recibir solicitudes HTTP, validar parámetros | `AuthController`, `UsuarioController` |
| **service** | Lógica de negocio, orquestación | `AuthService`, `UsuarioServiceImpl` |
| **repository** | Acceso a datos, queries SQL | `UsuarioRepository`, `PuntuacionRepository` |
| **model** | Entidades JPA mapeadas a tablas BD | `Usuario`, `Puntuacion`, `Sala` |
| **dto** | Transferencia de datos entre capas | `UsuarioRequestDTO`, `UsuarioResponseDTO` |
| **exception** | Excepciones personalizadas, handlers | `GlobalExceptionHandler`, `ResourceNotFoundException` |
| **config** | Configuración de Spring (Security, WebSocket, CORS) | `SecurityConfig`, `WebSocketConfig` |
| **realtime** | Lógica de WebSocket y juegos tiempo real | `PingPongRealtimeService`, `PingPongWebSocketHandler` |

---

## 🔄 Flujo de una Solicitud

### Ejemplo: POST /api/usuarios (Crear Usuario)

```
┌─────────────────────────────────────────────────────────┐
│ 1. REQUEST HTTP ENTRA AL SERVIDOR                       │
│                                                          │
│ POST http://localhost:8080/api/usuarios                 │
│ Content: { "usuario": "john", "email": "john@ex.com" }  │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ 2. DISPATCHER SERVLET (Spring)                          │
│                                                          │
│ Spring identifica que la ruta es /api/usuarios          │
│ Método: POST                                             │
│ Busca el @RequestMapping("/api/usuarios")               │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ 3. ENTRA EN CONTROLLER                                  │
│                                                          │
│ @RestController                                         │
│ @RequestMapping("/api/usuarios")                        │
│ public class UsuarioController {                        │
│                                                          │
│   @PostMapping                                          │
│   public ResponseEntity<UsuarioResponseDTO> crear(     │
│     @Valid @RequestBody UsuarioRequestDTO dto) {       │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ 4. VALIDACIÓN AUTOMÁTICA (@Valid)                       │
│                                                          │
│ Spring valida que el JSON tenga los campos requeridos   │
│ Si hay error: retorna 400 Bad Request                   │
│ Si es válido: continúa                                  │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ 5. DESERIALIZACIÓN JSON → DTO                           │
│                                                          │
│ Jackson convierte JSON a UsuarioRequestDTO              │
│ {                                                        │
│   "usuario": "john",                                    │
│   "email": "john@example.com",                          │
│   "contraseña": "hash_encriptado"                       │
│ }                                                        │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ 6. LLAMA SERVICIO (SERVICE)                             │
│                                                          │
│ usuarioService.crear(dto)                               │
│                                                          │
│ El Service contiene la LÓGICA DE NEGOCIO:              │
│ • Validar que usuario no exista                         │
│ • Encriptar contraseña                                  │
│ • Guardar en BD                                         │
│ • Retornar DTO de respuesta                             │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
    ┌────────────────────────────────────┐
    │ DENTRO DEL SERVICE:                │
    │                                    │
    │ UsuarioServiceImpl {               │
    │   + usuarioRepository: JPA         │
    │   + passwordEncoder: BCrypt        │
    │                                    │
    │   public UsuarioResponseDTO crear( │
    │       UsuarioRequestDTO dto) {     │
    │                                    │
    │     // 1. Validar                  │
    │     if (existe(dto.usuario)) {     │
    │       throw new Exception(...);    │
    │     }                              │
    │                                    │
    │     // 2. Crear Entity             │
    │     Usuario usuario = new Usuario( │
    │       usuario: dto.usuario,        │
    │       email: dto.email,            │
    │       ...,                         │
    │       contraseña: encriptar(...)   │
    │     );                             │
    │                                    │
    │     // 3. Guardar en Repository    │
    │     usuarioRepository.save(        │
    │         usuario                    │
    │     );                             │
    │                                    │
    │     // 4. Convertir Entity → DTO   │
    │     return toDTO(usuario);         │
    │   }                                │
    │ }                                  │
    └────────────────┬───────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ 7. REPOSITORY ACCEDE A LA BASE DE DATOS                 │
│                                                          │
│ usuarioRepository.save(usuario)                         │
│                                                          │
│ • Spring Data JPA genera el SQL automáticamente         │
│ • Ejecuta: INSERT INTO usuario (usuario, email, ...) .. │
│ • Retorna el Usuario guardado con ID generado          │
│ • Usa JDBC/Hibernate para conectar con MySQL           │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ 8. SERVICE RETORNA DTO                                  │
│                                                          │
│ UsuarioResponseDTO {                                    │
│   id: 1,                                                │
│   usuario: "john",                                      │
│   email: "john@example.com",                            │
│   fotoPerfil: "default.png",                            │
│   ...                                                   │
│ }                                                        │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ 9. CONTROLLER RETORNA ResponseEntity                    │
│                                                          │
│ return ResponseEntity                                   │
│   .status(HttpStatus.CREATED)                           │
│   .body(dto);                                           │
│                                                          │
│ Status: 201 Created                                     │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ 10. SERIALIZACIÓN DTO → JSON                            │
│                                                          │
│ Jackson convierte UsuarioResponseDTO a JSON:            │
│ {                                                        │
│   "id": 1,                                              │
│   "usuario": "john",                                    │
│   "email": "john@example.com",                          │
│   "fotoPerfil": "default.png",                          │
│   ...                                                   │
│ }                                                        │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ 11. RESPONSE HTTP AL CLIENTE                            │
│                                                          │
│ HTTP/1.1 201 Created                                    │
│ Content-Type: application/json                          │
│ Access-Control-Allow-Origin: http://localhost:4200      │
│                                                          │
│ { "id": 1, "usuario": "john", ... }                     │
└──────────────────────────────────────────────────────────┘
```

---

## 🎯 Capas de la Aplicación

### 1. CONTROLLER (Presentación)

```java
@RestController               // Define como REST endpoint
@RequestMapping("/api/usuarios")  // Ruta base
@RequiredArgsConstructor      // Inyección de dependencias
public class UsuarioController {

  private final UsuarioService usuarioService;  // Inyección automática

  @PostMapping               // POST /api/usuarios
  public ResponseEntity<UsuarioResponseDTO> crear(
      @Valid                 // Validación automática
      @RequestBody          // Lee del body JSON
      UsuarioRequestDTO dto) {
    
    return ResponseEntity
      .status(HttpStatus.CREATED)
      .body(usuarioService.crear(dto));
  }

  @GetMapping("/{id}")       // GET /api/usuarios/{id}
  public ResponseEntity<UsuarioResponseDTO> buscarPorId(
      @PathVariable Long id) {  // Lee de la URL
    return ResponseEntity.ok(usuarioService.buscarPorId(id));
  }

  @PutMapping("/{id}")       // PUT /api/usuarios/{id}
  public ResponseEntity<UsuarioResponseDTO> actualizar(
      @PathVariable Long id,
      @Valid @RequestBody UsuarioRequestDTO dto) {
    return ResponseEntity.ok(usuarioService.actualizar(id, dto));
  }

  @DeleteMapping("/{id}")    // DELETE /api/usuarios/{id}
  public ResponseEntity<Void> eliminar(@PathVariable Long id) {
    usuarioService.eliminar(id);
    return ResponseEntity.noContent().build();
  }
}
```

**Anotaciones Comunes**:
- `@RestController`: Define como REST endpoint
- `@RequestMapping`: Mapea ruta base
- `@PostMapping`, `@GetMapping`, `@PutMapping`, `@DeleteMapping`: Mapean métodos HTTP
- `@PathVariable`: Parámetro en la URL
- `@RequestBody`: Parámetro en el body
- `@Valid`: Validación automática

### 2. SERVICE (Lógica de Negocio)

```java
public interface UsuarioService {
  UsuarioResponseDTO crear(UsuarioRequestDTO dto);
  UsuarioResponseDTO buscarPorId(Long id);
  UsuarioResponseDTO actualizar(Long id, UsuarioRequestDTO dto);
  void eliminar(Long id);
}
```

```java
@Service                      // Define como servicio
@RequiredArgsConstructor      // Inyección de dependencias
@Transactional(readOnly = true)  // Por defecto solo lectura
public class UsuarioServiceImpl implements UsuarioService {

  private final UsuarioRepository usuarioRepository;
  private final PasswordEncoder passwordEncoder;

  @Override
  @Transactional              // Permite escritura (transacción)
  public UsuarioResponseDTO crear(UsuarioRequestDTO dto) {
    
    // VALIDACIÓN
    if (usuarioRepository.existsByUsuario(dto.getUsuario())) {
      throw new IllegalArgumentException("Usuario ya existe");
    }

    // CREAR ENTITY
    Usuario usuario = new Usuario();
    usuario.setUsuario(dto.getUsuario());
    usuario.setEmail(dto.getEmail());
    usuario.setContraseña(
      passwordEncoder.encode(dto.getContraseña())  // Encriptar
    );
    usuario.setFotoPerfil("default.png");
    usuario.setColorPrimario("#0066FF");
    usuario.setColorSecundario("#00FF99");
    usuario.setTemaNoche(false);

    // GUARDAR EN BD
    Usuario usuarioGuardado = usuarioRepository.save(usuario);

    // CONVERTIR A DTO Y RETORNAR
    return toResponseDTO(usuarioGuardado);
  }

  @Override
  public UsuarioResponseDTO buscarPorId(Long id) {
    Usuario usuario = usuarioRepository.findById(id)
      .orElseThrow(() -> 
        new ResourceNotFoundException("Usuario no encontrado"));
    return toResponseDTO(usuario);
  }

  // Método helper para conversión Entity → DTO
  private UsuarioResponseDTO toResponseDTO(Usuario usuario) {
    return new UsuarioResponseDTO(
      usuario.getId(),
      usuario.getUsuario(),
      usuario.getEmail(),
      usuario.getFotoPerfil(),
      usuario.getColorPrimario(),
      usuario.getColorSecundario(),
      usuario.isTemaNoche()
    );
  }
}
```

**Patrones**:
- Un Service por entidad (UsuarioService, PuntuacionService, etc.)
- Service decida qué datos necesita del Repository
- Service contiene la lógica de negocio
- Service nunca retorna Entity, siempre DTO

### 3. REPOSITORY (Acceso a Datos)

```java
@Repository                    // Define como repositorio
public interface UsuarioRepository 
  extends JpaRepository<Usuario, Long> {
  
  // Queries automáticas generadas por Spring Data JPA
  
  Optional<Usuario> findByUsuario(String usuario);
  Optional<Usuario> findByEmail(String email);
  
  // Query custom cuando es necesario
  @Query("SELECT u FROM Usuario u WHERE u.usuario = :usuario")
  Optional<Usuario> buscarPorUsuarioCustom(@Param("usuario") String usuario);
  
  boolean existsByUsuario(String usuario);
  List<Usuario> findAll();
  Optional<Usuario> findById(Long id);
  Usuario save(Usuario usuario);
  void deleteById(Long id);
}
```

**JpaRepository proporciona automáticamente**:
- `save()` - Guardar
- `findById()` - Buscar por ID
- `findAll()` - Listar todos
- `deleteById()` - Eliminar

**Spring Data genera SQL automáticamente basado en el nombre del método**.

### 4. MODEL (Entidades JPA)

```java
@Entity                      // Mapea a tabla de BD
@Table(name = "usuario")     // Nombre de tabla
@Getter @Setter              // Lombok: genera getters/setters
@NoArgsConstructor           // Constructor sin parámetros
@AllArgsConstructor          // Constructor con todos los parámetros
public class Usuario {

  @Id                        // Clave primaria
  @GeneratedValue(strategy = GenerationType.IDENTITY)  // Autoincrementar
  private Long id;

  @Column(unique = true, nullable = false)  // Restricciones en BD
  private String usuario;

  @Column(unique = true, nullable = false)
  private String email;

  @Column(nullable = false)
  private String contraseña;

  private String fotoPerfil;
  private String colorPrimario;
  private String colorSecundario;
  private boolean temaNoche;

  @CreationTimestamp        // Automáticamente llena con fecha actual
  private LocalDateTime fechaCreacion;

  @UpdateTimestamp          // Automáticamente actualiza
  private LocalDateTime fechaActualizacion;
}
```

**Anotaciones Comunes**:
- `@Entity`: Define como entidad
- `@Table`: Nombre de tabla en BD
- `@Id`: Clave primaria
- `@GeneratedValue`: Auto-generación de ID
- `@Column`: Configuración de columna
- `@CreationTimestamp` / `@UpdateTimestamp`: Timestamps automáticos

---

## 5. DTO (Data Transfer Object)

```java
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioRequestDTO {
  @NotBlank(message = "El usuario es obligatorio")
  private String usuario;

  @NotBlank(message = "El email es obligatorio")
  @Email(message = "El email debe ser válido")
  private String email;

  @NotBlank(message = "La contraseña es obligatoria")
  @Size(min = 6, message = "La contraseña debe tener al menos 6 caracteres")
  private String contraseña;
}
```

```java
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioResponseDTO {
  private Long id;
  private String usuario;
  private String email;
  private String fotoPerfil;
  private String colorPrimario;
  private String colorSecundario;
  private boolean temaNoche;
}
```

**Validaciones Comunes**:
- `@NotBlank`: No puede estar vacío
- `@NotNull`: No puede ser null
- `@Email`: Debe ser email válido
- `@Size(min, max)`: Rango de tamaño
- `@Pattern`: Validación con regex

---

## 6. EXCEPTION (Manejo de Errores)

```java
// Excepción personalizada
public class ResourceNotFoundException extends RuntimeException {
  public ResourceNotFoundException(String message) {
    super(message);
  }
}
```

```java
@RestControllerAdvice           // Manejador global de excepciones
public class GlobalExceptionHandler {

  @ExceptionHandler(ResourceNotFoundException.class)
  public ResponseEntity<Map<String, Object>> handleNotFound(
      ResourceNotFoundException ex) {
    
    Map<String, Object> body = new HashMap<>();
    body.put("timestamp", LocalDateTime.now());
    body.put("status", HttpStatus.NOT_FOUND.value());
    body.put("mensaje", ex.getMessage());
    
    return ResponseEntity
      .status(HttpStatus.NOT_FOUND)
      .body(body);
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<Map<String, Object>> handleValidation(
      MethodArgumentNotValidException ex) {
    
    Map<String, String> fieldErrors = new HashMap<>();
    ex.getBindingResult().getAllErrors().forEach(error -> {
      String field = ((FieldError) error).getField();
      fieldErrors.put(field, error.getDefaultMessage());
    });

    Map<String, Object> body = new HashMap<>();
    body.put("timestamp", LocalDateTime.now());
    body.put("status", HttpStatus.BAD_REQUEST.value());
    body.put("errores", fieldErrors);
    
    return ResponseEntity.badRequest().body(body);
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<Map<String, Object>> handleGeneral(
      Exception ex) {
    return buildError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      "Error interno del servidor"
    );
  }

  private ResponseEntity<Map<String, Object>> buildError(
      HttpStatus status, String message) {
    Map<String, Object> body = new HashMap<>();
    body.put("timestamp", LocalDateTime.now());
    body.put("status", status.value());
    body.put("mensaje", message);
    return ResponseEntity.status(status).body(body);
  }
}
```

---

## ⚙️ CONFIGURACIÓN (Config)

### SecurityConfig
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

  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();  // Encriptación de contraseñas
  }
}
```

### WebSocketConfig
```java
@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

  @Override
  public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
    registry.addHandler(pingPongWebSocketHandler(), "/ws/ping-pong")
            .setAllowedOrigins("*");
  }

  @Bean
  public PingPongWebSocketHandler pingPongWebSocketHandler() {
    return new PingPongWebSocketHandler();
  }
}
```

---

## 📊 EJEMPLO COMPLETO

### Escenario: Crear y guardar una puntuación

**1. Controller recibe solicitud**
```java
@PostMapping
public ResponseEntity<PuntuacionResponseDTO> guardar(
    @Valid @RequestBody PuntuacionRequestDTO dto) {
  return ResponseEntity
    .status(HttpStatus.CREATED)
    .body(puntuacionService.guardar(dto));
}
```

**2. Service ejecuta lógica**
```java
@Override
@Transactional
public PuntuacionResponseDTO guardar(PuntuacionRequestDTO dto) {
  // Validar usuario existe
  Usuario usuario = usuarioRepository.findById(dto.getUsuarioId())
    .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
  
  // Validar juego válido
  Juego juego = Juego.valueOf(dto.getJuego());  // TETRIS, SNAKE, etc.
  
  // Crear entidad
  Puntuacion puntuacion = new Puntuacion();
  puntuacion.setUsuario(usuario);
  puntuacion.setJuego(juego);
  puntuacion.setPuntos(dto.getPuntos());
  puntuacion.setTiempoJuego(dto.getTiempoJuego());
  puntuacion.setResultado(dto.getResultado());
  puntuacion.setOponente(dto.getOponente());
  
  // Guardar en BD
  Puntuacion guardada = puntuacionRepository.save(puntuacion);
  
  // Retornar DTO
  return toDTO(guardada);
}
```

**3. Repository guarda en BD**
```java
// Spring Data JPA genera automáticamente:
// INSERT INTO puntuacion (usuario_id, juego, puntos, ...) VALUES (...)
puntuacionRepository.save(puntuacion);
```

---

## 🎓 Resumen de Responsabilidades

```
CLIENTE (Angular)
    ↓ HTTP Request
CONTROLLER
    ↓ Delega: DTO → Validación
SERVICE
    ↓ Ejecuta lógica + Orquesta
REPOSITORY
    ↓ Accede a datos
DATABASE
    ↓ Persiste información
REPOSITORY
    ↓ Retorna Entity
SERVICE
    ↓ Convierte Entity → DTO
CONTROLLER
    ↓ Serializa DTO → JSON
CLIENTE (Angular)
    ↓ Response HTTP
```

---

**Última actualización**: Marzo 2026  
**Versión**: 1.0
