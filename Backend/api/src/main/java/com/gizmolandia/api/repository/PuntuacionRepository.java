package com.gizmolandia.api.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.gizmolandia.api.model.Puntuacion;

@Repository
public interface PuntuacionRepository extends JpaRepository<Puntuacion, Long> {
    List<Puntuacion> findByUsuarioId(Long usuarioId);
    List<Puntuacion> findByJuego(String juego);
    List<Puntuacion> findByUsuarioIdAndJuego(Long usuarioId, String juego);

    @Query("SELECT p FROM Puntuacion p WHERE p.juego = :juego ORDER BY p.puntuacion DESC")
    List<Puntuacion> findTopByJuego(String juego);
}
