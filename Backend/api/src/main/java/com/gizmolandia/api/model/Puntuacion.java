package com.gizmolandia.api.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "puntuaciones")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Puntuacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @NotBlank
    @Column(nullable = false, length = 30)
    private String juego; // TETRIS, SNAKE, BRICK_BREAKER

    @NotNull
    @Min(0)
    @Column(nullable = false)
    private Integer puntuacion;

    @Column(name = "fecha_partida", updatable = false)
    private LocalDateTime fechaPartida;

    @PrePersist
    protected void onCreate() {
        fechaPartida = LocalDateTime.now();
    }
}
