package com.gizmolandia.api.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.gizmolandia.api.model.Usuario;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByNombre(String nombre);
    Optional<Usuario> findByUserProfile(String userProfile);
    boolean existsByNombre(String nombre);
    boolean existsByUserProfile(String userProfile);
}
