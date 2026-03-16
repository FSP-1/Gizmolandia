package com.gizmolandia.api.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PuntuacionResponseDTO {
    private Long id;
    private Long usuarioId;
    private String nombreUsuario;
    private String juego;
    private Integer puntuacion;
    private LocalDateTime fechaPartida;
}
