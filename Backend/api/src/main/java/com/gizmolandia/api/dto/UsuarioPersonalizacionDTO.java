package com.gizmolandia.api.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioPersonalizacionDTO {

    @Size(max = 20, message = "El color de fondo no puede superar 20 caracteres")
    private String backgroundColor;

    private String leftImage;

    private String rightImage;

    @Size(max = 80, message = "El estado no puede superar 80 caracteres")
    private String userStatus;

    @Size(max = 20, message = "El color del nombre no puede superar 20 caracteres")
    private String nameColor;

    @Pattern(regexp = "^(es|en)$", message = "Idioma no soportado")
    private String language;

    private String profileImage;
}
