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
public class UsuarioResponseDTO {
    private Long id;
    private String nombre;
    private String userProfile;
    private String nacionalidad;
    private Integer edad;
    private String foto;
    private String homeBackgroundColor;
    private String homeLeftImage;
    private String homeRightImage;
    private String homeStatus;
    private String homeNameColor;
    private String preferredLanguage;
    private LocalDateTime fechaRegistro;
}
