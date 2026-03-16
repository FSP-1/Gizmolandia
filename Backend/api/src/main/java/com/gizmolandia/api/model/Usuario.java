package com.gizmolandia.api.model;

import java.time.LocalDateTime;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "usuarios")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 100)
    @Column(nullable = false, length = 100, unique = true)
    private String nombre;

    @NotBlank
    @Size(max = 50)
    @Column(name = "user_profile", nullable = false, length = 50, unique = true)
    private String userProfile;

    @NotBlank
    @Size(min = 2, max = 5)
    @Column(nullable = false, length = 5)
    private String nacionalidad;

    @NotNull
    @Min(1)
    @Max(120)
    @Column(nullable = false)
    private Integer edad;

    @Column(columnDefinition = "MEDIUMTEXT")
    private String foto;

    @NotBlank
    @Size(min = 8, max = 100)
    @Column(nullable = false, length = 100)
    private String password;

    @Column(name = "fecha_registro", updatable = false)
    private LocalDateTime fechaRegistro;

    @OneToMany(mappedBy = "usuario", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Puntuacion> puntuaciones;

    @PrePersist
    protected void onCreate() {
        fechaRegistro = LocalDateTime.now();
    }
}
