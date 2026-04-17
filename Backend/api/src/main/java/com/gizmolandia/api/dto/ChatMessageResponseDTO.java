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
public class ChatMessageResponseDTO {

    private Long id;
    private String roomType;
    private Long usuarioId;
    private String nombreUsuario;
    private String userProfile;
    private String fotoUsuario;
    private String commentText;
    private Integer wordCount;
    private String mediaUrl;
    private String mediaType;
    private Long puntuacionId;
    private String scoreGame;
    private Integer scoreValue;
    private LocalDateTime createdAt;
}
