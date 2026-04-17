package com.gizmolandia.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessageRequestDTO {

    @NotNull(message = "El usuario es obligatorio")
    private Long usuarioId;

    @NotBlank(message = "La sala es obligatoria")
    private String roomType;

    @NotBlank(message = "El comentario es obligatorio")
    @Size(max = 6000, message = "El comentario excede el tamaño permitido")
    private String commentText;

    @Size(max = 6000000, message = "La media es demasiado grande")
    private String mediaUrl;

    private Long puntuacionId;
}
