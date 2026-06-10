package com.gizmolandia.api.controller;

import com.gizmolandia.api.dto.UsuarioPersonalizacionDTO;
import com.gizmolandia.api.dto.UsuarioRequestDTO;
import com.gizmolandia.api.dto.UsuarioResponseDTO;
import com.gizmolandia.api.service.UsuarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService usuarioService;

    // POST /api/usuarios  → registrar usuario
    @PostMapping
    public ResponseEntity<UsuarioResponseDTO> crear(@Valid @RequestBody UsuarioRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(usuarioService.crear(dto));
    }

    // GET /api/usuarios  → listar todos
    @GetMapping
    public ResponseEntity<List<UsuarioResponseDTO>> listarTodos() {
        return ResponseEntity.ok(usuarioService.listarTodos());
    }

    // GET /api/usuarios/{id}  → buscar por id
    @GetMapping("/{id}")
    public ResponseEntity<UsuarioResponseDTO> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(usuarioService.buscarPorId(id));
    }

    // GET /api/usuarios/perfil-publico/{userProfile} → home publico de un usuario
    @GetMapping("/perfil-publico/{userProfile}")
    public ResponseEntity<UsuarioResponseDTO> buscarPerfilPublico(@PathVariable String userProfile) {
        return ResponseEntity.ok(usuarioService.buscarPerfilPublico(userProfile));
    }

    // GET /api/usuarios/perfil/{userProfile}  → buscar por perfil
    @GetMapping("/perfil/{userProfile}")
    public ResponseEntity<UsuarioResponseDTO> buscarPorPerfil(@PathVariable String userProfile) {
        return ResponseEntity.ok(usuarioService.buscarPorPerfil(userProfile));
    }

    // PUT /api/usuarios/{id}  → actualizar usuario
    @PutMapping("/{id}")
    public ResponseEntity<UsuarioResponseDTO> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody UsuarioRequestDTO dto) {
        return ResponseEntity.ok(usuarioService.actualizar(id, dto));
    }

    @PatchMapping("/{id}/personalizacion")
    public ResponseEntity<UsuarioResponseDTO> actualizarPersonalizacion(
            @PathVariable Long id,
            @Valid @RequestBody UsuarioPersonalizacionDTO dto) {
        return ResponseEntity.ok(usuarioService.actualizarPersonalizacion(id, dto));
    }

    // DELETE /api/usuarios/{id}  → eliminar usuario
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        usuarioService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
