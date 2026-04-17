package com.gizmolandia.api.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.gizmolandia.api.model.Puntuacion;

@Repository
public interface PuntuacionRepository extends JpaRepository<Puntuacion, Long> {

    List<Puntuacion> findByUsuarioId(Long usuarioId);

    List<Puntuacion> findByJuego(String juego);

    List<Puntuacion> findByUsuarioIdAndJuego(Long usuarioId, String juego);

    Optional<Puntuacion> findByIdAndUsuarioId(Long id, Long usuarioId);

    List<Puntuacion> findTop100ByUsuarioIdOrderByFechaPartidaDesc(Long usuarioId);

    @Query("SELECT p FROM Puntuacion p WHERE p.juego = :juego ORDER BY p.puntuacion DESC")
    List<Puntuacion> findTopByJuego(String juego);

    @Query("""
            SELECT p.usuario.id, p.usuario.nombre, p.usuario.foto, COUNT(p.id)
            FROM Puntuacion p
            WHERE p.juego = 'PING_PONG'
            GROUP BY p.usuario.id, p.usuario.nombre, p.usuario.foto
            ORDER BY COUNT(p.id) DESC
            """)
    List<Object[]> findPingPongWinsRanking();
}
