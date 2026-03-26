package com.gizmolandia.api.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.gizmolandia.api.dto.PuntuacionRequestDTO;
import com.gizmolandia.api.dto.PuntuacionResponseDTO;
import com.gizmolandia.api.service.PuntuacionService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/puntuaciones")
@RequiredArgsConstructor
public class PuntuacionController {

    private final PuntuacionService puntuacionService;

    // POST /api/puntuaciones  → guardar puntuación al final de una partida
    @PostMapping
    public ResponseEntity<PuntuacionResponseDTO> guardar(@Valid @RequestBody PuntuacionRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(puntuacionService.guardar(dto));
    }

    // GET /api/puntuaciones/usuario/{usuarioId}  → historial de un jugador
    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<List<PuntuacionResponseDTO>> listarPorUsuario(@PathVariable Long usuarioId) {
        return ResponseEntity.ok(puntuacionService.listarPorUsuario(usuarioId));
    }

    // GET /api/puntuaciones/ranking/{juego}  → ranking global de un juego
    // juego: TETRIS | SNAKE | BRICK_BREAKER | PING_PONG
    @GetMapping("/ranking/{juego}")
    public ResponseEntity<List<PuntuacionResponseDTO>> rankingPorJuego(@PathVariable String juego) {
        return ResponseEntity.ok(puntuacionService.rankingPorJuego(juego));
    }
}
