package com.gizmolandia.api.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PuntuacionRequestDTO {

    @NotNull(message = "El ID de usuario es obligatorio")
    private Long usuarioId;

    @NotBlank(message = "El juego es obligatorio")
    @Pattern(regexp = "TETRIS|SNAKE|BRICK_BREAKER|PING_PONG", message = "Juego no valido. Use: TETRIS, SNAKE, BRICK_BREAKER o PING_PONG")
    private String juego;

    @NotNull(message = "La puntuación es obligatoria")
    @Min(value = 0, message = "La puntuación no puede ser negativa")
    private Integer puntuacion;
}
