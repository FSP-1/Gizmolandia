package com.gizmolandia.api.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioRequestDTO {

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 100, message = "El nombre no puede superar los 100 caracteres")
    private String nombre;

    @NotBlank(message = "El perfil de usuario es obligatorio")
    @Size(max = 50, message = "El perfil no puede superar los 50 caracteres")
    private String userProfile;

    @NotBlank(message = "La nacionalidad es obligatoria")
    @Size(min = 2, max = 5, message = "La nacionalidad debe tener entre 2 y 5 caracteres")
    private String nacionalidad;

    @NotNull(message = "La edad es obligatoria")
    @Min(value = 1, message = "La edad mínima es 1")
    @Max(value = 120, message = "La edad máxima es 120")
    private Integer edad;

    private String foto;

    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 8, max = 50, message = "La contraseña debe tener entre 8 y 50 caracteres")
    @Pattern(
            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,50}$",
            message = "La contraseña debe incluir mayúscula, minúscula, número y símbolo"
    )
    private String password;
}
