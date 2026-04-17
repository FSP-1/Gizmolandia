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
public class ChatScoreOptionDTO {

    private Long puntuacionId;
    private String juego;
    private Integer puntuacion;
    private LocalDateTime fechaPartida;
}
